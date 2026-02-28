import { useState, useEffect, useCallback } from "react";
import {
  Plus, Search, Pencil, Trash2, MapPin, GraduationCap,
  ToggleLeft, ToggleRight, ChevronUp, ChevronDown,
  ChevronsUpDown, Loader2, Building2, Eye,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { api } from "@/lib/api";
import {
  Map, useMap, MapMarker, MarkerContent, MapControls,
} from "@/components/ui/map";
import defaultBuildingImg from "@/assets/default_building_img.jpg";

/* ── helpers ───────────────────────────────── */

const fmt = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
};

const EMPTY_FORM = {
  name: "", location_id: "", address: "",
  latitude: "", longitude: "", is_active: "true",
};

const DEFAULT_CENTER = [106.6297, 16.0544];
const DEFAULT_ZOOM = 5;

/* ── Sort icon ─────────────────────────────── */

function SortIcon({ field, sortField, sortDir }) {
  if (sortField !== field) return <ChevronsUpDown className="size-3.5 ml-1 opacity-40" />;
  return sortDir === "asc"
    ? <ChevronUp className="size-3.5 ml-1 text-primary" />
    : <ChevronDown className="size-3.5 ml-1 text-primary" />;
}

/* ── MapClickHandler (child of Map) ────────── */

function MapClickHandler({ onChange }) {
  const { map } = useMap();

  useEffect(() => {
    if (!map) return;
    const handleClick = (e) => {
      onChange({
        latitude: e.lngLat.lat.toFixed(8),
        longitude: e.lngLat.lng.toFixed(8),
      });
    };
    map.on("click", handleClick);
    map.getCanvas().style.cursor = "crosshair";
    return () => {
      map.off("click", handleClick);
      map.getCanvas().style.cursor = "";
    };
  }, [map, onChange]);

  return null;
}

/* ── Map Picker ────────────────────────────── */

function MapPicker({ latitude, longitude, onChange }) {
  const hasCoords = latitude !== "" && longitude !== "" && !isNaN(Number(latitude)) && !isNaN(Number(longitude));
  const lat = hasCoords ? Number(latitude) : null;
  const lng = hasCoords ? Number(longitude) : null;

  return (
    <div className="space-y-2">
      <Label className="text-xs text-muted-foreground">
        Click vào bản đồ để đặt vị trí, kéo marker để tinh chỉnh
      </Label>
      <div className="h-[220px] rounded-lg overflow-hidden border border-border">
        <Map
          center={hasCoords ? [lng, lat] : DEFAULT_CENTER}
          zoom={hasCoords ? 14 : DEFAULT_ZOOM}
        >
          <MapClickHandler onChange={onChange} />
          <MapControls showZoom position="bottom-right" />
          {hasCoords && (
            <MapMarker
              longitude={lng}
              latitude={lat}
              draggable
              onDragEnd={({ lng: newLng, lat: newLat }) => {
                onChange({
                  latitude: newLat.toFixed(8),
                  longitude: newLng.toFixed(8),
                });
              }}
            >
              <MarkerContent>
                <div className="flex items-center justify-center size-8 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary text-primary-foreground shadow-lg border-2 border-white">
                  <GraduationCap className="size-4" />
                </div>
              </MarkerContent>
            </MapMarker>
          )}
        </Map>
      </div>
    </div>
  );
}

/* ── University Detail/Edit Dialog ─────────── */

function UniversityDetailDialog({
  open, onOpenChange, universityId,
  locations, onSave, onDelete, saving,
}) {
  const [university, setUniversity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [confirmDel, setConfirmDel] = useState(false);

  useEffect(() => {
    if (!universityId || !open) return;
    let cancelled = false;
    setEditing(false);
    setConfirmDel(false);
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get(`/api/universities/${universityId}`);
        if (!cancelled) setUniversity(res.data);
      } catch {
        if (!cancelled) setError("Không thể tải thông tin.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [universityId, open]);

  const startEdit = () => {
    setForm({
      name: university.name || "",
      location_id: university.locationId || "",
      address: university.address || "",
      latitude: university.latitude ?? "",
      longitude: university.longitude ?? "",
      is_active: String(university.isActive ?? true),
    });
    setFormErrors({});
    setEditing(true);
  };

  const handleMapChange = useCallback(({ latitude, longitude }) => {
    setForm((p) => ({ ...p, latitude, longitude }));
  }, []);

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = true;
    if (!form.location_id) e.location_id = true;
    setFormErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSave(universityId, {
      name: form.name.trim(),
      location_id: form.location_id,
      address: form.address.trim() || null,
      latitude: form.latitude !== "" ? Number(form.latitude) : null,
      longitude: form.longitude !== "" ? Number(form.longitude) : null,
      is_active: form.is_active === "true",
    });
  };

  const handleDelete = () => {
    onDelete(universityId);
  };

  const hasCoords = university?.latitude && university?.longitude;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : error || !university ? (
          <div className="text-center py-10">
            <p className="text-sm text-destructive">{error || "Không tìm thấy."}</p>
          </div>
        ) : editing ? (
          /* ─── Edit mode ─── */
          <>
            <DialogHeader>
              <DialogTitle>Chỉnh sửa trường</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Tên trường *</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                    className={formErrors.name ? "border-destructive" : ""}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Khu vực *</Label>
                  <Select value={form.location_id} onValueChange={(v) => setForm((p) => ({ ...p, location_id: v }))}>
                    <SelectTrigger className={formErrors.location_id ? "border-destructive" : ""}>
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
                <Label>Địa chỉ</Label>
                <Input
                  value={form.address}
                  onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
                />
              </div>
              <MapPicker latitude={form.latitude} longitude={form.longitude} onChange={handleMapChange} />
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label>Vĩ độ</Label>
                  <Input
                    type="number" step="any" value={form.latitude}
                    onChange={(e) => setForm((p) => ({ ...p, latitude: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Kinh độ</Label>
                  <Input
                    type="number" step="any" value={form.longitude}
                    onChange={(e) => setForm((p) => ({ ...p, longitude: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Trạng thái</Label>
                  <Select value={form.is_active} onValueChange={(v) => setForm((p) => ({ ...p, is_active: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Hoạt động</SelectItem>
                      <SelectItem value="false">Không hoạt động</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditing(false)}>Hủy</Button>
                <Button
                  type="submit" disabled={saving}
                  className="bg-success text-success-foreground hover:bg-success/90"
                >
                  {saving && <Loader2 className="size-4 animate-spin mr-1.5" />}
                  Lưu thay đổi
                </Button>
              </DialogFooter>
            </form>
          </>
        ) : confirmDel ? (
          /* ─── Delete confirm ─── */
          <>
            <DialogHeader>
              <DialogTitle>Xóa trường đại học</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground text-center py-2">
              Bạn có chắc muốn xóa trường{" "}
              <strong className="text-foreground">&quot;{university.name}&quot;</strong>?{" "}
              Hành động này không thể hoàn tác.
            </p>
            <DialogFooter className="justify-center gap-2 sm:justify-center">
              <Button variant="outline" onClick={() => setConfirmDel(false)}>Hủy</Button>
              <Button variant="destructive" disabled={saving} onClick={handleDelete}>
                {saving && <Loader2 className="size-4 animate-spin mr-1.5" />}
                Xóa
              </Button>
            </DialogFooter>
          </>
        ) : (
          /* ─── View mode ─── */
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2.5">
                {university.name}
                <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${
                  university.isActive
                    ? "bg-success/15 text-success"
                    : "bg-muted text-muted-foreground"
                }`}>
                  {university.isActive ? "Hoạt động" : "Không hoạt động"}
                </span>
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-5">
              {/* Info grid */}
              <div className="grid grid-cols-2 gap-4">
                {[
                  ["Khu vực", university.location?.name || "—"],
                  ["Địa chỉ", university.address || "—"],
                  ...(hasCoords ? [["Tọa độ", `${university.latitude}, ${university.longitude}`]] : []),
                  ["Ngày tạo", fmt(university.createdAt)],
                  ["Cập nhật", fmt(university.updatedAt)],
                ].map(([label, value]) => (
                  <div key={label}>
                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{label}</p>
                    <p className="text-sm font-medium mt-0.5">{value}</p>
                  </div>
                ))}
              </div>

              {/* Map */}
              {hasCoords && (
                <div className="h-[200px] rounded-lg overflow-hidden border border-border">
                  <Map
                    center={[Number(university.longitude), Number(university.latitude)]}
                    zoom={15}
                  >
                    <MapControls showZoom position="bottom-right" />
                    <MapMarker
                      longitude={Number(university.longitude)}
                      latitude={Number(university.latitude)}
                    >
                      <MarkerContent>
                        <div className="flex items-center justify-center size-8 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary text-primary-foreground shadow-lg border-2 border-white">
                          <GraduationCap className="size-4" />
                        </div>
                      </MarkerContent>
                    </MapMarker>
                  </Map>
                </div>
              )}

              {/* Nearby buildings */}
              {university.nearby_buildings?.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold mb-2.5">Tòa nhà FScape lân cận</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {university.nearby_buildings.map((b) => (
                      <div key={b.id} className="flex items-center gap-3 p-2.5 rounded-lg border border-border">
                        <div className="size-12 rounded-lg overflow-hidden bg-muted shrink-0">
                          <img
                            src={b.thumbnail_url || defaultBuildingImg}
                            alt={b.name}
                            className="w-full h-full object-cover"
                            onError={(e) => { e.target.src = defaultBuildingImg; }}
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{b.name}</p>
                          {b.address && (
                            <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                              <MapPin className="size-3 shrink-0" /> {b.address}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <DialogFooter className="gap-2 sm:justify-between">
              <Button
                variant="outline" size="sm"
                className="text-destructive hover:bg-destructive/10 gap-1.5"
                onClick={() => setConfirmDel(true)}
              >
                <Trash2 className="size-3.5" /> Xóa
              </Button>
              <Button size="sm" className="gap-1.5" onClick={startEdit}>
                <Pencil className="size-3.5" /> Chỉnh sửa
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

/* ── Create Form Dialog ────────────────────── */

function UniversityCreateDialog({ open, onOpenChange, onSave, saving, locations }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = true;
    if (!form.location_id) e.location_id = true;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSave({
      name: form.name.trim(),
      location_id: form.location_id,
      address: form.address.trim() || null,
      latitude: form.latitude !== "" ? Number(form.latitude) : null,
      longitude: form.longitude !== "" ? Number(form.longitude) : null,
      is_active: form.is_active === "true",
    });
  };

  const handleMapChange = useCallback(({ latitude, longitude }) => {
    setForm((p) => ({ ...p, latitude, longitude }));
  }, []);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) setForm(EMPTY_FORM);
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Thêm trường đại học</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Tên trường *</Label>
              <Input
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="VD: Đại học Bách Khoa"
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
            <Label>Địa chỉ</Label>
            <Input
              value={form.address}
              onChange={(e) => set("address", e.target.value)}
              placeholder="VD: 268 Lý Thường Kiệt, Q.10, TP.HCM"
            />
          </div>
          <MapPicker latitude={form.latitude} longitude={form.longitude} onChange={handleMapChange} />
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>Vĩ độ</Label>
              <Input
                type="number" step="any" value={form.latitude}
                onChange={(e) => set("latitude", e.target.value)}
                placeholder="21.0285"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Kinh độ</Label>
              <Input
                type="number" step="any" value={form.longitude}
                onChange={(e) => set("longitude", e.target.value)}
                placeholder="105.8542"
              />
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
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
            <Button
              type="submit" disabled={saving}
              className="bg-success text-success-foreground hover:bg-success/90"
            >
              {saving && <Loader2 className="size-4 animate-spin mr-1.5" />}
              Thêm trường
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ── Main Page ─────────────────────────────── */

export default function UniversitiesPage() {
  /* data */
  const [universities, setUniversities] = useState([]);
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
  const [sortField, setSortField] = useState(null);
  const [sortDir, setSortDir] = useState("asc");

  /* dialogs */
  const [showCreate, setShowCreate] = useState(false);
  const [detailId, setDetailId] = useState(null);
  const [confirmToggle, setConfirmToggle] = useState(null);

  const limit = 10;

  /* ─ fetch locations for dropdown ─ */
  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/api/locations?limit=100&is_active=true");
        setLocations(res.data || []);
      } catch {
        /* silent */
      }
    })();
  }, []);

  /* ─ fetch universities ─ */
  const fetchUniversities = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page, limit });
      if (search.trim()) params.set("search", search.trim());
      if (filterActive === "active") params.set("is_active", "true");
      if (filterActive === "inactive") params.set("is_active", "false");
      if (filterLocation !== "all") params.set("location_id", filterLocation);

      const res = await api.get(`/api/universities?${params}`);
      setUniversities(res.data || []);
      setTotal(res.total || 0);
      setPage(res.page || 1);
      setTotalPages(res.totalPages || 1);
    } catch {
      setError("Không thể tải dữ liệu. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }, [page, search, filterActive, filterLocation]);

  useEffect(() => { fetchUniversities(); }, [fetchUniversities]);
  useEffect(() => { setPage(1); }, [search, filterActive, filterLocation]);

  /* sort */
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const sorted = [...universities].sort((a, b) => {
    if (!sortField) return 0;
    if (sortField === "name") {
      const cmp = (a.name || "").localeCompare(b.name || "", "vi");
      return sortDir === "asc" ? cmp : -cmp;
    }
    const diff = new Date(a[sortField]) - new Date(b[sortField]);
    return sortDir === "asc" ? diff : -diff;
  });

  const activeCount = universities.filter((u) => u.isActive).length;

  /* ─ CRUD handlers ─ */
  const handleCreate = async (data) => {
    setSaving(true);
    try {
      await api.post("/api/universities", data);
      setShowCreate(false);
      fetchUniversities();
    } catch (err) {
      alert(err.message || "Đã xảy ra lỗi. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (id, data) => {
    setSaving(true);
    try {
      await api.put(`/api/universities/${id}`, data);
      setDetailId(null);
      fetchUniversities();
    } catch (err) {
      alert(err.message || "Đã xảy ra lỗi. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    setSaving(true);
    try {
      await api.delete(`/api/universities/${id}`);
      setDetailId(null);
      fetchUniversities();
    } catch (err) {
      alert(err.message || "Không thể xóa. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleConfirm = async () => {
    setSaving(true);
    try {
      await api.put(`/api/universities/${confirmToggle.id}`, {
        is_active: !confirmToggle.isActive,
      });
      setConfirmToggle(null);
      fetchUniversities();
    } catch (err) {
      alert(err.message || "Không thể cập nhật. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3 pt-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Đại học</h1>
          <p className="text-sm text-muted-foreground">Quản lý các trường đại học đối tác của FScape</p>
        </div>
        <Button className="gap-1.5" onClick={() => setShowCreate(true)}>
          <Plus className="size-4" /> Thêm trường
        </Button>
      </div>

      {/* Summary card */}
      <Card className="py-0 gap-0 overflow-hidden">
        <div className="flex items-stretch">
          <div className="flex-1 flex items-center gap-4 px-6 py-5">
            <div className="flex items-center justify-center size-14 rounded-2xl bg-primary/10">
              <GraduationCap className="size-6 text-primary" />
            </div>
            <div>
              <p className="text-3xl font-bold tracking-tight">{total}</p>
              <p className="text-sm text-muted-foreground">Trường đại học</p>
            </div>
          </div>
          <div className="flex items-center gap-6 px-6 py-5 border-l border-border bg-muted/30">
            <div className="text-center">
              <p className="text-2xl font-bold text-success">{activeCount}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Hoạt động</p>
            </div>
            <div className="w-px h-8 bg-border" />
            <div className="text-center">
              <p className="text-2xl font-bold text-muted-foreground">
                {universities.length - activeCount}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">Không hoạt động</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm trường..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
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
        <div className="flex gap-1.5">
          {[
            { key: "all", label: "Tất cả" },
            { key: "active", label: "Hoạt động" },
            { key: "inactive", label: "Không hoạt động" },
          ].map((fl) => (
            <Button
              key={fl.key}
              size="sm"
              variant={filterActive === fl.key ? "default" : "outline"}
              onClick={() => setFilterActive(fl.key)}
            >
              {fl.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Table */}
      <Card className="overflow-hidden py-0 gap-0">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="py-14 text-center">
            <p className="text-sm text-destructive">{error}</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={fetchUniversities}>
              Thử lại
            </Button>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12 pl-4">#</TableHead>
                  <TableHead
                    className="cursor-pointer select-none hover:text-foreground"
                    onClick={() => handleSort("name")}
                  >
                    <span className="inline-flex items-center">
                      Tên trường
                      <SortIcon field="name" sortField={sortField} sortDir={sortDir} />
                    </span>
                  </TableHead>
                  <TableHead>Khu vực</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead
                    className="cursor-pointer select-none hover:text-foreground"
                    onClick={() => handleSort("createdAt")}
                  >
                    <span className="inline-flex items-center">
                      Ngày tạo
                      <SortIcon field="createdAt" sortField={sortField} sortDir={sortDir} />
                    </span>
                  </TableHead>
                  <TableHead className="text-right pr-4">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-14 text-center text-muted-foreground">
                      Không tìm thấy trường đại học nào.
                    </TableCell>
                  </TableRow>
                ) : (
                  sorted.map((uni, idx) => (
                    <TableRow key={uni.id}>
                      <TableCell className="pl-4 text-muted-foreground text-xs">
                        {(page - 1) * limit + idx + 1}
                      </TableCell>
                      <TableCell>
                        <div>
                          <span className="font-medium">{uni.name}</span>
                          {uni.address && (
                            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                              <MapPin className="size-3 shrink-0" /> {uni.address}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {uni.location?.name || "—"}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full ${
                            uni.isActive
                              ? "bg-success/15 text-success"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          <span
                            className={`size-2 rounded-full shrink-0 ${
                              uni.isActive ? "bg-success" : "bg-muted-foreground/40"
                            }`}
                          />
                          {uni.isActive ? "Hoạt động" : "Không hoạt động"}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {fmt(uni.createdAt)}
                      </TableCell>
                      <TableCell className="pr-4">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="icon" variant="ghost"
                            className={`size-8 ${uni.isActive ? "text-success hover:text-success/80" : "text-muted-foreground"}`}
                            title={uni.isActive ? "Tắt hoạt động" : "Bật hoạt động"}
                            onClick={() => setConfirmToggle(uni)}
                          >
                            {uni.isActive
                              ? <ToggleRight className="size-5" />
                              : <ToggleLeft className="size-5" />}
                          </Button>
                          <Button
                            size="icon" variant="ghost" className="size-8"
                            title="Chi tiết"
                            onClick={() => setDetailId(uni.id)}
                          >
                            <Eye className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                <p className="text-xs text-muted-foreground">
                  Trang {page} / {totalPages} ({total} trường)
                </p>
                <div className="flex gap-1.5">
                  <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                    Trước
                  </Button>
                  <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                    Sau
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      {/* Detail / Edit / Delete dialog */}
      <UniversityDetailDialog
        open={!!detailId}
        onOpenChange={(v) => !v && setDetailId(null)}
        universityId={detailId}
        locations={locations}
        onSave={handleUpdate}
        onDelete={handleDelete}
        saving={saving}
      />

      {/* Create dialog */}
      <UniversityCreateDialog
        open={showCreate}
        onOpenChange={setShowCreate}
        onSave={handleCreate}
        saving={saving}
        locations={locations}
      />

      {/* Confirm toggle */}
      <Dialog open={!!confirmToggle} onOpenChange={(v) => !v && setConfirmToggle(null)}>
        <DialogContent className="max-w-sm text-center">
          <DialogHeader>
            <DialogTitle>
              {confirmToggle?.isActive ? "Tắt trường" : "Bật trường"}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {confirmToggle?.isActive
              ? <>Bạn có chắc muốn <strong className="text-foreground">tắt hoạt động</strong> trường <strong className="text-foreground">&quot;{confirmToggle?.name}&quot;</strong>?</>
              : <>Bạn có chắc muốn <strong className="text-foreground">bật hoạt động</strong> trường <strong className="text-foreground">&quot;{confirmToggle?.name}&quot;</strong>?</>
            }
          </p>
          <DialogFooter className="justify-center gap-2 sm:justify-center">
            <Button variant="outline" onClick={() => setConfirmToggle(null)}>Hủy</Button>
            <Button
              variant={confirmToggle?.isActive ? "destructive" : "outline"}
              className={!confirmToggle?.isActive ? "border-success bg-success text-success-foreground hover:bg-success/90 hover:border-success/90" : ""}
              disabled={saving}
              onClick={handleToggleConfirm}
            >
              {saving && <Loader2 className="size-4 animate-spin mr-1.5" />}
              {confirmToggle?.isActive ? "Tắt" : "Bật"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
