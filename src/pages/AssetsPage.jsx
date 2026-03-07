import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Plus, Search, Package, Trash2, Loader2, Pencil, QrCode,
  Building2, ChevronLeft, ChevronRight, Download, Printer,
  DoorOpen, Eye,
} from "lucide-react";
import { Card } from "@/components/ui/card";
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
import { Textarea } from "@/components/ui/textarea";
import { apiJson } from "@/lib/apiClient";
import StatusDonut from "@/components/StatusDonut";

/* ── helpers ───────────────────────────────── */

const fmt = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return isNaN(d.getTime()) ? "—" : d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
};

const STATUS_MAP = {
  AVAILABLE: { label: "Sẵn sàng", dot: "bg-success", text: "text-success" },
  IN_USE: { label: "Đang sử dụng", dot: "bg-primary", text: "text-primary" },
};

const STATUS_STROKE = {
  AVAILABLE: "stroke-success",
  IN_USE: "stroke-primary",
};

const STATUS_ORDER = ["AVAILABLE", "IN_USE"];


/* ── Summary Card ──────────────────────────── */

function AssetSummary({ total, statusCounts }) {
  return (
    <div className="rounded-2xl border border-border bg-card">
      <div className="flex items-center gap-6 p-5 flex-wrap">
        <div className="flex items-center gap-4 flex-1 min-w-[140px]">
          <div className="size-11 rounded-xl bg-primary/8 flex items-center justify-center shrink-0">
            <Package className="size-5 text-primary" />
          </div>
          <div>
            <p className="text-3xl font-bold leading-none tracking-tight">{total}</p>
            <p className="text-sm text-muted-foreground mt-1">Tài sản</p>
          </div>
        </div>

        <div className="w-px h-14 bg-border shrink-0" />

        <div className="flex items-center gap-4">
          <StatusDonut entries={STATUS_ORDER.map((s) => ({ key: s, stroke: STATUS_STROKE[s], count: statusCounts[s] || 0 }))} size={64} />
          <div className="space-y-2">
            {STATUS_ORDER.map((s) => {
              const meta = STATUS_MAP[s];
              return (
                <div key={s} className="flex items-center gap-2">
                  <span className={`size-2 rounded-full ${meta.dot} shrink-0`} />
                  <span className="text-xs text-muted-foreground">{meta.label}</span>
                  <span className="text-xs font-semibold ml-auto pl-2">{statusCounts[s] || 0}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── QR Code Dialog ────────────────────────── */

function QRDialog({ open, onOpenChange, asset }) {
  if (!asset) return null;
  const qrData = asset.qr_code || `FSCAPE_ASSET_${asset.id}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrData)}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-center">Mã QR Tài sản</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center p-6 space-y-4">
          <div className="bg-white p-4 rounded-xl border-4 border-muted shadow-inner">
            <img src={qrUrl} alt="QR Code" className="size-48" />
          </div>
          <div className="text-center">
            <p className="font-bold text-lg">{asset.name}</p>
            <p className="text-xs text-muted-foreground font-mono">{qrData}</p>
          </div>
        </div>
        <DialogFooter className="grid grid-cols-2 gap-2">
          <Button variant="outline" className="gap-2" onClick={() => window.open(qrUrl)}>
            <Download className="size-4" /> Tải về
          </Button>
          <Button className="gap-2" onClick={() => window.print()}>
            <Printer className="size-4" /> In mã
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ── Asset Detail Dialog (view / edit / delete) ── */

function AssetDetailDialog({ open, onOpenChange, asset, buildings, rooms, onSaved, onDeleted }) {
  const [editing, setEditing] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const [form, setForm] = useState({});
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) { setEditing(false); setConfirmDel(false); }
  }, [open]);

  const startEdit = () => {
    setForm({
      name: asset.name || "",
      building_id: asset.building_id || "",
      current_room_id: asset.current_room_id || "",
      status: asset.status || "AVAILABLE",
      notes: asset.notes || "",
    });
    setErrors({});
    setEditing(true);
  };

  const set = (k, v) => {
    setForm((p) => ({ ...p, [k]: v }));
    if (errors[k]) setErrors((p) => ({ ...p, [k]: undefined }));
  };

  const filteredRooms = useMemo(() => {
    if (!form.building_id) return [];
    return rooms.filter((r) => r.building_id === form.building_id);
  }, [rooms, form.building_id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.name?.trim()) errs.name = true;
    if (!form.building_id) errs.building_id = true;
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSaving(true);
    try {
      await apiJson(`/api/assets/${asset.id}`, {
        method: "PUT",
        body: {
          name: form.name.trim(),
          building_id: form.building_id,
          current_room_id: form.current_room_id || null,
          status: form.status,
          notes: form.notes?.trim() || null,
        },
      });
      onSaved();
    } catch (err) {
      alert(err.message || "Đã xảy ra lỗi.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await apiJson(`/api/assets/${asset.id}`, { method: "DELETE" });
      onDeleted();
    } catch (err) {
      alert(err.message || "Không thể xóa.");
    } finally {
      setSaving(false);
    }
  };

  if (!asset) return null;
  const st = STATUS_MAP[asset.status] || STATUS_MAP.AVAILABLE;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        {editing ? (
          <>
            <DialogHeader>
              <DialogTitle>Chỉnh sửa tài sản</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-3 pt-1 max-h-[70vh] overflow-y-auto pr-1">
              <div className="space-y-1.5">
                <Label>Tên tài sản *</Label>
                <Input value={form.name || ""} onChange={(e) => set("name", e.target.value)}
                  className={errors.name ? "border-destructive" : ""} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Tòa nhà *</Label>
                  <Select value={form.building_id || undefined} onValueChange={(v) => { set("building_id", v); setForm((p) => ({ ...p, current_room_id: "" })); }}>
                    <SelectTrigger className={errors.building_id ? "border-destructive" : ""}>
                      <SelectValue placeholder="Chọn tòa nhà" />
                    </SelectTrigger>
                    <SelectContent>
                      {buildings.map((b) => (
                        <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Phòng</Label>
                  <Select value={form.current_room_id || "__none__"} onValueChange={(v) => set("current_room_id", v === "__none__" ? "" : v)}
                    disabled={!form.building_id}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn phòng" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Kho (không gán phòng)</SelectItem>
                      {filteredRooms.map((r) => (
                        <SelectItem key={r.id} value={r.id}>Phòng {r.room_number}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Trạng thái</Label>
                <Select value={form.status || "AVAILABLE"} onValueChange={(v) => set("status", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AVAILABLE">Sẵn sàng</SelectItem>
                    <SelectItem value="IN_USE">Đang sử dụng</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Ghi chú</Label>
                <Textarea value={form.notes || ""} onChange={(e) => set("notes", e.target.value)} rows={2} />
              </div>

              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" onClick={() => setEditing(false)}>Hủy</Button>
                <Button type="submit" disabled={saving}>
                  {saving && <Loader2 className="size-4 animate-spin mr-1.5" />}
                  Lưu thay đổi
                </Button>
              </DialogFooter>
            </form>
          </>
        ) : confirmDel ? (
          <>
            <DialogHeader>
              <DialogTitle>Xóa tài sản</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground text-center py-2">
              Bạn có chắc muốn xóa tài sản{" "}
              <strong className="text-foreground">&quot;{asset.name}&quot;</strong>?
              Hành động này không thể hoàn tác.
            </p>
            <DialogFooter className="justify-center gap-2">
              <Button variant="outline" onClick={() => setConfirmDel(false)}>Hủy</Button>
              <Button variant="destructive" disabled={saving} onClick={handleDelete}>
                {saving && <Loader2 className="size-4 animate-spin mr-1.5" />}
                Xóa
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2.5">
                {asset.name}
                <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${st.text === "text-success"
                  ? "bg-success/15 text-success"
                  : "bg-primary/15 text-primary"
                  }`}>
                  {st.label}
                </span>
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-border/50 bg-muted/30 p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Building2 className="size-3.5 text-muted-foreground" />
                    <p className="text-[11px] text-muted-foreground">Tòa nhà</p>
                  </div>
                  <p className="text-sm font-semibold">{asset.building?.name || "—"}</p>
                </div>
                <div className="rounded-lg border border-border/50 bg-muted/30 p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <DoorOpen className="size-3.5 text-muted-foreground" />
                    <p className="text-[11px] text-muted-foreground">Phòng</p>
                  </div>
                  <p className="text-sm font-semibold">{asset.room ? `Phòng ${asset.room.room_number}` : "Kho"}</p>
                </div>
              </div>

              {asset.notes && (
                <div>
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Ghi chú</p>
                  <p className="text-sm mt-0.5">{asset.notes}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Ngày tạo</p>
                  <p className="text-sm font-medium mt-0.5">{fmt(asset.created_at)}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Cập nhật</p>
                  <p className="text-sm font-medium mt-0.5">{fmt(asset.updated_at)}</p>
                </div>
              </div>
            </div>
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

/* ── Batch Create Dialog ───────────────────── */

function BatchCreateDialog({ open, onOpenChange, buildings, onSaved }) {
  const [assetTypes, setAssetTypes] = useState([]);
  const [form, setForm] = useState({ asset_type_id: "", building_id: "", quantity: "1" });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (!open) return;
    setForm({ asset_type_id: "", building_id: "", quantity: "1" });
    setErrors({});
    setResult(null);
    apiJson("/api/asset-types?limit=100&is_active=true").then((res) => {
      setAssetTypes(res.data || []);
    }).catch(() => { });
  }, [open]);

  const set = (k, v) => {
    setForm((p) => ({ ...p, [k]: v }));
    if (errors[k]) setErrors((p) => ({ ...p, [k]: undefined }));
  };

  const selectedType = assetTypes.find((t) => t.id === form.asset_type_id);

  const validate = () => {
    const e = {};
    if (!form.asset_type_id) e.asset_type_id = true;
    if (!form.building_id) e.building_id = true;
    const qty = Number(form.quantity);
    if (!qty || qty < 1 || qty > 100) e.quantity = "1–100";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const body = {
        name: selectedType?.name || "Asset",
        building_id: form.building_id,
        asset_type_id: form.asset_type_id,
        quantity: Number(form.quantity),
      };
      const res = await apiJson("/api/assets/batch", { method: "POST", body });
      setResult(res);
    } catch (err) {
      setResult({ error: err.message || "Đã xảy ra lỗi." });
    } finally {
      setSaving(false);
    }
  };

  if (result) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-sm text-center">
          <DialogHeader>
            <DialogTitle>{result.error ? "Lỗi" : "Thành công"}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-2">
            {result.error || `Đã tạo ${result.count} tài sản "${selectedType?.name}".`}
          </p>
          <DialogFooter className="justify-center">
            <Button onClick={() => { onOpenChange(false); if (!result.error) onSaved(); }}>Đóng</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Thêm tài sản hàng loạt</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Loại tài sản *</Label>
            <Select value={form.asset_type_id || undefined} onValueChange={(v) => set("asset_type_id", v)}>
              <SelectTrigger className={errors.asset_type_id ? "border-destructive" : ""}>
                <SelectValue placeholder="Chọn loại tài sản" />
              </SelectTrigger>
              <SelectContent>
                {assetTypes.map((at) => (
                  <SelectItem key={at.id} value={at.id}>{at.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedType && (
              <p className="text-[11px] text-muted-foreground">
                Giá mặc định: {selectedType.default_price ? Number(selectedType.default_price).toLocaleString("vi-VN") + " ₫" : "—"}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Tòa nhà *</Label>
            <Select value={form.building_id || undefined} onValueChange={(v) => set("building_id", v)}>
              <SelectTrigger className={errors.building_id ? "border-destructive" : ""}>
                <SelectValue placeholder="Chọn tòa nhà" />
              </SelectTrigger>
              <SelectContent>
                {buildings.map((b) => (
                  <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Số lượng *</Label>
            <Input type="number" min="1" max="100"
              value={form.quantity}
              onChange={(e) => set("quantity", e.target.value)}
              className={errors.quantity ? "border-destructive" : ""} />
            {errors.quantity && <p className="text-[11px] text-destructive">Số lượng phải từ 1 đến 100</p>}
          </div>

          <div className="rounded-lg bg-muted/50 p-3 space-y-1 text-xs text-muted-foreground">
            <p>• Tên tài sản lấy từ loại tài sản đã chọn</p>
            <p>• Mỗi tài sản được gán mã QR duy nhất (FSCAPE-AST-...)</p>
            <p>• Trạng thái mặc định: <strong className="text-foreground">Sẵn sàng</strong></p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="size-4 animate-spin mr-1.5" />}
              Tạo {Number(form.quantity) > 1 ? `${form.quantity} tài sản` : "tài sản"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ── Building Section (grouped table) ──────── */

const PER_SECTION = 8;

function BuildingSection({ buildingName, assets, onDetail, onQR }) {
  const [page, setPage] = useState(0);
  const totalPages = Math.ceil(assets.length / PER_SECTION);
  const visible = assets.slice(page * PER_SECTION, (page + 1) * PER_SECTION);

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="size-7 rounded-lg bg-primary/8 flex items-center justify-center">
            <Building2 className="size-3.5 text-primary" />
          </div>
          <h2 className="text-[15px] font-semibold">{buildingName}</h2>
          <span className="text-sm font-medium text-muted-foreground">{assets.length} kết quả</span>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">{page + 1}/{totalPages}</span>
            <div className="flex items-center gap-1">
              <Button size="icon" variant="outline" className="size-8" disabled={page === 0} onClick={() => setPage(p => Math.max(0, p - 1))}>
                <ChevronLeft className="size-4" />
              </Button>
              <Button size="icon" variant="outline" className="size-8" disabled={page >= totalPages - 1} onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}>
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      <Card className="overflow-hidden py-0 gap-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="w-10 pl-4">#</TableHead>
              <TableHead>Tài sản</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Phòng</TableHead>
              <TableHead className="text-right pr-4 w-24">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.map((asset, idx) => {
              const st = STATUS_MAP[asset.status] || STATUS_MAP.AVAILABLE;
              return (
                <TableRow key={asset.id} className="cursor-pointer hover:bg-muted/30" onClick={() => onDetail(asset)}>
                  <TableCell className="pl-4 text-muted-foreground text-xs">
                    {page * PER_SECTION + idx + 1}
                  </TableCell>
                  <TableCell>
                    <span className="font-medium text-sm">{asset.name}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-xs">
                      <span className={`size-2 rounded-full ${st.dot}`} />
                      <span className={`font-medium ${st.text}`}>{st.label}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {asset.room ? (
                      <span className="flex items-center gap-1"><DoorOpen className="size-3" /> {asset.room.room_number}</span>
                    ) : "Kho"}
                  </TableCell>
                  <TableCell className="pr-4">
                    <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                      <Button size="icon" variant="ghost" className="size-8 text-primary hover:bg-primary/10"
                        title="Xem QR" onClick={() => onQR(asset)}>
                        <QrCode className="size-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="size-8"
                        title="Chi tiết" onClick={() => onDetail(asset)}>
                        <Eye className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </section>
  );
}

/* ── Main Page ─────────────────────────────── */

export default function AssetsPage() {
  const [allAssets, setAllAssets] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const [showCreate, setShowCreate] = useState(false);
  const [detailAsset, setDetailAsset] = useState(null);
  const [qrAsset, setQrAsset] = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [assetRes, buildRes, roomRes] = await Promise.all([
        apiJson("/api/assets?limit=500"),
        apiJson("/api/buildings?limit=100"),
        apiJson("/api/rooms?limit=1000"),
      ]);
      setAllAssets(assetRes.data || []);
      setBuildings(buildRes.data || []);
      setRooms(roomRes.data || []);
    } catch {
      setError("Không thể tải dữ liệu.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  /* derived data */
  const filtered = useMemo(() => allAssets.filter((a) => {
    if (filterStatus !== "all" && a.status !== filterStatus) return false;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      if (!a.name?.toLowerCase().includes(q)) return false;
    }
    return true;
  }), [allAssets, filterStatus, search]);

  const buildingGroups = useMemo(() => {
    const grouped = {};
    for (const asset of filtered) {
      const bId = asset.building_id || "_none";
      const bName = asset.building?.name || "Chưa phân tòa nhà";
      if (!grouped[bId]) grouped[bId] = { name: bName, assets: [] };
      grouped[bId].assets.push(asset);
    }
    return Object.entries(grouped).sort(([, a], [, b]) => a.name.localeCompare(b.name, "vi"));
  }, [filtered]);

  const totalCount = allAssets.length;
  const statusCounts = useMemo(() => {
    const c = { AVAILABLE: 0, IN_USE: 0 };
    allAssets.forEach((a) => { if (c[a.status] !== undefined) c[a.status]++; });
    return c;
  }, [allAssets]);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3 pt-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tài sản</h1>
          <p className="text-sm text-muted-foreground">Theo dõi trang thiết bị và cơ sở vật chất</p>
        </div>
        <Button className="gap-1.5" onClick={() => setShowCreate(true)}>
          <Plus className="size-4" /> Thêm tài sản
        </Button>
      </div>

      {/* Summary */}
      <AssetSummary total={totalCount} statusCounts={statusCounts} />

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input placeholder="Tìm kiếm tài sản..." value={search}
            onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="flex gap-1.5">
          {[
            { key: "all", label: "Tất cả" },
            { key: "AVAILABLE", label: "Sẵn sàng" },
            { key: "IN_USE", label: "Đang sử dụng" },
          ].map((f) => (
            <Button key={f.key} size="sm"
              variant={filterStatus === f.key ? "default" : "outline"}
              onClick={() => setFilterStatus(f.key)}>
              {f.label}
            </Button>
          ))}
        </div>
      </div>

      {/* List grouped by building */}
      <div>
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="py-14 text-center">
            <p className="text-sm text-destructive">{error}</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={fetchAll}>Thử lại</Button>
          </div>
        ) : buildingGroups.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">Không tìm thấy tài sản nào.</div>
        ) : (
          <div className="space-y-8">
            {buildingGroups.map(([bId, group]) => (
              <BuildingSection
                key={bId}
                buildingName={group.name}
                assets={group.assets}
                onDetail={setDetailAsset}
                onQR={setQrAsset}
              />
            ))}
          </div>
        )}
      </div>

      {/* Batch create dialog */}
      <BatchCreateDialog
        open={showCreate}
        onOpenChange={setShowCreate}
        buildings={buildings}
        onSaved={fetchAll}
      />

      {/* Detail dialog */}
      <AssetDetailDialog
        open={!!detailAsset}
        onOpenChange={(v) => !v && setDetailAsset(null)}
        asset={detailAsset}
        buildings={buildings}
        rooms={rooms}
        onSaved={() => { setDetailAsset(null); fetchAll(); }}
        onDeleted={() => { setDetailAsset(null); fetchAll(); }}
      />

      {/* QR dialog */}
      <QRDialog
        open={!!qrAsset}
        onOpenChange={(v) => !v && setQrAsset(null)}
        asset={qrAsset}
      />
    </div>
  );
}
