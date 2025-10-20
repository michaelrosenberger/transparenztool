"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Card from "@/app/components/Card";

export default function Home() {
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const checkUserAndRedirect = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const occupation = user.user_metadata?.occupation;
        
        // Redirect based on occupation
        if (occupation === "Farmer") {
          router.push("/farmer");
          return;
        } else if (occupation === "Logistik") {
          router.push("/logistik");
          return;
        } else if (occupation === "Enduser") {
          router.push("/enduser");
          return;
        }
      }
      
      setLoading(false);
    };

    checkUserAndRedirect();
  }, [router, supabase.auth]);

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
        <h1 className="text-5xl font-bold mb-4 text-white">
          Welcome to Transparenztool
        </h1>
        <p className="text-xl text-gray-300 mb-8">
          Your platform for supply chain transparency
        </p>

        <Card className="mb-6">
          <h2 className="text-2xl font-semibold mb-4 text-black">Get Started</h2>
          <p className="text-gray-700 mb-4">
            To access your personalized dashboard, please log in and complete your profile 
            by selecting your occupation.
          </p>
          <div className="flex gap-4">
            <button
              onClick={() => router.push("/login")}
              className="rounded-full bg-black text-white font-medium py-3 px-6 hover:bg-gray-800 transition-colors"
            >
              Login
            </button>
            <button
              onClick={() => router.push("/register")}
              className="rounded-full border border-gray-300 text-black font-medium py-3 px-6 hover:bg-gray-100 transition-colors"
            >
              Register
            </button>
          </div>
        </Card>

        <div className="grid gap-6 md:grid-cols-3">
          <Card title="For Farmers 🌾">
            <p className="text-gray-700">
              Manage crops, track shipments, and maintain quality standards with 
              complete transparency.
            </p>
          </Card>

          <Card title="For Logistics 🚚">
            <p className="text-gray-700">
              Optimize routes, manage warehouses, and track deliveries in real-time 
              across your network.
            </p>
          </Card>

          <Card title="For Consumers 🛒">
            <p className="text-gray-700">
              Scan products to see their journey, support sustainable farming, and 
              make informed choices.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
