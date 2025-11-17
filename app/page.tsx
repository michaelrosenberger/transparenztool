"use client";

import { useEffect, useState, useMemo, Suspense } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import Card from "@/app/components/Card";
import Container from "@/app/components/Container";
import PageSkeleton from "@/app/components/PageSkeleton";
import { Button } from "@/components/ui/button";

function HomeContent() {
  const [loading, setLoading] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    // Check if user just registered
    if (searchParams.get("registered") === "true") {
      setShowSuccess(true);
      // Clean up URL
      setShowSuccess(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

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
    return <PageSkeleton />;
  }

  return (
    <>
      <Container dark fullWidth>
        <div className="flex items-center justify-between mb-6 max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <div>
            <h1>Willkommen beim Transparenztool</h1>
            <p>Ihre Plattform für Lieferkettentransparenz</p>
          </div>
        </div>
      </Container>

      <Container asPage>
        {showSuccess && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200 rounded-md">
            <h3 className="mb-1">Registrierung erfolgreich!</h3>
            <p className="text-sm">Überprüfen Sie Ihre E-Mail, um Ihr Konto zu bestätigen.</p>
          </div>
        )}

        <Card className="mb-6">
          <h2 className="mb-4">Erste Schritte</h2>
          <p className="mb-4">
            Um auf Ihr persönliches Dashboard zuzugreifen, melden Sie sich bitte an und vervollständigen Sie Ihr Profil, 
            indem Sie Ihre Tätigkeit auswählen.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={() => router.push("/register")}
              size="lg"
              className="w-full sm:w-auto"
            >
              Loslegen
            </Button>
            <Button
              onClick={() => router.push("/login")}
              variant="outline"
              size="lg"
              className="w-full sm:w-auto"
            >
              Anmelden
            </Button>
          </div>
        </Card>
      </Container>
    </>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <HomeContent />
    </Suspense>
  );
}
