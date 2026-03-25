"use client";

import maplibregl from "maplibre-gl";
import { Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type PoiLocationPickerProps = {
  latitude: string;
  longitude: string;
  onLatitudeChange: (value: string) => void;
  onLongitudeChange: (value: string) => void;
};

const DEFAULT_LAT = 10.7769;
const DEFAULT_LNG = 106.7009;

const OSM_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: "raster",
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: "© OpenStreetMap contributors",
    },
  },
  layers: [
    {
      id: "osm",
      type: "raster",
      source: "osm",
    },
  ],
};

function parseCoordinate(value: string): number | null {
  if (!value.trim()) return null;
  const parsed = Number(value.trim());
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeLatLng(lat: number, lng: number): { lat: number; lng: number } {
  const nextLat = Math.max(-90, Math.min(90, lat));
  const nextLng = Math.max(-180, Math.min(180, lng));
  return { lat: nextLat, lng: nextLng };
}

export function PoiLocationPicker(props: PoiLocationPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);

  const [addressQuery, setAddressQuery] = useState("");
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const [addressMessage, setAddressMessage] = useState<string | null>(null);

  const setCoordinates = (lat: number, lng: number) => {
    const safe = normalizeLatLng(lat, lng);
    props.onLatitudeChange(safe.lat.toFixed(6));
    props.onLongitudeChange(safe.lng.toFixed(6));
  };

  const ensureMarker = (lng: number, lat: number, shouldCenter: boolean) => {
    const map = mapRef.current;
    if (!map) return;

    if (!markerRef.current) {
      markerRef.current = new maplibregl.Marker({ color: "#f97316", draggable: true })
        .setLngLat([lng, lat])
        .addTo(map);

      markerRef.current.on("dragend", () => {
        const markerLngLat = markerRef.current?.getLngLat();
        if (!markerLngLat) return;
        setCoordinates(markerLngLat.lat, markerLngLat.lng);
      });
    } else {
      markerRef.current.setLngLat([lng, lat]);
    }

    if (shouldCenter) {
      map.flyTo({ center: [lng, lat], zoom: Math.max(map.getZoom(), 15), essential: true });
    }
  };

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const initialLat = parseCoordinate(props.latitude) ?? DEFAULT_LAT;
    const initialLng = parseCoordinate(props.longitude) ?? DEFAULT_LNG;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: OSM_STYLE,
      center: [initialLng, initialLat],
      zoom: 14,
    });

    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl({ showCompass: true }), "top-right");

    map.on("load", () => {
      ensureMarker(initialLng, initialLat, false);
      map.resize();
    });

    map.on("click", (event) => {
      const clickedLng = event.lngLat.lng;
      const clickedLat = event.lngLat.lat;
      setCoordinates(clickedLat, clickedLng);
      ensureMarker(clickedLng, clickedLat, false);
      setAddressMessage("Đã chọn vị trí trên bản đồ.");
    });

    return () => {
      markerRef.current?.remove();
      markerRef.current = null;
      map.remove();
      mapRef.current = null;
    };
  }, [props.latitude, props.longitude]);

  useEffect(() => {
    const lat = parseCoordinate(props.latitude);
    const lng = parseCoordinate(props.longitude);
    if (lat == null || lng == null) return;
    ensureMarker(lng, lat, false);
  }, [props.latitude, props.longitude]);

  const findAddress = async () => {
    const query = addressQuery.trim();
    if (!query) {
      setAddressMessage("Vui lòng nhập địa chỉ cần tìm.");
      return;
    }

    setIsSearchingAddress(true);
    setAddressMessage(null);

    try {
      const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(query)}`;
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Accept-Language": "vi",
        },
      });

      if (!response.ok) {
        setAddressMessage("Không thể tìm địa chỉ. Vui lòng thử lại.");
        return;
      }

      const data = (await response.json().catch(() => null)) as
        | Array<{
            lat?: string;
            lon?: string;
            display_name?: string;
          }>
        | null;

      const result = data?.[0];
      const lat = result?.lat ? Number(result.lat) : Number.NaN;
      const lng = result?.lon ? Number(result.lon) : Number.NaN;

      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        setAddressMessage("Không tìm thấy địa chỉ phù hợp.");
        return;
      }

      setCoordinates(lat, lng);
      ensureMarker(lng, lat, true);
      setAddressMessage(`Đã tìm thấy: ${result?.display_name ?? "địa chỉ"}`);
    } catch {
      setAddressMessage("Không thể tìm địa chỉ. Vui lòng thử lại.");
    } finally {
      setIsSearchingAddress(false);
    }
  };

  return (
    <div className="mt-4 rounded-xl border border-slate-200 p-3">
      <h3 className="text-sm font-semibold text-slate-800">Vị trí POI (3 cách)</h3>
      <p className="mt-1 text-xs text-slate-500">
        1) Nhập tay kinh độ/vĩ độ. 2) Kéo map và bấm chọn điểm để đặt marker. 3) Tìm theo địa chỉ.
      </p>

      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <input
          value={props.latitude}
          onChange={(event) => props.onLatitudeChange(event.target.value)}
          placeholder="Vĩ độ (latitude)"
          className="h-10 rounded-xl border border-slate-200 px-3 text-sm outline-none ring-orange-500 focus:ring-2"
        />
        <input
          value={props.longitude}
          onChange={(event) => props.onLongitudeChange(event.target.value)}
          placeholder="Kinh độ (longitude)"
          className="h-10 rounded-xl border border-slate-200 px-3 text-sm outline-none ring-orange-500 focus:ring-2"
        />
      </div>

      <form
        className="mt-3 flex flex-col gap-2 md:flex-row"
        onSubmit={(event) => {
          event.preventDefault();
          void findAddress();
        }}
      >
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={addressQuery}
            onChange={(event) => setAddressQuery(event.target.value)}
            placeholder="Nhập địa chỉ để tìm trên map"
            className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none ring-orange-500 focus:ring-2"
          />
        </div>
        <button
          type="submit"
          className="h-10 rounded-xl bg-orange-500 px-4 text-sm font-semibold text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isSearchingAddress}
        >
          {isSearchingAddress ? "Đang tìm..." : "Tìm"}
        </button>
      </form>

      {addressMessage ? <p className="mt-2 text-xs text-slate-600">{addressMessage}</p> : null}

      <div className="mt-3 overflow-hidden rounded-xl border border-slate-200">
        <div ref={mapContainerRef} className="h-72 w-full" />
      </div>
    </div>
  );
}




