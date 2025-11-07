"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Card from "@/app/components/Card";
import Container from "@/app/components/Container";
import PageSkeleton from "@/app/components/PageSkeleton";
import { Button } from "@/components/ui/button";

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
    return <PageSkeleton />;
  }

  const fullName = user?.user_metadata?.full_name || "Farmer";

  return (
    <Container asPage>
        <h1 className="mb-4">
          Welcome, {fullName}!
        </h1>
        <p className="text-xl mb-8">
          Your Farmer Dashboard
        </p>

        {/* Order Management Section */}
        <Card className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2>Order Management</h2>
          </div>
          <p className="mb-4">
            Create and manage your vegetable orders. Track order status from announcement 
            to delivery and storage.
          </p>
          <div className="flex gap-4">
            <Button
              onClick={() => router.push("/farmer/orders/new")}
              size="lg"
              className="flex-1"
            >
              + Create New Order
            </Button>
            <Button
              onClick={() => router.push("/farmer/orders")}
              variant="outline"
              size="lg"
              className="flex-1"
            >
              View All Orders
            </Button>
          </div>
        </Card>

      </Container>
    );
}
