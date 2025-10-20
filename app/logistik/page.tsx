"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Card from "@/app/components/Card";

interface StorageSummary {
  vegetable: string;
  total_quantity: number;
}

export default function LogistikPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [storageSummary, setStorageSummary] = useState<StorageSummary[]>([]);
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
      if (occupation !== "Logistik") {
        router.push("/");
        return;
      }

      setUser(user);
      await loadStorageSummary();
      setLoading(false);
      setMounted(true);
    };

    checkUser();
  }, [router, supabase.auth]);

  const loadStorageSummary = async () => {
    try {
      const { data, error } = await supabase
        .from("storage")
        .select("vegetable, quantity");

      if (error) {
        console.error("Supabase error:", error);
        console.error("Error code:", error.code);
        console.error("Error message:", error.message);
        console.error("Error hint:", error.hint);
        console.error("Error details:", error.details);
        throw error;
      }

      // If no data, just set empty array
      if (!data || data.length === 0) {
        setStorageSummary([]);
        return;
      }

      // Group by vegetable and sum quantities
      const summary: { [key: string]: number } = {};
      data.forEach((item: any) => {
        if (summary[item.vegetable]) {
          summary[item.vegetable] += item.quantity;
        } else {
          summary[item.vegetable] = item.quantity;
        }
      });

      // Convert to array and sort by quantity descending
      const summaryArray = Object.entries(summary).map(([vegetable, total_quantity]) => ({
        vegetable,
        total_quantity,
      })).sort((a, b) => b.total_quantity - a.total_quantity);

      setStorageSummary(summaryArray);
    } catch (error: any) {
      console.error("Error loading storage summary:", error);
      console.error("Error message:", error?.message);
      console.error("Error details:", error?.details);
      // Set empty array on error so UI still works
      setStorageSummary([]);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="text-lg text-white">Loading...</div>
      </div>
    );
  }

  const fullName = user?.user_metadata?.full_name || "Logistics Partner";

  return (
    <div className="min-h-screen p-8 pb-20 sm:p-20 bg-[#0a0a0a]">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-5xl font-bold mb-4 text-white">
          Welcome, {fullName}! 🚚
        </h1>
        <p className="text-xl text-gray-300 mb-8">
          Your Logistics Dashboard
        </p>

        {/* Storage Inventory Summary */}
        {mounted && (
          <Card className="mb-6">
            <h2 className="text-2xl font-semibold mb-4 text-black">Storage Inventory</h2>
            {storageSummary.length === 0 ? (
              <p className="text-gray-600 text-center py-8">No items in storage yet</p>
            ) : (
              <div className="space-y-3">
                {storageSummary.map((item) => (
                  <div
                    key={item.vegetable}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                        <span className="text-xl">🥬</span>
                      </div>
                      <span className="font-medium text-black text-lg">{item.vegetable}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-black text-xl">{item.total_quantity}</span>
                      <span className="text-gray-600 ml-1">kg</span>
                    </div>
                  </div>
                ))}
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-black text-lg">Total in Storage:</span>
                    <span className="font-bold text-black text-xl">
                      {storageSummary.reduce((sum, item) => sum + item.total_quantity, 0)} kg
                    </span>
                  </div>
                </div>
              </div>
            )}
          </Card>
        )}

        {/* Order Management Sections */}
        <div className="grid gap-6 md:grid-cols-2 mb-6">
          <Card title="Delivered Orders">
            <p className="text-gray-700 mb-4">
              Review and accept orders that have been delivered by farmers. 
              Verify order details and accept them for logistics processing.
            </p>
            <button
              onClick={() => router.push("/logistik/orders/delivered")}
              className="w-full rounded-full bg-black text-white font-medium py-2 px-4 hover:bg-gray-800 transition-colors"
            >
              View Delivered Orders
            </button>
          </Card>

          <Card title="Accepted Orders">
            <p className="text-gray-700 mb-4">
              View all orders that have been accepted for logistics processing. 
              These orders are read-only and cannot be modified.
            </p>
            <button
              onClick={() => router.push("/logistik/orders/accepted")}
              className="w-full rounded-full bg-black text-white font-medium py-2 px-4 hover:bg-gray-800 transition-colors"
            >
              View Accepted Orders
            </button>
          </Card>
        </div>

      </div>
    </div>
  );
}
