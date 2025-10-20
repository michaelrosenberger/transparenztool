"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Card from "@/app/components/Card";

export default function EnduserPage() {
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
      if (occupation !== "Enduser") {
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

  const fullName = user?.user_metadata?.full_name || "Customer";

  return (
    <div className="min-h-screen p-8 pb-20 sm:p-20 bg-[#0a0a0a]">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-5xl font-bold mb-4 text-white">
          Welcome, {fullName}! 🛒
        </h1>
        <p className="text-xl text-gray-300 mb-8">
          Your Consumer Dashboard
        </p>

        <Card>
          <h2 className="text-2xl font-semibold mb-4 text-black">Coming Soon</h2>
          <p className="text-gray-700">
            Consumer features are currently in development. Soon you'll be able to scan products, 
            track orders, and view the complete journey of your food from farm to table.
          </p>
        </Card>
      </div>
    </div>
  );
}
