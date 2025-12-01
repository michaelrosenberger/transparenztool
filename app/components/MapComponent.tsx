"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Component to handle map recentering in presentation mode
function MapRecenter({ 
  highlightedFarmer, 
  vegetables, 
  storageLocation, 
  userLocation 
}: { 
  highlightedFarmer: string | null | undefined;
  vegetables: VegetableSource[];
  storageLocation: { lat: number; lng: number; address: string; name?: string } | null;
  userLocation: { lat: number; lng: number } | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (highlightedFarmer !== null && highlightedFarmer !== undefined) {
      // Find the highlighted farmer's location
      const highlightedVeg = vegetables.find(veg => veg.farmer === highlightedFarmer);
      
      if (highlightedVeg && storageLocation) {
        const points: L.LatLngExpression[] = [
          [highlightedVeg.location.lat, highlightedVeg.location.lng],
          [storageLocation.lat, storageLocation.lng],
        ];
        
        if (userLocation) {
          points.push([userLocation.lat, userLocation.lng]);
        }
        
        // Fit bounds to show all three points with padding
        // Add extra left padding to account for the overlay (25% of map width)
        const bounds = L.latLngBounds(points);
        const mapSize = map.getSize();
        const leftPadding = mapSize.x * 0.25; // 25% of map width
        
        map.fitBounds(bounds, { 
          paddingTopLeft: [leftPadding + 50, 50],
          paddingBottomRight: [50, 50],
          maxZoom: 13,
          animate: true,
          duration: 1
        });
      }
    }
  }, [highlightedFarmer, vegetables, storageLocation, userLocation, map]);

  return null;
}

// Fix for default marker icons in React-Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface VegetableSource {
  vegetable: string;
  farmer: string;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  distance: number;
  image_url?: string;
}

interface FarmerProfile {
  user_id: string;
  full_name: string;
  profile_image?: string;
  street?: string;
  zip_code?: string;
  city?: string;
  vegetables: string[];
  address_coordinates?: { lat: number; lng: number };
}

interface MapComponentProps {
  // For meal tracking mode
  vegetables?: VegetableSource[];
  userLocation?: { lat: number; lng: number } | null;
  storageLocation?: { lat: number; lng: number; address: string; name?: string } | null;
  mealName?: string;
  
  // For farmer directory mode
  farmers?: FarmerProfile[];
  
  // Mode selector
  mode?: 'meal' | 'farmers';
  
  // Dark mode
  dark?: boolean;
  
  // Highlighted farmer (for carousel sync)
  highlightedFarmer?: string | null;
  
  // Precomputed routes for faster switching
  precomputedRoutes?: { [key: string]: [number, number][] };
  
  // Control route visibility
  showRoutes?: boolean;
}

// Component to fit map bounds to show all markers
function FitBounds({ vegetables, userLocation, storageLocation, farmers, highlightedFarmer }: { 
  vegetables?: VegetableSource[], 
  userLocation?: { lat: number; lng: number } | null,
  storageLocation?: { lat: number; lng: number; address: string; name?: string } | null,
  farmers?: FarmerProfile[],
  highlightedFarmer?: string | null
}) {
  const map = useMap();

  useEffect(() => {
    // In presentation mode, MapRecenter handles the zoom/centering
    if (highlightedFarmer !== null && highlightedFarmer !== undefined) {
      return;
    }

    // Normal mode: fit to all bounds
    const bounds: [number, number][] = [];
    
    // Add all farm locations from vegetables
    if (vegetables) {
      vegetables.forEach(veg => {
        bounds.push([veg.location.lat, veg.location.lng]);
      });
    }
    
    // Add all farmer locations
    if (farmers) {
      farmers.forEach(farmer => {
        if (farmer.address_coordinates) {
          bounds.push([farmer.address_coordinates.lat, farmer.address_coordinates.lng]);
        }
      });
    }
    
    // Add storage location if exists
    if (storageLocation) {
      bounds.push([storageLocation.lat, storageLocation.lng]);
    }
    
    // Add user location if exists
    if (userLocation) {
      bounds.push([userLocation.lat, userLocation.lng]);
    }
    
    // Fit map to bounds if we have points
    if (bounds.length > 0) {
      map.fitBounds(bounds, { 
        padding: [50, 50], 
        maxZoom: 13,
        animate: true,
        duration: 0.5
      });
    }
  }, [map, vegetables, userLocation, storageLocation, farmers, highlightedFarmer]);

  return null;
}

export default function MapComponent({ 
  vegetables = [], 
  userLocation, 
  storageLocation, 
  mealName,
  farmers = [],
  mode = 'meal',
  dark = false,
  highlightedFarmer = null,
  precomputedRoutes = {},
  showRoutes = true
}: MapComponentProps) {
  // State for storing route coordinates
  const [routes, setRoutes] = useState<{
    [key: string]: [number, number][];
  }>({});
  
  // Loading state for presentation mode
  const [isLoadingRoutes, setIsLoadingRoutes] = useState(false);
  
  // Ref to track which routes have been requested to avoid duplicate fetches
  const requestedRoutes = useState(new Set<string>())[0];
  
  // Track if initial routes have been loaded in presentation mode
  const [initialRoutesLoaded, setInitialRoutesLoaded] = useState(false);
  
  // Track successful route fetches (real OSRM routes, not fallbacks)
  const [successfulRoutes, setSuccessfulRoutes] = useState(new Set<string>());
  const [expectedRouteCount, setExpectedRouteCount] = useState(0);

  // Generate curved route that simulates realistic road paths
  const generateCurvedRoute = (start: [number, number], end: [number, number]): [number, number][] => {
    const points: [number, number][] = [start];
    
    const latDiff = end[0] - start[0];
    const lngDiff = end[1] - start[1];
    const distance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);
    
    // More points for longer distances to make it look more realistic
    const numPoints = Math.max(30, Math.floor(distance * 2000));
    
    // Add some randomness to simulate road curvature
    const seed = start[0] + start[1] + end[0] + end[1];
    let angle = seed * 100;
    
    for (let i = 1; i < numPoints; i++) {
      const progress = i / numPoints;
      
      // Create natural-looking curves using sine waves at different frequencies
      const largeCurve = Math.sin(progress * Math.PI * 2) * 0.002;
      const mediumCurve = Math.sin(progress * Math.PI * 4 + angle) * 0.001;
      const smallCurve = Math.sin(progress * Math.PI * 8 + angle * 2) * 0.0005;
      
      // Perpendicular offset to create road-like curves
      const perpLat = -lngDiff / distance;
      const perpLng = latDiff / distance;
      
      const totalCurve = largeCurve + mediumCurve + smallCurve;
      
      const lat = start[0] + (latDiff * progress) + (perpLat * totalCurve);
      const lng = start[1] + (lngDiff * progress) + (perpLng * totalCurve);
      
      points.push([lat, lng]);
      angle += 0.1;
    }
    
    points.push(end);
    return points;
  };

  // Fetch route using backend API proxy (avoids CORS issues)
  const fetchRoute = async (start: [number, number], end: [number, number], routeKey: string) => {
    const url = `/api/route?start=${start[0]},${start[1]}&end=${end[0]},${end[1]}`;
    console.log(`[Route] Fetching ${routeKey} from:`, url);
    
    try {
      // Call our backend API which proxies to OSRM
      const response = await fetch(url, { 
        signal: AbortSignal.timeout(15000), // Increased to 15 seconds
        cache: 'no-store'
      });

      console.log(`[Route] ${routeKey} response status:`, response.status);

      if (response.ok) {
        const data = await response.json();
        console.log(`[Route] ${routeKey} data:`, { success: data.success, coordCount: data.coordinates?.length, error: data.error });
        
        if (data.success && data.coordinates && data.coordinates.length > 2) {
          console.log(`[Route] ✅ ${routeKey} SUCCESS - ${data.coordinates.length} points`);
          setRoutes(prev => ({ ...prev, [routeKey]: data.coordinates }));
          // Mark this route as successful (real OSRM route)
          setSuccessfulRoutes(prev => new Set([...prev, routeKey]));
          return;
        } else {
          console.warn(`[Route] ⚠️ ${routeKey} API returned no valid route:`, data.error);
        }
      } else {
        console.error(`[Route] ❌ ${routeKey} HTTP error:`, response.status);
      }
    } catch (error) {
      console.error(`[Route] ❌ ${routeKey} fetch failed:`, error instanceof Error ? error.message : error);
    }
    
    // Fallback to curved route if OSRM fails
    console.log(`[Route] 📏 ${routeKey} using fallback (not displayed)`);
    const curvedRoute = generateCurvedRoute(start, end);
    setRoutes(prev => ({ ...prev, [routeKey]: curvedRoute }));
  };

  // Use precomputed routes or fetch new ones
  useEffect(() => {
    if (mode === 'meal' && storageLocation) {
      // If we have precomputed routes, use them immediately
      if (Object.keys(precomputedRoutes).length > 0) {
        setRoutes(precomputedRoutes);
        setInitialRoutesLoaded(true);
        return;
      }
      
      const isPresentationMode = highlightedFarmer !== null && highlightedFarmer !== undefined;
      
      if (isPresentationMode && !initialRoutesLoaded) {
        // In presentation mode, pre-fetch ALL routes on initial load
        setIsLoadingRoutes(true);
        const totalRoutes = vegetables.length + (userLocation ? 1 : 0);
        setExpectedRouteCount(totalRoutes);
        
        // Fetch all farmer routes with staggered delays
        vegetables.forEach((veg, index) => {
          const farmCoords: [number, number] = [veg.location.lat, veg.location.lng];
          const storageCoords: [number, number] = [storageLocation.lat, storageLocation.lng];
          const routeKey = `farm-${index}-storage`;
          
          if (!requestedRoutes.has(routeKey)) {
            requestedRoutes.add(routeKey);
            setTimeout(() => {
              fetchRoute(farmCoords, storageCoords, routeKey);
            }, index * 300);
          }
        });
        
        // Fetch storage-to-user route
        if (userLocation && !requestedRoutes.has('storage-user')) {
          requestedRoutes.add('storage-user');
          const storageCoords: [number, number] = [storageLocation.lat, storageLocation.lng];
          const userCoords: [number, number] = [userLocation.lat, userLocation.lng];
          setTimeout(() => {
            fetchRoute(storageCoords, userCoords, 'storage-user');
          }, vegetables.length * 300);
        }
        
        // Mark as loaded and stop loading after all routes should be fetched
        setTimeout(() => {
          setInitialRoutesLoaded(true);
          setIsLoadingRoutes(false);
        }, (vegetables.length + 1) * 300 + 5000); // Extra 5 seconds for API calls
      } else if (!isPresentationMode && !initialRoutesLoaded) {
        // In normal mode, pre-fetch all routes with loading state
        setIsLoadingRoutes(true);
        const totalRoutes = vegetables.length + (userLocation ? 1 : 0);
        setExpectedRouteCount(totalRoutes);
        
        // Fetch routes for all vegetables with staggered delays to avoid rate limiting
        vegetables.forEach((veg, index) => {
          const farmCoords: [number, number] = [veg.location.lat, veg.location.lng];
          const storageCoords: [number, number] = [storageLocation.lat, storageLocation.lng];
          const routeKey = `farm-${index}-storage`;
          
          if (!requestedRoutes.has(routeKey)) {
            requestedRoutes.add(routeKey);
            // Stagger requests by 200ms each to avoid rate limiting
            setTimeout(() => {
              fetchRoute(farmCoords, storageCoords, routeKey);
            }, index * 200);
          }
        });
        
        // Fetch storage-to-user route after all farm routes
        if (userLocation && !requestedRoutes.has('storage-user')) {
          requestedRoutes.add('storage-user');
          const storageCoords: [number, number] = [storageLocation.lat, storageLocation.lng];
          const userCoords: [number, number] = [userLocation.lat, userLocation.lng];
          // Delay this by the number of vegetables * 200ms
          setTimeout(() => {
            fetchRoute(storageCoords, userCoords, 'storage-user');
          }, vegetables.length * 200);
        }
        
        // Mark as loaded and stop loading after all routes should be fetched
        setTimeout(() => {
          setInitialRoutesLoaded(true);
          setIsLoadingRoutes(false);
        }, (vegetables.length + 1) * 200 + 5000); // Extra 5 seconds for API calls
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vegetables, userLocation, storageLocation, mode, precomputedRoutes]);

  // Create custom SVG icons for farms and user
  const createCustomIcon = (color: string, imageUrl?: string, highlighted?: boolean) => {
    // Always use the default vegetable icon for consistency
    const iconImage = '/vegetable-icon.svg';
    // In presentation view (when highlightedFarmer prop is passed), default is black, highlighted is orange
    // In other views, always use the passed color (orange)
    const isPresentationView = highlightedFarmer !== null && highlightedFarmer !== undefined;
    const circleFill = isPresentationView ? (highlighted ? 'orange' : 'black') : color;
    const svgIcon = `
      <svg width="40" height="50" viewBox="0 0 40 50" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 0C8.95 0 0 8.95 0 20c0 15 20 30 20 30s20-15 20-30C40 8.95 31.05 0 20 0z" 
              fill="#fff"/>
        <circle cx="20" cy="20" r="16" fill="${circleFill}"/>
        <image x="10" y="10" width="20" height="20" href="${iconImage}" style="clip-path: circle(10px at center);" />
      </svg>
    `;
    return L.divIcon({
      html: svgIcon,
      className: 'custom-marker',
      iconSize: [40, 50],
      iconAnchor: [20, 50],
      popupAnchor: [0, -50]
    });
  };

  const createStorageIcon = (color: string) => {
    const svgIcon = `
      <svg width="40" height="50" viewBox="0 0 40 50" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 0C8.95 0 0 8.95 0 20c0 15 20 30 20 30s20-15 20-30C40 8.95 31.05 0 20 0z" 
              fill="${color}"/>
        <circle cx="20" cy="20" r="16" fill="black"/>
        <image x="10" y="10" width="20" height="20" href="/map-icon.svg" />
      </svg>
    `;
    return L.divIcon({
      html: svgIcon,
      className: 'custom-marker',
      iconSize: [40, 50],
      iconAnchor: [20, 50],
      popupAnchor: [0, -50]
    });
  };

  const createMealIcon = (color: string) => {
    const svgIcon = `
      <svg width="40" height="50" viewBox="0 0 40 50" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 0C8.95 0 0 8.95 0 20c0 15 20 30 20 30s20-15 20-30C40 8.95 31.05 0 20 0z" 
              fill="${color}"/>
        <circle cx="20" cy="20" r="16" fill="black"/>
        <image x="10" y="10" width="20" height="20" href="/meal-icon.svg" />
      </svg>
    `;
    return L.divIcon({
      html: svgIcon,
      className: 'custom-marker',
      iconSize: [40, 50],
      iconAnchor: [20, 50],
      popupAnchor: [0, -50]
    });
  };

  const farmIcon = createCustomIcon('orange');
  const storageIcon = createStorageIcon('#fff');
  const userIcon = createMealIcon('#fff');
  
  // Calculate center point based on all markers
  const calculateCenter = () => {
    // In presentation mode (when highlightedFarmer is provided), always center on Niederösterreich
    if (highlightedFarmer !== null && highlightedFarmer !== undefined) {
      return { lat: 48.2082, lng: 15.6378 }; // Niederösterreich center
    }

    const allPoints: { lat: number; lng: number }[] = [];
    
    // Add all farm locations from vegetables
    vegetables.forEach(veg => {
      allPoints.push({ lat: veg.location.lat, lng: veg.location.lng });
    });
    
    // Add all farmer locations
    farmers.forEach(farmer => {
      if (farmer.address_coordinates) {
        allPoints.push({ lat: farmer.address_coordinates.lat, lng: farmer.address_coordinates.lng });
      }
    });
    
    // Add storage location if exists
    if (storageLocation) {
      allPoints.push({ lat: storageLocation.lat, lng: storageLocation.lng });
    }
    
    // Add user location if exists
    if (userLocation) {
      allPoints.push(userLocation);
    }
    
    // If no points, default to center of Austria
    if (allPoints.length === 0) {
      return { lat: 47.5, lng: 13.5 };
    }
    
    // Calculate average of all points
    const avgLat = allPoints.reduce((sum, point) => sum + point.lat, 0) / allPoints.length;
    const avgLng = allPoints.reduce((sum, point) => sum + point.lng, 0) / allPoints.length;
    
    return { lat: avgLat, lng: avgLng };
  };
  
  const center = calculateCenter();
  // Use appropriate zoom level for presentation mode
  const zoomLevel = (highlightedFarmer !== null && highlightedFarmer !== undefined) ? 9 : 8;

  // Don't show loading overlay - show map immediately and load routes in background

  return (
    <MapContainer
      key={dark ? 'dark-map' : 'light-map'}
      center={[center.lat, center.lng]}
      zoom={zoomLevel}
      minZoom={3}
      maxZoom={18}
      style={{ height: "100%", width: "100%" }}
      scrollWheelZoom={true}
      //dragging={mode !== 'meal'}
    >
      {dark ? (
        <>
          <TileLayer
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}.png"
          />
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}.png"
          />
        </>
      ) : (
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.de/{z}/{x}/{y}.png"
        />
      )}
      
      {/* Recenter map when highlighted farmer changes in presentation mode */}
      {highlightedFarmer !== null && highlightedFarmer !== undefined && storageLocation && (
        <MapRecenter 
          highlightedFarmer={highlightedFarmer}
          vegetables={vegetables}
          storageLocation={storageLocation}
          userLocation={userLocation || null}
        />
      )}
      
      {/* Automatically fit bounds to show all markers */}
      <FitBounds vegetables={vegetables} userLocation={userLocation} storageLocation={storageLocation} farmers={farmers} highlightedFarmer={highlightedFarmer} />

      {/* Storage location marker */}
      {storageLocation && (
        <Marker position={[storageLocation.lat, storageLocation.lng]} icon={storageIcon}>
          <Popup>
            <div className="text-left">
              <strong>{storageLocation.name || "Storage Location"}</strong>
              <br />
              <span className="text-xs">{storageLocation.address}</span>
            </div>
          </Popup>
        </Marker>
      )}

      {/* User location marker */}
      {userLocation && (
        <>
          <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
            <Popup>
              <div className="text-left">
                <strong>{mealName || "Your Location"}</strong>
              </div>
            </Popup>
          </Marker>
          <Circle
            center={[userLocation.lat, userLocation.lng]}
            radius={500}
            pathOptions={{ color: "orange", fillColor: "orange", fillOpacity: 0.1 }}
          />
        </>
      )}

      {/* Farm markers and lines */}
      {vegetables.map((veg, index) => {
        // Create ingredient-specific icon with custom image if available
        const isHighlighted = highlightedFarmer === veg.farmer;
        const ingredientIcon = createCustomIcon('orange', veg.image_url, isHighlighted);
        
        // In presentation mode, only show the highlighted farmer
        const shouldShow = highlightedFarmer === null || highlightedFarmer === undefined || isHighlighted;
        
        if (!shouldShow) return null;
        
        return (
          <div key={index}>
            <Marker position={[veg.location.lat, veg.location.lng]} icon={ingredientIcon}>
              <Popup>
                <div>
                  <strong>{veg.farmer}</strong>
                  <br />
                  <span>{veg.vegetable}</span>
                  <br />
                  <span className="text-xs">{veg.location.address}</span>
                  <br />
                  <span className="font-medium text-green-700">
                    {veg.distance.toFixed(1)} km entfernt
                  </span>
                </div>
              </Popup>
            </Marker>

            {/* Draw route from farm to storage - only if successfully loaded from OSRM */}
            {showRoutes && storageLocation && routes[`farm-${index}-storage`] && successfulRoutes.has(`farm-${index}-storage`) && (
              <Polyline
                positions={routes[`farm-${index}-storage`]}
                pathOptions={{ color: "orange", weight: 3, opacity: 0.7 }}
              />
            )}
          </div>
        );
      })}

      {/* Draw route from storage to user location - only if successfully loaded from OSRM */}
      {showRoutes && storageLocation && userLocation && routes['storage-user'] && successfulRoutes.has('storage-user') && (
        <Polyline
          positions={routes['storage-user']}
          pathOptions={{ color: "orange", weight: 3, opacity: 0.7 }}
        />
      )}

      {/* Farmer directory markers (farmers mode) */}
      {mode === 'farmers' && farmers.map((farmer) => {
        if (!farmer.address_coordinates) return null;
        
        const address = [farmer.street, farmer.zip_code, farmer.city]
          .filter(Boolean)
          .join(", ");

        return (
          <Marker
            key={farmer.user_id}
            position={[farmer.address_coordinates.lat, farmer.address_coordinates.lng]}
            icon={farmIcon}
          >
            <Popup>
              <div>
                <strong className="text-base">{farmer.full_name}</strong>
                <br />
                {address && (
                  <>
                    <span className="text-xs">{address}</span>
                    <br /><br />
                  </>
                )}
                {farmer.vegetables.length > 0 && (
                  <>
                    <span className="text-xs font-medium">
                      {farmer.vegetables.join(", ")}
                    </span>
                  </>
                )}
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
