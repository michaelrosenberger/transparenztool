"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import Container from "@/app/components/Container";
import Card from "@/app/components/Card";
import PageSkeleton from "@/app/components/PageSkeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import dynamic from "next/dynamic";

const MapComponent = dynamic(() => import("@/app/components/MapComponent"), {
  ssr: false,
  loading: () => <div className="h-96 bg-gray-100 rounded-lg animate-pulse" />,
});

interface FarmerProfile {
  user_id: string;
  full_name: string;
  business_images?: string[];
  featured_image_index?: number;
  street?: string;
  zip_code?: string;
  city?: string;
  vegetables: string[];
  address_coordinates?: { lat: number; lng: number };
}

export default function FarmerListPage() {
  const [loading, setLoading] = useState(true);
  const [farmers, setFarmers] = useState<FarmerProfile[]>([]);
  const [activeIngredients, setActiveIngredients] = useState<string[]>([]);
  const supabase = createClient();

  useEffect(() => {
    loadActiveIngredients();
    loadFarmers();
  }, []);

  const loadActiveIngredients = async () => {
    try {
      const { data, error } = await supabase
        .from("ingredients")
        .select("name")
        .eq("is_available", true);

      if (error) throw error;

      const ingredientNames = (data || []).map((ing: any) => ing.name);
      setActiveIngredients(ingredientNames);
    } catch (error) {
      console.error("Error loading active ingredients:", error);
    }
  };

  const loadFarmers = async () => {
    try {
      // Call the RPC function to get all farmer profiles
      const { data, error } = await supabase.rpc("get_farmer_profiles");

      if (error) throw error;

      // Transform the data to match our interface
      const farmerProfiles: FarmerProfile[] = (data || []).map((farmer: any) => ({
        user_id: farmer.user_id,
        full_name: farmer.full_name || "Produzent",
        business_images: farmer.business_images || [],
        featured_image_index: farmer.featured_image_index || 0,
        street: farmer.street,
        zip_code: farmer.zip_code,
        city: farmer.city,
        vegetables: farmer.vegetables || [],
        address_coordinates: farmer.address_coordinates,
      }));

      setFarmers(farmerProfiles);
    } catch (error) {
      console.error("Error loading farmers:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <PageSkeleton />;
  }

  return (
    <>
      <Container dark fullWidth>
        <div className="flex items-center justify-between mb-6 max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <div>
            <h1>Die Produzenten</h1>
            <p>Entdecke alle regionalen Produzenten und ihre Produkte</p>
          </div>
        </div>
      </Container>

      <Container asPage>

      {farmers.length === 0 ? (
        <div className="text-center py-12 mb-8">
          <p>Noch keine Produzenten registriert</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 mb-8">
          {farmers.map((farmer) => {
            const fullName = farmer.full_name;
            const address = [farmer.street, farmer.zip_code, farmer.city]
              .filter(Boolean)
              .join(", ");
            // Filter vegetables to only show active ingredients
            const vegetables = (farmer.vegetables || []).filter(veg => 
              activeIngredients.includes(veg)
            );
            
            // Get featured image or fall back to profile image
            const featuredImage = farmer.business_images && farmer.business_images.length > 0
              ? farmer.business_images[farmer.featured_image_index || 0]
              : undefined;

            return (
              <Link key={farmer.user_id} href={`/produzent/${farmer.user_id}`} className="no-underline">
                <Card className="cursor-pointer hover:shadow-lg transition-shadow h-full">
                  {/* Featured Business Image */}
                  <div className="aspect-video bg-gray-100 relative overflow-hidden rounded-lg mb-4">
                  {featuredImage ? (
                    <img
                      src={featuredImage}
                      alt={fullName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-200">
                      <Avatar className="h-24 w-24">
                        <AvatarFallback className="text-3xl">
                          {fullName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  )}
                </div>

                {/* Farmer Info */}
                <h3 className="text-2xl font-medium mb-2">{fullName}</h3>
                {address && (
                  <p className="text-base mb-4">{address}</p>
                )}

                {/* Vegetables */}
                {vegetables.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {vegetables.map((vegetable: string) => (
                      <Badge
                        key={vegetable}
                        variant="outline"
                        className="px-3 py-1 text-sm border-black rounded-full"
                      >
                        {vegetable}
                      </Badge>
                    ))}
                  </div>
                )}
              </Card>
              </Link>
            );
          })}
        </div>
      )}

      {/* Map showing all farmers */}
      {farmers.length > 0 && (
        <Card className="mb-8">
          <h3 className="mb-4">Standorte der Produzenten</h3>
          <p className="mb-4">
            Sehen Sie, wo sich alle unsere Produzenten in Österreich befinden
          </p>
          <div className="h-96 rounded-lg overflow-hidden relative z-40">
            <MapComponent dark farmers={farmers} mode="farmers" />
          </div>
        </Card>
      )}
      </Container>
    </>
  );
}
