"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    // Get initial user
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };

    getUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    closeMenu();
    router.push("/");
    router.refresh();
  };

  const fullName = user?.user_metadata?.full_name;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20 py-2">
          {/* Logo */}
          <Link href="/" className="flex items-center" onClick={closeMenu}>
            <img 
              src="/logo.svg" 
              alt="Transparenztool" 
              className="h-15 w-auto"
            />
          </Link>

          <div className="flex items-center gap-2">
            {/* User Icon - Always visible, links to profile or login */}
            {!loading && (
              <Link
                href={user ? "/profile" : "/login"}
                className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-100 transition-colors text-black"
                title={user ? (fullName || "Profile") : "Login"}
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

            {/* Burger Menu Button */}
            <button
              onClick={toggleMenu}
              className="p-2 rounded-md hover:bg-gray-100 transition-colors text-black"
              aria-label="Toggle menu"
              aria-expanded={isMenuOpen}
            >
            <div className="w-6 h-5 flex flex-col justify-between">
              <span
                className={`block h-0.5 w-full bg-current transition-all duration-300 ${
                  isMenuOpen ? "rotate-45 translate-y-2" : ""
                }`}
              />
              <span
                className={`block h-0.5 w-full bg-current transition-all duration-300 ${
                  isMenuOpen ? "opacity-0" : ""
                }`}
              />
              <span
                className={`block h-0.5 w-full bg-current transition-all duration-300 ${
                  isMenuOpen ? "-rotate-45 -translate-y-2" : ""
                }`}
              />
            </div>
          </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={`absolute top-20 left-0 right-0 bg-white border-b border-gray-200 transition-all duration-300 ${
          isMenuOpen
            ? "opacity-100 visible translate-y-0"
            : "opacity-0 invisible -translate-y-2"
        }`}
      >
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <ul className="space-y-2">
            <li>
              <Link
                href="/"
                onClick={closeMenu}
                className="block px-4 py-3 rounded-md hover:bg-gray-100 transition-colors text-black"
              >
                Home
              </Link>
            </li>
            <li>
              <Link
                href="/about"
                onClick={closeMenu}
                className="block px-4 py-3 rounded-md hover:bg-gray-100 transition-colors text-black"
              >
                About
              </Link>
            </li>
            <li>
              <Link
                href="/shop"
                onClick={closeMenu}
                className="block px-4 py-3 rounded-md hover:bg-gray-100 transition-colors text-black"
              >
                Shop
              </Link>
            </li>

            {/* Auth Section */}
            <li className="pt-4 border-t border-gray-200">
              {loading ? (
                <div className="px-4 py-3 text-gray-500">Loading...</div>
              ) : user ? (
                <div className="space-y-2">
                  <div className="px-4 py-2 text-sm text-gray-600">
                    {user.email}
                  </div>
                  <Link
                    href="/profile"
                    onClick={closeMenu}
                    className="block px-4 py-3 rounded-md hover:bg-gray-100 transition-colors text-black"
                  >
                    Profile
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-3 rounded-md hover:bg-gray-100 transition-colors text-black"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Link
                    href="/login"
                    onClick={closeMenu}
                    className="block px-4 py-3 rounded-md hover:bg-gray-100 transition-colors text-black"
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    onClick={closeMenu}
                    className="block px-4 py-3 rounded-md bg-black text-white hover:bg-gray-800 transition-colors text-center"
                  >
                    Register
                  </Link>
                </div>
              )}
            </li>
          </ul>
        </nav>
      </div>

      {/* Overlay */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 bg-black/20 -z-10 top-20"
          onClick={closeMenu}
        />
      )}
    </header>
  );
}
