import { useState, useEffect, useCallback } from "react";
import {
    Plus, Search, Pencil, Trash2, Home, ToggleLeft, ToggleRight,
    ChevronUp, ChevronDown, ChevronsUpDown, Loader2, Eye,
    Bed, Bath, Maximize, Users, Banknote,
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

const fmtPrice = (v) => {
    if (v == null || v === "") return "—";
    return Number(v).toLocaleString("vi-VN") + " ₫";
};

const EMPTY_FORM = {
    name: "",
    description: "",
    base_price: "",
    deposit_months: "1",
    capacity_min: "1",
    capacity_max: "1",
    bedrooms: "1",
    bathrooms: "1",
    area_sqm: "",
    is_active: "true",
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

function RoomTypeSummary({ total, active, inactive }) {
    return (
        <div className="rounded-2xl border border-border bg-card">
            <div className="flex items-center gap-6 p-5">
                <div className="flex items-center gap-4 flex-1">
                    <div className="size-11 rounded-xl bg-primary/8 flex items-center justify-center shrink-0">
                        <Home className="size-5 text-primary" />
                    </div>
                    <div>
                        <p className="text-3xl font-bold leading-none tracking-tight">{total}</p>
                        <p className="text-sm text-muted-foreground mt-1">Loại phòng</p>
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

function RoomTypeFormFields({ form, setForm, errors }) {
    const set = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }));

    return (
        <>
            <div className="space-y-1.5">
                <Label>Tên loại phòng *</Label>
                <Input
                    value={form.name}
                    onChange={set("name")}
                    placeholder="VD: Phòng đơn, Studio..."
                    className={errors.name ? "border-destructive" : ""}
                />
                {errors.name && <p className="text-[11px] text-destructive">Vui lòng nhập tên</p>}
            </div>

            <div className="space-y-1.5">
                <Label>Mô tả</Label>
                <Textarea
                    value={form.description}
                    onChange={set("description")}
                    placeholder="Mô tả ngắn gọn về loại phòng này..."
                    rows={2}
                />
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                    <Label>Giá cơ bản (₫) *</Label>
                    <Input
                        type="number" min="0" step="1000"
                        value={form.base_price}
                        onChange={set("base_price")}
                        placeholder="0"
                        className={errors.base_price ? "border-destructive" : ""}
                    />
                    {errors.base_price && <p className="text-[11px] text-destructive">{errors.base_price}</p>}
                </div>
                <div className="space-y-1.5">
                    <Label>Đặt cọc (tháng)</Label>
                    <Input
                        type="number" min="0"
                        value={form.deposit_months}
                        onChange={set("deposit_months")}
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                    <Label>Sức chứa tối thiểu</Label>
                    <Input
                        type="number" min="1"
                        value={form.capacity_min}
                        onChange={set("capacity_min")}
                    />
                </div>
                <div className="space-y-1.5">
                    <Label>Sức chứa tối đa</Label>
                    <Input
                        type="number" min="1"
                        value={form.capacity_max}
                        onChange={set("capacity_max")}
                        className={errors.capacity ? "border-destructive" : ""}
                    />
                    {errors.capacity && <p className="text-[11px] text-destructive">{errors.capacity}</p>}
                </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                    <Label>Phòng ngủ</Label>
                    <Input type="number" min="0" value={form.bedrooms} onChange={set("bedrooms")} />
                </div>
                <div className="space-y-1.5">
                    <Label>Phòng tắm</Label>
                    <Input type="number" min="0" value={form.bathrooms} onChange={set("bathrooms")} />
                </div>
                <div className="space-y-1.5">
                    <Label>Diện tích (m²)</Label>
                    <Input type="number" min="0" step="0.1" value={form.area_sqm} onChange={set("area_sqm")} placeholder="0" />
                </div>
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
        </>
    );
}

function validateForm(form) {
    const e = {};
    if (!form.name.trim()) e.name = true;
    if (!form.base_price && form.base_price !== 0) e.base_price = "Vui lòng nhập giá";
    else if (Number(form.base_price) < 0) e.base_price = "Giá phải >= 0";
    if (Number(form.capacity_min) > Number(form.capacity_max)) e.capacity = "Tối thiểu phải ≤ tối đa";
    return e;
}

function formToPayload(form) {
    return {
        name: form.name.trim(),
        description: form.description.trim() || null,
        base_price: Number(form.base_price),
        deposit_months: Number(form.deposit_months) || 1,
        capacity_min: Number(form.capacity_min) || 1,
        capacity_max: Number(form.capacity_max) || 1,
        bedrooms: Number(form.bedrooms) || 0,
        bathrooms: Number(form.bathrooms) || 0,
        area_sqm: form.area_sqm ? Number(form.area_sqm) : null,
        is_active: form.is_active === "true",
    };
}

/* ── RoomType Detail Dialog (view / edit / delete) ── */

function RoomTypeDetailDialog({ open, onOpenChange, roomType, onSave, onDelete, saving }) {
    const [editing, setEditing] = useState(false);
    const [confirmDel, setConfirmDel] = useState(false);
    const [form, setForm] = useState(null);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (open) {
            setEditing(false);
            setConfirmDel(false);
        }
    }, [open]);

    const startEdit = () => {
        setForm({
            name: roomType.name || "",
            description: roomType.description || "",
            base_price: roomType.base_price ?? "",
            deposit_months: String(roomType.deposit_months ?? 1),
            capacity_min: String(roomType.capacity_min ?? 1),
            capacity_max: String(roomType.capacity_max ?? 1),
            bedrooms: String(roomType.bedrooms ?? 1),
            bathrooms: String(roomType.bathrooms ?? 1),
            area_sqm: roomType.area_sqm ?? "",
            is_active: String(roomType.is_active ?? true),
        });
        setErrors({});
        setEditing(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const errs = validateForm(form);
        setErrors(errs);
        if (Object.keys(errs).length > 0) return;
        onSave(roomType.id, formToPayload(form));
    };

    if (!roomType) return null;

    const rt = roomType;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg">
                {editing ? (
                    <>
                        <DialogHeader>
                            <DialogTitle>Chỉnh sửa loại phòng</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-3 pt-1 max-h-[70vh] overflow-y-auto pr-1">
                            <RoomTypeFormFields form={form} setForm={setForm} errors={errors} />
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
                            <DialogTitle>Vô hiệu hóa loại phòng</DialogTitle>
                        </DialogHeader>
                        <p className="text-sm text-muted-foreground text-center py-2">
                            Bạn có chắc muốn vô hiệu hóa loại phòng{" "}
                            <strong className="text-foreground">&quot;{rt.name}&quot;</strong>?
                        </p>
                        <DialogFooter className="justify-center gap-2">
                            <Button variant="outline" onClick={() => setConfirmDel(false)}>Hủy</Button>
                            <Button variant="destructive" disabled={saving} onClick={() => onDelete(rt.id)}>
                                {saving && <Loader2 className="size-4 animate-spin mr-1.5" />}
                                Vô hiệu hóa
                            </Button>
                        </DialogFooter>
                    </>
                ) : (
                    <>
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2.5">
                                {rt.name}
                                <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${rt.is_active
                                    ? "bg-success/15 text-success"
                                    : "bg-muted text-muted-foreground"
                                    }`}>
                                    {rt.is_active ? "Hoạt động" : "Không hoạt động"}
                                </span>
                            </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-2">
                            {rt.description && (
                                <div>
                                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Mô tả</p>
                                    <p className="text-sm mt-0.5">{rt.description}</p>
                                </div>
                            )}

                            {/* Specs grid */}
                            <div className="grid grid-cols-3 gap-3">
                                {[
                                    { icon: Banknote, label: "Giá cơ bản", value: fmtPrice(rt.base_price) },
                                    { icon: Users, label: "Sức chứa", value: `${rt.capacity_min}–${rt.capacity_max} người` },
                                    { icon: Maximize, label: "Diện tích", value: rt.area_sqm ? `${rt.area_sqm} m²` : "—" },
                                    { icon: Bed, label: "Phòng ngủ", value: rt.bedrooms ?? "—" },
                                    { icon: Bath, label: "Phòng tắm", value: rt.bathrooms ?? "—" },
                                    { icon: Banknote, label: "Đặt cọc", value: rt.deposit_months ? `${rt.deposit_months} tháng` : "—" },
                                ].map(({ icon: Icon, label, value }) => (
                                    <div key={label} className="rounded-lg border border-border/50 bg-muted/30 p-3">
                                        <div className="flex items-center gap-1.5 mb-1">
                                            <Icon className="size-3.5 text-muted-foreground" />
                                            <p className="text-[11px] text-muted-foreground">{label}</p>
                                        </div>
                                        <p className="text-sm font-semibold">{value}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Ngày tạo</p>
                                    <p className="text-sm font-medium mt-0.5">{fmt(rt.created_at)}</p>
                                </div>
                                <div>
                                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Cập nhật</p>
                                    <p className="text-sm font-medium mt-0.5">{fmt(rt.updated_at)}</p>
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

function RoomTypeCreateDialog({ open, onOpenChange, onSave, saving }) {
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
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>Thêm loại phòng mới</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-3 pt-1 max-h-[70vh] overflow-y-auto pr-1">
                    <RoomTypeFormFields form={form} setForm={setForm} errors={errors} />
                    <DialogFooter className="pt-2">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
                        <Button type="submit" disabled={saving}>
                            {saving && <Loader2 className="size-4 animate-spin mr-1.5" />}
                            Thêm loại phòng
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

/* ── Main Page ─────────────────────────────── */

export default function RoomTypesPage() {
    const [types, setTypes] = useState([]);
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
    const [detailType, setDetailType] = useState(null);
    const [confirmToggle, setConfirmToggle] = useState(null);
    const [error, setError] = useState(null);

    const limit = 10;

    const fetchTypes = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams({ page, limit });
            if (search.trim()) params.set("search", search.trim());
            if (filterActive === "active") params.set("is_active", "true");
            if (filterActive === "inactive") params.set("is_active", "false");

            const res = await api.get(`/api/room-types?${params}`);
            setTypes(res.data || []);
            setTotal(res.total || 0);
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
        if (sortField === "base_price") return sortDir === "asc" ? Number(a.base_price) - Number(b.base_price) : Number(b.base_price) - Number(a.base_price);
        const diff = new Date(a[sortField]) - new Date(b[sortField]);
        return sortDir === "asc" ? diff : -diff;
    });

    const activeCount = types.filter((t) => t.is_active).length;

    const handleCreate = async (data) => {
        setSaving(true);
        try {
            await api.post("/api/room-types", data);
            setShowCreate(false);
            fetchTypes();
        } catch (err) {
            alert(err.message || "Đã xảy ra lỗi. Vui lòng thử lại.");
        } finally {
            setSaving(false);
        }
    };

    const handleUpdate = async (id, data) => {
        setSaving(true);
        try {
            await api.put(`/api/room-types/${id}`, data);
            setDetailType(null);
            fetchTypes();
        } catch (err) {
            alert(err.message || "Đã xảy ra lỗi. Vui lòng thử lại.");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        setSaving(true);
        try {
            await api.delete(`/api/room-types/${id}`);
            setDetailType(null);
            fetchTypes();
        } catch (err) {
            alert(err.message || "Không thể vô hiệu hóa. Vui lòng thử lại.");
        } finally {
            setSaving(false);
        }
    };

    const handleToggleConfirm = async () => {
        setSaving(true);
        try {
            await api.put(`/api/room-types/${confirmToggle.id}`, {
                is_active: !confirmToggle.is_active,
            });
            setConfirmToggle(null);
            fetchTypes();
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
                    <h1 className="text-2xl font-bold tracking-tight">Loại phòng</h1>
                    <p className="text-sm text-muted-foreground">Quản lý các loại cấu trúc phòng FScape</p>
                </div>
                <Button className="gap-1.5" onClick={() => setShowCreate(true)}>
                    <Plus className="size-4" /> Thêm loại phòng
                </Button>
            </div>

            {/* Summary */}
            <RoomTypeSummary total={total} active={activeCount} inactive={total - activeCount} />

            {/* Search + filter */}
            <div className="flex items-center gap-3 flex-wrap">
                <div className="relative flex-1 min-w-[280px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                        placeholder="Tìm kiếm theo tên loại phòng..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <div className="flex gap-1.5 bg-muted/50 p-1 rounded-lg border border-border/50">
                    {["all", "active", "inactive"].map((k) => (
                        <Button
                            key={k}
                            size="sm"
                            variant={filterActive === k ? "secondary" : "ghost"}
                            onClick={() => setFilterActive(k)}
                            className={filterActive === k ? "shadow-sm bg-background px-4" : "text-muted-foreground px-4"}
                        >
                            {k === "all" ? "Tất cả" : k === "active" ? "Hoạt động" : "Tắt"}
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
                                    <TableHead>Loại phòng</TableHead>
                                    <TableHead className="cursor-pointer" onClick={() => handleSort("base_price")}>
                                        <span className="inline-flex items-center">Giá <SortIcon field="base_price" sortField={sortField} sortDir={sortDir} /></span>
                                    </TableHead>
                                    <TableHead>Thông số</TableHead>
                                    <TableHead>Trạng thái</TableHead>
                                    <TableHead className="text-right pr-4">Hành động</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sorted.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="py-14 text-center text-muted-foreground">Không tìm thấy loại phòng nào.</TableCell>
                                    </TableRow>
                                ) : (
                                    sorted.map((t, idx) => (
                                        <TableRow key={t.id} className="cursor-pointer hover:bg-muted/30" onClick={() => setDetailType(t)}>
                                            <TableCell className="pl-4 text-muted-foreground text-xs">{(page - 1) * limit + idx + 1}</TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="font-bold text-[14px]">{t.name}</span>
                                                    <span className="text-[11px] text-muted-foreground line-clamp-1 max-w-[220px]">{t.description || "Chưa có mô tả"}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-sm font-semibold">{fmtPrice(t.base_price)}</span>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                                    <span className="inline-flex items-center gap-1" title="Sức chứa">
                                                        <Users className="size-3.5" />{t.capacity_min}–{t.capacity_max}
                                                    </span>
                                                    <span className="inline-flex items-center gap-1" title="Phòng ngủ">
                                                        <Bed className="size-3.5" />{t.bedrooms}
                                                    </span>
                                                    {t.area_sqm && (
                                                        <span className="inline-flex items-center gap-1" title="Diện tích">
                                                            <Maximize className="size-3.5" />{t.area_sqm}m²
                                                        </span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2 text-xs">
                                                    <span className={`size-2 rounded-full ${t.is_active ? "bg-success shadow-[0_0_8px_rgba(34,197,94,0.4)]" : "bg-muted-foreground/30"}`} />
                                                    <span className={t.is_active ? "text-success font-medium" : "text-muted-foreground"}>
                                                        {t.is_active ? "Hoạt động" : "Tắt"}
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

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                                <p className="text-xs text-muted-foreground">Trang {page} / {totalPages}</p>
                                <div className="flex gap-1.5">
                                    <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Trước</Button>
                                    <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Sau</Button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </Card>

            <RoomTypeDetailDialog open={!!detailType} onOpenChange={(v) => !v && setDetailType(null)} roomType={detailType} onSave={handleUpdate} onDelete={handleDelete} saving={saving} />
            <RoomTypeCreateDialog open={showCreate} onOpenChange={setShowCreate} onSave={handleCreate} saving={saving} />

            <Dialog open={!!confirmToggle} onOpenChange={(v) => !v && setConfirmToggle(null)}>
                <DialogContent className="max-w-sm text-center">
                    <DialogHeader><DialogTitle>{confirmToggle?.is_active ? "Tắt loại phòng" : "Bật loại phòng"}</DialogTitle></DialogHeader>
                    <p className="text-sm text-muted-foreground">Bạn có chắc muốn {confirmToggle?.is_active ? "tắt" : "bật"} hoạt động loại phòng <strong>&quot;{confirmToggle?.name}&quot;</strong>?</p>
                    <DialogFooter className="justify-center gap-2">
                        <Button variant="outline" onClick={() => setConfirmToggle(null)}>Hủy</Button>
                        <Button variant={confirmToggle?.is_active ? "destructive" : "outline"} className={!confirmToggle?.is_active ? "bg-success text-white border-none" : ""} disabled={saving} onClick={handleToggleConfirm}>
                            {saving && <Loader2 className="size-4 animate-spin mr-1" />}
                            {confirmToggle?.is_active ? "Tắt" : "Bật"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
