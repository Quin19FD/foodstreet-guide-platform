"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

interface MapboxMapProps {
  pois: Array<{
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    type?: string;
    description?: string;
  }>;
  selectedPOI?: string | null;
  onPOIClick?: (id: string) => void;
  center?: [number, number];
  zoom?: number;
}

export function MapboxMap({
  pois,
  selectedPOI,
  onPOIClick,
  center = [106.7009, 10.7769], // Default: Ho Chi Minh City
  zoom = 13,
}: MapboxMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<Map<string, mapboxgl.Marker>>(new Map());
  const [isLoading, setIsLoading] = useState(true);

  // Initialize Mapbox
  useEffect(() => {
    if (!mapContainer.current) return;

    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token) {
      console.error("Mapbox token not found");
      setIsLoading(false);
      return;
    }

    mapboxgl.accessToken = token;

    // Create map instance
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center,
      zoom,
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

    // Add geolocate control
    map.current.addControl(
      new mapboxgl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true,
        },
        trackUserLocation: true,
      }),
      "top-right"
    );

    map.current.on("load", () => {
      setIsLoading(false);
    });

    return () => {
      if (map.current) {
        map.current.remove();
      }
    };
  }, [center, zoom]);

  // Add/update markers
  useEffect(() => {
    if (!map.current) return;

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current.clear();

    // Add new markers for POIs
    pois.forEach((poi) => {
      if (!map.current) return;

      const el = document.createElement("div");
      el.className = "marker";
      el.innerHTML = `
        <div class="flex h-8 w-8 items-center justify-center rounded-full ${
          selectedPOI === poi.id
            ? "bg-orange-500 ring-2 ring-orange-300"
            : "bg-green-500 hover:bg-green-600"
        } cursor-pointer shadow-lg transition-all">
          <svg class="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd" />
          </svg>
        </div>
      `;

      el.style.cursor = "pointer";
      el.addEventListener("click", () => onPOIClick?.(poi.id));

      const marker = new mapboxgl.Marker(el)
        .setLngLat([poi.longitude, poi.latitude])
        .setPopup(
          new mapboxgl.Popup({ offset: 25 }).setHTML(
            `<div class="p-2">
              <h3 class="font-semibold">${poi.name}</h3>
              ${poi.description ? `<p class="text-sm text-gray-600">${poi.description}</p>` : ""}
              <p class="text-xs text-gray-500">${poi.type || "POI"}</p>
            </div>`
          )
        )
        .addTo(map.current);

      markersRef.current.set(poi.id, marker);

      // Open popup for selected POI
      if (selectedPOI === poi.id) {
        marker.togglePopup();
      }
    });
  }, [pois, selectedPOI, onPOIClick]);

  return (
    <div className="relative h-full w-full">
      <div ref={mapContainer} className="w-full h-full" style={{ minHeight: "400px" }} />
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/10">
          <div className="rounded-lg bg-white px-4 py-2 text-sm font-medium">Loading map...</div>
        </div>
      )}
    </div>
  );
}
