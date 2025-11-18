"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Card from "@/app/components/Card";
import Container from "@/app/components/Container";
import PageSkeleton from "@/app/components/PageSkeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import Link from "next/link";
import { Pencil, Plus, Trash2, Upload, Image as ImageIcon } from "lucide-react";

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

interface Ingredient {
  id: string;
  name: string;
  image_url: string | null;
  is_available: boolean;
  created_at: string;
}

export default function AdminPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [newIngredientName, setNewIngredientName] = useState("");
  const [uploadingImage, setUploadingImage] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [deleteMealId, setDeleteMealId] = useState<string | null>(null);
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push("/login");
        return;
      }

      const isAdmin = user.user_metadata?.is_admin;
      if (!isAdmin) {
        router.push("/");
        return;
      }

      setUser(user);
      await Promise.all([loadMeals(), loadIngredients()]);
      setLoading(false);
    };

    checkUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadMeals = async () => {
    try {
      const { data, error } = await supabase
        .from("meals")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error loading meals:", error);
        return;
      }

      setMeals(data || []);
    } catch (error) {
      console.error("Error loading meals:", error);
    }
  };

  const loadIngredients = async () => {
    try {
      const { data, error } = await supabase
        .from("ingredients")
        .select("*")
        .order("name", { ascending: true });

      if (error) {
        console.error("Error loading ingredients:", error);
        return;
      }

      setIngredients(data || []);
    } catch (error) {
      console.error("Error loading ingredients:", error);
    }
  };

  const addIngredient = async () => {
    if (!newIngredientName.trim()) {
      setMessage({ type: "error", text: "Bitte geben Sie einen Namen ein" });
      return;
    }

    // Check if ingredient already exists
    const existingIngredient = ingredients.find(
      ing => ing.name.toLowerCase() === newIngredientName.trim().toLowerCase()
    );
    
    if (existingIngredient) {
      setMessage({ type: "error", text: "Diese Zutat existiert bereits" });
      return;
    }

    try {
      const { data, error } = await supabase
        .from("ingredients")
        .insert([
          {
            name: newIngredientName.trim(),
            is_available: true,
            image_url: null
          }
        ])
        .select()
        .single();

      if (error) {
        // Check for unique constraint violation
        if (error.code === "23505") {
          setMessage({ type: "error", text: "Diese Zutat existiert bereits" });
        } else {
          setMessage({ type: "error", text: "Fehler beim Hinzufügen der Zutat" });
        }
        return;
      }

      setIngredients([data, ...ingredients]);
      setNewIngredientName("");
      setMessage({ type: "success", text: "Zutat erfolgreich hinzugefügt" });
    } catch (error) {
      setMessage({ type: "error", text: "Fehler beim Hinzufügen der Zutat" });
    }
  };

  const toggleIngredientAvailability = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("ingredients")
        .update({ is_available: !currentStatus })
        .eq("id", id);

      if (error) {
        console.error("Error updating ingredient:", error);
        setMessage({ type: "error", text: "Fehler beim Aktualisieren der Zutat" });
        return;
      }

      setIngredients(
        ingredients.map((ing) =>
          ing.id === id ? { ...ing, is_available: !currentStatus } : ing
        )
      );
    } catch (error) {
      console.error("Error updating ingredient:", error);
      setMessage({ type: "error", text: "Fehler beim Aktualisieren der Zutat" });
    }
  };

  const uploadIngredientImage = async (id: string, file: File) => {
    if (!file.type.match(/^image\/(png|svg\+xml)$/)) {
      setMessage({ type: "error", text: "Nur PNG und SVG Dateien sind erlaubt" });
      return;
    }

    setUploadingImage(id);

    try {
      // Upload to Supabase Storage
      const fileExt = file.name.split(".").pop();
      const fileName = `${id}.${fileExt}`;
      const filePath = `ingredients/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("ingredient-images")
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        console.error("Error uploading image:", uploadError);
        setMessage({ type: "error", text: "Fehler beim Hochladen des Bildes" });
        setUploadingImage(null);
        return;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("ingredient-images")
        .getPublicUrl(filePath);

      // Update ingredient with image URL
      const { error: updateError } = await supabase
        .from("ingredients")
        .update({ image_url: publicUrl })
        .eq("id", id);

      if (updateError) {
        console.error("Error updating ingredient:", updateError);
        setMessage({ type: "error", text: "Fehler beim Aktualisieren der Zutat" });
        setUploadingImage(null);
        return;
      }

      setIngredients(
        ingredients.map((ing) =>
          ing.id === id ? { ...ing, image_url: publicUrl } : ing
        )
      );
      setMessage({ type: "success", text: "Bild erfolgreich hochgeladen" });
    } catch (error) {
      console.error("Error uploading image:", error);
      setMessage({ type: "error", text: "Fehler beim Hochladen des Bildes" });
    } finally {
      setUploadingImage(null);
    }
  };

  const deleteIngredient = async (id: string) => {
    if (!confirm("Möchten Sie diese Zutat wirklich löschen?")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("ingredients")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("Error deleting ingredient:", error);
        setMessage({ type: "error", text: "Fehler beim Löschen der Zutat" });
        return;
      }

      setIngredients(ingredients.filter((ing) => ing.id !== id));
      setMessage({ type: "success", text: "Zutat erfolgreich gelöscht" });
    } catch (error) {
      console.error("Error deleting ingredient:", error);
      setMessage({ type: "error", text: "Fehler beim Löschen der Zutat" });
    }
  };

  const deleteMeal = async () => {
    if (!deleteMealId) return;

    try {
      const { error } = await supabase
        .from("meals")
        .delete()
        .eq("id", deleteMealId);

      if (error) {
        console.error("Error deleting meal:", error);
        setMessage({ type: "error", text: "Fehler beim Löschen der Mahlzeit" });
        return;
      }

      setMeals(meals.filter((meal) => meal.id !== deleteMealId));
      setMessage({ type: "success", text: "Mahlzeit erfolgreich gelöscht" });
      setDeleteMealId(null);
    } catch (error) {
      console.error("Error deleting meal:", error);
      setMessage({ type: "error", text: "Fehler beim Löschen der Mahlzeit" });
    }
  };

  if (loading) {
    return <PageSkeleton />;
  }

  const fullName = user?.user_metadata?.full_name || "Admin";

  return (
    <>
      <Container dark fullWidth>
        <div className="flex items-center justify-between mb-6 max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <div>
            <h1>Admin Dashboard</h1>
            <p>Willkommen, {fullName}!</p>
          </div>
        </div>
      </Container>

      <Container asPage>
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
            <AlertDialogAction onClick={() => setMessage(null)}>
              OK
            </AlertDialogAction>
          </AlertDialogContent>
        </AlertDialog>

        <div className="grid gap-6 md:grid-cols-2 mb-6">
          <Card title="Neue Mahlzeit erstellen">
            <p className="mb-4">
              Erstellen Sie neue Mahlzeiten mit Zutaten von verschiedenen Produzenten.
            </p>
            <Button
              size="lg"
              onClick={() => router.push("/admin/meals")}
              className="w-full"
            >
              Mahlzeit erstellen
            </Button>
          </Card>

          <Card title="Benutzerverwaltung">
            <p className="mb-4">
              Statistiken und Übersicht über das System.
            </p>
            <Button
              size="lg"
              onClick={() => router.push("/admin/overview")}
              variant="outline"
              className="w-full"
            >
              Übersicht anzeigen
            </Button>
          </Card>
        </div>

        {/* Ingredients Management */}
        <Card className="mt-6">
          <div className="flex items-center justify-start gap-2 mb-4">
            <h3>Zutaten verwalten</h3>
            <span className="text-sm text-muted-foreground">({ingredients.length})</span>
          </div>

          {/* Add New Ingredient */}
          <div className="flex gap-4 mb-6 items-center">
            <Input
              placeholder="Neue Zutat hinzufügen..."
              value={newIngredientName}
              onChange={(e) => setNewIngredientName(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  addIngredient();
                }
              }}
            />
            <Button onClick={addIngredient} size="lg">
              <Plus className="h-4 w-4" />
              Hinzufügen
            </Button>
          </div>

          {/* Ingredients Table */}
          {ingredients.length > 0 ? (
            <div className="max-h-[300px] overflow-y-auto border rounded-lg">
              <Table className="text-base">
                <TableHeader className="sticky top-0 bg-white z-10 text-sm">
                  <TableRow>
                    <TableHead>Bild</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Verfügbar</TableHead>
                    <TableHead className="text-right">Aktionen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ingredients.map((ingredient) => (
                  <TableRow key={ingredient.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {ingredient.image_url ? (
                          <img
                            src={ingredient.image_url}
                            alt={ingredient.name}
                            className="h-12 w-12 object-contain rounded border border-gray-200 p-1"
                          />
                        ) : (
                          <div className="h-12 w-12 bg-gray-100 rounded border border-gray-200 flex items-center justify-center">
                            <ImageIcon className="h-6 w-6 text-gray-400" />
                          </div>
                        )}
                        <Label
                          htmlFor={`upload-${ingredient.id}`}
                          className="cursor-pointer"
                        >
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={uploadingImage === ingredient.id}
                            asChild
                          >
                            <span>
                              <Upload className="h-3 w-3 mr-1" />
                              {uploadingImage === ingredient.id ? "Lädt..." : "Bild"}
                            </span>
                          </Button>
                        </Label>
                        <input
                          id={`upload-${ingredient.id}`}
                          type="file"
                          accept=".png,.svg"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              uploadIngredientImage(ingredient.id, file);
                            }
                          }}
                        />
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{ingredient.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={ingredient.is_available}
                          onCheckedChange={() =>
                            toggleIngredientAvailability(
                              ingredient.id,
                              ingredient.is_available
                            )
                          }
                        />
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteIngredient(ingredient.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              Keine Zutaten vorhanden. Fügen Sie eine neue Zutat hinzu.
            </div>
          )}
        </Card>

        {meals.length > 0 && (
          <Card className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <h3>Alle Mahlzeiten</h3>
              <Button onClick={() => router.push("/admin/meals")} size="lg">
                Neue Mahlzeit
              </Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Zutaten</TableHead>
                  <TableHead>Lageradresse</TableHead>
                  <TableHead>Erstellt am</TableHead>
                  <TableHead className="text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {meals.map((meal) => (
                  <TableRow key={meal.id}>
                    <TableCell className="font-medium">{meal.name}</TableCell>
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
                      {new Date(meal.created_at).toLocaleDateString("de-DE")}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/admin/meals/${meal.id}`)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteMealId(meal.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </Container>

      {/* Delete Meal Confirmation Dialog */}
      <AlertDialog open={!!deleteMealId} onOpenChange={() => setDeleteMealId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mahlzeit löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Sind Sie sicher, dass Sie diese Mahlzeit löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={deleteMeal} className="">
              Löschen
            </AlertDialogAction>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
