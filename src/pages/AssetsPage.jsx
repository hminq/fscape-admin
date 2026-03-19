import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Plus, MagnifyingGlass, Package, Trash, CircleNotch, PencilSimple, QrCode,
  Buildings, CaretLeft, CaretRight, DownloadSimple, Printer,
  Door, Eye, CheckCircle
} from "@phosphor-icons/react";
import { toast } from "sonner";
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
import { apiJson, api } from "@/lib/apiClient";
import { formatDate as fmt } from "@/lib/utils";

const STATUS_MAP = {
  AVAILABLE: { label: "Sẵn sàng", dot: "bg-success", text: "text-success" },
  IN_USE: { label: "Đang sử dụng", dot: "bg-primary", text: "text-primary" },
};

/* ── Status Bar (straight bar, filter-reactive) ── */

function AssetStatusBar({ byStatus, total = 0, filter = "all" }) {
  const hasData = byStatus != null;
  const available = filter === "all" ? (byStatus?.available || 0) : filter === "AVAILABLE" ? (byStatus?.available || 0) : 0;
  const inUse = filter === "all" ? (byStatus?.in_use || 0) : filter === "IN_USE" ? (byStatus?.in_use || 0) : 0;
  const filteredTotal = filter === "all" ? total : filter === "AVAILABLE" ? (byStatus?.available || 0) : (byStatus?.in_use || 0);

  const pAvail = filteredTotal > 0 ? (available / filteredTotal) * 100 : 0;
  const pInUse = filteredTotal > 0 ? (inUse / filteredTotal) * 100 : 0;

  return (
    <div className="flex-1 min-w-[180px] space-y-2.5">
      <div className="flex items-center text-xs">
        <span className="text-muted-foreground">Trạng thái</span>
      </div>
      <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden flex">
        <div className="h-full bg-success transition-all duration-500" style={{ width: `${pAvail}%` }} />
        <div className="h-full bg-primary transition-all duration-500" style={{ width: `${pInUse}%` }} />
      </div>
      <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
        {!hasData && <span className="flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-muted-foreground/30" /> Đang chờ dữ liệu...</span>}
        {hasData && filteredTotal === 0 && <span className="flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-muted-foreground/30" /> 0 tài sản</span>}
        {available > 0 && <span className="flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-success" /> {Math.round(pAvail)}% Sẵn sàng ({available})</span>}
        {inUse > 0 && <span className="flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-primary" /> {Math.round(pInUse)}% Đang sử dụng ({inUse})</span>}
      </div>
    </div>
  );
}

function AssetSummary({ stats, filterStatus }) {
  const total = stats?.total || 0;
  const byStatus = stats?.by_status || null;
  const filteredTotal = !byStatus ? 0
    : filterStatus === "all" ? total
      : filterStatus === "AVAILABLE" ? (byStatus.available || 0)
        : (byStatus.in_use || 0);

  return (
    <div className="rounded-2xl border border-border bg-card">
      <div className="flex items-center gap-6 p-5 flex-wrap">
        <div className="flex items-center gap-4 min-w-[140px]">
          <div className="size-11 rounded-xl bg-primary/8 flex items-center justify-center shrink-0">
            <Package className="size-5 text-primary" />
          </div>
          <div>
            <p className="text-3xl font-bold leading-none tracking-tight">{filteredTotal}</p>
            <p className="text-sm text-muted-foreground mt-1">Tài sản</p>
          </div>
        </div>
        <div className="w-px h-14 bg-border shrink-0" />
        <AssetStatusBar byStatus={byStatus} total={total} filter={filterStatus} />
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
            <DownloadSimple className="size-4" /> Tải về
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
    if (!form.name?.trim()) errs.name = "Vui lòng nhập tên tài sản";
    if (!form.building_id) errs.building_id = "Vui lòng chọn tòa nhà";
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSaving(true);
    setErrors({});
    try {
      const body = {
        name: form.name.trim(),
        building_id: form.building_id,
        current_room_id: form.current_room_id || null,
        status: form.status,
        notes: form.notes?.trim() || undefined,
      };
      await apiJson(`/api/assets/${asset.id}`, {
        method: "PUT",
        body,
      });
      toast.success("Cập nhật tài sản thành công");
      window.dispatchEvent(new CustomEvent("asset-updated", { detail: { id: asset.id, updates: body } }));
      onSaved();
    } catch (err) {
      setErrors({ root: err.message || "Đã xảy ra lỗi khi cập nhật." });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await apiJson(`/api/assets/${asset.id}`, { method: "DELETE" });
      toast.success("Đã xóa tài sản");
      window.dispatchEvent(new CustomEvent("asset-deleted", { detail: { id: asset.id } }));
      onDeleted();
    } catch (err) {
      toast.error(err.message || "Không thể xóa.");
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
                <Label className={errors.name ? "text-destructive" : ""}>Tên tài sản *</Label>
                <Input value={form.name || ""} onChange={(e) => set("name", e.target.value)}
                  className={errors.name ? "border-destructive" : ""} />
                {errors.name && <p className="text-[10px] text-destructive font-medium">{errors.name}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className={errors.building_id ? "text-destructive" : ""}>Tòa nhà *</Label>
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
                  {errors.building_id && <p className="text-[10px] text-destructive font-medium">{errors.building_id}</p>}
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

              {errors.root && (
                <p className="text-[11px] text-destructive font-medium bg-destructive/5 p-2 rounded-lg border border-destructive/10 text-center">
                  {errors.root}
                </p>
              )}

              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" onClick={() => setEditing(false)}>Hủy</Button>
                <Button type="submit" disabled={saving}>
                  {saving ? <CircleNotch className="size-4 animate-spin mr-1.5" /> : <CheckCircle className="size-4 mr-1.5" />}
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
                {saving && <CircleNotch className="size-4 animate-spin mr-1.5" />}
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
                    <Buildings className="size-3.5 text-muted-foreground" />
                    <p className="text-[11px] text-muted-foreground">Tòa nhà</p>
                  </div>
                  <p className="text-sm font-semibold">{asset.building?.name || "—"}</p>
                </div>
                <div className="rounded-lg border border-border/50 bg-muted/30 p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Door className="size-3.5 text-muted-foreground" />
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
                <Trash className="size-3.5" /> Xóa
              </Button>
              <Button size="sm" className="gap-1.5" onClick={startEdit}>
                <PencilSimple className="size-3.5" /> Chỉnh sửa
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
    if (!form.asset_type_id) e.asset_type_id = "Vui lòng chọn loại tài sản";
    if (!form.building_id) e.building_id = "Vui lòng chọn tòa nhà";
    const qty = Number(form.quantity);
    if (!qty || qty < 1 || qty > 100) e.quantity = "Số lượng từ 1–100";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setSaving(true);
    setErrors({});
    try {
      const body = {
        name: selectedType?.name || "Asset",
        building_id: form.building_id,
        asset_type_id: form.asset_type_id,
        quantity: Number(form.quantity),
      };
      const res = await apiJson("/api/assets/batch", { method: "POST", body });
      toast.success(`Đã tạo thành công ${res.count} tài sản`);
      window.dispatchEvent(new CustomEvent("asset-created"));
      setResult(res);
    } catch (err) {
      setErrors({ root: err.message || "Đã xảy ra lỗi." });
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
                {selectedType.default_price ? Number(selectedType.default_price).toLocaleString("vi-VN") + " ₫" : "—"}
              </p>
            )}
            {errors.asset_type_id && <p className="text-[10px] text-destructive font-medium">{errors.asset_type_id}</p>}
          </div>

          <div className="space-y-1.5">
            <Label className={errors.building_id ? "text-destructive" : ""}>Tòa nhà *</Label>
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
            {errors.building_id && <p className="text-[10px] text-destructive font-medium">{errors.building_id}</p>}
          </div>

          <div className="space-y-1.5">
            <Label className={errors.quantity ? "text-destructive" : ""}>Số lượng *</Label>
            <Input type="number" min="1" max="100"
              value={form.quantity}
              onChange={(e) => set("quantity", e.target.value)}
              className={errors.quantity ? "border-destructive" : ""} />
            {errors.quantity && <p className="text-[10px] text-destructive font-medium">{errors.quantity}</p>}
          </div>

          {errors.root && (
            <p className="text-[11px] text-destructive font-medium bg-destructive/5 p-2 rounded-lg border border-destructive/10 text-center">
              {errors.root}
            </p>
          )}

          <div className="rounded-lg bg-muted/50 p-3 space-y-1 text-xs text-muted-foreground">
            <p>• Tên tài sản lấy từ loại tài sản đã chọn</p>
            <p>• Mỗi tài sản được gán mã QR duy nhất (FSCAPE-AST-...)</p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
            <Button type="submit" disabled={saving} className="gap-1.5">
              {saving ? <CircleNotch className="size-4 animate-spin" /> : <Plus className="size-4" />}
              Tạo {Number(form.quantity) > 1 ? `${form.quantity} tài sản` : "tài sản"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ── Per-building asset section with independent pagination ── */

const PER_SECTION = 8;

function BuildingAssetSection({ building, search, statusFilter, onDetail, onQR, refreshKey }) {
  const [assets, setAssets] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchAssets = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page,
        limit: PER_SECTION,
        building_id: building.id,
      });
      if (search.trim()) params.set("search", search.trim());
      if (statusFilter !== "all") params.set("status", statusFilter);

      const res = await api.get(`/api/assets?${params}`);
      setAssets(res.data || []);
      setTotal(res.total || 0);
      setTotalPages(res.total_pages || res.totalPages || 1);
    } catch {
      setAssets([]);
    } finally {
      setLoading(false);
    }
  }, [building.id, page, search, statusFilter, refreshKey]);

  useEffect(() => { fetchAssets(); }, [fetchAssets]);
  useEffect(() => { setPage(1); }, [search, statusFilter]);

  useEffect(() => {
    const handleUpdate = (e) => {
      const { id, updates } = e.detail;
      setAssets((prev) => prev.map(a => String(a.id) === String(id) ? { ...a, ...updates, updated_at: new Date().toISOString() } : a));
    };
    const handleDelete = (e) => {
      const { id } = e.detail;
      setAssets((prev) => prev.filter(a => String(a.id) !== String(id)));
    };
    const handleCreate = () => {
      if (page === 1) fetchAssets();
    };

    window.addEventListener("asset-updated", handleUpdate);
    window.addEventListener("asset-deleted", handleDelete);
    window.addEventListener("asset-created", handleCreate);
    return () => {
      window.removeEventListener("asset-updated", handleUpdate);
      window.removeEventListener("asset-deleted", handleDelete);
      window.removeEventListener("asset-created", handleCreate);
    };
  }, [fetchAssets, page]);

  if (!loading && assets.length === 0) return null;

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="size-7 rounded-lg bg-primary/8 flex items-center justify-center">
            <Buildings className="size-3.5 text-primary" />
          </div>
          <h2 className="text-[15px] font-semibold">{building.name}</h2>
          <span className="text-sm font-medium text-muted-foreground">{total} tài sản</span>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-sm font-medium">{page}/{totalPages}</span>
            <div className="flex items-center gap-1">
              <Button size="icon" variant="outline" className="size-8" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                <CaretLeft className="size-4" />
              </Button>
              <Button size="icon" variant="outline" className="size-8" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                <CaretRight className="size-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-10">
          <CircleNotch className="size-6 animate-spin text-muted-foreground/40" />
        </div>
      ) : (
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
              {assets.map((asset, idx) => {
                const st = STATUS_MAP[asset.status] || STATUS_MAP.AVAILABLE;
                return (
                  <TableRow key={asset.id} className="cursor-pointer hover:bg-muted/30" onClick={() => onDetail(asset)}>
                    <TableCell className="pl-4 text-muted-foreground text-xs">
                      {(page - 1) * PER_SECTION + idx + 1}
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
                        <span className="flex items-center gap-1"><Door className="size-3" /> {asset.room.room_number}</span>
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
      )}
    </section>
  );
}

/* ── Main Page ─────────────────────────────── */

export default function AssetsPage() {
  const [buildings, setBuildings] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [stats, setStats] = useState(null);
  const [loadingInit, setLoadingInit] = useState(true);

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const [showCreate, setShowCreate] = useState(false);
  const [detailAsset, setDetailAsset] = useState(null);
  const [qrAsset, setQrAsset] = useState(null);

  const [refreshKey, setRefreshKey] = useState(0);

  const fetchStats = () => {
    api.get("/api/assets/stats")
      .then(res => setStats(res.data || res))
      .catch(console.error);
  };

  useEffect(() => {
    Promise.all([
      api.get("/api/buildings?limit=100"),
      api.get("/api/rooms?limit=1000"),
      api.get("/api/assets/stats"),
    ]).then(([bRes, rRes, sRes]) => {
      setBuildings(bRes.data || bRes);
      setRooms(rRes.data || rRes);
      setStats(sRes.data || sRes);
    }).catch(console.error)
      .finally(() => setLoadingInit(false));
  }, []);

  const handleSaved = () => {
    setDetailAsset(null);
    fetchStats();
    setRefreshKey(k => k + 1);
  };

  const handleDeleted = () => {
    setDetailAsset(null);
    fetchStats();
    setRefreshKey(k => k + 1);
  };

  const handleBatchCreated = () => {
    fetchStats();
    setRefreshKey(k => k + 1);
  };

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
      <AssetSummary stats={stats} filterStatus={filterStatus} />

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
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

      {/* Content — per-building sections */}
      {loadingInit ? (
        <div className="flex items-center justify-center py-20">
          <CircleNotch className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : buildings.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">Không tìm thấy tòa nhà nào.</div>
      ) : (
        <div className="space-y-8">
          {buildings.map((b) => (
            <BuildingAssetSection
              key={b.id}
              building={b}
              search={search}
              statusFilter={filterStatus}
              onDetail={setDetailAsset}
              onQR={setQrAsset}
              refreshKey={refreshKey}
            />
          ))}
        </div>
      )}

      {/* Batch create dialog */}
      <BatchCreateDialog
        open={showCreate}
        onOpenChange={setShowCreate}
        buildings={buildings}
        onSaved={handleBatchCreated}
      />

      {/* Detail dialog */}
      <AssetDetailDialog
        open={!!detailAsset}
        onOpenChange={(v) => !v && setDetailAsset(null)}
        asset={detailAsset}
        buildings={buildings}
        rooms={rooms}
        onSaved={handleSaved}
        onDeleted={handleDeleted}
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
