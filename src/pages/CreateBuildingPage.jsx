import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Upload, X, FloppyDisk, CircleNotch,
  MapPin, Stack as Layers, Image as ImageIcon,
  Plus, CheckCircle, Copy, Check, Envelope, Phone
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { apiJson, apiRequest } from "@/lib/apiClient";
import { cn } from "@/lib/utils";
import MapPicker from "@/components/MapPicker";

/* ── upload helper ─────────────────────────── */

const translateError = (msg) => {
  if (!msg) return null;
  const m = String(msg).toLowerCase();
  if (m.includes("email already exists")) return "Email này đã được đăng ký trong hệ thống.";
  if (m.includes("phone must be")) return "Số điện thoại không hợp lệ (9-15 số).";
  if (m.includes("already exists")) {
    if (m.includes("location")) return "Khu vực này đã tồn tại.";
    return "Thông tin này đã tồn tại trong hệ thống.";
  }
  if (m.includes("required")) return "Vui lòng điền đầy đủ các thông tin bắt buộc.";
  if (m.includes("not found")) return "Không tìm thấy dữ liệu yêu cầu.";
  if (m.includes("failed to fetch") || m.includes("network error")) return "Lỗi mạng, vui lòng kiểm tra kết nối.";
  return msg;
};

async function compressImage(file, { maxWidth = 1200, maxHeight = 1200, quality = 0.8 } = {}) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob((blob) => {
          if (!blob) return reject(new Error("Canvas toBlob failed"));
          const compressedFile = new File([blob], file.name, {
            type: "image/jpeg",
            lastModified: Date.now(),
          });
          resolve(compressedFile);
        }, "image/jpeg", quality);
      };
      img.onerror = () => reject(new Error("Image load failed"));
    };
    reader.onerror = () => reject(new Error("FileReader failed"));
  });
}

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

/* ── QuickCreateManagerDialog ──────────────── */

function QuickCreateManagerDialog({ open, onOpenChange, onSaved }) {
  const [form, setForm] = useState({ first_name: "", last_name: "", email: "", phone: "", role: "BUILDING_MANAGER" });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm({ first_name: "", last_name: "", email: "", phone: "", role: "BUILDING_MANAGER" });
    setErrors({});
    setResult(null);
    setGlobalError(null);
  }, [open]);

  const [globalError, setGlobalError] = useState(null);

  const validate = () => {
    const e = {};
    if (!form.first_name?.trim()) e.first_name = true;
    if (!form.last_name?.trim()) e.last_name = true;
    if (!form.email?.trim()) e.email = true;
    if (!form.phone?.trim()) e.phone = true;
    setErrors(e);
    if (Object.keys(e).length > 0) {
      setGlobalError("Vui lòng điền đầy đủ các thông tin bắt buộc (*)");
    }
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    setGlobalError(null);
    if (!validate()) return;
    setSaving(true);
    try {
      const res = await apiJson("/api/users", {
        method: "POST",
        body: {
          ...form,
          first_name: form.first_name.trim(),
          last_name: form.last_name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
        },
      });
      setResult(res.data ?? res);
    } catch (err) {
      setGlobalError(translateError(err.message) || "Đã xảy ra lỗi khi tạo tài khoản.");
    } finally {
      setSaving(false);
    }
  };

  if (result) {
    return (
      <Dialog open={open} onOpenChange={(v) => { if(!v) onSaved(result); }}>
        <DialogContent className="max-w-sm text-center">
          <div className="flex flex-col items-center gap-4 py-2">
            <div className="size-14 rounded-full bg-primary/10 flex items-center justify-center">
              <CheckCircle className="size-7 text-primary" />
            </div>
            <div>
              <p className="text-lg font-semibold">Tài khoản đã tạo xong</p>
              <p className="text-xs text-muted-foreground mt-1">{result.email}</p>
            </div>
            <div className="w-full rounded-xl border border-border bg-muted/30 p-4 space-y-2">
              <p className="text-[11px] text-muted-foreground">Mật khẩu của quản lý mới:</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded-lg bg-background border px-3 py-1.5 text-sm font-mono font-bold tracking-wider">
                  {result.generated_password}
                </code>
                <Button size="icon" variant="outline" className="size-8" onClick={() => {
                  navigator.clipboard.writeText(result.generated_password);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}>
                  {copied ? <Check className="size-3.5 text-primary" /> : <Copy className="size-3.5" />}
                </Button>
              </div>
            </div>
            <Button className="w-full" onClick={() => onSaved(result)}>Tiếp tục tạo tòa nhà</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Thêm quản lý mới</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className={errors.first_name ? "text-destructive" : ""}>Họ *</Label>
              <Input value={form.first_name} onChange={(e) => setForm(p => ({...p, first_name: e.target.value}))} className={errors.first_name ? "border-destructive" : ""} />
            </div>
            <div className="space-y-1.5">
              <Label className={errors.last_name ? "text-destructive" : ""}>Tên *</Label>
              <Input value={form.last_name} onChange={(e) => setForm(p => ({...p, last_name: e.target.value}))} className={errors.last_name ? "border-destructive" : ""} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Email *</Label>
            <Input type="email" value={form.email} onChange={(e) => setForm(p => ({...p, email: e.target.value}))} className={errors.email ? "border-destructive" : ""} />
          </div>
          <div className="space-y-1.5">
            <Label className={errors.phone ? "text-destructive" : ""}>Số điện thoại *</Label>
            <Input value={form.phone} onChange={(e) => setForm(p => ({...p, phone: e.target.value}))} className={errors.phone ? "border-destructive" : ""} />
          </div>

          {globalError && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium">
              {globalError}
            </div>
          )}

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
            <Button type="submit" disabled={saving}>
              {saving ? <CircleNotch className="size-4 animate-spin mr-1.5" /> : <Plus className="size-4 mr-1.5" />}
              Tạo quản lý
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ── QuickCreateLocationDialog ─────────────── */

function QuickCreateLocationDialog({ open, onOpenChange, onSaved }) {
  const [name, setName] = useState("");
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName("");
    setError(null);
  }, [open]);

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!name.trim()) {
      setError("Vui lòng nhập tên khu vực");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await apiJson("/api/locations", {
        method: "POST",
        body: { name: name.trim(), is_active: true },
      });
      onSaved(res.data ?? res);
    } catch (err) {
      setError(translateError(err.message) || "Đã xảy ra lỗi khi tạo khu vực.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>Thêm khu vực mới</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label>Tên khu vực *</Label>
            <Input 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              placeholder="VD: TP. Thủ Đức"
              className={error ? "border-destructive" : ""} 
            />
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium">
              {error}
            </div>
          )}

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
            <Button type="submit" disabled={saving}>
              {saving ? <CircleNotch className="size-4 animate-spin mr-1.5" /> : <Plus className="size-4 mr-1.5" />}
              Tạo khu vực
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ── CreateBuildingPage ────────────────────── */

export default function CreateBuildingPage() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [savingStep, setSavingStep] = useState(""); // compressing, uploading, creating

  const [locations, setLocations] = useState([]);
  const [managers, setManagers] = useState([]);
  const [showCreateManager, setShowCreateManager] = useState(false);
  const [showCreateLocation, setShowCreateLocation] = useState(false);
  const [globalError, setGlobalError] = useState(null);

  const [form, setForm] = useState({
    name: "",
    location_id: "",
    manager_id: "",
    address: "",
    latitude: "",
    longitude: "",
    total_floors: "",
    is_active: "true",
    description: "",
    facilities: [],
  });

  /* thumbnail state */
  const [thumbFile, setThumbFile] = useState(null);
  const [thumbPreview, setThumbPreview] = useState(null);

  /* gallery state */
  const [galleryImages, setGalleryImages] = useState([]);

  const [errors, setErrors] = useState({});
  const [geoStatus, setGeoStatus] = useState("idle"); // idle | loading | error | success

  const fetchLocations = async () => {
    try {
      const res = await apiJson("/api/locations?limit=100&is_active=true");
      setLocations(res.data || []);
    } catch { /* silent */ }
  };

  const fetchManagers = async () => {
    try {
      const res = await apiJson("/api/users/available-managers");
      setManagers(res.data || []);
    } catch { /* silent */ }
  };

  useEffect(() => {
    fetchLocations();
    fetchManagers();
  }, []);

  const set = (k, v) => {
    setForm((p) => ({ ...p, [k]: v }));
    if (errors[k]) setErrors((p) => ({ ...p, [k]: undefined }));
    if (k === "address") setErrors((p) => ({ ...p, addressInvalid: undefined }));
  };

  const geocodeTimeoutRef = useRef(null);

  const handleGeocode = (address, immediate = false) => {
    if (geocodeTimeoutRef.current) clearTimeout(geocodeTimeoutRef.current);
    if (!address?.trim()) {
      setGeoStatus("idle");
      setForm(p => ({ ...p, latitude: "", longitude: "" }));
      return;
    }

    const perform = async () => {
      setGeoStatus("loading");
      const clean = (str) => str
        .replace(/,?\s*Việt Nam$/i, "")
        .replace(/\b(Phường|Quận|Thành phố|Tp\.?|Tỉnh|Huyện|Xã)\b/gi, "")
        .replace(/\s*,\s*/g, ", ")
        .replace(/\s+/g, " ")
        .trim();

      const fetchLoc = async (q) => {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=1&countrycodes=vn&accept-language=vi`;
        const res = await fetch(url);
        return res.json();
      };

      try {
        let query = clean(address);
        let data = await fetchLoc(query);

        if (data.length === 0 && query.includes(",")) {
          const parts = query.split(",");
          if (parts.length > 2) {
            const simplified = `${parts[0]}, ${parts[parts.length - 1]}`;
            data = await fetchLoc(simplified);
          }
        }

        if (data.length > 0) {
          const { lat, lon } = data[0];
          setForm(p => ({
            ...p,
            latitude: parseFloat(lat),
            longitude: parseFloat(lon)
          }));
          setGeoStatus("success");
          setErrors(p => ({ ...p, address: undefined, addressInvalid: undefined }));
        } else {
          setGeoStatus("error");
          setForm(p => ({ ...p, latitude: "", longitude: "" }));
        }
      } catch (err) {
        setGeoStatus("error");
      }
    };

    if (immediate) {
      perform();
    } else {
      geocodeTimeoutRef.current = setTimeout(perform, 1000);
    }
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Tên tòa nhà là bắt buộc";
    if (!form.location_id) e.location_id = "Vui lòng chọn khu vực";
    if (!form.manager_id) e.manager_id = "Vui lòng chọn quản lý";
    if (!form.address.trim()) e.address = "Địa chỉ là bắt buộc";
    if (geoStatus === "error" || !form.latitude) e.addressInvalid = "Địa chỉ không phù hợp";
    const floors = Number(form.total_floors);
    if (!form.total_floors) e.total_floors = "Số tầng là bắt buộc";
    else if (isNaN(floors) || floors < 1 || floors > 80) e.total_floors = "Số tầng phải từ 1 đến 80";
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
    // 0. Manual validation for scrolling
    const e = {};
    if (!form.name.trim()) e.name = "Tên tòa nhà là bắt buộc";
    if (!form.location_id) e.location_id = "Vui lòng chọn khu vực";
    if (!form.manager_id) e.manager_id = "Vui lòng chọn quản lý";
    if (!form.address.trim()) e.address = "Địa chỉ là bắt buộc";
    if (geoStatus === "error" || !form.latitude) e.addressInvalid = "Địa chỉ không phù hợp";
    const floorsNum = Number(form.total_floors);
    if (!form.total_floors) e.total_floors = "Số tầng là bắt buộc";
    else if (isNaN(floorsNum) || floorsNum < 1 || floorsNum > 80) e.total_floors = "Số tầng phải từ 1 đến 80";

    if (Object.keys(e).length > 0) {
      setErrors(e);
      const firstError = Object.keys(e)[0];
      const el = document.getElementById(firstError);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        // Focusing the element if it's an input
        const input = el.tagName === "INPUT" ? el : el.querySelector("input, button");
        if (input) input.focus();
      }
      return;
    }

    setSaving(true);
    setSavingStep("compressing");

    try {
      /* 1 & 2. Compress and Upload images in parallel */
      const galleryFiles = galleryImages.filter((g) => g.file).map((g) => g.file);
      
      console.log("[CreateBuilding] Optimizing images...");
      
      const compressTasks = [
        thumbFile ? compressImage(thumbFile) : Promise.resolve(null),
        ...galleryFiles.map(f => compressImage(f))
      ];
      
      const compressedFiles = await Promise.all(compressTasks);
      const readyThumb = compressedFiles[0];
      const readyGallery = compressedFiles.slice(1);

      setSavingStep("uploading");
      console.log("[CreateBuilding] Starting parallel uploads...");
      const [thumbRes, galleryRes] = await Promise.all([
        readyThumb ? uploadFiles("building_thumbnail", [readyThumb]) : Promise.resolve({ urls: [] }),
        readyGallery.length > 0 ? uploadFiles("building_gallery", readyGallery) : Promise.resolve({ urls: [] })
      ]);

      const thumbnail_url = thumbRes.urls?.[0] || null;
      const images = galleryRes.urls || [];
      
      setSavingStep("creating");
      console.log("[CreateBuilding] Uploads completed. Creating building record...");

      /* 3. Create building */
      const payload = {
        name: form.name.trim(),
        location_id: form.location_id,
        manager_id: form.manager_id,
        address: form.address.trim(),
        description: form.description.trim() || null,
        total_floors: form.total_floors ? Number(form.total_floors) : null,
        latitude: form.latitude ? Number(form.latitude) : null,
        longitude: form.longitude ? Number(form.longitude) : null,
        is_active: form.is_active === "true",
        thumbnail_url,
        images,
        facilities: form.facilities.length > 0 ? form.facilities : undefined,
      };

      console.log("[CreateBuilding] Final payload:", JSON.stringify(payload, null, 2));

      await apiJson("/api/buildings", { method: "POST", body: payload });
      navigate("/buildings");
    } catch (err) {
      setGlobalError(translateError(err.message) || "Đã xảy ra lỗi khi tạo tòa nhà.");
      window.scrollTo({ top: 0, behavior: "smooth" });
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

      {globalError && (
        <div className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <X className="size-4" />
          {globalError}
        </div>
      )}

      <div className="space-y-6">
        {/* ─ Thông tin cơ bản ─ */}
        <section className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Thông tin cơ bản</h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className={errors.name ? "text-destructive" : ""}>Tên tòa nhà *</Label>
              <Input
                id="name"
                placeholder="VD: FScape Cầu Giấy"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                className={errors.name ? "border-destructive" : ""}
              />
              {errors.name && <p className="text-[11px] text-destructive">{errors.name}</p>}
            </div>
            <div className="space-y-1.5">
              <Label className={errors.location_id ? "text-destructive" : ""}>Khu vực *</Label>
              <Select
                value={form.location_id}
                onValueChange={(v) => {
                  if (v === "QUICK_ADD_LOC") {
                    setShowCreateLocation(true);
                  } else {
                    set("location_id", v);
                  }
                }}
              >
                <SelectTrigger id="location_id" className={errors.location_id ? "border-destructive" : ""}>
                  <SelectValue placeholder="Chọn khu vực" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((loc) => (
                    <SelectItem key={loc.id} value={String(loc.id)}>{loc.name}</SelectItem>
                  ))}
                  <div className="h-px bg-border my-1" />
                  <SelectItem
                    value="QUICK_ADD_LOC"
                    className="focus:bg-primary/10 focus:text-primary font-bold text-primary cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                       <Plus className="size-3.5" weight="bold" />
                       TẠO KHU VỰC MỚI
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              {errors.location_id && <p className="text-[11px] text-destructive">{errors.location_id}</p>}
            </div>
            <div className="space-y-1.5 col-span-2 md:col-span-1">
              <Label className={errors.manager_id ? "text-destructive" : ""}>Người quản lý *</Label>
              <Select
                value={form.manager_id}
                onValueChange={(v) => {
                  if (v === "QUICK_ADD") {
                    setShowCreateManager(true);
                  } else {
                    set("manager_id", v);
                  }
                }}
              >
                <SelectTrigger id="manager_id" className={errors.manager_id ? "border-destructive" : ""}>
                  <SelectValue placeholder="Chọn quản lý tòa nhà" />
                </SelectTrigger>
                <SelectContent>
                  {managers.map((m) => (
                    <SelectItem key={m.id} value={String(m.id)}>
                      {m.first_name} {m.last_name} ({m.email})
                    </SelectItem>
                  ))}
                  {managers.length === 0 && (
                    <div className="py-2 px-2 text-center italic text-[11px] text-muted-foreground">
                      Không còn quản lý nào trống
                    </div>
                  )}
                  <div className="h-px bg-border my-1" />
                  <SelectItem
                    value="QUICK_ADD"
                    className="focus:bg-primary/10 focus:text-primary font-bold text-primary cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                       <Plus className="size-3.5" weight="bold" />
                       TẠO QUẢN LÝ MỚI
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              {errors.manager_id && <p className="text-[11px] text-destructive">{errors.manager_id}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className={(errors.address || errors.addressInvalid) ? "text-destructive" : ""}>
              Địa chỉ * {geoStatus === "loading" && <CircleNotch className="inline size-3 animate-spin ml-1 text-primary" />}
            </Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                id="address"
                placeholder="VD: 144 Xuân Thủy, Cầu Giấy... (Nhấn Enter để định vị)"
                value={form.address}
                onChange={(e) => {
                  const val = e.target.value;
                  set("address", val);
                  if (val.trim().length > 2) {
                    handleGeocode(val);
                  } else {
                    setGeoStatus("idle");
                    setForm(p => ({ ...p, latitude: "", longitude: "" }));
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleGeocode(form.address, true);
                  }
                }}
                className={cn(
                  "pl-9", 
                  (errors.address || geoStatus === "error" || errors.addressInvalid) && "border-destructive",
                  geoStatus === "success" && "border-success/50"
                )}
              />
            </div>
            {errors.address && <p className="text-[11px] text-destructive">{errors.address}</p>}
            {geoStatus === "error" && !errors.address && (
              <p className="text-[11px] text-destructive font-medium">Địa chỉ không phù hợp hoặc không tìm thấy trên bản đồ</p>
            )}
            {geoStatus === "success" && (
              <p className="text-[11px] text-success font-medium">Đã tìm thấy vị trí trên bản đồ</p>
            )}
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
              <Label className={errors.total_floors ? "text-destructive" : ""}>Số tầng *</Label>
              <div className="relative">
                <Layers className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  id="total_floors"
                  type="number" 
                  min="1" 
                  max="80"
                  placeholder="VD: 8"
                  value={form.total_floors}
                  onChange={(e) => set("total_floors", e.target.value)}
                  className={cn("pl-9", errors.total_floors && "border-destructive")}
                />
              </div>
              {errors.total_floors && <p className="text-[11px] text-destructive">{errors.total_floors}</p>}
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

          <div className="space-y-1.5">
            <Label>Trạng thái</Label>
            <Select value={form.is_active} onValueChange={(v) => set("is_active", v)}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Hoạt động</SelectItem>
                <SelectItem value="false">Tạm ngưng</SelectItem>
              </SelectContent>
            </Select>
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

        {/* ─ Actions ─ */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button variant="outline" onClick={() => navigate("/buildings")} disabled={saving}>
            Hủy
          </Button>
          <Button onClick={handleSave} disabled={saving} className="gap-2 min-w-[140px]">
            {saving ? (
              <>
                <CircleNotch className="size-4 animate-spin" />
                {savingStep === "compressing" ? "Đang xử lý ảnh..." : 
                 savingStep === "uploading" ? "Đang tải ảnh lên..." : 
                 "Đang lưu..."}
              </>
            ) : (
              <>
                <FloppyDisk className="size-4" />
                Lưu tòa nhà
              </>
            )}
          </Button>
        </div>
      </div>

      <QuickCreateManagerDialog
        open={showCreateManager}
        onOpenChange={setShowCreateManager}
        onSaved={async (newManager) => {
          setShowCreateManager(false);
          await fetchManagers();
          set("manager_id", String(newManager.id));
        }}
      />

      <QuickCreateLocationDialog
        open={showCreateLocation}
        onOpenChange={setShowCreateLocation}
        onSaved={async (newLoc) => {
          setShowCreateLocation(false);
          await fetchLocations();
          set("location_id", String(newLoc.id));
        }}
      />
    </div>
  );
}
