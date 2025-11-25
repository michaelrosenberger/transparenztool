"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Card from "@/app/components/Card";
import Container from "@/app/components/Container";
import PageSkeleton from "@/app/components/PageSkeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

interface Meal {
  id: string;
  name: string;
  description: string;
  storage_address: string;
  vegetables: Array<{
    vegetable: string;
    farmer_name: string;
  }>;
  created_at: string;
}

export default function CreateMenuPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [menuDate, setMenuDate] = useState<string>("");
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [selectedMealIds, setSelectedMealIds] = useState<string[]>([]);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [createdMenuId, setCreatedMenuId] = useState<string | null>(null);

  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    const checkUserAndLoadData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          router.push("/login");
          return;
        }

        // Check admin role
        const { data: roleData, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'admin')
          .maybeSingle();

        if (error || !roleData) {
          router.push("/");
          return;
        }

        setUser(user);
        await loadMeals();
        setLoading(false);
      } catch (error) {
        console.error("Error loading data:", error);
        setLoading(false);
      }
    };

    checkUserAndLoadData();
  }, [router, supabase]);

  const loadMeals = async () => {
    try {
      const { data, error } = await supabase
        .from("meals")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setMeals(data || []);
    } catch (error: any) {
      console.error("Error loading meals:", error);
    }
  };

  const toggleMealSelection = (mealId: string) => {
    setSelectedMealIds(prev => 
      prev.includes(mealId) 
        ? prev.filter(id => id !== mealId)
        : [...prev, mealId]
    );
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      setMessage({ type: "error", text: "Bitte geben Sie einen Titel ein" });
      return;
    }

    if (!menuDate) {
      setMessage({ type: "error", text: "Bitte wählen Sie ein Datum" });
      return;
    }

    if (selectedMealIds.length === 0) {
      setMessage({ type: "error", text: "Bitte wählen Sie mindestens eine Mahlzeit" });
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      const { data, error } = await supabase
        .from("meal_menus")
        .insert([{
          menu_date: menuDate,
          title: title.trim(),
          subtitle: subtitle.trim() || null,
          meal_ids: selectedMealIds,
          created_by: user.id,
        }])
        .select()
        .single();

      if (error) throw error;

      setCreatedMenuId(data.id);
      setMessage({ type: "success", text: "Menü erfolgreich erstellt!" });
    } catch (error: any) {
      console.error("Error creating menu:", error);
      setMessage({ type: "error", text: error.message || "Fehler beim Erstellen des Menüs" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDialogClose = () => {
    if (message?.type === "success" && createdMenuId) {
      router.push("/admin");
    }
    setMessage(null);
  };

  if (loading) {
    return <PageSkeleton />;
  }

  return (
    <>
      <Container dark fullWidth>
        <div className="flex items-center justify-between mb-6 max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <div>
            <h1>Neues Menü erstellen</h1>
            <p>Erstellen Sie ein Tagesmenü mit mehreren Mahlzeiten</p>
          </div>
        </div>
      </Container>

      <Container asPage>
        <Card>
        <div className="space-y-6">
          {/* Date Picker */}
          <div className="space-y-2">
            <Label htmlFor="menu-date">Datum *</Label>
            <Input
              id="menu-date"
              type="date"
              value={menuDate}
              onChange={(e) => setMenuDate(e.target.value)}
              className="w-full"
            />
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Titel *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="z.B. Wochenmenü, Tagesmenü"
            />
          </div>

          {/* Subtitle */}
          <div className="space-y-2">
            <Label htmlFor="subtitle">Untertitel (optional)</Label>
            <Textarea
              id="subtitle"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="z.B. Frische Herbstgerichte"
              rows={2}
            />
          </div>

          {/* Meal Selection */}
          <div className="space-y-2">
            <Label>Mahlzeiten auswählen *</Label>
            <div className="border border-grey-2 rounded-md p-4 max-h-96 overflow-y-auto space-y-3">
              {meals.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Keine Mahlzeiten verfügbar. Bitte erstellen Sie zuerst Mahlzeiten.
                </p>
              ) : (
                meals.map((meal) => (
                  <div key={meal.id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded cursor-pointer" onClick={() => toggleMealSelection(meal.id)}>
                    <input
                      type="checkbox"
                      id={meal.id}
                      checked={selectedMealIds.includes(meal.id)}
                      onChange={() => toggleMealSelection(meal.id)}
                      className="mt-1 h-4 w-4 rounded border-gray-300 cursor-pointer"
                      style={{ accentColor: '#000000' }}
                    />
                    <div className="flex-1">
                      <label
                        htmlFor={meal.id}
                        className="leading-none cursor-pointer"
                      >
                        {meal.name}
                      </label>
                      {meal.description && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {meal.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
            {selectedMealIds.length > 0 && (
              <p className="text-sm text-muted-foreground">
                {selectedMealIds.length} Mahlzeit{selectedMealIds.length !== 1 ? "en" : ""} ausgewählt
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4">
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1"
            >
              {submitting ? "Erstellt..." : "Menü erstellen"}
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push("/admin")}
              disabled={submitting}
            >
              Abbrechen
            </Button>
          </div>
        </div>
      </Card>
      </Container>

      {/* Success/Error Dialog */}
      <AlertDialog open={!!message} onOpenChange={handleDialogClose}>
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
            <AlertDialogAction onClick={handleDialogClose}>
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
