import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  FileText,
  MagnifyingGlass,
  CircleNotch,
  Eye,
  CaretLeft,
  CaretRight,
} from "@phosphor-icons/react";
import { api } from "@/lib/apiClient";
import { formatDate } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import StatusDot from "@/components/StatusDot";
import StatusBar from "@/components/StatusBar";

/* ── constants ──────────────────────────────────────────── */

const PER_PAGE = 10;
const FETCH_LIMIT = 999;

const STATUS_MAP = {
  ACTIVE: { label: "Đang hiệu lực", dot: "bg-success", text: "text-success" },
  EXPIRING_SOON: { label: "Sắp hết hạn", dot: "bg-chart-4", text: "text-chart-4" },
  FINISHED: { label: "Đã kết thúc", dot: "bg-muted-foreground/30", text: "text-muted-foreground" },
  TERMINATED: { label: "Đã chấm dứt", dot: "bg-destructive", text: "text-destructive" },
};

const STATUS_CHART = [
  { key: "ACTIVE", stroke: "stroke-chart-1", dot: "bg-chart-1" },
  { key: "EXPIRING_SOON", stroke: "stroke-chart-4", dot: "bg-chart-4" },
  { key: "FINISHED", stroke: "stroke-chart-5", dot: "bg-chart-5" },
  { key: "TERMINATED", stroke: "stroke-destructive", dot: "bg-destructive" },
];

const STATUS_FILTERS = [
  { key: "all", label: "Tất cả" },
  { key: "active", label: "Đang hiệu lực", match: ["ACTIVE"] },
  { key: "expiring", label: "Sắp hết hạn", match: ["EXPIRING_SOON"] },
  { key: "ended", label: "Đã kết thúc", match: ["FINISHED", "TERMINATED"] },
];

/** Chỉ hiển thị hợp đồng đã ký xong (không bao gồm trạng thái chờ ký) */
const EXCLUDED_STATUSES = ["DRAFT", "PENDING_CUSTOMER_SIGNATURE", "PENDING_MANAGER_SIGNATURE"];

/* ── Donut Chart ─────────────────────────────────────────── */

function StatusDonut({ counts, size = 80 }) {
  const entries = STATUS_CHART.map((s) => ({ ...s, count: counts[s.key] || 0 })).filter((s) => s.count > 0);
  const total = entries.reduce((sum, s) => sum + s.count, 0);
  const r = 36;
  const circ = 2 * Math.PI * r;

  let acc = 0;
  const segs = entries.map((e) => {
    const len = total > 0 ? (e.count / total) * circ : 0;
    const seg = { ...e, len, offset: circ - acc };
    acc += len;
    return seg;
  });

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" className="size-full -rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" strokeWidth="10" className="stroke-muted" />
        {segs.map((s) => (
          <circle key={s.key} cx="50" cy="50" r={r} fill="none" strokeWidth="10"
            strokeDasharray={`${s.len} ${circ - s.len}`}
            strokeDashoffset={s.offset}
            className={`${s.stroke} transition-all duration-500`} />
        ))}
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-bold leading-none">{total}</span>
      </div>
    </div>
  );
}

/* ── Summary Card ────────────────────────────────────────── */

function ContractSummary({ statusCounts }) {
  const activeCount = statusCounts.ACTIVE || 0;
  const totalCount = Object.values(statusCounts).reduce((s, v) => s + v, 0);

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center gap-8 flex-wrap">
        {/* Donut + legend */}
        <div className="flex items-center gap-5">
          <StatusDonut counts={statusCounts} size={76} />
          <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
            {STATUS_CHART.map((s) => (
              <div key={s.key} className="flex items-center gap-2">
                <span className={`size-2 rounded-full ${s.dot} shrink-0`} />
                <span className="text-xs text-muted-foreground whitespace-nowrap">{STATUS_MAP[s.key].label}</span>
                <span className="text-xs font-semibold">{statusCounts[s.key] || 0}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="w-px h-12 bg-border shrink-0" />

        <StatusBar active={activeCount} inactive={totalCount - activeCount} filter="all" label="hợp đồng" />
      </div>
    </div>
  );
}

/* ── main component ─────────────────────────────────────── */

export default function BMContractsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const signContractId = searchParams.get("sign");

  // Deep link redirect: ?sign=<id> → signing page
  useEffect(() => {
    if (signContractId) {
      navigate(`/building-manager/contracts/${signContractId}/sign`, { replace: true });
    }
  }, [signContractId, navigate]);

  const [allContracts, setAllContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [page, setPage] = useState(0);

  /* ── fetch all contracts ───────────────────────────────── */

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/api/contracts?limit=${FETCH_LIMIT}`);
      const all = (res.data || []).filter((c) => !EXCLUDED_STATUSES.includes(c.status));
      setAllContracts(all);
    } catch {
      setError("Không thể tải dữ liệu.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  /* ── derived data ──────────────────────────────────────── */

  const statusCounts = useMemo(() => {
    const c = {};
    STATUS_CHART.forEach((s) => { c[s.key] = 0; });
    allContracts.forEach((ct) => {
      if (c[ct.status] !== undefined) c[ct.status]++;
    });
    return c;
  }, [allContracts]);

  const filtered = useMemo(() => {
    return allContracts.filter((c) => {
      if (filterStatus !== "all") {
        const f = STATUS_FILTERS.find((sf) => sf.key === filterStatus);
        if (f?.match && !f.match.includes(c.status)) return false;
      }
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const customerName = `${c.customer?.last_name || ""} ${c.customer?.first_name || ""}`.toLowerCase();
        if (
          !c.contract_number?.toLowerCase().includes(q) &&
          !customerName.includes(q) &&
          !c.room?.room_number?.toLowerCase().includes(q)
        ) return false;
      }
      return true;
    });
  }, [allContracts, filterStatus, search]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const visible = filtered.slice(page * PER_PAGE, (page + 1) * PER_PAGE);

  // Reset page when filter/search changes
  useEffect(() => { setPage(0); }, [filterStatus, search]);

  if (signContractId) return null;

  /* ── render ────────────────────────────────────────────── */

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div className="pt-2">
        <h1 className="text-2xl font-bold tracking-tight">Danh sách hợp đồng</h1>
        <p className="text-sm text-muted-foreground">Quản lý hợp đồng thuê phòng</p>
      </div>

      {/* Summary */}
      {!loading && !error && (
        <ContractSummary statusCounts={statusCounts} />
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Tìm theo mã HĐ, khách hàng, phòng..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-1.5">
          {STATUS_FILTERS.map((f) => (
            <Button key={f.key} size="sm"
              variant={filterStatus === f.key ? "default" : "outline"}
              onClick={() => setFilterStatus(f.key)}>
              {f.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <CircleNotch className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <div className="py-14 text-center">
          <p className="text-sm text-destructive">{error}</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={fetchAll}>Thử lại</Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex min-h-[30vh] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border">
          <FileText className="size-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Không tìm thấy hợp đồng nào</p>
        </div>
      ) : (
        <>
          {/* Section header with pagination */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="size-7 rounded-lg bg-primary/8 flex items-center justify-center">
                <FileText className="size-3.5 text-primary" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">{filtered.length} kết quả</span>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium">{page + 1}/{totalPages}</span>
                <div className="flex items-center gap-1">
                  <Button size="icon" variant="outline" className="size-8" disabled={page === 0}
                    onClick={() => setPage((p) => Math.max(0, p - 1))}>
                    <CaretLeft className="size-4" />
                  </Button>
                  <Button size="icon" variant="outline" className="size-8" disabled={page >= totalPages - 1}
                    onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}>
                    <CaretRight className="size-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>

          <Card className="overflow-hidden py-0 gap-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10 pl-4">#</TableHead>
                  <TableHead>Mã HĐ</TableHead>
                  <TableHead>Khách hàng</TableHead>
                  <TableHead>Phòng</TableHead>
                  <TableHead>Thời hạn</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right pr-4 w-20">Xem</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((c, idx) => (
                  <TableRow key={c.id}>
                    <TableCell className="pl-4 text-muted-foreground text-xs">
                      {page * PER_PAGE + idx + 1}
                    </TableCell>
                    <TableCell className="font-medium">{c.contract_number}</TableCell>
                    <TableCell>{c.customer?.last_name} {c.customer?.first_name}</TableCell>
                    <TableCell>
                      {c.room?.room_number}
                      {c.room?.building?.name && (
                        <span className="text-muted-foreground"> — {c.room.building.name}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(c.start_date)} → {formatDate(c.end_date)}
                    </TableCell>
                    <TableCell><StatusDot status={c.status} statusMap={STATUS_MAP} /></TableCell>
                    <TableCell className="pr-4 text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        onClick={() => navigate(`/building-manager/contracts/${c.id}/sign`)}
                      >
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
    </div>
  );
}
