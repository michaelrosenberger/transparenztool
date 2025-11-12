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
    <>
      <Container dark fullWidth>
        <div className="flex items-center justify-between mb-6 max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="">
            <h1>Welcome, {fullName}!</h1>
            <p>Your Consumer Dashboard</p>
          </div>
        </div>
      </Container>

      <Container asPage>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <h2 className="mb-4">Scan Meal QR Code</h2>
              <p className="mb-6">
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
              <h2 className="mb-4">Demo QR Code</h2>
              <p className="mb-6">
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
              <h2 className="mb-4">View Demo Meal</h2>
              <p className="mb-6">
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
    </>
  );
}
