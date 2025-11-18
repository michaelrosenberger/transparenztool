"use client";

import { useEffect, useState, useMemo } from "react";
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
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push("/login");
        return;
      }

      const occupation = user.user_metadata?.occupation;
      if (occupation !== "Produzenten") {
        router.push("/");
        return;
      }

      setUser(user);
      setLoading(false);
    };

    checkUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return <PageSkeleton />;
  }

  const fullName = user?.user_metadata?.full_name || "Produzent";

  return (
    <>
      <Container dark fullWidth>
        <div className="flex items-center justify-between mb-6 max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <div>
            <h1>Willkommen, {fullName}!</h1>
            <p>Ihr Produzenten-Dashboard</p>
          </div>
        </div>
      </Container>

      <Container asPage>

        {/* Business Profile Section */}
        <Card className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2>Geschäftsprofil</h2>
          </div>
          <p className="mb-4">
            Verwalten Sie Ihre Geschäftsinformationen, Adresse, Produktsortiment und Bilder. 
            Diese Informationen werden auf der öffentlichen Produzentenliste angezeigt.
          </p>
          <Button
            onClick={() => router.push("/produzenten/business")}
            variant="outline"
            size="lg"
            className="w-full sm:w-auto"
          >
            Geschäftsprofil bearbeiten
          </Button>
        </Card>

        {/* Order Management Section */}
        <Card className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2>Bestellverwaltung</h2>
          </div>
          <p className="mb-4">
            Erstellen und verwalten Sie Ihre Zutatenbestellungen. Verfolgen Sie den Bestellstatus von der Ankündigung 
            bis zur Lieferung und Lagerung.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={() => router.push("/produzenten/orders/new")}
              size="lg"
              className="w-full sm:w-auto"
            >
              + Neue Bestellung erstellen
            </Button>
            <Button
              onClick={() => router.push("/produzenten/orders")}
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
