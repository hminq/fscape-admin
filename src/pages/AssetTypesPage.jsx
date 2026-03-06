import { useState, useEffect, useCallback } from "react";
import {
    Plus, Search, Pencil, Trash2, Package, ToggleLeft, ToggleRight,
    ChevronUp, ChevronDown, ChevronsUpDown, Loader2, Eye, Banknote,
    ChevronLeft, ChevronRight,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Table, TableBody, TableCell, TableHead,
    TableHeader, TableRow,
} from "@/components/ui/table";
import {
    Dialog, DialogContent, DialogHeader,
    DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { api } from "@/lib/apiClient";

/* ── helpers ───────────────────────────────── */

const fmt = (iso) => {
    if (!iso) return "—";
    const d = new Date(iso);
    return isNaN(d.getTime()) ? "—" : d.toLocaleDateString("vi-VN", {
        day: "2-digit", month: "2-digit", year: "numeric",
    });
};

const fmtPrice = (v) => {
    if (v == null || v === "") return "—";
    return Number(v).toLocaleString("vi-VN") + " ₫";
};

const EMPTY_FORM = {
    name: "",
    description: "",
    default_price: "",
};

function SortIcon({ field, sortField, sortDir }) {
    if (sortField !== field) return <ChevronsUpDown className="size-3.5 ml-1 opacity-40" />;
    return sortDir === "asc"
        ? <ChevronUp className="size-3.5 ml-1 text-primary" />
        : <ChevronDown className="size-3.5 ml-1 text-primary" />;
}

/* ── DonutChart ─────────────────────────────── */

function DonutChart({ active, inactive, size = 72 }) {
    const total = active + inactive;
    const pct = total > 0 ? (active / total) * 100 : 0;
    const r = 36;
    const circ = 2 * Math.PI * r;
    const offset = circ - (pct / 100) * circ;

    return (
        <div className="relative" style={{ width: size, height: size }}>
            <svg viewBox="0 0 100 100" className="size-full -rotate-90">
                <circle cx="50" cy="50" r={r} fill="none" strokeWidth="10" className="stroke-muted" />
                <circle cx="50" cy="50" r={r} fill="none" strokeWidth="10"
                    strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
                    className="stroke-success transition-all duration-500" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[10px] font-bold leading-none">{total > 0 ? Math.round(pct) : 0}%</span>
            </div>
        </div>
    );
}

function AssetTypeSummary({ total, active, inactive }) {
    return (
        <div className="rounded-2xl border border-border bg-card">
            <div className="flex items-center gap-6 p-5">
                <div className="flex items-center gap-4 flex-1">
                    <div className="size-11 rounded-xl bg-primary/8 flex items-center justify-center shrink-0">
                        <Package className="size-5 text-primary" />
                    </div>
                    <div>
                        <p className="text-3xl font-bold leading-none tracking-tight">{total}</p>
                        <p className="text-sm text-muted-foreground mt-1">Loại tài sản</p>
                    </div>
                </div>
                <div className="w-px h-14 bg-border shrink-0" />
                <div className="flex items-center gap-4">
                    <DonutChart active={active} inactive={inactive} size={64} />
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <span className="size-2 rounded-full bg-success shrink-0" />
                            <span className="text-xs text-muted-foreground">Hoạt động</span>
                            <span className="text-xs font-semibold ml-auto pl-2">{active}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="size-2 rounded-full bg-muted-foreground/30 shrink-0" />
                            <span className="text-xs text-muted-foreground">Vô hiệu hóa</span>
                            <span className="text-xs font-semibold ml-auto pl-2">{inactive}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ── Shared form fields ────────────────────── */

function AssetTypeFormFields({ form, setForm, errors }) {
    const set = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }));

    return (
        <>
            <div className="space-y-1.5">
                <Label>Tên loại tài sản *</Label>
                <Input
                    value={form.name}
                    onChange={set("name")}
                    placeholder="VD: Giường, Bàn, Tủ..."
                    className={errors.name ? "border-destructive" : ""}
                />
                {errors.name && <p className="text-[11px] text-destructive">Vui lòng nhập tên</p>}
            </div>

            <div className="space-y-1.5">
                <Label>Mô tả</Label>
                <Textarea
                    value={form.description}
                    onChange={set("description")}
                    placeholder="Mô tả ngắn gọn..."
                    rows={2}
                />
            </div>

            <div className="space-y-1.5">
                <Label>Giá mặc định (₫)</Label>
                <Input
                    type="number" min="0" step="1000"
                    value={form.default_price}
                    onChange={set("default_price")}
                    placeholder="0"
                    className={errors.default_price ? "border-destructive" : ""}
                />
                {errors.default_price && <p className="text-[11px] text-destructive">{errors.default_price}</p>}
            </div>
        </>
    );
}

function validateForm(form) {
    const e = {};
    if (!form.name.trim()) e.name = true;
    if (form.default_price !== "" && Number(form.default_price) < 0) e.default_price = "Giá phải >= 0";
    return e;
}

function formToPayload(form) {
    return {
        name: form.name.trim(),
        description: form.description.trim() || null,
        default_price: form.default_price !== "" ? Number(form.default_price) : 0,
    };
}

/* ── Detail Dialog (view / edit) ── */

function AssetTypeDetailDialog({ open, onOpenChange, assetType, onSave, onDelete, saving }) {
    const [editing, setEditing] = useState(false);
    const [confirmDel, setConfirmDel] = useState(false);
    const [form, setForm] = useState(null);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (open) { setEditing(false); setConfirmDel(false); }
    }, [open]);

    const startEdit = () => {
        setForm({
            name: assetType.name || "",
            description: assetType.description || "",
            default_price: assetType.default_price ?? "",
        });
        setErrors({});
        setEditing(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const errs = validateForm(form);
        setErrors(errs);
        if (Object.keys(errs).length > 0) return;
        onSave(assetType.id, formToPayload(form));
    };

    if (!assetType) return null;
    const at = assetType;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                {editing ? (
                    <>
                        <DialogHeader>
                            <DialogTitle>Chỉnh sửa loại tài sản</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-3 pt-1">
                            <AssetTypeFormFields form={form} setForm={setForm} errors={errors} />
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
                            <DialogTitle>Vô hiệu hóa loại tài sản</DialogTitle>
                        </DialogHeader>
                        <p className="text-sm text-muted-foreground text-center py-2">
                            Bạn có chắc muốn vô hiệu hóa loại tài sản{" "}
                            <strong className="text-foreground">&quot;{at.name}&quot;</strong>?
                        </p>
                        <DialogFooter className="justify-center gap-2">
                            <Button variant="outline" onClick={() => setConfirmDel(false)}>Hủy</Button>
                            <Button variant="destructive" disabled={saving} onClick={() => onDelete(at.id)}>
                                {saving && <Loader2 className="size-4 animate-spin mr-1.5" />}
                                Vô hiệu hóa
                            </Button>
                        </DialogFooter>
                    </>
                ) : (
                    <>
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2.5">
                                {at.name}
                                <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${at.is_active
                                    ? "bg-success/15 text-success"
                                    : "bg-muted text-muted-foreground"
                                    }`}>
                                    {at.is_active ? "Hoạt động" : "Vô hiệu"}
                                </span>
                            </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-2">
                            {at.description && (
                                <div>
                                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Mô tả</p>
                                    <p className="text-sm mt-0.5">{at.description}</p>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-3">
                                <div className="rounded-lg border border-border/50 bg-muted/30 p-3">
                                    <div className="flex items-center gap-1.5 mb-1">
                                        <Banknote className="size-3.5 text-muted-foreground" />
                                        <p className="text-[11px] text-muted-foreground">Giá mặc định</p>
                                    </div>
                                    <p className="text-sm font-semibold">{fmtPrice(at.default_price)}</p>
                                </div>
                                <div className="rounded-lg border border-border/50 bg-muted/30 p-3">
                                    <div className="flex items-center gap-1.5 mb-1">
                                        <Package className="size-3.5 text-muted-foreground" />
                                        <p className="text-[11px] text-muted-foreground">Trạng thái</p>
                                    </div>
                                    <p className="text-sm font-semibold">{at.is_active ? "Hoạt động" : "Vô hiệu"}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Ngày tạo</p>
                                    <p className="text-sm font-medium mt-0.5">{fmt(at.created_at)}</p>
                                </div>
                                <div>
                                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Cập nhật</p>
                                    <p className="text-sm font-medium mt-0.5">{fmt(at.updated_at)}</p>
                                </div>
                            </div>
                        </div>
                        <DialogFooter className="gap-2 sm:justify-between">
                            <Button
                                variant="outline" size="sm"
                                className="text-destructive hover:bg-destructive/10 gap-1.5"
                                onClick={() => setConfirmDel(true)}
                            >
                                <Trash2 className="size-3.5" /> Vô hiệu hóa
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

function AssetTypeCreateDialog({ open, onOpenChange, onSave, saving }) {
    const [form, setForm] = useState(EMPTY_FORM);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (open) { setForm(EMPTY_FORM); setErrors({}); }
    }, [open]);

    const handleSubmit = (e) => {
        e.preventDefault();
        const errs = validateForm(form);
        setErrors(errs);
        if (Object.keys(errs).length > 0) return;
        onSave(formToPayload(form));
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Thêm loại tài sản mới</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-3 pt-1">
                    <AssetTypeFormFields form={form} setForm={setForm} errors={errors} />
                    <DialogFooter className="pt-2">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
                        <Button type="submit" disabled={saving}>
                            {saving && <Loader2 className="size-4 animate-spin mr-1.5" />}
                            Thêm loại tài sản
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

/* ── Main Page ─────────────────────────────── */

export default function AssetTypesPage() {
    const [types, setTypes] = useState([]);
    const [total, setTotal] = useState(0);
    const [totalActive, setTotalActive] = useState(0);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [search, setSearch] = useState("");
    const [filterActive, setFilterActive] = useState("all");
    const [sortField, setSortField] = useState(null);
    const [sortDir, setSortDir] = useState("asc");

    const [showCreate, setShowCreate] = useState(false);
    const [detailType, setDetailType] = useState(null);
    const [confirmToggle, setConfirmToggle] = useState(null);
    const [error, setError] = useState(null);
    const [msgDialog, setMsgDialog] = useState(null);

    const limit = 10;

    const fetchTypes = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams({ page, limit });
            if (search.trim()) params.set("search", search.trim());
            if (filterActive === "active") params.set("is_active", "true");
            if (filterActive === "inactive") params.set("is_active", "false");

            const res = await api.get(`/api/asset-types?${params}`);
            setTypes(res.data || []);
            setTotal(res.total || 0);
            setTotalActive(res.active_count || 0);
            setPage(res.page || 1);
            setTotalPages(res.total_pages || res.totalPages || 1);
        } catch {
            setError("Không thể tải dữ liệu. Vui lòng thử lại.");
        } finally {
            setLoading(false);
        }
    }, [page, search, filterActive]);

    useEffect(() => { fetchTypes(); }, [fetchTypes]);
    useEffect(() => { setPage(1); }, [search, filterActive]);

    const handleSort = (field) => {
        if (sortField === field) {
            setSortDir((d) => (d === "asc" ? "desc" : "asc"));
        } else {
            setSortField(field);
            setSortDir("asc");
        }
    };

    const sorted = [...types].sort((a, b) => {
        if (!sortField) return 0;
        if (sortField === "default_price") return sortDir === "asc" ? Number(a.default_price) - Number(b.default_price) : Number(b.default_price) - Number(a.default_price);
        const diff = new Date(a[sortField]) - new Date(b[sortField]);
        return sortDir === "asc" ? diff : -diff;
    });

    const activeCount = totalActive;

    const handleCreate = async (data) => {
        setSaving(true);
        try {
            await api.post("/api/asset-types", data);
            setShowCreate(false);
            fetchTypes();
        } catch (err) {
            setMsgDialog({ title: "Lỗi", message: err.message || "Đã xảy ra lỗi." });
        } finally {
            setSaving(false);
        }
    };

    const handleUpdate = async (id, data) => {
        setSaving(true);
        try {
            await api.put(`/api/asset-types/${id}`, data);
            setDetailType(null);
            fetchTypes();
        } catch (err) {
            setMsgDialog({ title: "Lỗi", message: err.message || "Đã xảy ra lỗi." });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        setSaving(true);
        try {
            await api.delete(`/api/asset-types/${id}`);
            setDetailType(null);
            fetchTypes();
        } catch (err) {
            setMsgDialog({ title: "Lỗi", message: err.message || "Không thể vô hiệu hóa." });
        } finally {
            setSaving(false);
        }
    };

    const handleToggleConfirm = async () => {
        setSaving(true);
        try {
            await api.put(`/api/asset-types/${confirmToggle.id}`, {
                is_active: !confirmToggle.is_active,
            });
            setConfirmToggle(null);
            fetchTypes();
        } catch (err) {
            setMsgDialog({ title: "Lỗi", message: err.message || "Không thể cập nhật." });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="mx-auto max-w-5xl space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between flex-wrap gap-3 pt-2">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Loại tài sản</h1>
                    <p className="text-sm text-muted-foreground">Quản lý danh mục loại tài sản FScape</p>
                </div>
                <Button className="gap-1.5" onClick={() => setShowCreate(true)}>
                    <Plus className="size-4" /> Thêm loại tài sản
                </Button>
            </div>

            {/* Summary */}
            <AssetTypeSummary total={total} active={activeCount} inactive={total - activeCount} />

            {/* Search + filter */}
            <div className="flex items-center gap-3 flex-wrap">
                <div className="relative flex-1 min-w-[280px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                        placeholder="Tìm kiếm theo tên loại tài sản..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <div className="flex gap-1.5">
                    {["all", "active", "inactive"].map((k) => (
                        <Button
                            key={k}
                            size="sm"
                            variant={filterActive === k ? "default" : "outline"}
                            onClick={() => setFilterActive(k)}
                        >
                            {k === "all" ? "Tất cả" : k === "active" ? "Hoạt động" : "Vô hiệu"}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Pagination Header */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between mt-2">
                    <p className="text-sm font-medium text-muted-foreground">{total} kết quả</p>
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-medium">{page}/{totalPages}</span>
                        <div className="flex items-center gap-1">
                            <Button size="icon" variant="outline" className="size-8" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                                <ChevronLeft className="size-4" />
                            </Button>
                            <Button size="icon" variant="outline" className="size-8" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                                <ChevronRight className="size-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Table */}
            <Card className="overflow-hidden py-0 gap-0">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="size-6 animate-spin text-muted-foreground" />
                    </div>
                ) : error ? (
                    <div className="py-14 text-center">
                        <p className="text-sm text-destructive">{error}</p>
                        <Button variant="outline" size="sm" className="mt-3" onClick={fetchTypes}>
                            Thử lại
                        </Button>
                    </div>
                ) : (
                    <>
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/30">
                                    <TableHead className="w-12 pl-4">#</TableHead>
                                    <TableHead>Loại tài sản</TableHead>
                                    <TableHead className="cursor-pointer" onClick={() => handleSort("default_price")}>
                                        <span className="inline-flex items-center">Giá mặc định <SortIcon field="default_price" sortField={sortField} sortDir={sortDir} /></span>
                                    </TableHead>
                                    <TableHead className="cursor-pointer" onClick={() => handleSort("created_at")}>
                                        <span className="inline-flex items-center">Ngày tạo <SortIcon field="created_at" sortField={sortField} sortDir={sortDir} /></span>
                                    </TableHead>
                                    <TableHead>Trạng thái</TableHead>
                                    <TableHead className="text-right pr-4">Hành động</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sorted.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="py-14 text-center text-muted-foreground">Không tìm thấy loại tài sản nào.</TableCell>
                                    </TableRow>
                                ) : (
                                    sorted.map((t, idx) => (
                                        <TableRow key={t.id} className="cursor-pointer hover:bg-muted/30" onClick={() => setDetailType(t)}>
                                            <TableCell className="pl-4 text-muted-foreground text-xs">{(page - 1) * limit + idx + 1}</TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="font-bold text-[14px]">{t.name}</span>
                                                    <span className="text-[11px] text-muted-foreground line-clamp-1 max-w-[260px]">{t.description || "Chưa có mô tả"}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-sm font-semibold">{fmtPrice(t.default_price)}</span>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-xs text-muted-foreground">{fmt(t.created_at)}</span>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2 text-xs">
                                                    <span className={`size-2 rounded-full ${t.is_active ? "bg-success shadow-[0_0_8px_rgba(34,197,94,0.4)]" : "bg-muted-foreground/30"}`} />
                                                    <span className={t.is_active ? "text-success font-medium" : "text-muted-foreground"}>
                                                        {t.is_active ? "Hoạt động" : "Vô hiệu"}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="pr-4">
                                                <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                                                    <Button size="icon" variant="ghost" className="size-8" onClick={() => setConfirmToggle(t)}>
                                                        {t.is_active ? <ToggleRight className="size-5 text-success" /> : <ToggleLeft className="size-5 text-muted-foreground" />}
                                                    </Button>
                                                    <Button size="icon" variant="ghost" className="size-8" onClick={() => setDetailType(t)}>
                                                        <Eye className="size-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>

                    </>
                )}
            </Card>

            <AssetTypeDetailDialog open={!!detailType} onOpenChange={(v) => !v && setDetailType(null)} assetType={detailType} onSave={handleUpdate} onDelete={handleDelete} saving={saving} />
            <AssetTypeCreateDialog open={showCreate} onOpenChange={setShowCreate} onSave={handleCreate} saving={saving} />

            {/* Toggle confirm */}
            <Dialog open={!!confirmToggle} onOpenChange={(v) => !v && setConfirmToggle(null)}>
                <DialogContent className="max-w-sm text-center">
                    <DialogHeader><DialogTitle>{confirmToggle?.is_active ? "Vô hiệu hóa" : "Kích hoạt"} loại tài sản</DialogTitle></DialogHeader>
                    <p className="text-sm text-muted-foreground">Bạn có chắc muốn {confirmToggle?.is_active ? "vô hiệu hóa" : "kích hoạt"} loại tài sản <strong>&quot;{confirmToggle?.name}&quot;</strong>?</p>
                    <DialogFooter className="justify-center gap-2">
                        <Button variant="outline" onClick={() => setConfirmToggle(null)}>Hủy</Button>
                        <Button variant={confirmToggle?.is_active ? "destructive" : "outline"} className={!confirmToggle?.is_active ? "bg-success text-white border-none" : ""} disabled={saving} onClick={handleToggleConfirm}>
                            {saving && <Loader2 className="size-4 animate-spin mr-1" />}
                            {confirmToggle?.is_active ? "Vô hiệu hóa" : "Kích hoạt"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Message dialog */}
            <Dialog open={!!msgDialog} onOpenChange={(v) => { if (!v) setMsgDialog(null); }}>
                <DialogContent className="max-w-sm text-center">
                    <DialogHeader><DialogTitle>{msgDialog?.title || "Thông báo"}</DialogTitle></DialogHeader>
                    <p className="text-sm text-muted-foreground">{msgDialog?.message}</p>
                    <DialogFooter className="justify-center">
                        <Button onClick={() => setMsgDialog(null)}>Đóng</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
