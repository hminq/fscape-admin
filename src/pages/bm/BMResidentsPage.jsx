import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Users, MagnifyingGlass, Eye, Envelope, Phone,
} from "@phosphor-icons/react";
import { api } from "@/lib/apiClient";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import Pagination from "@/components/Pagination";
import SectionHeader from "@/components/SectionHeader";
import { LoadingState, EmptyState } from "@/components/StateDisplay";
import StatusBar from "@/components/StatusBar";
import defaultUserImg from "@/assets/default_user_img.jpg";

/* ── constants ──────────────────────────────────────────── */

const PER_PAGE = 10;

const fullName = (u) =>
  [u.first_name, u.last_name].filter(Boolean).join(" ") || "—";

/* ── Detail Dialog ──────────────────────────────────────── */

function ResidentDetailDialog({ open, onOpenChange, resident }) {
  if (!resident) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Thông tin cư dân</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-3 pb-2">
          <img
            src={resident.avatar_url || defaultUserImg}
            alt={fullName(resident)}
            className="size-20 rounded-full object-cover ring-2 ring-border"
          />
          <div className="text-center">
            <p className="text-lg font-semibold">{fullName(resident)}</p>
            <div className="flex items-center justify-center gap-1.5 mt-1">
              <span className={`size-2 rounded-full ${resident.is_active ? "bg-success" : "bg-muted-foreground/30"}`} />
              <span className={`text-xs font-medium ${resident.is_active ? "text-success" : "text-muted-foreground"}`}>
                {resident.is_active ? "Hoạt động" : "Vô hiệu hóa"}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-3 rounded-xl border border-border bg-muted/30 p-4 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground flex items-center gap-2">
              <Envelope className="size-3.5" /> Email
            </span>
            <span className="font-medium">{resident.email}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground flex items-center gap-2">
              <Phone className="size-3.5" /> Điện thoại
            </span>
            <span className="font-medium">{resident.phone || "—"}</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ── Main Page ──────────────────────────────────────────── */

export default function BMResidentsPage() {
  const [allResidents, setAllResidents] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState("");
  const [filterActive, setFilterActive] = useState("all");
  const [page, setPage] = useState(0);

  const [detailResident, setDetailResident] = useState(null);

  /* ── fetch ────────────────────────────────────────────── */

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [usersRes, statsRes] = await Promise.all([
        api.get("/api/users?role=RESIDENT&limit=999"),
        api.get("/api/users/stats"),
      ]);
      const body = usersRes.data || usersRes;
      setAllResidents(body.data || body || []);
      setStats(statsRes.data || statsRes);
    } catch {
      setError("Không thể tải dữ liệu.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  /* ── derived data ─────────────────────────────────────── */

  const residentStats = useMemo(() => {
    let active = 0;
    let inactive = 0;
    allResidents.forEach((r) => {
      if (r.is_active) active++;
      else inactive++;
    });
    return { active, inactive, total: active + inactive };
  }, [allResidents]);

  const filtered = useMemo(() => {
    return allResidents.filter((r) => {
      if (filterActive === "active" && !r.is_active) return false;
      if (filterActive === "inactive" && r.is_active) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const name = fullName(r).toLowerCase();
        if (
          !name.includes(q) &&
          !r.email?.toLowerCase().includes(q) &&
          !r.phone?.includes(q)
        ) return false;
      }
      return true;
    });
  }, [allResidents, filterActive, search]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const visible = filtered.slice(page * PER_PAGE, (page + 1) * PER_PAGE);

  useEffect(() => { setPage(0); }, [filterActive, search]);

  /* ── render ───────────────────────────────────────────── */

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div className="pt-2">
        <h1 className="text-2xl font-bold tracking-tight">Cư dân</h1>
        <p className="text-sm text-muted-foreground">Quản lý cư dân trong tòa nhà của bạn</p>
      </div>

      {/* Stats Card */}
      {!loading && !error && (
        <div className="rounded-2xl border border-border bg-card">
          <div className="flex items-center gap-6 p-5 flex-wrap">
            <div className="flex items-center gap-4 min-w-[140px]">
              <div className="size-11 rounded-xl bg-primary/8 flex items-center justify-center shrink-0">
                <Users className="size-5 text-primary" />
              </div>
              <div>
                <p className="text-3xl font-bold leading-none tracking-tight">{residentStats.total}</p>
                <p className="text-sm text-muted-foreground mt-1">Cư dân</p>
              </div>
            </div>
            <div className="w-px h-14 bg-border shrink-0" />
            <StatusBar
              active={residentStats.active}
              inactive={residentStats.inactive}
              filter={filterActive}
              label="cư dân"
            />
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Tìm theo tên, email, số điện thoại..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-1.5">
          {[
            { key: "all", label: "Tất cả" },
            { key: "active", label: "Hoạt động" },
            { key: "inactive", label: "Vô hiệu" },
          ].map((f) => (
            <Button key={f.key} size="sm"
              variant={filterActive === f.key ? "default" : "outline"}
              onClick={() => setFilterActive(f.key)}>
              {f.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <LoadingState />
      ) : error ? (
        <div className="py-14 text-center">
          <p className="text-sm text-destructive">{error}</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={fetchAll}>Thử lại</Button>
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Users} message="Không tìm thấy cư dân nào" />
      ) : (
        <>
          <SectionHeader icon={Users} count={filtered.length} countUnit="cư dân">
            <Pagination page={page + 1} totalPages={totalPages}
              onPrev={() => setPage((p) => Math.max(0, p - 1))}
              onNext={() => setPage((p) => Math.min(totalPages - 1, p + 1))} />
          </SectionHeader>

          <Card className="overflow-hidden py-0 gap-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10 pl-4">#</TableHead>
                  <TableHead>Cư dân</TableHead>
                  <TableHead>Liên hệ</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right pr-4 w-20">Xem</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((r, idx) => (
                  <TableRow key={r.id}>
                    <TableCell className="pl-4 text-muted-foreground text-xs">
                      {page * PER_PAGE + idx + 1}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <img
                          src={r.avatar_url || defaultUserImg}
                          alt={fullName(r)}
                          className="size-8 rounded-full object-cover ring-1 ring-border shrink-0"
                        />
                        <span className="font-medium text-sm">{fullName(r)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Envelope className="size-3" /> {r.email}
                        </span>
                        {r.phone && (
                          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Phone className="size-3" /> {r.phone}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-xs">
                        <span className={`size-2 rounded-full ${r.is_active ? "bg-success" : "bg-muted-foreground/30"}`} />
                        <span className={r.is_active ? "text-success font-medium" : "text-muted-foreground"}>
                          {r.is_active ? "Hoạt động" : "Vô hiệu"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="pr-4 text-right">
                      <Button size="icon" variant="ghost" className="size-8"
                        title="Chi tiết"
                        onClick={() => setDetailResident(r)}>
                        <Eye className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </>
      )}

      {/* Detail dialog */}
      <ResidentDetailDialog
        open={!!detailResident}
        onOpenChange={(v) => !v && setDetailResident(null)}
        resident={detailResident}
      />
    </div>
  );
}
