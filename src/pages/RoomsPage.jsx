import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus, MagnifyingGlass, Eye, MapPin, Stack as Layers, House,
  CaretLeft, CaretRight, CircleNotch, ToggleLeft, ToggleRight
} from "@phosphor-icons/react";
import { api } from "@/lib/apiClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import defaultRoomImg from "@/assets/default_building_img.jpg";

/* ── Status Bar ──────────────────────────────────── */

function StatusBar({ byStatus, total = 0 }) {
  const hasData = byStatus != null;
  const available = byStatus?.available || 0;
  const occupied = byStatus?.occupied || 0;
  const locked = byStatus?.locked || 0;

  const pAvail = total > 0 ? (available / total) * 100 : 0;
  const pOcc = total > 0 ? (occupied / total) * 100 : 0;
  const pLock = total > 0 ? (locked / total) * 100 : 0;

  return (
    <div className="space-y-2.5">
      <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden flex">
        <div className="h-full bg-success transition-all duration-500" style={{ width: `${pAvail}%` }} />
        <div className="h-full bg-primary transition-all duration-500" style={{ width: `${pOcc}%` }} />
        <div className="h-full bg-destructive transition-all duration-500" style={{ width: `${pLock}%` }} />
      </div>
      <div className="flex items-center gap-4 text-[11px] text-muted-foreground flex-wrap">
        {!hasData && <span className="flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-muted-foreground/30" /> Đang chờ dữ liệu...</span>}
        {hasData && total === 0 && <span className="flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-muted-foreground/30" /> 0 phòng</span>}
        {available > 0 && <span className="flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-success" /> {Math.round(pAvail)}% Còn trống ({available})</span>}
        {occupied > 0 && <span className="flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-primary" /> {Math.round(pOcc)}% Đã thuê ({occupied})</span>}
        {locked > 0 && <span className="flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-destructive" /> {Math.round(pLock)}% Khóa ({locked})</span>}
      </div>
    </div>
  );
}

/* ── Room Card ───────────────────────────────────── */

function RoomCard({ room, onView, onToggle }) {
  const isAvailable = room.status === 'AVAILABLE';
  const isOccupied = room.status === 'OCCUPIED';
  const isLocked = room.status === 'LOCKED';

  const statusBg = isAvailable ? "bg-success"
    : isOccupied ? "bg-primary"
      : "bg-destructive";

  const statusText = isAvailable ? "text-success"
    : isOccupied ? "text-primary"
      : "text-destructive";

  const statusLabel = isAvailable ? "Còn trống"
    : isOccupied ? "Đã thuê"
      : "Đã khóa";

  const imageUrl = room.images?.[0]?.image_url || room.thumbnail_url || room.images?.[0] || defaultRoomImg;

  return (
    <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden transition-shadow hover:shadow-md flex flex-row h-[140px] group">
      {/* Image — left side, fixed width */}
      <div className="w-36 shrink-0 overflow-hidden bg-muted">
        <img src={imageUrl} alt={room.room_number} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" onError={e => e.target.src = defaultRoomImg} />
      </div>

      {/* Info — right side */}
      <div className="p-3 flex flex-col flex-1 min-w-0 gap-1.5">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-semibold text-[13px] truncate">Phòng {room.room_number}</h3>
          <span className="flex items-center gap-1 shrink-0">
            <span className={`size-1.5 rounded-full ${statusBg}`} />
            <span className={`text-[10px] font-medium ${statusText}`}>{statusLabel}</span>
          </span>
        </div>

        <p className="text-xs text-muted-foreground flex items-center gap-1 leading-none truncate">
          <MapPin className="size-3 shrink-0" /> {room.building?.name || "—"}
        </p>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-0.5"><Layers className="size-3" /> Tầng {room.floor}</span>
          <span className="flex items-center gap-0.5 truncate" title={room.room_type?.name}><House className="size-3 shrink-0" /> {room.room_type?.name}</span>
        </div>

        <div className="flex items-center gap-1.5 mt-auto pt-1">
          <Button size="sm" className="flex-1 h-7 text-[11px] gap-1" onClick={() => onView(room.id)}>
            <Eye className="size-3" /> Chi tiết
          </Button>
          <Button
            size="icon" variant="ghost" className="size-7 shrink-0"
            onClick={() => onToggle(room)}
            title={isLocked ? "Mở khóa" : "Khóa phòng"}
            disabled={isOccupied}
          >
            {isLocked ? <ToggleLeft className="size-4 text-muted-foreground" /> : <ToggleRight className="size-4 text-success" />}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ── Per-building room section with independent pagination ── */

const SECTION_LIMIT = 9;

function BuildingRoomSection({ building, search, statusFilter, onToggle, onView, refreshKey }) {
  const [rooms, setRooms] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchRooms = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page,
        limit: SECTION_LIMIT,
        building_id: building.id,
      });
      if (search.trim()) params.set("search", search.trim());
      if (statusFilter !== "all") params.set("status", statusFilter.toUpperCase());

      const res = await api.get(`/api/rooms?${params}`);
      setRooms(res.data || []);
      setTotal(res.total || 0);
      setTotalPages(res.total_pages || res.totalPages || 1);
    } catch {
      setRooms([]);
    } finally {
      setLoading(false);
    }
  }, [building.id, page, search, statusFilter, refreshKey]);

  useEffect(() => { fetchRooms(); }, [fetchRooms]);

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [search, statusFilter]);

  if (!loading && rooms.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-bold flex items-center gap-2.5 text-foreground">
          <MapPin className="size-[18px] text-primary" />
          {building.name}
          <span className="text-xs font-bold text-muted-foreground bg-muted/80 px-2.5 py-0.5 rounded-md">
            {total} phòng
          </span>
        </h2>

        {totalPages > 1 && (
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-[12px] text-muted-foreground">
              Trang {page} / {totalPages}
            </span>
            <div className="flex items-center gap-1.5">
              <Button variant="outline" className="h-8 w-8 p-0 rounded-lg" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                <CaretLeft className="size-3.5" />
              </Button>
              <Button variant="outline" className="h-8 w-8 p-0 rounded-lg" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                <CaretRight className="size-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-10">
          <CircleNotch className="size-6 animate-spin text-muted-foreground/40" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {rooms.map((r) => (
            <RoomCard
              key={r.id}
              room={r}
              onView={onView}
              onToggle={onToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Main Page ───────────────────────────────────── */

export default function RoomsPage() {
  const navigate = useNavigate();
  const [buildings, setBuildings] = useState([]);
  const [roomStats, setRoomStats] = useState(null);
  const [loadingInit, setLoadingInit] = useState(true);

  // Filters
  const [buildingId, setBuildingId] = useState("all");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  // Confirm toggle dialog state
  const [confirmToggle, setConfirmToggle] = useState(null);
  const [toggleError, setToggleError] = useState(null);
  const [saving, setSaving] = useState(false);

  // Bumped after toggle to trigger section re-fetches
  const [refreshKey, setRefreshKey] = useState(0);

  // 1. Fetch buildings + stats on mount
  const fetchStats = () => {
    api.get("/api/rooms/stats")
      .then(res => setRoomStats(res.data || res))
      .catch(console.error);
  };

  useEffect(() => {
    Promise.all([
      api.get("/api/buildings?limit=100"),
      api.get("/api/rooms/stats"),
    ]).then(([bRes, sRes]) => {
      setBuildings(bRes.data || bRes);
      setRoomStats(sRes.data || sRes);
    }).catch(console.error)
      .finally(() => setLoadingInit(false));
  }, []);

  // Which buildings to show sections for
  const visibleBuildings = buildingId === "all"
    ? buildings
    : buildings.filter(b => b.id === buildingId);

  // Toggle handlers
  const handleToggle = (room) => {
    if (room.status === 'OCCUPIED') return;
    setToggleError(null);
    setConfirmToggle(room);
  };

  const handleToggleConfirm = async () => {
    if (!confirmToggle) return;
    const newStatus = confirmToggle.status === 'LOCKED' ? 'AVAILABLE' : 'LOCKED';
    setSaving(true);
    setToggleError(null);
    try {
      await api.patch(`/api/rooms/${confirmToggle.id}/status`, { status: newStatus });
      fetchStats();
      setRefreshKey(k => k + 1);
      setConfirmToggle(null);
    } catch (err) {
      setToggleError(err.message || "Cập nhật thất bại.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-12 animate-in fade-in duration-500">
      {/* Header and Add Button */}
      <div className="flex items-start justify-between flex-wrap gap-3 pt-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Phòng</h1>
          <p className="text-sm text-muted-foreground">Quản lý tất cả các phòng cho thuê FScape</p>
        </div>
        <Button className="gap-1.5" onClick={() => navigate("/rooms/create")}>
          <Plus className="size-4" /> Thêm phòng mới
        </Button>
      </div>

      {/* Stats Card — reacts to status filter */}
      {(() => {
        const allStatus = roomStats?.by_status || null;
        const allTotal = roomStats?.total || 0;
        const filteredStatus = allStatus == null ? null
          : filter === "all" ? allStatus
            : { [filter]: allStatus[filter] || 0 };
        const filteredTotal = filter === "all"
          ? allTotal
          : (allStatus?.[filter] || 0);
        return (
          <div className="rounded-2xl border border-border bg-card p-5 space-y-1">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold">Trạng thái phòng</h3>
              <span className="text-sm font-bold">{filteredTotal} phòng</span>
            </div>
            <StatusBar byStatus={filteredStatus} total={filteredTotal} />
          </div>
        );
      })()}

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm phòng..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={buildingId} onValueChange={(v) => setBuildingId(v)}>
          <SelectTrigger className="w-[170px]">
            <SelectValue placeholder="Tất cả tòa nhà" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả tòa nhà</SelectItem>
            {buildings.map(b => (
              <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex gap-1.5">
          {[
            { key: "all", label: "Tất cả" },
            { key: "available", label: "Còn trống" },
            { key: "occupied", label: "Đã thuê" },
            { key: "locked", label: "Đã khóa" }
          ].map((f) => (
            <Button
              key={f.key}
              size="sm"
              variant={filter === f.key ? "default" : "outline"}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Content — per-building sections */}
      {loadingInit ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <CircleNotch className="size-10 animate-spin text-muted-foreground/50" />
          <p className="text-sm font-bold text-muted-foreground/60">Đang tải danh sách phòng...</p>
        </div>
      ) : visibleBuildings.length === 0 ? (
        <div className="text-center py-24 bg-muted/30 rounded-2xl border border-dashed border-border">
          <House className="size-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground font-bold">Không tìm thấy tòa nhà nào.</p>
        </div>
      ) : (
        <div className="space-y-10 mt-2">
          {visibleBuildings.map((b) => (
            <BuildingRoomSection
              key={b.id}
              building={b}
              search={search}
              statusFilter={filter}
              onToggle={handleToggle}
              onView={(id) => navigate(`/rooms/${id}`)}
              refreshKey={refreshKey}
            />
          ))}
        </div>
      )}

      {/* Confirm Toggle Dialog */}
      <Dialog open={!!confirmToggle} onOpenChange={(v) => { if (!v) { setConfirmToggle(null); setToggleError(null); } }}>
        <DialogContent className="max-w-sm text-center">
          <DialogHeader>
            <DialogTitle>
              {confirmToggle?.status === 'LOCKED' ? "Mở khóa phòng" : "Khóa phòng"}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {confirmToggle?.status === 'LOCKED'
              ? <>Bạn có chắc muốn <strong className="text-foreground">mở khóa</strong> phòng <strong className="text-foreground">&quot;{confirmToggle?.room_number}&quot;</strong>?</>
              : <>Bạn có chắc muốn <strong className="text-foreground">khóa</strong> phòng <strong className="text-foreground">&quot;{confirmToggle?.room_number}&quot;</strong>?</>
            }
          </p>
          {toggleError && <p className="text-sm text-destructive">{toggleError}</p>}
          <DialogFooter className="justify-center gap-2 sm:justify-center">
            <Button variant="outline" onClick={() => { setConfirmToggle(null); setToggleError(null); }} disabled={saving}>Hủy</Button>
            <Button
              variant={confirmToggle?.status === 'LOCKED' ? "default" : "destructive"}
              disabled={saving}
              onClick={handleToggleConfirm}
            >
              {saving && <CircleNotch className="size-4 animate-spin mr-1.5" />}
              {confirmToggle?.status === 'LOCKED' ? "Mở khóa" : "Khóa phòng"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
