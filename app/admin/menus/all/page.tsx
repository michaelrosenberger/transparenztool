"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { checkAdminAuth } from "@/lib/auth/checkAdminAuth";
import Container from "@/app/components/Container";
import Card from "@/app/components/Card";
import PageSkeleton from "@/app/components/PageSkeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Edit, Plus, Calendar, Star } from "lucide-react";
import Link from "next/link";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";

interface MealMenu {
  id: string;
  menu_date: string;
  title: string;
  subtitle: string | null;
  meal_ids: string[];
  is_today: boolean;
  created_at: string;
}

export default function AllMenusPage() {
  const [loading, setLoading] = useState(true);
  const [menus, setMenus] = useState<MealMenu[]>([]);
  const [deleteMenuId, setDeleteMenuId] = useState<string | null>(null);
  const [settingTodayMenu, setSettingTodayMenu] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const checkUserAndLoadData = async () => {
      try {
        const { user, isAdmin } = await checkAdminAuth();
        
        if (!user) {
          router.push("/login");
          return;
        }

        if (!isAdmin) {
          router.push("/");
          return;
        }

        await loadMenus();
        setLoading(false);
      } catch (error) {
        console.error('Error in checkUserAndLoadData:', error);
        router.push("/");
      }
    };

    checkUserAndLoadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadMenus = async (forceRefresh = false) => {
    try {
      const url = forceRefresh ? "/api/admin/menus?refresh=true" : "/api/admin/menus";
      const response = await fetch(url);

      if (!response.ok) {
        console.error("Error loading menus:", response.statusText);
        return;
      }

      const { menus } = await response.json();
      setMenus(menus || []);
    } catch (error) {
      console.error("Error loading menus:", error);
    }
  };

  const handleDeleteMenu = async () => {
    if (!deleteMenuId) return;

    try {
      const { error } = await supabase
        .from("meal_menus")
        .delete()
        .eq("id", deleteMenuId);

      if (error) throw error;

      setMessage({ type: "success", text: "Menü erfolgreich gelöscht!" });
      await loadMenus(true);
    } catch (error: any) {
      console.error("Error deleting menu:", error);
      setMessage({ type: "error", text: error.message || "Fehler beim Löschen des Menüs" });
    } finally {
      setDeleteMenuId(null);
    }
  };

  const setTodayMenu = async (menuId: string) => {
    setSettingTodayMenu(menuId);

    try {
      const response = await fetch('/api/admin/menus/today', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ menu_id: menuId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(errorData.error || "Fehler beim Setzen des Tagesmenüs");
      }

      setMessage({ type: "success", text: "Tagesmenü erfolgreich gesetzt!" });
      await loadMenus(true);
    } catch (error: any) {
      console.error("Error setting today menu:", error);
      setMessage({ type: "error", text: error.message || "Fehler beim Setzen des Tagesmenüs" });
    } finally {
      setSettingTodayMenu(null);
    }
  };

  if (loading) {
    return <PageSkeleton />;
  }

  return (
    <>
      <Container dark fullWidth>
        <div className="flex items-center justify-between mb-6 max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <div>
            <h1>Alle Menüs</h1>
            <p>Verwalten Sie alle erstellten Tagesmenüs</p>
          </div>
        </div>
      </Container>

      <Container asPage>
        <div className="flex gap-2 mb-4">
            <Link href="/admin/menus">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Neues Menü
              </Button>
            </Link>
          </div>

        {menus.length === 0 ? (
          <Card>
            <p className="text-center py-8 text-muted-foreground">
              Keine Menüs vorhanden
            </p>
            <div className="flex justify-center mt-4">
              <Link href="/admin/menus">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Erstes Menü erstellen
                </Button>
              </Link>
            </div>
          </Card>
        ) : (
          <div className="grid gap-6">
            {menus.map((menu) => (
              <Card key={menu.id} className="relative">
                {menu.is_today && (
                  <div className="absolute top-4 right-4">
                    <Badge variant="default" className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-current" />
                      Tagesmenü
                    </Badge>
                  </div>
                )}
                
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                      <p className="text-lg font-medium">
                        {new Date(menu.menu_date).toLocaleDateString("de-DE", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                    
                    <h3 className="text-xl mb-1">{menu.title}</h3>
                    
                    {menu.subtitle && (
                      <p className="text-sm text-muted-foreground mb-3">
                        {menu.subtitle}
                      </p>
                    )}
                    
                    <Badge variant="secondary">
                      {menu.meal_ids?.length || 0} Mahlzeit{menu.meal_ids?.length !== 1 ? "en" : ""}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant={menu.is_today ? "default" : "outline"}
                      size="sm"
                      onClick={() => !menu.is_today && setTodayMenu(menu.id)}
                      disabled={settingTodayMenu === menu.id || menu.is_today}
                    >
                      <Star className={`h-4 w-4 mr-2 ${menu.is_today ? "fill-current" : ""}`} />
                      {menu.is_today ? "Tagesmenü" : settingTodayMenu === menu.id ? "Setze..." : "Als Tagesmenü"}
                    </Button>
                    
                    <Link href={`/admin/menus/${menu.id}`}>
                      <Button variant="outline" size="sm">
                        Ansehen
                      </Button>
                    </Link>
                    
                    <Link href={`/admin/menus/${menu.id}/edit`}>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4 mr-2" />
                        Bearbeiten
                      </Button>
                    </Link>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeleteMenuId(menu.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Container>

      {/* Success/Error Message Dialog */}
      <AlertDialog open={!!message} onOpenChange={() => setMessage(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {message?.type === "success" ? "Erfolg" : "Fehler"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {message?.text}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setMessage(null)}>
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteMenuId} onOpenChange={() => setDeleteMenuId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Menü löschen</AlertDialogTitle>
            <AlertDialogDescription>
              Möchten Sie dieses Menü wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteMenu}>
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
