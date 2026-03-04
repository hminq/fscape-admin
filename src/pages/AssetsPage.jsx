import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Plus, Search, Package, Trash2, Loader2, Pencil, QrCode,
  Building2, ChevronLeft, ChevronRight, Download, Printer,
  DoorOpen,
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

/* ── helpers ───────────────────────────────── */

const fmt = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return isNaN(d.getTime()) ? "—" : d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
};

const fmtVND = (v) => {
  if (!v && v !== 0) return "—";
  return Number(v).toLocaleString("vi-VN") + " ₫";
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

/* ── StatusDonutChart (multi-segment) ──────── */

function StatusDonutChart({ counts, size = 72 }) {
  const entries = STATUS_ORDER.map((s) => [s, counts[s] || 0]).filter(([, v]) => v > 0);
  const total = entries.reduce((s, [, v]) => s + v, 0);
  const r = 36;
  const circ = 2 * Math.PI * r;

  let accumulated = 0;
  const segments = entries.map(([status, count]) => {
    const len = total > 0 ? (count / total) * circ : 0;
    const seg = { status, len, offset: circ - accumulated, cls: STATUS_STROKE[status] || "stroke-muted" };
    accumulated += len;
    return seg;
  });

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" className="size-full -rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" strokeWidth="10" className="stroke-muted" />
        {segments.map((seg) => (
          <circle key={seg.status} cx="50" cy="50" r={r} fill="none" strokeWidth="10"
            strokeDasharray={`${seg.len} ${circ - seg.len}`}
            strokeDashoffset={seg.offset}
            className={`${seg.cls} transition-all duration-500`} />
        ))}
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[10px] font-bold leading-none">{total}</span>
      </div>
    </div>
  );
}

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
          <StatusDonutChart counts={statusCounts} size={64} />
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

/* ── Create / Edit Asset Dialog ────────────── */

function AssetFormDialog({ open, onOpenChange, mode, initialData, buildings, rooms, onSaved }) {
  const [form, setForm] = useState({});
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (mode === "edit" && initialData) {
      setForm({
        name: initialData.name || "",
        qr_code: initialData.qr_code || "",
        building_id: initialData.building_id || "",
        current_room_id: initialData.current_room_id || "",
        price: initialData.price ?? "",
        status: initialData.status || "AVAILABLE",
        notes: initialData.notes || "",
      });
    } else {
      setForm({ name: "", qr_code: "", building_id: "", current_room_id: "", price: "", status: "AVAILABLE", notes: "" });
    }
    setErrors({});
  }, [open, mode, initialData]);

  const set = (k, v) => {
    setForm((p) => ({ ...p, [k]: v }));
    if (errors[k]) setErrors((p) => ({ ...p, [k]: undefined }));
  };

  const filteredRooms = useMemo(() => {
    if (!form.building_id) return [];
    return rooms.filter((r) => r.building_id === form.building_id);
  }, [rooms, form.building_id]);

  const validate = () => {
    const e = {};
    if (!form.name?.trim()) e.name = true;
    if (!form.qr_code?.trim()) e.qr_code = true;
    if (!form.building_id) e.building_id = true;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const body = {
        name: form.name.trim(),
        qr_code: form.qr_code.trim(),
        building_id: form.building_id,
        current_room_id: form.current_room_id || null,
        price: form.price ? Number(form.price) : null,
        status: form.status,
        notes: form.notes?.trim() || null,
      };

      if (mode === "edit") {
        await apiJson(`/api/assets/${initialData.id}`, { method: "PUT", body });
      } else {
        await apiJson("/api/assets", { method: "POST", body });
      }
      onSaved();
    } catch (err) {
      alert(err.message || "Đã xảy ra lỗi.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{mode === "edit" ? "Chỉnh sửa tài sản" : "Thêm tài sản mới"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Tên tài sản *</Label>
              <Input value={form.name || ""} onChange={(e) => set("name", e.target.value)}
                placeholder="VD: Điều hòa Funiki 9000BTU"
                className={errors.name ? "border-destructive" : ""} />
            </div>
            <div className="space-y-1.5">
              <Label>Mã QR *</Label>
              <Input value={form.qr_code || ""} onChange={(e) => set("qr_code", e.target.value)}
                placeholder="VD: ASSET-AC-001"
                className={errors.qr_code ? "border-destructive" : ""} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Tòa nhà *</Label>
              <Select value={form.building_id || ""} onValueChange={(v) => { set("building_id", v); setForm((p) => ({ ...p, current_room_id: "" })); }}>
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
              <Select value={form.current_room_id || ""} onValueChange={(v) => set("current_room_id", v)}
                disabled={!form.building_id}>
                <SelectTrigger>
                  <SelectValue placeholder={form.building_id ? "Chọn phòng (hoặc bỏ trống = Kho)" : "Chọn tòa nhà trước"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Kho (không gán phòng)</SelectItem>
                  {filteredRooms.map((r) => (
                    <SelectItem key={r.id} value={r.id}>Phòng {r.room_number}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Giá trị (VNĐ)</Label>
              <Input type="number" value={form.price ?? ""} onChange={(e) => set("price", e.target.value)}
                placeholder="VD: 6500000" />
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
          </div>

          <div className="space-y-1.5">
            <Label>Ghi chú</Label>
            <Textarea value={form.notes || ""} onChange={(e) => set("notes", e.target.value)}
              placeholder="Ghi chú thêm về tài sản..." rows={2} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
            <Button type="submit" disabled={saving}
              className="bg-success text-success-foreground hover:bg-success/90">
              {saving && <Loader2 className="size-4 animate-spin mr-1.5" />}
              {mode === "edit" ? "Lưu thay đổi" : "Thêm tài sản"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ── Building Section (grouped table) ──────── */

const PER_SECTION = 8;

function BuildingSection({ buildingName, assets, onEdit, onDelete, onQR }) {
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
          <span className="text-xs text-muted-foreground">({assets.length})</span>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground mr-1">{page + 1}/{totalPages}</span>
            <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}
              className="size-7 rounded-md border border-border flex items-center justify-center hover:bg-muted disabled:opacity-30">
              <ChevronLeft className="size-3.5" />
            </button>
            <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
              className="size-7 rounded-md border border-border flex items-center justify-center hover:bg-muted disabled:opacity-30">
              <ChevronRight className="size-3.5" />
            </button>
          </div>
        )}
      </div>

      <Card className="overflow-hidden py-0 gap-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10 pl-4">#</TableHead>
              <TableHead>Tài sản</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Phòng</TableHead>
              <TableHead>Giá trị</TableHead>
              <TableHead className="text-right pr-4 w-28">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.map((asset, idx) => {
              const st = STATUS_MAP[asset.status] || STATUS_MAP.AVAILABLE;
              return (
                <TableRow key={asset.id}>
                  <TableCell className="pl-4 text-muted-foreground text-xs">
                    {page * PER_SECTION + idx + 1}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium text-sm">{asset.name}</span>
                      <span className="text-[11px] text-muted-foreground font-mono">{asset.qr_code}</span>
                    </div>
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
                  <TableCell className="text-sm text-muted-foreground">{fmtVND(asset.price)}</TableCell>
                  <TableCell className="pr-4">
                    <div className="flex items-center justify-end gap-1">
                      <Button size="icon" variant="ghost" className="size-8 text-primary hover:bg-primary/10"
                        title="Xem QR" onClick={() => onQR(asset)}>
                        <QrCode className="size-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="size-8"
                        title="Chỉnh sửa" onClick={() => onEdit(asset)}>
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="size-8 text-destructive hover:bg-destructive/10"
                        title="Xóa" onClick={() => onDelete(asset)}>
                        <Trash2 className="size-3.5" />
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
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const [formDialog, setFormDialog] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);
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
      if (
        !a.name?.toLowerCase().includes(q) &&
        !a.qr_code?.toLowerCase().includes(q)
      ) return false;
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

  /* actions */
  const handleDelete = async () => {
    setSaving(true);
    try {
      await apiJson(`/api/assets/${confirmDel.id}`, { method: "DELETE" });
      setConfirmDel(null);
      fetchAll();
    } catch (err) {
      alert(err.message || "Không thể xóa.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3 pt-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tài sản</h1>
          <p className="text-sm text-muted-foreground">Theo dõi trang thiết bị và cơ sở vật chất</p>
        </div>
        <Button className="gap-1.5" onClick={() => setFormDialog({ mode: "create" })}>
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
                onEdit={(a) => setFormDialog({ mode: "edit", data: a })}
                onDelete={setConfirmDel}
                onQR={setQrAsset}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create / Edit dialog */}
      {formDialog && (
        <AssetFormDialog
          open={!!formDialog}
          onOpenChange={(v) => !v && setFormDialog(null)}
          mode={formDialog.mode}
          initialData={formDialog.data}
          buildings={buildings}
          rooms={rooms}
          onSaved={() => { setFormDialog(null); fetchAll(); }}
        />
      )}

      {/* QR dialog */}
      <QRDialog
        open={!!qrAsset}
        onOpenChange={(v) => !v && setQrAsset(null)}
        asset={qrAsset}
      />

      {/* Confirm delete */}
      <Dialog open={!!confirmDel} onOpenChange={(v) => !v && setConfirmDel(null)}>
        <DialogContent className="max-w-sm text-center">
          <DialogHeader>
            <DialogTitle>Xóa tài sản</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Bạn có chắc muốn xóa tài sản <strong className="text-foreground">&quot;{confirmDel?.name}&quot;</strong>?
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
