import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus, Search, Pencil, Trash2, MapPin, Eye,
  Building2, ArrowLeft, Layers, Loader2,
  ImagePlus, X, ChevronLeft, ChevronRight,
  GraduationCap, User as UserIcon, Phone, Mail,
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
import { apiJson, apiRequest } from "@/lib/apiClient";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import MapPicker from "@/components/MapPicker";
import defaultBuildingImg from "@/assets/default_building_img.jpg";

/* ── helpers ───────────────────────────────── */

const thumb = (b) => b.thumbnail_url || defaultBuildingImg;

const STATUS = {
  true: { label: "Hoạt động", dot: "bg-success", badge: "border-success/30 bg-success/10 text-success" },
  false: { label: "Vô hiệu hóa", dot: "bg-muted-foreground/40", badge: "border-border bg-muted text-muted-foreground" },
};

const EMPTY_FORM = {
  name: "", location_id: "", address: "",
  description: "", total_floors: "",
  is_active: "true", images: [],
};

const PER_SECTION = 6;

async function uploadFiles(purpose, files) {
  const fd = new FormData();
  fd.append("purpose", purpose);
  for (const f of files) fd.append("files", f);
  const res = await apiRequest("/api/upload", { method: "POST", body: fd });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Upload thất bại");
  }
  return res.json();
}

/* ── DonutChart ─────────────────────────────── */

function DonutChart({ active, inactive, size = 100 }) {
  const total = active + inactive;
  const pct = total > 0 ? (active / total) * 100 : 0;
  const r = 36;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" className="size-full -rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" strokeWidth="10"
          className="stroke-muted" />
        <circle cx="50" cy="50" r={r} fill="none" strokeWidth="10"
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          className="stroke-success transition-all duration-500" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[11px] font-bold leading-none">{total > 0 ? Math.round(pct) : 0}%</span>
      </div>
    </div>
  );
}

/* ── BuildingSummary ───────────────────────── */

function BuildingSummary({ total, active, inactive }) {
  return (
    <div className="rounded-2xl border border-border bg-card">
      <div className="flex items-center gap-6 p-5">
        {/* Left — total */}
        <div className="flex items-center gap-4 flex-1">
          <div className="size-11 rounded-xl bg-primary/8 flex items-center justify-center shrink-0">
            <Building2 className="size-5 text-primary" />
          </div>
          <div>
            <p className="text-3xl font-bold leading-none tracking-tight">{total}</p>
            <p className="text-sm text-muted-foreground mt-1">Tổng tòa nhà</p>
          </div>
        </div>

        {/* Divider */}
        <div className="w-px h-16 bg-border shrink-0" />

        {/* Right — chart */}
        <div className="flex items-center gap-5">
          <DonutChart active={active} inactive={inactive} size={80} />
          <div className="space-y-2.5">
            <div className="flex items-center gap-2">
              <span className="size-2.5 rounded-full bg-success shrink-0" />
              <span className="text-sm text-muted-foreground">Hoạt động</span>
              <span className="text-sm font-semibold ml-auto pl-3">{active}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="size-2.5 rounded-full bg-muted-foreground/30 shrink-0" />
              <span className="text-sm text-muted-foreground">Vô hiệu hóa</span>
              <span className="text-sm font-semibold ml-auto pl-3">{inactive}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── BuildingCard ──────────────────────────── */

function BuildingCard({ building, onView, onEdit, onDelete }) {
  const st = STATUS[building.is_active] || STATUS["true"];

  return (
    <Card className="overflow-hidden py-0 gap-0 transition-shadow hover:shadow-lg group">
      <div className="h-48 overflow-hidden bg-muted relative">
        <img
          src={thumb(building)}
          alt={building.name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          onError={(e) => { e.target.src = defaultBuildingImg; }}
        />
      </div>

      <div className="p-4 space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-bold text-[15px] truncate">{building.name}</h3>
          <span className={`shrink-0 text-[11px] font-medium px-2.5 py-0.5 rounded-full border ${st.badge}`}>
            {st.label}
          </span>
        </div>

        <p className="text-xs text-muted-foreground flex items-start gap-1.5 leading-relaxed">
          <MapPin className="size-3 shrink-0 mt-0.5" /> {building.address}
        </p>

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
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
          <Button size="sm" className="flex-1 gap-1.5 h-9" onClick={() => onView(building)}>
            <Eye className="size-3.5" /> Chi tiết
          </Button>
          <Button size="icon" variant="outline" className="size-9" onClick={() => onEdit(building)}>
            <Pencil className="size-3.5" />
          </Button>
          <Button
            size="icon" variant="outline"
            className="size-9 text-destructive hover:bg-destructive/10"
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
        const res = await apiJson(`/api/buildings/${buildingId}`);
        if (!cancelled) setBuilding(res.data || res);
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

  const st = STATUS[building.is_active] || STATUS["true"];
  const gallery = (building.images || [])
    .map((img) => img.image_url || img.url || img)
    .filter(Boolean);

  const infoItems = [
    { label: "Khu vực", value: building.location?.name },
    { label: "Địa chỉ", value: building.address },
    ...(building.total_floors > 0 ? [{ label: "Số tầng", value: `${building.total_floors} tầng` }] : []),
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <button
          onClick={onBack}
          className="mt-0.5 size-9 rounded-full border border-border bg-card flex items-center justify-center hover:bg-muted transition-colors shrink-0"
        >
          <ArrowLeft className="size-4" />
        </button>
        <div>
          <div className="flex items-center gap-2.5 mb-0.5">
            <h1 className="text-lg font-bold">{building.name}</h1>
            <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${st.badge}`}>
              {st.label}
            </span>
          </div>
          <p className="text-[13px] text-muted-foreground flex items-center gap-1.5">
            <MapPin className="size-3.5" /> {building.address}
          </p>
        </div>
      </div>

      {/* Main info card — thumbnail only */}
      <Card className="overflow-hidden py-0 gap-0">
        <div className="flex flex-col md:flex-row">
          <div className="md:w-64 shrink-0 bg-muted">
            <img
              src={thumb(building)}
              alt={building.name}
              className="w-full h-full min-h-44 object-cover"
              onError={(e) => { e.target.src = defaultBuildingImg; }}
            />
          </div>
          <div className="flex-1 p-5">
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              {infoItems.map(({ label, value }) => (
                <div key={label}>
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    {label}
                  </p>
                  <p className="text-sm font-medium mt-0.5">{value || "—"}</p>
                </div>
              ))}
            </div>
            {building.description && (
              <p className="text-sm text-muted-foreground mt-4 pt-4 border-t border-border leading-relaxed">
                {building.description}
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* Manager Info */}
      {building.manager && (
        <section>
          <h2 className="text-base font-bold mb-3">Người quản lý</h2>
          <div className="flex items-start gap-3 rounded-xl border border-border bg-card p-4">
            <div className="size-10 flex-shrink-0 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
              <UserIcon className="size-5 text-primary" />
            </div>
            <div className="flex flex-col gap-1">
              <span className="font-semibold text-[15px]">
                {building.manager.first_name} {building.manager.last_name}
              </span>
              <div className="flex items-center gap-4 text-xs text-muted-foreground mt-0.5">
                {building.manager.phone && (
                  <span className="flex items-center gap-1.5">
                    <Phone className="size-3.5" />
                    {building.manager.phone}
                  </span>
                )}
                {building.manager.email && (
                  <span className="flex items-center gap-1.5">
                    <Mail className="size-3.5" />
                    {building.manager.email}
                  </span>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Gallery — equal size grid */}
      {gallery.length > 0 && (
        <section>
          <h2 className="text-base font-bold mb-3">Hình ảnh ({gallery.length})</h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
            {gallery.map((src, idx) => (
              <div
                key={idx}
                className="aspect-square rounded-lg overflow-hidden bg-muted border border-border"
              >
                <img
                  src={src}
                  alt=""
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                  onError={(e) => { e.target.style.display = "none"; }}
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Facilities */}
      {building.facilities?.length > 0 && (
        <section>
          <h2 className="text-lg font-bold mb-4">Tiện ích</h2>
          <div className="flex flex-wrap gap-2">
            {building.facilities.map((f) => (
              <span
                key={f.id}
                className={`text-[13px] px-3.5 py-1.5 rounded-full border transition-colors ${f.BuildingFacility?.is_active !== false
                  ? "border-success/30 text-success bg-success/5"
                  : "border-border text-muted-foreground bg-muted/50"
                  }`}
              >
                {f.name}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Nearby universities */}
      {building.nearby_universities?.length > 0 && (
        <section>
          <h2 className="text-lg font-bold mb-4">Trường đại học lân cận</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {building.nearby_universities.map((uni) => (
              <div key={uni.id} className="flex items-start gap-3 rounded-xl border border-border p-4">
                <div className="size-9 rounded-lg bg-primary/8 flex items-center justify-center shrink-0 mt-0.5">
                  <GraduationCap className="size-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">{uni.name}</p>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <MapPin className="size-3" /> {uni.address}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

/* ── EditFacilityPicker ─────────────────────── */

function EditFacilityPicker({ selectedIds, onChange }) {
  const [allFacilities, setAllFacilities] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiJson("/api/facilities?limit=100");
        setAllFacilities(res.data || res || []);
      } catch { /* silent */ }
    })();
  }, []);

  if (allFacilities.length === 0) return null;

  const toggle = (id) => {
    onChange(selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id]);
  };

  const selected = allFacilities.filter((f) => selectedIds.includes(f.id));
  const available = allFacilities.filter((f) => !selectedIds.includes(f.id));

  return (
    <div className="space-y-3">
      <Label>Tiện ích</Label>
      {selected.length > 0 && (
        <div>
          <p className="text-[11px] text-muted-foreground mb-1.5">Đã chọn</p>
          <div className="flex flex-wrap gap-1.5">
            {selected.map((f) => (
              <button key={f.id} type="button" onClick={() => toggle(f.id)}
                className="text-xs px-2.5 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary font-medium hover:bg-primary/20 transition-colors">
                {f.name} <X className="size-3 inline ml-1 -mt-px" />
              </button>
            ))}
          </div>
        </div>
      )}
      {available.length > 0 && (
        <div>
          <p className="text-[11px] text-muted-foreground mb-1.5">Chưa chọn</p>
          <div className="flex flex-wrap gap-1.5">
            {available.map((f) => (
              <button key={f.id} type="button" onClick={() => toggle(f.id)}
                className="text-xs px-2.5 py-1 rounded-full border border-border text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors">
                {f.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── BuildingFormDialog ────────────────────── */

function BuildingFormDialog({ open, onOpenChange, initialData, onSaved, saving: externalSaving, locations }) {
  const [form, setForm] = useState({});
  const [thumbFile, setThumbFile] = useState(null);
  const [thumbPreview, setThumbPreview] = useState(null);
  const [galleryImages, setGalleryImages] = useState([]);
  const [facilityIds, setFacilityIds] = useState([]);
  const [managers, setManagers] = useState([]);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const thumbInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  /* fetch available managers and augment with current manager if needed */
  useEffect(() => {
    let cancelled = false;
    if (!open) return;
    (async () => {
      try {
        const res = await apiJson("/api/admin/users/available-managers");
        let available = res.data || [];
        // If editing a building that already has a manager, add them to the list so 
        // the select option is valid and they don't disappear from the dropdown
        if (initialData?.manager) {
          const m = initialData.manager;
          if (!available.find((x) => x.id === m.id)) {
            available = [{ id: m.id, first_name: m.first_name, last_name: m.last_name, email: m.email }, ...available];
          }
        }
        if (!cancelled) setManagers(available);
      } catch {
        /* silent */
      }
    })();
    return () => { cancelled = true; };
  }, [open, initialData]);

  /* populate form when dialog opens */
  useEffect(() => {
    if (!open || !initialData) return;
    setForm({
      name: initialData.name || "",
      location_id: initialData.location_id || "",
      manager_id: initialData.manager?.id || "",
      address: initialData.address || "",
      description: initialData.description || "",
      total_floors: initialData.total_floors ?? "",
      is_active: String(initialData.is_active ?? true),
      latitude: initialData.latitude ?? "",
      longitude: initialData.longitude ?? "",
    });
    setThumbFile(null);
    setThumbPreview(initialData.thumbnail_url || null);
    setGalleryImages(
      (initialData.images || []).map((img) => ({
        url: img.image_url || img.url || img,
        existing: true,
      }))
    );
    setFacilityIds((initialData.facilities || []).map((f) => f.id || f));
    setErrors({});
  }, [open, initialData]);

  const set = (k, v) => {
    setForm((p) => ({ ...p, [k]: v }));
    if (errors[k]) setErrors((p) => ({ ...p, [k]: undefined }));
  };

  const validate = () => {
    const e = {};
    if (!form.name?.trim()) e.name = true;
    if (!form.location_id) e.location_id = true;
    // Note: Do not strictly enforce manager_id here if it's optional for edits according to plan,
    // though the user might want it required. We will leave it optional on edit or keep existing behavior.
    if (!form.manager_id) e.manager_id = true;
    if (!form.address?.trim()) e.address = true;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);

    try {
      /* Upload new thumbnail if changed */
      let thumbnail_url = thumbPreview;
      if (thumbFile) {
        const res = await uploadFiles("building_thumbnail", [thumbFile]);
        thumbnail_url = res.data?.url || res.url || null;
      }

      /* Upload new gallery images */
      const existingUrls = galleryImages.filter((g) => g.existing).map((g) => g.url);
      const newFiles = galleryImages.filter((g) => g.file).map((g) => g.file);
      let galleryUrls = existingUrls;
      if (newFiles.length > 0) {
        const res = await uploadFiles("building_gallery", newFiles);
        const uploaded = res.data?.urls || res.urls || [];
        galleryUrls = [...existingUrls, ...uploaded];
      }

      const payload = {
        name: form.name.trim(),
        location_id: form.location_id,
        manager_id: form.manager_id || undefined,
        address: form.address.trim(),
        description: form.description?.trim() || null,
        total_floors: form.total_floors ? Number(form.total_floors) : null,
        latitude: form.latitude ? Number(form.latitude) : null,
        longitude: form.longitude ? Number(form.longitude) : null,
        is_active: form.is_active === "true",
        thumbnail_url,
        images: galleryUrls,
        facilities: facilityIds,
      };

      await apiJson(`/api/buildings/${initialData.id}`, { method: "PUT", body: payload });
      onSaved();
    } catch (err) {
      alert(err.message || "Đã xảy ra lỗi. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  };

  const addGalleryFiles = (files) => {
    const max = 5;
    const remaining = max - galleryImages.length;
    if (remaining <= 0) return;
    const newImgs = Array.from(files)
      .filter((f) => f.type.startsWith("image/"))
      .slice(0, remaining)
      .map((f) => ({ file: f, url: URL.createObjectURL(f) }));
    setGalleryImages((prev) => [...prev, ...newImgs]);
  };

  const isBusy = saving || externalSaving;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Chỉnh sửa tòa nhà</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Basic fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Tên tòa nhà *</Label>
              <Input value={form.name || ""} onChange={(e) => set("name", e.target.value)}
                className={errors.name ? "border-destructive" : ""} />
            </div>
            <div className="space-y-1.5">
              <Label>Khu vực *</Label>
              <Select value={form.location_id || ""} onValueChange={(v) => set("location_id", v)}>
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
            <Input value={form.address || ""} onChange={(e) => set("address", e.target.value)}
              className={errors.address ? "border-destructive" : ""} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5 col-span-2 md:col-span-1">
              <Label>Người quản lý *</Label>
              <Select value={form.manager_id || ""} onValueChange={(v) => set("manager_id", v)}>
                <SelectTrigger className={errors.manager_id ? "border-destructive" : ""}>
                  <SelectValue placeholder="Chọn quản lý" />
                </SelectTrigger>
                <SelectContent>
                  {managers.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.first_name} {m.last_name} ({m.email})
                    </SelectItem>
                  ))}
                  {managers.length === 0 && (
                    <div className="py-2 text-center text-xs text-muted-foreground w-full">Không có quản lý trống</div>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Số tầng</Label>
              <Input type="number" min="1" value={form.total_floors || ""}
                onChange={(e) => set("total_floors", e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Trạng thái</Label>
              <Select value={form.is_active || "true"} onValueChange={(v) => set("is_active", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Hoạt động</SelectItem>
                  <SelectItem value="false">Không hoạt động</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <MapPicker
            latitude={form.latitude}
            longitude={form.longitude}
            onChange={(lat, lng) => {
              set("latitude", lat);
              setForm((p) => ({ ...p, longitude: lng }));
            }}
          />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Vĩ độ</Label>
              <Input value={form.latitude ?? ""} readOnly placeholder="—" className="bg-muted/50" />
            </div>
            <div className="space-y-1.5">
              <Label>Kinh độ</Label>
              <Input value={form.longitude ?? ""} readOnly placeholder="—" className="bg-muted/50" />
            </div>
          </div>

          {/* Thumbnail */}
          <div className="space-y-1.5">
            <Label>Ảnh đại diện</Label>
            {thumbPreview ? (
              <div className="relative w-48 aspect-video rounded-lg overflow-hidden border border-border bg-muted group">
                <img src={thumbPreview} alt="" className="w-full h-full object-cover" />
                <button type="button"
                  onClick={() => { setThumbFile(null); setThumbPreview(null); }}
                  className="absolute top-1 right-1 size-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <X className="size-3.5" />
                </button>
              </div>
            ) : (
              <button type="button" onClick={() => thumbInputRef.current?.click()}
                className="w-48 aspect-video rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors">
                <ImagePlus className="size-5" />
                <span className="text-[11px]">Chọn ảnh</span>
              </button>
            )}
            <input ref={thumbInputRef} type="file" accept="image/*" className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) { setThumbFile(f); setThumbPreview(URL.createObjectURL(f)); }
                e.target.value = "";
              }} />
          </div>

          {/* Gallery */}
          <div className="space-y-1.5">
            <Label>Thư viện ảnh ({galleryImages.length}/5)</Label>
            <div className="flex flex-wrap gap-2">
              {galleryImages.map((img, idx) => (
                <div key={idx} className="relative group size-20 rounded-lg overflow-hidden border border-border bg-muted">
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                  <button type="button"
                    onClick={() => setGalleryImages((prev) => prev.filter((_, i) => i !== idx))}
                    className="absolute top-0.5 right-0.5 size-5 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <X className="size-3" />
                  </button>
                </div>
              ))}
              {galleryImages.length < 5 && (
                <button type="button" onClick={() => galleryInputRef.current?.click()}
                  className="size-20 rounded-lg border-2 border-dashed border-border flex items-center justify-center text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors">
                  <Plus className="size-5" />
                </button>
              )}
            </div>
            <input ref={galleryInputRef} type="file" accept="image/*" multiple className="hidden"
              onChange={(e) => { addGalleryFiles(e.target.files); e.target.value = ""; }} />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label>Mô tả</Label>
            <Textarea rows={3} value={form.description || ""}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Mô tả ngắn về tòa nhà..." />
          </div>

          {/* Facilities */}
          <EditFacilityPicker selectedIds={facilityIds} onChange={setFacilityIds} />

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
            <Button type="submit" disabled={isBusy}
              className="bg-success text-success-foreground hover:bg-success/90">
              {isBusy && <Loader2 className="size-4 animate-spin mr-1.5" />}
              Lưu thay đổi
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ── LocationSection (with per-section paging) ── */

function LocationSection({ locId, name, buildings, onView, onEdit, onDelete }) {
  const [page, setPage] = useState(0);
  const totalPages = Math.ceil(buildings.length / PER_SECTION);
  const visible = buildings.slice(page * PER_SECTION, (page + 1) * PER_SECTION);
  const showPaging = totalPages > 1;

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="size-8 rounded-lg bg-primary/8 flex items-center justify-center">
            <MapPin className="size-4 text-primary" />
          </div>
          <div>
            <h2 className="text-[15px] font-semibold leading-tight">{name}</h2>
            <p className="text-xs text-muted-foreground">{buildings.length} tòa nhà</p>
          </div>
        </div>

        {showPaging && (
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground mr-1">
              {page + 1}/{totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="size-8 rounded-lg border border-border flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="size-8 rounded-lg border border-border flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {visible.map((b) => (
          <BuildingCard
            key={b.id}
            building={b}
            onView={onView}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
    </section>
  );
}

/* ── BuildingsPage ─────────────────────────── */

export default function BuildingsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  /* data */
  const [allBuildings, setAllBuildings] = useState([]);
  const [locations, setLocations] = useState([]);
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

  /* ─ fetch locations ─ */
  useEffect(() => {
    (async () => {
      try {
        const res = await apiJson("/api/locations?limit=100&is_active=true");
        setLocations(res.data || []);
      } catch {
        /* silent */
      }
    })();
  }, []);

  /* ─ fetch all buildings ─ */
  const fetchBuildings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiJson("/api/buildings?limit=200");
      setAllBuildings(res.data || []);
    } catch {
      setError("Không thể tải dữ liệu. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchBuildings(); }, [fetchBuildings]);

  /* ─ client-side filtering ─ */
  const filtered = useMemo(() => allBuildings.filter((b) => {
    if (filterActive === "active" && !b.is_active) return false;
    if (filterActive === "inactive" && b.is_active) return false;
    if (filterLocation !== "all" && b.location_id !== filterLocation) return false;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      if (!b.name?.toLowerCase().includes(q) && !b.address?.toLowerCase().includes(q)) return false;
    }
    return true;
  }), [allBuildings, filterActive, filterLocation, search]);

  /* ─ group by location ─ */
  const locationGroups = useMemo(() => {
    const grouped = filtered.reduce((acc, b) => {
      const locName = b.location?.name || "Chưa phân khu vực";
      const locId = b.location_id || "_none";
      if (!acc[locId]) acc[locId] = { name: locName, buildings: [] };
      acc[locId].buildings.push(b);
      return acc;
    }, {});
    return Object.entries(grouped).sort(([, a], [, b]) => a.name.localeCompare(b.name, "vi"));
  }, [filtered]);

  /* ─ stats ─ */
  const totalCount = allBuildings.length;
  const activeCount = allBuildings.filter((b) => b.is_active).length;
  const inactiveCount = totalCount - activeCount;

  /* ─ CRUD handlers ─ */
  const handleDelete = async () => {
    setSaving(true);
    try {
      await apiJson(`/api/buildings/${confirmDel.id}`, { method: "DELETE" });
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
      await apiJson(`/api/buildings/${confirmToggle.id}/status`, {
        method: "PATCH",
        body: { is_active: !confirmToggle.is_active },
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
        <Button className="gap-1.5" onClick={() => navigate("/buildings/create")}>
          <Plus className="size-4" /> Thêm tòa nhà
        </Button>
      </div>

      {/* Summary */}
      <BuildingSummary total={totalCount} active={activeCount} inactive={inactiveCount} />

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

        <Select value={filterLocation} onValueChange={setFilterLocation}>
          <SelectTrigger className="w-[170px]">
            <SelectValue placeholder="Khu vực" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả khu vực</SelectItem>
            {locations.map((loc) => (
              <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

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

      {/* Building list grouped by location */}
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
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            Không tìm thấy tòa nhà nào.
          </div>
        ) : (
          <div className="space-y-10">
            {locationGroups.map(([locId, group]) => (
              <LocationSection
                key={locId}
                locId={locId}
                name={group.name}
                buildings={group.buildings}
                onView={(b) => setSelectedId(b.id)}
                onEdit={(b) => setDialog({ mode: "edit", data: b })}
                onDelete={setConfirmDel}
              />
            ))}
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      {dialog && (
        <BuildingFormDialog
          open={!!dialog}
          onOpenChange={(v) => !v && setDialog(null)}
          initialData={dialog.data}
          onSaved={() => { setDialog(null); fetchBuildings(); }}
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
