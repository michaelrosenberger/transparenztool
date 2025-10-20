"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Card from "@/app/components/Card";

export default function FarmerPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
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
      setLoading(false);
    };

    checkUser();
  }, [router, supabase.auth]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="text-lg text-white">Loading...</div>
      </div>
    );
  }

  const fullName = user?.user_metadata?.full_name || "Farmer";

  return (
    <div className="min-h-screen p-8 pb-20 sm:p-20 bg-[#0a0a0a]">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-5xl font-bold mb-4 text-white">
          Welcome, {fullName}! 🌾
        </h1>
        <p className="text-xl text-gray-300 mb-8">
          Your Farmer Dashboard
        </p>

        {/* Order Management Section */}
        <Card className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold text-black">Order Management</h2>
          </div>
          <p className="text-gray-700 mb-4">
            Create and manage your vegetable orders. Track order status from announcement 
            to delivery and storage.
          </p>
          <div className="flex gap-4">
            <button
              onClick={() => router.push("/farmer/orders/new")}
              className="flex-1 rounded-full bg-black text-white font-medium py-3 px-4 hover:bg-gray-800 transition-colors"
            >
              + Create New Order
            </button>
            <button
              onClick={() => router.push("/farmer/orders")}
              className="flex-1 rounded-full border border-gray-300 bg-white text-black font-medium py-3 px-4 hover:bg-gray-100 transition-colors"
            >
              View All Orders
            </button>
          </div>
        </Card>

      </div>
    </div>
  );
}
