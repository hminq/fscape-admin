import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus, Search, Eye, MapPin, Layers, Home,
  ChevronLeft, ChevronRight, Loader2, ToggleLeft, ToggleRight
} from "lucide-react";
import { api } from "@/lib/apiClient";
import { cn } from "@/lib/utils";
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

/* ── UI Components ───────────────────────────────── */

const CHART_COLORS = [
  { dot: "bg-chart-1", stroke: "stroke-chart-1" },
  { dot: "bg-chart-2", stroke: "stroke-chart-2" },
  { dot: "bg-chart-3", stroke: "stroke-chart-3" },
  { dot: "bg-chart-4", stroke: "stroke-chart-4" },
  { dot: "bg-chart-5", stroke: "stroke-chart-5" },
];

function Donut({ globalRooms = [] }) {
  // Aggregate rooms by building name from globalRooms
  const buildingCounts = globalRooms.reduce((acc, r) => {
    const name = r.building?.name || "Khác";
    acc[name] = (acc[name] || 0) + 1;
    return acc;
  }, {});

  const entries = Object.entries(buildingCounts)
    .sort((a, b) => b[1] - a[1]) // highest first
    .slice(0, 6) // track top 6 buildings to avoid clutter
    .map(([name, count], i) => ({
      name, count, ...CHART_COLORS[i % CHART_COLORS.length]
    }));

  const total = globalRooms.length;
  const r = 36;
  const circ = 2 * Math.PI * r;

  const segs = entries.reduce((accArr, e) => {
    const len = total > 0 ? (e.count / total) * circ : 0;
    const prevAcc = accArr.length > 0 ? accArr[accArr.length - 1].nextAcc : 0;
    const offset = circ - prevAcc;
    accArr.push({ ...e, len, offset, nextAcc: prevAcc + len });
    return accArr;
  }, []);

  return (
    <div className="flex items-center gap-8 flex-wrap">
      <div className="flex items-center gap-5">
        <div className="relative" style={{ width: 76, height: 76 }}>
          <svg viewBox="0 0 100 100" className="size-full -rotate-90">
            <circle cx="50" cy="50" r={r} fill="none" strokeWidth="10" className="stroke-muted" />
            {segs.map(s => (
              <circle key={s.name} cx="50" cy="50" r={r} fill="none" strokeWidth="10"
                strokeDasharray={`${s.len} ${circ - s.len}`} strokeDashoffset={s.offset}
                className={`${s.stroke} transition-all duration-500`} />
            ))}
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-bold leading-none">{total}</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-2.5 text-xs font-bold text-muted-foreground w-full max-w-[280px]">
          {entries.length === 0 && <span className="text-muted-foreground/60 col-span-2">Chưa có dữ liệu phòng.</span>}
          {entries.map(e => (
            <div key={e.name} className="flex items-center gap-2">
              <span className={`size-2.5 shrink-0 rounded-full ${e.dot}`} />
              <span className="text-xs text-muted-foreground whitespace-nowrap" title={e.name}>{e.name}</span>
              <span className="text-xs font-semibold">{e.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatusBar({ globalRooms = [] }) {
  const available = globalRooms.filter(r => r.status === 'AVAILABLE').length;
  const occupied = globalRooms.filter(r => r.status === 'OCCUPIED').length;
  const maintenance = globalRooms.filter(r => r.status === 'MAINTENANCE').length;
  const locked = globalRooms.filter(r => r.status === 'LOCKED').length;

  const total = globalRooms.length;
  const pAvail = total > 0 ? (available / total) * 100 : 0;
  const pOcc = total > 0 ? (occupied / total) * 100 : 0;
  const pMaint = total > 0 ? (maintenance / total) * 100 : 0;
  const pLock = total > 0 ? (locked / total) * 100 : 0;

  return (
    <div className="flex-1 min-w-[180px] space-y-2.5">
      <div className="flex items-center text-xs">
        <span className="text-muted-foreground">Đã cho thuê</span>
      </div>
      <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden flex">
        <div className="h-full bg-success transition-all duration-500" style={{ width: `${pAvail}%` }} />
        <div className="h-full bg-primary transition-all duration-500" style={{ width: `${pOcc}%` }} />
        <div className="h-full bg-amber-500 transition-all duration-500" style={{ width: `${pMaint}%` }} />
        <div className="h-full bg-destructive transition-all duration-500" style={{ width: `${pLock}%` }} />
      </div>
      <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
        {total === 0 && <span className="flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-muted-foreground/30" /> Đang chờ dữ liệu...</span>}
        {pAvail > 0 && <span className="flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-success" /> {Math.round(pAvail)}% Còn trống</span>}
        {pOcc > 0 && <span className="flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-primary" /> {Math.round(pOcc)}% Đã thuê</span>}
        {pMaint > 0 && <span className="flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-amber-500" /> {Math.round(pMaint)}% Bảo trì</span>}
        {pLock > 0 && <span className="flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-destructive" /> {Math.round(pLock)}% Khóa</span>}
      </div>
    </div>
  );
}

function RoomCard({ room, onView, onToggle }) {
  const isAvailable = room.status === 'AVAILABLE';
  const isOccupied = room.status === 'OCCUPIED';
  const isLocked = room.status === 'LOCKED';
  const isMaintenance = room.status === 'MAINTENANCE';

  const statusBg = isAvailable ? "bg-success"
    : isOccupied ? "bg-primary"
      : isMaintenance ? "bg-amber-500"
        : "bg-destructive";

  const statusText = isAvailable ? "text-success"
    : isOccupied ? "text-primary"
      : isMaintenance ? "text-amber-500"
        : "text-destructive";

  const statusLabel = isAvailable ? "Còn trống"
    : isOccupied ? "Đã thuê"
      : isMaintenance ? "Bảo trì"
        : "Vô hiệu hóa";

  const imageUrl = room.images?.[0]?.image_url || room.thumbnail_url || room.images?.[0] || defaultRoomImg;

  return (
    <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden transition-shadow hover:shadow-md flex flex-row group">
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
          <span className="flex items-center gap-0.5 truncate" title={room.room_type?.name}><Home className="size-3 shrink-0" /> {room.room_type?.name}</span>
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

/* ── Main Page ───────────────────────────────────── */

export default function RoomsPage() {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [globalRooms, setGlobalRooms] = useState([]); // purely for top stats

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [buildingId, setBuildingId] = useState("all");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 30;

  // Confirm toggle dialog state
  const [confirmToggle, setConfirmToggle] = useState(null); // room object
  const [toggleError, setToggleError] = useState(null);
  const [saving, setSaving] = useState(false);

  // 1. Fetch buildings for dropdown
  useEffect(() => {
    api.get("/api/buildings?limit=100")
      .then(res => setBuildings(res.data || res))
      .catch(console.error);
  }, []);

  // 2. Fetch global rooms for accurate donut stats
  useEffect(() => {
    api.get("/api/rooms?limit=1000")
      .then(res => setGlobalRooms(res.data || res))
      .catch(console.error);
  }, []);

  // 3. Fetch paginated/filtered rooms
  const fetchRooms = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page, limit });
      if (search.trim()) params.set("search", search.trim());
      if (filter !== "all") params.set("status", filter.toUpperCase());
      if (buildingId !== "all") params.set("building_id", buildingId);

      const res = await api.get(`/api/rooms?${params}`);
      setRooms(res.data || []);
      setTotal(res.total || 0);
      setTotalPages(res.total_pages || res.totalPages || 1);
    } catch {
      setError("Không thể tải dữ liệu phòng.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, filter, buildingId]);

  // Handle status toggle with confirm dialog
  const handleToggle = (room) => {
    if (room.status === 'OCCUPIED' || room.status === 'MAINTENANCE') return;
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
      setRooms(prev => prev.map(r => r.id === confirmToggle.id ? { ...r, status: newStatus } : r));
      setGlobalRooms(prev => prev.map(r => r.id === confirmToggle.id ? { ...r, status: newStatus } : r));
      setConfirmToggle(null);
    } catch (err) {
      setToggleError(err.message || "Cập nhật thất bại.");
    } finally {
      setSaving(false);
    }
  };

  // Group rooms by Building for rendering segments
  const groupedRooms = useMemo(() => {
    return rooms.reduce((acc, r) => {
      const key = r.building?.id || 'unknown';
      if (!acc[key]) acc[key] = { building: r.building, items: [] };
      acc[key].items.push(r);
      return acc;
    }, {});
  }, [rooms]);

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

      {/* Main Stats Card (Donut + Progress) */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center gap-8 flex-wrap">
          <Donut globalRooms={globalRooms} />
          <div className="w-px h-12 bg-border shrink-0" />
          <StatusBar globalRooms={globalRooms} />
        </div>
      </div>

      {/* Filters — identical to BuildingsPage */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm phòng..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9"
          />
        </div>

        <Select value={buildingId} onValueChange={(v) => { setBuildingId(v); setPage(1); }}>
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
            { key: "maintenance", label: "Bảo trì" }
          ].map((f) => (
            <Button
              key={f.key}
              size="sm"
              variant={filter === f.key ? "default" : "outline"}
              onClick={() => { setFilter(f.key); setPage(1); }}
            >
              {f.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <Loader2 className="size-10 animate-spin text-muted-foreground/50" />
          <p className="text-sm font-bold text-muted-foreground/60">Đang tải danh sách phòng...</p>
        </div>
      ) : error ? (
        <div className="text-center py-20 bg-destructive/5 rounded-2xl border border-dashed border-destructive/20">
          <p className="text-destructive font-bold">{error}</p>
          <Button variant="outline" className="mt-4 border-destructive/20" onClick={fetchRooms}>Thử lại</Button>
        </div>
      ) : rooms.length === 0 ? (
        <div className="text-center py-24 bg-muted/30 rounded-2xl border border-dashed border-border">
          <Home className="size-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground font-bold">Không tìm thấy phòng nào.</p>
        </div>
      ) : (
        <div className="space-y-10 mt-6">
          {Object.entries(groupedRooms).map(([bId, group]) => (
            <div key={bId} className="space-y-4">
              <h2 className="text-lg font-bold flex items-center gap-2.5 text-foreground">
                <MapPin className="size-[18px] text-primary" />
                {group.building?.name || "Khu vực khác"}
                <span className="text-xs font-bold text-muted-foreground bg-muted/80 px-2.5 py-0.5 rounded-md">
                  {group.items.length} phòng
                </span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {group.items.map((r) => (
                  <RoomCard
                    key={r.id}
                    room={r}
                    onView={(id) => navigate(`/rooms/${id}`)}
                    onToggle={handleToggle}
                  />
                ))}
              </div>
            </div>
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-6 border-t border-border/80">
              <p className="text-sm font-bold text-muted-foreground">{total} kết quả</p>
              <div className="flex items-center gap-4">
                <span className="text-[13px] font-bold">Trang {page} / {totalPages}</span>
                <div className="flex items-center gap-2">
                  <Button variant="outline" className="h-9 w-9 p-0 rounded-xl" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                    <ChevronLeft className="size-4" />
                  </Button>
                  <Button variant="outline" className="h-9 w-9 p-0 rounded-xl" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
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
              {saving && <Loader2 className="size-4 animate-spin mr-1.5" />}
              {confirmToggle?.status === 'LOCKED' ? "Mở khóa" : "Khóa phòng"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
