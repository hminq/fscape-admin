import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle,
  Clock,
  Eye,
  Loader2,
  PenLine,
} from "lucide-react";
import { api } from "@/lib/apiClient";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import StatusDot from "@/components/StatusDot";

/* ── constants ──────────────────────────────────────────── */

const PENDING_FETCH_LIMIT = 50;

const STATUS_MAP = {
  PENDING_CUSTOMER_SIGNATURE: { label: "Chờ khách hàng ký", dot: "bg-chart-4", text: "text-chart-4" },
  PENDING_MANAGER_SIGNATURE: { label: "Chờ quản lý ký", dot: "bg-chart-2", text: "text-chart-2" },
};

/* ── main component ─────────────────────────────────────── */

export default function BMContractsPendingPage() {
  const navigate = useNavigate();

  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /* ── fetch pending contracts ───────────────────────────── */

  const fetchPending = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [bmRes, custRes] = await Promise.all([
        api.get(`/api/contracts?status=PENDING_MANAGER_SIGNATURE&limit=${PENDING_FETCH_LIMIT}`),
        api.get(`/api/contracts?status=PENDING_CUSTOMER_SIGNATURE&limit=${PENDING_FETCH_LIMIT}`),
      ]);
      const all = [...(bmRes.data || []), ...(custRes.data || [])];
      all.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setContracts(all);
    } catch {
      setError("Không thể tải dữ liệu.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPending(); }, [fetchPending]);

  /* ── render ────────────────────────────────────────────── */

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="pt-2">
        <h1 className="text-2xl font-bold tracking-tight">Hợp đồng chờ ký</h1>
        <p className="text-sm text-muted-foreground">Các hợp đồng đang chờ khách hàng hoặc quản lý xác nhận và ký</p>
      </div>

      {loading ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <div className="py-14 text-center">
          <p className="text-sm text-destructive">{error}</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={fetchPending}>Thử lại</Button>
        </div>
      ) : contracts.length === 0 ? (
        <div className="flex min-h-[30vh] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border">
          <CheckCircle className="size-10 text-success" />
          <p className="text-sm text-muted-foreground">Không có hợp đồng nào chờ ký</p>
        </div>
      ) : (
        <div className="space-y-3">
          {contracts.map((c) => {
            const isBMSign = c.status === "PENDING_MANAGER_SIGNATURE";
            return (
              <div
                key={c.id}
                className={`flex items-center justify-between rounded-xl border p-4 transition-colors ${
                  isBMSign
                    ? "border-chart-2/30 bg-chart-2/5 hover:bg-chart-2/10"
                    : "border-chart-4/30 bg-chart-4/5 hover:bg-chart-4/10"
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{c.contract_number}</span>
                    <StatusDot status={c.status} statusMap={STATUS_MAP} />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Khách hàng: {c.customer?.last_name} {c.customer?.first_name} — Phòng {c.room?.room_number}
                    {c.room?.building?.name && `, ${c.room.building.name}`}
                  </p>
                  {c.signature_expires_at && (
                    <p className="flex items-center gap-1 text-xs text-chart-4">
                      <Clock className="size-3" />
                      Hạn ký: {formatDate(c.signature_expires_at)}
                    </p>
                  )}
                </div>
                {isBMSign ? (
                  <Button
                    size="sm"
                    onClick={() => navigate(`/building-manager/contracts/${c.id}/sign`)}
                  >
                    <PenLine className="mr-1.5 size-4" />
                    Xem & Ký
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/building-manager/contracts/${c.id}/sign`)}
                  >
                    <Eye className="mr-1.5 size-4" />
                    Xem
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
