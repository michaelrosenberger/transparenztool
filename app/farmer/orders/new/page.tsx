"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Card from "@/app/components/Card";
import Container from "@/app/components/Container";
import PageSkeleton from "@/app/components/PageSkeleton";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
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
import { Badge } from "@/components/ui/badge";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { X, Minus, Plus } from "lucide-react";

interface OrderItem {
  vegetable: string;
  quantity: number;
}

export default function NewOrderPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const [items, setItems] = useState<OrderItem[]>([]);
  const [availableVegetables, setAvailableVegetables] = useState<string[]>([]);
  const [selectedVegetable, setSelectedVegetable] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerVegetable, setDrawerVegetable] = useState<string>("");
  const [drawerQuantity, setDrawerQuantity] = useState<number>(1);
  
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push("/login");
        return;
      }

      const occupation = user.user_metadata?.occupation;
      if (occupation !== "Farmer") {
        router.push("/");
        return;
      }

      setUser(user);
      
      // Load farmer's vegetables from profile
      const vegetables = user.user_metadata?.vegetables || [];
      setAvailableVegetables(vegetables);
      
      // Set default selected vegetable
      if (vegetables.length > 0) {
        setSelectedVegetable(vegetables[0]);
        setDrawerVegetable(vegetables[0]);
      }
      
      generateOrderNumber();
      setLoading(false);
    };

    checkUser();
  }, [router, supabase.auth]);

  const generateOrderNumber = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
    setOrderNumber(`ORD-${year}${month}${day}-${random}`);
  };

  const addItem = () => {
    if (quantity <= 0) {
      setMessage({ type: "error", text: "Quantity must be greater than 0" });
      return;
    }

    // Check if vegetable already exists
    const existingIndex = items.findIndex(item => item.vegetable === selectedVegetable);
    
    if (existingIndex >= 0) {
      // Update existing item
      const newItems = [...items];
      newItems[existingIndex].quantity += quantity;
      setItems(newItems);
    } else {
      // Add new item
      setItems([...items, { vegetable: selectedVegetable, quantity }]);
    }

    setQuantity(1);
    setMessage(null);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItemQuantity = (index: number, newQuantity: number) => {
    if (newQuantity <= 0) return;
    const newItems = [...items];
    newItems[index].quantity = newQuantity;
    setItems(newItems);
  };

  const openDrawer = (vegetable: string) => {
    setDrawerVegetable(vegetable);
    setDrawerQuantity(1);
    setDrawerOpen(true);
  };

  const handleDrawerSubmit = () => {
    if (drawerQuantity <= 0) {
      setMessage({ type: "error", text: "Quantity must be greater than 0" });
      return;
    }

    // Check if vegetable already exists
    const existingIndex = items.findIndex(item => item.vegetable === drawerVegetable);
    
    if (existingIndex >= 0) {
      // Update existing item
      const newItems = [...items];
      newItems[existingIndex].quantity += drawerQuantity;
      setItems(newItems);
    } else {
      // Add new item
      setItems([...items, { vegetable: drawerVegetable, quantity: drawerQuantity }]);
    }

    setDrawerOpen(false);
    setMessage(null);
  };

  const incrementDrawerQuantity = () => {
    setDrawerQuantity(prev => prev + 5);
  };

  const decrementDrawerQuantity = () => {
    setDrawerQuantity(prev => Math.max(1, prev - 5));
  };

  const handleSubmit = async () => {
    if (items.length === 0) {
      setMessage({ type: "error", text: "Bitte fügen Sie mindestens einen Artikel zur Bestellung hinzu" });
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      const farmerName = user.user_metadata?.full_name || user.email;

      const { error } = await supabase
        .from("orders")
        .insert({
          order_number: orderNumber,
          user_id: user.id,
          farmer_name: farmerName,
          status: "Announced",
          items: items,
        });

      if (error) throw error;

      setMessage({ type: "success", text: "Bestellung erfolgreich erstellt!" });
      
      // Redirect to orders list after 2 seconds
      setTimeout(() => {
        router.push("/farmer/orders");
      }, 2000);
    } catch (error: any) {
      setMessage({ type: "error", text: error.message || "Bestellung konnte nicht erstellt werden" });
    } finally {
      setSubmitting(false);
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
            <h1>Neue Bestellung erstellen</h1>
            <p>Neue Gemüsebestellung zur Lieferung einreichen</p>
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

        <Card className="mb-6">
          <div className="mb-4">
            <h3 className="mb-2">{orderNumber}</h3>
            <p>Landwirt: {user?.user_metadata?.full_name || "Unbekannt"}</p>
          </div>
        </Card>

        <Card className="mb-6">
          <h3 className="mb-4">Gemüse hinzufügen</h3>
          
          {availableVegetables.length === 0 ? (
            <div className="text-center py-8">
              <p className="mb-4">Keine Gemüsesorten in Ihrem Profil konfiguriert.</p>
              <Button
                onClick={() => router.push("/profile")}
                variant="outline"
              >
                Zu den Profileinstellungen
              </Button>
            </div>
          ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
            <div className="space-y-2">
              <Label>Gemüsefeld</Label>
              <Select
                value={selectedVegetable}
                onValueChange={(value) => setSelectedVegetable(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableVegetables.map((veg) => (
                    <SelectItem key={veg} value={veg}>
                      {veg}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>
                Menge: <span className="font-medium">{quantity} kg</span>
              </Label>
              <Slider
                value={[quantity]}
                onValueChange={(value) => setQuantity(value[0])}
                min={1}
                max={500}
                step={5}
                className="w-full mt-6"
              />
              <div className="flex justify-between text-xs">
                <span>1 kg</span>
                <span>500 kg</span>
              </div>
            </div>

            <div className="flex items-center">
              <Button
                onClick={addItem}
                className="w-full"
              >
                Zur Bestellung hinzufügen
              </Button>
            </div>
          </div>
          )}
        </Card>

        {availableVegetables.length > 0 && (
        <Card className="mb-6">
          <h3 className="mb-4">Gemüse schnell hinzufügen</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {availableVegetables.map((veg) => (
              <Button
                key={veg}
                onClick={() => openDrawer(veg)}
                variant="outline"
                className="h-auto text-md font-medium"
              >
                {veg}
              </Button>
            ))}
          </div>
        </Card>
        )}

        <Card className="mb-6">
          <h3 className="mb-4">Bestellartikel</h3>
          
          {items.length === 0 ? (
            <p className="text-center py-8">
              Noch keine Artikel hinzugefügt. Fügen Sie oben Gemüse zu Ihrer Bestellung hinzu.
            </p>
          ) : (
            <div className="space-y-3">
              {items.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-md"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <span className="font-medium text-black">{item.vegetable}</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateItemQuantity(index, parseInt(e.target.value) || 1)}
                        className="w-24 px-3 py-1 border border-gray-300 rounded-md bg-white text-black focus:outline-none focus:ring-2 focus:ring-black"
                      />
                      <span>kg</span>
                    </div>
                  </div>
                  <Button
                    onClick={() => removeItem(index)}
                    variant="default"
                    size="sm"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              
              <div className="pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-black">Artikel gesamt:</span>
                  <span className="font-medium text-black">{items.length}</span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="font-medium text-black">Gesamtmenge:</span>
                  <span className="font-medium text-black">
                    {items.reduce((sum, item) => sum + item.quantity, 0)} kg
                  </span>
                </div>
              </div>
            </div>
          )}
        </Card>

        <div className="flex gap-4">
          <Button
            onClick={handleSubmit}
            disabled={items.length === 0 || submitting}
            size="lg"
            className="flex-1"
          >
            {submitting ? "Bestellung wird erstellt..." : "Bestellung erstellen"}
          </Button>
          <Button
            onClick={() => router.push("/farmer")}
            variant="outline"
            size="lg"
            className="flex-1"
          >
            Abbrechen
          </Button>
        </div>

        <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
          <DrawerContent>
            <DrawerHeader className="text-center">
              <DrawerTitle className="text-2xl font-bold">{drawerVegetable}</DrawerTitle>
              <DrawerDescription>Legen Sie Ihre Menge fest.</DrawerDescription>
            </DrawerHeader>
            
            <div className="flex flex-col items-center justify-center p-8 space-y-8">
              <div className="flex items-center justify-center gap-8">
                <Button
                  onClick={decrementDrawerQuantity}
                  variant="outline"
                  size="icon"
                  className="h-12 w-12 rounded-full"
                >
                  <Minus className="h-6 w-6" />
                </Button>
                
                <div className="text-center w-30">
                  <div className="text-7xl font-bold">{drawerQuantity}</div>
                  <div className="mt-2">KG</div>
                </div>
                
                <Button
                  onClick={incrementDrawerQuantity}
                  variant="outline"
                  size="icon"
                  className="h-12 w-12 rounded-full"
                >
                  <Plus className="h-6 w-6" />
                </Button>
              </div>
            </div>

            <DrawerFooter>
              <div className="flex gap-4 w-full">
                <Button onClick={handleDrawerSubmit} size="lg" className="flex-1">
                  Bestätigen
                </Button>
                <DrawerClose asChild>
                  <Button variant="outline" size="lg" className="flex-1">
                    Abbrechen
                  </Button>
                </DrawerClose>
              </div>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      </Container>
    </>
  );
}
