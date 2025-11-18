import type { Metadata } from "next";
import "./globals.css";
import Header from "./components/Header";
import Footer from "./components/Footer";
import { Toaster } from "@/components/ui/sonner";
import { headers } from "next/headers";
//import DynamicBreadcrumbs from "./components/DynamicBreadcrumbs";

export const metadata: Metadata = {
  title: "Transparenztool",
  description: "Transparenztool - Progressive Web App",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Transparenztool",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#000000",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || "";
  const isPresentationMode = pathname.includes("/presentation");

  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="https://use.typekit.net/af/87fc95/00000000000000007759f981/30/l?primer=7cdcb44be4a7db8877ffa5c0007b8dd865b3bbc383831fe2ea177f62257a9191&fvd=n4&v=3" />
      </head>
      <body
        className="antialiased tracking-wide"
        suppressHydrationWarning
      >
        {!isPresentationMode && <Header />}
        <div className={isPresentationMode ? "" : "pt-0"}>
          {children}
        </div>
        {!isPresentationMode && <Footer />}
        <Toaster />
      </body>
    </html>
  );
}
