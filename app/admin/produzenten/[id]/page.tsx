"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { checkAdminAuth } from "@/lib/auth/checkAdminAuth";
import { useRouter, useParams } from "next/navigation";
import Container from "@/app/components/Container";
import Card from "@/app/components/Card";
import PageSkeleton from "@/app/components/PageSkeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
import { Upload, X, ImageIcon, Star, GripVertical } from "lucide-react";

interface Ingredient {
  id: string;
  name: string;
  is_available: boolean;
  image_url: string | null;
}

export default function EditProducentPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [availableIngredients, setAvailableIngredients] = useState<string[]>([]);
  
  // Form fields
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [businessSubtext, setBusinessSubtext] = useState("");
  const [businessDescription, setBusinessDescription] = useState("");
  const [street, setStreet] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [city, setCity] = useState("");
  const [vegetables, setVegetables] = useState<string[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [featuredImageIndex, setFeaturedImageIndex] = useState<number>(0);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  
  // Address validation
  const [addressValidating, setAddressValidating] = useState(false);
  const [addressStatus, setAddressStatus] = useState<"valid" | "invalid" | null>(null);
  const [addressCoordinates, setAddressCoordinates] = useState<{ lat: number; lng: number } | null>(null);

  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;
  const supabase = createClient();

  useEffect(() => {
    let isMounted = true;

    const checkAdminAndLoadData = async () => {
      try {
        const { user, isAdmin } = await checkAdminAuth();
        
        if (!isMounted) return;
        
        if (!user) {
          router.push("/login");
          return;
        }

        if (!isMounted) return;

        if (!isAdmin) {
          router.push("/");
          return;
        }

        // Load user data and ingredients
        await loadUserData();
        if (!isMounted) return;
        await loadIngredients();
        if (!isMounted) return;
        
        setLoading(false);
      } catch (error) {
        console.error('Error in checkAdminAndLoadData:', error);
        router.push("/");
      }
    };

    checkAdminAndLoadData();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const loadUserData = async () => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`);
      
      if (!response.ok) {
        throw new Error("Failed to load user");
      }

      const data = await response.json();
      const targetUser = data.user;

      if (!targetUser) {
        throw new Error("User not found");
      }

      if (targetUser.occupation !== "Produzenten") {
        setMessage({ type: "error", text: "Dieser Benutzer ist kein Produzent" });
        setTimeout(() => router.push("/admin/overview"), 2000);
        return;
      }

      // Populate form fields
      setEmail(targetUser.email || "");
      setFullName(targetUser.full_name || "");
      setBusinessName(targetUser.business_name || "");
      setBusinessSubtext(targetUser.business_subtext || "");
      setBusinessDescription(targetUser.business_description || "");
      setStreet(targetUser.street || "");
      setZipCode(targetUser.zip_code || "");
      setCity(targetUser.city || "");
      setVegetables(targetUser.vegetables || []);
      setImages(targetUser.business_images || []);
      setFeaturedImageIndex(targetUser.featured_image_index || 0);
      setAddressCoordinates(targetUser.address_coordinates || null);
      
      if (targetUser.address_coordinates) {
        setAddressStatus("valid");
      }
    } catch (error) {
      console.error("Error loading user data:", error);
      setMessage({ type: "error", text: "Fehler beim Laden der Benutzerdaten" });
    }
  };

  const loadIngredients = async () => {
    try {
      const { data, error } = await supabase
        .from("ingredients")
        .select("*")
        .eq("is_available", true)
        .order("name", { ascending: true });

      if (error) {
        console.error("Error loading ingredients:", error);
        return;
      }

      setAvailableIngredients((data || []).map((ing: Ingredient) => ing.name));
    } catch (error) {
      console.error("Error loading ingredients:", error);
    }
  };

  const validateAddress = async (street: string, zipCode: string, city: string) => {
    if (!street.trim() || !zipCode.trim() || !city.trim()) {
      setAddressStatus(null);
      setAddressCoordinates(null);
      return null;
    }

    setAddressValidating(true);
    setAddressStatus(null);

    try {
      const fullAddress = `${street}, ${zipCode} ${city}, Austria`;
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fullAddress)}`
      );
      const data = await response.json();

      if (data && data.length > 0) {
        const coords = {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
        };
        setAddressStatus("valid");
        setAddressCoordinates(coords);
        setAddressValidating(false);
        return coords;
      } else {
        setAddressStatus("invalid");
        setAddressCoordinates(null);
        setAddressValidating(false);
        return null;
      }
    } catch (error) {
      console.error("Error validating address:", error);
      setAddressStatus("invalid");
      setAddressCoordinates(null);
      setAddressValidating(false);
      return null;
    }
  };

  const handleAddressBlur = () => {
    validateAddress(street, zipCode, city);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (images.length + files.length > 5) {
      setMessage({ type: "error", text: "Maximal 5 Bilder erlaubt" });
      return;
    }

    setUploadingImage(true);

    try {
      const uploadedUrls: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        if (!file.type.startsWith("image/")) {
          continue;
        }

        const fileExt = file.name.split(".").pop();
        const fileName = `${userId}-${Date.now()}-${i}.${fileExt}`;
        const filePath = `business/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(filePath, file, { upsert: true });

        if (uploadError) {
          console.error("Error uploading image:", uploadError);
          continue;
        }

        const { data: { publicUrl } } = supabase.storage
          .from("avatars")
          .getPublicUrl(filePath);

        uploadedUrls.push(publicUrl);
      }

      setImages([...images, ...uploadedUrls]);
      setMessage({ type: "success", text: `${uploadedUrls.length} Bild(er) hochgeladen` });
    } catch (error) {
      console.error("Error uploading images:", error);
      setMessage({ type: "error", text: "Fehler beim Hochladen der Bilder" });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemoveImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages);
    
    // Adjust featured image index if needed
    if (featuredImageIndex === index) {
      setFeaturedImageIndex(0);
    } else if (featuredImageIndex > index) {
      setFeaturedImageIndex(featuredImageIndex - 1);
    }
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    
    if (draggedIndex === null || draggedIndex === index) return;
    
    const newImages = [...images];
    const draggedImage = newImages[draggedIndex];
    
    // Remove from old position
    newImages.splice(draggedIndex, 1);
    // Insert at new position
    newImages.splice(index, 0, draggedImage);
    
    // Update featured image index if needed
    let newFeaturedIndex = featuredImageIndex;
    if (featuredImageIndex === draggedIndex) {
      newFeaturedIndex = index;
    } else if (draggedIndex < featuredImageIndex && index >= featuredImageIndex) {
      newFeaturedIndex = featuredImageIndex - 1;
    } else if (draggedIndex > featuredImageIndex && index <= featuredImageIndex) {
      newFeaturedIndex = featuredImageIndex + 1;
    }
    
    setImages(newImages);
    setFeaturedImageIndex(newFeaturedIndex);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleSetFeatured = (index: number) => {
    setFeaturedImageIndex(index);
  };

  const handleSave = async () => {
    // Validate required fields
    if (!businessName.trim()) {
      setMessage({ type: "error", text: "Bitte geben Sie einen Geschäftsnamen ein" });
      return;
    }

    if (!street.trim() || !zipCode.trim() || !city.trim()) {
      setMessage({ type: "error", text: "Bitte geben Sie eine vollständige Adresse ein" });
      return;
    }

    if (vegetables.length === 0) {
      setMessage({ type: "error", text: "Bitte wählen Sie mindestens eine Zutat aus" });
      return;
    }

    setSaving(true);
    setMessage(null); // Clear any previous messages

    try {
      // Validate address one more time before saving
      const coords = await validateAddress(street, zipCode, city);
      
      if (!coords) {
        setMessage({ type: "error", text: "Adresse konnte nicht validiert werden" });
        return;
      }

      // Update user via API
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_metadata: {
            full_name: fullName,
            business_name: businessName,
            business_subtext: businessSubtext,
            business_description: businessDescription,
            street,
            zip_code: zipCode,
            city,
            vegetables,
            business_images: images,
            featured_image_index: featuredImageIndex,
            address_coordinates: coords,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(errorData.error || "Fehler beim Speichern");
      }

      setMessage({ type: "success", text: "Geschäftsprofil erfolgreich gespeichert!" });
    } catch (error: any) {
      console.error("Error saving business profile:", error);
      setMessage({ type: "error", text: error.message || "Fehler beim Speichern des Profils" });
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
            <h1>Geschäftsprofil bearbeiten</h1>
            <p>Bearbeiten Sie die Geschäftsinformationen des Produzenten</p>
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

        {/* Account Information (Read-only) */}
        <Card className="mb-6">
          <h3 className="mb-4">Account-Informationen</h3>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>E-Mail-Adresse</Label>
              <Input
                value={email}
                disabled
                className="bg-gray-50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="full-name">Vollständiger Name</Label>
              <Input
                id="full-name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="z.B. Max Mustermann"
              />
            </div>
          </div>
        </Card>

        {/* Business Information */}
        <Card className="mb-6">
          <h3 className="mb-4">Geschäftsinformationen</h3>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="business-name">Geschäftsname *</Label>
              <Input
                id="business-name"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="z.B. Bio-Hof Müller"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="business-subtext">Kurzbeschreibung</Label>
              <Input
                id="business-subtext"
                value={businessSubtext}
                onChange={(e) => setBusinessSubtext(e.target.value)}
                placeholder="z.B. Biologischer Anbau seit 1985"
                maxLength={100}
              />
              <p className="text-sm text-gray-500">{businessSubtext.length}/100 Zeichen</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="business-description">Ausführliche Beschreibung</Label>
              <Textarea
                id="business-description"
                value={businessDescription}
                onChange={(e) => setBusinessDescription(e.target.value)}
                placeholder="Beschreiben Sie den Betrieb, die Philosophie und die Produkte..."
                rows={6}
                maxLength={1000}
              />
              <p className="text-sm text-gray-500">{businessDescription.length}/1000 Zeichen</p>
            </div>
          </div>
        </Card>

        {/* Address */}
        <Card className="mb-6">
          <h3 className="mb-4">Adresse *</h3>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="street">Straße und Hausnummer</Label>
              <Input
                id="street"
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                onBlur={handleAddressBlur}
                placeholder="z.B. Hauptstraße 123"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="zip-code">Postleitzahl</Label>
                <Input
                  id="zip-code"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                  onBlur={handleAddressBlur}
                  placeholder="z.B. 1010"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">Ort</Label>
                <Input
                  id="city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  onBlur={handleAddressBlur}
                  placeholder="z.B. Wien"
                />
              </div>
            </div>

            {addressValidating && (
              <p className="text-sm text-gray-500">Adresse wird validiert...</p>
            )}
            {addressStatus === "valid" && (
              <p className="text-sm text-green-600">✓ Adresse validiert</p>
            )}
            {addressStatus === "invalid" && (
              <p className="text-sm text-red-600">✗ Adresse nicht gefunden. Bitte überprüfen Sie Ihre Eingabe.</p>
            )}
          </div>
        </Card>

        {/* Zutaten */}
        <Card className="mb-6">
          <h3 className="mb-4">Zutaten *</h3>
          <p className="mb-4 text-sm text-gray-600">
            Wählen Sie die Zutaten aus, die angebaut werden (basierend auf aktiven Zutaten)
          </p>
          
          {availableIngredients.length === 0 ? (
            <p className="text-sm text-gray-500">
              Keine aktiven Zutaten verfügbar. Bitte aktivieren Sie zuerst Zutaten im Admin-Dashboard.
            </p>
          ) : (
            <MultiSelect
              values={vegetables}
              onValuesChange={setVegetables}
            >
              <MultiSelectTrigger className="w-full min-h-[50px]">
                <MultiSelectValue placeholder="Zutaten auswählen..." />
              </MultiSelectTrigger>
              <MultiSelectContent>
                <MultiSelectGroup>
                  {availableIngredients.map((vegetable: string) => (
                    <MultiSelectItem key={vegetable} value={vegetable}>
                      {vegetable}
                    </MultiSelectItem>
                  ))}
                </MultiSelectGroup>
              </MultiSelectContent>
            </MultiSelect>
          )}
        </Card>

        {/* Images */}
        <Card className="mb-6">
          <h3 className="mb-4">Bilder (max. 5)</h3>
          <p className="mb-4 text-sm text-gray-600">
            Laden Sie Bilder des Betriebs, der Felder oder Produkte hoch. Ziehen Sie Bilder, um die Reihenfolge zu ändern.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-4">
            {images.map((image, index) => (
              <div
                key={index}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all cursor-move ${
                  draggedIndex === index 
                    ? "border-blue-500 opacity-50 scale-95" 
                    : featuredImageIndex === index
                    ? "border-yellow-400"
                    : "border-gray-200"
                }`}
              >
                <img
                  src={image}
                  alt={`Business image ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                
                {/* Drag handle */}
                <div className="absolute top-2 left-2 bg-black/50 text-white rounded p-1">
                  <GripVertical className="h-4 w-4" />
                </div>
                
                {/* Featured star */}
                <button
                  onClick={() => handleSetFeatured(index)}
                  className={`absolute top-2 left-1/2 -translate-x-1/2 rounded-full p-1 transition-colors ${
                    featuredImageIndex === index
                      ? "bg-yellow-400 text-white"
                      : "bg-black/50 text-white hover:bg-yellow-400"
                  }`}
                  type="button"
                  title={featuredImageIndex === index ? "Hauptbild" : "Als Hauptbild markieren"}
                >
                  <Star className={`h-4 w-4 ${featuredImageIndex === index ? "fill-white" : ""}`} />
                </button>
                
                {/* Remove button */}
                <button
                  onClick={() => handleRemoveImage(index)}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                  type="button"
                >
                  <X className="h-4 w-4" />
                </button>
                
                {/* Image number badge */}
                <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                  {index + 1}
                </div>
              </div>
            ))}

            {images.length < 5 && (
              <label className="relative aspect-square rounded-lg border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors cursor-pointer flex items-center justify-center">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={uploadingImage}
                />
                <div className="text-center">
                  {uploadingImage ? (
                    <div className="text-gray-400">
                      <Upload className="h-8 w-8 mx-auto mb-2 animate-pulse" />
                      <p className="text-sm">Lädt...</p>
                    </div>
                  ) : (
                    <div className="text-gray-400">
                      <ImageIcon className="h-8 w-8 mx-auto mb-2" />
                      <p className="text-sm">Bild hinzufügen</p>
                    </div>
                  )}
                </div>
              </label>
            )}
          </div>

          <div className="space-y-2">
            <p className="text-sm text-gray-500">
              {images.length}/5 Bilder hochgeladen
            </p>
            {images.length > 0 && (
              <div className="flex items-start gap-2 text-sm text-gray-600">
                <Star className="h-4 w-4 text-yellow-400 fill-yellow-400 mt-0.5 flex-shrink-0" />
                <p>
                  Das Bild mit dem Stern ist das Hauptbild und wird prominent auf der Produzentenliste angezeigt.
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* Save Button */}
        <div className="flex gap-4">
          <Button
            onClick={handleSave}
            disabled={saving || addressValidating}
            size="lg"
            className="flex-1"
          >
            {saving ? "Wird gespeichert..." : "Änderungen speichern"}
          </Button>
          <Button
            onClick={() => router.push("/admin/overview")}
            variant="outline"
            size="lg"
            className="flex-1"
          >
            Abbrechen
          </Button>
        </div>
      </Container>
    </>
  );
}
