import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus, MagnifyingGlass, PencilSimple, Trash, MapPin, Eye,
  Buildings, ArrowLeft, Layers, CircleNotch,
  ImagePlus, X, CaretLeft, CaretRight,
  GraduationCap, User as UserIcon, Phone, Envelope,
  ToggleLeft, ToggleRight, FloppyDisk, Users
} from "@phosphor-icons/react";
import { Card } from "@/components/ui/card";
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
import { api, apiJson, apiRequest } from "@/lib/apiClient";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import MapPicker from "@/components/MapPicker";
import defaultBuildingImg from "@/assets/default_building_img.jpg";
import defaultUserImg from "@/assets/default_user_img.jpg";
import StatusBar from "@/components/StatusBar";

/* ── helpers ───────────────────────────────── */

const thumb = (b) => b.thumbnail_url || defaultBuildingImg;

const PER_SECTION = 6;

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

/* ── Location Donut ─────────────────────────── */

const CHART_COLORS = [
  { stroke: "stroke-chart-1", dot: "bg-chart-1" },
  { stroke: "stroke-chart-2", dot: "bg-chart-2" },
  { stroke: "stroke-chart-3", dot: "bg-chart-3" },
  { stroke: "stroke-chart-4", dot: "bg-chart-4" },
  { stroke: "stroke-chart-5", dot: "bg-chart-5" },
];

function LocationDonut({ locationCounts, size = 76 }) {
  const entries = locationCounts.filter((l) => l.count > 0);
  const total = entries.reduce((s, l) => s + l.count, 0);
  const r = 36;
  const circ = 2 * Math.PI * r;

  let acc = 0;
  const segs = entries.map((e, i) => {
    const color = CHART_COLORS[i % CHART_COLORS.length];
    const len = total > 0 ? (e.count / total) * circ : 0;
    const seg = { ...e, ...color, len, offset: circ - acc };
    acc += len;
    return seg;
  });

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" className="size-full -rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" strokeWidth="10" className="stroke-muted" />
        {segs.map((s) => (
          <circle key={s.name} cx="50" cy="50" r={r} fill="none" strokeWidth="10"
            strokeDasharray={`${s.len} ${circ - s.len}`}
            strokeDashoffset={s.offset}
            className={`${s.stroke} transition-all duration-500`} />
        ))}
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-bold leading-none">{total}</span>
      </div>
    </div>
  );
}

/* ── BuildingSummary ───────────────────────── */

function BuildingSummary({ active, inactive, locationCounts, filterActive }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center gap-8 flex-wrap">
        {/* Left — location donut + legend */}
        <div className="flex items-center gap-5">
          <LocationDonut locationCounts={locationCounts} size={76} />
          <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
            {locationCounts.map((l, i) => (
              <div key={l.name} className="flex items-center gap-2">
                <span className={`size-2 rounded-full ${CHART_COLORS[i % CHART_COLORS.length].dot} shrink-0`} />
                <span className="text-xs text-muted-foreground whitespace-nowrap">{l.name}</span>
                <span className="text-xs font-semibold">{l.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="w-px h-12 bg-border shrink-0" />

        <StatusBar active={active} inactive={inactive} filter={filterActive} label="tòa nhà" />
      </div>
    </div>
  );
}

/* ── BuildingCard ──────────────────────────── */

function BuildingCard({ building, onView, onToggle, onStaff }) {
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
          <span className="flex items-center gap-1.5 shrink-0">
            <span className={`size-2 rounded-full ${building.is_active ? "bg-success" : "bg-muted-foreground/30"}`} />
            <span className={`text-[11px] font-medium ${building.is_active ? "text-success" : "text-muted-foreground"}`}>
              {building.is_active ? "Hoạt động" : "Vô hiệu hóa"}
            </span>
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
          <Button size="sm" variant="outline" className="flex-1 gap-1.5 h-9" onClick={() => onStaff(building)}>
            <Users className="size-3.5" /> Nhân sự
          </Button>
          <Button
            size="icon" variant="ghost" className="size-9"
            title={building.is_active ? "Vô hiệu hóa" : "Kích hoạt"}
            onClick={() => onToggle(building)}
          >
            {building.is_active
              ? <ToggleRight className="size-5 text-success" />
              : <ToggleLeft className="size-5 text-muted-foreground" />}
          </Button>
        </div>
      </div>
    </Card>
  );
}

/* ── BuildingDetail ────────────────────────── */

function BuildingDetail({ buildingId, onBack, locations, onDeleteSuccess, onUpdateSuccess }) {
  const [building, setBuilding] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({});
  const [thumbFile, setThumbFile] = useState(null);
  const [thumbPreview, setThumbPreview] = useState(null);
  const [galleryImages, setGalleryImages] = useState([]);
  const [facilityIds, setFacilityIds] = useState([]);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const thumbInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  // Staff view state (read-only)
  const [staffList, setStaffList] = useState([]);
  const [staffLoading, setStaffLoading] = useState(false);

  const fetchBuilding = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiJson(`/api/buildings/${buildingId}`);
      setBuilding(res.data || res);
    } catch {
      setError("Không thể tải thông tin tòa nhà.");
    } finally {
      setLoading(false);
    }
  }, [buildingId]);

  useEffect(() => {
    fetchBuilding();
  }, [fetchBuilding]);

  // Fetch staff assigned to this building (view-only)
  const fetchStaff = useCallback(async () => {
    setStaffLoading(true);
    try {
      const res = await apiJson(`/api/users?building_id=${buildingId}&limit=100`);
      const users = res.data?.data || [];
      setStaffList(users.filter(u => u.role === 'BUILDING_MANAGER' || u.role === 'STAFF'));
    } catch { setStaffList([]); }
    finally { setStaffLoading(false); }
  }, [buildingId]);

  useEffect(() => { fetchStaff(); }, [fetchStaff]);

  const startEditing = () => {
    if (!building) return;
    setForm({
      name: building.name || "",
      location_id: building.location_id || "",
      address: building.address || "",
      description: building.description || "",
      total_floors: building.total_floors ?? "",
      latitude: building.latitude ?? "",
      longitude: building.longitude ?? "",
    });
    setThumbFile(null);
    setThumbPreview(building.thumbnail_url || null);
    setGalleryImages(
      (building.images || []).map((img) => ({
        url: img.image_url || img.url || img,
        existing: true,
      }))
    );
    setFacilityIds((building.facilities || []).map((f) => f.id || f));
    setErrors({});
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
  };

  const setFormField = (k, v) => {
    setForm((p) => ({ ...p, [k]: v }));
    if (errors[k]) setErrors((p) => ({ ...p, [k]: undefined }));
  };

  const validate = () => {
    const e = {};
    if (!form.name?.trim()) e.name = true;
    if (!form.location_id) e.location_id = true;
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
        thumbnail_url = res.urls?.[0] || null;
      }

      /* Upload new gallery images */
      const existingUrls = galleryImages.filter((g) => g.existing).map((g) => g.url);
      const newFiles = galleryImages.filter((g) => g.file).map((g) => g.file);
      let galleryUrls = existingUrls;
      if (newFiles.length > 0) {
        const res = await uploadFiles("building_gallery", newFiles);
        const uploaded = res.urls || [];
        galleryUrls = [...existingUrls, ...uploaded];
      }

      const payload = {
        name: form.name.trim(),
        location_id: form.location_id,
        address: form.address.trim(),
        description: form.description?.trim() || null,
        total_floors: form.total_floors ? Number(form.total_floors) : null,
        latitude: form.latitude ? Number(form.latitude) : null,
        longitude: form.longitude ? Number(form.longitude) : null,
        thumbnail_url,
        images: galleryUrls,
        facilities: facilityIds,
      };

      await apiJson(`/api/buildings/${building.id}`, { method: "PUT", body: payload });
      setIsEditing(false);
      fetchBuilding();
      if (onUpdateSuccess) onUpdateSuccess();
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

  const handleDelete = async () => {
    setSaving(true);
    try {
      await apiJson(`/api/buildings/${buildingId}`, { method: "DELETE" });
      onDeleteSuccess();
    } catch (err) {
      alert(err.message || "Không thể xóa tòa nhà. Vui lòng thử lại.");
    } finally {
      setSaving(false);
      setConfirmDel(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <CircleNotch className="size-6 animate-spin text-muted-foreground" />
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

  const gallery = (building.images?.length ? building.images : [null])
    .map((img) => img?.image_url || img?.url || img || defaultBuildingImg);

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
            <h1 className="text-lg font-bold">{isEditing ? "Chỉnh sửa: " : ""}{building.name}</h1>
            {!isEditing && (
              <span className="flex items-center gap-1.5 text-[11px] font-semibold">
                <span className={`size-2 rounded-full ${building.is_active ? "bg-success" : "bg-muted-foreground/30"}`} />
                <span className={building.is_active ? "text-success" : "text-muted-foreground"}>
                  {building.is_active ? "Hoạt động" : "Vô hiệu hóa"}
                </span>
              </span>
            )}
          </div>
          {!isEditing && (
            <p className="text-[13px] text-muted-foreground flex items-center gap-1.5">
              <MapPin className="size-3.5" /> {building.address}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-2">
          {!isEditing && (
            <Button variant="outline" className="gap-2" onClick={startEditing}>
              <PencilSimple className="size-4" /> Chỉnh sửa
            </Button>
          )}
        </div>

        {!isEditing && (
          <Button
            variant="destructive"
            className="gap-2"
            onClick={() => setConfirmDel(true)}
          >
            <Trash className="size-4" /> Xóa tòa nhà
          </Button>
        )}
      </div>

      {isEditing ? (
        <form id="edit-building-form" onSubmit={handleSubmit} className="space-y-6">
          <Card className="p-5 space-y-5 shadow-none border-border">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Tên tòa nhà *</Label>
                <Input value={form.name || ""} onChange={(e) => setFormField("name", e.target.value)}
                  className={errors.name ? "border-destructive" : ""} />
              </div>
              <div className="space-y-1.5">
                <Label>Khu vực *</Label>
                <Select value={form.location_id || ""} onValueChange={(v) => setFormField("location_id", v)}>
                  <SelectTrigger className={errors.location_id ? "border-destructive" : ""}>
                    <SelectValue placeholder="Chọn khu vực" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations?.map((loc) => (
                      <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Địa chỉ *</Label>
              <Input value={form.address || ""} onChange={(e) => setFormField("address", e.target.value)}
                className={errors.address ? "border-destructive" : ""} />
            </div>

            <div className="space-y-1.5">
              <Label>Số tầng</Label>
              <Input type="number" min="1" value={form.total_floors || ""}
                onChange={(e) => setFormField("total_floors", e.target.value)} />
            </div>

            <MapPicker
              latitude={form.latitude}
              longitude={form.longitude}
              onChange={(lat, lng) => {
                setFormField("latitude", lat);
                setFormField("longitude", lng);
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

            <div className="space-y-1.5">
              <Label>Mô tả</Label>
              <Textarea rows={4} value={form.description || ""}
                onChange={(e) => setFormField("description", e.target.value)}
                placeholder="Mô tả ngắn về tòa nhà..." />
            </div>
          </Card>

          <Card className="p-5 space-y-5 shadow-none border-border">
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
          </Card>

          <Card className="p-5 space-y-5 shadow-none border-border">
            <EditFacilityPicker selectedIds={facilityIds} onChange={setFacilityIds} />
          </Card>
        </form>
      ) : (
        <div className="space-y-6">
          {/* Main info card — thumbnail only */}
          <Card className="overflow-hidden py-0 gap-0">
            <div className="flex flex-col md:flex-row">
              <div className="md:w-64 shrink-0 bg-muted h-48 md:h-auto overflow-hidden">
                <img
                  src={thumb(building)}
                  alt={building.name}
                  className="w-full h-full object-cover"
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

          {/* Nhân sự (view-only) */}
          <section>
            <h2 className="text-base font-bold mb-3">Nhân sự</h2>

            {staffLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
                <CircleNotch className="size-4 animate-spin" /> Đang tải...
              </div>
            ) : staffList.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">Chưa có nhân sự nào được gán cho tòa nhà này.</p>
            ) : (
              <div className="space-y-2">
                {staffList.map(u => (
                  <div key={u.id} className="flex items-center rounded-xl border border-border bg-card p-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={u.avatar_url || defaultUserImg}
                        alt=""
                        className="size-10 rounded-lg object-cover ring-1 ring-border"
                        onError={e => { e.target.src = defaultUserImg; }}
                      />
                      <div>
                        <span className="font-semibold text-sm">{u.first_name} {u.last_name}</span>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${u.role === 'BUILDING_MANAGER' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                            }`}>
                            {u.role === 'BUILDING_MANAGER' ? 'Quản lý' : 'Nhân viên'}
                          </span>
                          {u.email && <span className="flex items-center gap-1"><Envelope className="size-3" />{u.email}</span>}
                          {u.phone && <span className="flex items-center gap-1"><Phone className="size-3" />{u.phone}</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

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
                      onError={(e) => { e.target.src = defaultBuildingImg; }}
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

        </div>
      )}

      {/* Sticky Action Panel (Only shows when editing) */}
      {isEditing && (
        <div className="fixed bottom-0 right-0 left-56 bg-background/95 backdrop-blur-md border-t border-border p-4 flex items-center justify-end gap-3 z-50 px-8">
          <Button variant="outline" onClick={cancelEditing} disabled={saving} className="bg-background">Hủy</Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? <CircleNotch className="size-4 animate-spin mr-1.5" /> : <FloppyDisk className="size-4 mr-1.5" />}
            Lưu thay đổi
          </Button>
        </div>
      )}

      {/* Confirm Delete Dialog */}
      <Dialog open={confirmDel} onOpenChange={setConfirmDel}>
        <DialogContent className="max-w-sm text-center">
          <DialogHeader>
            <DialogTitle>Xóa tòa nhà</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Bạn có chắc muốn xóa tòa nhà{" "}
            <strong className="text-foreground">&quot;{building?.name}&quot;</strong>?{" "}
            Hành động này không thể hoàn tác.
          </p>
          <DialogFooter className="justify-center gap-2 sm:justify-center">
            <Button variant="outline" onClick={() => setConfirmDel(false)}>Hủy</Button>
            <Button variant="destructive" disabled={saving} onClick={handleDelete}>
              {saving && <CircleNotch className="size-4 animate-spin mr-1.5" />}
              Xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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

/* ── LocationSection (with per-section paging) ── */

function LocationSection({ locId, name, buildings, onView, onToggle, onStaff }) {
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
            <p className="text-sm font-medium text-muted-foreground">{buildings.length} kết quả</p>
          </div>
        </div>

        {showPaging && (
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">{page + 1}/{totalPages}</span>
            <div className="flex items-center gap-1">
              <Button size="icon" variant="outline" className="size-8" disabled={page === 0} onClick={() => setPage(p => Math.max(0, p - 1))}>
                <CaretLeft className="size-4" />
              </Button>
              <Button size="icon" variant="outline" className="size-8" disabled={page >= totalPages - 1} onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}>
                <CaretRight className="size-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {visible.map((b) => (
          <BuildingCard
            key={b.id}
            building={b}
            onView={onView}
            onToggle={onToggle}
            onStaff={onStaff}
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
  const [error, setError] = useState(null);

  /* filters */
  const [search, setSearch] = useState("");
  const [filterActive, setFilterActive] = useState("all");
  const [filterLocation, setFilterLocation] = useState("all");

  /* dialogs */
  const [confirmToggle, setConfirmToggle] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [saving, setSaving] = useState(false);

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

  const locationCounts = useMemo(() => {
    const counts = {};
    allBuildings.forEach((b) => {
      const locName = b.location?.name || "Khác";
      counts[locName] = (counts[locName] || 0) + 1;
    });
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .map(([name, count]) => ({ name, count }));
  }, [allBuildings]);

  /* ─ CRUD handlers ─ */
  const [toggleError, setToggleError] = useState(null);

  const handleToggleConfirm = async () => {
    setSaving(true);
    setToggleError(null);
    try {
      await api.patch(`/api/buildings/${confirmToggle.id}/status`, { is_active: !confirmToggle.is_active });
      setConfirmToggle(null);
      fetchBuildings();
    } catch (err) {
      setToggleError(err.message || "Không thể cập nhật trạng thái.");
    } finally {
      setSaving(false);
    }
  };

  if (selectedId) {
    return (
      <BuildingDetail
        buildingId={selectedId}
        onBack={() => setSelectedId(null)}
        locations={locations}
        onDeleteSuccess={() => {
          setSelectedId(null);
          fetchBuildings();
        }}
        onUpdateSuccess={() => {
          fetchBuildings();
        }}
      />
    );
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
      <BuildingSummary active={activeCount} inactive={inactiveCount} locationCounts={locationCounts} filterActive={filterActive} />

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
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
            <CircleNotch className="size-6 animate-spin text-muted-foreground" />
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
                onToggle={setConfirmToggle}
                onStaff={(b) => navigate(`/buildings/${b.id}/staff`)}
              />
            ))}
          </div>
        )}
      </div>



      {/* Confirm Toggle */}
      <Dialog open={!!confirmToggle} onOpenChange={(v) => { if (!v) { setConfirmToggle(null); setToggleError(null); } }}>
        <DialogContent className="max-w-sm text-center">
          <DialogHeader>
            <DialogTitle>
              {confirmToggle?.is_active ? "Vô hiệu hóa tòa nhà" : "Kích hoạt tòa nhà"}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {confirmToggle?.is_active
              ? <>Bạn có chắc muốn <strong className="text-foreground">vô hiệu hóa</strong> tòa nhà <strong className="text-foreground">&quot;{confirmToggle?.name}&quot;</strong>?</>
              : <>Bạn có chắc muốn <strong className="text-foreground">kích hoạt</strong> tòa nhà <strong className="text-foreground">&quot;{confirmToggle?.name}&quot;</strong>?</>
            }
          </p>
          {toggleError && (
            <p className="text-sm text-destructive">{toggleError}</p>
          )}
          <DialogFooter className="justify-center gap-2 sm:justify-center">
            <Button variant="outline" onClick={() => { setConfirmToggle(null); setToggleError(null); }}>Hủy</Button>
            <Button
              variant={confirmToggle?.is_active ? "destructive" : "default"}
              disabled={saving}
              onClick={handleToggleConfirm}
            >
              {saving && <CircleNotch className="size-4 animate-spin mr-1.5" />}
              {confirmToggle?.is_active ? "Vô hiệu hóa" : "Kích hoạt"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
