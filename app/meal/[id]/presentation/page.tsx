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
import { MapPin, QrCode } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

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
  const [precomputedRoutes, setPrecomputedRoutes] = useState<Map<string, [number, number][]>>(new Map());
  
  const params = useParams();
  const supabase = useMemo(() => createClient(), []);
  const mealId = params.id as string;

  // Generate a realistic curved route instead of straight line
  const generateCurvedRoute = (start: [number, number], end: [number, number]): [number, number][] => {
    const points: [number, number][] = [start];
    
    // Calculate distance and direction
    const latDiff = end[0] - start[0];
    const lngDiff = end[1] - start[1];
    const distance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);
    
    // Create intermediate points for a more realistic route
    const numPoints = Math.max(10, Math.floor(distance * 1000)); // More points for longer distances
    
    for (let i = 1; i < numPoints; i++) {
      const progress = i / numPoints;
      
      // Add some curve to make it look more like a real road
      const curveFactor = Math.sin(progress * Math.PI) * 0.001; // Small curve
      const roadOffset = (Math.random() - 0.5) * 0.0005; // Small random offset for realism
      
      const lat = start[0] + (latDiff * progress) + curveFactor + roadOffset;
      const lng = start[1] + (lngDiff * progress) + roadOffset;
      
      points.push([lat, lng]);
    }
    
    points.push(end);
    return points;
  };

  // Function to fetch route data with fallback to curved route
  const fetchRouteData = async (start: [number, number], end: [number, number]): Promise<[number, number][]> => {
    // Try OSRM API first, fallback to curved route if it fails
    console.log(`🌐 Trying OSRM API for route ${start} → ${end}`);
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`,
        { 
          signal: controller.signal,
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'TransparenzTool/1.0'
          }
        }
      );
      
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        console.log(`📊 OSRM API Response:`, data);
        
        if (data.routes && data.routes[0] && data.routes[0].geometry && data.routes[0].geometry.coordinates) {
          const coordinates = data.routes[0].geometry.coordinates.map(
            (coord: [number, number]) => [coord[1], coord[0]] as [number, number]
          );
          
          if (coordinates.length > 2) {
            console.log(`✅ Got REAL route from OSRM: ${coordinates.length} points`);
            return coordinates;
          } else {
            console.warn(`⚠️ OSRM returned route with only ${coordinates.length} points (too few)`);
          }
        } else {
          console.warn(`⚠️ OSRM response structure invalid:`, {
            hasRoutes: !!data.routes,
            routesLength: data.routes?.length,
            hasGeometry: !!data.routes?.[0]?.geometry,
            hasCoordinates: !!data.routes?.[0]?.geometry?.coordinates
          });
        }
      } else {
        console.error(`❌ OSRM API HTTP Error: ${response.status} ${response.statusText}`);
        try {
          const errorData = await response.text();
          console.error(`❌ OSRM Error Response:`, errorData);
        } catch (e) {
          console.error(`❌ Could not read error response`);
        }
      }
      
      console.warn(`⚠️ OSRM API call unsuccessful, using straight line fallback`);
    } catch (error) {
      console.error(`❌ OSRM API Exception:`, {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        type: typeof error,
        isAbortError: error instanceof Error && error.name === 'AbortError',
        isNetworkError: error instanceof TypeError && error.message.includes('fetch'),
        fullError: error
      });
    }
    // Fallback to straight line
    console.log(`📏 Using straight line fallback for ${start} → ${end}`);
    return [start, end];
  };

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
              console.info("ℹ️ Geolocation not available:", errorMessage, "- using default location");
              // Continue with default location - this is expected behavior
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

  // Precompute all routes when meal data is loaded
  useEffect(() => {
    if (!meal || !userLocation) return;

    const precomputeAllRoutes = async () => {
      console.log('🚀 Precomputing all routes for faster switching...');
      const routeMap = new Map<string, [number, number][]>();
      
      const storageLocation = { 
        lat: meal.storage_lat, 
        lng: meal.storage_lng 
      };

      // Get unique farmers to avoid duplicate route calculations
      const uniqueFarmers = Array.from(new Map(meal.vegetables.map(veg => [veg.farmer_name, veg])).values());
      
      for (const veg of uniqueFarmers) {
        const farmCoords: [number, number] = [veg.lat, veg.lng];
        const storageCoords: [number, number] = [storageLocation.lat, storageLocation.lng];
        const userCoords: [number, number] = [userLocation.lat, userLocation.lng];
        
        // Compute farm to storage route
        console.log(`🚗 Computing route for ${veg.farmer_name}:`, farmCoords, '→', storageCoords);
        const farmToStorageRoute = await fetchRouteData(farmCoords, storageCoords);
        console.log(`📍 Route for ${veg.farmer_name}:`, farmToStorageRoute.length, 'points');
        routeMap.set(`${veg.farmer_name}-farm-storage`, farmToStorageRoute);
        
        // Small delay to be respectful to APIs
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      // Compute storage to user route (only once)
      console.log(`🏠 Computing storage to user route`);
      const storageToUserRoute = await fetchRouteData(
        [storageLocation.lat, storageLocation.lng], 
        [userLocation.lat, userLocation.lng]
      );
      console.log(`🏠 Storage to user route:`, storageToUserRoute.length, 'points');
      routeMap.set('storage-user', storageToUserRoute);
      
      setPrecomputedRoutes(routeMap);
      console.log('✅ All routes precomputed! Total routes:', routeMap.size);
      console.log('📊 Route map:', Array.from(routeMap.entries()).map(([key, route]) => `${key}: ${route.length} points`));
    };

    precomputeAllRoutes();
  }, [meal, userLocation]);

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
    
    // Use only current farmer's vegetables for distance calculation
    const vegetablesToCalculate = highlightedFarmer 
      ? meal.vegetables.filter(veg => veg.farmer_name === highlightedFarmer)
      : meal.vegetables;
    
    if (vegetablesToCalculate.length === 0) return "0";
    
    const total = vegetablesToCalculate.reduce((sum, veg) => {
      const farmToStorageDistance = calculateDistance(
        veg.lat,
        veg.lng,
        storageLocation.lat,
        storageLocation.lng
      );
      return sum + farmToStorageDistance + storageToUserDistance;
    }, 0);
    
    return (total / vegetablesToCalculate.length).toFixed(1);
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

  // Filter vegetables to show only the current farmer's products for cleaner map display
  const currentFarmerVegetables = highlightedFarmer 
    ? transformedVegetables.filter(veg => veg.farmer === highlightedFarmer)
    : transformedVegetables;

  // Get precomputed routes for current farmer
  const currentRoutes: { [key: string]: [number, number][] } = {};
  if (highlightedFarmer) {
    const farmRoute = precomputedRoutes.get(`${highlightedFarmer}-farm-storage`);
    const userRoute = precomputedRoutes.get('storage-user');
    
    console.log(`🔄 Switching to farmer: ${highlightedFarmer}`);
    console.log(`📍 Farm route available:`, farmRoute ? `${farmRoute.length} points` : 'none');
    console.log(`🏠 User route available:`, userRoute ? `${userRoute.length} points` : 'none');
    
    if (farmRoute && farmRoute.length > 0) {
      currentRoutes['farm-0-storage'] = farmRoute;
      console.log(`✅ Using precomputed farm route (${farmRoute.length} points)`);
    }
    if (userRoute && userRoute.length > 0) {
      currentRoutes['storage-user'] = userRoute;
      console.log(`✅ Using precomputed user route (${userRoute.length} points)`);
    }
  }

  return (
    <>
      <Container dark fullWidth>
        <div className="flex items-center justify-between max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 py-6">
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

        <div className="overflow-hidden relative z-40" style={{ height: 'calc(100vh - 226px)' }}>
          <div className="w-1/4 relative z-1000 top-[20%] ml-8">
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
            vegetables={currentFarmerVegetables}
            userLocation={userLocation}
            storageLocation={{ 
              lat: meal.storage_lat, 
              lng: meal.storage_lng, 
              address: meal.storage_address,
              name: meal.storage_name
            }}
            mealName={meal.name}
            highlightedFarmer={highlightedFarmer}
            precomputedRoutes={currentRoutes}
          />
        </div>

        {/* QR Code Section */}
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 py-12">
          <Card className="p-8">
            <div className="flex flex-col md:flex-row items-center justify-center gap-8">
              <div className="flex-1 text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-2 mb-4">
                  <QrCode className="h-8 w-8" />
                  <h2 className="text-3xl font-bold">Mehr erfahren</h2>
                </div>
                <p className="text-lg mb-4">
                  Scanne den QR-Code, um mehr Details über diese Mahlzeit zu erfahren.
                </p>
              </div>
              <div className="flex-shrink-0">
                <div className="bg-white p-6 rounded-lg shadow-lg">
                  <QRCodeSVG
                    value={`${typeof window !== 'undefined' ? window.location.origin : ''}/meal/${mealId}`}
                    size={200}
                    level="H"
                    includeMargin={true}
                  />
                </div>
              </div>
            </div>
          </Card>
        </div>
      </Container>
    </>
  );
}
