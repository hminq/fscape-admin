import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, User, Mail, Phone, Shield, Lock, Save, Loader2, Plus, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

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

export default function CreateAccountPage() {
    const navigate = useNavigate();
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        name: "",
        email: "",
        phone: "",
        role: "admin",
        password: "",
        confirmPassword: "",
    });

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleChange = (k, v) => setForm((p) => ({ ...p, [k]: v }));

    const handleSave = async () => {
        // Simple validation
        if (!form.name || !form.email || !form.password) {
            alert("Vui lòng điền đầy đủ các trường bắt buộc (*)");
            return;
        }

        if (form.password !== form.confirmPassword) {
            alert("Mật khẩu xác nhận không khớp");
            return;
        }

        setSaving(true);
        // Mimic API call
        await new Promise((r) => setTimeout(r, 1500));
        setSaving(false);
        navigate("/accounts");
    };

    return (
        <div className="max-w-3xl mx-auto space-y-8 pb-16">
            {/* Top Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => navigate("/accounts")}
                        className="rounded-full shadow-sm hover:translate-x-[-2px] transition-transform"
                    >
                        <ArrowLeft className="size-4" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Tạo tài khoản mới</h1>
                        <p className="text-sm text-muted-foreground">Thêm thành viên quản trị mới cho hệ thống FScape.</p>
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                <FormSection title="Thông tin cá nhân">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label>Họ và tên *</Label>
                            <Input
                                placeholder="VD: Nguyễn Văn A"
                                value={form.name}
                                onChange={(e) => handleChange("name", e.target.value)}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Email *</Label>
                            <Input
                                type="email"
                                placeholder="email@example.com"
                                value={form.email}
                                onChange={(e) => handleChange("email", e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label>Số điện thoại</Label>
                            <Input
                                placeholder="09xx xxx xxx"
                                value={form.phone}
                                onChange={(e) => handleChange("phone", e.target.value)}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Vai trò *</Label>
                            <Select value={form.role} onValueChange={(v) => handleChange("role", v)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Chọn vai trò" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="admin">Quản trị viên (Admin)</SelectItem>
                                    <SelectItem value="manager">Quản lý tòa nhà (Manager)</SelectItem>
                                    <SelectItem value="staff">Nhân viên (Staff)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </FormSection>

                <FormSection title="Bảo mật">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label>Mật khẩu *</Label>
                            <div className="relative">
                                <Input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    value={form.password}
                                    onChange={(e) => handleChange("password", e.target.value)}
                                    className="pr-10"
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-muted-foreground"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                </Button>
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label>Xác nhận mật khẩu *</Label>
                            <div className="relative">
                                <Input
                                    type={showConfirmPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    value={form.confirmPassword}
                                    onChange={(e) => handleChange("confirmPassword", e.target.value)}
                                    className="pr-10"
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-muted-foreground"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                >
                                    {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                </Button>
                            </div>
                        </div>
                    </div>
                    <p className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg border border-border/50 italic">
                        Lưu ý: Mật khẩu nên có ít nhất 8 ký tự, bao gồm chữ số và ký tự đặc biệt để đảm bảo tính an toàn.
                    </p>
                </FormSection>

                <div className="flex items-center justify-end gap-3 pt-4">
                    <Button
                        variant="ghost"
                        onClick={() => navigate("/accounts")}
                        disabled={saving}
                        className="text-muted-foreground font-medium"
                    >
                        Hủy bỏ
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-8 bg-primary hover:bg-primary/90 text-primary-foreground shadow-md"
                    >
                        {saving ? <Loader2 className="size-4 animate-spin mr-2" /> : <Plus className="size-4 mr-2" />}
                        Xác nhận tạo tài khoản
                    </Button>
                </div>
            </div>
        </div>
    );
}
