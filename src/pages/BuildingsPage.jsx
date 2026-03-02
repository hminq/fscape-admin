import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus, Search, Pencil, Trash2, MapPin, Eye,
  Building2, ArrowLeft, Layers, Loader2,
  ToggleLeft, ToggleRight, ImagePlus, X,
  ShieldCheck, ShieldAlert
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import defaultBuildingImg from "@/assets/default_building_img.jpg";

/* ── helpers ───────────────────────────────── */

const fmt = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
};

const thumb = (b) => b.thumbnail_url || defaultBuildingImg;

const STATUS_STYLES = {
  true: { label: "Hoạt động", class: "bg-success/15 text-success" },
  false: { label: "Không hoạt động", class: "bg-muted text-muted-foreground" },
};

const EMPTY_FORM = {
  name: "", location_id: "", address: "",
  description: "", total_floors: "",
  is_active: "true", images: [],
};

/* ── ImageUploader ─────────────────────────── */

function ImageUploader({ images, onChange }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const addFiles = (files) => {
    const newImgs = Array.from(files)
      .filter((f) => f.type.startsWith("image/"))
      .map((f) => ({ file: f, url: URL.createObjectURL(f), name: f.name }));
    onChange([...images, ...newImgs]);
  };

  const removeImg = (idx) => onChange(images.filter((_, i) => i !== idx));

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    addFiles(e.dataTransfer.files);
  };

  return (
    <div className="space-y-2">
      <Label>Hình ảnh</Label>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`flex flex-col items-center justify-center gap-2 h-28 rounded-lg border-2 border-dashed cursor-pointer transition-colors ${dragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/40"
          }`}
      >
        <ImagePlus className="size-6 text-muted-foreground" />
        <p className="text-xs text-muted-foreground text-center">
          Kéo thả ảnh vào đây hoặc <span className="text-primary font-medium">chọn file</span>
        </p>
        <input ref={inputRef} type="file" accept="image/*" multiple className="hidden"
          onChange={(e) => addFiles(e.target.files)} />
      </div>
      {images.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {images.map((img, idx) => (
            <div key={idx} className="relative group aspect-square rounded-lg overflow-hidden border border-border bg-muted">
              <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
              {idx === 0 && (
                <span className="absolute bottom-0 left-0 right-0 text-[9px] font-bold text-center bg-primary text-primary-foreground py-0.5">
                  Ảnh chính
                </span>
              )}
              <button type="button"
                onClick={(e) => { e.stopPropagation(); removeImg(idx); }}
                className="absolute top-1 right-1 size-5 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              ><X className="size-3" /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── BuildingCard ──────────────────────────── */

function BuildingCard({ building, onView, onEdit, onDelete }) {
  const st = STATUS_STYLES[building.is_active] || STATUS_STYLES["true"];

  return (
    <Card className="overflow-hidden py-0 gap-0 transition-shadow hover:shadow-lg">
      <div className="h-52 overflow-hidden bg-muted">
        <img
          src={thumb(building)}
          alt={building.name}
          className="w-full h-full object-cover transition-transform hover:scale-105"
          onError={(e) => { e.target.src = defaultBuildingImg; }}
        />
      </div>

      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-bold text-base truncate">{building.name}</h3>
          <span className={`shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded-full ${st.class}`}>
            {st.label}
          </span>
        </div>

        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <MapPin className="size-3 shrink-0" /> {building.address}
        </p>

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {building.location && (
            <span className="flex items-center gap-1">
              <MapPin className="size-3" /> {building.location.name}
            </span>
          )}
          {(building.total_floors ?? 0) > 0 && (
            <span className="flex items-center gap-1">
              <Layers className="size-3" /> {building.total_floors} tầng
            </span>
          )}
          {building.facilities?.length > 0 && (
            <span>{building.facilities.length} tiện ích</span>
          )}
        </div>

        <div className="flex items-center gap-2 pt-1">
          <Button size="sm" className="flex-1 gap-1.5" onClick={() => onView(building)}>
            <Eye className="size-3.5" /> Chi tiết
          </Button>
          <Button size="icon" variant="outline" className="size-8" onClick={() => onEdit(building)}>
            <Pencil className="size-3.5" />
          </Button>
          <Button
            size="icon" variant="outline"
            className="size-8 text-destructive hover:bg-destructive/10"
            onClick={() => onDelete(building)}
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </div>
    </Card>
  );
}

/* ── BuildingDetail ────────────────────────── */

function BuildingDetail({ buildingId, onBack }) {
  const [building, setBuilding] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get(`/api/buildings/${buildingId}`);
        if (!cancelled) setBuilding(res.data);
      } catch {
        if (!cancelled) setError("Không thể tải thông tin tòa nhà.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [buildingId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !building) {
    return (
      <div className="text-center py-20 space-y-3">
        <p className="text-sm text-destructive">{error || "Không tìm thấy tòa nhà."}</p>
        <Button variant="outline" size="sm" onClick={onBack}>Quay lại</Button>
      </div>
    );
  }

  const st = STATUS_STYLES[building.is_active] || STATUS_STYLES["true"];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Button variant="outline" size="icon" onClick={onBack} className="mt-1 shadow-sm">
          <ArrowLeft className="size-4" />
        </Button>
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <h1 className="text-xl font-bold">{building.name}</h1>
            <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${st.class}`}>
              {st.label}
            </span>
          </div>
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            <MapPin className="size-3.5" /> {building.address}
          </p>
        </div>
      </div>

      {/* Main info card */}
      <Card className="overflow-hidden">
        <div className="flex flex-col md:flex-row">
          <div className="md:w-72 shrink-0">
            <img
              src={thumb(building)}
              alt={building.name}
              className="w-full h-full min-h-52 object-cover"
              onError={(e) => { e.target.src = defaultBuildingImg; }}
            />
          </div>
          <CardContent className="p-6 space-y-4 flex-1">
            <div className="grid grid-cols-2 gap-4">
              {[
                ["Khu vực", building.location?.name || "—"],
                ["Địa chỉ", building.address],
                ...(building.total_floors > 0 ? [["Số tầng", `${building.total_floors} tầng`]] : []),
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

      {/* Images gallery – mosaic layout */}
      {building.images?.length > 0 && (
        <div>
          <h2 className="text-lg font-bold mb-3">Hình ảnh</h2>
          <div className="grid grid-cols-3 gap-2">
            {building.images.map((img, idx) => {
              const src = img.image_url || img.url || img;
              return (
                <div
                  key={img.id || idx}
                  className={`relative rounded-xl overflow-hidden bg-muted ${idx === 0 ? "col-span-2 row-span-2 aspect-video" : "aspect-square"
                    }`}
                >
                  <img src={src} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    onError={(e) => { e.target.style.display = "none"; }} />
                  {idx === 0 && (
                    <span className="absolute bottom-0 left-0 right-0 text-[10px] font-bold text-center bg-primary/80 text-primary-foreground py-1">
                      Ảnh chính
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Facilities */}
      {building.facilities?.length > 0 && (
        <div>
          <h2 className="text-lg font-bold mb-3">Tiện ích</h2>
          <div className="flex flex-wrap gap-2">
            {building.facilities.map((f) => (
              <span
                key={f.id}
                className={`text-xs font-medium px-3 py-1.5 rounded-full ${f.BuildingFacility?.is_active !== false
                  ? "bg-success/15 text-success"
                  : "bg-muted text-muted-foreground"
                  }`}
              >
                {f.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Nearby universities */}
      {building.nearby_universities?.length > 0 && (
        <div>
          <h2 className="text-lg font-bold mb-3">Trường đại học lân cận</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {building.nearby_universities.map((uni) => (
              <Card key={uni.id}>
                <CardContent className="p-4">
                  <p className="font-medium text-sm">{uni.name}</p>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <MapPin className="size-3" /> {uni.address}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── BuildingFormDialog ────────────────────── */

function BuildingFormDialog({ open, onOpenChange, mode, initialData, onSave, saving, locations }) {
  const [form, setForm] = useState(
    initialData
      ? {
        name: initialData.name || "",
        location_id: initialData.location_id || "",
        address: initialData.address || "",
        description: initialData.description || "",
        total_floors: initialData.total_floors ?? "",
        is_active: String(initialData.is_active ?? true),
        images: (initialData.images || []).map((img) => ({
          url: img.image_url || img.url || img,
          name: "",
          existing: true,
        })),
      }
      : EMPTY_FORM
  );
  const [errors, setErrors] = useState({});
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = true;
    if (!form.location_id) e.location_id = true;
    if (!form.address.trim()) e.address = true;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSave({
      name: form.name.trim(),
      location_id: form.location_id,
      address: form.address.trim(),
      description: form.description.trim() || null,
      total_floors: form.total_floors ? Number(form.total_floors) : null,
      is_active: form.is_active === "true",
      // images: form.images  // attach if your API supports multipart
    });
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
              <Input
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="VD: FScape Cầu Giấy"
                className={errors.name ? "border-destructive" : ""}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Khu vực *</Label>
              <Select value={form.location_id} onValueChange={(v) => set("location_id", v)}>
                <SelectTrigger className={errors.location_id ? "border-destructive" : ""}>
                  <SelectValue placeholder="Chọn khu vực" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((loc) => (
                    <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Địa chỉ *</Label>
            <Input
              value={form.address}
              onChange={(e) => set("address", e.target.value)}
              placeholder="VD: 144 Xuân Thủy, Cầu Giấy"
              className={errors.address ? "border-destructive" : ""}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Số tầng</Label>
              <Input type="number" min="1" value={form.total_floors}
                onChange={(e) => set("total_floors", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Trạng thái</Label>
              <Select value={form.is_active} onValueChange={(v) => set("is_active", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Hoạt động</SelectItem>
                  <SelectItem value="false">Không hoạt động</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <ImageUploader
            images={form.images}
            onChange={(imgs) => set("images", imgs)}
          />

          <div className="space-y-1.5">
            <Label>Mô tả</Label>
            <Textarea rows={3} value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Mô tả ngắn về tòa nhà..." />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
            <Button
              type="submit"
              disabled={saving}
              className="bg-success text-success-foreground hover:bg-success/90"
            >
              {saving && <Loader2 className="size-4 animate-spin mr-1.5" />}
              {mode === "add" ? "Thêm tòa nhà" : "Lưu thay đổi"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ── BuildingsPage ─────────────────────────── */

export default function BuildingsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  /* data */
  const [buildings, setBuildings] = useState([]);
  const [locations, setLocations] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  /* filters */
  const [search, setSearch] = useState("");
  const [filterActive, setFilterActive] = useState("all");
  const [filterLocation, setFilterLocation] = useState("all");

  /* dialogs */
  const [dialog, setDialog] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);
  const [confirmToggle, setConfirmToggle] = useState(null);
  const [selectedId, setSelectedId] = useState(null);

  const limit = 9;

  /* ─ fetch locations for dropdown ─ */
  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/api/locations?limit=100&is_active=true");
        setLocations(res.data || []);
      } catch {
        /* silent — locations dropdown will be empty */
      }
    })();
  }, []);

  /* ─ fetch buildings ─ */
  const fetchBuildings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page, limit });
      if (search.trim()) params.set("search", search.trim());
      if (filterActive === "active") params.set("is_active", "true");
      if (filterActive === "inactive") params.set("is_active", "false");
      if (filterLocation !== "all") params.set("location_id", filterLocation);

      const res = await api.get(`/api/buildings?${params}`);
      setBuildings(res.data || []);
      setTotal(res.total || 0);
      setPage(res.page || 1);
      setTotalPages(res.totalPages || 1);
    } catch {
      setError("Không thể tải dữ liệu. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }, [page, search, filterActive, filterLocation]);

  useEffect(() => { fetchBuildings(); }, [fetchBuildings]);

  useEffect(() => { setPage(1); }, [search, filterActive, filterLocation]);

  /* stats */
  const activeCount = buildings.filter((b) => b.is_active).length;

  /* ─ CRUD handlers ─ */
  const handleSave = async (data) => {
    setSaving(true);
    try {
      if (dialog.mode === "add") {
        await api.post("/api/buildings", { ...data, manager_id: user?.id });
      } else {
        await api.put(`/api/buildings/${dialog.data.id}`, data);
      }
      setDialog(null);
      fetchBuildings();
    } catch (err) {
      alert(err.message || "Đã xảy ra lỗi. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await api.delete(`/api/buildings/${confirmDel.id}`);
      setConfirmDel(null);
      fetchBuildings();
    } catch (err) {
      alert(err.message || "Không thể xóa tòa nhà. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleConfirm = async () => {
    setSaving(true);
    try {
      await api.put(`/api/buildings/${confirmToggle.id}`, {
        is_active: !confirmToggle.is_active,
      });
      setConfirmToggle(null);
      fetchBuildings();
    } catch (err) {
      alert(err.message || "Không thể cập nhật trạng thái. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  };

  /* ─ detail view ─ */
  if (selectedId) {
    return <BuildingDetail buildingId={selectedId} onBack={() => setSelectedId(null)} />;
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3 pt-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tòa nhà</h1>
          <p className="text-sm text-muted-foreground">Quản lý tất cả các tòa nhà FScape</p>
        </div>
        <Button className="gap-0.5" onClick={() => navigate("/buildings/create")}>
          <Plus className="size-4" /> Thêm tòa nhà
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="flex items-center gap-4 px-6 py-5 overflow-hidden">
          <div className="size-14 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Building2 className="size-6 text-primary" />
          </div>
          <div>
            <p className="text-3xl font-bold tracking-tight">{total}</p>
            <p className="text-sm text-muted-foreground">Tổng tòa nhà</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4 px-6 py-5 overflow-hidden">
          <div className="size-14 rounded-2xl bg-success/10 flex items-center justify-center">
            <ShieldCheck className="size-6 text-success" />
          </div>
          <div>
            <p className="text-3xl font-bold text-success">{activeCount}</p>
            <p className="text-sm text-muted-foreground">Đang hoạt động</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4 px-6 py-5 overflow-hidden bg-muted/5 border-none shadow-sm">
          <div className="size-14 rounded-2xl bg-background flex items-center justify-center border border-border">
            <ShieldAlert className="size-6 text-muted-foreground/40" />
          </div>
          <div>
            <p className="text-3xl font-bold text-muted-foreground">{total - activeCount}</p>
            <p className="text-sm text-muted-foreground">Vô hiệu hóa</p>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm tòa nhà..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Location filter */}
        <Select value={filterLocation} onValueChange={setFilterLocation}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Khu vực" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả khu vực</SelectItem>
            {locations.map((loc) => (
              <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Status filter */}
        <div className="flex gap-1.5">
          {[
            { key: "all", label: "Tất cả" },
            { key: "active", label: "Hoạt động" },
            { key: "inactive", label: "Không hoạt động" },
          ].map((f) => (
            <Button
              key={f.key}
              size="sm"
              variant={filterActive === f.key ? "default" : "outline"}
              onClick={() => setFilterActive(f.key)}
            >
              {f.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Building cards */}
      <div>
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="py-14 text-center">
            <p className="text-sm text-destructive">{error}</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={fetchBuildings}>
              Thử lại
            </Button>
          </div>
        ) : buildings.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            Không tìm thấy tòa nhà nào.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {buildings.map((b) => (
                <BuildingCard
                  key={b.id}
                  building={b}
                  onView={(b) => setSelectedId(b.id)}
                  onEdit={(b) => setDialog({ mode: "edit", data: b })}
                  onDelete={setConfirmDel}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4">
                <p className="text-xs text-muted-foreground">
                  Trang {page} / {totalPages} ({total} tòa nhà)
                </p>
                <div className="flex gap-1.5">
                  <Button
                    size="sm" variant="outline"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    Trước
                  </Button>
                  <Button
                    size="sm" variant="outline"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Sau
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Form Dialog */}
      {dialog && (
        <BuildingFormDialog
          open={!!dialog}
          onOpenChange={(v) => !v && setDialog(null)}
          mode={dialog.mode}
          initialData={dialog.data}
          onSave={handleSave}
          saving={saving}
          locations={locations}
        />
      )}

      {/* Confirm Toggle */}
      <Dialog open={!!confirmToggle} onOpenChange={(v) => !v && setConfirmToggle(null)}>
        <DialogContent className="max-w-sm text-center">
          <DialogHeader>
            <DialogTitle>
              {confirmToggle?.is_active ? "Tắt tòa nhà" : "Bật tòa nhà"}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {confirmToggle?.is_active
              ? <>Bạn có chắc muốn <strong className="text-foreground">tắt hoạt động</strong> tòa nhà <strong className="text-foreground">&quot;{confirmToggle?.name}&quot;</strong>?</>
              : <>Bạn có chắc muốn <strong className="text-foreground">bật hoạt động</strong> tòa nhà <strong className="text-foreground">&quot;{confirmToggle?.name}&quot;</strong>?</>
            }
          </p>
          <DialogFooter className="justify-center gap-2 sm:justify-center">
            <Button variant="outline" onClick={() => setConfirmToggle(null)}>Hủy</Button>
            <Button
              variant={confirmToggle?.is_active ? "destructive" : "outline"}
              className={!confirmToggle?.is_active ? "border-success bg-success text-success-foreground hover:bg-success/90 hover:border-success/90" : ""}
              disabled={saving}
              onClick={handleToggleConfirm}
            >
              {saving && <Loader2 className="size-4 animate-spin mr-1.5" />}
              {confirmToggle?.is_active ? "Tắt" : "Bật"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Delete */}
      <Dialog open={!!confirmDel} onOpenChange={(v) => !v && setConfirmDel(null)}>
        <DialogContent className="max-w-sm text-center">
          <DialogHeader>
            <DialogTitle>Xóa tòa nhà</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Bạn có chắc muốn xóa tòa nhà{" "}
            <strong className="text-foreground">&quot;{confirmDel?.name}&quot;</strong>?{" "}
            Hành động này không thể hoàn tác.
          </p>
          <DialogFooter className="justify-center gap-2 sm:justify-center">
            <Button variant="outline" onClick={() => setConfirmDel(null)}>Hủy</Button>
            <Button variant="destructive" disabled={saving} onClick={handleDelete}>
              {saving && <Loader2 className="size-4 animate-spin mr-1.5" />}
              Xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
