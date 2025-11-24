"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

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
}

// Component to fit map bounds to show all markers
function FitBounds({ vegetables, userLocation, storageLocation, farmers }: { 
  vegetables?: VegetableSource[], 
  userLocation?: { lat: number; lng: number } | null,
  storageLocation?: { lat: number; lng: number; address: string; name?: string } | null,
  farmers?: FarmerProfile[]
}) {
  const map = useMap();

  useEffect(() => {
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
  }, [map, vegetables, userLocation, storageLocation, farmers]);

  return null;
}

export default function MapComponent({ 
  vegetables = [], 
  userLocation, 
  storageLocation, 
  mealName,
  farmers = [],
  mode = 'meal',
  dark = false
}: MapComponentProps) {
  // State for storing route coordinates
  const [routes, setRoutes] = useState<{
    [key: string]: [number, number][];
  }>({});

  // Fetch route from OSRM API
  const fetchRoute = async (start: [number, number], end: [number, number], routeKey: string) => {
    try {
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`
      );
      const data = await response.json();
      
      if (data.routes && data.routes[0]) {
        const coordinates = data.routes[0].geometry.coordinates.map(
          (coord: [number, number]) => [coord[1], coord[0]] as [number, number]
        );
        setRoutes(prev => ({ ...prev, [routeKey]: coordinates }));
      }
    } catch (error) {
      console.error('Error fetching route:', error);
      // Fallback to straight line if routing fails
      setRoutes(prev => ({ ...prev, [routeKey]: [start, end] }));
    }
  };

  // Fetch all routes when component mounts or data changes
  useEffect(() => {
    if (mode === 'meal' && storageLocation) {
      // Fetch routes from each farm to storage
      vegetables.forEach((veg, index) => {
        const farmCoords: [number, number] = [veg.location.lat, veg.location.lng];
        const storageCoords: [number, number] = [storageLocation.lat, storageLocation.lng];
        fetchRoute(farmCoords, storageCoords, `farm-${index}-storage`);
      });

      // Fetch route from storage to user location
      if (userLocation) {
        const storageCoords: [number, number] = [storageLocation.lat, storageLocation.lng];
        const userCoords: [number, number] = [userLocation.lat, userLocation.lng];
        fetchRoute(storageCoords, userCoords, 'storage-user');
      }
    }
  }, [vegetables, userLocation, storageLocation, mode]);

  // Create custom SVG icons for farms and user
  const createCustomIcon = (color: string, imageUrl?: string) => {
    const iconImage = imageUrl || '/vegetable-icon.svg';
    const svgIcon = `
      <svg width="40" height="50" viewBox="0 0 40 50" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 0C8.95 0 0 8.95 0 20c0 15 20 30 20 30s20-15 20-30C40 8.95 31.05 0 20 0z" 
              fill="#fff"/>
        <circle cx="20" cy="20" r="16" fill="${color}"/>
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

  return (
    <MapContainer
      key={dark ? 'dark-map' : 'light-map'}
      center={[center.lat, center.lng]}
      zoom={8}
      minZoom={3}
      maxZoom={18}
      style={{ height: "100%", width: "100%" }}
      scrollWheelZoom={false}
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
        <>
          <TileLayer
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png"
          />
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png"
          />
        </>
      )}
      
      {/* Automatically fit bounds to show all markers */}
      <FitBounds vegetables={vegetables} userLocation={userLocation} storageLocation={storageLocation} farmers={farmers} />

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
        const ingredientIcon = createCustomIcon('orange', veg.image_url);
        
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

            {/* Draw route from farm to storage */}
            {storageLocation && routes[`farm-${index}-storage`] && (
              <Polyline
                positions={routes[`farm-${index}-storage`]}
                pathOptions={{ color: "orange", weight: 3, opacity: 0.7 }}
              />
            )}
          </div>
        );
      })}

      {/* Draw route from storage to user location */}
      {storageLocation && userLocation && routes['storage-user'] && (
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
                    <br />
                  </>
                )}
                {farmer.vegetables.length > 0 && (
                  <>
                    <span className="text-xs font-medium">
                      Vegetables: {farmer.vegetables.join(", ")}
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
