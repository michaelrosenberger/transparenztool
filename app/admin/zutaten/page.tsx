"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { checkAdminAuth } from "@/lib/auth/checkAdminAuth";
import Container from "@/app/components/Container";
import Card from "@/app/components/Card";
import PageSkeleton from "@/app/components/PageSkeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Upload, Trash2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

interface Ingredient {
  id: string;
  name: string;
  is_available: boolean;
  image_url: string | null;
}

export default function ZutatenPage() {
  const [loading, setLoading] = useState(true);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [newIngredientName, setNewIngredientName] = useState("");
  const [uploadingImage, setUploadingImage] = useState<string | null>(null);
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

        await loadIngredients();
        setLoading(false);
      } catch (error) {
        console.error('Error in checkUserAndLoadData:', error);
        router.push("/");
      }
    };

    checkUserAndLoadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadIngredients = async (forceRefresh = false) => {
    try {
      const url = forceRefresh ? "/api/admin/ingredients?refresh=true" : "/api/admin/ingredients";
      const response = await fetch(url, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
        }
      });

      if (!response.ok) {
        console.error("Error loading ingredients:", response.statusText);
        return;
      }

      const { ingredients } = await response.json();
      setIngredients(ingredients || []);
    } catch (error) {
      console.error("Error loading ingredients:", error);
    }
  };

  const addIngredient = async () => {
    if (!newIngredientName.trim()) {
      setMessage({ type: "error", text: "Bitte geben Sie einen Namen ein" });
      return;
    }

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
      await loadIngredients(true);
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

      const { data: { publicUrl } } = supabase.storage
        .from("ingredient-images")
        .getPublicUrl(filePath);

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
      await loadIngredients(true);
    } catch (error) {
      console.error("Error deleting ingredient:", error);
      setMessage({ type: "error", text: "Fehler beim Löschen der Zutat" });
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
            <h1>Zutaten verwalten</h1>
            <p>Verwalten Sie verfügbare Zutaten für Mahlzeiten</p>
          </div>
        </div>
      </Container>

      <Container asPage>
        <Card className="mb-6">
          <h3 className="mb-4">Neue Zutat hinzufügen</h3>
          <div className="flex gap-4 flex-wrap items-center">
            <div className="flex-1">
              <Input
                id="new-ingredient"
                value={newIngredientName}
                onChange={(e) => setNewIngredientName(e.target.value)}
                placeholder="z.B. Karotten"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    addIngredient();
                  }
                }}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={addIngredient}>
                Hinzufügen
              </Button>
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="mb-4">Alle Zutaten ({ingredients.length})</h3>
          {ingredients.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              Keine Zutaten vorhanden
            </p>
          ) : (
            <div className="space-y-4">
              {ingredients.map((ingredient) => (
                <div
                  key={ingredient.id}
                  className="flex items-center gap-4 p-4 border border-grey-2 rounded-lg"
                >
                  {ingredient.image_url ? (
                    <img
                      src={ingredient.image_url}
                      alt={ingredient.name}
                      className="w-12 h-12 object-contain"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center text-gray-400 text-xs">
                      Kein Bild
                    </div>
                  )}
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-medium">{ingredient.name}</h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`toggle-${ingredient.id}`} className="text-sm cursor-pointer">
                        {ingredient.is_available ? "Aktiv" : "Inaktiv"}
                      </Label>
                      <Switch
                        id={`toggle-${ingredient.id}`}
                        checked={ingredient.is_available}
                        onCheckedChange={() => toggleIngredientAvailability(ingredient.id, ingredient.is_available)}
                      />
                    </div>
                    
                    <label htmlFor={`upload-${ingredient.id}`}>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={uploadingImage === ingredient.id}
                        asChild
                      >
                        <span>
                          <Upload className="h-4 w-4 mr-2" />
                          {uploadingImage === ingredient.id ? "Lädt..." : "Bild"}
                        </span>
                      </Button>
                    </label>
                    <input
                      id={`upload-${ingredient.id}`}
                      type="file"
                      accept="image/png,image/svg+xml"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          uploadIngredientImage(ingredient.id, file);
                        }
                      }}
                    />
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteIngredient(ingredient.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
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
    </>
  );
}
