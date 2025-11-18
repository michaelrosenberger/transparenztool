"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Home } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

// Map of route segments to display names
const routeNames: Record<string, string> = {
  "": "Home",
  "farmer-list": "Produzenten",
  "produzent": "Produzenten",
  "meal": "Gerichte",
  "admin": "Admin",
  "profile": "Profil",
  "produzenten": "Produzenten",
  "business": "Geschäft",
  "orders": "Bestellungen",
  "enduser": "Endverbraucher",
  "demo": "Demo",
  "register": "Registrierung",
  "login": "Anmelden",
};

interface DynamicBreadcrumbsProps {
  className?: string;
  darkMode?: boolean;
}

export default function DynamicBreadcrumbs({ className = "", darkMode = false }: DynamicBreadcrumbsProps) {
  const pathname = usePathname();

  // Don't show breadcrumbs on home page
  if (pathname === "/") {
    return null;
  }

  // Split pathname into segments and filter out empty strings
  const segments = pathname.split("/").filter(Boolean);

  // Build breadcrumb items
  const breadcrumbItems = segments.map((segment, index) => {
    const href = "/" + segments.slice(0, index + 1).join("/");
    const isLast = index === segments.length - 1;
    
    // Check if segment is a UUID (for dynamic routes like /produzent/[id])
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment);
    
    // Get display name from map, or use segment as-is
    // For UUIDs, use the parent route name
    let displayName = routeNames[segment] || segment;
    
    if (isUUID && index > 0) {
      // Use parent route name for UUID segments
      const parentSegment = segments[index - 1];
      displayName = routeNames[parentSegment] || parentSegment;
    }

    return {
      href,
      label: displayName,
      isLast,
      isUUID,
    };
  });

  // Filter out duplicate consecutive labels (e.g., when showing UUID routes)
  const filteredItems = breadcrumbItems.filter((item, index) => {
    if (index === 0) return true;
    return item.label !== breadcrumbItems[index - 1].label;
  });

  const textColor = darkMode ? "text-white/70" : "text-muted-foreground";
  const hoverColor = darkMode ? "hover:text-white" : "hover:text-foreground";
  const separatorColor = darkMode ? "text-white/50" : "";
  const pageColor = darkMode ? "text-white" : "text-foreground";

  return (
    <Breadcrumb className={className}>
      <BreadcrumbList className={textColor}>
        {/* Home link */}
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/" className={`flex items-center gap-1 ${hoverColor}`}>
              <Home className="h-4 w-4" />
              Home
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>

        {/* Dynamic segments */}
        {filteredItems.map((item, index) => (
          <div key={item.href} className="contents">
            <BreadcrumbSeparator className={separatorColor} />
            <BreadcrumbItem>
              {item.isLast ? (
                <BreadcrumbPage className={pageColor}>
                  {item.label}
                </BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link href={item.href} className={hoverColor}>
                    {item.label}
                  </Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </div>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
