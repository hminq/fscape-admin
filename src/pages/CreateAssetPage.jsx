import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
    ArrowLeft, Plus, CircleNotch, Package, Stack as Layers, Bank as Banknote,
    Upload, X, Image as ImageIcon, MagnifyingGlass
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
    Select, SelectContent, SelectItem,
    SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
    Dialog, DialogContent, DialogHeader,
    DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { api, apiRequest } from "@/lib/apiClient";

/* ── Helpers ───────────────────────────────── */

async function compressImage(file, { maxWidth = 1200, maxHeight = 1200, quality = 0.8 } = {}) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement("canvas");
                let width = img.width;
                let height = img.height;
                if (width > height) {
                    if (width > maxWidth) { height *= maxWidth / width; width = maxWidth; }
                } else {
                    if (height > maxHeight) { width *= maxHeight / height; height = maxHeight; }
                }
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0, width, height);
                canvas.toBlob((blob) => {
                    if (!blob) return reject(new Error("Không thể xử lý ảnh (Canvas toBlob failed)"));
                    const compressedFile = new File([blob], file.name, { type: "image/jpeg", lastModified: Date.now() });
                    resolve(compressedFile);
                }, "image/jpeg", quality);
            };
            img.onerror = () => reject(new Error("Không thể tải ảnh (Image load failed)"));
        };
        reader.onerror = () => reject(new Error("FileReader failed"));
    });
}

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

/* ── Quick Create Asset Type Dialog ────────── */

function QuickCreateTypeDialog({ open, onOpenChange, onCreated }) {
    const [name, setName] = useState("");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const handleCreate = async () => {
        if (!name.trim()) return setError("Vui lòng nhập tên loại");
        setSaving(true);
        setError("");
        try {
            const res = await api.post("/api/asset-types", { name: name.trim() });
            onCreated(res.data);
            setName("");
            onOpenChange(false);
        } catch (err) {
            setError(err.message || "Không thể tạo loại tài sản");
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-sm">
                <DialogHeader>
                    <DialogTitle>Thêm loại tài sản mới</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                    <div className="space-y-1.5">
                        <Label>Tên loại tài sản *</Label>
                        <Input
                            placeholder="VD: Điện tử, Nội thất..."
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            autoFocus
                        />
                        {error && <p className="text-[11px] text-destructive">{error}</p>}
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
                    <Button onClick={handleCreate} disabled={saving}>
                        {saving && <CircleNotch className="size-4 animate-spin mr-1.5" />}
                        Tạo ngay
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

/* ── Asset Type Picker ─────────────────────── */

function AssetTypePicker({ value, onChange, assetTypes, onTypeCreated, error }) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [createOpen, setCreateOpen] = useState(false);

    const selectedType = assetTypes.find(t => t.id === value);

    const filtered = assetTypes.filter(t => 
        t.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-1.5">
            <Label className="flex items-center justify-between">
                Loại tài sản *
                <button 
                  type="button"
                  onClick={() => setCreateOpen(true)}
                  className="text-[11px] text-primary hover:underline flex items-center gap-1"
                >
                    <Plus className="size-3" /> Thêm loại mới
                </button>
            </Label>
            
            <button
                type="button"
                onClick={() => setOpen(true)}
                className={`w-full flex items-center justify-between px-3 h-10 rounded-md border bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                    error ? "border-destructive text-destructive" : "border-input"
                }`}
            >
                {selectedType ? (
                    <div className="flex items-center gap-2">
                        <Layers className="size-3.5 text-muted-foreground" />
                        <span>{selectedType.name}</span>
                    </div>
                ) : (
                    <span className="text-muted-foreground">Chọn loại tài sản *</span>
                )}
            </button>
            {error && <p className="text-[11px] text-destructive">{error}</p>}

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-md p-0 overflow-hidden">
                    <div className="p-4 border-b border-border bg-muted/20">
                        <div className="relative">
                            <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                            <Input 
                                placeholder="Tìm kiếm loại tài sản..." 
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-9 bg-background"
                                autoFocus
                            />
                        </div>
                    </div>
                    <div className="max-h-[300px] overflow-y-auto p-2 space-y-1">
                        {filtered.length > 0 ? (
                            filtered.map(t => (
                                <button
                                    key={t.id}
                                    type="button"
                                    onClick={() => { onChange(t.id); setOpen(false); }}
                                    className={`w-full text-left px-3 py-2 rounded-md transition-colors flex items-center justify-between ${
                                        value === t.id ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted"
                                    }`}
                                >
                                    <span>{t.name}</span>
                                    {value === t.id && <div className="size-1.5 rounded-full bg-primary" />}
                                </button>
                            ))
                        ) : (
                            <div className="py-8 text-center text-sm text-muted-foreground">
                                Không tìm thấy kết quả.
                            </div>
                        )}
                    </div>
                    <div className="p-3 bg-muted/30 border-t border-border flex justify-end">
                        <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>Đóng</Button>
                    </div>
                </DialogContent>
            </Dialog>

            <QuickCreateTypeDialog 
                open={createOpen} 
                onOpenChange={setCreateOpen} 
                onCreated={(newType) => {
                    onTypeCreated(newType);
                    onChange(newType.id);
                }}
            />
        </div>
    );
}

/* ── ThumbnailUploader ─────────────────────── */

function ThumbnailUploader({ file, preview, onSelect, onRemove, error }) {
    const inputRef = useRef(null);
    return (
        <div className="space-y-1.5">
            <Label>Hình ảnh tài sản *</Label>
            {preview ? (
                <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-border bg-muted group max-w-[300px]">
                    <img src={preview} alt="Asset" className="w-full h-full object-cover" />
                    <button type="button" onClick={onRemove} className="absolute top-2 right-2 size-7 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <X className="size-4" />
                    </button>
                </div>
            ) : (
                <button type="button" onClick={() => inputRef.current?.click()} className={`w-full max-w-[300px] aspect-video rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-colors ${
                    error ? "border-destructive/50 text-destructive bg-destructive/5" : "border-border text-muted-foreground hover:border-primary/50 hover:text-primary"
                }`}>
                    <ImageIcon className="size-8" />
                    <span className="text-xs font-medium">Chọn ảnh *</span>
                </button>
            )}
            {error && <p className="text-[11px] text-destructive">{error}</p>}
            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => {
                const f = e.target.files?.[0];
                if (f && f.type.startsWith("image/")) onSelect(f);
                e.target.value = "";
            }} />
        </div>
    );
}

/* ── Main Page ─────────────────────────────── */

export default function CreateAssetPage() {
    const navigate = useNavigate();
    const [saving, setSaving] = useState(false);
    const [savingStep, setSavingStep] = useState(""); // "" | "compressing" | "uploading" | "saving"
    const [assetTypes, setAssetTypes] = useState([]);
    const [msgDialog, setMsgDialog] = useState(null);

    const [thumbFile, setThumbFile] = useState(null);
    const [thumbPreview, setThumbPreview] = useState(null);

    const [form, setForm] = useState({
        name: "",
        assetTypeId: "",
        quantity: "1",
        price: "",
    });

    const [errors, setErrors] = useState({});
    const [formError, setFormError] = useState(null);

    useEffect(() => {
        const fetchResources = async () => {
            try {
                const res = await api.get("/api/asset-types?limit=100&is_active=true");
                setAssetTypes(res.data || []);
            } catch (err) {
                console.error("Error fetching asset types:", err);
            }
        };
        fetchResources();
    }, []);

    const handleChange = (k, v) => {
        setForm((p) => ({ ...p, [k]: v }));
        if (errors[k]) setErrors((e) => ({ ...e, [k]: undefined }));
        if (formError) setFormError(null);
    };

    const handleSelectThumb = (file) => {
        setThumbFile(file);
        setThumbPreview(URL.createObjectURL(file));
        if (errors.image) setErrors(e => ({ ...e, image: undefined }));
        if (formError) setFormError(null);
    };

    const handleRemoveThumb = () => {
        setThumbFile(null);
        setThumbPreview(null);
        if (formError) setFormError(null);
    };

    const validate = () => {
        const e = {};
        if (!form.name.trim()) e.name = "Vui lòng nhập tên tài sản";
        if (!form.assetTypeId) e.assetTypeId = "Vui lòng chọn loại tài sản";
        if (!thumbFile) e.image = "Vui lòng tải lên hình ảnh tài sản";
        if (!form.price || Number(form.price) <= 0) e.price = "Vui lòng nhập giá mua (> 0)";
        const qty = Number(form.quantity);
        if (!qty || qty < 1 || qty > 100) e.quantity = "Số lượng phải từ 1 đến 100";
        return e;
    };

    const handleSave = async () => {
        const errs = validate();
        setErrors(errs);
        if (Object.keys(errs).length > 0) return;
        setFormError(null);

        setSaving(true);
        try {
            let image_url = null;
            if (thumbFile) {
                setSavingStep("compressing");
                const compressed = await compressImage(thumbFile);
                setSavingStep("uploading");
                const uploadRes = await uploadFiles("assets", [compressed]);
                image_url = uploadRes.urls?.[0];
            }

            setSavingStep("saving");
            const payload = {
                name: form.name.trim(),
                asset_type_id: form.assetTypeId || null,
                quantity: Number(form.quantity),
                price: form.price ? Number(form.price) : null,
                image_url
            };

            const res = await api.post("/api/assets/batch", payload);

            setMsgDialog({
                title: "Thành công",
                message: `Đã tạo ${res.count} tài sản thành công. 
 Mã QR được sinh ra chứa đầy đủ thông tin (Tên, Giá, Loại) giúp bạn dễ dàng quản lý bằng ứng dụng di động.`,
                onClose: () => navigate("/assets"),
            });
        } catch (err) {
            setFormError(err.message || "Đã xảy ra lỗi khi tạo tài sản.");
        } finally {
            setSaving(false);
            setSavingStep("");
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6 pb-16">
            {/* Header */}
            <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={() => navigate("/assets")} className="rounded-full shadow-sm hover:translate-x-[-2px] transition-transform">
                        <ArrowLeft className="size-4" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Thêm tài sản mới</h1>
                        <p className="text-sm text-muted-foreground">Khởi tạo tài sản và sinh mã QR tích hợp thông tin</p>
                    </div>
                </div>
            </div>

            {/* Form */}
            <Card className="shadow-sm border-border/60 overflow-hidden">
                <CardHeader className="bg-muted/30 pb-3 border-b border-border/40">
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                        <Package className="size-4 text-primary" /> Thông tin cơ bản
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-5">
                    {formError && (
                        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium">
                            {formError}
                        </div>
                    )}
                    {/* Name */}
                    <div className="space-y-1.5">
                        <Label>Tên tài sản *</Label>
                        <Input
                            placeholder="VD: Giường tầng, Điều hòa Panasonic..."
                            value={form.name}
                            onChange={(e) => handleChange("name", e.target.value)}
                            className={errors.name ? "border-destructive" : ""}
                        />
                        {errors.name && <p className="text-[11px] text-destructive">{errors.name}</p>}
                    </div>

                    {/* Asset Type */}
                    <AssetTypePicker 
                        value={form.assetTypeId}
                        onChange={(v) => handleChange("assetTypeId", v)}
                        assetTypes={assetTypes}
                        onTypeCreated={(newType) => setAssetTypes(prev => [newType, ...prev])}
                        error={errors.assetTypeId}
                    />

                    {/* Image */}
                    <ThumbnailUploader
                        file={thumbFile}
                        preview={thumbPreview}
                        onSelect={handleSelectThumb}
                        onRemove={handleRemoveThumb}
                        error={errors.image}
                    />

                    {/* Quantity + Price */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label>Số lượng *</Label>
                            <Input
                                type="number" min="1" max="100"
                                value={form.quantity}
                                onChange={(e) => handleChange("quantity", e.target.value)}
                                className={errors.quantity ? "border-destructive" : ""}
                            />
                            {errors.quantity && <p className="text-[11px] text-destructive">{errors.quantity}</p>}
                        </div>
                        <div className="space-y-1.5">
                            <Label>Giá mua (₫) *</Label>
                            <div className="relative">
                                <Banknote className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                                <Input
                                    type="number" min="0" step="1000"
                                    placeholder="0"
                                    value={form.price}
                                    onChange={(e) => handleChange("price", e.target.value)}
                                    className={`pl-9 ${errors.price ? "border-destructive" : ""}`}
                                />
                            </div>
                            {errors.price && <p className="text-[11px] text-destructive">{errors.price}</p>}
                        </div>
                    </div>

                    {/* Info box */}
                    <div className="rounded-lg bg-primary/5 border border-primary/20 p-4">
                        <p className="text-xs text-primary font-medium mb-1.5 flex items-center gap-1.5">
                             Lưu ý về mã QR
                        </p>
                        <ul className="text-[11px] text-muted-foreground space-y-1.5 list-disc pl-4">
                            <li>Hệ thống sẽ tự động gán mã QR chứa thông tin mã hóa (Tên, Giá, Loại) cho từng tài sản.</li>
                            <li>Mã này giúp việc kiểm kê bằng điện thoại trở nên nhanh chóng và chính xác.</li>
                            <li>Trạng thái ban đầu: <span className="text-success font-medium">AVAILABLE</span> (Sẵn sàng sử dụng)</li>
                        </ul>
                    </div>
                </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3">
                <Button variant="ghost" onClick={() => navigate("/assets")} disabled={saving}>Hủy</Button>
                <Button onClick={handleSave} disabled={saving} className="gap-2 min-w-[140px] shadow-md shadow-primary/20">
                    {saving ? (
                        <>
                            <CircleNotch className="size-4 animate-spin" />
                            {savingStep === "compressing" ? "Đang xử lý ảnh..." : 
                             savingStep === "uploading" ? "Đang tải ảnh..." : 
                             "Đang lưu..."}
                        </>
                    ) : (
                        <>
                            <Plus className="size-4" />
                            Tạo {form.quantity > 1 ? `${form.quantity} tài sản` : "tài sản"}
                        </>
                    )}
                </Button>
            </div>

            {/* Message dialog */}
            <Dialog open={!!msgDialog} onOpenChange={(v) => { if (!v) { msgDialog?.onClose?.(); setMsgDialog(null); } }}>
                <DialogContent className="max-w-sm text-center">
                    <DialogHeader><DialogTitle>{msgDialog?.title || "Thông báo"}</DialogTitle></DialogHeader>
                    <p className="whitespace-pre-line text-sm text-muted-foreground leading-relaxed">{msgDialog?.message}</p>
                    <DialogFooter className="justify-center pt-2">
                        <Button onClick={() => { msgDialog?.onClose?.(); setMsgDialog(null); }}>Đóng</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
