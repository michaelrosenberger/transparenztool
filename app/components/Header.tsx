"use client";

import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export default function Header() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    // Get initial user
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setIsAdmin(user?.user_metadata?.is_admin || false);
      setLoading(false);
    };

    getUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setIsAdmin(session?.user?.user_metadata?.is_admin || false);
    });

    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  const toggleAdmin = async () => {
    if (!user) return;
    
    const newAdminState = !isAdmin;
    const { error } = await supabase.auth.updateUser({
      data: { is_admin: newAdminState }
    });
    
    if (!error) {
      setIsAdmin(newAdminState);
      router.refresh();
    }
  };

  const fullName = user?.user_metadata?.full_name;

  return (
    <header className="sticky top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-[var(--shadow-menu)]">
      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20 py-2">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <img 
              src="/logo.svg" 
              alt="Transparenztool" 
              className="max-md:w-20 w-24 h-auto"
            />
          </Link>

          <div className="flex items-center gap-4">
            {/* Admin Toggle - Only show when logged in */}
            {user && (
              <div className="flex items-center gap-2">
                <Switch
                  id="admin-mode"
                  checked={isAdmin}
                  onCheckedChange={toggleAdmin}
                />
                <Label htmlFor="admin-mode" className="text-sm cursor-pointer">
                  Admin
                </Label>
              </div>
            )}
            <div className="flex items-center gap-2">
            {/* User Icon - Always visible, links to profile or login */}
            {!loading && (
              <Link
                href={user ? "/profile" : "/login"}
                className="flex items-center gap-2 px-3 py-2 rounded-md transition-colors text-black"
                title={user ? (fullName || "Profil") : "Anmelden"}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </Link>
            )}

            {/* Dropdown Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" aria-label="Menu" className="pr-0 -mr-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="4" x2="20" y1="12" y2="12" />
                    <line x1="4" x2="20" y1="6" y2="6" />
                    <line x1="4" x2="20" y1="18" y2="18" />
                  </svg>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem asChild>
                  <Link href="/" className="cursor-pointer no-underline">
                    Startseite
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/styleguide" className="cursor-pointer no-underline">
                    Style Guide
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/farmer-list" className="cursor-pointer no-underline">
                    Die Produzenten
                  </Link>
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                
                {loading ? (
                  <DropdownMenuLabel>Lädt...</DropdownMenuLabel>
                ) : user ? (
                  <>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="font-medium leading-none">{fullName || "Benutzer"}</p>
                        <p className="text-xs leading-none">
                          {user.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/profile" className="cursor-pointer no-underline">
                        Profil
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleLogout} className="cursor-pointer no-underline">
                      Abmelden
                    </DropdownMenuItem>
                  </>
                ) : (
                  <>
                    <DropdownMenuItem asChild>
                      <Link href="/login" className="cursor-pointer no-underline">
                        Anmelden
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/register" className="cursor-pointer no-underline">
                        Registrieren
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
