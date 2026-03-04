import { useCallback, useEffect, useRef } from "react";
import { MapPin } from "lucide-react";
import { Map, useMap, MapMarker, MarkerContent, MapControls } from "@/components/ui/map";
import { cn } from "@/lib/utils";

const VIETNAM_CENTER = [106.66, 16.05];
const DEFAULT_ZOOM = 5;
const PLACED_ZOOM = 15;

/**
 * Renderless child that attaches a click listener to the map instance.
 * Uses a ref to avoid re-registering on every onChange identity change.
 */
function MapClickListener({ onChange }) {
  const { map, isLoaded } = useMap();
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (!map || !isLoaded) return;

    const handler = (e) => {
      onChangeRef.current(e.lngLat.lat, e.lngLat.lng);
    };

    map.on("click", handler);
    return () => map.off("click", handler);
  }, [map, isLoaded]);

  return null;
}

/**
 * Interactive map picker for selecting lat/lng coordinates.
 *
 * @param {number|string} latitude
 * @param {number|string} longitude
 * @param {(lat: number, lng: number) => void} onChange
 * @param {string} className
 */
export default function MapPicker({ latitude, longitude, onChange, className }) {
  const hasCoords =
    latitude !== "" && latitude != null && longitude !== "" && longitude != null &&
    !isNaN(Number(latitude)) && !isNaN(Number(longitude));

  const lat = hasCoords ? Number(latitude) : null;
  const lng = hasCoords ? Number(longitude) : null;

  const center = hasCoords ? [lng, lat] : VIETNAM_CENTER;
  const zoom = hasCoords ? PLACED_ZOOM : DEFAULT_ZOOM;

  const handleDragEnd = useCallback(
    ({ lat: newLat, lng: newLng }) => {
      onChange(newLat, newLng);
    },
    [onChange],
  );

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="h-[240px] rounded-lg overflow-hidden border border-border">
        <Map center={center} zoom={zoom}>
          <MapClickListener onChange={onChange} />
          <MapControls position="bottom-right" showZoom />
          {hasCoords && (
            <MapMarker
              latitude={lat}
              longitude={lng}
              draggable
              onDragEnd={handleDragEnd}
            >
              <MarkerContent>
                <MapPin className="size-7 text-primary fill-primary/20 -translate-y-1/2" />
              </MarkerContent>
            </MapMarker>
          )}
        </Map>
      </div>
      <p className="text-[11px] text-muted-foreground">
        Bấm vào bản đồ để chọn vị trí
      </p>
    </div>
  );
}
