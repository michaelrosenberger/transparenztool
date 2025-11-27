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
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Trash2, Edit, ArrowLeft, Plus, Star } from "lucide-react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Meal {
  id: string;
  name: string;
  description: string;
  storage_address: string;
  vegetables: Array<{
    vegetable: string;
    farmer_name: string;
  }>;
  is_today: boolean;
  created_at: string;
}

export default function AllMealsPage() {
  const [loading, setLoading] = useState(true);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [deleteMealId, setDeleteMealId] = useState<string | null>(null);
  const [settingTodayMeal, setSettingTodayMeal] = useState<string | null>(null);
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

        await loadMeals();
        setLoading(false);
      } catch (error) {
        console.error('Error in checkUserAndLoadData:', error);
        router.push("/");
      }
    };

    checkUserAndLoadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadMeals = async (forceRefresh = false) => {
    try {
      const url = forceRefresh ? "/api/admin/meals?refresh=true" : "/api/admin/meals";
      const response = await fetch(url);

      if (!response.ok) {
        console.error("Error loading meals:", response.statusText);
        return;
      }

      const { meals } = await response.json();
      setMeals(meals || []);
    } catch (error) {
      console.error("Error loading meals:", error);
    }
  };

  const handleDeleteMeal = async () => {
    if (!deleteMealId) return;

    try {
      const { error } = await supabase
        .from("meals")
        .delete()
        .eq("id", deleteMealId);

      if (error) throw error;

      setMessage({ type: "success", text: "Mahlzeit erfolgreich gelöscht!" });
      await loadMeals(true);
    } catch (error: any) {
      console.error("Error deleting meal:", error);
      setMessage({ type: "error", text: error.message || "Fehler beim Löschen der Mahlzeit" });
    } finally {
      setDeleteMealId(null);
    }
  };

  const setTodayMeal = async (mealId: string, currentStatus: boolean) => {
    setSettingTodayMeal(mealId);

    try {
      // If already today's meal, unset it
      if (currentStatus) {
        const { error } = await supabase
          .from("meals")
          .update({ is_today: false })
          .eq("id", mealId);

        if (error) throw error;

        setMessage({ type: "success", text: "Tagesmahlzeit entfernt!" });
      } else {
        // Set as today's meal
        const response = await fetch('/api/admin/meals/today', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ meal_id: mealId }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
          throw new Error(errorData.error || "Fehler beim Setzen der Tagesmahlzeit");
        }

        setMessage({ type: "success", text: "Tagesmahlzeit erfolgreich gesetzt!" });
      }

      await loadMeals(true);
    } catch (error: any) {
      console.error("Error setting today meal:", error);
      setMessage({ type: "error", text: error.message || "Fehler beim Setzen der Tagesmahlzeit" });
    } finally {
      setSettingTodayMeal(null);
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
            <h1>Alle Mahlzeiten</h1>
            <p>Verwalten Sie alle erstellten Mahlzeiten</p>
          </div>
        </div>
      </Container>

      <Container asPage>
        <div className="flex gap-2 mb-4">
            <Link href="/admin/meals">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Neue Mahlzeit
              </Button>
            </Link>
          </div>
        <Card title={`Mahlzeiten (${meals.length})`}>
          {meals.length === 0 ? (
            <div>
              <p className="text-center py-8 text-muted-foreground">
                Keine Mahlzeiten vorhanden
              </p>
              <div className="flex justify-center mt-4">
                <Link href="/admin/meals">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Erste Mahlzeit erstellen
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Zutaten</TableHead>
                    <TableHead>Lageradresse</TableHead>
                    <TableHead>Tagesmahlzeit</TableHead>
                    <TableHead>Erstellt am</TableHead>
                    <TableHead className="text-right">Aktionen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {meals.map((meal) => (
                    <TableRow key={meal.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {meal.name}
                          {meal.is_today && (
                            <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {meal.vegetables?.slice(0, 3).map((veg, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {veg.vegetable}
                            </Badge>
                          ))}
                          {meal.vegetables?.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{meal.vegetables.length - 3}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{meal.storage_address}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            id={`today-${meal.id}`}
                            checked={meal.is_today}
                            onCheckedChange={() => setTodayMeal(meal.id, meal.is_today)}
                            disabled={settingTodayMeal === meal.id}
                          />
                          <Label htmlFor={`today-${meal.id}`} className="text-sm cursor-pointer">
                            {meal.is_today ? "Aktiv" : "Inaktiv"}
                          </Label>
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(meal.created_at).toLocaleDateString("de-DE")}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/admin/meals/${meal.id}`)}
                            title="Bearbeiten"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteMealId(meal.id)}
                            title="Löschen"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>
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
      <AlertDialog open={!!deleteMealId} onOpenChange={() => setDeleteMealId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mahlzeit löschen</AlertDialogTitle>
            <AlertDialogDescription>
              Möchten Sie diese Mahlzeit wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteMeal}>
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
