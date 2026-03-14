import { useEffect, useRef } from "react";
import { MapPin, Target, Crosshair } from "@phosphor-icons/react";
import { Map, useMap, MapMarker, MarkerContent, MapControls } from "@/components/ui/map";
import { cn } from "@/lib/utils";

const VIETNAM_CENTER = [106.66, 16.05];
const VIETNAM_BOUNDS = [
  [102.14441, 8.179066], // Southwest coordinates
  [109.464539, 23.393395] // Northeast coordinates
];
const DEFAULT_ZOOM = 5;
const PLACED_ZOOM = 16;

/**
 * Handles automatic map movement when coordinates change.
 */
function MapAutoCenter({ latitude, longitude }) {
  const { map, isLoaded } = useMap();

  useEffect(() => {
    if (isLoaded && map && latitude && longitude) {
      map.flyTo({
        center: [Number(longitude), Number(latitude)],
        zoom: PLACED_ZOOM,
        duration: 2000,
        essential: true
      });
    }
  }, [map, isLoaded, latitude, longitude]);

  return null;
}

/**
 * Automatically centers on the user's location if no search result is present.
 */
function MapInitialLocate({ hasCoords }) {
  const { map, isLoaded } = useMap();

  useEffect(() => {
    if (isLoaded && map && !hasCoords) {
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            // Only move if the user is still on an empty search when we get the location
            map.flyTo({
              center: [pos.coords.longitude, pos.coords.latitude],
              zoom: 14,
              duration: 2500,
            });
          },
          () => {
            // Fallback: stay at Vietnam center if denied/failed
          }
        );
      }
    }
  }, [map, isLoaded, hasCoords]);

  return null;
}

/**
 * Custom control button to center on the university location.
 */
function CenterOnResult({ latitude, longitude }) {
  const { map, isLoaded } = useMap();
  const hasCoords = !!(latitude && longitude);

  if (!hasCoords) return null;

  return (
    <div className="absolute top-2 right-2 z-10 flex flex-col gap-1.5">
       <button
        type="button"
        onClick={() => {
          if (map) {
            map.flyTo({
              center: [Number(longitude), Number(latitude)],
              zoom: PLACED_ZOOM,
              duration: 1000
            });
          }
        }}
        title="Quay lại vị trí trường"
        className="flex items-center justify-center size-8 rounded-md border border-border bg-background shadow-sm hover:bg-accent transition-colors"
      >
        <Target className="size-4 text-primary font-bold" />
      </button>
    </div>
  );
}

export default function MapPicker({ latitude, longitude, className }) {
  const hasCoords =
    latitude !== "" && latitude != null && longitude !== "" && longitude != null &&
    !isNaN(Number(latitude)) && !isNaN(Number(longitude));

  const lat = hasCoords ? Number(latitude) : null;
  const lng = hasCoords ? Number(longitude) : null;

  const initialCenter = hasCoords ? [lng, lat] : VIETNAM_CENTER;
  const initialZoom = hasCoords ? PLACED_ZOOM : DEFAULT_ZOOM;

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="h-[240px] rounded-lg overflow-hidden border border-border bg-muted/20 relative">
        <Map center={initialCenter} zoom={initialZoom} maxBounds={VIETNAM_BOUNDS}>
          <MapAutoCenter latitude={lat} longitude={lng} />
          <MapInitialLocate hasCoords={hasCoords} />
          <CenterOnResult latitude={lat} longitude={lng} />
          <MapControls position="bottom-right" showZoom showLocate />
          
          {hasCoords && (
            <MapMarker latitude={lat} longitude={lng}>
              <MarkerContent>
                <MapPin className="size-7 text-white fill-primary -translate-y-1/2 drop-shadow-md" />
              </MarkerContent>
            </MapMarker>
          )}

          {!hasCoords && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted/5 z-[1] pointer-events-none">
              <p className="text-[11px] text-muted-foreground bg-background/80 px-4 py-2 rounded-full border shadow-sm">
                Nhập địa chỉ để định vị trên bản đồ
              </p>
            </div>
          )}
        </Map>
      </div>
    </div>
  );
}
