import { useCallback, useEffect, useMemo, useState } from "react";
import {
  UserPlus,
  MagnifyingGlass,
  CircleNotch,
  CaretLeft,
  CaretRight,
  ClipboardText,
  CheckCircle,
} from "@phosphor-icons/react";
import { api } from "@/lib/apiClient";
import { useAuth } from "@/contexts/AuthContext";
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
import { Badge } from "@/components/ui/badge";
import AssignStaffDialog from "@/components/AssignStaffDialog";

import { REQUEST_TYPE_LABELS } from "@/lib/constants";

const PER_PAGE = 10;
const FETCH_LIMIT = 999;

export default function BMRequestAssignPage() {
  const { user } = useAuth();

  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);

  const [assignOpen, setAssignOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/api/requests?status=PENDING&limit=${FETCH_LIMIT}`);
      setPendingRequests(res.data || []);
    } catch {
      setError("Không thể tải dữ liệu.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = useMemo(() => {
    if (!search.trim()) return pendingRequests;
    const q = search.trim().toLowerCase();
    return pendingRequests.filter((r) => {
      const residentName = `${r.resident?.last_name || ""} ${r.resident?.first_name || ""}`.toLowerCase();
      return (
        r.request_number?.toLowerCase().includes(q) ||
        r.title?.toLowerCase().includes(q) ||
        residentName.includes(q) ||
        r.room?.room_number?.toLowerCase().includes(q)
      );
    });
  }, [pendingRequests, search]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const visible = filtered.slice(page * PER_PAGE, (page + 1) * PER_PAGE);

  useEffect(() => { setPage(0); }, [search]);

  const openAssignDialog = (request) => {
    setSelectedRequest(request);
    setAssignOpen(true);
  };

  const handleAssigned = () => {
    setPendingRequests((prev) => prev.filter((r) => r.id !== selectedRequest.id));
    setSelectedRequest(null);
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="pt-2">
        <h1 className="text-2xl font-bold tracking-tight">Phân công yêu cầu</h1>
        <p className="text-sm text-muted-foreground">Gán nhân viên xử lý cho các yêu cầu đang chờ</p>
      </div>

      {!loading && !error && (
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-6">
            <div className="size-12 rounded-xl bg-chart-4/10 flex items-center justify-center">
              <ClipboardText className="size-6 text-chart-4" />
            </div>
            <div>
              <p className="text-2xl font-bold">{pendingRequests.length}</p>
              <p className="text-sm text-muted-foreground">yêu cầu đang chờ phân công</p>
            </div>
          </div>
        </div>
      )}

      <div className="relative max-w-md">
        <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="Tìm theo mã, tiêu đề, cư dân, phòng..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <CircleNotch className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <div className="py-14 text-center">
          <p className="text-sm text-destructive">{error}</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={fetchData}>Thử lại</Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex min-h-[30vh] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border">
          <CheckCircle className="size-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Không có yêu cầu nào đang chờ phân công</p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="size-7 rounded-lg bg-primary/8 flex items-center justify-center">
                <ClipboardText className="size-3.5 text-primary" />
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
                  <TableHead>Mã yêu cầu</TableHead>
                  <TableHead>Tiêu đề</TableHead>
                  <TableHead>Loại</TableHead>
                  <TableHead>Phòng</TableHead>
                  <TableHead>Cư dân</TableHead>
                  <TableHead>Ngày tạo</TableHead>
                  <TableHead className="text-right pr-4 w-28">Thao tác</TableHead>
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
                    <TableCell>
                      <Badge variant="secondary" className="text-xs font-normal">
                        {REQUEST_TYPE_LABELS[r.request_type] || r.request_type}
                      </Badge>
                    </TableCell>
                    <TableCell>{r.room?.room_number}</TableCell>
                    <TableCell>{r.resident?.last_name} {r.resident?.first_name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDate(r.created_at)}</TableCell>
                    <TableCell className="pr-4 text-right">
                      <Button size="sm" variant="default" className="gap-1.5"
                        onClick={() => openAssignDialog(r)}>
                        <UserPlus className="size-3.5" />
                        Phân công
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </>
      )}

      {/* ── Assign Dialog (reusable) ── */}
      <AssignStaffDialog
        buildingId={user.building_id}
        requestId={selectedRequest?.id}
        requestNumber={selectedRequest?.request_number}
        open={assignOpen}
        onOpenChange={setAssignOpen}
        onAssigned={handleAssigned}
      />
    </div>
  );
}

