"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Card from "@/app/components/Card";
import Container from "@/app/components/Container";
import PageSkeleton from "@/app/components/PageSkeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Trash2 } from "lucide-react";
import {
  MultiSelect,
  MultiSelectContent,
  MultiSelectGroup,
  MultiSelectItem,
  MultiSelectTrigger,
  MultiSelectValue,
} from "@/components/ui/multi-select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface UserData {
  id: string;
  email: string;
  full_name?: string;
  occupation?: string;
  street?: string;
  zip_code?: string;
  city?: string;
  ingredients?: string[];
  address_coordinates?: { lat: number; lng: number };
}

export default function EditUserPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;
  const supabase = useMemo(() => createClient(), []);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [availableIngredients, setAvailableIngredients] = useState<string[]>([]);
  const [addressValidating, setAddressValidating] = useState(false);
  const [addressStatus, setAddressStatus] = useState<"valid" | "invalid" | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkUserAndLoadData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
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

        if (error) {
          console.error('Error checking admin role:', error.message);
          router.push("/");
          return;
        }

        if (!roleData) {
          router.push("/");
          return;
        }

        await Promise.all([loadUser(), loadAvailableIngredients()]);
        setLoading(false);
      } catch (error) {
        console.error('Error in checkUserAndLoadData:', error);
        router.push("/");
      }
    };

    checkUserAndLoadData();
  }, [userId]);

  const loadAvailableIngredients = async () => {
    try {
      const response = await fetch("/api/ingredients");
      if (!response.ok) {
        console.error("Failed to load ingredients");
        return;
      }
      const data = await response.json();
      const activeIngredients = data.ingredients
        .filter((ing: any) => ing.is_available)
        .map((ing: any) => ing.name);
      setAvailableIngredients(activeIngredients);
    } catch (error) {
      console.error("Error loading ingredients:", error);
    }
  };

  const loadUser = async () => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`);

      if (!response.ok) {
        router.push("/admin/overview");
        return;
      }

      const data = await response.json();
      const user = data.user;

      if (!user) {
        router.push("/admin/overview");
        return;
      }

      setUserData(user);
      setIsAdmin(user.is_admin || false);
      setEditForm({
        full_name: user.full_name || "",
        occupation: user.occupation || "",
        street: user.street || "",
        zip_code: user.zip_code || "",
        city: user.city || "",
        address_coordinates: user.address_coordinates,
      });
      setIngredients(user.vegetables || []);
      setAddressStatus(user.address_coordinates ? "valid" : null);
    } catch (error) {
      router.push("/admin/overview");
    }
  };

  const validateAddress = async () => {
    const { street, zip_code, city } = editForm;
    
    if (!street || !zip_code || !city) {
      setAddressStatus(null);
      return;
    }

    setAddressValidating(true);
    const fullAddress = `${street}, ${zip_code} ${city}, Austria`;

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fullAddress)}`
      );
      const data = await response.json();

      if (data && data.length > 0) {
        const coords = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
        setEditForm((prev: any) => ({ ...prev, address_coordinates: coords }));
        setAddressStatus("valid");
      } else {
        setAddressStatus("invalid");
      }
    } catch (error) {
      setAddressStatus("invalid");
    } finally {
      setAddressValidating(false);
    }
  };


  const handleDeleteUser = async () => {
    if (!userData) return;

    setDeleting(true);
    try {
      const response = await fetch(`/api/admin/users/${userData.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Fehler beim Löschen");
      }

      setMessage({ type: "success", text: "Benutzer erfolgreich gelöscht" });
      setTimeout(() => {
        router.push("/admin/overview");
      }, 1500);
    } catch (error: any) {
      setMessage({ type: "error", text: error.message || "Fehler beim Löschen des Benutzers" });
      setShowDeleteDialog(false);
    } finally {
      setDeleting(false);
    }
  };

  const saveUser = async () => {
    if (!userData) return;

    setSaving(true);
    try {
      const updateData = {
        full_name: editForm.full_name,
        occupation: editForm.occupation,
        street: editForm.street,
        zip_code: editForm.zip_code,
        city: editForm.city,
        ingredients: ingredients,
        address_coordinates: editForm.address_coordinates,
      };

      const response = await fetch(`/api/admin/users/${userData.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) throw new Error("Update failed");

      setMessage({ type: "success", text: "Benutzer erfolgreich aktualisiert" });
      setTimeout(() => {
        router.push("/admin/overview");
      }, 1500);
    } catch (error) {
      setMessage({ type: "error", text: "Fehler beim Aktualisieren des Benutzers" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <PageSkeleton />;
  }

  if (!userData) {
    return null;
  }

  return (
    <>
      <Container dark fullWidth>
        <div className="flex items-center justify-between mb-6 max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <div>
            <h1>Benutzer bearbeiten</h1>
            <p>Bearbeiten Sie die Benutzerinformationen für {userData.email}</p>
          </div>
        </div>
      </Container>

      <Container asPage>
        <div className="grid gap-6">
          {/* Personal Information Card */}
          <Card title="Persönliche Informationen">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-Mail (nicht änderbar)</Label>
                <Input
                  id="email"
                  value={userData.email}
                  disabled
                  className="bg-gray-50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="full_name">Vollständiger Name</Label>
                <Input
                  id="full_name"
                  value={editForm.full_name || ""}
                  onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                  placeholder="z.B. Max Mustermann"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="occupation">Tätigkeit</Label>
                <Select
                  value={editForm.occupation || ""}
                  onValueChange={(value) => setEditForm({ ...editForm, occupation: value })}
                >
                  <SelectTrigger className="w-full text-left">
                    <SelectValue placeholder="Tätigkeit" />
                  </SelectTrigger>
                  <SelectContent className="w-full">
                    <SelectItem value="Produzenten">Produzent</SelectItem>
                    <SelectItem value="Logistik">Logistik</SelectItem>
                    <SelectItem value="Enduser">Endverbraucher</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>

          {/* Address Card */}
          <Card title="Adresse">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="street">Straße und Hausnummer</Label>
                <Input
                  id="street"
                  value={editForm.street || ""}
                  onChange={(e) => {
                    setEditForm({ ...editForm, street: e.target.value });
                    setAddressStatus(null);
                  }}
                  placeholder="z.B. Hauptstraße 123"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="zip_code">Postleitzahl</Label>
                  <Input
                    id="zip_code"
                    value={editForm.zip_code || ""}
                    onChange={(e) => {
                      setEditForm({ ...editForm, zip_code: e.target.value });
                      setAddressStatus(null);
                    }}
                    placeholder="z.B. 1010"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">Stadt</Label>
                  <Input
                    id="city"
                    value={editForm.city || ""}
                    onChange={(e) => {
                      setEditForm({ ...editForm, city: e.target.value });
                      setAddressStatus(null);
                    }}
                    placeholder="z.B. Wien"
                  />
                </div>
              </div>

              <div className="pt-2">
                <Button
                  variant="outline"
                  onClick={validateAddress}
                  disabled={addressValidating || !editForm.street || !editForm.zip_code || !editForm.city}
                >
                  {addressValidating ? "Validiere..." : "Adresse validieren"}
                </Button>
                {addressStatus === "valid" && (
                  <p className="text-sm text-green-600 mt-2">✓ Adresse ist gültig und wurde gefunden</p>
                )}
                {addressStatus === "invalid" && (
                  <p className="text-sm text-red-600 mt-2">✗ Adresse konnte nicht gefunden werden. Bitte überprüfen Sie die Eingabe.</p>
                )}
              </div>
            </div>
          </Card>

          {/* Ingredients Card */}
          <Card title="Zutaten">
            <div className="space-y-2">
              <Label>Verfügbare Zutaten</Label>
              <MultiSelect
                values={ingredients}
                onValuesChange={setIngredients}
              >
                <MultiSelectTrigger className="w-full min-h-[50px]">
                  <MultiSelectValue placeholder="Wählen Sie Zutaten aus, die dieser Benutzer anbaut..." />
                </MultiSelectTrigger>
                <MultiSelectContent>
                  <MultiSelectGroup>
                    {availableIngredients.map((ingredient) => (
                      <MultiSelectItem key={ingredient} value={ingredient}>
                        {ingredient}
                      </MultiSelectItem>
                    ))}
                  </MultiSelectGroup>
                </MultiSelectContent>
              </MultiSelect>
              <p className="text-sm text-gray-600">
                Wählen Sie die Zutaten aus, die dieser Benutzer anbaut oder bevorzugt.
              </p>
            </div>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-4">
            <div className="flex gap-3">
              <Button onClick={saveUser} disabled={saving} size="lg">
                {saving ? "Speichert..." : "Änderungen speichern"}
              </Button>
              <Button
                variant="outline" size="lg"
                onClick={() => router.push("/admin/overview")}
                disabled={saving}
              >
                Abbrechen
              </Button>
            </div>
            {!isAdmin && (
              <Button
                variant="destructive"
                size="lg"
                onClick={() => setShowDeleteDialog(true)}
                disabled={saving || deleting}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Benutzer löschen
              </Button>
            )}
          </div>
        </div>
      </Container>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Benutzer löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Sind Sie sicher, dass Sie den Benutzer <strong>{userData?.email}</strong> löschen möchten? 
              Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogAction
            onClick={handleDeleteUser}
            disabled={deleting}
            className="bg-red-600 hover:bg-red-700"
          >
            {deleting ? "Löscht..." : "Benutzer löschen"}
          </AlertDialogAction>
        </AlertDialogContent>
      </AlertDialog>

      {/* Alert Dialog for messages */}
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
          <AlertDialogAction onClick={() => setMessage(null)}>OK</AlertDialogAction>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
