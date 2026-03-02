import { useState, useEffect, useCallback } from "react";
import { Plus, Search, Pencil, Trash2, Home, ToggleLeft, ToggleRight, ChevronUp, ChevronDown, ChevronsUpDown, Loader2, Eye } from "lucide-react";
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

const EMPTY_FORM = { name: "", description: "", is_active: "true" };

function SortIcon({ field, sortField, sortDir }) {
    if (sortField !== field) return <ChevronsUpDown className="size-3.5 ml-1 opacity-40" />;
    return sortDir === "asc"
        ? <ChevronUp className="size-3.5 ml-1 text-primary" />
        : <ChevronDown className="size-3.5 ml-1 text-primary" />;
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
            is_active: String(roomType.is_active ?? true),
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
        onSave(roomType.id, {
            name: form.name.trim(),
            description: form.description.trim() || null,
            is_active: form.is_active === "true",
        });
    };

    if (!roomType) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                {editing ? (
                    <>
                        <DialogHeader>
                            <DialogTitle>Chỉnh sửa loại phòng</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
                            <div className="space-y-1.5">
                                <Label>Tên loại phòng *</Label>
                                <Input
                                    value={form.name}
                                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                                    className={errors.name ? "border-destructive" : ""}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Mô tả</Label>
                                <Textarea
                                    value={form.description}
                                    onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                                    rows={3}
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
                            <DialogFooter>
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
                            <DialogTitle>Xóa loại phòng</DialogTitle>
                        </DialogHeader>
                        <p className="text-sm text-muted-foreground text-center py-2">
                            Bạn có chắc muốn xóa loại phòng{" "}
                            <strong className="text-foreground">&quot;{roomType.name}&quot;</strong>?{" "}
                            Hành động này không thể hoàn tác.
                        </p>
                        <DialogFooter className="justify-center gap-2">
                            <Button variant="outline" onClick={() => setConfirmDel(false)}>Hủy</Button>
                            <Button variant="destructive" disabled={saving} onClick={() => onDelete(roomType.id)}>
                                {saving && <Loader2 className="size-4 animate-spin mr-1.5" />}
                                Xóa
                            </Button>
                        </DialogFooter>
                    </>
                ) : (
                    <>
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2.5">
                                {roomType.name}
                                <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${roomType.is_active
                                    ? "bg-success/15 text-success"
                                    : "bg-muted text-muted-foreground"
                                    }`}>
                                    {roomType.is_active ? "Hoạt động" : "Không hoạt động"}
                                </span>
                            </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-2">
                            {roomType.description && (
                                <div>
                                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Mô tả</p>
                                    <p className="text-sm mt-0.5">{roomType.description}</p>
                                </div>
                            )}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Ngày tạo</p>
                                    <p className="text-sm font-medium mt-0.5">{fmt(roomType.created_at)}</p>
                                </div>
                                <div>
                                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Cập nhật</p>
                                    <p className="text-sm font-medium mt-0.5">{fmt(roomType.updated_at)}</p>
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

/* ── Create Dialog ─────────────────────────── */

function RoomTypeCreateDialog({ open, onOpenChange, onSave, saving }) {
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
        onSave({
            name: form.name.trim(),
            description: form.description.trim() || null,
            is_active: form.is_active === "true",
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Thêm loại phòng mới</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 pt-1">
                    <div className="space-y-1.5">
                        <Label>Tên loại phòng *</Label>
                        <Input
                            value={form.name}
                            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                            placeholder="VD: Phòng đơn, Studio..."
                            className={errors.name ? "border-destructive" : ""}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label>Mô tả</Label>
                        <Textarea
                            value={form.description}
                            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                            placeholder="Mô tả ngắn gọn về loại phòng này..."
                            rows={3}
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
                    <DialogFooter>
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
            setTotalPages(res.totalPages || 1);
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
            alert(err.message || "Không thể xóa loại phòng. Vui lòng thử lại.");
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

            {/* Summary cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="flex items-center gap-4 px-6 py-5 overflow-hidden">
                    <div className="size-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                        <Home className="size-6 text-primary" />
                    </div>
                    <div>
                        <p className="text-3xl font-bold tracking-tight">{total}</p>
                        <p className="text-sm text-muted-foreground">Tổng loại phòng</p>
                    </div>
                </Card>
                <Card className="flex items-center gap-4 px-6 py-5 overflow-hidden">
                    <div className="size-14 rounded-2xl bg-success/10 flex items-center justify-center">
                        <span className="size-3 rounded-full bg-success" />
                    </div>
                    <div>
                        <p className="text-3xl font-bold text-success">{activeCount}</p>
                        <p className="text-sm text-muted-foreground">Đang hoạt động</p>
                    </div>
                </Card>
                <Card className="flex items-center gap-4 px-6 py-5 overflow-hidden bg-muted/5 border-none shadow-sm">
                    <div className="size-14 rounded-2xl bg-background flex items-center justify-center border border-border">
                        <span className="size-3 rounded-full bg-muted-foreground/30" />
                    </div>
                    <div>
                        <p className="text-3xl font-bold text-muted-foreground">{total - activeCount}</p>
                        <p className="text-sm text-muted-foreground">Vô hiệu hóa</p>
                    </div>
                </Card>
            </div>

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
                                    <TableHead>Thông tin loại phòng</TableHead>
                                    <TableHead>Trạng thái</TableHead>
                                    <TableHead className="cursor-pointer" onClick={() => handleSort("created_at")}>
                                        <span className="inline-flex items-center">Ngày tạo <SortIcon field="created_at" sortField={sortField} sortDir={sortDir} /></span>
                                    </TableHead>
                                    <TableHead className="text-right pr-4">Hành động</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sorted.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="py-14 text-center text-muted-foreground">Không tìm thấy loại phòng nào.</TableCell>
                                    </TableRow>
                                ) : (
                                    sorted.map((t, idx) => (
                                        <TableRow key={t.id}>
                                            <TableCell className="pl-4 text-muted-foreground text-xs">{(page - 1) * limit + idx + 1}</TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="font-bold text-[14px]">{t.name}</span>
                                                    <span className="text-[11px] text-muted-foreground line-clamp-1 truncate max-w-[300px]">{t.description || "Chưa có mô tả"}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2 text-xs">
                                                    <span className={`size-2 rounded-full ${t.is_active ? "bg-success shadow-[0_0_8px_rgba(34,197,94,0.4)]" : "bg-muted-foreground/30"}`} />
                                                    <span className={t.is_active ? "text-success font-medium" : "text-muted-foreground"}>
                                                        {t.is_active ? "Đang hoạt động" : "Vô hiệu hóa"}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">{fmt(t.created_at)}</TableCell>
                                            <TableCell className="pr-4">
                                                <div className="flex items-center justify-end gap-1.5">
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
                    <p className="text-sm text-muted-foreground">Bạn có chắc muốn {confirmToggle?.is_active ? "tắt" : "bật"} hoạt động loại phòng <strong>"{confirmToggle?.name}"</strong>?</p>
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
