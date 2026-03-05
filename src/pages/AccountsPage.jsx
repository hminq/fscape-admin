import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Plus, Search, Users, Loader2, Mail, Phone,
  ToggleLeft, ToggleRight, Shield, UserCog, UserCheck,
  ChevronLeft, ChevronRight, Eye, EyeOff,
} from "lucide-react";
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
import { apiJson } from "@/lib/apiClient";

/* ── helpers ───────────────────────────────── */

const fmt = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return isNaN(d.getTime()) ? "—" : d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
};

const fullName = (u) => [u.first_name, u.last_name].filter(Boolean).join(" ") || "—";

const ROLE_MAP = {
  ADMIN: { label: "Quản trị viên", color: "text-primary border-primary/20 bg-primary/5", dot: "bg-primary", icon: Shield },
  BUILDING_MANAGER: { label: "Quản lý tòa nhà", color: "text-success border-success/20 bg-success/5", dot: "bg-success", icon: UserCog },
  STAFF: { label: "Nhân viên", color: "text-warning border-warning/20 bg-warning/5", dot: "bg-warning", icon: UserCheck },
};

const ROLE_ORDER = ["ADMIN", "BUILDING_MANAGER", "STAFF"];

const STATUS = {
  true: { label: "Hoạt động" },
  false: { label: "Vô hiệu hóa" },
};

/* ── DonutChart (2-segment: status) ────────── */

function DonutChart({ active, inactive, size = 72 }) {
  const total = active + inactive;
  const pct = total > 0 ? (active / total) * 100 : 0;
  const r = 36;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" className="size-full -rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" strokeWidth="10" className="stroke-muted" />
        <circle cx="50" cy="50" r={r} fill="none" strokeWidth="10"
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          className="stroke-success transition-all duration-500" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[10px] font-bold leading-none">{total > 0 ? Math.round(pct) : 0}%</span>
      </div>
    </div>
  );
}

/* ── RoleDonutChart (multi-segment) ────────── */

const ROLE_STROKE = {
  ADMIN: "stroke-primary",
  BUILDING_MANAGER: "stroke-success",
  STAFF: "stroke-warning",
};

function RoleDonutChart({ counts, size = 72 }) {
  const entries = ROLE_ORDER.map((r) => [r, counts[r] || 0]).filter(([, v]) => v > 0);
  const total = entries.reduce((s, [, v]) => s + v, 0);
  const r = 36;
  const circ = 2 * Math.PI * r;

  let accumulated = 0;
  const segments = entries.map(([role, count]) => {
    const len = total > 0 ? (count / total) * circ : 0;
    const seg = { role, len, offset: circ - accumulated, cls: ROLE_STROKE[role] || "stroke-muted" };
    accumulated += len;
    return seg;
  });

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" className="size-full -rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" strokeWidth="10" className="stroke-muted" />
        {segments.map((seg) => (
          <circle key={seg.role} cx="50" cy="50" r={r} fill="none" strokeWidth="10"
            strokeDasharray={`${seg.len} ${circ - seg.len}`}
            strokeDashoffset={seg.offset}
            className={`${seg.cls} transition-all duration-500`} />
        ))}
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[10px] font-bold leading-none">{total}</span>
      </div>
    </div>
  );
}

/* ── Summary Card ──────────────────────────── */

function AccountSummary({ total, active, inactive, roleCounts }) {
  return (
    <div className="rounded-2xl border border-border bg-card">
      <div className="flex items-center gap-6 p-5 flex-wrap">
        <div className="flex items-center gap-4 flex-1 min-w-[140px]">
          <div className="size-11 rounded-xl bg-primary/8 flex items-center justify-center shrink-0">
            <Users className="size-5 text-primary" />
          </div>
          <div>
            <p className="text-3xl font-bold leading-none tracking-tight">{total}</p>
            <p className="text-sm text-muted-foreground mt-1">Tài khoản</p>
          </div>
        </div>

        <div className="w-px h-14 bg-border shrink-0" />

        <div className="flex items-center gap-4">
          <DonutChart active={active} inactive={inactive} size={64} />
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-success shrink-0" />
              <span className="text-xs text-muted-foreground">Hoạt động</span>
              <span className="text-xs font-semibold ml-auto pl-2">{active}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-muted-foreground/30 shrink-0" />
              <span className="text-xs text-muted-foreground">Vô hiệu hóa</span>
              <span className="text-xs font-semibold ml-auto pl-2">{inactive}</span>
            </div>
          </div>
        </div>

        <div className="w-px h-14 bg-border shrink-0" />

        <div className="flex items-center gap-4">
          <RoleDonutChart counts={roleCounts} size={64} />
          <div className="space-y-2">
            {[
              { key: "ADMIN", label: "Admin", dot: "bg-primary" },
              { key: "BUILDING_MANAGER", label: "Quản lý", dot: "bg-success" },
              { key: "STAFF", label: "Nhân viên", dot: "bg-warning" },
            ].map((r) => (
              <div key={r.key} className="flex items-center gap-2">
                <span className={`size-2 rounded-full ${r.dot} shrink-0`} />
                <span className="text-xs text-muted-foreground">{r.label}</span>
                <span className="text-xs font-semibold ml-auto pl-2">{roleCounts[r.key] || 0}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Create Account Dialog ─────────────────── */

function CreateAccountDialog({ open, onOpenChange, onSaved }) {
  const [form, setForm] = useState({});
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showPwConfirm, setShowPwConfirm] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm({ first_name: "", last_name: "", email: "", phone: "", role: "BUILDING_MANAGER", password: "", confirmPassword: "" });
    setErrors({});
    setShowPw(false);
    setShowPwConfirm(false);
  }, [open]);

  const set = (k, v) => {
    setForm((p) => ({ ...p, [k]: v }));
    if (errors[k]) setErrors((p) => ({ ...p, [k]: undefined }));
  };

  const validate = () => {
    const e = {};
    if (!form.first_name?.trim()) e.first_name = true;
    if (!form.email?.trim()) e.email = true;
    if (!form.password) e.password = true;
    if (form.password && form.password !== form.confirmPassword) e.confirmPassword = true;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      await apiJson("/api/admin/users", {
        method: "POST",
        body: {
          first_name: form.first_name.trim(),
          last_name: form.last_name?.trim() || null,
          email: form.email.trim(),
          phone: form.phone?.trim() || null,
          role: form.role,
          password: form.password,
        },
      });
      onSaved();
    } catch (err) {
      alert(err.message || "Đã xảy ra lỗi.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Tạo tài khoản mới</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Họ *</Label>
              <Input value={form.first_name || ""} onChange={(e) => set("first_name", e.target.value)}
                placeholder="VD: Nguyễn"
                className={errors.first_name ? "border-destructive" : ""} />
            </div>
            <div className="space-y-1.5">
              <Label>Tên</Label>
              <Input value={form.last_name || ""} onChange={(e) => set("last_name", e.target.value)}
                placeholder="VD: Văn A" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Email *</Label>
              <Input type="email" value={form.email || ""} onChange={(e) => set("email", e.target.value)}
                placeholder="email@example.com"
                className={errors.email ? "border-destructive" : ""} />
            </div>
            <div className="space-y-1.5">
              <Label>Số điện thoại</Label>
              <Input value={form.phone || ""} onChange={(e) => set("phone", e.target.value)}
                placeholder="09xx xxx xxx" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Vai trò *</Label>
            <Select value={form.role || "BUILDING_MANAGER"} onValueChange={(v) => set("role", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="BUILDING_MANAGER">Quản lý tòa nhà</SelectItem>
                <SelectItem value="STAFF">Nhân viên</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Mật khẩu *</Label>
              <div className="relative">
                <Input type={showPw ? "text" : "password"} value={form.password || ""}
                  onChange={(e) => set("password", e.target.value)} placeholder="••••••••"
                  className={`pr-10 ${errors.password ? "border-destructive" : ""}`} />
                <Button type="button" variant="ghost" size="icon"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-muted-foreground"
                  onClick={() => setShowPw(!showPw)}>
                  {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </Button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Xác nhận mật khẩu *</Label>
              <div className="relative">
                <Input type={showPwConfirm ? "text" : "password"} value={form.confirmPassword || ""}
                  onChange={(e) => set("confirmPassword", e.target.value)} placeholder="••••••••"
                  className={`pr-10 ${errors.confirmPassword ? "border-destructive" : ""}`} />
                <Button type="button" variant="ghost" size="icon"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-muted-foreground"
                  onClick={() => setShowPwConfirm(!showPwConfirm)}>
                  {showPwConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
            <Button type="submit" disabled={saving}
              className="bg-success text-success-foreground hover:bg-success/90">
              {saving && <Loader2 className="size-4 animate-spin mr-1.5" />}
              Tạo tài khoản
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ── Role Section (grouped table) ──────────── */

const PER_SECTION = 8;

function RoleSection({ role, accounts, onToggle }) {
  const [page, setPage] = useState(0);
  const totalPages = Math.ceil(accounts.length / PER_SECTION);
  const visible = accounts.slice(page * PER_SECTION, (page + 1) * PER_SECTION);
  const roleMeta = ROLE_MAP[role] || {};
  const Icon = roleMeta.icon || Users;

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="size-7 rounded-lg bg-primary/8 flex items-center justify-center">
            <Icon className="size-3.5 text-primary" />
          </div>
          <h2 className="text-[15px] font-semibold">{roleMeta.label || role}</h2>
          <span className="text-xs text-muted-foreground">({accounts.length})</span>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground mr-1">{page + 1}/{totalPages}</span>
            <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}
              className="size-7 rounded-md border border-border flex items-center justify-center hover:bg-muted disabled:opacity-30">
              <ChevronLeft className="size-3.5" />
            </button>
            <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
              className="size-7 rounded-md border border-border flex items-center justify-center hover:bg-muted disabled:opacity-30">
              <ChevronRight className="size-3.5" />
            </button>
          </div>
        )}
      </div>

      <Card className="overflow-hidden py-0 gap-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10 pl-4">#</TableHead>
              <TableHead>Thông tin</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Ngày tạo</TableHead>
              <TableHead className="text-right pr-4 w-24">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.map((acc, idx) => {
              const st = STATUS[acc.is_active] || STATUS["true"];
              return (
                <TableRow key={acc.id}>
                  <TableCell className="pl-4 text-muted-foreground text-xs">
                    {page * PER_SECTION + idx + 1}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium text-sm">{fullName(acc)}</span>
                      <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-0.5">
                        <span className="flex items-center gap-1"><Mail className="size-3" /> {acc.email}</span>
                        {acc.phone && <span className="flex items-center gap-1"><Phone className="size-3" /> {acc.phone}</span>}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-xs">
                      <span className={`size-2 rounded-full ${acc.is_active ? "bg-success" : "bg-muted-foreground/30"}`} />
                      <span className={acc.is_active ? "text-success font-medium" : "text-muted-foreground"}>
                        {st.label}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{fmt(acc.created_at)}</TableCell>
                  <TableCell className="pr-4">
                    <div className="flex items-center justify-end gap-1">
                      <Button size="icon" variant="ghost" className="size-8"
                        title={acc.is_active ? "Tắt hoạt động" : "Bật hoạt động"}
                        onClick={() => onToggle(acc)}>
                        {acc.is_active
                          ? <ToggleRight className="size-5 text-success" />
                          : <ToggleLeft className="size-5 text-muted-foreground" />}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </section>
  );
}

/* ── Main Page ─────────────────────────────── */

export default function AccountsPage() {
  const [allAccounts, setAllAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState("");
  const [filterActive, setFilterActive] = useState("all");

  const [showCreate, setShowCreate] = useState(false);
  const [confirmToggle, setConfirmToggle] = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiJson("/api/admin/users");
      setAllAccounts(res.data || res || []);
    } catch {
      setError("Không thể tải dữ liệu.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  /* derived data */
  const filtered = useMemo(() => allAccounts.filter((a) => {
    if (filterActive === "active" && !a.is_active) return false;
    if (filterActive === "inactive" && a.is_active) return false;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      const name = fullName(a).toLowerCase();
      if (
        !name.includes(q) &&
        !a.email?.toLowerCase().includes(q) &&
        !a.phone?.includes(q)
      ) return false;
    }
    return true;
  }), [allAccounts, filterActive, search]);

  const roleGroups = useMemo(() => {
    const grouped = {};
    for (const acc of filtered) {
      if (!grouped[acc.role]) grouped[acc.role] = [];
      grouped[acc.role].push(acc);
    }
    return ROLE_ORDER.filter((r) => grouped[r]?.length > 0).map((r) => ({ role: r, accounts: grouped[r] }));
  }, [filtered]);

  const totalCount = allAccounts.length;
  const activeCount = allAccounts.filter((a) => a.is_active).length;
  const roleCounts = useMemo(() => {
    const c = { ADMIN: 0, BUILDING_MANAGER: 0, STAFF: 0 };
    allAccounts.forEach((a) => { if (c[a.role] !== undefined) c[a.role]++; });
    return c;
  }, [allAccounts]);

  /* actions */
  const handleToggle = async () => {
    setSaving(true);
    try {
      await apiJson(`/api/admin/users/${confirmToggle.id}/status`, {
        method: "PATCH",
        body: { is_active: !confirmToggle.is_active },
      });
      setConfirmToggle(null);
      fetchAll();
    } catch (err) {
      alert(err.message || "Không thể cập nhật.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3 pt-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tài khoản</h1>
          <p className="text-sm text-muted-foreground">Phân quyền và quản lý nhân sự trong hệ thống</p>
        </div>
        <Button className="gap-1.5" onClick={() => setShowCreate(true)}>
          <Plus className="size-4" /> Tạo tài khoản
        </Button>
      </div>

      {/* Summary */}
      <AccountSummary
        total={totalCount}
        active={activeCount}
        inactive={totalCount - activeCount}
        roleCounts={roleCounts}
      />

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input placeholder="Tìm kiếm tài khoản..." value={search}
            onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="flex gap-1.5">
          {[
            { key: "all", label: "Tất cả" },
            { key: "active", label: "Hoạt động" },
            { key: "inactive", label: "Không hoạt động" },
          ].map((f) => (
            <Button key={f.key} size="sm"
              variant={filterActive === f.key ? "default" : "outline"}
              onClick={() => setFilterActive(f.key)}>
              {f.label}
            </Button>
          ))}
        </div>
      </div>

      {/* List grouped by role */}
      <div>
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="py-14 text-center">
            <p className="text-sm text-destructive">{error}</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={fetchAll}>Thử lại</Button>
          </div>
        ) : roleGroups.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">Không tìm thấy tài khoản nào.</div>
        ) : (
          <div className="space-y-8">
            {roleGroups.map(({ role, accounts }) => (
              <RoleSection
                key={role}
                role={role}
                accounts={accounts}
                onToggle={setConfirmToggle}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create dialog */}
      <CreateAccountDialog
        open={showCreate}
        onOpenChange={setShowCreate}
        onSaved={() => { setShowCreate(false); fetchAll(); }}
      />

      {/* Confirm toggle */}
      <Dialog open={!!confirmToggle} onOpenChange={(v) => !v && setConfirmToggle(null)}>
        <DialogContent className="max-w-sm text-center">
          <DialogHeader>
            <DialogTitle>{confirmToggle?.is_active ? "Tắt tài khoản" : "Bật tài khoản"}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {confirmToggle?.is_active
              ? <>Bạn có chắc muốn <strong className="text-foreground">vô hiệu hóa</strong> tài khoản <strong className="text-foreground">&quot;{confirmToggle && fullName(confirmToggle)}&quot;</strong>?</>
              : <>Bạn có chắc muốn <strong className="text-foreground">kích hoạt</strong> tài khoản <strong className="text-foreground">&quot;{confirmToggle && fullName(confirmToggle)}&quot;</strong>?</>}
          </p>
          <DialogFooter className="justify-center gap-2 sm:justify-center">
            <Button variant="outline" onClick={() => setConfirmToggle(null)}>Hủy</Button>
            <Button
              variant={confirmToggle?.is_active ? "destructive" : "outline"}
              className={!confirmToggle?.is_active ? "border-success bg-success text-success-foreground hover:bg-success/90" : ""}
              disabled={saving} onClick={handleToggle}>
              {saving && <Loader2 className="size-4 animate-spin mr-1.5" />}
              {confirmToggle?.is_active ? "Tắt" : "Bật"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
