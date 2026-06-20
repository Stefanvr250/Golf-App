/**
 * Map tile source configurations for MapLibre GL JS.
 */

/** Standard OSM raster tile source */
export const osmTileSource = {
  type: "raster" as const,
  tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
  tileSize: 256,
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  maxzoom: 19,
};

/** MapTiler satellite tile source (requires NEXT_PUBLIC_MAPTILER_KEY) */
export function satelliteTileSource(apiKey: string) {
  return {
    type: "raster" as const,
    tiles: [
      `https://api.maptiler.com/tiles/satellite-v2/{z}/{x}/{y}.jpg?key=${apiKey}`,
    ],
    tileSize: 512,
    attribution:
      '&copy; <a href="https://www.maptiler.com/">MapTiler</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxzoom: 20,
  };
}

/** Default map style using OSM tiles */
export const osmStyle = {
  version: 8 as const,
  sources: {
    osm: osmTileSource,
  },
  layers: [
    {
      id: "osm-tiles",
      type: "raster" as const,
      source: "osm",
      minzoom: 0,
      maxzoom: 19,
    },
  ],
};

/** Satellite map style using MapTiler */
export function satelliteStyle(apiKey: string) {
  return {
    version: 8 as const,
    sources: {
      satellite: satelliteTileSource(apiKey),
    },
    layers: [
      {
        id: "satellite-tiles",
        type: "raster" as const,
        source: "satellite",
        minzoom: 0,
        maxzoom: 20,
      },
    ],
  };
}
