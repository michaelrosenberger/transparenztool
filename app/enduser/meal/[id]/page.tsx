"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Card from "@/app/components/Card";
import Container from "@/app/components/Container";
import PageSkeleton from "@/app/components/PageSkeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import dynamic from "next/dynamic";
import { MapPin, Navigation } from "lucide-react";

// Dynamically import map component to avoid SSR issues
const MapComponent = dynamic(() => import("@/app/components/MapComponent"), {
  ssr: false,
  loading: () => <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center relative z-40">Loading map...</div>
});

interface Ingredient {
  name: string;
  quantity: string;
}

interface VegetableSource {
  vegetable: string;
  farmer: string;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  distance: number;
}

interface Meal {
  id: string;
  name: string;
  description: string;
  ingredients: Ingredient[];
  vegetables: VegetableSource[];
  prepared_date: string;
}

export default function MealDetailPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [meal, setMeal] = useState<Meal | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  
  const router = useRouter();
  const params = useParams();
  const supabase = createClient();
  const mealId = params.id as string;

  useEffect(() => {
    const checkUserAndLoadMeal = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push("/login");
        return;
      }

      const occupation = user.user_metadata?.occupation;
      if (occupation !== "Enduser") {
        router.push("/");
        return;
      }

      setUser(user);
      
      // Set default location immediately
      setUserLocation({ lat: 48.2082, lng: 16.3738 }); // Vienna default
      
      // Try to get user's actual location with timeout
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
            timeout: 5000, // 5 second timeout
            enableHighAccuracy: false,
            maximumAge: 300000 // Accept cached location up to 5 minutes old
          }
        );
      }

      await loadMeal(mealId);
      setLoading(false);
    };

    checkUserAndLoadMeal();
  }, [mealId, router, supabase.auth]);

  const loadMeal = async (id: string) => {
    try {
      // For demo purposes, we'll use mock data
      // In production, this would fetch from your database
      const mockMeal: Meal = {
        id: id,
        name: "Fresh Garden Salad Bowl",
        description: "A nutritious blend of fresh vegetables sourced directly from local farmers",
        ingredients: [
          { name: "Mixed Greens", quantity: "100g" },
          { name: "Cherry Tomatoes", quantity: "50g" },
          { name: "Carrots", quantity: "30g" },
          { name: "Olive Oil", quantity: "15ml" },
          { name: "Balsamic Vinegar", quantity: "10ml" },
        ],
        vegetables: [
          {
            vegetable: "Tomatoes",
            farmer: "Green Valley Farm",
            location: {
              lat: 48.3069,
              lng: 16.4082,
              address: "Green Valley Farm, Lower Austria"
            },
            distance: 15.2
          },
          {
            vegetable: "Carrots",
            farmer: "Sunshine Organic Farm",
            location: {
              lat: 48.1486,
              lng: 16.2734,
              address: "Sunshine Organic Farm, Vienna Region"
            },
            distance: 8.5
          },
          {
            vegetable: "Salad",
            farmer: "Fresh Fields Co.",
            location: {
              lat: 48.2582,
              lng: 16.4129,
              address: "Fresh Fields Co., Vienna"
            },
            distance: 6.3
          }
        ],
        prepared_date: new Date().toISOString()
      };

      setMeal(mockMeal);
    } catch (error) {
      console.error("Error loading meal:", error);
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
    if (!meal || !userLocation) return 0;
    
    const storageLocation = { 
      lat: 48.28623854975886, 
      lng: 15.690691967244055 
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
        veg.location.lat,
        veg.location.lng,
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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card>
          <div className="text-center py-8">
            <p className="mb-4">Meal not found</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <>
      <Container dark fullWidth>
        <div className="flex items-center justify-between mb-6 max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="mb-4">
            <h1>{meal.name}</h1>
            <p>{meal.description}</p>
          </div>
        </div>

        <div className="h-102 overflow-hidden relative z-40 mb-6">
          <MapComponent dark
            vegetables={meal.vegetables}
            userLocation={userLocation}
            storageLocation={{ 
              lat: 48.28623854975886, 
              lng: 15.690691967244055, 
              address: "Storage Facility, Herzogenburg" 
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
          <h2 className="mb-8">Vegetable Sources</h2>
          <div className="space-y-3">
            {meal.vegetables.map((veg, index) => (
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
                        <span>ca. {veg.distance}km entfernt</span>
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
          {Array.from(new Map(meal.vegetables.map(veg => [veg.farmer, veg])).values()).map((veg, index) => {
            const farmerName = veg.farmer;
            const farmerAddress = veg.location.address;
            // Get all vegetables from this farmer
            const farmerVegetables = meal.vegetables
              .filter(v => v.farmer === veg.farmer)
              .map(v => v.vegetable);

            return (
              <Card 
                key={index}
                id={`farmer-${farmerName.replace(/\s+/g, '-').toLowerCase()}`}
              >
                {/* Profile Image */}
                <div className="aspect-video bg-gray-100 relative overflow-hidden rounded-lg mb-4">
                  <div className="w-full h-full flex items-center justify-center bg-gray-200">
                    <Avatar className="h-24 w-24">
                      <AvatarFallback className="text-3xl">
                        {farmerName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </div>
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
          })}
        </div>

        <div className="grid gap-8">
          <h2>So funktioniert unser Versprechen:</h2>
          <p>Wir vermarkten Lebensmittel von Landwirten direkt an Küchen.</p>
          <p>jazunah.at ist das Bindeglied zwischen der Landwirtschaft und Großküchen in Österreich. Die Produzenten bestimmen die Preise ihrer hochwertigen Erzeugnisse selbst – wir kümmern uns um den Weg vom Feld in die Küche. Für Köche bedeutet das: Frische, erstklassige Zutaten, welche die regionale Wirtschaft stärken und  den Geschmack der Region auf den Teller bringen. </p>
          <i>Für Landwirte, für Köche, für uns alle.</i>
        </div>
      </Container>
    </>
  );
}
