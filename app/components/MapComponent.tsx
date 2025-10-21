"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle } from "react-leaflet";
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
}

export default function MapComponent({ vegetables, userLocation }: MapComponentProps) {
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

  const createLogoIcon = (color: string) => {
    const svgIcon = `
      <svg width="40" height="50" viewBox="0 0 40 50" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 0C8.95 0 0 8.95 0 20c0 15 20 30 20 30s20-15 20-30C40 8.95 31.05 0 20 0z" 
              fill="${color}" stroke="white" stroke-width="2"/>
        <image x="10" y="10" width="20" height="20" href="/icon.svg" />
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

  const farmIcon = createCustomIcon('#22c55e', '🌾');
  const userIcon = createLogoIcon('#3b82f6');

  // Calculate center point
  const center = userLocation || { lat: 48.2082, lng: 16.3738 };

  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={10}
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

      {/* User location marker */}
      {userLocation && (
        <>
          <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
            <Popup>
              <div className="text-center">
                <strong>Your Location</strong>
              </div>
            </Popup>
          </Marker>
          <Circle
            center={[userLocation.lat, userLocation.lng]}
            radius={500}
            pathOptions={{ color: "blue", fillColor: "blue", fillOpacity: 0.1 }}
          />
        </>
      )}

      {/* Farm markers and lines to user */}
      {vegetables.map((veg, index) => (
        <div key={index}>
          <Marker position={[veg.location.lat, veg.location.lng]} icon={farmIcon}>
            <Popup>
              <div>
                <strong>{veg.farmer}</strong>
                <br />
                <span className="text-sm">{veg.vegetable}</span>
                <br />
                <span className="text-xs text-gray-600">{veg.location.address}</span>
                <br />
                <span className="text-sm font-semibold text-green-700">
                  {veg.distance} km away
                </span>
              </div>
            </Popup>
          </Marker>

          {/* Draw line from farm to user location */}
          {userLocation && (
            <Polyline
              positions={[
                [veg.location.lat, veg.location.lng],
                [userLocation.lat, userLocation.lng]
              ]}
              pathOptions={{ color: "green", weight: 2, opacity: 0.6, dashArray: "5, 10" }}
            />
          )}
        </div>
      ))}
    </MapContainer>
  );
}
