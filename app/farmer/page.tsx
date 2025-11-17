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

  const fullName = user?.user_metadata?.full_name || "Landwirt";

  return (
    <>
      <Container dark fullWidth>
        <div className="flex items-center justify-between mb-6 max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <div>
            <h1>Willkommen, {fullName}!</h1>
            <p>Ihr Landwirt-Dashboard</p>
          </div>
        </div>
      </Container>

      <Container asPage>

        {/* Order Management Section */}
        <Card className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2>Bestellverwaltung</h2>
          </div>
          <p className="mb-4">
            Erstellen und verwalten Sie Ihre Gemüsebestellungen. Verfolgen Sie den Bestellstatus von der Ankündigung 
            bis zur Lieferung und Lagerung.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={() => router.push("/farmer/orders/new")}
              size="lg"
              className="w-full sm:w-auto"
            >
              + Neue Bestellung erstellen
            </Button>
            <Button
              onClick={() => router.push("/farmer/orders")}
              variant="outline"
              size="lg"
              className="w-full sm:w-auto"
            >
              Alle Bestellungen anzeigen
            </Button>
          </div>
        </Card>
      </Container>
    </>
  );
}
