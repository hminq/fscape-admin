import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    ArrowLeft,
    Upload,
    ImagePlus,
    X,
    Plus,
    Save,
    Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

/* ── Constants ─────────────────────────────── */

const STATUSES = [
    { value: "available", label: "Còn trống" },
    { value: "occupied", label: "Đã thuê" },
    { value: "maintenance", label: "Bảo trì" },
];
const CONTRACT_TYPES = ["Hợp đồng 6 tháng", "Hợp đồng 12 tháng", "Linh hoạt"];
const MINIMUM_STAY_OPTIONS = ["1 tháng", "3 tháng", "6 tháng", "1 năm"];
const BED_TYPES = ["Giường đơn", "Giường đôi", "Giường tầng", "King size"];
const BATHROOM_TYPES = ["Khép kín", "Chung"];

const AMENITIES_IN_ROOM = [
    { id: "wifi", label: "WiFi" },
    { id: "study_desk", label: "Bàn học" },
    { id: "chair", label: "Ghế" },
    { id: "wardrobe", label: "Tủ quần áo" },
    { id: "ac", label: "Điều hòa" },
    { id: "heating", label: "Lò sưởi" },
    { id: "window", label: "Cửa sổ" },
    { id: "mirror", label: "Gương" },
];

const AMENITIES_SHARED = [
    { id: "kitchen", label: "Bếp" },
    { id: "laundry", label: "Giặt là" },
    { id: "gym", label: "Gym" },
    { id: "study_room", label: "Phòng học" },
    { id: "common_area", label: "Khu vực chung" },
    { id: "rooftop", label: "Sân thượng" },
    { id: "bike_storage", label: "Nhà để xe đạp" },
    { id: "cinema", label: "Phòng chiếu phim" },
];

/* ── Components ────────────────────────────── */

function FormSection({ title, children }) {
    return (
        <Card className="shadow-sm overflow-hidden">
            <CardHeader className="bg-muted/30 pb-3">
                <CardTitle className="text-base font-bold">{title}</CardTitle>
            </CardHeader>
            <CardContent className="pt-5 space-y-4">
                {children}
            </CardContent>
        </Card>
    );
}

function ImageUploader({ images, onChange }) {
    const inputRef = useRef(null);
    const [dragging, setDragging] = useState(false);

    const addFiles = (files) => {
        const newImgs = Array.from(files)
            .filter((f) => f.type.startsWith("image/"))
            .map((f) => ({ file: f, url: URL.createObjectURL(f), name: f.name }));
        onChange([...images, ...newImgs]);
    };

    const removeImg = (idx) => {
        onChange(images.filter((_, i) => i !== idx));
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragging(false);
        addFiles(e.dataTransfer.files);
    };

    return (
        <div className="space-y-4">
            <div
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
                className={`flex flex-col items-center justify-center gap-3 h-44 rounded-lg border-2 border-dashed cursor-pointer transition-all duration-200 ${dragging
                    ? "border-primary bg-primary/5 shadow-inner"
                    : "border-border hover:border-primary/50 hover:bg-muted/40"
                    }`}
            >
                <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <Upload className="size-6" />
                </div>
                <div className="text-center">
                    <p className="text-sm font-semibold">Kéo thả ảnh vào đây hoặc click để tải lên</p>
                    <p className="text-xs text-muted-foreground mt-1">Hỗ trợ: JPG, PNG, GIF (tối đa 5MB mỗi file)</p>
                </div>
                <input
                    ref={inputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => addFiles(e.target.files)}
                />
            </div>

            {images.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                    {images.map((img, idx) => (
                        <div key={idx} className="relative group aspect-square rounded-lg overflow-hidden border border-border bg-muted shadow-sm">
                            <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
                            {idx === 0 && (
                                <span className="absolute bottom-0 left-0 right-0 text-[10px] font-bold text-center bg-primary text-primary-foreground py-0.5">
                                    Ảnh chính
                                </span>
                            )}
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

function CheckboxItem({ label, checked, onChange }) {
    return (
        <label className={`flex items-center gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-all hover:shadow-sm ${checked ? "bg-primary/5 border-primary/30" : "bg-card border-border hover:border-primary/20"
            }`}>
            <div className={`size-5 rounded border flex items-center justify-center transition-colors ${checked ? "bg-primary border-primary text-primary-foreground" : "bg-transparent border-input"
                }`}>
                {checked && <X className="size-3 rotate-45" />}
            </div>
            <input
                type="checkbox"
                className="hidden"
                checked={checked}
                onChange={(e) => onChange(e.target.checked)}
            />
            <span className={`text-sm font-medium ${checked ? "text-primary" : "text-muted-foreground"}`}>{label}</span>
        </label>
    );
}

/* ── Main Page ─────────────────────────────── */

export default function CreateRoomPage() {
    const navigate = useNavigate();
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        name: "",
        typeId: "",
        buildingId: "",
        floor: "",
        status: "available",
        pricePerWeek: "",
        contractType: "",
        minStay: "",
        availableFrom: "",
        size: "",
        bedType: "",
        bathroomType: "",
        maxOccupancy: "1",
        amenities: [],
        images: [],
        description: "",
    });

    const [roomTypes, setRoomTypes] = useState([]);
    const [buildings, setBuildings] = useState([]);

    useEffect(() => {
        const fetchResources = async () => {
            try {
                const [rtRes, buildRes] = await Promise.all([
                    api.get("/api/room-types?is_active=true&limit=100"),
                    api.get("/api/buildings?is_active=true&limit=100"),
                ]);
                setRoomTypes(rtRes.data || []);
                setBuildings(buildRes.data || []);
            } catch (err) {
                console.error("Error fetching resources:", err);
            }
        };
        fetchResources();
    }, []);

    const handleChange = (k, v) => setForm((p) => ({ ...p, [k]: v }));

    const toggleAmenity = (id) => {
        setForm((p) => ({
            ...p,
            amenities: p.amenities.includes(id)
                ? p.amenities.filter((a) => a !== id)
                : [...p.amenities, id],
        }));
    };

    const handleSave = async (isDraft = false) => {
        setSaving(true);
        // Mimic API call
        await new Promise((r) => setTimeout(r, 1500));
        setSaving(false);
        navigate("/rooms");
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-16">
            {/* Top Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={() => navigate("/rooms")} className="rounded-full shadow-sm hover:translate-x-[-2px] transition-transform">
                        <ArrowLeft className="size-4" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Tạo phòng mới</h1>
                        <p className="text-sm text-muted-foreground">Thêm thông tin chi tiết cho căn phòng FScape mới.</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" onClick={() => handleSave(true)} disabled={saving} className="gap-2">
                        <Save className="size-4" /> Lưu bản nháp
                    </Button>
                    <Button onClick={() => handleSave(false)} disabled={saving} className="gap-2 bg-primary hover:bg-primary/90 shadow-md">
                        {saving ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
                        Tạo phòng
                    </Button>
                </div>
            </div>

            <div className="space-y-6">
                {/* Basic Information */}
                <FormSection title="Thông tin cơ bản">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label>Tên / Mã phòng *</Label>
                            <Input
                                placeholder="VD: A-210"
                                value={form.name}
                                onChange={(e) => handleChange("name", e.target.value)}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Loại phòng *</Label>
                            <Select value={form.typeId} onValueChange={(v) => handleChange("typeId", v)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Chọn loại phòng" />
                                </SelectTrigger>
                                <SelectContent>
                                    {roomTypes.map((t) => <SelectItem key={t.id} value={t.id.toString()}>{t.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                            <Label>Tòa nhà *</Label>
                            <Select value={form.buildingId} onValueChange={(v) => handleChange("buildingId", v)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Chọn tòa nhà" />
                                </SelectTrigger>
                                <SelectContent>
                                    {buildings.map((b) => <SelectItem key={b.id} value={b.id.toString()}>{b.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label>Tầng *</Label>
                            <Input
                                type="number"
                                placeholder="VD: 12"
                                value={form.floor}
                                onChange={(e) => handleChange("floor", e.target.value)}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Trạng thái</Label>
                            <Select value={form.status} onValueChange={(v) => handleChange("status", v)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Chọn trạng thái" />
                                </SelectTrigger>
                                <SelectContent>
                                    {STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </FormSection>

                {/* Pricing & Contract */}
                <FormSection title="Giá & Hợp đồng">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label>Giá thuê (đ/tháng) *</Label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">đ</span>
                                <Input
                                    type="number"
                                    placeholder="0"
                                    value={form.pricePerWeek}
                                    onChange={(e) => handleChange("pricePerWeek", e.target.value)}
                                    className="pl-7"
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label>Loại hợp đồng *</Label>
                            <Select value={form.contractType} onValueChange={(v) => handleChange("contractType", v)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Chọn loại hợp đồng" />
                                </SelectTrigger>
                                <SelectContent>
                                    {CONTRACT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label>Ở tối thiểu *</Label>
                            <Select value={form.minStay} onValueChange={(v) => handleChange("minStay", v)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="VD: 6 tháng" />
                                </SelectTrigger>
                                <SelectContent>
                                    {MINIMUM_STAY_OPTIONS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label>Ngày trống *</Label>
                            <Input
                                type="date"
                                value={form.availableFrom}
                                onChange={(e) => handleChange("availableFrom", e.target.value)}
                            />
                        </div>
                    </div>
                </FormSection>

                {/* Room Specifications */}
                <FormSection title="Thông số phòng">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label>Diện tích (m²) *</Label>
                            <Input
                                type="number"
                                placeholder="0"
                                value={form.size}
                                onChange={(e) => handleChange("size", e.target.value)}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Loại giường *</Label>
                            <Select value={form.bedType} onValueChange={(v) => handleChange("bedType", v)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Chọn loại giường" />
                                </SelectTrigger>
                                <SelectContent>
                                    {BED_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label>Phòng tắm *</Label>
                            <Select value={form.bathroomType} onValueChange={(v) => handleChange("bathroomType", v)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Chọn loại phòng tắm" />
                                </SelectTrigger>
                                <SelectContent>
                                    {BATHROOM_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label>Số người ở tối đa *</Label>
                            <Input
                                type="number"
                                min="1"
                                placeholder="1"
                                value={form.maxOccupancy}
                                onChange={(e) => handleChange("maxOccupancy", e.target.value)}
                            />
                        </div>
                    </div>
                </FormSection>

                {/* Amenities */}
                <FormSection title="Tiện nghi">
                    <div className="space-y-6">
                        <div>
                            <p className="text-[13px] font-bold text-muted-foreground mb-3 uppercase tracking-tight">Trong phòng</p>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {AMENITIES_IN_ROOM.map((a) => (
                                    <CheckboxItem
                                        key={a.id}
                                        label={a.label}
                                        checked={form.amenities.includes(a.id)}
                                        onChange={() => toggleAmenity(a.id)}
                                    />
                                ))}
                            </div>
                        </div>
                        <div>
                            <p className="text-[13px] font-bold text-muted-foreground mb-3 uppercase tracking-tight">Khu vực chung</p>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {AMENITIES_SHARED.map((a) => (
                                    <CheckboxItem
                                        key={a.id}
                                        label={a.label}
                                        checked={form.amenities.includes(a.id)}
                                        onChange={() => toggleAmenity(a.id)}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </FormSection>

                {/* Room Images */}
                <FormSection title="Hình ảnh phòng">
                    <ImageUploader
                        images={form.images}
                        onChange={(imgs) => handleChange("images", imgs)}
                    />
                </FormSection>

                {/* Description */}
                <FormSection title="Mô tả">
                    <div className="space-y-1.5">
                        <Label>Mô tả phòng</Label>
                        <Textarea
                            placeholder="Nhập mô tả chi tiết về phòng, các tính năng, và thông tin bổ sung..."
                            rows={5}
                            value={form.description}
                            onChange={(e) => handleChange("description", e.target.value)}
                            className="p-3 resize-none"
                        />
                    </div>
                </FormSection>

                {/* Final Actions */}
                <div className="flex items-center justify-end gap-3 pt-2">
                    <Button variant="ghost" onClick={() => navigate("/rooms")} disabled={saving} className="text-muted-foreground">
                        Hủy bỏ
                    </Button>
                    <Button onClick={() => handleSave(false)} disabled={saving} className="px-8 shadow-md">
                        {saving ? <Loader2 className="size-4 animate-spin mr-2" /> : <Plus className="size-4 mr-2" />}
                        Xác nhận tạo phòng
                    </Button>
                </div>
            </div>
        </div>
    );
}
