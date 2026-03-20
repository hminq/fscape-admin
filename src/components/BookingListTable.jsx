import { useState, useEffect, useCallback, useMemo } from "react";
import {
  MagnifyingGlass, Eye,
  CalendarDots, House, CalendarBlank, CalendarCheck, ClockCountdown
} from "@phosphor-icons/react";
import { api } from "@/lib/apiClient";
import { formatDate } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Pagination from "@/components/Pagination";
import SectionHeader from "@/components/SectionHeader";
import { LoadingState, EmptyState } from "@/components/StateDisplay";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import StatusDot from "@/components/StatusDot";
import { BOOKING_STATUS_MAP } from "@/lib/constants";

const PER_PAGE = 10;
const STATUS_MAP = BOOKING_STATUS_MAP;

const STATUS_FILTERS = [
  { key: "all", label: "Tất cả" },
  { key: "PENDING", label: "Chờ cọc" },
  { key: "DEPOSIT_PAID", label: "Đã cọc" },
  { key: "CONVERTED", label: "Đã chuyển HĐ" },
  { key: "CANCELLED", label: "Đã hủy" },
];

const fmtVND = (v) => {
  if (v == null) return "—";
  return Number(v).toLocaleString("vi-VN") + " đ";
};

/* ── BookingDetailDialog ──────────────────────────────────────── */

function BookingDetailDialog({ open, onOpenChange, booking }) {
  if (!open || !booking) return null;

  const st = STATUS_MAP[booking.status] || STATUS_MAP.PENDING;
  const customerName = booking.customer
    ? `${booking.customer.last_name || ""} ${booking.customer.first_name || ""}`.trim()
    : "—";
  const roomLabel = booking.room
    ? `Phòng ${booking.room.room_number || ""}${booking.room.building?.name ? " — " + booking.room.building.name : ""}`
    : "—";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2.5">
            {booking.booking_number}
            <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${st.dot.replace("bg-", "bg-").replace(/\/\d+/, "")}/15 ${st.text}`}>
              {st.label}
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-1">
          {/* Info grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-border/50 bg-muted/30 p-3">
              <p className="text-[11px] text-muted-foreground mb-1 flex items-center gap-1"><House className="size-3" /> Phòng</p>
              <p className="text-sm font-semibold">{roomLabel}</p>
              {booking.room?.room_type?.name && (
                <p className="text-[11px] text-muted-foreground mt-0.5">{booking.room.room_type.name}</p>
              )}
            </div>
            <div className="rounded-lg border border-border/50 bg-muted/30 p-3">
              <p className="text-[11px] text-muted-foreground mb-1 flex items-center gap-1"><CalendarBlank className="size-3" /> Ngày tạo</p>
              <p className="text-sm font-semibold">{formatDate(booking.created_at)}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-border/50 bg-muted/30 p-3">
              <p className="text-[11px] text-muted-foreground mb-1 flex items-center gap-1"><CalendarDots className="size-3" /> Nhận phòng dự kiến</p>
              <p className="text-sm font-semibold text-primary">{formatDate(booking.check_in_date)}</p>
            </div>
            <div className="rounded-lg border border-border/50 bg-muted/30 p-3">
              <p className="text-[11px] text-muted-foreground mb-1 flex items-center gap-1"><ClockCountdown className="size-3" /> Thời hạn</p>
              <p className="text-sm font-semibold">{booking.duration_months} tháng</p>
            </div>
          </div>

          <div className="rounded-lg border border-border/50 bg-muted/30 p-3">
            <p className="text-[11px] text-muted-foreground mb-2">Khách hàng</p>
            <div className="font-semibold text-sm">{customerName}</div>
            <div className="text-[12px] text-muted-foreground mt-1 flex gap-3">
              <span>{booking.customer?.email}</span>
              <span>{booking.customer?.phone}</span>
            </div>
          </div>

          <div className="rounded-lg border border-border/50 bg-muted/30 p-3 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Giá phòng</span>
              <span className="font-medium">{fmtVND(booking.room_price_snapshot)}</span>
            </div>
            <div className="flex items-center justify-between text-sm pt-2 border-t border-border">
              <span className="font-semibold">Tiền cọc yêu cầu</span>
              <span className="font-bold text-base text-primary">{fmtVND(booking.deposit_amount)}</span>
            </div>
          </div>

          {booking.deposit_paid_at && (
            <div className="rounded-lg border border-success/30 bg-success/5 p-3">
              <p className="text-sm font-semibold text-success">Đã thanh toán cọc</p>
              <p className="text-xs text-muted-foreground mt-0.5">Thời gian: {formatDate(booking.deposit_paid_at, true)}</p>
            </div>
          )}

          {booking.cancelled_at && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 flex flex-col gap-1">
              <p className="text-sm font-semibold text-destructive">Đã hủy</p>
              <p className="text-xs text-muted-foreground">Thời gian: {formatDate(booking.cancelled_at, true)}</p>
              <p className="text-sm text-foreground mt-1">Lý do: {booking.cancellation_reason}</p>
            </div>
          )}

        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── BookingListTable ──────────────────────────────────────────── */

export default function BookingListTable({ buildingId, isBM }) {
  const [allBookings, setAllBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [filterKey, setFilterKey] = useState("all");
  const [page, setPage] = useState(1);
  const [detailItem, setDetailItem] = useState(null);

  const fetchBookings = useCallback(() => {
    setLoading(true);
    api.get(`/api/bookings?limit=9999`)
      .then((res) => {
        // Handle if API returns { data: [...] } or just an array
        const list = Array.isArray(res.data) ? res.data : (Array.isArray(res) ? res : []);
        setAllBookings(list);
      })
      .catch(() => setAllBookings([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  // Client-side filtering
  const filtered = useMemo(() => {
    return allBookings.filter((b) => {
      // 1. Filter by building (for BM)
      if (isBM) {
        if (!buildingId) return false;
        if (b.room?.building?.id !== buildingId) return false;
      } else if (buildingId) {
        if (b.room?.building?.id !== buildingId) return false;
      }
      
      // 2. Filter by status
      if (filterKey !== "all" && b.status !== filterKey) {
        return false;
      }
      
      // 3. Search
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const bName = b.booking_number?.toLowerCase() || "";
        const cName = `${b.customer?.first_name || ""} ${b.customer?.last_name || ""}`.toLowerCase();
        const rName = b.room?.room_number?.toLowerCase() || "";
        
        if (!bName.includes(q) && !cName.includes(q) && !rName.includes(q)) {
          return false;
        }
      }
      
      return true;
    }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }, [allBookings, buildingId, filterKey, search]);

  const total = filtered.length;
  const totalPages = Math.ceil(total / PER_PAGE) || 1;
  const pagedBookings = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  useEffect(() => { setPage(1); }, [filterKey, search, buildingId]);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Tìm theo mã đặt, người đặt, phòng..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex gap-1.5">
          {STATUS_FILTERS.map((f) => (
            <Button key={f.key} size="sm"
              variant={filterKey === f.key ? "default" : "outline"}
              onClick={() => setFilterKey(f.key)}>
              {f.label}
            </Button>
          ))}
        </div>
      </div>

      {loading ? (
        <LoadingState className="py-16" />
      ) : total === 0 ? (
        <EmptyState icon={CalendarCheck} message="Không tìm thấy đơn đặt phòng nào" />
      ) : (
        <>
          <SectionHeader icon={CalendarCheck} count={total} countUnit="đơn">
            <Pagination page={page} totalPages={totalPages}
              onPrev={() => setPage((p) => Math.max(1, p - 1))}
              onNext={() => setPage((p) => Math.min(totalPages, p + 1))} />
          </SectionHeader>

          <Card className="overflow-hidden py-0 gap-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="w-10 pl-4">#</TableHead>
                  <TableHead>Mã đặt phòng</TableHead>
                  <TableHead>Khách hàng</TableHead>
                  <TableHead>Phòng</TableHead>
                  <TableHead>Ngày nhận</TableHead>
                  <TableHead className="text-right">Tiền cọc</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right pr-4 w-16" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagedBookings.map((b, idx) => {
                  const customerName = b.customer
                    ? `${b.customer.last_name || ""} ${b.customer.first_name || ""}`.trim()
                    : "—";
                  
                  return (
                    <TableRow key={b.id} className="cursor-pointer hover:bg-muted/30" onClick={() => setDetailItem(b)}>
                      <TableCell className="pl-4 text-muted-foreground text-xs">
                        {(page - 1) * PER_PAGE + idx + 1}
                      </TableCell>
                      <TableCell className="font-medium text-sm">{b.booking_number}</TableCell>
                      <TableCell className="text-sm">
                        <div className="font-medium">{customerName}</div>
                      </TableCell>
                      <TableCell className="text-sm">
                        Phòng {b.room?.room_number} <span className="text-muted-foreground text-xs block truncate max-w-[150px]">{b.room?.building?.name}</span>
                      </TableCell>
                      <TableCell className="text-sm text-foreground font-medium">
                        {formatDate(b.check_in_date)}
                      </TableCell>
                      <TableCell className="text-right font-medium">{fmtVND(b.deposit_amount)}</TableCell>
                      <TableCell><StatusDot status={b.status} statusMap={STATUS_MAP} /></TableCell>
                      <TableCell className="pr-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="size-8" onClick={() => setDetailItem(b)}>
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

      <BookingDetailDialog
        open={!!detailItem}
        onOpenChange={(v) => !v && setDetailItem(null)}
        booking={detailItem}
      />
    </div>
  );
}
