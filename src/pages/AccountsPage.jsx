import { useState, useCallback, useEffect } from "react";
import { Plus, Search, Pencil, Trash2, Users, Shield, Loader2, Eye, Mail, Phone, ToggleLeft, ToggleRight, MoreVertical } from "lucide-react";
import { useNavigate } from "react-router-dom";
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
import { api } from "@/lib/api";

const fmtDate = (iso) => {
    if (!iso) return "—";
    const d = new Date(iso);
    return isNaN(d.getTime()) ? "—" : d.toLocaleDateString("vi-VN", {
        day: "2-digit", month: "2-digit", year: "numeric",
    });
};

const ROLE_MAP = {
    admin: { label: "Quản trị viên", color: "text-primary border-primary/20 bg-primary/5" },
    manager: { label: "Quản lý tòa nhà", color: "text-success border-success/20 bg-success/5" },
    staff: { label: "Nhân viên", color: "text-warning border-warning/20 bg-warning/5" },
};

/* ── Main Page ─────────────────────────────── */

export default function AccountsPage() {
    const navigate = useNavigate();
    const [accounts, setAccounts] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Filters
    const [search, setSearch] = useState("");
    const [filterRole, setFilterRole] = useState("all");

    // Modals
    const [deleteId, setDeleteId] = useState(null);
    const [confirmToggle, setConfirmToggle] = useState(null);

    const limit = 10;

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page, limit });
            if (search.trim()) params.set("search", search.trim());
            if (filterRole !== "all") params.set("role", filterRole);

            const res = await api.get(`/api/accounts?${params}`);
            setAccounts(res.data || []);
            setTotal(res.total || 0);
            setTotalPages(res.totalPages || 1);
        } catch (err) {
            console.error(err);
            // Mock for demo
            setAccounts([
                { id: 1, name: "Admin FScape", email: "admin@fscape.vn", phone: "0901234567", role: "admin", isActive: true, createdAt: "2024-01-01T00:00:00Z" },
                { id: 2, name: "Quản lý Hùng", email: "hung.ql@fscape.vn", phone: "0901234888", role: "manager", isActive: true, createdAt: "2024-02-15T00:00:00Z" },
                { id: 3, name: "Nhân viên Trang", email: "trang.nv@fscape.vn", phone: "0901234999", role: "staff", isActive: false, createdAt: "2024-02-20T00:00:00Z" },
            ]);
            setTotal(3);
        } finally {
            setLoading(false);
        }
    }, [page, search, filterRole]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleDelete = async () => {
        setSaving(true);
        try {
            await api.delete(`/api/accounts/${deleteId}`);
            setDeleteId(null);
            fetchData();
        } catch (err) {
            alert(err.message || "Đã xảy ra lỗi.");
        } finally {
            setSaving(false);
        }
    };

    const handleToggleStatus = async () => {
        setSaving(true);
        try {
            await api.put(`/api/accounts/${confirmToggle.id}`, {
                isActive: !confirmToggle.isActive,
            });
            setConfirmToggle(null);
            fetchData();
        } catch (err) {
            alert(err.message || "Không thể cập nhật trạng thái.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="mx-auto max-w-6xl space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between flex-wrap gap-3 pt-2">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Quản lý Tài khoản</h1>
                    <p className="text-sm text-muted-foreground">Phân quyền và quản lý nhân sự trong hệ thống</p>
                </div>
                <Button className="gap-1.5 shadow-sm" onClick={() => navigate("/accounts/create")}>
                    <Plus className="size-4" /> Tạo tài khoản
                </Button>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="flex items-center gap-4 px-6 py-5 overflow-hidden">
                    <div className="size-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                        <Users className="size-6 text-primary" />
                    </div>
                    <div>
                        <p className="text-3xl font-bold">{total}</p>
                        <p className="text-sm text-muted-foreground">Tổng nhân sự</p>
                    </div>
                </Card>
                <Card className="flex items-center gap-4 px-6 py-5 overflow-hidden">
                    <div className="size-14 rounded-2xl bg-success/10 flex items-center justify-center">
                        <Shield className="size-6 text-success" />
                    </div>
                    <div>
                        <p className="text-3xl font-bold text-success">{accounts.filter(a => a.isActive).length}</p>
                        <p className="text-sm text-muted-foreground">Đang hoạt động</p>
                    </div>
                </Card>
                <Card className="flex items-center gap-4 px-6 py-5 overflow-hidden bg-muted/30 border-none shadow-none">
                    <div className="size-14 rounded-2xl bg-background flex items-center justify-center border border-border">
                        <MoreVertical className="size-6 text-muted-foreground" />
                    </div>
                    <div>
                        <p className="text-3xl font-bold text-muted-foreground">{accounts.filter(a => !a.isActive).length}</p>
                        <p className="text-sm text-muted-foreground">Vô hiệu hóa</p>
                    </div>
                </Card>
            </div>

            {/* Search + Filter */}
            <div className="flex items-center gap-3 flex-wrap">
                <div className="relative flex-1 min-w-[280px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                        placeholder="Tìm kiếm theo tên hoặc email tài khoản..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <div className="flex gap-1.5 bg-muted/50 p-1 rounded-lg border border-border/50">
                    {[
                        { key: "all", label: "Tất cả" },
                        { key: "admin", label: "Admin" },
                        { key: "manager", label: "Quản lý" },
                        { key: "staff", label: "Nhân viên" },
                    ].map((r) => (
                        <Button
                            key={r.key}
                            size="sm"
                            variant={filterRole === r.key ? "secondary" : "ghost"}
                            onClick={() => setFilterRole(r.key)}
                            className={filterRole === r.key ? "shadow-sm bg-background" : "text-muted-foreground"}
                        >
                            {r.label}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <Card className="overflow-hidden">
                {loading ? (
                    <div className="py-24 flex justify-center flex-col items-center gap-2">
                        <Loader2 className="size-8 animate-spin text-primary/60" />
                        <p className="text-xs text-muted-foreground">Đang tải danh sách tài khoản...</p>
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/30">
                                <TableHead className="w-12 pl-4">#</TableHead>
                                <TableHead>Thông tin người dùng</TableHead>
                                <TableHead>Vai trò</TableHead>
                                <TableHead>Trạng thái</TableHead>
                                <TableHead>Ngày tạo</TableHead>
                                <TableHead className="text-right pr-4">Thao tác</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {accounts.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="py-24 text-center text-muted-foreground">
                                        Không tìm thấy tài khoản nào khớp với bộ lọc
                                    </TableCell>
                                </TableRow>
                            ) : (
                                accounts.map((acc, idx) => (
                                    <TableRow key={acc.id} className="group transition-colors hover:bg-muted/10">
                                        <TableCell className="pl-4 text-xs text-muted-foreground">{(page - 1) * limit + idx + 1}</TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-0.5">
                                                <span className="font-bold text-[14px]">{acc.name}</span>
                                                <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-0.5">
                                                    <span className="flex items-center gap-1"><Mail className="size-3" /> {acc.email}</span>
                                                    {acc.phone && <span className="flex items-center gap-1"><Phone className="size-3" /> {acc.phone}</span>}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold border ${ROLE_MAP[acc.role]?.color || "bg-muted"}`}>
                                                {ROLE_MAP[acc.role]?.label || acc.role}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2 text-xs">
                                                <span className={`size-2 rounded-full ${acc.isActive ? "bg-success shadow-[0_0_8px_rgba(34,197,94,0.4)]" : "bg-muted-foreground/30"}`} />
                                                <span className={acc.isActive ? "text-success font-medium" : "text-muted-foreground"}>
                                                    {acc.isActive ? "Đang hoạt động" : "Vô hiệu hóa"}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-xs text-muted-foreground font-medium">{fmtDate(acc.createdAt)}</TableCell>
                                        <TableCell className="pr-4">
                                            <div className="flex items-center justify-end gap-1 px-1">
                                                <Button
                                                    size="icon" variant="ghost" className="size-8 text-primary"
                                                    title={acc.isActive ? "Vô hiệu hóa" : "Kích hoạt"}
                                                    onClick={() => setConfirmToggle(acc)}
                                                >
                                                    {acc.isActive ? <ToggleRight className="size-5" /> : <ToggleLeft className="size-5 text-muted-foreground" />}
                                                </Button>
                                                <Button size="icon" variant="ghost" className="size-8 hover:bg-muted/80">
                                                    <Pencil className="size-3.5" />
                                                </Button>
                                                <Button size="icon" variant="ghost" className="size-8 text-destructive hover:bg-destructive/10" onClick={() => setDeleteId(acc.id)}>
                                                    <Trash2 className="size-3.5" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                )}

                {totalPages > 1 && (
                    <div className="p-4 border-t flex items-center justify-between bg-muted/10">
                        <span className="text-[12px] text-muted-foreground">Trang {page} / {totalPages} - Tổng {total} tài khoản</span>
                        <div className="flex gap-2">
                            <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Trước</Button>
                            <Button size="sm" variant="outline" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Sau</Button>
                        </div>
                    </div>
                )}
            </Card>

            {/* Delete confirm dialog */}
            <Dialog open={!!deleteId} onOpenChange={(v) => !v && setDeleteId(null)}>
                <DialogContent className="max-w-sm text-center">
                    <DialogHeader><DialogTitle>Xóa tài khoản</DialogTitle></DialogHeader>
                    <div className="py-4 space-y-2">
                        <p className="text-sm text-muted-foreground font-medium">Bạn có chắc chắn muốn xóa tài khoản này?</p>
                        <p className="text-xs text-destructive/80 italic">Hành động này không thể hoàn tác và thành viên này sẽ không thể đăng nhập.</p>
                    </div>
                    <DialogFooter className="justify-center gap-2">
                        <Button variant="outline" onClick={() => setDeleteId(null)}>Hủy</Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={saving}>
                            {saving && <Loader2 className="size-4 animate-spin mr-1.5" />}
                            Xác nhận xóa
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Toggle status confirm dialog */}
            <Dialog open={!!confirmToggle} onOpenChange={(v) => !v && setConfirmToggle(null)}>
                <DialogContent className="max-w-sm text-center">
                    <DialogHeader>
                        <DialogTitle>{confirmToggle?.isActive ? "Vô hiệu hóa tài khoản" : "Kích hoạt tài khoản"}</DialogTitle>
                    </DialogHeader>
                    <div className="py-2">
                        <p className="text-sm text-muted-foreground">
                            Bạn có chắc muốn {confirmToggle?.isActive ? <strong>vô hiệu hóa</strong> : <strong>kích hoạt</strong>} tài khoản của <strong>{confirmToggle?.name}</strong>?
                        </p>
                    </div>
                    <DialogFooter className="justify-center gap-2">
                        <Button variant="outline" onClick={() => setConfirmToggle(null)}>Hủy</Button>
                        <Button
                            variant={confirmToggle?.isActive ? "destructive" : "default"}
                            className={!confirmToggle?.isActive ? "bg-success text-white border-none hover:bg-success/90" : ""}
                            onClick={handleToggleStatus}
                            disabled={saving}
                        >
                            {saving && <Loader2 className="size-4 animate-spin mr-1.5" />}
                            Xác nhận
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
