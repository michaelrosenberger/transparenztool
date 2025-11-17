"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Card from "@/app/components/Card";
import Container from "@/app/components/Container";
import PageSkeleton from "@/app/components/PageSkeleton";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MultiSelect,
  MultiSelectContent,
  MultiSelectGroup,
  MultiSelectItem,
  MultiSelectTrigger,
  MultiSelectValue,
} from "@/components/ui/multi-select";

type Occupation = "Farmer" | "Logistik" | "Enduser";

const VEGETABLES = [
  "Tomaten",
  "Karotten",
  "Kartoffeln",
  "Salat",
  "Gurken",
  "Paprika",
  "Zwiebeln",
  "Kohl",
  "Brokkoli",
  "Blumenkohl",
];

export default function Profile() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [validatingAddress, setValidatingAddress] = useState(false);
  const [fullName, setFullName] = useState("");
  const [occupation, setOccupation] = useState<Occupation | "">("");
  const [street, setStreet] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [city, setCity] = useState("");
  const [addressCoordinates, setAddressCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [vegetables, setVegetables] = useState<string[]>([]);
  const [profileImage, setProfileImage] = useState<string>("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [user, setUser] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push("/login");
        return;
      }

      setUser(user);

      // Load profile data from user metadata
      const metadata = user.user_metadata || {};
      setFullName(metadata.full_name || "");
      setOccupation(metadata.occupation || "");
      setStreet(metadata.street || "");
      setZipCode(metadata.zip_code || "");
      setCity(metadata.city || "");
      setAddressCoordinates(metadata.address_coordinates || null);
      setVegetables(metadata.vegetables || []);
      setProfileImage(metadata.profile_image || "");
    } catch (error: any) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const validateAddress = async () => {
    // Only validate if all address fields are filled
    if (!street || !zipCode || !city) {
      setAddressCoordinates(null);
      return null;
    }

    setValidatingAddress(true);
    try {
      const fullAddress = `${street}, ${zipCode} ${city}`;
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fullAddress)}&limit=1`
      );
      
      const data = await response.json();
      
      if (data && data.length > 0) {
        const coords = {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon)
        };
        setAddressCoordinates(coords);
        return coords;
      } else {
        setAddressCoordinates(null);
        return null;
      }
    } catch (error) {
      console.error("Address validation error:", error);
      setAddressCoordinates(null);
      return null;
    } finally {
      setValidatingAddress(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      // Validate address if all fields are provided
      let coordinates = addressCoordinates;
      if (street && zipCode && city) {
        coordinates = await validateAddress();
        if (!coordinates) {
          setMessage({ 
            type: "error", 
            text: "Die Adresse konnte nicht validiert werden. Bitte überprüfen Sie, ob Straße, Postleitzahl und Stadt korrekt sind." 
          });
          setSaving(false);
          return;
        }
      }

      // Update user metadata
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: fullName,
          occupation: occupation,
          street: street,
          zip_code: zipCode,
          city: city,
          address_coordinates: coordinates,
          vegetables: vegetables,
          profile_image: profileImage,
        },
      });

      if (error) throw error;

      setMessage({ type: "success", text: "Profil erfolgreich aktualisiert!" });
    } catch (error: any) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setMessage({ type: "error", text: "Bitte wählen Sie eine Bilddatei aus" });
      return;
    }

    // Disallow GIF files
    if (file.type === "image/gif") {
      setMessage({ type: "error", text: "GIF-Dateien sind nicht erlaubt" });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: "error", text: "Bildgröße muss kleiner als 5MB sein" });
      return;
    }

    setUploadingImage(true);
    setMessage(null);

    try {
      // Create a unique file name
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `profile-images/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      setProfileImage(publicUrl);
      setMessage({ type: "success", text: "Bild erfolgreich hochgeladen! Vergessen Sie nicht, Ihr Profil zu speichern." });
    } catch (error: any) {
      setMessage({ type: "error", text: error.message || "Bild konnte nicht hochgeladen werden" });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    // Validate passwords
    if (newPassword.length < 6) {
      setMessage({ type: "error", text: "Passwort muss mindestens 6 Zeichen lang sein" });
      setSaving(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "Passwörter stimmen nicht überein" });
      setSaving(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      setMessage({ type: "success", text: "Passwort erfolgreich geändert!" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setSaving(false);
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
            <h1>Profil</h1>
            <p>{user?.email}</p>
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

        {/* Profile Information */}
        <Card title="Profilinformationen" className="mb-6">
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Vollständiger Name</Label>
              <Input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Geben Sie Ihren vollständigen Namen ein"
              />
            </div>

            {/* Profile Image Upload - Only for Farmers */}
            {occupation === "Farmer" && (
              <div className="space-y-2">
                <Label>Profilbild</Label>
                <div className="flex items-center gap-4 flex-wrap">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={profileImage} alt={fullName || "Profile"} />
                    <AvatarFallback>
                      {fullName ? fullName.charAt(0).toUpperCase() : "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingImage}
                      >
                        {uploadingImage ? "Wird hochgeladen..." : "Bild hochladen"}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Max 5MB. Unterstützte Formate: JPG, PNG
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="occupation">Tätigkeit</Label>
              <Select
                value={occupation}
                onValueChange={(value) => setOccupation(value as Occupation)}
              >
                <SelectTrigger                 
                  className="w-full text-left"
                >
                  <SelectValue placeholder="Tätigkeit" />
                </SelectTrigger>
                <SelectContent
                  className="w-full"
                >
                  <SelectItem value="Farmer">Landwirt</SelectItem>
                  <SelectItem value="Logistik">Logistik</SelectItem>
                  <SelectItem value="Enduser">Endverbraucher</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Address Fields - Only for Farmers and Logistik */}
            {occupation !== "Enduser" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="street">Straße (Optional)</Label>
                  <Input
                    id="street"
                    type="text"
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    placeholder="Geben Sie Ihre Straßenadresse ein"
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="zipCode">Postleitzahl (Optional)</Label>
                    <Input
                      id="zipCode"
                      type="text"
                      value={zipCode}
                      onChange={(e) => setZipCode(e.target.value)}
                      placeholder="Postleitzahl eingeben"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="city">Stadt (Optional)</Label>
                    <Input
                      id="city"
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Stadt eingeben"
                    />
                  </div>
                </div>

                {/* Address Validation Status */}
                {street && zipCode && city && (
                  <div className="p-3 rounded-md bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800">
                    {addressCoordinates ? (
                      <div className="flex items-center gap-2 text-green-700">
                        <span>✓</span>
                        <span className="text-sm">
                          Adresse validiert
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-amber-700">
                        <span>⚠</span>
                        <span className="text-sm">
                          Adresse wird beim Speichern Ihres Profils validiert
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {/* Vegetables Multi-Select - Only for Farmers */}
            {occupation === "Farmer" && (
              <div className="space-y-2">
                <Label>Verfügbares Gemüse (Optional)</Label>
                <MultiSelect
                  values={vegetables}
                  onValuesChange={setVegetables}
                >
                  <MultiSelectTrigger className="w-full min-h-[50px]">
                    <MultiSelectValue placeholder="Wählen Sie Gemüse aus, das Sie anbauen..." />
                  </MultiSelectTrigger>
                  <MultiSelectContent>
                    <MultiSelectGroup>
                      {VEGETABLES.map((vegetable) => (
                        <MultiSelectItem key={vegetable} value={vegetable}>
                          {vegetable}
                        </MultiSelectItem>
                      ))}
                    </MultiSelectGroup>
                  </MultiSelectContent>
                </MultiSelect>
              </div>
            )}

            <Button
              type="submit"
              disabled={saving}
              size="lg"
              className="w-full"
            >
              {saving ? "Wird gespeichert..." : "Änderungen speichern"}
            </Button>
          </form>
        </Card>

        {/* Change Password */}
        <Card title="Passwort ändern">
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">Neues Passwort</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Neues Passwort eingeben"
              />
              <p className="text-xs">
                Muss mindestens 6 Zeichen lang sein
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Neues Passwort bestätigen</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Neues Passwort bestätigen"
              />
            </div>

            <Button
              type="submit"
              disabled={saving || !newPassword || !confirmPassword}
              size="lg"
              className="w-full"
            >
              {saving ? "Wird geändert..." : "Passwort ändern"}
            </Button>
          </form>
        </Card>
      </Container>
    </>
  );
}
