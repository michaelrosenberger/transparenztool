"use client";

import { useState } from "react";
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

type Occupation = "Farmer" | "Logistik" | "Enduser";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [occupation, setOccupation] = useState<Occupation | "">("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Validate passwords match
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    // Validate password length
    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      setLoading(false);
      return;
    }

    // Validate occupation
    if (!occupation) {
      setError("Please select an occupation");
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

      toast.success("Registration successful!", {
        description: "Check your email to confirm your account.",
      });
      
      // If email confirmation is disabled, redirect to home
      if (data.user && !data.user.identities?.length) {
        setTimeout(() => {
          router.push("/");
          router.refresh();
        }, 2000);
      }
    } catch (error: any) {
      setError(error.message || "An error occurred during registration");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Container dark fullWidth>
        <div className="flex items-center justify-between mb-6 max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <div>
            <h1>Register</h1>
            <p>Create your account to get started</p>
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
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="you@example.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="occupation">Occupation</Label>
                  <Select
                    value={occupation}
                    onValueChange={(value) => setOccupation(value as Occupation)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select your occupation" />
                    </SelectTrigger>
                    <SelectContent className="w-full">
                      <SelectItem value="Farmer">Farmer</SelectItem>
                      <SelectItem value="Logistik">Logistik</SelectItem>
                      <SelectItem value="Enduser">Enduser</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                  />
                  <p className="text-xs">
                    Must be at least 6 characters
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
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
                  {loading ? "Creating account..." : "Register"}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p>
                  Already have an account?{" "}
                  <Link
                    href="/login"
                    className="font-medium hover:underline"
                  >
                    Login here
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
