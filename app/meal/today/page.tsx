"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import Card from "@/app/components/Card";
import Container from "@/app/components/Container";
import PageSkeleton from "@/app/components/PageSkeleton";
import VideoPopup from "@/app/components/VideoPopup";
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

export default function TodayMealPage() {
  const [loading, setLoading] = useState(true);
  const [meal, setMeal] = useState<Meal | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [farmerProfiles, setFarmerProfiles] = useState<Map<string, FarmerProfile>>(new Map());
  
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    const loadMealData = async () => {
      try {
        // Set default location immediately
        setUserLocation({ lat: 48.203187, lng: 15.637051 }); // Vienna default
        
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
              // Provide more detailed error information
              let errorMessage = "Unknown geolocation error";
              switch(error.code) {
                case error.PERMISSION_DENIED:
                  errorMessage = "User denied the request for Geolocation";
                  break;
                case error.POSITION_UNAVAILABLE:
                  errorMessage = "Location information is unavailable";
                  break;
                case error.TIMEOUT:
                  errorMessage = "The request to get user location timed out";
                  break;
              }
              console.warn("Geolocation error:", errorMessage, error);
              // Continue with default location - no need to show error to user
            },
            {
              timeout: 5000,
              enableHighAccuracy: false,
              maximumAge: 300000
            }
          );
        }

        await loadTodayMeal();
      } catch (error) {
        console.error("Error in loadMealData:", error);
      } finally {
        setLoading(false);
      }
    };

    loadMealData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadTodayMeal = async () => {
    try {
      const response = await fetch('/api/meals/today');
      
      if (!response.ok) {
        console.error("Error loading today meal:", response.statusText);
        return;
      }

      const { meal: data } = await response.json();

      if (!data) {
        return;
      }

      setMeal(data);
      
      // Load farmer profiles for all farmers in this meal
      if (data?.vegetables) {
        await loadFarmerProfiles(data.vegetables);
      }
    } catch (error) {
      console.error("Error loading today meal:", error);
    }
  };

  const loadFarmerProfiles = async (vegetables: VegetableSource[]) => {
    try {
      // Get all farmer profiles using the public RPC function
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
      // Don't throw - farmer profiles are optional
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
            <p className="mb-4">Derzeit ist keine Tagesmahlzeit verfügbar</p>
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

  return (
    <>
      {/* Video Popup */}
      <VideoPopup
        videoUrl="https://www.jazunah.at/app/uploads/2025/10/Tomaten.mp4"
        autoOpen={true}
        delay={1000}
      />

      <Container dark fullWidth>
        <div className="flex items-center justify-between mb-6 max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="mb-4">
            <h1>{meal.name}</h1>
            <p>{meal.description}</p>
          </div>
        </div>

        <div className="h-102 overflow-hidden relative z-40 mb-6">
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
          />
        </div>

        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 mb-12">
          <button
            onClick={() => {
              const ingredientsSection = document.getElementById('ingredients-section');
              ingredientsSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
            className="flex items-center max-sm:w-full justify-center gap-2 px-3 max-sm:px-2 py-3 cursor-pointer mx-auto bg-white text-sm lg:text-base text-black rounded-full font-medium hover:bg-gray-100 transition-colors"
          >
            <MapPin className="h-3 w-3 lg:h-5 lg:w-5" />
            Deine Zutaten sind ~ {calculateAverageDistance()} km zu dir gereist
          </button>
        </div>   

        {/* Ingredients */}
        <div 
          id="ingredients-section"
          className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <h2 className="mb-8">Zutatenherkünfte</h2>
          <div className="space-y-3">
            {transformedVegetables.map((veg, index) => (
              <button
                key={index}
                onClick={() => {
                  const farmerId = `farmer-${veg.farmer.replace(/\s+/g, '-').toLowerCase()}`;
                  const farmerCard = document.getElementById(farmerId);
                  farmerCard?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className="block w-full text-left"
              >
                <Card noBorder className="p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="text-lg font-medium mb-2">{veg.vegetable}</h4>
                      <div className="flex items-center gap-1 text-sm mb-1">
                        <MapPin className="h-4 w-4" />
                        <span>ca. {veg.distance.toFixed(1)}km entfernt</span>
                      </div>
                      <div className="flex items-center gap-1 text-sm">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="flex-shrink-0"
                        >
                          <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                          <circle cx="12" cy="7" r="4" />
                        </svg>
                        <span>{veg.farmer} | {veg.location.address}</span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <svg 
                        className="h-6 w-6" 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </Card>
              </button>
            ))}
          </div>
        </div>       
      </Container>

      <Container asPage>
        <h2 className="mb-8">Die Produzenten</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 mb-8">
          {/* Get unique farmers from vegetables */}
          {Array.from(new Map(transformedVegetables.map(veg => [veg.farmer, veg])).values()).map((veg, index) => {
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

            const cardContent = (
              <Card 
                className={farmerProfile?.user_id ? "cursor-pointer hover:shadow-lg transition-shadow h-full" : ""}
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

            return farmerProfile?.user_id ? (
              <Link key={index} href={`/produzent/${farmerProfile.user_id}`} className="no-underline">
                {cardContent}
              </Link>
            ) : (
              <div key={index}>{cardContent}</div>
            );
          })}
        </div>

        <div className="grid gap-8">
          <h2>So funktioniert unser Versprechen:</h2>
          <p>Wir vermarkten Lebensmittel von Produzenten direkt an Küchen.</p>
          <p>jazunah.at ist das Bindeglied zwischen der Landwirtschaft und Großküchen in Österreich. Die Produzenten bestimmen die Preise ihrer hochwertigen Erzeugnisse selbst – wir kümmern uns um den Weg vom Feld in die Küche. Für Köche bedeutet das: Frische, erstklassige Zutaten, welche die regionale Wirtschaft stärken und  den Geschmack der Region auf den Teller bringen. </p>
          <i>Für Produzenten, für Köche, für uns alle.</i>
        </div>
      </Container>
    </>
  );
}
