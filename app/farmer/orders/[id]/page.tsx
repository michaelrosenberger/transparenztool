"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useParams } from "next/navigation";
import Card from "@/app/components/Card";

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
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="text-lg text-white">Loading...</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <Card>
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">Order not found</p>
            <button
              onClick={() => router.push("/farmer/orders")}
              className="rounded-full bg-black text-white font-medium py-2 px-6 hover:bg-gray-800 transition-colors"
            >
              Back to Orders
            </button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 pb-20 sm:p-20 bg-[#0a0a0a]">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-4xl font-bold text-white">Order Details</h1>
          <button
            onClick={() => router.push("/farmer/orders")}
            className="text-gray-300 hover:text-white transition-colors"
          >
            ← Back to Orders
          </button>
        </div>

        {message && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              message.type === "success"
                ? "bg-green-100 border border-green-400 text-green-700"
                : "bg-red-100 border border-red-400 text-red-700"
            }`}
          >
            {message.text}
          </div>
        )}

        <Card className="mb-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-3xl font-bold text-black mb-2">
                {order.order_number}
              </h2>
              <p className="text-gray-600">Farmer: {order.farmer_name}</p>
            </div>
            <span
              className={`px-4 py-2 rounded-full text-sm font-medium border ${getStatusColor(
                order.status
              )}`}
            >
              {order.status}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 py-4 border-t border-b border-gray-200">
            <div>
              <p className="text-sm text-gray-600 mb-1">Created</p>
              <p className="font-medium text-black">{formatDate(order.created_at)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Last Updated</p>
              <p className="font-medium text-black">{formatDate(order.updated_at)}</p>
            </div>
          </div>
        </Card>

        <Card className="mb-6">
          <h3 className="text-2xl font-semibold mb-4 text-black">Order Items</h3>
          <div className="space-y-3">
            {order.items.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-md"
              >
                <span className="font-medium text-black text-lg">{item.vegetable}</span>
                <span className="font-semibold text-black">
                  {item.quantity} kg
                </span>
              </div>
            ))}
            
            <div className="pt-4 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-black text-lg">Total Items:</span>
                <span className="font-bold text-black text-lg">{order.items.length}</span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="font-semibold text-black text-lg">Total Quantity:</span>
                <span className="font-bold text-black text-lg">
                  {getTotalQuantity()} kg
                </span>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="text-2xl font-semibold mb-4 text-black">Update Status</h3>
          <p className="text-gray-600 mb-4">
            Change the order status to track its progress through the supply chain.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => updateStatus("Announced")}
              disabled={updating || order.status === "Announced"}
              className={`py-3 px-4 rounded-lg font-medium transition-colors ${
                order.status === "Announced"
                  ? "bg-blue-100 text-blue-800 border-2 border-blue-300 cursor-not-allowed"
                  : "bg-white text-black border-2 border-gray-300 hover:border-blue-500"
              }`}
            >
              Announced
            </button>
            
            <button
              onClick={() => updateStatus("Delivered")}
              disabled={updating || order.status === "Delivered"}
              className={`py-3 px-4 rounded-lg font-medium transition-colors ${
                order.status === "Delivered"
                  ? "bg-green-100 text-green-800 border-2 border-green-300 cursor-not-allowed"
                  : "bg-white text-black border-2 border-gray-300 hover:border-green-500"
              }`}
            >
              Delivered
            </button>
            
            <button
              onClick={() => updateStatus("Stored")}
              disabled={updating || order.status === "Stored"}
              className={`py-3 px-4 rounded-lg font-medium transition-colors ${
                order.status === "Stored"
                  ? "bg-purple-100 text-purple-800 border-2 border-purple-300 cursor-not-allowed"
                  : "bg-white text-black border-2 border-gray-300 hover:border-purple-500"
              }`}
            >
              Stored
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}
