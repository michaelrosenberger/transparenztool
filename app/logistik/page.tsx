"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Card from "@/app/components/Card";
import Container from "@/app/components/Container";
import PageSkeleton from "@/app/components/PageSkeleton";
import { Button } from "@/components/ui/button";
import { StorageDataTable } from "./storage-data-table";
import { columns } from "./storage-columns";

interface StorageSummary {
  vegetable: string;
  total_quantity: number;
}

export default function LogistikPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [storageSummary, setStorageSummary] = useState<StorageSummary[]>([]);
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
      if (occupation !== "Logistik") {
        router.push("/");
        return;
      }

      setUser(user);
      await loadStorageSummary();
      setLoading(false);
      setMounted(true);
    };

    checkUser();
  }, [router, supabase.auth]);

  const loadStorageSummary = async () => {
    try {
      const { data, error } = await supabase
        .from("storage")
        .select("vegetable, quantity");

      if (error) {
        console.error("Supabase error:", error);
        console.error("Error code:", error.code);
        console.error("Error message:", error.message);
        console.error("Error hint:", error.hint);
        console.error("Error details:", error.details);
        throw error;
      }

      // If no data, just set empty array
      if (!data || data.length === 0) {
        setStorageSummary([]);
        return;
      }

      // Group by vegetable and sum quantities
      const summary: { [key: string]: number } = {};
      data.forEach((item: any) => {
        if (summary[item.vegetable]) {
          summary[item.vegetable] += item.quantity;
        } else {
          summary[item.vegetable] = item.quantity;
        }
      });

      // Convert to array and sort by quantity descending
      const summaryArray = Object.entries(summary).map(([vegetable, total_quantity]) => ({
        vegetable,
        total_quantity,
      })).sort((a, b) => b.total_quantity - a.total_quantity);

      setStorageSummary(summaryArray);
    } catch (error: any) {
      console.error("Error loading storage summary:", error);
      console.error("Error message:", error?.message);
      console.error("Error details:", error?.details);
      // Set empty array on error so UI still works
      setStorageSummary([]);
    }
  };

  if (loading) {
    return <PageSkeleton />;
  }

  const fullName = user?.user_metadata?.full_name || "Logistikpartner";

  return (
    <>
      <Container dark fullWidth>
        <div className="flex items-center justify-between mb-6 max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <div>
            <h1>Willkommen, {fullName}!</h1>
            <p>Ihr Logistik-Dashboard</p>
          </div>
        </div>
      </Container>

      <Container asPage>

        {/* Storage Inventory Summary */}
        {mounted && (
          <Card className="mb-6">
            <h3 className="mb-4">Lagerbestand</h3>
            <StorageDataTable columns={columns} data={storageSummary} />
            {storageSummary.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-black text-base">Gesamt im Lager:</span>
                  <span className="font-medium text-black text-xl">
                    {storageSummary.reduce((sum, item) => sum + item.total_quantity, 0)} kg
                  </span>
                </div>
              </div>
            )}
          </Card>
        )}

        {/* Order Management Sections */}
        <div className="grid gap-6 md:grid-cols-2 mb-6">
          <Card title="Gelieferte Bestellungen">
            <p className="mb-4">
              Überprüfen und akzeptieren Sie Bestellungen, die von Landwirten geliefert wurden. 
              Verifizieren Sie die Bestelldetails und akzeptieren Sie sie für die Logistikverarbeitung.
            </p>
            <Button
              onClick={() => router.push("/logistik/orders/delivered")}
              className="w-full"
            >
              Gelieferte Bestellungen anzeigen
            </Button>
          </Card>

          <Card title="Akzeptierte Bestellungen">
            <p className="mb-4">
              Zeigen Sie alle Bestellungen an, die für die Logistikverarbeitung akzeptiert wurden. 
              Diese Bestellungen sind schreibgeschützt und können nicht geändert werden.
            </p>
            <Button
              onClick={() => router.push("/logistik/orders/accepted")}
              className="w-full"
            >
              Akzeptierte Bestellungen anzeigen
            </Button>
          </Card>
        </div>

      </Container>
    </>
  );
}
