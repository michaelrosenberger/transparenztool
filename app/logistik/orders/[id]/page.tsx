"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useParams } from "next/navigation";
import Card from "@/app/components/Card";
import Container from "@/app/components/Container";
import PageSkeleton from "@/app/components/PageSkeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { OrderItemsDataTable } from "../order-items-data-table";
import { columns } from "../order-items-columns";

interface Order {
  id: string;
  order_number: string;
  user_id: string;
  farmer_name: string;
  status: string;
  items: Array<{ vegetable: string; quantity: number }>;
  created_at: string;
  updated_at: string;
}

export default function LogistikOrderDetailPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<Order | null>(null);
  const [farmerDisplayName, setFarmerDisplayName] = useState<string>("");
  const [accepting, setAccepting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  
  const router = useRouter();
  const params = useParams();
  const supabase = useMemo(() => createClient(), []);
  const orderId = params.id as string;

  useEffect(() => {
    const checkUserAndLoadOrder = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push("/login");
        return;
      }

      const occupation = user.user_metadata?.occupation;
      if (occupation !== "Logistik") {
        router.push("/");
        return;
      }

      setUser(user);
      await loadOrder(orderId);
      setLoading(false);
    };

    checkUserAndLoadOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  const loadOrder = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      setOrder(data);
      
      // Fetch the farmer's current business name
      if (data.user_id) {
        await loadFarmerName(data.user_id);
      }
    } catch (error) {
      console.error("Error loading order:", error);
      setMessage({ type: "error", text: "Bestellung nicht gefunden" });
    }
  };

  const loadFarmerName = async (userId: string) => {
    try {
      // Use admin API to get user metadata
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`/api/admin/user/${userId}`, {
        headers: {
          "Authorization": `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const { user: farmerUser } = await response.json();
        const displayName = farmerUser.user_metadata?.business_name || 
                          farmerUser.user_metadata?.full_name || 
                          farmerUser.email;
        setFarmerDisplayName(displayName);
      }
    } catch (error) {
      console.error("Error loading farmer name:", error);
      // Fall back to stored farmer_name if fetch fails
      setFarmerDisplayName(order?.farmer_name || "Unbekannt");
    }
  };

  const acceptOrder = async () => {
    if (!order) return;

    setShowConfirmDialog(false);
    setAccepting(true);
    setMessage(null);

    try {
      // Update order status to Accepted
      const { error: orderError } = await supabase
        .from("orders")
        .update({ status: "Accepted" })
        .eq("id", order.id);

      if (orderError) throw orderError;

      // Save each vegetable to storage table
      const storageEntries = order.items.map(item => ({
        order_id: order.id,
        order_number: order.order_number,
        farmer_name: order.farmer_name,
        vegetable: item.vegetable,
        quantity: item.quantity,
      }));

      const { error: storageError } = await supabase
        .from("storage")
        .insert(storageEntries);

      if (storageError) throw storageError;

      setMessage({ type: "success", text: "Bestellung akzeptiert und erfolgreich zum Lager hinzugefügt!" });
      
      // Redirect to accepted orders after 2 seconds
      setTimeout(() => {
        router.push("/logistik/orders/accepted");
      }, 2000);
    } catch (error: any) {
      setMessage({ type: "error", text: error.message || "Bestellung konnte nicht akzeptiert werden" });
    } finally {
      setAccepting(false);
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "Announced":
        return "announced";
      case "Delivered":
        return "delivered";
      case "Accepted":
        return "accepted";
      default:
        return "outline";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "Announced":
        return "Angekündigt";
      case "Delivered":
        return "Geliefert";
      case "Accepted":
        return "Akzeptiert";
      case "Stored":
        return "Gelagert";
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("de-DE", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTotalQuantity = () => {
    if (!order) return 0;
    return order.items.reduce((sum, item) => sum + item.quantity, 0);
  };

  if (loading) {
    return <PageSkeleton />;
  }

  if (!order) {
    return (
      <div className="flex items-center justify-center bg-background">
        <Card>
          <div className="text-center py-8">
            <p className="mb-4">Bestellung nicht gefunden</p>
          </div>
        </Card>
      </div>
    );
  }

  const isDelivered = order.status === "Delivered";

  return (
    <>
      <Container dark fullWidth>
        <div className="flex items-center justify-between mb-6 max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <div>
            <h1>Bestelldetails</h1>
            <p>Bestellinformationen überprüfen und zur Verarbeitung akzeptieren</p>
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
          <div className="flex items-start justify-between mb-6 flex-wrap">
            <div>
              <div className="flex gap-3 items-center flex-wrap mb-2">
                <h3 className="">
                  {order.order_number}
                </h3>
                <Badge variant={getStatusVariant(order.status) as any}>
                  {getStatusLabel(order.status)}
                </Badge>
              </div>
              <p>Produzent: {farmerDisplayName || order.farmer_name}</p>
            </div>
          
          </div>

          <div className="grid sm:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
            <div>
              <p className="mb-1">Erstellt</p>
              <p className="font-medium text-black">{formatDate(order.created_at)}</p>
            </div>
            <div>
              <p className="mb-1">Zuletzt aktualisiert</p>
              <p className="font-medium text-black">{formatDate(order.updated_at)}</p>
            </div>
          </div>
        </Card>

        <Card className="mb-6">
          <h3 className="mb-4">Bestellartikel</h3>
          <OrderItemsDataTable columns={columns} data={order.items} />
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex justify-between items-center mt-2">
              <span className="font-medium text-black text-base">Gesamtmenge:</span>
              <span className="font-medium text-black text-xl">
                {getTotalQuantity()} kg
              </span>
            </div>
          </div>
        </Card>

        {isDelivered && (
          <>
            <Card>
              <h3 className="mb-4">Bestellung akzeptieren</h3>
              <p className="mb-4">
                Überprüfen Sie die obigen Bestelldetails und akzeptieren Sie die Lieferung, um mit der Logistikverarbeitung fortzufahren.
              </p>
              
              <Button
                onClick={() => setShowConfirmDialog(true)}
                disabled={accepting}
                size="lg"
                className="w-full"
              >
                {accepting ? "Wird akzeptiert..." : "Bestellung akzeptieren"}
              </Button>
            </Card>

            <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Bestellung akzeptieren?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Möchten Sie die Bestellung <strong>{order?.order_number}</strong> wirklich akzeptieren? 
                    Die Bestellung wird zum Lager hinzugefügt und kann danach nicht mehr geändert werden.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="flex gap-3 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setShowConfirmDialog(false)}
                  >
                    Abbrechen
                  </Button>
                  <Button
                    onClick={acceptOrder}
                    disabled={accepting}
                  >
                    {accepting ? "Wird akzeptiert..." : "Ja, akzeptieren"}
                  </Button>
                </div>
              </AlertDialogContent>
            </AlertDialog>
          </>
        )}
      </Container>
    </>
  );
}
