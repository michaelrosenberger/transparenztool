"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Card from "@/app/components/Card";
import Container from "@/app/components/Container";
import PageSkeleton from "@/app/components/PageSkeleton";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Order {
  id: string;
  order_number: string;
  status: string;
  items: Array<{ vegetable: string; quantity: number }>;
  created_at: string;
  updated_at: string;
}

export default function OrdersListPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const checkUserAndLoadOrders = async () => {
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
      await loadOrders(user.id);
      setLoading(false);
    };

    checkUserAndLoadOrders();
  }, [router, supabase.auth]);

  const loadOrders = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error("Error loading orders:", error);
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
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTotalQuantity = (items: Array<{ vegetable: string; quantity: number }>) => {
    return items.reduce((sum, item) => sum + item.quantity, 0);
  };

  if (loading) {
    return <PageSkeleton />;
  }

  return (
    <Container asPage>
        <div className="flex items-center justify-between mb-6">
          <h1 className="mb-4">My Orders</h1>
          <div className="flex gap-4">
            <Button
              onClick={() => router.push("/farmer")}
              variant="ghost"
              className="hover:text-foreground"
            >
              ← Back to Dashboard
            </Button>
            <Button asChild variant="outline">
              <Link href="/farmer/orders/new">
                + New Order
              </Link>
            </Button>
          </div>
        </div>

        {orders.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <p className="mb-4">No orders yet</p>
              <Button asChild size="lg">
                <Link href="/farmer/orders/new">
                  Create Your First Order
                </Link>
              </Button>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order.id}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="mb-1">
                      {order.order_number}
                    </h3>
                    <p>
                      Created: {formatDate(order.created_at)}
                    </p>
                  </div>
                  <Badge variant={getStatusVariant(order.status) as any}>
                    {order.status}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                  <div>
                    <p>Items</p>
                    <p className="font-semibold text-black">{order.items.length}</p>
                  </div>
                  <div>
                    <p>Total Quantity</p>
                    <p className="font-semibold text-black">
                      {getTotalQuantity(order.items)} kg
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p>Vegetables</p>
                    <p className="font-semibold text-black">
                      {order.items.map((item) => item.vegetable).join(", ")}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <Button asChild variant="ghost" size="sm">
                    <Link href={`/farmer/orders/${order.id}`}>
                      View Details →
                    </Link>
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
    </Container>
  );
}
