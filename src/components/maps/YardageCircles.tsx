"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { circle as turfCircle } from "@turf/circle";
import { point } from "@turf/helpers";

const Source = dynamic(
  () => import("react-map-gl/maplibre").then((mod) => mod.Source),
  { ssr: false }
);
const Layer = dynamic(
  () => import("react-map-gl/maplibre").then((mod) => mod.Layer),
  { ssr: false }
);

// Standard yardage rings
const YARDAGE_RINGS = [50, 100, 150, 200, 250];

interface YardageCirclesProps {
  /** Pin (green center) latitude */
  pinLat: number;
  /** Pin (green center) longitude */
  pinLng: number;
}

/**
 * Renders concentric yardage circles at 50, 100, 150, 200, 250 yards from the pin.
 * Must be placed inside a MapGL component.
 */
export function YardageCircles({ pinLat, pinLng }: YardageCirclesProps) {
  const geojson = React.useMemo(() => {
    const features = YARDAGE_RINGS.map((yards) => {
      // Convert yards to kilometers for turf
      const km = yards * 0.0009144;
      const center = point([pinLng, pinLat]);
      const circleFeature = turfCircle(center, km, { steps: 64, units: "kilometers" });
      circleFeature.properties = { yards };
      return circleFeature;
    });

    return {
      type: "FeatureCollection" as const,
      features,
    };
  }, [pinLat, pinLng]);

  return (
    <>
      <Source id="yardage-circles" type="geojson" data={geojson}>
        <Layer
          id="yardage-circles-fill"
          type="fill"
          paint={{
            "fill-color": "#16803c",
            "fill-opacity": 0.04,
          }}
        />
        <Layer
          id="yardage-circles-line"
          type="line"
          paint={{
            "line-color": "#16803c",
            "line-opacity": 0.5,
            "line-width": 1,
            "line-dasharray": [4, 2],
          }}
        />
        <Layer
          id="yardage-circles-label"
          type="symbol"
          layout={{
            "text-field": ["concat", ["get", "yards"], " yds"],
            "text-size": 11,
            "text-anchor": "bottom",
            "symbol-placement": "line",
          }}
          paint={{
            "text-color": "#16803c",
            "text-halo-color": "#ffffff",
            "text-halo-width": 1.5,
          }}
        />
      </Source>
    </>
  );
}
