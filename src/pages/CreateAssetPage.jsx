import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    ArrowLeft,
    Plus,
    Loader2,
    Package,
    QrCode,
    Camera,
    X,
    Upload,
    Save,
    MapPin,
    Home,
    Construction,
    Calendar,
    BadgeDollarSign
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { api } from "@/lib/api";

/* ── Constants ─────────────────────────────── */

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

/* ── Components ────────────────────────────── */

function FormSection({ title, children }) {
    return (
        <Card className="shadow-sm overflow-hidden border-border/60">
            <CardHeader className="bg-muted/30 pb-3 border-b border-border/40">
                <CardTitle className="text-base font-bold">{title}</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
                {children}
            </CardContent>
        </Card>
    );
}

function ImageUploader({ images, setImages }) {
    const [dragging, setDragging] = useState(false);
    const inputRef = useRef(null);

    const handleFiles = (files) => {
        const newImgs = Array.from(files).map((file) => ({
            url: URL.createObjectURL(file),
            name: file.name,
            file
        }));
        setImages((prev) => [...prev, ...newImgs]);
    };

    const onDrop = (e) => {
        e.preventDefault();
        setDragging(false);
        if (e.dataTransfer.files) handleFiles(e.dataTransfer.files);
    };

    const removeImg = (idx) => {
        setImages((prev) => prev.filter((_, i) => i !== idx));
    };

    return (
        <div className="space-y-4">
            <div
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                onClick={() => inputRef.current?.click()}
                className={`flex flex-col items-center justify-center gap-3 h-44 rounded-lg border-2 border-dashed cursor-pointer transition-all duration-200 ${dragging
                    ? "border-primary bg-primary/5 shadow-inner"
                    : "border-border hover:border-primary/50 hover:bg-muted/40"
                    }`}
            >
                <input
                    type="file"
                    multiple
                    className="hidden"
                    ref={inputRef}
                    onChange={(e) => handleFiles(e.target.files)}
                    accept="image/*"
                />
                <div className="size-10 rounded-full bg-muted flex items-center justify-center">
                    <Camera className="size-5 text-muted-foreground" />
                </div>
                <div className="text-center">
                    <p className="text-sm font-medium">Click hoặc kéo thả hình ảnh tài sản</p>
                    <p className="text-xs text-muted-foreground mt-1">Định dạng JPG, PNG, WEBP (Tối đa 5MB)</p>
                </div>
            </div>

            {images.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                    {images.map((img, idx) => (
                        <div key={idx} className="relative group aspect-square rounded-lg overflow-hidden border border-border bg-muted shadow-sm">
                            <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); removeImg(idx); }}
                                className="absolute top-1 right-1 size-5 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <X className="size-3" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

/* ── Main Page ─────────────────────────────── */

export default function CreateAssetPage() {
    const navigate = useNavigate();
    const [saving, setSaving] = useState(false);
    const [buildings, setBuildings] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [images, setImages] = useState([]);

    const [form, setForm] = useState({
        name: "",
        type: "furniture",
        condition: "good",
        status: "active",
        buildingId: "",
        roomId: "",
        purchaseDate: "",
        price: "",
        description: "",
    });

    useEffect(() => {
        const fetchResources = async () => {
            try {
                const [bRes, rRes] = await Promise.all([
                    api.get("/api/buildings?limit=100"),
                    api.get("/api/rooms?limit=1000")
                ]);
                setBuildings(bRes.data || []);
                setRooms(rRes.data || []);
            } catch (err) {
                console.error("Error fetching resources:", err);
            }
        };
        fetchResources();
    }, []);

    const handleChange = (k, v) => setForm((p) => ({ ...p, [k]: v }));

    const handleSave = async () => {
        if (!form.name.trim()) {
            alert("Vui lòng nhập tên tài sản");
            return;
        }

        setSaving(true);
        try {
            // Mock API delay
            await new Promise((r) => setTimeout(r, 1500));
            // In real app: FormData for images + json for data
            navigate("/assets");
        } catch (err) {
            alert("Đã xảy ra lỗi khi tạo tài sản.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-16">
            {/* Header */}
            <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={() => navigate("/assets")} className="rounded-full shadow-sm hover:translate-x-[-2px] transition-transform">
                        <ArrowLeft className="size-4" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Thêm tài sản mới</h1>
                        <p className="text-sm text-muted-foreground">Đăng ký và quản lý trang thiết bị FScape</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="ghost" onClick={() => navigate("/assets")} disabled={saving}>Hủy</Button>
                    <Button onClick={handleSave} disabled={saving} className="gap-2 px-6 shadow-md shadow-primary/20">
                        {saving ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
                        Xác nhận thêm
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Form Area */}
                <div className="lg:col-span-2 space-y-6">
                    <FormSection title="Thông tin cơ bản">
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <Label>Tên tài sản *</Label>
                                <Input
                                    placeholder="VD: Điều hòa Panasonic 12000BTU"
                                    value={form.name}
                                    onChange={(e) => handleChange("name", e.target.value)}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label>Loại tài sản</Label>
                                    <Select value={form.type} onValueChange={(v) => handleChange("type", v)}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {ASSET_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5">
                                    <Label>Tình trạng</Label>
                                    <Select value={form.condition} onValueChange={(v) => handleChange("condition", v)}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {ASSET_CONDITIONS.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                    </FormSection>

                    <FormSection title="Vị trí lắp đặt">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label>Tòa nhà</Label>
                                <Select value={form.buildingId} onValueChange={(v) => handleChange("buildingId", v)}>
                                    <SelectTrigger>
                                        <div className="flex items-center gap-2">
                                            <MapPin className="size-3.5 text-muted-foreground" />
                                            <SelectValue placeholder="Chọn tòa nhà" />
                                        </div>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">Không có (Trong kho)</SelectItem>
                                        {buildings.map(b => <SelectItem key={b.id} value={b.id.toString()}>{b.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label>Phòng</Label>
                                <Select value={form.roomId} onValueChange={(v) => handleChange("roomId", v)} disabled={!form.buildingId || form.buildingId === "none"}>
                                    <SelectTrigger>
                                        <div className="flex items-center gap-2">
                                            <Home className="size-3.5 text-muted-foreground" />
                                            <SelectValue placeholder="Chọn phòng" />
                                        </div>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="common">Khu vực chung</SelectItem>
                                        {rooms.filter(r => r.buildingId.toString() === form.buildingId).map(r => (
                                            <SelectItem key={r.id} value={r.id.toString()}>{r.roomNumber}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </FormSection>

                    <FormSection title="Mua sắm & Tài chính">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label>Giá mua (VNĐ)</Label>
                                <div className="relative">
                                    <BadgeDollarSign className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                                    <Input
                                        type="number"
                                        placeholder="0"
                                        value={form.price}
                                        onChange={(e) => handleChange("price", e.target.value)}
                                        className="pl-9"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <Label>Ngày mua</Label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                                    <Input
                                        type="date"
                                        value={form.purchaseDate}
                                        onChange={(e) => handleChange("purchaseDate", e.target.value)}
                                        className="pl-9"
                                    />
                                </div>
                            </div>
                        </div>
                    </FormSection>

                    <FormSection title="Mô tả & Ghi chú">
                        <Textarea
                            placeholder="Nhập ghi chú chi tiết, thời hạn bảo hành hoặc thông số kỹ thuật..."
                            rows={4}
                            value={form.description}
                            onChange={(e) => handleChange("description", e.target.value)}
                            className="resize-none"
                        />
                    </FormSection>
                </div>

                {/* Sidebar area: QR and Images */}
                <div className="space-y-6">
                    <FormSection title="Hình ảnh tài sản">
                        <ImageUploader images={images} setImages={setImages} />
                    </FormSection>

                    <FormSection title="Mã định danh">
                        <div className="p-4 bg-muted/50 rounded-lg flex flex-col items-center justify-center space-y-3 border border-dashed border-border">
                            <QrCode className="size-20 text-muted-foreground/30" />
                            <p className="text-[10px] text-muted-foreground text-center uppercase tracking-wider font-bold">
                                QR Code sẽ được tự động khởi tạo sau khi lưu tài sản
                            </p>
                        </div>
                        <div className="pt-2">
                            <Label className="text-[11px] font-bold uppercase text-muted-foreground">Trạng thái vận hành</Label>
                            <Select value={form.status} onValueChange={(v) => handleChange("status", v)}>
                                <SelectTrigger className="mt-1.5">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {ASSET_STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </FormSection>
                </div>
            </div>
        </div>
    );
}
