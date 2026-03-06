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
import { Button } from "@/components/ui/button";

/* ── constants ──────────────────────────────────────────── */

const PENDING_FETCH_LIMIT = 50;

const STATUS_MAP = {
  PENDING_CUSTOMER_SIGNATURE: { label: "Chờ khách hàng ký", dot: "bg-chart-4", text: "text-chart-4" },
  PENDING_MANAGER_SIGNATURE: { label: "Chờ quản lý ký", dot: "bg-chart-2", text: "text-chart-2" },
};

/* ── helpers ─────────────────────────────────────────────── */

const StatusDot = ({ status }) => {
  const s = STATUS_MAP[status] || { label: status, dot: "bg-muted-foreground/30", text: "text-muted-foreground" };
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className={`size-2 rounded-full ${s.dot}`} />
      <span className={`${s.text} font-medium`}>{s.label}</span>
    </div>
  );
};

const formatDate = (d) => (d ? new Date(d).toLocaleDateString("vi-VN") : "—");

/* ── main component ─────────────────────────────────────── */

export default function BMContractsPendingPage() {
  const navigate = useNavigate();

  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);

  /* ── fetch pending contracts ───────────────────────────── */

  const fetchPending = useCallback(async () => {
    setLoading(true);
    try {
      const [bmRes, custRes] = await Promise.all([
        api.get(`/api/contracts?status=PENDING_MANAGER_SIGNATURE&limit=${PENDING_FETCH_LIMIT}`),
        api.get(`/api/contracts?status=PENDING_CUSTOMER_SIGNATURE&limit=${PENDING_FETCH_LIMIT}`),
      ]);
      const all = [...(bmRes.data || []), ...(custRes.data || [])];
      all.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setContracts(all);
    } catch {
      setContracts([]);
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
      ) : contracts.length === 0 ? (
        <div className="flex min-h-[30vh] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border">
          <CheckCircle className="size-10 text-green-500" />
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
                    ? "border-blue-200 bg-blue-50/50 hover:bg-blue-50"
                    : "border-amber-200 bg-amber-50/50 hover:bg-amber-50"
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{c.contract_number}</span>
                    <StatusDot status={c.status} />
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
