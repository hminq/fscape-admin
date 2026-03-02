import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
    ArrowLeft,
    Upload,
    ImagePlus,
    X,
    Plus,
    Save,
    Loader2,
    MapPin,
    Building2,
    Layers,
    Info
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
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

/* ── Components ────────────────────────────── */

function FormSection({ title, icon: Icon, children }) {
    return (
        <Card className="shadow-sm overflow-hidden border-border/50">
            <CardHeader className="bg-muted/30 pb-3 border-b">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                    {Icon && <Icon className="size-4 text-primary" />}
                    {title}
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
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
                <div className="text-center px-4">
                    <p className="text-sm font-semibold text-foreground">Kéo thả ảnh vào đây hoặc click để tải lên</p>
                    <p className="text-xs text-muted-foreground mt-1">Hỗ trợ JPG, PNG (tối đa 5MB mỗi file). Ảnh đầu tiên sẽ là ảnh đại diện.</p>
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
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
                    {images.map((img, idx) => (
                        <div key={idx} className="relative group aspect-[4/3] rounded-lg overflow-hidden border border-border bg-muted shadow-sm">
                            <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
                            {idx === 0 && (
                                <span className="absolute bottom-0 left-0 right-0 text-[10px] font-bold text-center bg-primary text-primary-foreground py-1 uppercase tracking-wider">
                                    Ảnh đại diện
                                </span>
                            )}
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); removeImg(idx); }}
                                className="absolute top-1.5 right-1.5 size-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm"
                            >
                                <X className="size-3.5" />
                            </button>
                        </div>
                    ))}
                    <button
                        type="button"
                        onClick={() => inputRef.current?.click()}
                        className="aspect-[4/3] rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-primary hover:border-primary/50 transition-colors"
                    >
                        <ImagePlus className="size-5" />
                        <span className="text-[10px] font-medium">Thêm ảnh</span>
                    </button>
                </div>
            )}
        </div>
    );
}

/* ── Main Page ─────────────────────────────── */

export default function CreateBuildingPage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [saving, setSaving] = useState(false);
    const [locations, setLocations] = useState([]);

    const [form, setForm] = useState({
        name: "",
        location_id: "",
        address: "",
        latitude: "",
        longitude: "",
        total_floors: "",
        is_active: "true",
        description: "",
        images: [],
    });

    const [errors, setErrors] = useState({});

    useEffect(() => {
        const fetchLocations = async () => {
            try {
                const res = await api.get("/api/locations?limit=100&is_active=true");
                setLocations(res.data || []);
            } catch (err) {
                console.error("Error fetching locations:", err);
            }
        };
        fetchLocations();
    }, []);

    const handleChange = (k, v) => {
        setForm((p) => ({ ...p, [k]: v }));
        if (errors[k]) setErrors(p => ({ ...p, [k]: false }));
    };

    const validate = () => {
        const e = {};
        if (!form.name.trim()) e.name = "Tên tòa nhà là bắt buộc";
        if (!form.location_id) e.location_id = "Vui lòng chọn khu vực";
        if (!form.address.trim()) e.address = "Địa chỉ là bắt buộc";

        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSave = async () => {
        if (!validate()) return;

        setSaving(true);
        try {
            const payload = {
                name: form.name.trim(),
                location_id: form.location_id,
                address: form.address.trim(),
                description: form.description.trim() || null,
                total_floors: form.total_floors ? Number(form.total_floors) : null,
                latitude: form.latitude.trim() || null,
                longitude: form.longitude.trim() || null,
                is_active: form.is_active === "true",
                manager_id: "1"
            };

            // Note: Currently calling typical JSON POST. 
            // If images need to be uploaded as multipart, use FormData instead.
            await api.post("/api/buildings", payload);

            navigate("/buildings");
        } catch (err) {
            alert(err.message || "Đã xảy ra lỗi khi tạo tòa nhà. Vui lòng thử lại.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-16 pt-2">
            {/* Top Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => navigate("/buildings")}
                        className="rounded-full shadow-sm hover:translate-x-[-2px] transition-transform"
                    >
                        <ArrowLeft className="size-4" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Thêm tòa nhà mới</h1>
                        <p className="text-sm text-muted-foreground">Khởi tạo hệ thống quản lý cho một tòa nhà FScape mới.</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" onClick={() => navigate("/buildings")} disabled={saving}>
                        Hủy bỏ
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={saving}
                        className="gap-2 bg-primary hover:bg-primary/90 shadow-md min-w-[140px]"
                    >
                        {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                        Lưu tòa nhà
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                    {/* Basic Information */}
                    <FormSection title="Thông tin cơ bản" icon={Building2}>
                        <div className="space-y-1.5">
                            <Label className={errors.name ? "text-destructive" : ""}>Tên tòa nhà *</Label>
                            <Input
                                placeholder="VD: FScape Cầu Giấy"
                                value={form.name}
                                onChange={(e) => handleChange("name", e.target.value)}
                                className={errors.name ? "border-destructive focus-visible:ring-destructive" : ""}
                            />
                            {errors.name && <p className="text-[11px] text-destructive font-medium">{errors.name}</p>}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className={errors.location_id ? "text-destructive" : ""}>Khu vực *</Label>
                                <Select value={form.location_id} onValueChange={(v) => handleChange("location_id", v)}>
                                    <SelectTrigger className={errors.location_id ? "border-destructive focus-visible:ring-destructive" : ""}>
                                        <SelectValue placeholder="Chọn khu vực" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {locations.map((loc) => (
                                            <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.location_id && <p className="text-[11px] text-destructive font-medium">{errors.location_id}</p>}
                            </div>
                            <div className="space-y-1.5">
                                <Label>Số tầng</Label>
                                <div className="relative">
                                    <Layers className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                                    <Input
                                        type="number"
                                        min="1"
                                        placeholder="VD: 12"
                                        value={form.total_floors}
                                        onChange={(e) => handleChange("total_floors", e.target.value)}
                                        className="pl-9"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label className={errors.address ? "text-destructive" : ""}>Địa chỉ chi tiết *</Label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                                <Input
                                    placeholder="VD: 144 Xuân Thủy, Cầu Giấy, Hà Nội"
                                    value={form.address}
                                    onChange={(e) => handleChange("address", e.target.value)}
                                    className={cn("pl-9", errors.address && "border-destructive focus-visible:ring-destructive")}
                                />
                            </div>
                            {errors.address && <p className="text-[11px] text-destructive font-medium">{errors.address}</p>}
                        </div>
                    </FormSection>

                    {/* Description */}
                    <FormSection title="Mô tả tòa nhà" icon={Info}>
                        <div className="space-y-1.5">
                            <Label>Nội dung mô tả</Label>
                            <Textarea
                                placeholder="Nhập giới thiệu chi tiết về tòa nhà, các tiện ích nổi bật hoặc quy định chung..."
                                rows={6}
                                value={form.description}
                                onChange={(e) => handleChange("description", e.target.value)}
                                className="p-3 resize-none border-border/60 focus:border-primary/50"
                            />
                        </div>
                    </FormSection>

                    {/* Images */}
                    <FormSection title="Hình ảnh tòa nhà" icon={ImagePlus}>
                        <ImageUploader
                            images={form.images}
                            onChange={(imgs) => handleChange("images", imgs)}
                        />
                    </FormSection>
                </div>

                <div className="space-y-6">
                    {/* Status & Options */}
                    <Card className="shadow-sm border-border/50">
                        <CardHeader className="bg-muted/30 pb-3 border-b">
                            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Trạng thái & Tùy chọn</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-5 space-y-4">
                            <div className="space-y-2">
                                <Label>Trạng thái hoạt động</Label>
                                <Select value={form.is_active} onValueChange={(v) => handleChange("is_active", v)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="true">Đang hoạt động</SelectItem>
                                        <SelectItem value="false">Tạm ngưng</SelectItem>
                                    </SelectContent>
                                </Select>
                                <p className="text-[11px] text-muted-foreground leading-relaxed pt-1">
                                    Khi ở bộ trạng thái &quot;Tạm ngưng&quot;, tòa nhà và các phòng thuộc nó sẽ không hiển thị trên app khách hàng.
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Coordinates */}
                    <Card className="shadow-sm border-border/50">
                        <CardHeader className="bg-muted/30 pb-3 border-b">
                            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Tọa độ Bản đồ</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-5 space-y-4">
                            <div className="space-y-2">
                                <Label>Vĩ độ (Latitude)</Label>
                                <Input
                                    placeholder="21.0285..."
                                    value={form.latitude}
                                    onChange={(e) => handleChange("latitude", e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Kinh độ (Longitude)</Label>
                                <Input
                                    placeholder="105.8048..."
                                    value={form.longitude}
                                    onChange={(e) => handleChange("longitude", e.target.value)}
                                />
                            </div>
                            <p className="text-[11px] text-muted-foreground italic">
                                * Toạ độ giúp hiển thị vị trí tòa nhà chính xác trên bản đồ cho khách hàng.
                            </p>
                        </CardContent>
                    </Card>

                    {/* Help Card */}
                    <Card className="bg-primary/[0.03] border-primary/10 shadow-none">
                        <CardContent className="pt-5 space-y-3">
                            <div className="flex items-start gap-2 text-primary">
                                <Info className="size-4 shrink-0 mt-0.5" />
                                <h4 className="text-sm font-bold">Lưu ý</h4>
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                Sau khi tạo tòa nhà, bạn có thể tiếp tục thêm các <strong>Tầng</strong> và <strong>Phòng</strong> trong phần quản lý chi tiết tòa nhà.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Sticky Actions Mobile */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-background border-t flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => navigate("/buildings")}>Hủy</Button>
                <Button onClick={handleSave} disabled={saving} className="flex-1">
                    {saving ? <Loader2 className="size-4 animate-spin" /> : "Lưu"}
                </Button>
            </div>
        </div>
    );
}


