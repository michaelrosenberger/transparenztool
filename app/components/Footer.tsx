"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowUp, ArrowDown } from "lucide-react";

export default function Footer() {
  const [accountOpen, setAccountOpen] = useState(false);
  const [regionalOpen, setRegionalOpen] = useState(false);
  const [producersOpen, setProducersOpen] = useState(false);

  return (
    <footer className="bg-black text-white mt-2">
      {/* Logo Section */}
      <div className="bg-white py-0 relative">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <img 
            src="/jazunah_AUFKLEBER.svg" 
            alt="ja zu nah" 
            className="h-32 md:h-40 relative translate-y-1/2"
          />
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 pt-24 md:pt-28 pb-12">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-12">
          {/* Contact Section */}
          <div>
            <h3 className="mb-4">Kontakt</h3>
            <div className="space-y-2">
              <div>
                <p>ja zu nah GmbH JZN</p>
                <p>Wiener Straße 64</p>
                <p>3100 St. Pölten</p>
              </div>
              <Link href="tel:+4350259424000" className="flex items-center gap-2 mt-4 hover:underline">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                </svg>
                +43 5 0259 42400
              </Link>
              <Link href="mailto:office@jazunah.at" className="flex items-center gap-2 hover:underline">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="20" height="16" x="2" y="4" rx="2"/>
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                </svg>
                office@jazunah.at
              </Link>
            </div>
          </div>

          {/* Office Hours Section */}
          <div>
            <h3 className="mb-4">Bürozeiten</h3>
            <div className="space-y-2">
              <div>
                <p className="">Montag bis Donnerstag:</p>
                <p>08:00 - 16:00 Uhr</p>
              </div>
              <div className="mt-4">
                <p className="">Freitag:</p>
                <p>08:00 - 12:00 Uhr</p>
              </div>
            </div>
          </div>

          {/* Empty column for desktop layout */}
          <div className="hidden md:block"></div>
        </div>

        {/* Accordion Sections - Mobile */}
        <div className="space-y-4 mb-12">
          {/* Mein Account */}
          <div className="rounded-lg overflow-hidden">
            <button
              onClick={() => setAccountOpen(!accountOpen)}
              className="w-full flex items-center justify-between rounded-lg py-5 px-6 text-left bg-[rgba(44,44,44,1)] hover:bg-[rgba(34,34,34,1)] transition-colors"
            >
              <span className="text-lg font-medium">Mein Account</span>
              {accountOpen ? <ArrowUp size={20} /> : <ArrowDown size={20} />}
            </button>
            {accountOpen && (
              <div className="p-6 space-y-3">
                <Link href="#" className="block hover:underline">Anmelden</Link>
                <Link href="#" className="block hover:underline">Mein Konto</Link>
                <Link href="#" className="block hover:underline">Bestellungen</Link>
                <Link href="#" className="block hover:underline">Zahlung und Versand</Link>
              </div>
            )}
          </div>

          {/* So einfach ist regional */}
          <div className="rounded-lg overflow-hidden">
            <button
              onClick={() => setRegionalOpen(!regionalOpen)}
              className="w-full flex items-center justify-between rounded-lg py-5 px-6 text-left bg-[rgba(44,44,44,1)] hover:bg-[rgba(34,34,34,1)] transition-colors"
            >
              <span className="text-lg font-medium">So einfach ist regional</span>
              {regionalOpen ? <ArrowUp size={20} /> : <ArrowDown size={20} />}
            </button>
            {regionalOpen && (
              <div className="p-6 space-y-3">
                <Link href="#" className="block hover:underline">Über uns</Link>
                <Link href="#" className="block hover:underline">Wie es funktioniert</Link>
                <Link href="#" className="block hover:underline">Unsere Partner</Link>
              </div>
            )}
          </div>

          {/* Produzenten */}
          <div className="rounded-lg overflow-hidden">
            <button
              onClick={() => setProducersOpen(!producersOpen)}
              className="w-full flex items-center justify-between rounded-lg py-5 px-6 text-left bg-[rgba(44,44,44,1)] hover:bg-[rgba(34,34,34,1)] transition-colors"
            >
              <span className="text-lg font-medium">Produzenten</span>
              {producersOpen ? <ArrowUp size={20} /> : <ArrowDown size={20} />}
            </button>
            {producersOpen && (
              <div className="p-6 space-y-3">
                <Link href="#" className="block hover:underline">Alle Produzenten</Link>
                <Link href="#" className="block hover:underline">Produzent werden</Link>
                <Link href="#" className="block hover:underline">Qualitätsstandards</Link>
              </div>
            )}
          </div>
        </div>

        {/* Social Media Icons */}
        <div className="flex justify-center gap-6 mb-8 flex-wrap">
          <Link href="#" className="hover:opacity-80 transition-opacity border-2 border-white rounded-full p-2" aria-label="Instagram">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
              <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
            </svg>
          </Link>
          <Link href="#" className="hover:opacity-80 transition-opacity border-2 border-white rounded-full p-2" aria-label="Facebook">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
            </svg>
          </Link>
          <Link href="#" className="hover:opacity-80 transition-opacity border-2 border-white rounded-full p-2" aria-label="LinkedIn">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
              <rect width="4" height="12" x="2" y="9"/>
              <circle cx="4" cy="4" r="2"/>
            </svg>
          </Link>
          <Link href="#" className="hover:opacity-80 transition-opacity border-2 border-white rounded-full p-2" aria-label="YouTube">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17"/>
              <path d="m10 15 5-3-5-3z"/>
            </svg>
          </Link>
        </div>

        {/* Legal Links */}
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          <Link href="#" className="hover:underline">Widerrufsrecht</Link>
          <Link href="#" className="hover:underline">AGB</Link>
          <Link href="#" className="hover:underline">Impressum</Link>
          <Link href="#" className="hover:underline">Datenschutz</Link>
        </div>

        {/* Copyright */}
        <div className="text-center">
          <p>© 2025 ja zu nah GmbH</p>
          <p className="mt-2">made by LEMONTEC & MSTAGE</p>
        </div>

      </div>
    </footer>
  );
}
