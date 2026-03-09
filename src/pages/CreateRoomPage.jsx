import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    ArrowLeft, Upload, FloppyDisk, X, Plus, CircleNotch,
    Image as ImageIcon, Stack as Layers, House,
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

/* ── Reusable sub-components ───────────────────────────────── */

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
                    <button type="button" onClick={onRemove}
                        className="absolute top-2 right-2 size-7 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <X className="size-4" />
                    </button>
                </div>
            ) : (
                <button type="button" onClick={() => inputRef.current?.click()}
                    className="w-full aspect-video rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors">
                    <ImageIcon className="size-8" />
                    <span className="text-xs font-medium">Chọn file</span>
                </button>
            )}
            <input ref={inputRef} type="file" accept={accept} className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) onSelect(f); e.target.value = ""; }}
            />
            {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
        </div>
    );
}

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
                                className="absolute top-1 right-1 size-5 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <X className="size-3" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

/* ── Room number preview (client-side, mirrors server util) ── */

function generateRoomNumbersPreview(floor, count, existing = []) {
    const taken = new Set(existing);
    const results = [];
    for (let seq = 1; results.length < count; seq++) {
        const candidate = `${floor}${String(seq).padStart(2, '0')}`;
        if (!taken.has(candidate)) {
            results.push(candidate);
            taken.add(candidate);
        } else {
            for (let code = 65; code <= 90; code++) {
                const suffixed = candidate + String.fromCharCode(code);
                if (!taken.has(suffixed)) {
                    results.push(suffixed);
                    taken.add(suffixed);
                    break;
                }
            }
        }
    }
    return results;
}

/* ── Batch form sub-component ─────────────────────────────── */

function BatchForm({ buildings, roomTypes, saving, onSave, onCancel }) {
    const [batch, setBatch] = useState({ building_id: "", room_type_id: "", floor: "", count: "" });
    const [existingNumbers, setExistingNumbers] = useState([]);
    const [loadingPreview, setLoadingPreview] = useState(false);

    const [thumbFile, setThumbFile] = useState(null);
    const [thumbPreview, setThumbPreview] = useState(null);
    const [img3dFile, setImg3dFile] = useState(null);
    const [img3dPreview, setImg3dPreview] = useState(null);
    const [blueprintFile, setBlueprintFile] = useState(null);
    const [blueprintPreview, setBlueprintPreview] = useState(null);
    const [galleryImages, setGalleryImages] = useState([]);

    const set = (k, v) => setBatch(p => ({ ...p, [k]: v }));

    useEffect(() => {
        if (!batch.building_id) { setExistingNumbers([]); return; }
        let cancelled = false;
        setLoadingPreview(true);
        api.get(`/api/rooms?building_id=${batch.building_id}&limit=1000`)
            .then(res => { if (!cancelled) setExistingNumbers((res.data || []).map(r => r.room_number)); })
            .catch(() => { if (!cancelled) setExistingNumbers([]); })
            .finally(() => { if (!cancelled) setLoadingPreview(false); });
        return () => { cancelled = true; };
    }, [batch.building_id]);

    const floor = parseInt(batch.floor) || 0;
    const count = Math.min(Math.max(parseInt(batch.count) || 0, 0), 50);
    const preview = (floor > 0 && count > 0) ? generateRoomNumbersPreview(floor, count, existingNumbers) : [];

    const canSave = batch.building_id && batch.room_type_id && floor > 0 && count > 0;

    const handleSubmit = () => {
        onSave({ ...batch, thumbFile, img3dFile, blueprintFile, galleryImages });
    };

    return (
        <div className="space-y-6">
            <FormSection title="Tạo hàng loạt">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <Label>Tòa nhà *</Label>
                        <Select value={batch.building_id} onValueChange={(v) => set("building_id", v)}>
                            <SelectTrigger><SelectValue placeholder="Chọn tòa nhà" /></SelectTrigger>
                            <SelectContent>
                                {buildings.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1.5">
                        <Label>Loại phòng *</Label>
                        <Select value={batch.room_type_id} onValueChange={(v) => set("room_type_id", v)}>
                            <SelectTrigger><SelectValue placeholder="Chọn loại phòng" /></SelectTrigger>
                            <SelectContent>
                                {roomTypes.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <Label>Tầng *</Label>
                        <div className="relative">
                            <Layers className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                            <Input type="number" min="1" placeholder="VD: 3"
                                value={batch.floor} onChange={(e) => set("floor", e.target.value)} className="pl-9" />
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <Label>Số lượng phòng * <span className="text-muted-foreground font-normal">(tối đa 50)</span></Label>
                        <div className="relative">
                            <House className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                            <Input type="number" min="1" max="50" placeholder="VD: 10"
                                value={batch.count} onChange={(e) => set("count", e.target.value)} className="pl-9" />
                        </div>
                    </div>
                </div>
            </FormSection>

            {/* Images — shared across all batch rooms */}
            <FormSection title="Hình ảnh (áp dụng cho tất cả phòng)">
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

            {/* Preview */}
            {preview.length > 0 && (
                <FormSection title={`Xem trước — ${preview.length} phòng sẽ được tạo`}>
                    {loadingPreview ? (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
                            <CircleNotch className="size-4 animate-spin" /> Đang kiểm tra phòng hiện có...
                        </div>
                    ) : (
                        <div className="flex flex-wrap gap-2">
                            {preview.map(num => (
                                <span key={num} className="px-3 py-1.5 rounded-lg border border-border bg-muted/50 text-sm font-mono font-medium">
                                    {num}
                                </span>
                            ))}
                        </div>
                    )}
                </FormSection>
            )}

            {/* Sticky Action Bar */}
            <div className="fixed bottom-0 right-0 left-56 bg-background/95 backdrop-blur-md border-t border-border p-4 flex items-center justify-end gap-3 z-50 px-8">
                <Button variant="outline" onClick={onCancel} disabled={saving} className="bg-background">Hủy</Button>
                <Button onClick={handleSubmit} disabled={saving || !canSave}>
                    {saving ? <CircleNotch className="size-4 animate-spin mr-1.5" /> : <Plus className="size-4 mr-1.5" />}
                    Tạo {count > 0 ? `${count} phòng` : "phòng"}
                </Button>
            </div>
        </div>
    );
}

/* ── Main Page ─────────────────────────────────────────────── */

export default function CreateRoomPage() {
    const navigate = useNavigate();
    const [mode, setMode] = useState("single");
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
    // Blueprint
    const [blueprintFile, setBlueprintFile] = useState(null);
    const [blueprintPreview, setBlueprintPreview] = useState(null);
    // Gallery
    const [galleryImages, setGalleryImages] = useState([]);

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

    const handleSaveSingle = async () => {
        if (!form.room_number || !form.building_id || !form.room_type_id || !form.floor) {
            alert("Vui lòng điền đầy đủ các thông tin bắt buộc (*)");
            return;
        }

        setSaving(true);
        try {
            let thumbnail_url = null;
            if (thumbFile) {
                const res = await uploadFiles("room_thumbnail", [thumbFile]);
                thumbnail_url = res.urls?.[0] || res.data?.url || null;
            }

            let image_3d_url = null;
            if (img3dFile) {
                const res = await uploadFiles("room_3d", [img3dFile]);
                image_3d_url = res.urls?.[0] || res.data?.url || null;
            }

            let blueprint_url = null;
            if (blueprintFile) {
                const res = await uploadFiles("room_blueprint", [blueprintFile]);
                blueprint_url = res.urls?.[0] || res.data?.url || null;
            }

            let gallery_urls = [];
            const galleryFiles = galleryImages.filter((g) => g.file).map((g) => g.file);
            if (galleryFiles.length > 0) {
                const res = await uploadFiles("room_gallery", galleryFiles);
                gallery_urls = res.urls || res.data?.urls || [];
            }

            const payload = {
                room_number: form.room_number.trim(),
                building_id: form.building_id,
                room_type_id: form.room_type_id,
                floor: parseInt(form.floor) || 1,
                status: form.status,
                thumbnail_url,
                gallery_images: gallery_urls,
                image_3d_url,
                blueprint_url,
            };

            await apiJson("/api/rooms", { method: "POST", body: payload });
            navigate("/rooms");
        } catch (err) {
            alert(err.message || "Đã xảy ra lỗi khi tạo phòng.");
        } finally {
            setSaving(false);
        }
    };

    const handleSaveBatch = async (batch) => {
        setSaving(true);
        try {
            let thumbnail_url = null;
            if (batch.thumbFile) {
                const res = await uploadFiles("room_thumbnail", [batch.thumbFile]);
                thumbnail_url = res.urls?.[0] || res.data?.url || null;
            }

            let image_3d_url = null;
            if (batch.img3dFile) {
                const res = await uploadFiles("room_3d", [batch.img3dFile]);
                image_3d_url = res.urls?.[0] || res.data?.url || null;
            }

            let blueprint_url = null;
            if (batch.blueprintFile) {
                const res = await uploadFiles("room_blueprint", [batch.blueprintFile]);
                blueprint_url = res.urls?.[0] || res.data?.url || null;
            }

            let gallery_urls = [];
            const galleryFiles = (batch.galleryImages || []).filter(g => g.file).map(g => g.file);
            if (galleryFiles.length > 0) {
                const res = await uploadFiles("room_gallery", galleryFiles);
                gallery_urls = res.urls || res.data?.urls || [];
            }

            await apiJson("/api/rooms/batch", {
                method: "POST",
                body: {
                    building_id: batch.building_id,
                    room_type_id: batch.room_type_id,
                    floor: parseInt(batch.floor),
                    count: parseInt(batch.count),
                    thumbnail_url,
                    image_3d_url,
                    blueprint_url,
                    gallery_images: gallery_urls,
                },
            });
            navigate("/rooms");
        } catch (err) {
            alert(err.message || "Đã xảy ra lỗi khi tạo phòng hàng loạt.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-24">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" onClick={() => navigate("/rooms")} className="rounded-full">
                    <ArrowLeft className="size-4" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Tạo phòng mới</h1>
                    <p className="text-sm text-muted-foreground">Thêm thông tin hệ thống cho căn phòng mới.</p>
                </div>
            </div>

            {/* Mode toggle */}
            <div className="flex gap-1 p-1 rounded-lg bg-muted w-fit">
                {[
                    { key: "single", label: "Tạo từng phòng" },
                    { key: "batch", label: "Tạo hàng loạt" },
                ].map(m => (
                    <button
                        key={m.key}
                        type="button"
                        onClick={() => setMode(m.key)}
                        className={cn(
                            "px-4 py-1.5 rounded-md text-sm font-medium transition-colors",
                            mode === m.key
                                ? "bg-background text-foreground shadow-sm"
                                : "text-muted-foreground hover:text-foreground",
                        )}
                    >
                        {m.label}
                    </button>
                ))}
            </div>

            {mode === "batch" ? (
                <BatchForm
                    buildings={buildings}
                    roomTypes={roomTypes}
                    saving={saving}
                    onSave={handleSaveBatch}
                    onCancel={() => navigate("/rooms")}
                />
            ) : (
                <>
                    <div className="space-y-6">
                        {/* Basic Information */}
                        <FormSection title="Thông tin cơ bản">
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
                        <Button variant="outline" onClick={() => navigate("/rooms")} disabled={saving} className="bg-background">Hủy</Button>
                        <Button onClick={handleSaveSingle} disabled={saving}>
                            {saving ? <CircleNotch className="size-4 animate-spin mr-1.5" /> : <Plus className="size-4 mr-1.5" />}
                            Tạo phòng
                        </Button>
                    </div>
                </>
            )}
        </div>
    );
}
