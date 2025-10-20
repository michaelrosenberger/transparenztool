"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Card from "@/app/components/Card";
import Link from "next/link";

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Announced":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "Delivered":
        return "bg-green-100 text-green-800 border-green-200";
      case "Stored":
        return "bg-purple-100 text-purple-800 border-purple-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
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
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="text-lg text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 pb-20 sm:p-20 bg-[#0a0a0a]">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-4xl font-bold text-white">My Orders</h1>
          <div className="flex gap-4">
            <button
              onClick={() => router.push("/farmer")}
              className="text-gray-300 hover:text-white transition-colors"
            >
              ← Back to Dashboard
            </button>
            <Link
              href="/farmer/orders/new"
              className="rounded-full bg-white text-black font-medium py-2 px-6 hover:bg-gray-200 transition-colors"
            >
              + New Order
            </Link>
          </div>
        </div>

        {orders.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <p className="text-gray-600 mb-4">No orders yet</p>
              <Link
                href="/farmer/orders/new"
                className="inline-block rounded-full bg-black text-white font-medium py-3 px-6 hover:bg-gray-800 transition-colors"
              >
                Create Your First Order
              </Link>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order.id}>
                <Link href={`/farmer/orders/${order.id}`}>
                  <div className="cursor-pointer hover:bg-gray-50 transition-colors p-2 -m-2 rounded-md">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-xl font-semibold text-black mb-1">
                          {order.order_number}
                        </h3>
                        <p className="text-sm text-gray-500">
                          Created: {formatDate(order.created_at)}
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(
                          order.status
                        )}`}
                      >
                        {order.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                      <div>
                        <p className="text-sm text-gray-600">Items</p>
                        <p className="font-semibold text-black">{order.items.length}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Total Quantity</p>
                        <p className="font-semibold text-black">
                          {getTotalQuantity(order.items)} kg
                        </p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-sm text-gray-600">Vegetables</p>
                        <p className="font-semibold text-black">
                          {order.items.map((item) => item.vegetable).join(", ")}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <span className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                        View Details →
                      </span>
                    </div>
                  </div>
                </Link>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
