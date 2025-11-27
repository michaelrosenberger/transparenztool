"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { checkAdminAuth } from "@/lib/auth/checkAdminAuth";
import { useRouter, useParams } from "next/navigation";
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
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X, QrCode, Download, ExternalLink } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

interface FarmerProfile {
  id: string;
  full_name: string;
  vegetables: string[];
  address: string;
  lat: number;
  lng: number;
}

interface Meal {
  id: string;
  name: string;
  description: string;
  storage_name?: string;
  storage_address: string;
  storage_lat: number;
  storage_lng: number;
  vegetables: Array<{
    vegetable: string;
    farmer_id: string;
    farmer_name: string;
    address: string;
    lat: number;
    lng: number;
  }>;
  created_at: string;
}

export default function EditMealPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [meal, setMeal] = useState<Meal | null>(null);
  const [mealName, setMealName] = useState("");
  const [mealDescription, setMealDescription] = useState("");
  const [storageName, setStorageName] = useState("");
  const [storageAddress, setStorageAddress] = useState("");
  const [vegetables, setVegetables] = useState<Meal["vegetables"]>([]);
  const [farmers, setFarmers] = useState<FarmerProfile[]>([]);
  const [selectedFarmer, setSelectedFarmer] = useState<string>("");
  const [selectedVegetable, setSelectedVegetable] = useState<string>("");
  const [vegetableAddress, setVegetableAddress] = useState<string>("");
  const [vegetableAddressValidating, setVegetableAddressValidating] = useState(false);
  const [vegetableAddressStatus, setVegetableAddressStatus] = useState<"valid" | "invalid" | null>(null);
  const [vegetableAddressCoords, setVegetableAddressCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isNewFarmer, setIsNewFarmer] = useState(false);
  const [newFarmerName, setNewFarmerName] = useState<string>("");
  const [newVegetableName, setNewVegetableName] = useState<string>("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  
  const router = useRouter();
  const params = useParams();
  const supabase = createClient();
  const mealId = params.id as string;

  useEffect(() => {
    const checkUserAndLoadMeal = async () => {
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

        setUser(user);
        await loadFarmers();
        await loadMeal();
        setLoading(false);
      } catch (error) {
        console.error('Error in checkUserAndLoadMeal:', error);
        router.push("/");
      }
    };

    checkUserAndLoadMeal();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mealId]);

  const loadFarmers = async () => {
    try {
      // Auth is handled via cookies on the server side
      const response = await fetch("/api/admin/farmers");

      if (!response.ok) return;

      const { farmers: farmersWithVegetables } = await response.json();
      setFarmers(farmersWithVegetables);
    } catch (error: any) {
      console.error("Error loading farmers:", error);
    }
  };

  const loadMeal = async () => {
    try {
      const { data, error } = await supabase
        .from("meals")
        .select("*")
        .eq("id", mealId)
        .single();

      if (error) {
        console.error("Error loading meal:", error);
        console.error("Error details:", JSON.stringify(error, null, 2));
        setMessage({ type: "error", text: `Mahlzeit konnte nicht geladen werden: ${error.message || 'Unbekannter Fehler'}` });
        return;
      }

      if (!data) {
        console.error("No meal data returned");
        setMessage({ type: "error", text: "Mahlzeit nicht gefunden" });
        return;
      }

      setMeal(data);
      setMealName(data.name);
      setMealDescription(data.description);
      setStorageName(data.storage_name || "");
      setStorageAddress(data.storage_address);
      setVegetables(data.vegetables || []);
    } catch (error) {
      console.error("Error loading meal:", error);
      setMessage({ type: "error", text: "Fehler beim Laden der Mahlzeit" });
    }
  };

  const validateVegetableAddress = async (address: string) => {
    if (!address.trim()) {
      setVegetableAddressStatus(null);
      return null;
    }

    setVegetableAddressValidating(true);
    setVegetableAddressStatus(null);

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`
      );
      const data = await response.json();

      if (data && data.length > 0) {
        const coords = {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
        };
        setVegetableAddressCoords(coords);
        setVegetableAddressStatus("valid");
        return coords;
      } else {
        setVegetableAddressStatus("invalid");
        return null;
      }
    } catch (error) {
      console.error("Address validation error:", error);
      setVegetableAddressStatus("invalid");
      return null;
    } finally {
      setVegetableAddressValidating(false);
    }
  };

  const handleVegetableAddressBlur = () => {
    validateVegetableAddress(vegetableAddress);
  };

  const handleFarmerChange = (farmerId: string) => {
    setSelectedFarmer(farmerId);
    setSelectedVegetable("");
    
    const farmer = farmers.find(f => f.id === farmerId);
    if (farmer) {
      setVegetableAddress(farmer.address);
      setVegetableAddressCoords({ lat: farmer.lat, lng: farmer.lng });
      setVegetableAddressStatus("valid");
    }
  };

  const handleNewFarmerToggle = (checked: boolean) => {
    setIsNewFarmer(checked);
    if (checked) {
      setSelectedFarmer("");
      setSelectedVegetable("");
      setVegetableAddress("");
      setVegetableAddressStatus(null);
      setVegetableAddressCoords(null);
    }
  };

  const getAvailableVegetables = () => {
    if (!selectedFarmer) return [];
    const farmer = farmers.find(f => f.id === selectedFarmer);
    return farmer?.vegetables || [];
  };

  const addVegetable = async () => {
    if (isNewFarmer) {
      if (!newFarmerName.trim()) {
        setMessage({ type: "error", text: "Bitte geben Sie einen Namen für den neuen Produzent ein" });
        return;
      }
      if (!newVegetableName.trim()) {
        setMessage({ type: "error", text: "Bitte geben Sie einen Namen für die Zutat ein" });
        return;
      }
    } else {
      if (!selectedFarmer || !selectedVegetable) {
        setMessage({ type: "error", text: "Bitte wählen Sie einen Produzent und eine Zutat aus" });
        return;
      }
    }

    if (!vegetableAddress.trim()) {
      setMessage({ type: "error", text: "Bitte geben Sie eine Adresse ein" });
      return;
    }

    const coords = await validateVegetableAddress(vegetableAddress);
    if (!coords) {
      setMessage({ type: "error", text: "Bitte geben Sie eine gültige Adresse ein" });
      return;
    }

    if (isNewFarmer) {
      const newEntry = {
        vegetable: newVegetableName,
        farmer_id: `new_${Date.now()}`,
        farmer_name: newFarmerName,
        address: vegetableAddress,
        lat: coords.lat,
        lng: coords.lng,
      };

      setVegetables([...vegetables, newEntry]);
      setNewFarmerName("");
      setNewVegetableName("");
    } else {
      const farmer = farmers.find(f => f.id === selectedFarmer);
      if (!farmer) return;

      const exists = vegetables.some(
        v => v.vegetable === selectedVegetable && v.farmer_id === selectedFarmer && v.address === vegetableAddress
      );

      if (exists) {
        setMessage({ type: "error", text: "Diese Kombination wurde bereits hinzugefügt" });
        return;
      }

      setVegetables([
        ...vegetables,
        {
          vegetable: selectedVegetable,
          farmer_id: selectedFarmer,
          farmer_name: farmer.full_name,
          address: vegetableAddress,
          lat: coords.lat,
          lng: coords.lng,
        },
      ]);

      setSelectedVegetable("");
    }

    setVegetableAddress("");
    setVegetableAddressStatus(null);
    setVegetableAddressCoords(null);
  };

  const removeVegetable = (index: number) => {
    setVegetables(vegetables.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!mealName.trim()) {
      setMessage({ type: "error", text: "Bitte geben Sie einen Namen für die Mahlzeit ein" });
      return;
    }

    if (!mealDescription.trim()) {
      setMessage({ type: "error", text: "Bitte geben Sie eine Beschreibung ein" });
      return;
    }

    if (vegetables.length === 0) {
      setMessage({ type: "error", text: "Bitte fügen Sie mindestens eine Zutat hinzu" });
      return;
    }

    setSaving(true);

    try {
      const { error } = await supabase
        .from("meals")
        .update({
          name: mealName,
          description: mealDescription,
          storage_name: storageName,
          storage_address: storageAddress,
          vegetables: vegetables,
        })
        .eq("id", mealId);

      if (error) throw error;

      setMessage({ type: "success", text: "Mahlzeit erfolgreich aktualisiert!" });
    } catch (error: any) {
      console.error("Error updating meal:", error);
      setMessage({ type: "error", text: error.message || "Fehler beim Aktualisieren der Mahlzeit" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Möchten Sie diese Mahlzeit wirklich löschen?")) {
      return;
    }

    setSaving(true);

    try {
      const { error } = await supabase
        .from("meals")
        .delete()
        .eq("id", mealId);

      if (error) throw error;

      setMessage({ type: "success", text: "Mahlzeit erfolgreich gelöscht!" });
      setTimeout(() => {
        router.push("/admin");
      }, 1500);
    } catch (error: any) {
      console.error("Error deleting meal:", error);
      setMessage({ type: "error", text: error.message || "Fehler beim Löschen der Mahlzeit" });
      setSaving(false);
    }
  };

  if (loading) {
    return <PageSkeleton />;
  }

  if (!meal) {
    return (
      <Container asPage>
        <Card>
          <p>Mahlzeit nicht gefunden</p>
          <Button onClick={() => router.push("/admin")} className="mt-4">
            Zurück zum Dashboard
          </Button>
        </Card>
      </Container>
    );
  }

  return (
    <>
      <Container dark fullWidth>
        <div className="flex items-center justify-between mb-6 max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <div>
            <h1>Mahlzeit bearbeiten</h1>
            <p>Details der Mahlzeit anpassen</p>
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

        {meal && (
          <Card className="mb-6">
            <h3 className="mb-4 flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              QR-Code für diese Mahlzeit
            </h3>
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="flex-shrink-0 bg-white">
                <QRCodeSVG 
                  value={`${typeof window !== 'undefined' ? window.location.origin : ''}/meal/${mealId}`}
                  size={256}
                  level="H"
                  includeMargin={true}
                />
              </div>
              <div className="flex flex-wrap">
                <p className="text-sm text-gray-600 mb-2">
                  Scannen Sie diesen QR-Code, um die öffentliche Detailseite dieser Mahlzeit anzuzeigen.
                </p>
                <p className="text-sm font-mono bg-gray-50 p-2 rounded border border-gray-200 break-all">
                  {typeof window !== 'undefined' ? window.location.origin : ''}/meal/{mealId}
                </p>
                <div className="mt-4 flex gap-2 flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const svg = document.querySelector('svg');
                      if (!svg) return;
                      const svgData = new XMLSerializer().serializeToString(svg);
                      const canvas = document.createElement("canvas");
                      const ctx = canvas.getContext("2d");
                      const img = new Image();
                      img.onload = () => {
                        canvas.width = img.width;
                        canvas.height = img.height;
                        ctx?.drawImage(img, 0, 0);
                        const pngFile = canvas.toDataURL("image/png");
                        const downloadLink = document.createElement("a");
                        downloadLink.download = `meal-${mealId}-qr.png`;
                        downloadLink.href = pngFile;
                        downloadLink.click();
                      };
                      img.src = "data:image/svg+xml;base64," + btoa(svgData);
                    }}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    QR-Code herunterladen
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(`/meal/${mealId}`, "_blank")}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Vorschau öffnen
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(`/meal/${mealId}/presentation`, "_blank")}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Präsentationsansicht
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        )}

        <Card className="mb-6">
          <h3 className="mb-4">Mahlzeit-Details</h3>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="meal-name">Name der Mahlzeit</Label>
              <Input
                id="meal-name"
                value={mealName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMealName(e.target.value)}
                placeholder="z.B. Gemüsepfanne mit Karotten und Kartoffeln"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="meal-description">Beschreibung</Label>
              <Textarea
                id="meal-description"
                value={mealDescription}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setMealDescription(e.target.value)}
                placeholder="Kurze Beschreibung der Mahlzeit"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="storage-name">Name des Lagers</Label>
              <Input
                id="storage-name"
                value={storageName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStorageName(e.target.value)}
                placeholder="z.B. Hauptlager Wien"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="storage-address">Lageradresse</Label>
              <Input
                id="storage-address"
                value={storageAddress}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStorageAddress(e.target.value)}
                placeholder="z.B. Musterstraße 123, 1010 Wien"
              />
            </div>
          </div>
        </Card>

        <Card className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3>Zutaten verwalten</h3>
            <div className="flex items-center gap-2">
              <Switch
                id="new-farmer"
                checked={isNewFarmer}
                onCheckedChange={handleNewFarmerToggle}
              />
              <Label htmlFor="new-farmer" className="text-sm cursor-pointer">
                Neuer Produzent
              </Label>
            </div>
          </div>
          
          {!isNewFarmer ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="space-y-2">
                <Label>Produzent</Label>
                <Select value={selectedFarmer} onValueChange={handleFarmerChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Produzent wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {farmers.map((farmer) => (
                      <SelectItem key={farmer.id} value={farmer.id}>
                        {farmer.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Zutat</Label>
                <Select 
                  value={selectedVegetable} 
                  onValueChange={setSelectedVegetable}
                  disabled={!selectedFarmer}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Zutat wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableVegetables().map((veg) => (
                      <SelectItem key={veg} value={veg}>
                        {veg}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="space-y-2">
                <Label htmlFor="new-farmer-name">Name des Produzenten</Label>
                <Input
                  id="new-farmer-name"
                  value={newFarmerName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewFarmerName(e.target.value)}
                  placeholder="z.B. Max Mustermann"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-vegetable-name">Zutat</Label>
                <Input
                  id="new-vegetable-name"
                  value={newVegetableName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewVegetableName(e.target.value)}
                  placeholder="z.B. Karotten"
                />
              </div>
            </div>
          )}

          <div className="space-y-2 mb-4">
            <Label htmlFor="vegetable-address">Adresse</Label>
            <Input
              id="vegetable-address"
              value={vegetableAddress}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setVegetableAddress(e.target.value)}
              onBlur={handleVegetableAddressBlur}
              placeholder="Adresse des Produzenten"
            />
            {vegetableAddressValidating && (
              <p className="text-sm text-gray-500">Adresse wird validiert...</p>
            )}
            {vegetableAddressStatus === "valid" && (
              <p className="text-sm text-green-600">✓ Adresse validiert</p>
            )}
            {vegetableAddressStatus === "invalid" && (
              <p className="text-sm text-red-600">✗ Adresse nicht gefunden</p>
            )}
          </div>

          <Button
            onClick={addVegetable}
            className="w-full mb-6"
            disabled={isNewFarmer ? (!newFarmerName || !newVegetableName || !vegetableAddress) : (!selectedFarmer || !selectedVegetable || !vegetableAddress)}
          >
            Zutat hinzufügen
          </Button>

          {vegetables.length > 0 && (
            <div className="space-y-2">
              <Label>Ausgewählte Zutaten</Label>
              <div className="space-y-2">
                {vegetables.map((item, index) => (
                  <div key={index} className="flex items-start justify-between p-3 bg-gray-50 rounded-md border border-gray-200">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="secondary">{item.vegetable}</Badge>
                        <span className="text-sm font-medium">{item.farmer_name}</span>
                      </div>
                      <p className="text-sm text-gray-600">{item.address}</p>
                    </div>
                    <button
                      onClick={() => removeVegetable(index)}
                      className="text-gray-400 hover:text-destructive p-1"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>

        <div className="flex gap-4 flex-wrap">
          <Button
            onClick={handleSave}
            disabled={saving}
            size="lg"
            className="flex-1"
          >
            {saving ? "Wird gespeichert..." : "Änderungen speichern"}
          </Button>
          <Button
            onClick={() => router.push("/admin")}
            variant="outline"
            size="lg"
            className="flex-1"
          >
            Abbrechen
          </Button>
          <Button
            onClick={handleDelete}
            disabled={saving}
            variant="destructive"
            size="lg"
          >
            Löschen
          </Button>
        </div>
      </Container>
    </>
  );
}
