import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus, Search, Pencil, Trash2, Eye, X,
  Home, DoorOpen, KeyRound, Wrench, ChevronRight, Loader2, MapPin, Layers
} from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";



const STATUS_MAP = {
  AVAILABLE: { label: "Còn trống", variant: "default", color: "bg-success/15 text-success" },
  OCCUPIED: { label: "Đã thuê", variant: "secondary", color: "bg-muted text-muted-foreground" },
  MAINTENANCE: { label: "Bảo trì", variant: "outline", color: "bg-amber-100 text-amber-600" },
};

const fmtPrice = (p) => {
  if (!p) return "0";
  return parseFloat(p).toLocaleString("vi-VN");
};

function RoomCard({ room, onEdit, onDelete, onView }) {
  const statusKey = room.status?.toUpperCase() || "AVAILABLE";
  const cfg = STATUS_MAP[statusKey] || STATUS_MAP.AVAILABLE;
  const imageUrl = room.images?.[0]?.image_url || room.thumbnail_url || "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&q=80";

  return (
    <Card
      className="overflow-hidden transition-all hover:shadow-xl flex flex-col cursor-pointer group border-none shadow-sm"
      onClick={() => onView(room.id)}
    >
      <div className="relative h-48 overflow-hidden shrink-0">
        <img src={imageUrl} alt={room.room_number} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <Badge className={cn("absolute top-3 right-3 border-none", cfg.color)}>{cfg.label}</Badge>
      </div>
      <CardContent className="p-4 space-y-3.5 flex-1 flex flex-col">
        <div>
          <div className="flex items-center justify-between mb-1">
            <p className="font-bold text-lg tracking-tight">{room.room_number}</p>
            <span className="text-[10px] font-bold uppercase text-muted-foreground bg-muted px-2 py-0.5 rounded">Tầng {room.floor}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-medium text-primary bg-primary/5 w-fit px-2.5 py-1 rounded-md mb-2">
            <MapPin className="size-3" />
            {room.building?.name}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-[12px]">
          <div className="flex flex-col gap-0.5">
            <span className="text-muted-foreground flex items-center gap-1"><Layers className="size-3" /> Loại:</span>
            <span className="font-semibold truncate">{room.room_type?.name}</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-muted-foreground">Giá gốc:</span>
            <span className="font-semibold text-primary">{fmtPrice(room.room_type?.base_price)} đ</span>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-auto pt-2 border-t border-border/50">
          <Button
            size="sm"
            variant="secondary"
            className="flex-1 gap-1.5 h-8 text-xs font-bold"
            onClick={(e) => {
              e.stopPropagation();
              onView(room.id);
            }}
          >
            <Eye className="size-3.5" /> Chi tiết
          </Button>
          <Button size="icon" variant="outline" className="size-8 hover:bg-primary/5" onClick={(e) => { e.stopPropagation(); onEdit(room); }}>
            <Pencil className="size-3.5" />
          </Button>
          <Button size="icon" variant="outline" className="size-8 text-destructive hover:bg-destructive/10 border-destructive/20" onClick={(e) => { e.stopPropagation(); onDelete(room); }}>
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}



export default function RoomsPage() {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 6;

  const [confirmDel, setConfirmDel] = useState(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [error, setError] = useState(null);

  const fetchRooms = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit });
      if (search.trim()) params.set("search", search.trim());
      if (filter !== "all") params.set("status", filter.toUpperCase());

      const res = await api.get(`/api/rooms?${params}`);
      setRooms(res.data || []);
      setTotal(res.total || 0);
      setTotalPages(res.totalPages || 1);
    } catch (err) {
      setError("Không thể kết nối API. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, [page, search, filter]);

  const handleDelete = async () => {
    setSaving(true);
    try {
      await api.delete(`/api/rooms/${confirmDel.id}`);
      setConfirmDel(null);
      fetchRooms();
    } catch (err) {
      alert("Lỗi khi xóa phòng: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const available = rooms.filter((r) => r.status?.toUpperCase() === "AVAILABLE").length;
  const occupied = rooms.filter((r) => r.status?.toUpperCase() === "OCCUPIED").length;
  const maintenance = rooms.filter((r) => r.status?.toUpperCase() === "MAINTENANCE").length;

  const summaryStats = [
    { label: "Tổng phòng", value: total, icon: Home, color: "bg-primary/10 text-primary" },
    { label: "Còn trống", value: available, icon: DoorOpen, color: "bg-blue-100 text-blue-600" },
    { label: "Đã thuê", value: occupied, icon: KeyRound, color: "bg-red-100 text-red-600" },
    { label: "Bảo trì", value: maintenance, icon: Wrench, color: "bg-amber-100 text-amber-600" },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3 pt-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Phòng</h1>
          <p className="text-sm text-muted-foreground">Quản lý tất cả các phòng cho thuê</p>
        </div>
        <Button className="gap-1.5" onClick={() => navigate("/rooms/create")}>
          <Plus className="size-4" /> Tạo phòng mới
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryStats.map((s) => (
          <Card key={s.label}>
            <CardContent className="flex items-center gap-3.5 pt-5 pb-5">
              <div className={`flex items-center justify-center size-14 rounded-2xl ${s.color}`}>
                <s.icon className="size-6" />
              </div>
              <div>
                <p className="text-3xl font-bold">{s.value}</p>
                <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input placeholder="Tìm theo mã phòng, tòa nhà..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="pl-9" />
        </div>
        <div className="flex gap-1.5">
          {[
            { key: "all", label: "Tất cả" },
            { key: "available", label: "Còn trống" },
            { key: "occupied", label: "Đã thuê" },
            { key: "maintenance", label: "Bảo trì" },
          ].map((f) => (
            <Button key={f.key} size="sm" variant={filter === f.key ? "default" : "outline"} onClick={() => { setFilter(f.key); setPage(1); }}>
              {f.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <Loader2 className="size-10 animate-spin text-primary/40" />
          <p className="text-sm font-medium text-muted-foreground">Đang tải danh sách phòng...</p>
        </div>
      ) : error ? (
        <div className="text-center py-20 bg-muted/20 rounded-2xl border border-dashed border-border">
          <p className="text-destructive font-medium">{error}</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={fetchRooms}>Thử lại</Button>
        </div>
      ) : rooms.length === 0 ? (
        <div className="text-center py-24 bg-muted/20 rounded-2xl border border-dashed border-border">
          <DoorOpen className="size-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground font-medium">Không tìm thấy phòng nào.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {rooms.map((r) => (
              <RoomCard
                key={r.id}
                room={r}
                onView={(id) => navigate(`/rooms/${id}`)}
                onEdit={(r) => navigate(`/rooms/${r.id}/edit`)} // Giả sử có trang edit hoặc modal
                onDelete={setConfirmDel}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-8 pb-4">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Trước</Button>
              <div className="flex items-center gap-1 mx-2">
                {[...Array(totalPages)].map((_, i) => (
                  <Button
                    key={i}
                    variant={page === i + 1 ? "default" : "ghost"}
                    size="icon"
                    className="size-8 text-xs"
                    onClick={() => setPage(i + 1)}
                  >
                    {i + 1}
                  </Button>
                ))}
              </div>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Sau</Button>
            </div>
          )}
        </>
      )}

      {/* Form Dialog removed, navigating to Create instead */}


      {/* Confirm Delete */}
      <Dialog open={!!confirmDel} onOpenChange={(v) => !v && setConfirmDel(null)}>
        <DialogContent className="max-w-sm text-center">
          <DialogHeader>
            <DialogTitle>Xóa phòng</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Bạn có chắc muốn xóa phòng <strong className="text-foreground">"{confirmDel?.room_number}"</strong>? Hành động này không thể hoàn tác.
          </p>
          <DialogFooter className="justify-center gap-2 sm:justify-center">
            <Button variant="outline" onClick={() => setConfirmDel(null)} disabled={saving}>Hủy</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={saving} className="gap-2">
              {saving && <Loader2 className="size-4 animate-spin" />}
              Xóa phòng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
