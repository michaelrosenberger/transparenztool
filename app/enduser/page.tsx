"use client";

import { useState, useEffect, useMemo } from "react";
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
  const supabase = useMemo(() => createClient(), []);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return <PageSkeleton />;
  }

  const fullName = user?.user_metadata?.full_name || "Kunde";

  return (
    <>
      <Container dark fullWidth>
        <div className="flex items-center justify-between mb-6 max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="">
            <h1>Willkommen, {fullName}!</h1>
            <p>Ihr Verbraucher-Dashboard</p>
          </div>
        </div>
      </Container>

      <Container asPage>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <h2 className="mb-4">Mahlzeit QR-Code scannen</h2>
              <p className="mb-6">
                Scannen Sie den QR-Code auf Ihrer Mahlzeitverpackung, um detaillierte Informationen über die Zutaten, 
                die Landwirte, die das Gemüse angebaut haben, und die Reise vom Bauernhof bis zu Ihrem Tisch zu erfahren.
              </p>
              <Button 
                onClick={() => router.push("/enduser/scan")}
                size="lg"
                className="w-full"
              >
                <QrCode className="mr-2 h-5 w-5" />
                QR-Code scannen
              </Button>
            </Card>

            <Card>
              <h2 className="mb-4">Demo QR-Code</h2>
              <p className="mb-6">
                Zeigen Sie einen Demo-QR-Code an, um die Scanfunktion zu testen und zu sehen, wie Mahlzeitinformationen angezeigt werden.
              </p>
              <Button 
                onClick={() => router.push("/enduser/demo-qr")}
                size="lg"
                variant="outline"
                className="w-full"
              >
                Demo-QR anzeigen
              </Button>
            </Card>

            <Card>
              <h2 className="mb-4">Demo-Mahlzeit anzeigen</h2>
              <p className="mb-6">
                Überspringen Sie das Scannen und sehen Sie sich direkt eine Beispielmahlzeit mit allen Details einschließlich Zutaten, Quellen und Karte an.
              </p>
              <Button 
                onClick={() => router.push("/enduser/meal/meal-001")}
                size="lg"
                variant="outline"
                className="w-full"
              >
                Demo-Mahlzeit anzeigen
              </Button>
            </Card>
          </div>
      </Container>
    </>
  );
}
