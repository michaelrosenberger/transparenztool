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
import { Pencil, Plus, Trash2, Upload, Image as ImageIcon, Eye, Calendar } from "lucide-react";

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

interface MealMenu {
  id: string;
  menu_date: string;
  title: string;
  subtitle: string | null;
  meal_ids: string[];
  is_today: boolean;
  created_at: string;
}

export default function AdminPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [menus, setMenus] = useState<MealMenu[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [newIngredientName, setNewIngredientName] = useState("");
  const [uploadingImage, setUploadingImage] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [deleteMealId, setDeleteMealId] = useState<string | null>(null);
  const [deleteMenuId, setDeleteMenuId] = useState<string | null>(null);
  const [defaultStorageName, setDefaultStorageName] = useState("");
  const [defaultStorageAddress, setDefaultStorageAddress] = useState("");
  const [savingStorage, setSavingStorage] = useState(false);
  const [settingTodayMenu, setSettingTodayMenu] = useState<string | null>(null);
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    let isMounted = true;

    const checkUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!isMounted) return;
        
        if (!user) {
          router.push("/login");
          return;
        }

        // Check admin role from user_roles table
        const { data: roleData, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'admin')
          .maybeSingle();

        if (!isMounted) return;

        if (error) {
          console.error('Error checking admin role:', error.message);
          router.push("/");
          return;
        }

        if (!roleData) {
          router.push("/");
          return;
        }

        setUser(user);
        
        // Load data sequentially with checks to prevent hanging
        try {
          await loadMeals();
          if (!isMounted) return;
          await loadMenus();
          if (!isMounted) return;
          await loadIngredients();
          if (!isMounted) return;
          await loadStorageSettings();
        } catch (loadError) {
          console.error('Error loading data:', loadError);
        }
        
        if (isMounted) {
          setLoading(false);
        }
      } catch (error) {
        console.error('Error in checkUser:', error);
        if (isMounted) {
          router.push("/");
        }
      }
    };

    checkUser();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const loadMenus = async () => {
    try {
      const { data, error } = await supabase
        .from("meal_menus")
        .select("*")
        .order("menu_date", { ascending: false });

      if (error) throw error;
      setMenus(data || []);
    } catch (error: any) {
      console.error("Error loading menus:", error);
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

  const loadStorageSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load from user metadata
      const storageName = user.user_metadata?.default_storage_name || "";
      const storageAddress = user.user_metadata?.default_storage_address || "";
      
      setDefaultStorageName(storageName);
      setDefaultStorageAddress(storageAddress);
    } catch (error) {
      console.error("Error loading storage settings:", error);
    }
  };

  const saveStorageSettings = async () => {
    if (!defaultStorageName.trim() || !defaultStorageAddress.trim()) {
      setMessage({ type: "error", text: "Bitte füllen Sie beide Felder aus" });
      return;
    }

    setSavingStorage(true);
    setMessage(null); // Clear any previous messages

    try {
      const response = await fetch('/api/admin/storage-settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          default_storage_name: defaultStorageName.trim(),
          default_storage_address: defaultStorageAddress.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(errorData.error || "Fehler beim Speichern");
      }

      // Reload the settings to confirm they were saved
      await loadStorageSettings();
      
      setMessage({ type: "success", text: "Lageradresse erfolgreich gespeichert!" });
    } catch (error: any) {
      console.error("Error saving storage settings:", error);
      setMessage({ type: "error", text: error.message || "Fehler beim Speichern der Lageradresse" });
    } finally {
      setSavingStorage(false);
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

  const handleDeleteMeal = async () => {
    if (!deleteMealId) return;

    try {
      const { error } = await supabase
        .from("meals")
        .delete()
        .eq("id", deleteMealId);

      if (error) throw error;

      setMessage({ type: "success", text: "Mahlzeit erfolgreich gelöscht!" });
      await loadMeals();
    } catch (error: any) {
      console.error("Error deleting meal:", error);
      setMessage({ type: "error", text: error.message || "Fehler beim Löschen der Mahlzeit" });
    } finally {
      setDeleteMealId(null);
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
      await loadMenus();
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
      await loadMenus();
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

          <Card title="Verwaltung">
            <p className="mb-4">
              Statistiken und Übersicht über alle Benutzer.
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

        {/* Storage Address Settings */}
        <Card className="mb-6">
          <h3 className="mb-4">Standard-Lageradresse</h3>
          <p className="mb-4 text-sm text-gray-600">
            Diese Adresse wird automatisch für neue Mahlzeiten vorausgewählt und kann bei jeder Mahlzeit individuell angepasst werden.
          </p>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="storage-name">Name des Lagers</Label>
              <Input
                id="storage-name"
                value={defaultStorageName}
                onChange={(e) => setDefaultStorageName(e.target.value)}
                placeholder="z.B. Hauptlager Wien"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="storage-address">Lageradresse</Label>
              <Input
                id="storage-address"
                value={defaultStorageAddress}
                onChange={(e) => setDefaultStorageAddress(e.target.value)}
                placeholder="z.B. Musterstraße 123, 1010 Wien"
              />
            </div>

            <Button
              onClick={saveStorageSettings}
              disabled={savingStorage}
              size="lg"
            >
              {savingStorage ? "Wird gespeichert..." : "Lageradresse speichern"}
            </Button>
          </div>
        </Card>

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

        <Card className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <h3>Alle Menüs</h3>
            <Button onClick={() => router.push("/admin/menus")} size="lg">
              Neues Menü
            </Button>
          </div>
          {menus.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Datum</TableHead>
                  <TableHead>Titel</TableHead>
                  <TableHead>Untertitel</TableHead>
                  <TableHead>Anzahl Mahlzeiten</TableHead>
                  <TableHead>Tagesmenü</TableHead>
                  <TableHead className="text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {menus.map((menu) => (
                  <TableRow key={menu.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {new Date(menu.menu_date).toLocaleDateString("de-DE")}
                      </div>
                    </TableCell>
                    <TableCell>{menu.title}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {menu.subtitle || "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {menu.meal_ids?.length || 0} Mahlzeit{menu.meal_ids?.length !== 1 ? "en" : ""}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={menu.is_today || false}
                          onCheckedChange={() => setTodayMenu(menu.id)}
                          disabled={settingTodayMenu === menu.id}
                        />
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/admin/menus/${menu.id}`)}
                          title="Ansehen"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/admin/menus/${menu.id}/edit`)}
                          title="Bearbeiten"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteMenuId(menu.id)}
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
          ) : (
            <div className="text-center py-8 text-gray-500">
              Keine Menüs vorhanden. Erstellen Sie ein neues Menü.
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
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteMeal}>
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Menu Confirmation Dialog */}
      <AlertDialog open={!!deleteMenuId} onOpenChange={() => setDeleteMenuId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Menü löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Sind Sie sicher, dass Sie dieses Menü löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.
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
