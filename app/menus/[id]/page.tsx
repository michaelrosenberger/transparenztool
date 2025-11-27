"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useParams } from "next/navigation";
import Link from "next/link";
import Card from "@/app/components/Card";
import Container from "@/app/components/Container";
import PageSkeleton from "@/app/components/PageSkeleton";
import { Badge } from "@/components/ui/badge";
import { ExternalLink } from "lucide-react";

interface Meal {
  id: string;
  name: string;
  description: string;
  vegetables: Array<{
    vegetable: string;
    farmer_name: string;
  }>;
}

interface MealMenu {
  id: string;
  menu_date: string;
  title: string;
  subtitle: string | null;
  meal_ids: string[];
  created_at: string;
}

export default function PublicMenuDetailPage() {
  const [loading, setLoading] = useState(true);
  const [menu, setMenu] = useState<MealMenu | null>(null);
  const [meals, setMeals] = useState<Meal[]>([]);
  
  const params = useParams();
  const menuId = params.id as string;

  useEffect(() => {
    const loadMenuData = async () => {
      try {
        const response = await fetch(`/api/menus/${menuId}`);
        
        if (!response.ok) {
          console.error("Error loading menu:", response.statusText);
          setLoading(false);
          return;
        }

        const { menu: menuData, meals: mealsData } = await response.json();
        
        setMenu(menuData);
        setMeals(mealsData || []);
        setLoading(false);
      } catch (error) {
        console.error("Error loading menu:", error);
        setLoading(false);
      }
    };

    loadMenuData();
  }, [menuId]);

  if (loading) {
    return <PageSkeleton />;
  }

  if (!menu) {
    return (
      <Container>
        <Card>
          <div className="text-center py-8">
            <p className="mb-4">Menü nicht gefunden</p>
          </div>
        </Card>
      </Container>
    );
  }

  const formattedDate = new Date(menu.menu_date).toLocaleDateString("de-DE", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <>
      <Container dark fullWidth>
        <div className="flex items-center justify-between mb-6 max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <div>
            <h1>{menu.title} {formattedDate}</h1>
            {menu.subtitle && <p className="mt-2">{menu.subtitle}</p>}
          </div>
        </div>
      </Container>

      <Container asPage>
        {meals.length === 0 ? (
          <Card>
            <p className="text-center py-8 text-muted-foreground">
              Keine Mahlzeiten in diesem Menü.
            </p>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
            {meals.map((meal) => (
              <Link
                key={meal.id}
                href={`/meal/${meal.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block no-underline"
              >
                <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xl font-medium">{meal.name}</h3>
                    <ExternalLink className="h-5 w-5 flex-shrink-0 ml-2" />
                  </div>
                  
                  {meal.description && (
                    <p className="text-sm text-muted-foreground mb-4">
                      {meal.description}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {meal.vegetables?.slice(0, 4).map((veg, idx) => (
                      <Badge key={idx} variant="default" className="text-sm">
                        {veg.vegetable}
                      </Badge>
                    ))}
                    {meal.vegetables?.length > 4 && (
                      <Badge variant="default" className="text-sm">
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
