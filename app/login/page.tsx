"use client";

import { useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Card from "@/app/components/Card";
import Container from "@/app/components/Container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      router.push("/");
      router.refresh();
    } catch (error: any) {
      const errorMessage = error.message || "Ein Fehler ist beim Anmelden aufgetreten";
      
      // Add more specific error messages
      if (error.message?.includes("fetch") || error.message?.includes("quota") || error.message?.includes("403")) {
        setError("Verbindungsfehler: Bitte versuchen Sie es in einigen Minuten erneut.");
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Container dark fullWidth>
        <div className="flex items-center justify-between mb-6 max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <div>
            <h1>Anmelden</h1>
            <p>Melden Sie sich an, um auf Ihr Dashboard zuzugreifen</p>
          </div>
        </div>
      </Container>

      <Container asPage>
        <div className="flex items-center justify-center">
          <div className="w-full">
            <Card>
              {error && (
                <div className="mb-4 p-3 bg-destructive/15 border border-destructive text-destructive rounded-md">
                  {error}
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">E-Mail</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="ihre@email.de"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Passwort</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full"
                  size="lg"
                >
                  {loading ? "Wird angemeldet..." : "Anmelden"}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p>
                  Noch kein Konto?{" "}
                  <Link
                    href="/register"
                    className="font-medium hover:underline"
                  >
                    Hier registrieren
                  </Link>
                </p>
              </div>
            </Card>
          </div>
        </div>
      </Container>
    </>
  );
}
