import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Users, MagnifyingGlass, Eye, Envelope, Phone,
  Door, FileText, Calendar, CurrencyDollar,
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
import { formatDate, cdnUrl } from "@/lib/utils";
import defaultUserImg from "@/assets/default_user_img.jpg";
import { CONTRACT_STATUS_MAP } from "@/lib/constants";

/* ── constants ──────────────────────────────────────────── */

const PER_PAGE = 10;

const CONTRACT_STATUS_LABELS = Object.fromEntries(
  Object.entries(CONTRACT_STATUS_MAP).map(([k, v]) => [k, v.label])
);

const fullName = (u) =>
  [u.last_name, u.first_name].filter(Boolean).join(" ") || "—";

/* ── Detail Dialog ──────────────────────────────────────── */

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground flex items-center gap-2">
        <Icon className="size-3.5" /> {label}
      </span>
      <span className="font-medium text-right">{value || "—"}</span>
    </div>
  );
}

function ContractCard({ contract }) {
  return (
    <div className="space-y-3 rounded-xl border border-border bg-muted/30 p-4 text-sm">
      <InfoRow icon={Door} label="Phòng" value={contract.room?.room_number ? `Phòng ${contract.room.room_number}` : null} />
      <InfoRow icon={FileText} label="Mã HĐ" value={contract.contract_number} />
      <InfoRow icon={Calendar} label="Thời hạn"
        value={contract.start_date && contract.end_date
          ? `${formatDate(contract.start_date)} — ${formatDate(contract.end_date)}`
          : null}
      />
      <InfoRow icon={CurrencyDollar} label="Tiền thuê"
        value={contract.base_rent != null
          ? Number(contract.base_rent).toLocaleString("vi-VN") + " đ/tháng"
          : null}
      />
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground flex items-center gap-2">
          <FileText className="size-3.5" /> Trạng thái
        </span>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
          contract.status === "ACTIVE" ? "bg-success/10 text-success"
            : contract.status === "EXPIRING_SOON" ? "bg-amber-500/10 text-amber-600"
            : "bg-muted text-muted-foreground"
        }`}>
          {CONTRACT_STATUS_LABELS[contract.status] || contract.status}
        </span>
      </div>
    </div>
  );
}

function ResidentDetailDialog({ open, onOpenChange, resident, contracts }) {
  if (!resident) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Thông tin cư dân</DialogTitle>
        </DialogHeader>

        {/* Profile */}
        <div className="flex flex-col items-center gap-3 pb-2">
          <img
            src={cdnUrl(resident.avatar_url) || defaultUserImg}
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

        {/* Contact */}
        <div className="space-y-3 rounded-xl border border-border bg-muted/30 p-4 text-sm">
          <InfoRow icon={Envelope} label="Email" value={resident.email} />
          <InfoRow icon={Phone} label="Điện thoại" value={resident.phone} />
        </div>

        {/* Contracts & Rooms */}
        {contracts.length > 0 ? (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Hợp đồng hiện tại ({contracts.length})
            </p>
            <div className="max-h-[280px] overflow-y-auto space-y-2 pr-1">
              {contracts.map((c) => (
                <ContractCard key={c.id} contract={c} />
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border bg-muted/20 p-4 text-center">
            <p className="text-xs text-muted-foreground">Không có hợp đồng đang hiệu lực</p>
          </div>
        )}
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
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [detailResident, setDetailResident] = useState(null);
  const [contractMap, setContractMap] = useState({});

  /* ── fetch ────────────────────────────────────────────── */

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        role: "RESIDENT",
        page,
        limit: PER_PAGE
      });
      if (search.trim()) params.set("search", search.trim());
      if (filterActive === "active") params.set("is_active", "true");
      if (filterActive === "inactive") params.set("is_active", "false");

      const [usersRes, statsRes, contractsRes] = await Promise.all([
        api.get(`/api/users?${params}`),
        api.get("/api/users/stats"),
        api.get("/api/contracts?status=ACTIVE,EXPIRING_SOON&limit=999"),
      ]);
      const body = usersRes.data || usersRes;
      setAllResidents(body.data || []);
      setTotalPages(body.totalPages || 1);
      setTotal(body.total || 0);
      setStats(statsRes.data || statsRes);

      const contracts = contractsRes.data || [];
      const cMap = {};
      contracts.forEach((c) => {
        if (c.customer?.id) {
          if (!cMap[c.customer.id]) cMap[c.customer.id] = [];
          cMap[c.customer.id].push(c);
        }
      });
      setContractMap(cMap);
    } catch {
      setError("Không thể tải dữ liệu.");
    } finally {
      setLoading(false);
    }
  }, [page, search, filterActive]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  /* ── derived data ─────────────────────────────────────── */

  const residentStats = useMemo(() => {
    if (!stats) return { total: 0 };
    const residentInfo = (stats.by_role || []).find(r => r.role === "RESIDENT");
    const count = residentInfo ? residentInfo.count : 0;
    return { total: count };
  }, [stats]);

  const visible = allResidents;

  useEffect(() => { setPage(1); }, [filterActive, search]);

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
          <SectionHeader icon={Users} count={total} countUnit="cư dân">
            <Pagination page={page} totalPages={totalPages}
              onPrev={() => setPage((p) => Math.max(1, p - 1))}
              onNext={() => setPage((p) => Math.min(totalPages, p + 1))} />
          </SectionHeader>

          <Card className="overflow-hidden py-0 gap-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10 pl-4">#</TableHead>
                  <TableHead>Cư dân</TableHead>
                  <TableHead>Phòng</TableHead>
                  <TableHead>Liên hệ</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right pr-4 w-20">Xem</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((r, idx) => {
                  const rContracts = contractMap[r.id] || [];
                  const rooms = [...new Set(rContracts.map((c) => c.room?.room_number).filter(Boolean))];
                  return (
                    <TableRow key={r.id}>
                      <TableCell className="pl-4 text-muted-foreground text-xs">
                        {(page - 1) * PER_PAGE + idx + 1}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <img
                            src={cdnUrl(r.avatar_url) || defaultUserImg}
                            alt={fullName(r)}
                            className="size-8 rounded-full object-cover ring-1 ring-border shrink-0"
                          />
                          <span className="font-medium text-sm">{fullName(r)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {rooms.length > 0
                          ? <span className="font-medium">
                              Phòng {rooms[0]}
                              {rooms.length > 1 && (
                                <span className="ml-1 text-xs text-muted-foreground">+{rooms.length - 1}</span>
                              )}
                            </span>
                          : <span className="text-muted-foreground">—</span>}
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
                  );
                })}
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
        contracts={detailResident ? (contractMap[detailResident.id] || []) : []}
      />
    </div>
  );
}
