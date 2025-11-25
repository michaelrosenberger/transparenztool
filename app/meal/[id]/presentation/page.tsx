"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useParams } from "next/navigation";
import Link from "next/link";
import Card from "@/app/components/Card";
import Container from "@/app/components/Container";
import PageSkeleton from "@/app/components/PageSkeleton";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import dynamic from "next/dynamic";
import { MapPin } from "lucide-react";

// Dynamically import map component to avoid SSR issues
const MapComponent = dynamic(() => import("@/app/components/MapComponent"), {
  ssr: false,
  loading: () => <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center relative z-40">Karte wird geladen...</div>
});

interface VegetableSource {
  vegetable: string;
  farmer_name: string;
  address: string;
  lat: number;
  lng: number;
  image_url?: string;
}

interface Meal {
  id: string;
  name: string;
  description: string;
  storage_name?: string;
  storage_address: string;
  storage_lat: number;
  storage_lng: number;
  vegetables: VegetableSource[];
  created_at: string;
}

interface FarmerProfile {
  user_id: string;
  full_name: string;
  business_images?: string[];
  featured_image_index?: number;
}

export default function PresenationMealDetailPage() {
  const [loading, setLoading] = useState(true);
  const [meal, setMeal] = useState<Meal | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [farmerProfiles, setFarmerProfiles] = useState<Map<string, FarmerProfile>>(new Map());
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  const params = useParams();
  const supabase = useMemo(() => createClient(), []);
  const mealId = params.id as string;

  useEffect(() => {
    const loadMealData = async () => {
      try {
        // Set default location immediately
        setUserLocation({ lat: 48.2082, lng: 16.3738 }); // Vienna default
        
        // Try to get user's actual location
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              setUserLocation({
                lat: position.coords.latitude,
                lng: position.coords.longitude,
              });
            },
            (error) => {
              console.error("Error getting location:", error);
            },
            {
              timeout: 10000,
              enableHighAccuracy: false,
              maximumAge: 300000
            }
          );
        }

        await loadMeal(mealId);
      } catch (error) {
        console.error("Error in loadMealData:", error);
      } finally {
        setLoading(false);
      }
    };

    loadMealData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mealId]);

  // Autoplay with fade effect
  useEffect(() => {
    if (!meal) return;

    const uniqueFarmersCount = Array.from(new Map(meal.vegetables.map(veg => [veg.farmer_name, veg])).values()).length;
    if (uniqueFarmersCount === 0) return;

    const autoplay = setInterval(() => {
      setIsTransitioning(true);
      
      setTimeout(() => {
        setCurrentSlideIndex((prev) => (prev + 1) % uniqueFarmersCount);
        setIsTransitioning(false);
      }, 300); // Half of transition duration for crossfade effect
    }, 10000); // Change slide every 5 seconds

    return () => clearInterval(autoplay);
  }, [meal]);

  const loadMeal = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from("meals")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.error("Error loading meal:", error);
        return;
      }

      setMeal(data);
      
      // Load farmer profiles for all farmers in this meal
      if (data?.vegetables) {
        await loadFarmerProfiles(data.vegetables);
      }
    } catch (error) {
      console.error("Error loading meal:", error);
    }
  };

  const loadFarmerProfiles = async (vegetables: VegetableSource[]) => {
    try {
      // Get all farmer profiles
      const { data, error } = await supabase.rpc("get_farmer_profiles");
      
      if (error) {
        console.error("Error loading farmer profiles:", error);
        return;
      }

      // Create a map of farmer name to profile
      const profileMap = new Map<string, FarmerProfile>();
      (data || []).forEach((farmer: any) => {
        // Ensure business_images is an array
        let businessImages = [];
        if (farmer.business_images) {
          if (Array.isArray(farmer.business_images)) {
            businessImages = farmer.business_images;
          } else if (typeof farmer.business_images === 'string') {
            try {
              businessImages = JSON.parse(farmer.business_images);
            } catch (e) {
              console.error("Error parsing business_images for", farmer.full_name, e);
              businessImages = [];
            }
          }
        }

        profileMap.set(farmer.full_name, {
          user_id: farmer.user_id,
          full_name: farmer.full_name,
          business_images: businessImages,
          featured_image_index: farmer.featured_image_index || 0,
        });
      });

      setFarmerProfiles(profileMap);
    } catch (error) {
      console.error("Error loading farmer profiles:", error);
    }
  };

  // Calculate distance between two coordinates using Haversine formula
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const calculateAverageDistance = () => {
    if (!meal || !userLocation) return "0";
    
    const storageLocation = { 
      lat: meal.storage_lat, 
      lng: meal.storage_lng 
    };
    
    // Calculate distance: farm → storage + storage → user for each vegetable
    const storageToUserDistance = calculateDistance(
      storageLocation.lat,
      storageLocation.lng,
      userLocation.lat,
      userLocation.lng
    );
    
    const total = meal.vegetables.reduce((sum, veg) => {
      const farmToStorageDistance = calculateDistance(
        veg.lat,
        veg.lng,
        storageLocation.lat,
        storageLocation.lng
      );
      return sum + farmToStorageDistance + storageToUserDistance;
    }, 0);
    
    return (total / meal.vegetables.length).toFixed(1);
  };

  if (loading) {
    return <PageSkeleton />;
  }

  if (!meal) {
    return (
      <div className="flex items-center justify-center bg-background">
        <Card>
          <div className="text-center py-8">
            <p className="mb-4">Mahlzeit nicht gefunden</p>
          </div>
        </Card>
      </div>
    );
  }

  // Transform vegetables to match enduser meal page format
  const transformedVegetables = meal.vegetables.map((veg) => ({
    vegetable: veg.vegetable,
    farmer: veg.farmer_name,
    location: {
      lat: veg.lat,
      lng: veg.lng,
      address: veg.address
    },
    distance: calculateDistance(veg.lat, veg.lng, userLocation?.lat || 48.2082, userLocation?.lng || 16.3738),
    image_url: veg.image_url
  }));

  // Get unique farmers list for carousel
  const uniqueFarmers = Array.from(new Map(transformedVegetables.map(veg => [veg.farmer, veg])).values());
  const highlightedFarmer = uniqueFarmers[currentSlideIndex]?.farmer || null;

  return (
    <>
      <Container dark fullWidth>
        <div className="flex items-center justify-between mb-6 max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="">
            <h1>{meal.name}</h1>
            <p>{meal.description}</p>
          </div>
          <button
            onClick={() => {
              const ingredientsSection = document.getElementById('ingredients-section');
              ingredientsSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
            className="flex items-center justify-center gap-2 px-3 max-sm:px-2 py-3 cursor-pointer bg-white text-sm lg:text-base text-black rounded-full font-medium hover:bg-gray-100 transition-colors"
          >
            <MapPin className="h-3 w-3 lg:h-5 lg:w-5" />
            Deine Zutaten sind ~ {calculateAverageDistance()} km zu dir gereist
          </button>
        </div>

        <div className="h-screen overflow-hidden relative z-40 mb-6">
          <div className="w-1/4 mb-8 relative z-1000 top-[20%] ml-8">
          {/* Get unique farmers from vegetables */}
          {uniqueFarmers.map((veg, index) => {
              const farmerName = veg.farmer;
              const farmerAddress = veg.location.address;
              // Get all vegetables from this farmer
              const farmerVegetables = transformedVegetables
                .filter(v => v.farmer === veg.farmer)
                .map(v => v.vegetable);

              // Get farmer profile for images
              const farmerProfile = farmerProfiles.get(farmerName);
              const featuredImage = farmerProfile?.business_images && farmerProfile.business_images.length > 0
                ? farmerProfile.business_images[farmerProfile.featured_image_index || 0]
                : undefined;

              const isActive = index === currentSlideIndex;
              
              const cardContent = (
                <Card 
                  className={farmerProfile?.user_id ? "cursor-pointer hover:shadow-lg transition-shadow h-full" : "h-full"}
                  id={`farmer-${farmerName.replace(/\s+/g, '-').toLowerCase()}`}
                >
                  {/* Featured Business Image */}
                  <div className="aspect-video bg-gray-100 relative overflow-hidden rounded-lg mb-4">
                    {featuredImage ? (
                      <img
                        src={featuredImage}
                        alt={farmerName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-200">
                        <Avatar className="h-24 w-24">
                          <AvatarFallback className="text-3xl">
                            {farmerName.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                    )}
                  </div>

                  {/* Farmer Info */}
                  <h3 className="text-2xl font-medium mb-2">{farmerName}</h3>
                  <p className="text-base mb-4">{farmerAddress}</p>

                  {/* Vegetables */}
                  {farmerVegetables.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {farmerVegetables.map((vegetable: string, vegIndex: number) => (
                        <Badge
                          key={vegIndex}
                          variant="outline"
                          className="px-3 py-1 text-sm border-black rounded-full"
                        >
                          {vegetable}
                        </Badge>
                      ))}
                    </div>
                  )}
                </Card>
              );

              return (
                <div
                  key={index}
                  className="absolute inset-0 transition-opacity duration-700 ease-in-out"
                  style={{
                    opacity: isActive ? (isTransitioning ? 0 : 1) : 0,
                    pointerEvents: isActive ? 'auto' : 'none',
                  }}
                >
                  {farmerProfile?.user_id ? (
                    <Link href={`/produzent/${farmerProfile.user_id}`} className="no-underline block">
                      {cardContent}
                    </Link>
                  ) : (
                    <div>{cardContent}</div>
                  )}
                </div>
              );
            })}
        </div>
          <MapComponent dark
            vegetables={transformedVegetables}
            userLocation={userLocation}
            storageLocation={{ 
              lat: meal.storage_lat, 
              lng: meal.storage_lng, 
              address: meal.storage_address,
              name: meal.storage_name
            }}
            mealName={meal.name}
            highlightedFarmer={highlightedFarmer}
          />
        </div>       
      </Container>
    </>
  );
}
