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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

type Occupation = "Produzenten" | "Logistik" | "Enduser";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [occupation, setOccupation] = useState<Occupation | "">("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // TEMPORARY: Registration disabled
    setError("Registrierung ist vorübergehend deaktiviert. Bitte kontaktieren Sie den Administrator.");
    setLoading(false);
    return;

    // Validate passwords match
    if (password !== confirmPassword) {
      setError("Passwörter stimmen nicht überein");
      setLoading(false);
      return;
    }

    // Validate password length
    if (password.length < 6) {
      setError("Passwort muss mindestens 6 Zeichen lang sein");
      setLoading(false);
      return;
    }

    // Validate occupation
    if (!occupation) {
      setError("Bitte wählen Sie eine Tätigkeit aus");
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            occupation: occupation,
          },
        },
      });

      if (error) throw error;

      // Redirect to home and show success message
      router.push("/?registered=true");
      router.refresh();
    } catch (error: any) {
      setError(error.message || "Ein Fehler ist bei der Registrierung aufgetreten");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Container dark fullWidth>
        <div className="flex items-center justify-between mb-6 max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <div>
            <h1>Registrieren</h1>
            <p>Erstellen Sie Ihr Konto, um loszulegen</p>
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

              <form onSubmit={handleRegister} className="space-y-4">
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
                  <Label htmlFor="occupation">Tätigkeit</Label>
                  <Select
                    value={occupation}
                    onValueChange={(value) => setOccupation(value as Occupation)}
                  >
                    <SelectTrigger className="w-full text-left">
                      <SelectValue placeholder="Tätigkeit" />
                    </SelectTrigger>
                    <SelectContent className="w-full">
                      <SelectItem value="Produzenten">Produzent</SelectItem>
                      <SelectItem value="Logistik">Logistik</SelectItem>
                      <SelectItem value="Enduser">Endverbraucher</SelectItem>
                    </SelectContent>
                  </Select>
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
                  <p className="text-xs">
                    Muss mindestens 6 Zeichen lang sein
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Passwort bestätigen</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
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
                  {loading ? "Konto wird erstellt..." : "Registrieren"}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p>
                  Bereits ein Konto?{" "}
                  <Link
                    href="/login"
                    className="font-medium hover:underline"
                  >
                    Hier anmelden
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
