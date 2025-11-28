"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Container from "@/app/components/Container";
import Card from "@/app/components/Card";
import PageSkeleton from "@/app/components/PageSkeleton";
import { Button } from "@/components/ui/button";
import { UtensilsCrossed, Menu, Leaf, Users, ListOrdered } from "lucide-react";
import Link from "next/link";

export default function AdminPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      try {
        // First check if we have a client-side session
        const supabase = createClient();
        const { data: { user: clientUser } } = await supabase.auth.getUser();
        
        if (!clientUser) {
          console.log('[ADMIN] No client user, redirecting to login');
          router.push("/login");
          return;
        }

        console.log('[ADMIN] Client user found:', clientUser.id);

        // Now check admin status via API
        const response = await fetch('/api/auth/check');
        
        if (!response.ok) {
          console.error('[ADMIN] Auth check failed:', response.statusText);
          router.push("/");
          return;
        }

        const { user: apiUser, isAdmin } = await response.json();
        
        console.log('[ADMIN] API response - user:', !!apiUser, 'isAdmin:', isAdmin);

        if (!apiUser) {
          console.log('[ADMIN] No API user, redirecting to login');
          router.push("/login");
          return;
        }

        if (!isAdmin) {
          console.log('[ADMIN] Not admin, redirecting to home');
          router.push("/");
          return;
        }

        console.log('[ADMIN] Access granted');
        setUser(apiUser);
        setLoading(false);
      } catch (error) {
        console.error('[ADMIN] Error in checkUser:', error);
        router.push("/");
      }
    };

    checkUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return <PageSkeleton />;
  }

  const fullName = user?.user_metadata?.full_name || "Admin";

  return (
    <>
      <Container dark fullWidth>
        <div className="flex items-center justify-between mb-6 max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <div>
            <h1>Admin Dashboard</h1>
            <p>Willkommen, {fullName}!</p>
          </div>
        </div>
      </Container>

      <Container asPage>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Create New Meal */}
          <Link href="/admin/meals" className="no-underline">
            <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex flex-col items-center text-center p-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <UtensilsCrossed className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl mb-2">Neue Mahlzeit</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Erstellen Sie neue Mahlzeiten mit Zutaten von Produzenten
                </p>
                <Button className="w-full">
                  Mahlzeit erstellen
                </Button>
              </div>
            </Card>
          </Link>

          {/* View All Meals */}
          <Link href="/admin/meals/all"  className="no-underline">
            <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex flex-col items-center text-center p-4">
                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                  <ListOrdered className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl mb-2">Alle Mahlzeiten</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Verwalten und bearbeiten Sie alle erstellten Mahlzeiten
                </p>
                <Button variant="default" className="w-full">
                  Mahlzeiten anzeigen
                </Button>
              </div>
            </Card>
          </Link>

          {/* Create New Menu */}
          <Link href="/admin/menus"  className="no-underline">
            <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex flex-col items-center text-center p-4">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                  <Menu className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl mb-2">Neues Menü</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Erstellen Sie Tagesmenüs mit mehreren Mahlzeiten
                </p>
                <Button variant="default" className="w-full">
                  Menü erstellen
                </Button>
              </div>
            </Card>
          </Link>

          {/* View All Menus */}
          <Link href="/admin/menus/all"  className="no-underline">
            <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex flex-col items-center text-center p-4">
                <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center mb-4">
                  <ListOrdered className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="text-xl mb-2">Alle Menüs</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Verwalten Sie alle Tagesmenüs und setzen Sie das aktuelle Menü
                </p>
                <Button variant="default" className="w-full">
                  Menüs anzeigen
                </Button>
              </div>
            </Card>
          </Link>

          {/* Manage Ingredients */}
          <Link href="/admin/zutaten"  className="no-underline">
            <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex flex-col items-center text-center p-4">
                <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center mb-4">
                  <Leaf className="h-8 w-8 text-orange-600" />
                </div>
                <h3 className="text-xl mb-2">Zutaten verwalten</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Fügen Sie neue Zutaten hinzu und verwalten Sie die Verfügbarkeit
                </p>
                <Button variant="default" className="w-full">
                  Zutaten verwalten
                </Button>
              </div>
            </Card>
          </Link>

          {/* User Overview */}
          <Link href="/admin/overview" className="no-underline">
            <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex flex-col items-center text-center p-4">
                <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
                  <Users className="h-8 w-8 text-red-600" />
                </div>
                <h3 className="text-xl mb-2">Benutzer-Übersicht</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Statistiken und Verwaltung aller Benutzer
                </p>
                <Button variant="default" className="w-full">
                  Übersicht anzeigen
                </Button>
              </div>
            </Card>
          </Link>
        </div>
      </Container>
    </>
  );
}
