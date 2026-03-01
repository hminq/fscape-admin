import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Pencil, Trash2, Package, ToggleLeft, ToggleRight, ChevronUp, ChevronDown, ChevronsUpDown, Loader2, Eye, MapPin, Home, Construction, QrCode, Download, Printer } from "lucide-react";
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

const fmtDate = (iso) => {
    if (!iso) return "—";
    const d = new Date(iso);
    return isNaN(d.getTime()) ? "—" : d.toLocaleDateString("vi-VN", {
        day: "2-digit", month: "2-digit", year: "numeric",
    });
};

const ASSET_TYPES = [
    { value: "furniture", label: "Nội thất" },
    { value: "electronics", label: "Điện tử / Gia dụng" },
    { value: "bedding", label: "Chăn ga gối đệm" },
    { value: "safety", label: "An toàn / PCCC" },
    { value: "other", label: "Khác" },
];

const ASSET_CONDITIONS = [
    { value: "new", label: "Mới 100%" },
    { value: "good", label: "Sử dụng tốt" },
    { value: "fair", label: "Trầy xước / Cũ" },
    { value: "poor", label: "Cần sửa chữa" },
    { value: "broken", label: "Hư hỏng" },
];

const ASSET_STATUSES = [
    { value: "active", label: "Đang sử dụng" },
    { value: "maintenance", label: "Đang bảo trì" },
    { value: "stored", label: "Trong kho" },
    { value: "lost", label: "Mất / Thất lạc" },
    { value: "disposed", label: "Đã thanh lý" },
];

const EMPTY_FORM = {
    name: "",
    type: "furniture",
    condition: "good",
    status: "active",
    buildingId: "",
    roomId: "",
    purchaseDate: "",
    price: "",
};

function SortIcon({ field, sortField, sortDir }) {
    if (sortField !== field) return <ChevronsUpDown className="size-3.5 ml-1 opacity-40" />;
    return sortDir === "asc"
        ? <ChevronUp className="size-3.5 ml-1 text-primary" />
        : <ChevronDown className="size-3.5 ml-1 text-primary" />;
}

/* ── QR Code View Dialog ──────────────────── */

function QRDialog({ open, onOpenChange, asset }) {
    if (!asset) return null;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=FSCAPE_ASSET_${asset.id}_${encodeURIComponent(asset.name)}`;

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
                        <p className="text-xs text-muted-foreground">ID: ASSET-00{asset.id}</p>
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

/* ── Main Page ─────────────────────────────── */

export default function AssetsPage() {
    const navigate = useNavigate();
    const [assets, setAssets] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Filters
    const [search, setSearch] = useState("");
    const [filterType, setFilterType] = useState("all");
    const [filterStatus, setFilterStatus] = useState("all");

    const [buildings, setBuildings] = useState([]);
    const [rooms, setRooms] = useState([]);

    // Modals
    const [selectedAsset, setSelectedAsset] = useState(null);
    const [qrAsset, setQrAsset] = useState(null);
    const [deleteId, setDeleteId] = useState(null);

    const limit = 10;

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page, limit });
            if (search.trim()) params.set("search", search.trim());
            if (filterType !== "all") params.set("type", filterType);
            if (filterStatus !== "all") params.set("status", filterStatus);

            // In real app, these endpoints should exist
            const [assetRes, buildRes, roomRes] = await Promise.all([
                api.get(`/api/assets?${params}`),
                api.get("/api/buildings?limit=100"),
                api.get("/api/rooms?limit=1000")
            ]);

            setAssets(assetRes.data || []);
            setTotal(assetRes.total || 0);
            setTotalPages(assetRes.totalPages || 1);
            setBuildings(buildRes.data || []);
            setRooms(roomRes.data || []);
        } catch (err) {
            console.error(err);
            // For demo, if API fails, set mock
            setAssets([
                { id: 1, name: "Điều hòa Funiki 9000BTU", type: "electronics", status: "active", condition: "good", buildingName: "FScape Hà Nội", roomNumber: "A-301", purchaseDate: "2023-05-15", price: 6500000 },
                { id: 2, name: "Giường gỗ pallet 1m6", type: "furniture", status: "active", condition: "new", buildingName: "FScape FPT", roomNumber: "B-205", purchaseDate: "2024-01-10", price: 2200000 },
                { id: 3, name: "Máy giặt Casper 8kg", type: "electronics", status: "maintenance", condition: "poor", buildingName: "FScape Hà Nội", roomNumber: "Chung", purchaseDate: "2022-11-20", price: 4800000 },
            ]);
            setTotal(3);
        } finally {
            setLoading(false);
        }
    }, [page, search, filterType, filterStatus]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleSave = async (id, data) => {
        setSaving(true);
        try {
            if (id) {
                await api.put(`/api/assets/${id}`, data);
            } else {
                await api.post("/api/assets", data);
            }
            fetchData();
        } catch (err) {
            alert(err.message || "Đã xảy ra lỗi.");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        setSaving(true);
        try {
            await api.delete(`/api/assets/${deleteId}`);
            setDeleteId(null);
            fetchData();
        } catch (err) {
            alert(err.message || "Đã xảy ra lỗi.");
        } finally {
            setSaving(false);
        }
    };

    const getStatusBadge = (status) => {
        const s = ASSET_STATUSES.find(item => item.value === status) || ASSET_STATUSES[0];
        const colors = {
            active: "bg-success/15 text-success",
            maintenance: "bg-warning/15 text-warning",
            stored: "bg-muted text-muted-foreground",
            lost: "bg-destructive/15 text-destructive",
            disposed: "bg-muted text-muted-foreground/60",
        };
        return (
            <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${colors[status] || "bg-muted text-muted-foreground"}`}>
                {s.label}
            </span>
        );
    };

    const getTypeLabel = (type) => ASSET_TYPES.find(t => t.value === type)?.label || type;

    const maintenanceCount = assets.filter(a => a.status === "maintenance").length;

    return (
        <div className="mx-auto max-w-6xl space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between flex-wrap gap-3 pt-2">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Quản lý Tài sản</h1>
                    <p className="text-sm text-muted-foreground">Theo dõi trang thiết bị và cơ sở vật chất</p>
                </div>
                <Button className="gap-1.5" onClick={() => navigate("/assets/create")}>
                    <Plus className="size-4" /> Thêm tài sản
                </Button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="flex items-center gap-4 px-6 py-5 overflow-hidden">
                    <div className="size-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                        <Package className="size-6 text-primary" />
                    </div>
                    <div>
                        <p className="text-3xl font-bold">{total}</p>
                        <p className="text-sm text-muted-foreground">Tổng tài sản</p>
                    </div>
                </Card>
                <Card className="flex items-center gap-4 px-6 py-5 overflow-hidden border-warning/20 bg-warning/5">
                    <div className="size-14 rounded-2xl bg-warning/20 flex items-center justify-center">
                        <Construction className="size-6 text-warning" />
                    </div>
                    <div>
                        <p className="text-3xl font-bold text-warning">{maintenanceCount}</p>
                        <p className="text-sm text-muted-foreground">Cần bảo trì</p>
                    </div>
                </Card>
                <Card className="flex items-center gap-4 px-6 py-5 overflow-hidden">
                    <div className="size-14 rounded-2xl bg-success/10 flex items-center justify-center">
                        <Home className="size-6 text-success" />
                    </div>
                    <div>
                        <p className="text-3xl font-bold text-success">{assets.filter(a => a.status === "active").length}</p>
                        <p className="text-sm text-muted-foreground">Đang hoạt động</p>
                    </div>
                </Card>
            </div>

            {/* Filters */}
            <Card className="p-4 space-y-4">
                <div className="flex items-center gap-4 flex-wrap">
                    <div className="relative flex-1 min-w-[240px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                        <Input
                            placeholder="Tìm kiếm theo tên tài sản..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Select value={filterType} onValueChange={setFilterType}>
                            <SelectTrigger className="w-[160px] h-9 text-xs">
                                <SelectValue placeholder="Loại tài sản" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tất cả loại</SelectItem>
                                {ASSET_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                            </SelectContent>
                        </Select>

                        <Select value={filterStatus} onValueChange={setFilterStatus}>
                            <SelectTrigger className="w-[160px] h-9 text-xs">
                                <SelectValue placeholder="Trạng thái" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                                {ASSET_STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </Card>

            {/* Assets Table */}
            <Card className="overflow-hidden">
                {loading ? (
                    <div className="py-20 flex justify-center"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/30">
                                <TableHead className="w-12 pl-4">#</TableHead>
                                <TableHead className="min-w-[200px]">Tài sản</TableHead>
                                <TableHead>Vị trí</TableHead>
                                <TableHead>Trạng thái</TableHead>
                                <TableHead>Ngày mua</TableHead>
                                <TableHead className="text-right pr-4">Thao tác</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {assets.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="py-20 text-center text-muted-foreground">Không tìm thấy tài sản nào</TableCell>
                                </TableRow>
                            ) : (
                                assets.map((asset, idx) => (
                                    <TableRow key={asset.id} className="group transition-colors hover:bg-muted/20">
                                        <TableCell className="pl-4 text-xs text-muted-foreground">{(page - 1) * limit + idx + 1}</TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-[13.5px]">{asset.name}</span>
                                                <span className="text-[11px] text-muted-foreground">{getTypeLabel(asset.type)}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-0.5">
                                                <div className="flex items-center gap-1.5 text-xs">
                                                    <MapPin className="size-3 text-muted-foreground" />
                                                    <span className="font-medium">{asset.buildingName || "—"}</span>
                                                </div>
                                                {asset.roomNumber && (
                                                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                                                        <DoorOpen className="size-3" />
                                                        <span>Phòng {asset.roomNumber}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>{getStatusBadge(asset.status)}</TableCell>
                                        <TableCell className="text-xs text-muted-foreground">{fmtDate(asset.purchaseDate)}</TableCell>
                                        <TableCell className="pr-4">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button
                                                    size="icon" variant="ghost" className="size-8 text-primary hover:bg-primary/10"
                                                    title="Xem mã QR"
                                                    onClick={() => setQrAsset(asset)}
                                                >
                                                    <QrCode className="size-3.5" />
                                                </Button>
                                                <Button
                                                    size="icon" variant="ghost" className="size-8 hover:bg-muted/50"
                                                    title="Chỉnh sửa"
                                                    onClick={() => navigate(`/assets/create?id=${asset.id}`)}
                                                >
                                                    <Pencil className="size-3.5" />
                                                </Button>
                                                <Button
                                                    size="icon" variant="ghost" className="size-8 text-destructive hover:bg-destructive/10"
                                                    title="Xóa"
                                                    onClick={() => setDeleteId(asset.id)}
                                                >
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

                {/* Pagination placeholder */}
                {totalPages > 1 && (
                    <div className="p-4 border-t flex items-center justify-between bg-muted/10">
                        <span className="text-xs text-muted-foreground">Trang {page} / {totalPages}</span>
                        <div className="flex gap-2">
                            <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Trước</Button>
                            <Button size="sm" variant="outline" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Sau</Button>
                        </div>
                    </div>
                )}
            </Card>

            <QRDialog
                open={!!qrAsset}
                onOpenChange={(v) => !v && setQrAsset(null)}
                asset={qrAsset}
            />

            {/* Delete confirm dialog */}
            <Dialog open={!!deleteId} onOpenChange={(v) => !v && setDeleteId(null)}>
                <DialogContent className="max-w-sm text-center">
                    <DialogHeader><DialogTitle>Xóa tài sản</DialogTitle></DialogHeader>
                    <div className="py-4 space-y-2">
                        <p className="text-sm text-muted-foreground">Bạn có chắc chắn muốn xóa tài sản này? Hành động này không thể hoàn tác.</p>
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
        </div>
    );
}

function DoorOpen(props) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M13 4h3a2 2 0 0 1 2 2v14" />
            <path d="M2 20h20" />
            <path d="M13 20V4a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v16" />
            <path d="M9 12v.01" />
            <path d="M13 4v16" />
        </svg>
    );
}
