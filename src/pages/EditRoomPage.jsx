import { useState, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    ArrowLeft, Upload, FloppyDisk, X, CircleNotch, Image as ImageIcon,
} from "@phosphor-icons/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select, SelectContent, SelectItem,
    SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { api, apiJson, apiRequest } from "@/lib/apiClient";
import { cn } from "@/lib/utils";

/* ── Upload constraints (mirrors server constants/upload.js) ── */
const UPLOAD_CFG = {
    room_thumbnail: { maxFiles: 1, maxSizeMB: 5 },
    room_gallery: { maxFiles: 5, maxSizeMB: 5 },
    room_3d: { maxFiles: 1, maxSizeMB: 50, accept: '.obj,.gltf,.glb' },
    room_blueprint: { maxFiles: 1, maxSizeMB: 5 },
};

/* ── upload helper ─────────────────────────────────────────── */
async function uploadFiles(category, files) {
    const fd = new FormData();
    for (const f of files) fd.append("files", f);
    const res = await apiRequest(`/api/upload?type=${category}`, { method: "POST", body: fd });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Upload thất bại");
    }
    return res.json();
}

/* ── Single image uploader (thumbnail / 3D / blueprint) ────── */
function SingleImageUploader({ label, hint, preview, onSelect, onRemove, accept = "image/*" }) {
    const inputRef = useRef(null);
    const isImage = accept === 'image/*';
    return (
        <div className="space-y-1.5">
            <Label>{label}</Label>
            {preview ? (
                <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-border bg-muted group">
                    {isImage
                        ? <img src={preview} alt={label} className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-sm text-muted-foreground">{preview}</div>
                    }
                    <button
                        type="button" onClick={onRemove}
                        className="absolute top-2 right-2 size-7 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <X className="size-4" />
                    </button>
                </div>
            ) : (
                <button
                    type="button" onClick={() => inputRef.current?.click()}
                    className="w-full aspect-video rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
                >
                    <ImageIcon className="size-8" />
                    <span className="text-xs font-medium">Chọn file</span>
                </button>
            )}
            <input ref={inputRef} type="file" accept={accept} className="hidden"
                onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) onSelect(f);
                    e.target.value = "";
                }}
            />
            {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
        </div>
    );
}

/* ── Gallery uploader (max from UPLOAD_CFG) ────────────────── */
function GalleryUploader({ images, onChange }) {
    const inputRef = useRef(null);
    const [dragging, setDragging] = useState(false);
    const max = UPLOAD_CFG.room_gallery.maxFiles;

    const addFiles = (files) => {
        const remaining = max - images.length;
        if (remaining <= 0) return;
        const newImgs = Array.from(files)
            .filter((f) => f.type.startsWith("image/"))
            .slice(0, remaining)
            .map((f) => ({ file: f, url: URL.createObjectURL(f), name: f.name }));
        onChange([...images, ...newImgs]);
    };
    const removeImg = (idx) => onChange(images.filter((_, i) => i !== idx));

    return (
        <div className="space-y-1.5">
            <Label>Thư viện ảnh ({images.length}/{max})</Label>
            {images.length < max && (
                <div
                    onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={(e) => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files); }}
                    onClick={() => inputRef.current?.click()}
                    className={cn(
                        "flex items-center justify-center gap-3 h-24 rounded-xl border-2 border-dashed cursor-pointer transition-colors",
                        dragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/40",
                    )}
                >
                    <Upload className="size-5 text-muted-foreground" />
                    <div className="text-center">
                        <p className="text-xs font-medium">Kéo thả hoặc <span className="text-primary">chọn ảnh</span></p>
                        <p className="text-[11px] text-muted-foreground">Tối đa {max} ảnh, JPG/PNG, 5MB/ảnh</p>
                    </div>
                    <input ref={inputRef} type="file" accept="image/*" multiple className="hidden"
                        onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }}
                    />
                </div>
            )}
            {images.length > 0 && (
                <div className="grid grid-cols-5 gap-2 pt-1">
                    {images.map((img, idx) => (
                        <div key={idx} className="relative group aspect-square rounded-lg overflow-hidden border border-border bg-muted">
                            <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
                            <button type="button" onClick={() => removeImg(idx)}
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

function FormSection({ title, children }) {
    return (
        <Card className="shadow-sm overflow-hidden">
            <CardHeader className="bg-muted/30 pb-3">
                <CardTitle className="text-base font-bold">{title}</CardTitle>
            </CardHeader>
            <CardContent className="pt-5 space-y-4">{children}</CardContent>
        </Card>
    );
}

/* ── Main Page ─────────────────────────────────────────────── */
export default function EditRoomPage() {
    const navigate = useNavigate();
    const { id } = useParams();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [form, setForm] = useState({
        room_number: "", room_type_id: "", building_id: "", floor: "", status: "AVAILABLE",
    });

    // Thumbnail
    const [thumbFile, setThumbFile] = useState(null);
    const [thumbPreview, setThumbPreview] = useState(null);

    // 3D image
    const [img3dFile, setImg3dFile] = useState(null);
    const [img3dPreview, setImg3dPreview] = useState(null);

    // Blueprint image
    const [blueprintFile, setBlueprintFile] = useState(null);
    const [blueprintPreview, setBlueprintPreview] = useState(null);

    // Gallery
    const [galleryImages, setGalleryImages] = useState([]);

    const [roomTypes, setRoomTypes] = useState([]);
    const [buildings, setBuildings] = useState([]);

    // Lock reasons fetched from room detail
    const [lockReasons, setLockReasons] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [rtRes, buildRes, roomRes] = await Promise.all([
                    api.get("/api/room-types?is_active=true&limit=100"),
                    api.get("/api/buildings?limit=100"),
                    api.get(`/api/rooms/${id}`),
                ]);

                const rts = rtRes.data || [];
                const blds = buildRes.data || [];
                setRoomTypes(rts);
                setBuildings(blds);

                const r = roomRes.data || roomRes;

                setForm({
                    room_number: r.room_number || "",
                    room_type_id: r.room_type_id || r.room_type?.id || "",
                    building_id: r.building_id || r.building?.id || "",
                    floor: r.floor?.toString() || "",
                    status: r.status || "AVAILABLE",
                });

                if (r.thumbnail_url) setThumbPreview(r.thumbnail_url);
                if (r.image_3d_url) setImg3dPreview(r.image_3d_url);
                if (r.blueprint_url) setBlueprintPreview(r.blueprint_url);

                // Gallery — API returns images as array of strings
                if (Array.isArray(r.images) && r.images.length > 0) {
                    setGalleryImages(r.images.map(img => {
                        const url = typeof img === 'string' ? img : img?.image_url;
                        return { url, name: "Existing", existing: true };
                    }));
                }

                // Determine lock reasons
                const reasons = [];
                const activeContracts = (r.resident_contracts || []).filter(c =>
                    ['ACTIVE', 'EXPIRING_SOON', 'PENDING_CUSTOMER_SIGNATURE', 'PENDING_MANAGER_SIGNATURE', 'DRAFT'].includes(c.status)
                );
                const activeBookings = (r.resident_bookings || []).filter(b =>
                    ['PENDING', 'DEPOSIT_PAID'].includes(b.status)
                );
                if (r.current_resident) reasons.push(`Đang có người thuê: ${r.current_resident.first_name} ${r.current_resident.last_name}`);
                if (activeContracts.length > 0) reasons.push(`Có ${activeContracts.length} hợp đồng đang hoạt động`);
                if (activeBookings.length > 0) reasons.push(`Có ${activeBookings.length} đặt phòng đang chờ`);
                setLockReasons(reasons);

            } catch (err) {
                console.error("Error fetching room data:", err);
                alert("Không thể tải dữ liệu phòng.");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    const handleChange = (k, v) => setForm((p) => ({ ...p, [k]: v }));

    const handleSave = async () => {
        if (!form.room_number || !form.building_id || !form.room_type_id || !form.floor) {
            alert("Vui lòng điền đầy đủ các thông tin bắt buộc (*)");
            return;
        }
        setSaving(true);
        try {
            // Upload thumbnail
            let thumbnail_url = undefined;
            if (thumbFile) {
                const res = await uploadFiles("room_thumbnail", [thumbFile]);
                thumbnail_url = res.urls?.[0] || res.data?.url || null;
            }

            // Upload 3D image
            let image_3d_url = undefined;
            if (img3dFile) {
                const res = await uploadFiles("room_3d", [img3dFile]);
                image_3d_url = res.urls?.[0] || res.data?.url || null;
            }

            // Upload blueprint
            let blueprint_url = undefined;
            if (blueprintFile) {
                const res = await uploadFiles("room_blueprint", [blueprintFile]);
                blueprint_url = res.urls?.[0] || res.data?.url || null;
            }

            // Upload new gallery files
            const newGalleryFiles = galleryImages.filter(g => g.file).map(g => g.file);
            const existingGalleryUrls = galleryImages.filter(g => g.existing && !g.file).map(g => g.url);
            let newGalleryUrls = [];
            if (newGalleryFiles.length > 0) {
                const res = await uploadFiles("room_gallery", newGalleryFiles);
                newGalleryUrls = res.urls || res.data?.urls || [];
            }

            const payload = {
                room_number: form.room_number.trim(),
                building_id: form.building_id,
                room_type_id: form.room_type_id,
                floor: parseInt(form.floor) || 1,
                status: form.status,
                gallery_images: [...existingGalleryUrls, ...newGalleryUrls],
            };
            if (thumbnail_url !== undefined) payload.thumbnail_url = thumbnail_url;
            if (image_3d_url !== undefined) payload.image_3d_url = image_3d_url;
            if (blueprint_url !== undefined) payload.blueprint_url = blueprint_url;

            await apiJson(`/api/rooms/${id}`, { method: "PUT", body: payload });
            navigate(`/rooms/${id}`);
        } catch (err) {
            alert(err.message || "Đã xảy ra lỗi khi cập nhật phòng.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="py-20 flex justify-center"><CircleNotch className="size-8 animate-spin text-muted-foreground" /></div>
    );

    const isLocked = lockReasons.length > 0;

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-24">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" onClick={() => navigate(`/rooms/${id}`)} className="rounded-full">
                    <ArrowLeft className="size-4" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Chỉnh sửa phòng</h1>
                    <p className="text-sm text-muted-foreground">Cập nhật thông tin phòng {form.room_number}.</p>
                </div>
            </div>

            {/* Lock notice */}
            {isLocked && (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 space-y-1">
                    <p className="text-sm font-semibold text-amber-700">Không thể chỉnh sửa phòng này</p>
                    {lockReasons.map(r => (
                        <p key={r} className="text-xs text-amber-600">• {r}</p>
                    ))}
                </div>
            )}

            <div className="space-y-6">
                {/* Basic Information */}
                <FormSection title="Thông tin cơ bản">
                    <fieldset disabled={isLocked} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label>Tên / Mã phòng *</Label>
                                <Input placeholder="VD: A-210" value={form.room_number}
                                    onChange={(e) => handleChange("room_number", e.target.value)} />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Loại phòng *</Label>
                                <Select value={form.room_type_id} onValueChange={(v) => handleChange("room_type_id", v)}>
                                    <SelectTrigger><SelectValue placeholder="Chọn loại phòng" /></SelectTrigger>
                                    <SelectContent>
                                        {roomTypes.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="space-y-1.5 col-span-2">
                                <Label>Tòa nhà *</Label>
                                <Select value={form.building_id} onValueChange={(v) => handleChange("building_id", v)}>
                                    <SelectTrigger><SelectValue placeholder="Chọn tòa nhà" /></SelectTrigger>
                                    <SelectContent>
                                        {buildings.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label>Tầng *</Label>
                                <Input type="number" placeholder="VD: 5" value={form.floor}
                                    onChange={(e) => handleChange("floor", e.target.value)} className="text-center" />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Trạng thái</Label>
                                <Select value={form.status} onValueChange={(v) => handleChange("status", v)}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="AVAILABLE">Còn trống</SelectItem>
                                        <SelectItem value="MAINTENANCE">Bảo trì</SelectItem>
                                        <SelectItem value="LOCKED">Khóa</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </fieldset>
                </FormSection>

                {/* Images */}
                <FormSection title="Hình ảnh">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <SingleImageUploader
                            label="Ảnh đại diện (Thumbnail)"
                            hint={`JPG/PNG. Tối đa ${UPLOAD_CFG.room_thumbnail.maxSizeMB}MB.`}
                            preview={thumbPreview}
                            onSelect={(f) => { setThumbFile(f); setThumbPreview(URL.createObjectURL(f)); }}
                            onRemove={() => { setThumbFile(null); setThumbPreview(null); }}
                        />
                        <GalleryUploader images={galleryImages} onChange={setGalleryImages} />
                    </div>
                </FormSection>

                {/* 3D + Blueprint */}
                <FormSection title="Mô hình 3D &amp; Bản vẽ (Tùy chọn)">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <SingleImageUploader
                            label="File 3D (OBJ / GLTF / GLB)"
                            hint={`Định dạng: .obj, .gltf, .glb. Tối đa ${UPLOAD_CFG.room_3d.maxSizeMB}MB.`}
                            preview={img3dPreview}
                            accept={UPLOAD_CFG.room_3d.accept}
                            onSelect={(f) => { setImg3dFile(f); setImg3dPreview(f.name); }}
                            onRemove={() => { setImg3dFile(null); setImg3dPreview(null); }}
                        />
                        <SingleImageUploader
                            label="Bản vẽ (Blueprint)"
                            hint={`JPG/PNG. Tối đa ${UPLOAD_CFG.room_blueprint.maxSizeMB}MB.`}
                            preview={blueprintPreview}
                            onSelect={(f) => { setBlueprintFile(f); setBlueprintPreview(URL.createObjectURL(f)); }}
                            onRemove={() => { setBlueprintFile(null); setBlueprintPreview(null); }}
                        />
                    </div>
                </FormSection>
            </div>

            {/* Sticky Action Bar */}
            <div className="fixed bottom-0 right-0 left-56 bg-background/95 backdrop-blur-md border-t border-border p-4 flex items-center justify-end gap-3 z-50 px-8">
                <Button variant="outline" onClick={() => navigate(`/rooms/${id}`)} disabled={saving} className="bg-background">Hủy</Button>
                <Button onClick={handleSave} disabled={saving || isLocked}>
                    {saving ? <CircleNotch className="size-4 animate-spin mr-1.5" /> : <FloppyDisk className="size-4 mr-1.5" />}
                    Lưu thay đổi
                </Button>
            </div>
        </div>
    );
}
