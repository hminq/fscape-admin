import { useState } from "react";
import {
  Plus, Search, Pencil, Trash2, Eye, X,
  Home, DoorOpen, KeyRound, Wrench,
} from "lucide-react";
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

const INITIAL_ROOMS = [
  { id: 1, roomNumber: "A-301", building: "FScape Hà Nội", status: "available", type: "Phòng đơn", area: 18, capacity: 1, floor: 3, price: 4500000, image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&q=80" },
  { id: 2, roomNumber: "B-205", building: "FScape FPT", status: "occupied", type: "Phòng đôi", area: 25, capacity: 2, floor: 2, price: 5200000, image: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&q=80" },
  { id: 3, roomNumber: "C-102", building: "FScape TP.HCM", status: "occupied", type: "Studio", area: 35, capacity: 1, floor: 1, price: 6800000, image: "https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=600&q=80" },
  { id: 4, roomNumber: "A-405", building: "FScape Hà Nội", status: "available", type: "Phòng đơn", area: 20, capacity: 1, floor: 4, price: 4800000, image: "https://images.unsplash.com/photo-1540518614846-7eded433c457?w=600&q=80" },
  { id: 5, roomNumber: "C-308", building: "FScape TP.HCM", status: "available", type: "Phòng đôi", area: 28, capacity: 2, floor: 3, price: 5500000, image: "https://images.unsplash.com/photo-1505693314120-0d443867891c?w=600&q=80" },
  { id: 6, roomNumber: "D-201", building: "FScape Đà Nẵng", status: "maintenance", type: "Ký túc xá", area: 22, capacity: 2, floor: 2, price: 4200000, image: "https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?w=600&q=80" },
];

const STATUS_MAP = {
  available: { label: "Còn trống", variant: "default" },
  occupied: { label: "Đã thuê", variant: "secondary" },
  maintenance: { label: "Bảo trì", variant: "outline" },
};

const BUILDINGS = ["FScape Hà Nội", "FScape FPT", "FScape TP.HCM", "FScape Đà Nẵng"];
const ROOM_TYPES = ["Phòng đơn", "Phòng đôi", "Studio", "Ký túc xá"];

const fmtPrice = (p) => p.toLocaleString("vi-VN");

function RoomCard({ room, onEdit, onDelete }) {
  const cfg = STATUS_MAP[room.status];
  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-lg flex flex-col">
      <div className="relative h-44 overflow-hidden shrink-0">
        <img src={room.image} alt={room.roomNumber} className="w-full h-full object-cover transition-transform hover:scale-105" />
        <Badge className="absolute top-3 right-3" variant={cfg.variant}>{cfg.label}</Badge>
      </div>
      <CardContent className="p-4 space-y-3 flex-1 flex flex-col">
        <div>
          <p className="font-bold text-base">{room.roomNumber}</p>
          <p className="text-xs font-semibold text-primary">{room.building}</p>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[13px]">
          {[
            ["Loại:", room.type],
            ["Diện tích:", `${room.area} m²`],
            ["Sức chứa:", `${room.capacity} người`],
            ["Tầng:", `Tầng ${room.floor}`],
          ].map(([label, val]) => (
            <div key={label} className="flex justify-between">
              <span className="text-muted-foreground">{label}</span>
              <span className="font-semibold">{val}</span>
            </div>
          ))}
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-lg font-extrabold text-primary">{fmtPrice(room.price)} đ</span>
          <span className="text-xs text-muted-foreground">/ tháng</span>
        </div>
        <div className="flex items-center gap-2 mt-auto pt-1">
          <Button size="sm" className="flex-1 gap-1.5">
            <Eye className="size-3.5" /> Chi tiết
          </Button>
          <Button size="icon" variant="outline" className="size-8" onClick={() => onEdit(room)}>
            <Pencil className="size-3.5" />
          </Button>
          <Button size="icon" variant="outline" className="size-8 text-destructive hover:bg-destructive/10" onClick={() => onDelete(room)}>
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function RoomFormDialog({ open, onOpenChange, mode, initialData, onSave }) {
  const empty = { roomNumber: "", building: "FScape Hà Nội", status: "available", type: "Phòng đơn", area: "", capacity: 1, floor: "", price: "", image: "" };
  const [form, setForm] = useState(initialData || empty);
  const [errors, setErrors] = useState({});
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const validate = () => {
    const e = {};
    if (!form.roomNumber.trim()) e.roomNumber = true;
    if (!form.floor || Number(form.floor) <= 0) e.floor = true;
    if (!form.price || Number(form.price) <= 0) e.price = true;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSave({ ...form, floor: Number(form.floor), price: Number(form.price), area: Number(form.area) || 0, capacity: Number(form.capacity) || 1 });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === "add" ? "Tạo phòng mới" : "Chỉnh sửa phòng"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Số phòng *</Label>
              <Input value={form.roomNumber} onChange={(e) => set("roomNumber", e.target.value)} placeholder="VD: A-301" className={errors.roomNumber ? "border-destructive" : ""} />
            </div>
            <div className="space-y-1.5">
              <Label>Tòa nhà</Label>
              <Select value={form.building} onValueChange={(v) => set("building", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{BUILDINGS.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>Loại phòng</Label>
              <Select value={form.type} onValueChange={(v) => set("type", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{ROOM_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Tầng *</Label>
              <Input type="number" min="1" value={form.floor} onChange={(e) => set("floor", e.target.value)} className={errors.floor ? "border-destructive" : ""} />
            </div>
            <div className="space-y-1.5">
              <Label>Trạng thái</Label>
              <Select value={form.status} onValueChange={(v) => set("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Còn trống</SelectItem>
                  <SelectItem value="occupied">Đã thuê</SelectItem>
                  <SelectItem value="maintenance">Bảo trì</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>Giá/tháng (đ) *</Label>
              <Input type="number" value={form.price} onChange={(e) => set("price", e.target.value)} className={errors.price ? "border-destructive" : ""} />
            </div>
            <div className="space-y-1.5">
              <Label>Diện tích (m²)</Label>
              <Input type="number" value={form.area} onChange={(e) => set("area", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Sức chứa</Label>
              <Input type="number" min="1" value={form.capacity} onChange={(e) => set("capacity", e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>URL ảnh</Label>
            <Input value={form.image} onChange={(e) => set("image", e.target.value)} placeholder="https://..." />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
            <Button type="submit">{mode === "add" ? "Tạo phòng" : "Lưu thay đổi"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function RoomsPage() {
  const [rooms, setRooms] = useState(INITIAL_ROOMS);
  const [dialog, setDialog] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const total = rooms.length;
  const available = rooms.filter((r) => r.status === "available").length;
  const occupied = rooms.filter((r) => r.status === "occupied").length;
  const maintenance = rooms.filter((r) => r.status === "maintenance").length;

  const filtered = rooms.filter((r) => {
    const q = search.toLowerCase();
    const matchSearch = r.roomNumber.toLowerCase().includes(q) || r.building.toLowerCase().includes(q) || r.type.toLowerCase().includes(q);
    const matchFilter = filter === "all" || r.status === filter;
    return matchSearch && matchFilter;
  });

  const handleSave = (data) => {
    if (dialog.mode === "add") {
      setRooms((prev) => [...prev, { ...data, id: Date.now() }]);
    } else {
      setRooms((prev) => prev.map((r) => (r.id === data.id ? data : r)));
    }
  };

  const handleDelete = () => {
    setRooms((prev) => prev.filter((r) => r.id !== confirmDel.id));
    setConfirmDel(null);
  };

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
        <Button className="gap-1.5" onClick={() => setDialog({ mode: "add", data: null })}>
          <Plus className="size-4" /> Tạo phòng mới
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryStats.map((s) => (
          <Card key={s.label}>
            <CardContent className="flex items-center gap-3.5 pt-4 pb-4">
              <div className={`flex items-center justify-center size-11 rounded-xl ${s.color}`}>
                <s.icon className="size-5" />
              </div>
              <div>
                <p className="text-xl font-bold">{s.value}</p>
                <p className="text-[11px] text-muted-foreground font-medium">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input placeholder="Tìm theo mã phòng, tòa nhà, loại phòng..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="flex gap-1.5">
          {[
            { key: "all", label: "Tất cả" },
            { key: "available", label: "Còn trống" },
            { key: "occupied", label: "Đã thuê" },
            { key: "maintenance", label: "Bảo trì" },
          ].map((f) => (
            <Button key={f.key} size="sm" variant={filter === f.key ? "default" : "outline"} onClick={() => setFilter(f.key)}>
              {f.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">Không tìm thấy phòng nào.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((r) => (
            <RoomCard key={r.id} room={r} onEdit={(r) => setDialog({ mode: "edit", data: { ...r } })} onDelete={setConfirmDel} />
          ))}
        </div>
      )}

      {/* Form Dialog */}
      {dialog && (
        <RoomFormDialog
          open={!!dialog}
          onOpenChange={(v) => !v && setDialog(null)}
          mode={dialog.mode}
          initialData={dialog.data}
          onSave={handleSave}
        />
      )}

      {/* Confirm Delete */}
      <Dialog open={!!confirmDel} onOpenChange={(v) => !v && setConfirmDel(null)}>
        <DialogContent className="max-w-sm text-center">
          <DialogHeader>
            <DialogTitle>Xóa phòng</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Bạn có chắc muốn xóa phòng <strong className="text-foreground">"{confirmDel?.roomNumber}"</strong>? Hành động này không thể hoàn tác.
          </p>
          <DialogFooter className="justify-center gap-2 sm:justify-center">
            <Button variant="outline" onClick={() => setConfirmDel(null)}>Hủy</Button>
            <Button variant="destructive" onClick={handleDelete}>Xóa</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
