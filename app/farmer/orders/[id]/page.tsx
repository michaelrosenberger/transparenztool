"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useParams } from "next/navigation";
import Card from "@/app/components/Card";
import Container from "@/app/components/Container";
import PageSkeleton from "@/app/components/PageSkeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

interface Order {
  id: string;
  order_number: string;
  farmer_name: string;
  status: string;
  items: Array<{ vegetable: string; quantity: number }>;
  created_at: string;
  updated_at: string;
}

export default function OrderDetailPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<Order | null>(null);
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  
  const router = useRouter();
  const params = useParams();
  const supabase = createClient();
  const orderId = params.id as string;

  useEffect(() => {
    const checkUserAndLoadOrder = async () => {
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
      await loadOrder(orderId, user.id);
      setLoading(false);
    };

    checkUserAndLoadOrder();
  }, [orderId, router, supabase.auth]);

  const loadOrder = async (id: string, userId: string) => {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("id", id)
        .eq("user_id", userId)
        .single();

      if (error) throw error;
      setOrder(data);
    } catch (error) {
      console.error("Error loading order:", error);
      setMessage({ type: "error", text: "Order not found" });
    }
  };

  const updateStatus = async (newStatus: string) => {
    if (!order) return;

    setUpdating(true);
    setMessage(null);

    try {
      const { error } = await supabase
        .from("orders")
        .update({ status: newStatus })
        .eq("id", order.id);

      if (error) throw error;

      setOrder({ ...order, status: newStatus });
      setMessage({ type: "success", text: `Order status updated to ${newStatus}` });
    } catch (error: any) {
      setMessage({ type: "error", text: error.message || "Failed to update status" });
    } finally {
      setUpdating(false);
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
      case "Stored":
        return "stored";
      default:
        return "outline";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card>
          <div className="text-center py-8">
            <p className="mb-4">Order not found</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <>
      <Container dark fullWidth>
        <div className="flex items-center justify-between mb-6 max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <div>
            <h1>Order Details</h1>
            <p>View and update your order status</p>
          </div>
        </div>
      </Container>

      <Container asPage>

        <AlertDialog open={!!message} onOpenChange={() => setMessage(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {message?.type === "success" ? "Success" : ""}
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
          <div className="flex items-start justify-between mb-6">
            <div>
              <h3 className="mb-2">
                {order.order_number}
              </h3>
              <p>Farmer: {order.farmer_name}</p>
            </div>
            <Badge variant={getStatusVariant(order.status) as any}>
              {order.status}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-4 py-4 border-t border-b border-gray-200">
            <div>
              <p className="mb-1">Created</p>
              <p className="font-medium text-black">{formatDate(order.created_at)}</p>
            </div>
            <div>
              <p className="mb-1">Last Updated</p>
              <p className="font-medium text-black">{formatDate(order.updated_at)}</p>
            </div>
          </div>
        </Card>

        <Card className="mb-6">
          <h3 className="mb-4">Order Items</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">No.</TableHead>
                <TableHead>Vegetable</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.items.map((item, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{index + 1}</TableCell>
                  <TableCell className="text-black font-medium">{item.vegetable}</TableCell>
                  <TableCell className="text-right text-black font-medium">{item.quantity} kg</TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={2} className="font-medium">Total Items: {order.items.length}</TableCell>
                <TableCell className="text-right font-bold">{getTotalQuantity()} kg</TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </Card>

        <Card>
          <h3 className="mb-4">Update Status</h3>
          <p className="mb-4">
            Change the order status to track its progress through the supply chain.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              onClick={() => updateStatus("Announced")}
              disabled={updating || order.status === "Announced"}
              variant={order.status === "Announced" ? "secondary" : "outline"}
              size="lg"
            >
              Announced
            </Button>
            
            <Button
              onClick={() => updateStatus("Delivered")}
              disabled={updating || order.status === "Delivered"}
              variant={order.status === "Delivered" ? "default" : "outline"}
              size="lg"
              className={order.status === "Delivered" ? "bg-green-600 hover:bg-green-700" : ""}
            >
              Delivered
            </Button>
            
            <Button
              onClick={() => updateStatus("Stored")}
              disabled={updating || order.status === "Stored"}
              variant={order.status === "Stored" ? "default" : "outline"}
              size="lg"
              className={order.status === "Stored" ? "bg-purple-600 hover:bg-purple-700" : ""}
            >
              Stored
            </Button>
          </div>
        </Card>
      </Container>
    </>
  );
}
