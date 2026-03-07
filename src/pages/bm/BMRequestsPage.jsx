import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  MessageSquareMore,
  Search,
  Loader2,
  Eye,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { api } from "@/lib/apiClient";
import { formatDate } from "@/lib/utils";
import { REQUEST_TYPE_LABELS, REQUEST_STATUS_MAP } from "@/lib/constants";
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
import StatusDonut from "@/components/StatusDonut";
import StatusBar from "@/components/StatusBar";

const PER_PAGE = 10;
const FETCH_LIMIT = 999;

const STATUS_MAP = REQUEST_STATUS_MAP;

const STATUS_CHART = [
  { key: "PENDING", stroke: "stroke-chart-4", dot: "bg-chart-4" },
  { key: "ASSIGNED", stroke: "stroke-chart-2", dot: "bg-chart-2" },
  { key: "IN_PROGRESS", stroke: "stroke-primary", dot: "bg-primary" },
  { key: "DONE", stroke: "stroke-success", dot: "bg-success" },
  { key: "COMPLETED", stroke: "stroke-muted-foreground/60", dot: "bg-muted-foreground/60" },
  { key: "CANCELLED", stroke: "stroke-destructive/60", dot: "bg-destructive/60" },
];

const ACTIVE_STATUSES = ["PENDING", "ASSIGNED", "PRICE_PROPOSED", "APPROVED", "IN_PROGRESS"];

const STATUS_FILTERS = [
  { key: "all", label: "Tất cả" },
  { key: "active", label: "Đang xử lý", match: ACTIVE_STATUSES },
  { key: "done", label: "Hoàn thành", match: ["DONE", "COMPLETED"] },
  { key: "other", label: "Khác", match: ["REVIEWED", "REFUNDED", "CANCELLED"] },
];

const FILTER_MATCH = Object.fromEntries(
  STATUS_FILTERS.filter((f) => f.match).map((f) => [f.key, f.match])
);


function RequestSummary({ statusCounts }) {
  const activeCount = ACTIVE_STATUSES.reduce((s, k) => s + (statusCounts[k] || 0), 0);
  const totalCount = Object.values(statusCounts).reduce((s, v) => s + v, 0);
  const donutEntries = STATUS_CHART.map((s) => ({ ...s, count: statusCounts[s.key] || 0 }));

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center gap-8 flex-wrap">
        <div className="flex items-center gap-5">
          <StatusDonut entries={donutEntries} size={76} />
          <div className="grid grid-cols-3 gap-x-6 gap-y-1.5">
            {STATUS_CHART.map((s) => (
              <div key={s.key} className="flex items-center gap-2">
                <span className={`size-2 rounded-full ${s.dot} shrink-0`} />
                <span className="text-xs text-muted-foreground whitespace-nowrap">{STATUS_MAP[s.key]?.label}</span>
                <span className="text-xs font-semibold">{statusCounts[s.key] || 0}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="w-px h-12 bg-border shrink-0" />

        <StatusBar active={activeCount} inactive={totalCount - activeCount} filter="all" label="yêu cầu" />
      </div>
    </div>
  );
}

export default function BMRequestsPage() {
  const navigate = useNavigate();
  const [allRequests, setAllRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [page, setPage] = useState(0);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/api/requests?limit=${FETCH_LIMIT}`);
      setAllRequests(res.data || []);
    } catch {
      setError("Không thể tải dữ liệu.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const statusCounts = useMemo(() => {
    const c = {};
    STATUS_CHART.forEach((s) => { c[s.key] = 0; });
    allRequests.forEach((r) => {
      if (c[r.status] !== undefined) c[r.status]++;
    });
    return c;
  }, [allRequests]);

  const filtered = useMemo(() => {
    const matchList = FILTER_MATCH[filterStatus];
    const q = search.trim().toLowerCase();
    return allRequests.filter((r) => {
      if (matchList && !matchList.includes(r.status)) return false;
      if (q) {
        const residentName = `${r.resident?.last_name || ""} ${r.resident?.first_name || ""}`.toLowerCase();
        if (
          !r.request_number?.toLowerCase().includes(q) &&
          !r.title?.toLowerCase().includes(q) &&
          !residentName.includes(q) &&
          !r.room?.room_number?.toLowerCase().includes(q)
        ) return false;
      }
      return true;
    });
  }, [allRequests, filterStatus, search]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const visible = filtered.slice(page * PER_PAGE, (page + 1) * PER_PAGE);

  useEffect(() => { setPage(0); }, [filterStatus, search]);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="pt-2">
        <h1 className="text-2xl font-bold tracking-tight">Danh sách yêu cầu</h1>
        <p className="text-sm text-muted-foreground">Quản lý yêu cầu bảo trì và dịch vụ</p>
      </div>

      {!loading && !error && <RequestSummary statusCounts={statusCounts} />}

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Tìm theo mã, tiêu đề, cư dân, phòng..."
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

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <div className="py-14 text-center">
          <p className="text-sm text-destructive">{error}</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={fetchAll}>Thử lại</Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex min-h-[30vh] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border">
          <MessageSquareMore className="size-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Không tìm thấy yêu cầu nào</p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="size-7 rounded-lg bg-primary/8 flex items-center justify-center">
                <MessageSquareMore className="size-3.5 text-primary" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">{filtered.length} kết quả</span>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium">{page + 1}/{totalPages}</span>
                <div className="flex items-center gap-1">
                  <Button size="icon" variant="outline" className="size-8" disabled={page === 0}
                    onClick={() => setPage((p) => Math.max(0, p - 1))}>
                    <ChevronLeft className="size-4" />
                  </Button>
                  <Button size="icon" variant="outline" className="size-8" disabled={page >= totalPages - 1}
                    onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}>
                    <ChevronRight className="size-4" />
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
                  <TableHead>Mã yêu cầu</TableHead>
                  <TableHead>Tiêu đề</TableHead>
                  <TableHead>Loại</TableHead>
                  <TableHead>Phòng</TableHead>
                  <TableHead>Cư dân</TableHead>
                  <TableHead>Ngày tạo</TableHead>
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
                    <TableCell className="font-medium">{r.request_number}</TableCell>
                    <TableCell className="max-w-[180px] truncate">{r.title}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {REQUEST_TYPE_LABELS[r.request_type] || r.request_type}
                    </TableCell>
                    <TableCell>{r.room?.room_number}</TableCell>
                    <TableCell>{r.resident?.last_name} {r.resident?.first_name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDate(r.created_at)}</TableCell>
                    <TableCell><StatusDot status={r.status} statusMap={STATUS_MAP} /></TableCell>
                    <TableCell className="pr-4 text-right">
                      <Button variant="ghost" size="icon" className="size-8"
                        onClick={() => navigate(`/building-manager/requests/${r.id}`)}>
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
