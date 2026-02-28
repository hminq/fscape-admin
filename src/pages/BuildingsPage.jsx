import { useState } from "react";
import {
  Plus, Search, Pencil, Trash2, MapPin, X, Eye, Upload,
  Building2, DoorOpen, KeyRound, BarChart3, ArrowLeft,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
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

const INITIAL_BUILDINGS = [
  {
    id: 1, name: "FScape Hà Nội", address: "144 Xuân Thủy, Cầu Giấy, Hà Nội",
    status: "active", totalRooms: 85, rentedRooms: 72, nearSchool: "ĐH Quốc gia Hà Nội",
    distance: "500m", image: "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=600&q=80",
    description: "Tòa nhà hiện đại nằm ngay gần khu vực Cầu Giấy, thuận tiện di chuyển.",
    floors: 8, yearBuilt: 2018,
  },
  {
    id: 2, name: "FScape FPT", address: "Khu CNC Hòa Lạc, Hà Nội",
    status: "active", totalRooms: 65, rentedRooms: 58, nearSchool: "ĐH FPT",
    distance: "300m", image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600&q=80",
    description: "Ký túc xá cao cấp phục vụ sinh viên ĐH FPT tại Hòa Lạc.",
    floors: 10, yearBuilt: 2020,
  },
  {
    id: 3, name: "FScape TP.HCM", address: "702 Nguyễn Văn Linh, Q.7, TP.HCM",
    status: "active", totalRooms: 120, rentedRooms: 98, nearSchool: "RMIT Việt Nam",
    distance: "400m", image: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=600&q=80",
    description: "Tòa nhà tọa lạc trung tâm Quận 7, gần RMIT và nhiều trường đại học lớn.",
    floors: 12, yearBuilt: 2019,
  },
  {
    id: 4, name: "FScape Đà Nẵng", address: "54 Nguyễn Lương Bằng, Đà Nẵng",
    status: "maintenance", totalRooms: 45, rentedRooms: 35, nearSchool: "ĐH Đà Nẵng",
    distance: "600m", image: "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=600&q=80",
    description: "Tòa nhà đang trong giai đoạn bảo trì nâng cấp hệ thống.",
    floors: 6, yearBuilt: 2017,
  },
];

const EMPTY_FORM = {
  name: "", address: "", status: "active", totalRooms: "", rentedRooms: "",
  nearSchool: "", distance: "", image: "", description: "", floors: "", yearBuilt: "",
};

function BuildingCard({ building, onView, onEdit, onDelete }) {
  const rate = Math.round((building.rentedRooms / building.totalRooms) * 100);
  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-lg">
      <div className="relative h-44 overflow-hidden">
        <img src={building.image} alt={building.name} className="w-full h-full object-cover transition-transform hover:scale-105" />
        <Badge className="absolute top-3 right-3" variant={building.status === "active" ? "default" : "outline"}>
          {building.status === "active" ? "Hoạt động" : "Bảo trì"}
        </Badge>
      </div>
      <CardContent className="p-4 space-y-3">
        <div>
          <h3 className="font-bold text-base">{building.name}</h3>
          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
            <MapPin className="size-3" /> {building.address}
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-lg font-bold">{building.totalRooms}</p>
            <p className="text-[11px] text-muted-foreground">Tổng phòng</p>
          </div>
          <div>
            <p className="text-lg font-bold text-primary">{building.rentedRooms}</p>
            <p className="text-[11px] text-muted-foreground">Đã thuê</p>
          </div>
          <div>
            <p className="text-lg font-bold text-blue-600">{rate}%</p>
            <p className="text-[11px] text-muted-foreground">Tỷ lệ</p>
          </div>
        </div>
        <Progress value={rate} className="h-1.5" />
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">
            🏫 Gần: <strong className="text-foreground">{building.nearSchool}</strong>
            <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5 py-0">{building.distance}</Badge>
          </span>
        </div>
        <div className="flex items-center gap-2 pt-1">
          <Button size="sm" className="flex-1 gap-1.5" onClick={() => onView(building)}>
            <Eye className="size-3.5" /> Chi tiết
          </Button>
          <Button size="icon" variant="outline" className="size-8" onClick={() => onEdit(building)}>
            <Pencil className="size-3.5" />
          </Button>
          <Button size="icon" variant="outline" className="size-8 text-destructive hover:bg-destructive/10" onClick={() => onDelete(building)}>
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function BuildingDetail({ building, onBack }) {
  const available = building.totalRooms - building.rentedRooms;
  const occupancy = building.totalRooms ? Math.round((building.rentedRooms / building.totalRooms) * 100) : 0;
  const detailStats = [
    { label: "Tổng phòng", value: building.totalRooms, icon: DoorOpen, color: "bg-primary/10 text-primary" },
    { label: "Đang thuê", value: building.rentedRooms, icon: KeyRound, color: "bg-blue-100 text-blue-600" },
    { label: "Còn trống", value: available, icon: DoorOpen, color: "bg-green-100 text-green-600" },
    { label: "Tỷ lệ lấp đầy", value: `${occupancy}%`, icon: BarChart3, color: "bg-amber-100 text-amber-600" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <Button variant="outline" size="sm" onClick={onBack} className="gap-1.5 mt-1">
          <ArrowLeft className="size-4" /> Quay lại
        </Button>
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <h1 className="text-xl font-bold">{building.name}</h1>
            <Badge variant={building.status === "active" ? "default" : "outline"}>
              {building.status === "active" ? "Hoạt động" : "Bảo trì"}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">📍 {building.address}</p>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="flex flex-col md:flex-row">
          <div className="md:w-72 shrink-0">
            <img src={building.image} alt={building.name} className="w-full h-full min-h-52 object-cover" />
          </div>
          <CardContent className="p-6 space-y-4 flex-1">
            <div className="grid grid-cols-2 gap-4">
              {[
                ["Địa chỉ", `📍 ${building.address}`],
                ["Trường gần đó", `🏫 ${building.nearSchool} — ${building.distance}`],
                ...(building.floors > 0 ? [["Số tầng", `🏗️ ${building.floors} tầng`]] : []),
                ...(building.yearBuilt > 0 ? [["Năm xây dựng", `📅 ${building.yearBuilt}`]] : []),
              ].map(([label, value]) => (
                <div key={label}>
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{label}</p>
                  <p className="text-sm font-medium mt-0.5">{value}</p>
                </div>
              ))}
            </div>
            {building.description && (
              <p className="text-sm text-muted-foreground border-t pt-4">{building.description}</p>
            )}
          </CardContent>
        </div>
      </Card>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {detailStats.map((s) => (
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
    </div>
  );
}

function BuildingFormDialog({ open, onOpenChange, mode, initialData, onSave }) {
  const [form, setForm] = useState(initialData || EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = true;
    if (!form.address.trim()) e.address = true;
    if (!form.totalRooms || Number(form.totalRooms) <= 0) e.totalRooms = true;
    if (!form.nearSchool.trim()) e.nearSchool = true;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSave({
      ...form,
      totalRooms: Number(form.totalRooms),
      rentedRooms: Number(form.rentedRooms) || 0,
      floors: Number(form.floors) || 0,
      yearBuilt: Number(form.yearBuilt) || 0,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === "add" ? "Thêm tòa nhà mới" : "Chỉnh sửa tòa nhà"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Tên tòa nhà *</Label>
              <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="VD: FScape Hà Nội" className={errors.name ? "border-destructive" : ""} />
            </div>
            <div className="space-y-1.5">
              <Label>Trạng thái</Label>
              <Select value={form.status} onValueChange={(v) => set("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Hoạt động</SelectItem>
                  <SelectItem value="maintenance">Bảo trì</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Địa chỉ *</Label>
            <Input value={form.address} onChange={(e) => set("address", e.target.value)} placeholder="VD: 144 Xuân Thủy, Cầu Giấy" className={errors.address ? "border-destructive" : ""} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>Tổng phòng *</Label>
              <Input type="number" min="1" value={form.totalRooms} onChange={(e) => set("totalRooms", e.target.value)} className={errors.totalRooms ? "border-destructive" : ""} />
            </div>
            <div className="space-y-1.5">
              <Label>Đã thuê</Label>
              <Input type="number" min="0" value={form.rentedRooms} onChange={(e) => set("rentedRooms", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Số tầng</Label>
              <Input type="number" min="1" value={form.floors} onChange={(e) => set("floors", e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Trường gần đó *</Label>
              <Input value={form.nearSchool} onChange={(e) => set("nearSchool", e.target.value)} className={errors.nearSchool ? "border-destructive" : ""} />
            </div>
            <div className="space-y-1.5">
              <Label>Khoảng cách</Label>
              <Input value={form.distance} onChange={(e) => set("distance", e.target.value)} placeholder="VD: 500m" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Năm xây dựng</Label>
              <Input type="number" value={form.yearBuilt} onChange={(e) => set("yearBuilt", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>URL ảnh</Label>
              <Input value={form.image} onChange={(e) => set("image", e.target.value)} placeholder="https://..." />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Mô tả</Label>
            <Textarea rows={3} value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Mô tả ngắn..." />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
            <Button type="submit">{mode === "add" ? "Thêm tòa nhà" : "Lưu thay đổi"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function BuildingsPage() {
  const [buildings, setBuildings] = useState(INITIAL_BUILDINGS);
  const [dialog, setDialog] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selected, setSelected] = useState(null);

  const totalRooms = buildings.reduce((s, b) => s + b.totalRooms, 0);
  const totalRented = buildings.reduce((s, b) => s + b.rentedRooms, 0);
  const occupancy = totalRooms ? Math.round((totalRented / totalRooms) * 100 * 10) / 10 : 0;

  const filtered = buildings.filter((b) => {
    const matchSearch = b.name.toLowerCase().includes(search.toLowerCase()) || b.address.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || b.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const handleSave = (data) => {
    if (dialog.mode === "add") {
      setBuildings((prev) => [...prev, { ...data, id: Date.now() }]);
    } else {
      setBuildings((prev) => prev.map((b) => (b.id === data.id ? data : b)));
    }
  };

  const handleDelete = () => {
    setBuildings((prev) => prev.filter((b) => b.id !== confirmDel.id));
    setConfirmDel(null);
  };

  if (selected) {
    return <BuildingDetail building={selected} onBack={() => setSelected(null)} />;
  }

  const summaryStats = [
    { label: "Tổng tòa nhà", value: buildings.length, icon: Building2, color: "bg-primary/10 text-primary" },
    { label: "Tổng phòng", value: totalRooms, icon: DoorOpen, color: "bg-blue-100 text-blue-600" },
    { label: "Phòng đã thuê", value: totalRented, icon: KeyRound, color: "bg-red-100 text-red-600" },
    { label: "Tỷ lệ lấp đầy", value: `${occupancy}%`, icon: BarChart3, color: "bg-amber-100 text-amber-600" },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3 pt-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tòa nhà</h1>
          <p className="text-sm text-muted-foreground">Quản lý tất cả các tòa nhà FScape</p>
        </div>
        <Button className="gap-1.5" onClick={() => setDialog({ mode: "add", data: null })}>
          <Plus className="size-4" /> Thêm tòa nhà
        </Button>
      </div>

      {/* Summary */}
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
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input placeholder="Tìm kiếm tòa nhà..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="flex gap-1.5">
          {[{ key: "all", label: "Tất cả" }, { key: "active", label: "Hoạt động" }, { key: "maintenance", label: "Bảo trì" }].map((f) => (
            <Button key={f.key} size="sm" variant={filterStatus === f.key ? "default" : "outline"} onClick={() => setFilterStatus(f.key)}>
              {f.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">Không tìm thấy tòa nhà nào.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filtered.map((b) => (
            <BuildingCard key={b.id} building={b} onView={setSelected} onEdit={(b) => setDialog({ mode: "edit", data: { ...b } })} onDelete={setConfirmDel} />
          ))}
        </div>
      )}

      {/* Form Dialog */}
      {dialog && (
        <BuildingFormDialog
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
            <DialogTitle>Xóa tòa nhà</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Bạn có chắc muốn xóa <strong className="text-foreground">"{confirmDel?.name}"</strong>? Hành động này không thể hoàn tác.
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
