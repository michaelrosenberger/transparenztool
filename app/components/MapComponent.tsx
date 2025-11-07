"use client";

import { useEffect } from "react";
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
}

interface MapComponentProps {
  vegetables: VegetableSource[];
  userLocation: { lat: number; lng: number } | null;
  storageLocation?: { lat: number; lng: number; address: string } | null;
  mealName?: string;
}

// Component to fit map bounds to show all markers
function FitBounds({ vegetables, userLocation, storageLocation }: { 
  vegetables: VegetableSource[], 
  userLocation: { lat: number; lng: number } | null,
  storageLocation?: { lat: number; lng: number; address: string } | null
}) {
  const map = useMap();

  useEffect(() => {
    const bounds: [number, number][] = [];
    
    // Add all farm locations
    vegetables.forEach(veg => {
      bounds.push([veg.location.lat, veg.location.lng]);
    });
    
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
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 10 });
    }
  }, [map, vegetables, userLocation, storageLocation]);

  return null;
}

export default function MapComponent({ vegetables, userLocation, storageLocation, mealName }: MapComponentProps) {
  // Create custom SVG icons for farms and user
  const createCustomIcon = (color: string, emoji: string) => {
    const svgIcon = `
      <svg width="40" height="50" viewBox="0 0 40 50" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 0C8.95 0 0 8.95 0 20c0 15 20 30 20 30s20-15 20-30C40 8.95 31.05 0 20 0z" 
              fill="${color}" stroke="white" stroke-width="2"/>
        <text x="20" y="22" font-size="18" text-anchor="middle" dominant-baseline="middle">${emoji}</text>
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
              fill="${color}" stroke="white" stroke-width="2"/>
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
              fill="${color}" stroke="white" stroke-width="2"/>
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

  const farmIcon = createCustomIcon('orange', '🌾');
  const storageIcon = createStorageIcon('#000');
  const userIcon = createMealIcon('#000');

  // Austria bounds and center
  const austriaBounds: [[number, number], [number, number]] = [
    [46.4, 9.5],   // Southwest corner (lat, lng)
    [49.0, 17.2]   // Northeast corner (lat, lng)
  ];
  
  // Calculate center point based on all markers
  const calculateCenter = () => {
    const allPoints: { lat: number; lng: number }[] = [];
    
    // Add all farm locations
    vegetables.forEach(veg => {
      allPoints.push({ lat: veg.location.lat, lng: veg.location.lng });
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
      center={[center.lat, center.lng]}
      zoom={8}
      minZoom={7}
      maxZoom={13}
      maxBounds={austriaBounds}
      maxBoundsViscosity={1.0}
      style={{ height: "100%", width: "100%" }}
      scrollWheelZoom={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png"
      />
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png"
      />
      
      {/* Automatically fit bounds to show all markers */}
      <FitBounds vegetables={vegetables} userLocation={userLocation} storageLocation={storageLocation} />

      {/* Storage location marker */}
      {storageLocation && (
        <Marker position={[storageLocation.lat, storageLocation.lng]} icon={storageIcon}>
          <Popup>
            <div className="text-center">
              <strong>Storage Location</strong>
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
              <div className="text-center">
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
      {vegetables.map((veg, index) => (
        <div key={index}>
          <Marker position={[veg.location.lat, veg.location.lng]} icon={farmIcon}>
            <Popup>
              <div>
                <strong>{veg.farmer}</strong>
                <br />
                <span>{veg.vegetable}</span>
                <br />
                <span className="text-xs">{veg.location.address}</span>
                <br />
                <span className="font-semibold text-green-700">
                  {veg.distance} km away
                </span>
              </div>
            </Popup>
          </Marker>

          {/* Draw line from farm to storage */}
          {storageLocation && (
            <Polyline
              positions={[
                [veg.location.lat, veg.location.lng],
                [storageLocation.lat, storageLocation.lng]
              ]}
              pathOptions={{ color: "orange", weight: 2, opacity: 0.6, dashArray: "5, 10" }}
            />
          )}
        </div>
      ))}

      {/* Draw line from storage to user location */}
      {storageLocation && userLocation && (
        <Polyline
          positions={[
            [storageLocation.lat, storageLocation.lng],
            [userLocation.lat, userLocation.lng]
          ]}
          pathOptions={{ color: "orange", weight: 2, opacity: 0.6, dashArray: "5, 10" }}
        />
      )}
    </MapContainer>
  );
}
