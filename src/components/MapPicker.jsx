import { useCallback, useEffect, useState, useRef } from "react";
import { MapPin, MagnifyingGlass, Crosshair, CircleNotch, Target } from "@phosphor-icons/react";
import { Map, MapMarker, MarkerContent, MapControls } from "@/components/ui/map";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const VIETNAM_CENTER = [108.2772, 14.0583]; // Center of Vietnam
const DEFAULT_ZOOM = 4;
const PLACED_ZOOM = 16;

/**
 * Simplified MapPicker focused on address-based searching for Vietnam.
 *
 * @param {number|string} latitude
 * @param {number|string} longitude
 * @param {string} address
 * @param {(lat: number, lng: number) => void} onChange
 * @param {(msg: string) => void} onError
 * @param {string} className
 */
export default function MapPicker({ latitude, longitude, address, onChange, onError, className }) {
  const mapRef = useRef(null);
  const [searching, setSearching] = useState(false);

  const hasCoords =
    latitude !== "" && latitude != null && longitude !== "" && longitude != null &&
    !isNaN(Number(latitude)) && !isNaN(Number(longitude));

  const lat = hasCoords ? Number(latitude) : null;
  const lng = hasCoords ? Number(longitude) : null;

  const center = hasCoords ? [lng, lat] : VIETNAM_CENTER;
  const zoom = hasCoords ? PLACED_ZOOM : DEFAULT_ZOOM;

  // Fly to location when coords change
  useEffect(() => {
    if (hasCoords && mapRef.current) {
      mapRef.current.flyTo({
        center: [lng, lat],
        zoom: PLACED_ZOOM,
        speed: 1.2,
        curve: 1.42,
        essential: true
      });
    }
  }, [lat, lng, hasCoords]);

  const handleSearch = async () => {
    if (!address?.trim()) return;
    
    // Kiểm tra định dạng: Phải có số, có chữ và có ít nhất 2 dấu phẩy
    if (!/(?=.*\d)(?=.*[\p{L}])(?:.*,){2,}/u.test(address)) {
      if (onError) onError("Địa chỉ cần đầy đủ (Số nhà, Đường/Phường, Quận/Huyện, Tỉnh/TP)");
      return;
    }
    
    setSearching(true);
    try {
      // Use Nominatim OSM for free geocoding, strictly limited to Vietnam
      const query = encodeURIComponent(address);
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1&countrycodes=vn&addressdetails=1`);
      const data = await res.json();

      if (data && data.length > 0) {
        const result = data[0];
        const details = result.address || {};
        
        // Cụ thể: Phải có số nhà (house_number) hoặc là một tòa nhà/điểm cụ thể (building/amenity/etc)
        // Hoặc ít nhất không phải là chỉ mỗi tên đường (road), thành phố (city),...
        const isSpecific = !!(details.house_number || details.building || details.office || details.amenity || details.apartments || details.house_name);
        const isRoadOnly = result.addresstype === "road" || result.type === "route";
        const isAreaOnly = ["city", "town", "village", "suburb", "quarter", "municipality", "administrative"].includes(result.addresstype);
        
        // Có số trong input (VD: 159 Lĩnh Nam)
        const inputHasNumber = /\d/.test(address);

        // Chặn nếu chỉ là khu vực (vùng rộng) 
        // Hoặc là đường nhưng input lại không có số nhà
        if (isAreaOnly || (isRoadOnly && !inputHasNumber)) {
          if (onError) onError("Địa chỉ chưa đủ cụ thể (cần ít nhất số nhà và tên đường)");
          return;
        }

        onChange(Number(result.lat), Number(result.lon));
        if (onError) onError(""); // Clear error
      } else {
        if (onError) onError("Địa chỉ không tồn tại trên bản đồ Việt Nam");
      }
    } catch (err) {
      if (onError) onError("Không thể kết nối dịch vụ bản đồ");
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={address || ""}
            readOnly
            className="pl-9 bg-muted/30 cursor-default truncate text-xs h-9"
            placeholder="Địa chỉ tòa nhà sẽ hiển thị ở đây"
          />
        </div>
        <Button 
          type="button" 
          variant="secondary" 
          size="sm" 
          className="h-9 px-4 shrink-0 gap-2" 
          onClick={handleSearch}
          disabled={searching || !address?.trim()}
        >
          {searching ? <CircleNotch className="size-4 animate-spin" /> : <MagnifyingGlass className="size-4" />}
          {searching ? "Đang tìm..." : "Tìm"}
        </Button>
      </div>

      <div className="h-[280px] rounded-xl overflow-hidden border border-border bg-muted/20 relative">
        <Map ref={mapRef} center={center} zoom={zoom}>
          <MapControls 
            position="bottom-right" 
            showZoom 
            showLocate 
            onLocate={(coords) => onChange(coords.latitude, coords.longitude)} 
          />
          
          {/* Nút quay lại ghim (Target) - chỉ hiện khi đã có tọa độ */}
          {hasCoords && (
            <div className="absolute z-10 bottom-[180px] right-2 flex flex-col gap-1.5">
              <div className="flex flex-col rounded-md border border-border bg-background shadow-sm overflow-hidden">
                <button
                  type="button"
                  title="Về vị trí đang ghim"
                  onClick={() => {
                    mapRef.current?.flyTo({
                      center: [lng, lat],
                      zoom: PLACED_ZOOM,
                      essential: true
                    });
                  }}
                  className="flex items-center justify-center size-8 hover:bg-accent dark:hover:bg-accent/40 transition-colors"
                >
                  <Target className="size-4 text-primary" weight="bold" />
                </button>
              </div>
            </div>
          )}

          {hasCoords && (
            <MapMarker latitude={lat} longitude={lng}>
              <MarkerContent>
                <div className="relative flex items-center justify-center -translate-y-1/2">
                  <div className="absolute size-5 bg-primary/40 rounded-full animate-ping" />
                  <div className="absolute size-2 bg-primary rounded-full shadow-sm" />
                  <MapPin className="size-8 text-white fill-primary drop-shadow-lg relative z-10" />
                </div>
              </MarkerContent>
            </MapMarker>
          )}
        </Map>
        {!hasCoords && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/40 backdrop-blur-[1px] pointer-events-none p-6 text-center">
            <MapPin className="size-10 text-muted-foreground/30 mb-2" />
            <p className="text-sm font-medium text-muted-foreground">Nhập địa chỉ và nhấn tìm kiếm để xác định vị trí</p>
          </div>
        )}
      </div>
    </div>
  );
}
