import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { api, apiJson } from "@/lib/apiClient";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Lock, FloppyDisk, Eye, EyeSlash, ArrowLeft } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { ROLE_LABELS } from "@/lib/constants";
import { useNavigate } from "react-router-dom";

export default function ProfilePage() {
  const { user, login, token } = useAuth();
  const navigate = useNavigate();

  // Profile form
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    phone: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState(null);

  // Password form
  const [pwForm, setPwForm] = useState({
    old_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState(null);
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Fetch profile on mount
  useEffect(() => {
    async function fetchProfile() {
      try {
        const data = await api.get("/api/user-profile/me");
        setForm({
          first_name: data.data?.first_name || "",
          last_name: data.data?.last_name || "",
          phone: data.data?.phone || "",
        });
      } catch {
        setProfileMsg({ type: "error", text: "Không thể tải thông tin hồ sơ" });
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  // Save profile
  async function handleSaveProfile(e) {
    e.preventDefault();
    setProfileMsg(null);
    setSaving(true);
    try {
      const data = await apiJson("/api/user-profile/me", {
        method: "PUT",
        body: {
          first_name: form.first_name.trim(),
          last_name: form.last_name.trim(),
          phone: form.phone.trim() || undefined,
        },
      });

      // Sync updated name to AuthContext + localStorage
      const u = data.data ?? {};
      const fullName = [u.first_name, u.last_name].filter(Boolean).join(" ").trim();
      login(token, {
        ...user,
        name: fullName || user.email,
      });

      setProfileMsg({ type: "success", text: "Cập nhật hồ sơ thành công" });
    } catch (err) {
      setProfileMsg({ type: "error", text: err?.message || "Cập nhật thất bại" });
    } finally {
      setSaving(false);
    }
  }

  // Change password
  async function handleChangePassword(e) {
    e.preventDefault();
    setPwMsg(null);

    if (pwForm.new_password.length < 8) {
      setPwMsg({ type: "error", text: "Mật khẩu mới phải có ít nhất 8 ký tự" });
      return;
    }
    if (pwForm.new_password !== pwForm.confirm_password) {
      setPwMsg({ type: "error", text: "Mật khẩu xác nhận không khớp" });
      return;
    }

    setPwSaving(true);
    try {
      await apiJson("/api/auth/internal/change-password", {
        method: "POST",
        body: {
          old_password: pwForm.old_password,
          new_password: pwForm.new_password,
        },
      });
      setPwMsg({ type: "success", text: "Đổi mật khẩu thành công" });
      setPwForm({ old_password: "", new_password: "", confirm_password: "" });
    } catch (err) {
      setPwMsg({ type: "error", text: err?.message || "Đổi mật khẩu thất bại" });
    } finally {
      setPwSaving(false);
    }
  }

  function handleFormChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handlePwChange(field, value) {
    setPwForm((prev) => ({ ...prev, [field]: value }));
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate(-1)} className="rounded-full">
          <ArrowLeft className="size-4" />
        </Button>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Hồ sơ cá nhân</h1>
          <p className="text-sm text-muted-foreground">
            {user?.email} &middot; {ROLE_LABELS[user?.role] ?? user?.role}
          </p>
        </div>
      </div>

      {/* ── Profile Info Section ── */}
      <form onSubmit={handleSaveProfile} className="rounded-xl border border-border bg-background">
        <div className="flex items-center gap-2.5 border-b border-border px-6 py-4">
          <User className="size-5 text-primary" weight="duotone" />
          <h2 className="text-sm font-semibold">Thông tin cơ bản</h2>
        </div>

        <div className="space-y-4 px-6 py-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="first_name">Họ</Label>
              <Input
                id="first_name"
                placeholder="Nguyễn"
                value={form.first_name}
                onChange={(e) => handleFormChange("first_name", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="last_name">Tên</Label>
              <Input
                id="last_name"
                placeholder="Văn A"
                value={form.last_name}
                onChange={(e) => handleFormChange("last_name", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="phone">Số điện thoại</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="0901234567"
              value={form.phone}
              onChange={(e) => handleFormChange("phone", e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input value={user?.email || ""} disabled className="bg-muted/50" />
          </div>

          {/* Profile message */}
          {profileMsg && (
            <div
              className={`rounded-lg px-3 py-2 text-sm ${
                profileMsg.type === "success"
                  ? "border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                  : "border border-destructive/30 bg-destructive/10 text-destructive"
              }`}
            >
              {profileMsg.text}
            </div>
          )}
        </div>

        <div className="flex justify-end border-t border-border px-6 py-3">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            <FloppyDisk className="size-4" />
            {saving ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
        </div>
      </form>

      {/* ── Change Password Section ── */}
      <form onSubmit={handleChangePassword} className="rounded-xl border border-border bg-background">
        <div className="flex items-center gap-2.5 border-b border-border px-6 py-4">
          <Lock className="size-5 text-primary" weight="duotone" />
          <h2 className="text-sm font-semibold">Đổi mật khẩu</h2>
        </div>

        <div className="space-y-4 px-6 py-5">
          {/* Old password */}
          <div className="space-y-1.5">
            <Label htmlFor="old_password">Mật khẩu hiện tại</Label>
            <div className="relative">
              <Input
                id="old_password"
                type={showOld ? "text" : "password"}
                placeholder="••••••••"
                value={pwForm.old_password}
                onChange={(e) => handlePwChange("old_password", e.target.value)}
                required
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowOld((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showOld ? <EyeSlash className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          {/* New password */}
          <div className="space-y-1.5">
            <Label htmlFor="new_password">Mật khẩu mới</Label>
            <div className="relative">
              <Input
                id="new_password"
                type={showNew ? "text" : "password"}
                placeholder="Tối thiểu 8 ký tự, có ký tự đặc biệt"
                value={pwForm.new_password}
                onChange={(e) => handlePwChange("new_password", e.target.value)}
                required
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowNew((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showNew ? <EyeSlash className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          {/* Confirm password */}
          <div className="space-y-1.5">
            <Label htmlFor="confirm_password">Xác nhận mật khẩu mới</Label>
            <div className="relative">
              <Input
                id="confirm_password"
                type={showConfirm ? "text" : "password"}
                placeholder="Nhập lại mật khẩu mới"
                value={pwForm.confirm_password}
                onChange={(e) => handlePwChange("confirm_password", e.target.value)}
                required
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showConfirm ? <EyeSlash className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          {/* Password message */}
          {pwMsg && (
            <div
              className={`rounded-lg px-3 py-2 text-sm ${
                pwMsg.type === "success"
                  ? "border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                  : "border border-destructive/30 bg-destructive/10 text-destructive"
              }`}
            >
              {pwMsg.text}
            </div>
          )}
        </div>

        <div className="flex justify-end border-t border-border px-6 py-3">
          <button
            type="submit"
            disabled={pwSaving}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            <Lock className="size-4" />
            {pwSaving ? "Đang xử lý..." : "Đổi mật khẩu"}
          </button>
        </div>
      </form>
    </div>
  );
}
