import { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  FileText,
  Search,
  Loader2,
  CheckCircle,
  Clock,
  PenLine,
  Eye,
} from "lucide-react";
import { api } from "@/lib/apiClient";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
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

/* ── constants ──────────────────────────────────────────── */

const PAGE_SIZE = 10;
const PENDING_FETCH_LIMIT = 50;

const STATUS_MAP = {
  DRAFT: { label: "Nháp", color: "bg-gray-100 text-gray-700" },
  PENDING_CUSTOMER_SIGNATURE: { label: "Chờ KH ký", color: "bg-amber-100 text-amber-700" },
  PENDING_MANAGER_SIGNATURE: { label: "Chờ BM ký", color: "bg-blue-100 text-blue-700" },
  ACTIVE: { label: "Đang hiệu lực", color: "bg-green-100 text-green-700" },
  EXPIRING_SOON: { label: "Sắp hết hạn", color: "bg-orange-100 text-orange-700" },
  FINISHED: { label: "Đã kết thúc", color: "bg-gray-100 text-gray-600" },
  TERMINATED: { label: "Đã chấm dứt", color: "bg-red-100 text-red-700" },
};

/* ── helpers ─────────────────────────────────────────────── */

const StatusBadge = ({ status }) => {
  const s = STATUS_MAP[status] || { label: status, color: "bg-gray-100 text-gray-700" };
  return <Badge variant="secondary" className={`${s.color} text-xs font-medium`}>{s.label}</Badge>;
};

const formatDate = (d) => (d ? new Date(d).toLocaleDateString("vi-VN") : "—");

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

  const [activeTab, setActiveTab] = useState("pending");

  // All contracts
  const [contracts, setContracts] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Pending contracts
  const [pendingContracts, setPendingContracts] = useState([]);
  const [pendingLoading, setPendingLoading] = useState(true);

  /* ── fetch all contracts ─────────────────────────────── */

  const fetchContracts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: PAGE_SIZE });
      if (search) params.set("search", search);
      const res = await api.get(`/api/contracts?${params}`);
      setContracts(res.data || []);
      setTotal(res.total || 0);
    } catch {
      setContracts([]);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { fetchContracts(); }, [fetchContracts]);

  /* ── fetch pending contracts ─────────────────────────── */

  const fetchPending = useCallback(async () => {
    setPendingLoading(true);
    try {
      const res = await api.get(`/api/contracts?status=PENDING_MANAGER_SIGNATURE&limit=${PENDING_FETCH_LIMIT}`);
      setPendingContracts(res.data || []);
    } catch {
      setPendingContracts([]);
    } finally {
      setPendingLoading(false);
    }
  }, []);

  useEffect(() => { fetchPending(); }, [fetchPending]);

  /* ── search handler ─────────────────────────────────── */

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchContracts();
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  // If deep-link is redirecting, show nothing
  if (signContractId) return null;

  /* ── render ─────────────────────────────────────────── */

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="pt-2">
        <h1 className="text-2xl font-bold tracking-tight">Hợp đồng</h1>
        <p className="text-sm text-muted-foreground">Quản lý hợp đồng thuê phòng</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pending" className="gap-1.5">
            <PenLine className="size-4" />
            Chờ ký
            {pendingContracts.length > 0 && (
              <span className="ml-1 rounded-full bg-blue-600 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
                {pendingContracts.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="all" className="gap-1.5">
            <FileText className="size-4" />
            Tất cả
          </TabsTrigger>
        </TabsList>

        {/* ── TAB: Chờ ký ─────────────────────────────── */}
        <TabsContent value="pending">
          {pendingLoading ? (
            <div className="flex min-h-[30vh] items-center justify-center">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : pendingContracts.length === 0 ? (
            <div className="flex min-h-[30vh] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border">
              <CheckCircle className="size-10 text-green-500" />
              <p className="text-sm text-muted-foreground">Không có hợp đồng nào chờ ký</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingContracts.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between rounded-xl border border-blue-200 bg-blue-50/50 p-4 transition-colors hover:bg-blue-50"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{c.contract_number}</span>
                      <StatusBadge status={c.status} />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Khách hàng: {c.customer?.last_name} {c.customer?.first_name} — Phòng {c.room?.room_number}
                      {c.room?.building?.name && `, ${c.room.building.name}`}
                    </p>
                    {c.signature_expires_at && (
                      <p className="flex items-center gap-1 text-xs text-amber-600">
                        <Clock className="size-3" />
                        Hạn ký: {formatDate(c.signature_expires_at)}
                      </p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    onClick={() => navigate(`/building-manager/contracts/${c.id}/sign`)}
                  >
                    <PenLine className="mr-1.5 size-4" />
                    Xem & Ký
                  </Button>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── TAB: Tất cả ─────────────────────────────── */}
        <TabsContent value="all">
          <form onSubmit={handleSearch} className="mb-4 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Tìm theo mã hợp đồng..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </form>

          {loading ? (
            <div className="flex min-h-[30vh] items-center justify-center">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : contracts.length === 0 ? (
            <div className="flex min-h-[30vh] items-center justify-center rounded-2xl border border-dashed border-border">
              <p className="text-sm text-muted-foreground">Không tìm thấy hợp đồng nào</p>
            </div>
          ) : (
            <>
              <div className="rounded-xl border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mã HĐ</TableHead>
                      <TableHead>Khách hàng</TableHead>
                      <TableHead>Phòng</TableHead>
                      <TableHead>Thời hạn</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead className="w-20" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contracts.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">{c.contract_number}</TableCell>
                        <TableCell>{c.customer?.last_name} {c.customer?.first_name}</TableCell>
                        <TableCell>
                          {c.room?.room_number}
                          {c.room?.building?.name && (
                            <span className="text-muted-foreground"> — {c.room.building.name}</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">
                          {formatDate(c.start_date)} → {formatDate(c.end_date)}
                        </TableCell>
                        <TableCell><StatusBadge status={c.status} /></TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate(`/building-manager/contracts/${c.id}/sign`)}
                          >
                            <Eye className="size-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Trang {page}/{totalPages} — {total} hợp đồng
                  </p>
                  <div className="flex gap-1">
                    <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                      Trước
                    </Button>
                    <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                      Sau
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
