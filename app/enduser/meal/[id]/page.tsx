"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useParams } from "next/navigation";
import Card from "@/app/components/Card";
import Container from "@/app/components/Container";
import PageSkeleton from "@/app/components/PageSkeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  loading: () => <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">Loading map...</div>
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
            <Button onClick={() => router.push("/enduser")}>
              Back to Dashboard
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <Container asPage>
        <div className="flex items-center justify-between mb-6">
          <h1 className="mb-4">Meal Details</h1>
          <Button
            onClick={() => router.push("/enduser")}
            variant="ghost"
            className="hover:text-foreground"
          >
            ← Back to Dashboard
          </Button>
        </div>

        {/* Meal Overview */}
        <Card className="mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="mb-2">{meal.name}</h2>
              <p>{meal.description}</p>
            </div>
            <Badge variant="outline">
              Prepared: {new Date(meal.prepared_date).toLocaleDateString()}
            </Badge>
          </div>
        </Card>

        {/* Ingredients */}
        <Card className="mb-6">
          <h3 className="mb-4">Ingredients</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ingredient</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {meal.ingredients.map((ingredient, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium text-black">{ingredient.name}</TableCell>
                  <TableCell className="text-right text-black">{ingredient.quantity}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        {/* Vegetable Sources */}
        <Card className="mb-6">
          <h3 className="mb-4">Vegetable Sources</h3>
          <p className="mb-4">
            All vegetables are sourced from local farmers in your region
          </p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vegetable</TableHead>
                <TableHead>Farmer</TableHead>
                <TableHead>Location</TableHead>
                <TableHead className="text-right">Distance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {meal.vegetables.map((veg, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium text-black">{veg.vegetable}</TableCell>
                  <TableCell className="text-black">{veg.farmer}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {veg.location.address}
                    </div>
                  </TableCell>
                  <TableCell className="text-right text-black font-semibold">
                    {veg.distance} km
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
            <div className="flex items-center gap-2">
              <Navigation className="h-5 w-5 text-green-700" />
              <p className="text-green-800 font-semibold">
                Average distance from farm to your location: {calculateAverageDistance()} km
              </p>
            </div>
          </div>
        </Card>

        {/* Map */}
        <Card>
          <h3 className="mb-4">Farm Locations</h3>
          <p className="mb-4">
            See where your vegetables were grown on the map below
          </p>
          <div className="h-96 rounded-lg overflow-hidden">
            <MapComponent 
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
        </Card>
    </Container>
  );
}
