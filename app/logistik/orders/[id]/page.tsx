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

export default function LogistikOrderDetailPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<Order | null>(null);
  const [accepting, setAccepting] = useState(false);
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
      if (occupation !== "Logistik") {
        router.push("/");
        return;
      }

      setUser(user);
      await loadOrder(orderId);
      setLoading(false);
    };

    checkUserAndLoadOrder();
  }, [orderId, router, supabase.auth]);

  const loadOrder = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      setOrder(data);
    } catch (error) {
      console.error("Error loading order:", error);
      setMessage({ type: "error", text: "Order not found" });
    }
  };

  const acceptOrder = async () => {
    if (!order) return;

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

      setMessage({ type: "success", text: "Order accepted and added to storage successfully!" });
      
      // Redirect to accepted orders after 2 seconds
      setTimeout(() => {
        router.push("/logistik/orders/accepted");
      }, 2000);
    } catch (error: any) {
      setMessage({ type: "error", text: error.message || "Failed to accept order" });
    } finally {
      setAccepting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Announced":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "Delivered":
        return "bg-green-100 text-green-800 border-green-200";
      case "Accepted":
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
              onClick={() => router.push("/logistik/orders/delivered")}
              className="rounded-full bg-black text-white font-medium py-2 px-6 hover:bg-gray-800 transition-colors"
            >
              Back to Delivered Orders
            </button>
          </div>
        </Card>
      </div>
    );
  }

  const isDelivered = order.status === "Delivered";

  return (
    <div className="min-h-screen p-8 pb-20 sm:p-20 bg-[#0a0a0a]">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-4xl font-bold text-white">Order Details</h1>
          <button
            onClick={() => router.push(isDelivered ? "/logistik/orders/delivered" : "/logistik/orders/accepted")}
            className="text-gray-300 hover:text-white transition-colors"
          >
            ← Back
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
              <p className="text-gray-600 text-lg">Farmer: {order.farmer_name}</p>
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

        {isDelivered && (
          <Card>
            <h3 className="text-2xl font-semibold mb-4 text-black">Accept Order</h3>
            <p className="text-gray-600 mb-4">
              Review the order details above and accept the delivery to proceed with logistics processing.
            </p>
            
            <button
              onClick={acceptOrder}
              disabled={accepting}
              className="w-full rounded-full bg-black text-white font-medium py-3 px-6 hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {accepting ? "Accepting..." : "Accept Order"}
            </button>
          </Card>
        )}

        {order.status === "Accepted" && (
          <Card>
            <div className="text-center py-4">
              <p className="text-green-700 font-medium">
                ✓ This order has been accepted and cannot be modified
              </p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
