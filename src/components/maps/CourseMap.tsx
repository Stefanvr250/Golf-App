"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { osmStyle, satelliteStyle } from "@/lib/maps/tiles";

// Dynamically import MapLibre to avoid SSR issues
const MapGL = dynamic(
  () => import("react-map-gl/maplibre").then((mod) => mod.default),
  { ssr: false }
);
const Marker = dynamic(
  () => import("react-map-gl/maplibre").then((mod) => mod.Marker),
  { ssr: false }
);

export interface HoleMarker {
  holeNumber: number;
  lat: number;
  lng: number;
}

interface CourseMapProps {
  centerLat: number;
  centerLng: number;
  holes?: HoleMarker[];
  zoom?: number;
  className?: string;
  children?: React.ReactNode;
}

export function CourseMap({
  centerLat,
  centerLng,
  holes = [],
  zoom = 15,
  className = "h-[400px] w-full rounded-lg overflow-hidden",
  children,
}: CourseMapProps) {
  const [mapStyle, setMapStyle] = React.useState<"osm" | "satellite">("osm");
  const maptilerKey = process.env.NEXT_PUBLIC_MAPTILER_KEY ?? "";

  const style = React.useMemo(() => {
    if (mapStyle === "satellite" && maptilerKey) {
      return satelliteStyle(maptilerKey);
    }
    return osmStyle;
  }, [mapStyle, maptilerKey]);

  function toggleStyle() {
    setMapStyle((prev) => (prev === "osm" ? "satellite" : "osm"));
  }

  return (
    <div className={`relative ${className}`}>
      <MapGL
        initialViewState={{
          latitude: centerLat,
          longitude: centerLng,
          zoom,
        }}
        mapStyle={style as unknown as string}
        attributionControl={true}
        style={{ width: "100%", height: "100%" }}
      >
        {/* Hole markers */}
        {holes.map((hole) => (
          <Marker
            key={hole.holeNumber}
            latitude={hole.lat}
            longitude={hole.lng}
            anchor="center"
          >
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground shadow-md">
              {hole.holeNumber}
            </div>
          </Marker>
        ))}
        {children}
      </MapGL>

      {/* Layer toggle */}
      {maptilerKey && (
        <Button
          variant="secondary"
          size="icon"
          className="absolute right-3 top-3 h-8 w-8 shadow-md"
          onClick={toggleStyle}
          title={mapStyle === "osm" ? "Switch to satellite" : "Switch to street"}
        >
          <Layers className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
