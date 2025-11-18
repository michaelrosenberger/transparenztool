"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Card from "@/app/components/Card";
import Container from "@/app/components/Container";
import PageSkeleton from "@/app/components/PageSkeleton";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Order {
  id: string;
  order_number: string;
  status: string;
  items: Array<{ vegetable: string; quantity: number }>;
  created_at: string;
  updated_at: string;
}

export default function OrdersListPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    const checkUserAndLoadOrders = async () => {
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
      await loadOrders(user.id);
      setLoading(false);
    };

    checkUserAndLoadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadOrders = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error("Error loading orders:", error);
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "Announced":
        return "announced";
      case "Delivered":
        return "delivered";
      case "Accepted":
        return "accepted";
      case "Stored":
        return "stored";
      default:
        return "outline";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "Announced":
        return "Angekündigt";
      case "Delivered":
        return "Geliefert";
      case "Accepted":
        return "Akzeptiert";
      case "Stored":
        return "Gelagert";
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("de-DE", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTotalQuantity = (items: Array<{ vegetable: string; quantity: number }>) => {
    return items.reduce((sum, item) => sum + item.quantity, 0);
  };

  if (loading) {
    return <PageSkeleton />;
  }

  return (
    <>
      <Container dark fullWidth>
        <div className="flex items-center justify-between mb-6 max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <div>
            <h1>Meine Bestellungen</h1>
            <p>Verwalten und verfolgen Sie alle Ihre Zutatenbestellungen</p>
          </div>
        </div>
      </Container>

      <Container asPage>

        {orders.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <p className="mb-4">Noch keine Bestellungen</p>
              <Button asChild size="lg">
                <Link href="/produzenten/orders/new">
                  Erste Bestellung erstellen
                </Link>
              </Button>
            </div>
          </Card>
        ) : (
          <Card>
            <h3 className="mb-4">Bestellungen</h3>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bestellnummer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Artikel</TableHead>
                    <TableHead>Gesamtmenge</TableHead>
                    <TableHead className="hidden md:table-cell">Zutaten</TableHead>
                    <TableHead>Erstellt</TableHead>
                    <TableHead className="text-right">Aktionen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">
                        {order.order_number}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(order.status) as any}>
                          {getStatusLabel(order.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>{order.items.length}</TableCell>
                      <TableCell>{getTotalQuantity(order.items)} kg</TableCell>
                      <TableCell className="hidden md:table-cell max-w-xs truncate">
                        {order.items.map((item) => item.vegetable).join(", ")}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {formatDate(order.created_at)}
                      </TableCell>
                      <TableCell className="text-right pr-0">
                        <Button asChild variant="ghost" size="sm">
                          <Link href={`/produzenten/orders/${order.id}`}>
                            Details →
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        )}
      </Container>
    </>
  );
}
