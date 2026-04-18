import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle,
  Clock,
  Eye,
  PencilLine,
} from "@phosphor-icons/react";
import { api } from "@/lib/apiClient";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Pagination from "@/components/Pagination";
import SectionHeader from "@/components/SectionHeader";
import { LoadingState, EmptyState } from "@/components/StateDisplay";
import StatusDot from "@/components/StatusDot";
import { CONTRACT_STATUS_MAP } from "@/lib/constants";

const STATUS_MAP = CONTRACT_STATUS_MAP;
const PER_PAGE = 10;
const PENDING_STATUSES = "PENDING_MANAGER_SIGNATURE,PENDING_CUSTOMER_SIGNATURE";

const fullName = (user) => {
  if (!user) return "-";
  const name = `${user.last_name || ""} ${user.first_name || ""}`.trim();
  return name || user.email || "-";
};

export default function BMContractsPendingPage() {
  const navigate = useNavigate();
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchPending = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/api/contracts?status=${PENDING_STATUSES}&page=${page}&limit=${PER_PAGE}`);
      setContracts(res.data || []);
      setTotal(res.total || 0);
      setTotalPages(res.total_pages || res.totalPages || 1);
    } catch {
      setError("Không thể tải dữ liệu.");
      setContracts([]);
      setTotal(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchPending();
  }, [fetchPending]);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="pt-2">
        <h1 className="text-2xl font-bold tracking-tight">Hợp đồng chờ ký</h1>
        <p className="text-sm text-muted-foreground">Các hợp đồng đang chờ khách hàng hoặc quản lý xác nhận và ký</p>
      </div>

      {loading ? (
        <LoadingState className="min-h-[30vh]" />
      ) : error ? (
        <div className="py-14 text-center">
          <p className="text-sm text-destructive">{error}</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={fetchPending}>
            Thử lại
          </Button>
        </div>
      ) : contracts.length === 0 ? (
        <EmptyState icon={CheckCircle} message="Không có hợp đồng nào chờ ký" />
      ) : (
        <>
          <SectionHeader icon={Clock} count={total} countUnit="hợp đồng chờ ký">
            <Pagination
              page={page}
              totalPages={totalPages}
              onPrev={() => setPage((current) => current - 1)}
              onNext={() => setPage((current) => current + 1)}
            />
          </SectionHeader>

          <div className="space-y-3">
            {contracts.map((contract) => {
              const isManagerSign = contract.status === "PENDING_MANAGER_SIGNATURE";
              return (
                <div
                  key={contract.id}
                  className={`flex items-center justify-between gap-4 rounded-xl border p-4 transition-colors ${
                    isManagerSign
                      ? "border-chart-2/30 bg-chart-2/5 hover:bg-chart-2/10"
                      : "border-chart-4/30 bg-chart-4/5 hover:bg-chart-4/10"
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{contract.contract_number}</span>
                      <StatusDot status={contract.status} statusMap={STATUS_MAP} />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Khách hàng: {fullName(contract.customer)} - Phòng {contract.room?.room_number || "-"}
                      {contract.room?.building?.name && `, ${contract.room.building.name}`}
                    </p>
                    {contract.signature_expires_at && (
                      <p className="flex items-center gap-1 text-xs text-chart-4">
                        <Clock className="size-3" />
                        Hạn ký: {formatDate(contract.signature_expires_at)}
                      </p>
                    )}
                  </div>
                  {isManagerSign ? (
                    <Button size="sm" onClick={() => navigate(`/building-manager/contracts/${contract.id}/sign`)}>
                      <PencilLine className="mr-1.5 size-4" />
                      Xem & Ký
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" onClick={() => navigate(`/building-manager/contracts/${contract.id}`)}>
                      <Eye className="mr-1.5 size-4" />
                      Xem
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
