"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useParams } from "next/navigation";
import Card from "@/app/components/Card";
import Container from "@/app/components/Container";
import PageSkeleton from "@/app/components/PageSkeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Calendar, ExternalLink, QrCode, Download } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

interface MealMenu {
  id: string;
  menu_date: string;
  title: string;
  subtitle: string | null;
  meal_ids: string[];
  created_at: string;
}

interface Meal {
  id: string;
  name: string;
  description: string;
  storage_address: string;
  vegetables: Array<{
    vegetable: string;
    farmer_name: string;
  }>;
}

export default function MenuDetailPage() {
  const [loading, setLoading] = useState(true);
  const [menu, setMenu] = useState<MealMenu | null>(null);
  const [meals, setMeals] = useState<Meal[]>([]);

  const router = useRouter();
  const params = useParams();
  const supabase = useMemo(() => createClient(), []);
  const menuId = params.id as string;

  useEffect(() => {
    const checkUserAndLoadMenu = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          router.push("/login");
          return;
        }

        await loadMenu();
        setLoading(false);
      } catch (error) {
        console.error("Error loading menu:", error);
        setLoading(false);
      }
    };

    checkUserAndLoadMenu();
  }, [menuId, router, supabase]);

  const loadMenu = async () => {
    try {
      // Load menu
      const { data: menuData, error: menuError } = await supabase
        .from("meal_menus")
        .select("*")
        .eq("id", menuId)
        .single();

      if (menuError) throw menuError;
      setMenu(menuData);

      // Load meals
      if (menuData.meal_ids && menuData.meal_ids.length > 0) {
        const { data: mealsData, error: mealsError } = await supabase
          .from("meals")
          .select("*")
          .in("id", menuData.meal_ids);

        if (mealsError) throw mealsError;
        
        // Sort meals in the order of meal_ids
        const sortedMeals = menuData.meal_ids
          .map((id: string) => mealsData?.find((meal: Meal) => meal.id === id))
          .filter((meal: Meal | undefined): meal is Meal => meal !== undefined);
        
        setMeals(sortedMeals);
      }
    } catch (error: any) {
      console.error("Error loading menu:", error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("de-DE", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  };

  if (loading) {
    return <PageSkeleton />;
  }

  if (!menu) {
    return (
      <Container>
        <Card>
          <p>Menü nicht gefunden</p>
          <Button onClick={() => router.push("/admin")} className="mt-4">
            Zurück zum Dashboard
          </Button>
        </Card>
      </Container>
    );
  }

  return (
    <>
      <Container dark fullWidth>
        <div className="flex items-center justify-between mb-6 max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-5 w-5" />
              <p className="text-lg">{formatDate(menu.menu_date)}</p>
            </div>
            <h1>{menu.title}</h1>
            {menu.subtitle && <p className="text-lg mt-2">{menu.subtitle}</p>}
          </div>
        </div>
      </Container>

      <Container asPage>
        {menu && (
          <Card className="mb-6">
            <h3 className="mb-4 flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              QR-Code für dieses Menü
            </h3>
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="flex-shrink-0 bg-white">
                <QRCodeSVG 
                  value={`${typeof window !== 'undefined' ? window.location.origin : ''}/menus/${menuId}`}
                  size={256}
                  level="H"
                  includeMargin={true}
                />
              </div>
              <div className="flex flex-wrap">
                <p className="text-sm text-gray-600 mb-2">
                  Scannen Sie diesen QR-Code, um die öffentliche Detailseite dieses Menüs anzuzeigen.
                </p>
                <p className="text-sm font-mono bg-gray-50 p-2 rounded border border-gray-200 break-all">
                  {typeof window !== 'undefined' ? window.location.origin : ''}/menus/{menuId}
                </p>
                <div className="mt-4 flex gap-2 flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const svg = document.querySelector('svg');
                      if (!svg) return;
                      const svgData = new XMLSerializer().serializeToString(svg);
                      const canvas = document.createElement("canvas");
                      const ctx = canvas.getContext("2d");
                      const img = new Image();
                      img.onload = () => {
                        canvas.width = img.width;
                        canvas.height = img.height;
                        ctx?.drawImage(img, 0, 0);
                        const pngFile = canvas.toDataURL("image/png");
                        const downloadLink = document.createElement("a");
                        downloadLink.download = `menu-${menuId}-qr.png`;
                        downloadLink.href = pngFile;
                        downloadLink.click();
                      };
                      img.src = "data:image/svg+xml;base64," + btoa(svgData);
                    }}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    QR-Code herunterladen
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(`/menus/${menuId}`, "_blank")}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Vorschau öffnen
                  </Button>
                  <Button onClick={() => router.push(`/admin/menus/${menuId}/edit`)}>
                    Bearbeiten
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        )}

        {meals.length === 0 ? (
          <Card>
            <p className="text-center py-8 text-muted-foreground">
              Keine Mahlzeiten in diesem Menü
            </p>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
            {meals.map((meal, index) => (
              <Link
                key={meal.id}
                href={`/meal/${meal.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block no-underline"
              >
                <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">#{index + 1}</Badge>
                      <h3 className="text-xl font-medium">{meal.name}</h3>
                    </div>
                    <ExternalLink className="h-5 w-5  flex-shrink-0 ml-2" />
                  </div>
                  
                  {meal.description && (
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {meal.description}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {meal.vegetables?.slice(0, 4).map((veg, idx) => (
                      <Badge key={idx} variant="default" className="text-xs">
                        {veg.vegetable}
                      </Badge>
                    ))}
                    {meal.vegetables?.length > 4 && (
                      <Badge variant="default" className="text-xs">
                        +{meal.vegetables.length - 4} mehr
                      </Badge>
                    )}
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </Container>
    </>
  );
}
