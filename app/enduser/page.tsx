"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Card from "@/app/components/Card";
import Container from "@/app/components/Container";
import PageSkeleton from "@/app/components/PageSkeleton";
import { Button } from "@/components/ui/button";
import { QrCode } from "lucide-react";

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
    return <PageSkeleton />;
  }

  const fullName = user?.user_metadata?.full_name || "Customer";

  return (
    <div className="min-h-screen p-8 pb-20 sm:p-20 bg-background">
      <Container>
        <h1 className="text-5xl font-bold mb-4">
          Welcome, {fullName}! 🛒
        </h1>
        <p className="text-xl text-muted-foreground mb-8">
          Your Consumer Dashboard
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <h2 className="text-2xl font-semibold mb-4 text-black">Scan Meal QR Code</h2>
            <p className="text-gray-700 mb-6">
              Scan the QR code on your meal package to discover detailed information about its ingredients, 
              the farmers who grew the vegetables, and trace the journey from farm to your table.
            </p>
            <Button 
              onClick={() => router.push("/enduser/scan")}
              size="lg"
              className="w-full"
            >
              <QrCode className="mr-2 h-5 w-5" />
              Scan QR Code
            </Button>
          </Card>

          <Card>
            <h2 className="text-2xl font-semibold mb-4 text-black">Demo QR Code</h2>
            <p className="text-gray-700 mb-6">
              View a demo QR code to test the scanning functionality and see how meal information is displayed.
            </p>
            <Button 
              onClick={() => router.push("/enduser/demo-qr")}
              size="lg"
              variant="outline"
              className="w-full"
            >
              View Demo QR
            </Button>
          </Card>

          <Card>
            <h2 className="text-2xl font-semibold mb-4 text-black">View Demo Meal</h2>
            <p className="text-gray-700 mb-6">
              Skip the scanning and directly view a sample meal with all details including ingredients, sources, and map.
            </p>
            <Button 
              onClick={() => router.push("/enduser/meal/meal-001")}
              size="lg"
              variant="outline"
              className="w-full"
            >
              View Demo Meal
            </Button>
          </Card>
        </div>
      </Container>
    </div>
  );
}
