"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useParams } from "next/navigation";
import Container from "@/app/components/Container";
import Card from "@/app/components/Card";
import PageSkeleton from "@/app/components/PageSkeleton";
import { Badge } from "@/components/ui/badge";
import { MapPin, Mail, User } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

interface ProducentProfile {
  user_id: string;
  email: string;
  full_name: string;
  business_name?: string;
  business_subtext?: string;
  business_description?: string;
  street?: string;
  zip_code?: string;
  city?: string;
  vegetables: string[];
  business_images?: string[];
  featured_image_index?: number;
  address_coordinates?: { lat: number; lng: number };
}

interface Ingredient {
  id: string;
  name: string;
  is_available: boolean;
}

export default function ProducentPublicPage() {
  const [loading, setLoading] = useState(true);
  const [producent, setProducent] = useState<ProducentProfile | null>(null);
  const [activeIngredients, setActiveIngredients] = useState<string[]>([]);
  const params = useParams();
  const supabase = createClient();
  const producentId = params.id as string;

  useEffect(() => {
    loadProducent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [producentId]);

  const loadActiveIngredients = async () => {
    try {
      // Query ingredients directly from the database
      const { data: ingredients, error } = await supabase
        .from('ingredients')
        .select('name')
        .eq('is_available', true);
      
      if (error) {
        console.error("Error loading ingredients:", error);
        return;
      }

      const ingredientNames = (ingredients || []).map((ing: any) => ing.name);
      setActiveIngredients(ingredientNames);
    } catch (error) {
      console.error("Error loading active ingredients:", error);
    }
  };

  const loadProducent = async () => {
    try {
      // Load active ingredients first
      await loadActiveIngredients();

      // Get all farmer profiles using the public RPC function
      const { data: farmers, error } = await supabase.rpc("get_farmer_profiles");
      
      if (error) {
        console.error("Error loading farmer profiles:", error);
        throw new Error("Failed to load farmer profiles");
      }

      // Find the specific producent
      const producentData = (farmers || []).find((p: any) => p.user_id === producentId);

      if (!producentData) {
        setProducent(null);
        setLoading(false);
        return;
      }

      setProducent({
        user_id: producentData.user_id,
        email: producentData.email || "",
        full_name: producentData.full_name || "Produzent",
        business_name: producentData.business_name,
        business_subtext: producentData.business_subtext,
        business_description: producentData.business_description,
        street: producentData.street,
        zip_code: producentData.zip_code,
        city: producentData.city,
        vegetables: producentData.vegetables || [],
        business_images: producentData.business_images || [],
        featured_image_index: producentData.featured_image_index || 0,
        address_coordinates: producentData.address_coordinates,
      });
    } catch (error) {
      console.error("Error loading producent:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <PageSkeleton />;
  }

  if (!producent) {
    return (
      <Container asPage>
        <Card>
          <div className="text-center py-8">
            <h2 className="mb-4">Produzent nicht gefunden</h2>
            <p>Dieser Produzent existiert nicht oder hat sein Profil noch nicht eingerichtet.</p>
          </div>
        </Card>
      </Container>
    );
  }

  const displayName = producent.business_name || producent.full_name;
  const address = [producent.street, producent.zip_code, producent.city]
    .filter(Boolean)
    .join(", ");

  // Get featured image or fallback
  const featuredImage = producent.business_images && producent.business_images.length > 0
    ? producent.business_images[producent.featured_image_index || 0]
    : undefined;

  // Get all business images
  const allImages = producent.business_images && producent.business_images.length > 0
    ? producent.business_images
    : [];

  return (
    <>
      <Container dark fullWidth>
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 mb-6">
          <div>
            <h1>{displayName}</h1>
            {producent.business_subtext && (
              <p>{producent.business_subtext}</p>
            )}
          </div>
        </div>
      </Container>

      <Container asPage>
        {/* Featured Image */}
        {featuredImage && (
          <div className="aspect-video bg-gray-100 relative overflow-hidden rounded-lg mb-8">
            <img
              src={featuredImage}
              alt={displayName}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Business Info */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-2">
            <Card>
              <h3 className="mb-4">Über uns</h3>
              {producent.business_description ? (
                <p className="whitespace-pre-wrap">{producent.business_description}</p>
              ) : (
                <p className="text-gray-500">Keine Beschreibung verfügbar</p>
              )}
            </Card>

            {/* Image Carousel */}
            {allImages.length > 1 && (
              <Card className="mt-8">
                <Carousel className="w-full">
                  <CarouselContent>
                    {allImages.map((image, index) => (
                      <CarouselItem key={index}>
                        <div className="aspect-video bg-gray-100 relative overflow-hidden rounded-lg">
                          <img
                            src={image}
                            alt={`${displayName} - Bild ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious />
                  <CarouselNext />
                </Carousel>
              </Card>
            )}
          </div>

          <div>
            {/* Contact Info */}
            <Card>
              <h3 className="mb-4">Kontakt & Standort</h3>
              
              {address && (
                <div className="flex items-center gap-3 mb-4">
                  <MapPin className="h-5 w-5 text-gray-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Adresse</p>
                    <p className="text-sm text-gray-600">{address}</p>
                  </div>
                </div>
              )}

              {producent.full_name && (
                <div className="flex items-center gap-3 mb-4">
                  <User className="h-5 w-5 text-gray-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Kontaktperson</p>
                    <p className="text-sm text-gray-600">{producent.full_name}</p>
                  </div>
                </div>
              )}
            </Card>

            {/* Products */}
            {(() => {
              // Filter vegetables to only show active ingredients
              const validVegetables = producent.vegetables.filter(veg => 
                activeIngredients.includes(veg)
              );
              
              return validVegetables.length > 0 && (
                <Card className="mt-6">
                  <h3 className="mb-4">Unsere Produkte</h3>
                  <div className="flex flex-wrap gap-2">
                    {validVegetables.map((vegetable: string) => (
                      <Badge
                        key={vegetable}
                        variant="outline"
                        className="px-3 py-1 text-sm border-black rounded-full"
                      >
                        {vegetable}
                      </Badge>
                    ))}
                  </div>
                </Card>
              );
            })()}
          </div>
        </div>
      </Container>
    </>
  );
}
