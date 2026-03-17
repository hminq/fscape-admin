import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Upload, X, Plus, CircleNotch,
  MapPin, Stack as Layers, Image as ImageIcon,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { apiJson, apiRequest } from "@/lib/apiClient";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import MapPicker from "@/components/MapPicker";

/* ── upload helper ─────────────────────────── */

async function uploadFiles(category, files) {
  const fd = new FormData();
  for (const f of files) fd.append("files", f);

  const res = await apiRequest(`/api/upload?type=${category}`, { method: "POST", body: fd });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Upload thất bại");
  }
  return res.json();
}

/* ── ThumbnailUploader ─────────────────────── */

function ThumbnailUploader({ file, preview, onSelect, onRemove }) {
  const inputRef = useRef(null);

  return (
    <div className="space-y-1.5">
      <Label>Ảnh đại diện</Label>
      {preview ? (
        <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-border bg-muted group">
          <img src={preview} alt="Thumbnail" className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={onRemove}
            className="absolute top-2 right-2 size-7 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X className="size-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-full aspect-video rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
        >
          <ImageIcon className="size-8" />
          <span className="text-xs font-medium">Chọn ảnh đại diện</span>
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f && f.type.startsWith("image/")) onSelect(f);
          e.target.value = "";
        }}
      />
      <p className="text-[11px] text-muted-foreground">JPG, PNG. Tối đa 5MB.</p>
    </div>
  );
}

/* ── GalleryUploader ───────────────────────── */

function GalleryUploader({ images, onChange }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const max = 5;

  const addFiles = (files) => {
    const remaining = max - images.length;
    if (remaining <= 0) return;
    const newImgs = Array.from(files)
      .filter((f) => f.type.startsWith("image/"))
      .slice(0, remaining)
      .map((f) => ({ file: f, url: URL.createObjectURL(f), name: f.name }));
    onChange([...images, ...newImgs]);
  };

  const removeImg = (idx) => onChange(images.filter((_, i) => i !== idx));

  return (
    <div className="space-y-1.5">
      <Label>Thư viện ảnh ({images.length}/{max})</Label>

      {images.length < max && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files); }}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "flex items-center justify-center gap-3 h-24 rounded-xl border-2 border-dashed cursor-pointer transition-colors",
            dragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/40",
          )}
        >
          <Upload className="size-5 text-muted-foreground" />
          <div className="text-center">
            <p className="text-xs font-medium">Kéo thả hoặc <span className="text-primary">chọn ảnh</span></p>
            <p className="text-[11px] text-muted-foreground">Tối đa {max} ảnh</p>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }}
          />
        </div>
      )}

      {images.length > 0 && (
        <div className="grid grid-cols-5 gap-2 pt-1">
          {images.map((img, idx) => (
            <div key={idx} className="relative group aspect-square rounded-lg overflow-hidden border border-border bg-muted">
              <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removeImg(idx)}
                className="absolute top-1 right-1 size-5 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="size-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── FacilityPicker ────────────────────────── */

function FacilityPicker({ selected, onChange }) {
  const [facilities, setFacilities] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiJson("/api/facilities?limit=100");
        setFacilities(res.data || res || []);
      } catch {
        /* silent */
      }
    })();
  }, []);

  if (facilities.length === 0) return null;

  const toggle = (id) => {
    onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);
  };

  return (
    <div className="space-y-1.5">
      <Label>Tiện ích</Label>
      <div className="flex flex-wrap gap-2">
        {facilities.map((f) => {
          const active = selected.includes(f.id);
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => toggle(f.id)}
              className={cn(
                "text-xs px-3 py-1.5 rounded-full border transition-colors",
                active
                  ? "border-primary bg-primary/10 text-primary font-medium"
                  : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground",
              )}
            >
              {f.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ── CreateBuildingPage ────────────────────── */

export default function CreateBuildingPage() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [locations, setLocations] = useState([]);
  const [managers, setManagers] = useState([]);

  const [form, setForm] = useState({
    name: "",
    location_id: "",
    manager_id: "",
    address: "",
    latitude: "",
    longitude: "",
    total_floors: "",
    description: "",
    facilities: [],
  });

  /* thumbnail state */
  const [thumbFile, setThumbFile] = useState(null);
  const [thumbPreview, setThumbPreview] = useState(null);

  /* gallery state */
  const [galleryImages, setGalleryImages] = useState([]);

  const [errors, setErrors] = useState({});

  useEffect(() => {
    (async () => {
      const [locResult, mngResult] = await Promise.allSettled([
        apiJson("/api/locations?limit=100&is_active=true"),
        apiJson("/api/users/available-managers"),
      ]);
      if (locResult.status === "fulfilled") setLocations(locResult.value.data || []);
      if (mngResult.status === "fulfilled") setManagers(mngResult.value.data || []);
    })();
  }, []);

  const set = (k, v) => {
    setForm((p) => ({ ...p, [k]: v }));
    if (errors[k]) setErrors((p) => ({ ...p, [k]: undefined }));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Tên tòa nhà là bắt buộc";
    if (!form.location_id) e.location_id = "Vui lòng chọn khu vực";
    if (!form.manager_id) e.manager_id = "Vui lòng chọn quản lý";
    if (!form.address.trim()) e.address = "Địa chỉ là bắt buộc";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSelectThumb = (file) => {
    setThumbFile(file);
    setThumbPreview(URL.createObjectURL(file));
  };

  const handleRemoveThumb = () => {
    setThumbFile(null);
    setThumbPreview(null);
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);

    try {
      /* 1. Upload thumbnail */
      let thumbnail_url = null;
      if (thumbFile) {
        console.log("[CreateBuilding] Uploading thumbnail...", thumbFile.name);
        const res = await uploadFiles("building_thumbnail", [thumbFile]);
        console.log("[CreateBuilding] Thumbnail upload response:", res);
        thumbnail_url = res.data?.url || res.url || null;
      } else {
        console.log("[CreateBuilding] No thumbnail file selected");
      }

      /* 2. Upload gallery */
      let images = [];
      const galleryFiles = galleryImages.filter((g) => g.file).map((g) => g.file);
      if (galleryFiles.length > 0) {
        console.log("[CreateBuilding] Uploading gallery...", galleryFiles.length, "files");
        const res = await uploadFiles("building_gallery", galleryFiles);
        console.log("[CreateBuilding] Gallery upload response:", res);
        images = res.data?.urls || res.urls || [];
      } else {
        console.log("[CreateBuilding] No gallery files selected");
      }

      /* 3. Create building */
      const payload = {
        name: form.name.trim(),
        location_id: form.location_id,
        manager_id: form.manager_id,
        address: form.address.trim(),
        description: form.description.trim() || undefined,
        total_floors: form.total_floors ? Number(form.total_floors) : undefined,
        latitude: form.latitude ? Number(form.latitude) : undefined,
        longitude: form.longitude ? Number(form.longitude) : undefined,
        is_active: true,
        thumbnail_url: thumbnail_url || undefined,
        images: images.length > 0 ? images : undefined,
        facilities: form.facilities.length > 0 ? form.facilities : undefined,
      };

      console.log("[CreateBuilding] Final payload:", JSON.stringify(payload, null, 2));

      await apiJson("/api/buildings", { method: "POST", body: payload });
      navigate("/buildings");
    } catch (err) {
      toast.error(err.message || "Đã xảy ra lỗi khi tạo tòa nhà.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto pb-12 pt-2">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Thêm tòa nhà mới</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Điền thông tin để khởi tạo tòa nhà FScape mới.</p>
      </div>

      <div className="space-y-6">
        {/* ─ Thông tin cơ bản ─ */}
        <section className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Thông tin cơ bản</h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className={errors.name ? "text-destructive" : ""}>Tên tòa nhà *</Label>
              <Input
                placeholder="VD: FScape Cầu Giấy"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                className={errors.name ? "border-destructive" : ""}
              />
              {errors.name && <p className="text-[11px] text-destructive">{errors.name}</p>}
            </div>
            <div className="space-y-1.5">
              <Label className={errors.location_id ? "text-destructive" : ""}>Khu vực *</Label>
              <Select value={form.location_id} onValueChange={(v) => set("location_id", v)}>
                <SelectTrigger className={errors.location_id ? "border-destructive" : ""}>
                  <SelectValue placeholder="Chọn khu vực" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((loc) => (
                    <SelectItem key={loc.id} value={String(loc.id)}>{loc.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.location_id && <p className="text-[11px] text-destructive">{errors.location_id}</p>}
            </div>
            <div className="space-y-1.5 col-span-2 md:col-span-1">
              <Label className={errors.manager_id ? "text-destructive" : ""}>Người quản lý *</Label>
              <Select value={form.manager_id} onValueChange={(v) => set("manager_id", v)}>
                <SelectTrigger className={errors.manager_id ? "border-destructive" : ""}>
                  <SelectValue placeholder="Chọn quản lý tòa nhà" />
                </SelectTrigger>
                <SelectContent>
                  {managers.map((m) => (
                    <SelectItem key={m.id} value={String(m.id)}>
                      {m.first_name} {m.last_name} ({m.email})
                    </SelectItem>
                  ))}
                  {managers.length === 0 && (
                    <div className="py-2 text-center text-xs text-muted-foreground w-full">Không có quản lý trống</div>
                  )}
                </SelectContent>
              </Select>
              {errors.manager_id && <p className="text-[11px] text-destructive">{errors.manager_id}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className={errors.address ? "text-destructive" : ""}>Địa chỉ *</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="VD: 144 Xuân Thủy, Cầu Giấy, Hà Nội"
                value={form.address}
                onChange={(e) => set("address", e.target.value)}
                className={cn("pl-9", errors.address && "border-destructive")}
              />
            </div>
            {errors.address && <p className="text-[11px] text-destructive">{errors.address}</p>}
          </div>

          <MapPicker
            latitude={form.latitude}
            longitude={form.longitude}
            onChange={(lat, lng) => {
              set("latitude", lat);
              setForm((p) => ({ ...p, longitude: lng }));
            }}
          />

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>Số tầng</Label>
              <div className="relative">
                <Layers className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  type="number" min="1" placeholder="VD: 8"
                  value={form.total_floors}
                  onChange={(e) => set("total_floors", e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Vĩ độ</Label>
              <Input value={form.latitude ?? ""} readOnly placeholder="—" className="bg-muted/50" />
            </div>
            <div className="space-y-1.5">
              <Label>Kinh độ</Label>
              <Input value={form.longitude ?? ""} readOnly placeholder="—" className="bg-muted/50" />
            </div>
          </div>

        </section>

        {/* ─ Mô tả ─ */}
        <section className="rounded-xl border border-border bg-card p-5 space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Mô tả</h2>
          <Textarea
            placeholder="Giới thiệu về tòa nhà, tiện ích nổi bật, quy định chung..."
            rows={4}
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            className="resize-none"
          />
        </section>

        {/* ─ Hình ảnh ─ */}
        <section className="rounded-xl border border-border bg-card p-5 space-y-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Hình ảnh</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ThumbnailUploader
              file={thumbFile}
              preview={thumbPreview}
              onSelect={handleSelectThumb}
              onRemove={handleRemoveThumb}
            />
            <GalleryUploader
              images={galleryImages}
              onChange={setGalleryImages}
            />
          </div>
        </section>

        {/* ─ Tiện ích ─ */}
        <section className="rounded-xl border border-border bg-card p-5">
          <FacilityPicker
            selected={form.facilities}
            onChange={(v) => set("facilities", v)}
          />
        </section>

      </div>

      {/* Sticky Action Bar */}
      <div className="fixed bottom-0 right-0 left-56 bg-background/95 backdrop-blur-md border-t border-border p-4 flex items-center justify-end gap-3 z-50 px-8">
        <Button variant="outline" onClick={() => navigate("/buildings")} disabled={saving} className="bg-background">Hủy</Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <CircleNotch className="size-4 animate-spin mr-1.5" /> : <Plus className="size-4 mr-1.5" />}
          Tạo tòa nhà
        </Button>
      </div>
    </div>
  );
}
