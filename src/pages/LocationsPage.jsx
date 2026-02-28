import { useState, useEffect, useCallback } from "react";
import { Plus, Search, Pencil, Trash2, MapPin, ToggleLeft, ToggleRight, ChevronUp, ChevronDown, ChevronsUpDown, Loader2, Eye } from "lucide-react";
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
import { api } from "@/lib/api";

/* ── helpers ───────────────────────────────── */

const fmt = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return isNaN(d.getTime()) ? "—" : d.toLocaleDateString("vi-VN", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });
};

const EMPTY_FORM = { name: "", is_active: "true" };

function SortIcon({ field, sortField, sortDir }) {
  if (sortField !== field) return <ChevronsUpDown className="size-3.5 ml-1 opacity-40" />;
  return sortDir === "asc"
    ? <ChevronUp className="size-3.5 ml-1 text-primary" />
    : <ChevronDown className="size-3.5 ml-1 text-primary" />;
}

/* ── Location Detail Dialog (view / edit / delete) ── */

function LocationDetailDialog({ open, onOpenChange, location, onSave, onDelete, saving }) {
  const [editing, setEditing] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const [form, setForm] = useState(null);
  const [errors, setErrors] = useState({});

  // Reset mode when dialog opens
  useEffect(() => {
    if (open) {
      setEditing(false);
      setConfirmDel(false);
    }
  }, [open]);

  const startEdit = () => {
    setForm({
      name: location.name || "",
      is_active: String(location.isActive ?? true),
    });
    setErrors({});
    setEditing(true);
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = true;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSave(location.id, { name: form.name.trim(), is_active: form.is_active === "true" });
  };

  if (!location) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        {editing ? (
          /* ─── Edit mode ─── */
          <>
            <DialogHeader>
              <DialogTitle>Chỉnh sửa khu vực</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-1">
              <div className="space-y-1.5">
                <Label>Tên khu vực *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  className={errors.name ? "border-destructive" : ""}
                />
                {errors.name && (
                  <p className="text-[11px] text-destructive">Vui lòng nhập tên khu vực</p>
                )}
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
              <DialogTitle>Xóa khu vực</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground text-center py-2">
              Bạn có chắc muốn xóa khu vực{" "}
              <strong className="text-foreground">&quot;{location.name}&quot;</strong>?{" "}
              Hành động này không thể hoàn tác.
            </p>
            <DialogFooter className="justify-center gap-2 sm:justify-center">
              <Button variant="outline" onClick={() => setConfirmDel(false)}>Hủy</Button>
              <Button variant="destructive" disabled={saving} onClick={() => onDelete(location.id)}>
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
                {location.name}
                <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${
                  location.isActive
                    ? "bg-success/15 text-success"
                    : "bg-muted text-muted-foreground"
                }`}>
                  {location.isActive ? "Hoạt động" : "Không hoạt động"}
                </span>
              </DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-2">
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Ngày tạo</p>
                <p className="text-sm font-medium mt-0.5">{fmt(location.createdAt)}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Cập nhật</p>
                <p className="text-sm font-medium mt-0.5">{fmt(location.updatedAt)}</p>
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

/* ── Create Dialog ─────────────────────────── */

function LocationCreateDialog({ open, onOpenChange, onSave, saving }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (open) setForm(EMPTY_FORM);
  }, [open]);

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = true;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSave({ name: form.name.trim(), is_active: form.is_active === "true" });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Thêm khu vực mới</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <div className="space-y-1.5">
            <Label>Tên khu vực *</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="VD: Hà Nội"
              className={errors.name ? "border-destructive" : ""}
            />
            {errors.name && (
              <p className="text-[11px] text-destructive">Vui lòng nhập tên khu vực</p>
            )}
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
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
            <Button
              type="submit" disabled={saving}
              className="bg-success text-success-foreground hover:bg-success/90"
            >
              {saving && <Loader2 className="size-4 animate-spin mr-1.5" />}
              Thêm khu vực
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ── Main Page ─────────────────────────────── */

export default function LocationsPage() {
  const [locations, setLocations] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [filterActive, setFilterActive] = useState("all");
  const [sortField, setSortField] = useState(null);
  const [sortDir, setSortDir] = useState("asc");

  const [showCreate, setShowCreate] = useState(false);
  const [detailLoc, setDetailLoc] = useState(null);
  const [confirmToggle, setConfirmToggle] = useState(null);
  const [error, setError] = useState(null);

  const limit = 10;

  const fetchLocations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page, limit });
      if (search.trim()) params.set("search", search.trim());
      if (filterActive === "active") params.set("is_active", "true");
      if (filterActive === "inactive") params.set("is_active", "false");

      const res = await api.get(`/api/locations?${params}`);
      setLocations(res.data || []);
      setTotal(res.total || 0);
      setPage(res.page || 1);
      setTotalPages(res.totalPages || 1);
    } catch {
      setError("Không thể tải dữ liệu. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }, [page, search, filterActive]);

  useEffect(() => { fetchLocations(); }, [fetchLocations]);
  useEffect(() => { setPage(1); }, [search, filterActive]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const sorted = [...locations].sort((a, b) => {
    if (!sortField) return 0;
    const diff = new Date(a[sortField]) - new Date(b[sortField]);
    return sortDir === "asc" ? diff : -diff;
  });

  const activeCount = locations.filter((l) => l.isActive).length;

  /* ─ CRUD ─ */
  const handleCreate = async (data) => {
    setSaving(true);
    try {
      await api.post("/api/locations", data);
      setShowCreate(false);
      fetchLocations();
    } catch (err) {
      alert(err.message || "Đã xảy ra lỗi. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (id, data) => {
    setSaving(true);
    try {
      await api.put(`/api/locations/${id}`, data);
      setDetailLoc(null);
      fetchLocations();
    } catch (err) {
      alert(err.message || "Đã xảy ra lỗi. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    setSaving(true);
    try {
      await api.delete(`/api/locations/${id}`);
      setDetailLoc(null);
      fetchLocations();
    } catch (err) {
      alert(err.message || "Không thể xóa khu vực. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleConfirm = async () => {
    setSaving(true);
    try {
      await api.put(`/api/locations/${confirmToggle.id}`, {
        is_active: !confirmToggle.isActive,
      });
      setConfirmToggle(null);
      fetchLocations();
    } catch (err) {
      alert(err.message || "Không thể cập nhật trạng thái. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3 pt-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Khu vực</h1>
          <p className="text-sm text-muted-foreground">Quản lý các khu vực hoạt động của FScape</p>
        </div>
        <Button className="gap-1.5" onClick={() => setShowCreate(true)}>
          <Plus className="size-4" /> Thêm khu vực
        </Button>
      </div>

      {/* Summary card */}
      <Card className="py-0 gap-0 overflow-hidden">
        <div className="flex items-stretch">
          <div className="flex-1 flex items-center gap-4 px-6 py-5">
            <div className="flex items-center justify-center size-14 rounded-2xl bg-primary/10">
              <MapPin className="size-6 text-primary" />
            </div>
            <div>
              <p className="text-3xl font-bold tracking-tight">{total}</p>
              <p className="text-sm text-muted-foreground">Tổng khu vực</p>
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
                {locations.length - activeCount}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">Không hoạt động</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Search + filter */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm khu vực..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
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
            <Button variant="outline" size="sm" className="mt-3" onClick={fetchLocations}>
              Thử lại
            </Button>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12 pl-4">#</TableHead>
                  <TableHead>Tên khu vực</TableHead>
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
                  <TableHead
                    className="cursor-pointer select-none hover:text-foreground"
                    onClick={() => handleSort("updatedAt")}
                  >
                    <span className="inline-flex items-center">
                      Cập nhật
                      <SortIcon field="updatedAt" sortField={sortField} sortDir={sortDir} />
                    </span>
                  </TableHead>
                  <TableHead className="text-right pr-4">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-14 text-center text-muted-foreground">
                      Không tìm thấy khu vực nào.
                    </TableCell>
                  </TableRow>
                ) : (
                  sorted.map((loc, idx) => (
                    <TableRow key={loc.id}>
                      <TableCell className="pl-4 text-muted-foreground text-xs">
                        {(page - 1) * limit + idx + 1}
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{loc.name}</span>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full ${
                            loc.isActive
                              ? "bg-success/15 text-success"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          <span
                            className={`size-2 rounded-full shrink-0 ${
                              loc.isActive ? "bg-success" : "bg-muted-foreground/40"
                            }`}
                          />
                          {loc.isActive ? "Hoạt động" : "Không hoạt động"}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {fmt(loc.createdAt)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {fmt(loc.updatedAt)}
                      </TableCell>
                      <TableCell className="pr-4">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="icon" variant="ghost"
                            className={`size-8 ${loc.isActive ? "text-success hover:text-success/80" : "text-muted-foreground"}`}
                            title={loc.isActive ? "Tắt hoạt động" : "Bật hoạt động"}
                            onClick={() => setConfirmToggle(loc)}
                          >
                            {loc.isActive
                              ? <ToggleRight className="size-5" />
                              : <ToggleLeft className="size-5" />}
                          </Button>
                          <Button
                            size="icon" variant="ghost" className="size-8"
                            title="Chi tiết"
                            onClick={() => setDetailLoc(loc)}
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
                  Trang {page} / {totalPages} ({total} khu vực)
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
      <LocationDetailDialog
        open={!!detailLoc}
        onOpenChange={(v) => !v && setDetailLoc(null)}
        location={detailLoc}
        onSave={handleUpdate}
        onDelete={handleDelete}
        saving={saving}
      />

      {/* Create dialog */}
      <LocationCreateDialog
        open={showCreate}
        onOpenChange={setShowCreate}
        onSave={handleCreate}
        saving={saving}
      />

      {/* Confirm toggle */}
      <Dialog open={!!confirmToggle} onOpenChange={(v) => !v && setConfirmToggle(null)}>
        <DialogContent className="max-w-sm text-center">
          <DialogHeader>
            <DialogTitle>
              {confirmToggle?.isActive ? "Tắt khu vực" : "Bật khu vực"}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {confirmToggle?.isActive
              ? <>Bạn có chắc muốn <strong className="text-foreground">tắt hoạt động</strong> khu vực <strong className="text-foreground">&quot;{confirmToggle?.name}&quot;</strong>?</>
              : <>Bạn có chắc muốn <strong className="text-foreground">bật hoạt động</strong> khu vực <strong className="text-foreground">&quot;{confirmToggle?.name}&quot;</strong>?</>
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
