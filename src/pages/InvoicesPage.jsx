import { useState, useEffect, useCallback } from "react";
import {
  Receipt, MagnifyingGlass, CircleNotch, Eye,
  CaretLeft, CaretRight, CurrencyDollar, CalendarDots,
  ClockCountdown, User as UserIcon, House, Envelope,
} from "@phosphor-icons/react";
import { api } from "@/lib/apiClient";
import { formatDate, formatDateTime } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import StatusDot from "@/components/StatusDot";

/* ── constants ──────────────────────────────────────────── */

const PER_PAGE = 10;

const STATUS_MAP = {
  UNPAID: { label: "Chưa thanh toán", dot: "bg-amber-500", text: "text-amber-500" },
  PAID: { label: "Đã thanh toán", dot: "bg-success", text: "text-success" },
  OVERDUE: { label: "Quá hạn", dot: "bg-destructive", text: "text-destructive" },
  CANCELLED: { label: "Đã hủy", dot: "bg-primary", text: "text-primary" },
};

const STATUS_FILTERS = [
  { key: "all", label: "Tất cả" },
  { key: "unpaid", label: "Chưa thanh toán", statuses: "UNPAID" },
  { key: "paid", label: "Đã thanh toán", statuses: "PAID" },
  { key: "overdue", label: "Quá hạn", statuses: "OVERDUE" },
  { key: "cancelled", label: "Đã hủy", statuses: "CANCELLED" },
];

const BAR_SEGMENTS = [
  { statusKey: "unpaid", color: "bg-amber-500", label: "Chưa thanh toán" },
  { statusKey: "paid", color: "bg-success", label: "Đã thanh toán" },
  { statusKey: "overdue", color: "bg-destructive", label: "Quá hạn" },
  { statusKey: "cancelled", color: "bg-primary", label: "Đã hủy" },
];

const FILTER_STATUS_KEYS = {
  all: null,
  unpaid: ["unpaid"],
  paid: ["paid"],
  overdue: ["overdue"],
  cancelled: ["cancelled"],
};

const TYPE_MAP = {
  RENT: "Tiền thuê",
  SERVICE: "Phí dịch vụ",
  SETTLEMENT: "Thanh toán cuối kỳ",
};

const fmtVND = (v) => {
  if (v == null) return "—";
  return Number(v).toLocaleString("vi-VN") + " đ";
};

/* ── InvoiceStatusBar ───────────────────────────────────── */

function InvoiceStatusBar({ byStatus, filter = "all" }) {
  const hasData = byStatus != null;
  const allowedKeys = FILTER_STATUS_KEYS[filter];

  const segments = BAR_SEGMENTS.map((seg) => {
    const count = byStatus?.[seg.statusKey] || 0;
    const visible = allowedKeys ? allowedKeys.includes(seg.statusKey) : true;
    return { ...seg, count, visible };
  }).filter((s) => s.visible);

  const filteredTotal = segments.reduce((sum, s) => sum + s.count, 0);

  return (
    <div className="flex-1 min-w-[180px] space-y-2.5">
      <div className="flex items-center text-xs">
        <span className="text-muted-foreground">Trạng thái</span>
      </div>
      <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden flex">
        {segments.map((seg) => {
          const pct = filteredTotal > 0 ? (seg.count / filteredTotal) * 100 : 0;
          return (
            <div
              key={seg.statusKey}
              className={`h-full ${seg.color} transition-all duration-500`}
              style={{ width: `${pct}%` }}
            />
          );
        })}
      </div>
      <div className="flex items-center gap-4 text-[11px] text-muted-foreground flex-wrap">
        {!hasData && (
          <span className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-muted-foreground/30" /> Đang chờ dữ liệu...
          </span>
        )}
        {hasData && filteredTotal === 0 && (
          <span className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-muted-foreground/30" /> 0 hóa đơn
          </span>
        )}
        {segments.filter((s) => s.count > 0).map((seg) => (
          <span key={seg.statusKey} className="flex items-center gap-1.5">
            <span className={`size-1.5 rounded-full ${seg.color}`} />
            {seg.label} ({seg.count})
          </span>
        ))}
      </div>
    </div>
  );
}

/* ── InvoiceSummary ─────────────────────────────────────── */

function InvoiceSummary({ stats, filter }) {
  const total = stats?.total || 0;
  const byStatus = stats?.by_status || null;

  const allowedKeys = FILTER_STATUS_KEYS[filter];
  const filteredTotal = !byStatus
    ? 0
    : allowedKeys
      ? allowedKeys.reduce((sum, k) => sum + (byStatus[k] || 0), 0)
      : total;

  return (
    <div className="rounded-2xl border border-border bg-card">
      <div className="flex items-center gap-6 p-5 flex-wrap">
        <div className="flex items-center gap-4 min-w-[140px]">
          <div className="size-11 rounded-xl bg-primary/8 flex items-center justify-center shrink-0">
            <Receipt className="size-5 text-primary" />
          </div>
          <div>
            <p className="text-3xl font-bold leading-none tracking-tight">{filteredTotal}</p>
            <p className="text-sm text-muted-foreground mt-1">Hóa đơn</p>
          </div>
        </div>
        <div className="w-px h-14 bg-border shrink-0" />
        <InvoiceStatusBar byStatus={byStatus} filter={filter} />
      </div>
    </div>
  );
}

/* ── Detail Dialog ──────────────────────────────────────── */

const ITEM_TYPE_MAP = {
  RENT: "Tiền thuê",
  REQUEST: "Phí dịch vụ",
  PENALTY: "Phí phạt",
  REFUND: "Hoàn tiền",
};

function InvoiceDetailDialog({ open, onOpenChange, invoiceId }) {
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !invoiceId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await api.get(`/api/invoices/${invoiceId}`);
        if (!cancelled) setInvoice(res.data || res);
      } catch {
        if (!cancelled) setInvoice(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [open, invoiceId]);

  if (!open) return null;

  const st = invoice ? (STATUS_MAP[invoice.status] || STATUS_MAP.UNPAID) : null;
  const customerName = invoice?.contract?.customer
    ? `${invoice.contract.customer.last_name || ""} ${invoice.contract.customer.first_name || ""}`.trim()
    : "—";
  const roomLabel = invoice?.contract?.room
    ? `${invoice.contract.room.room_number || ""}${invoice.contract.room.building?.name ? " — " + invoice.contract.room.building.name : ""}`
    : "—";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        {loading || !invoice ? (
          <div className="flex items-center justify-center py-12">
            <CircleNotch className="size-6 animate-spin text-muted-foreground/40" />
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2.5">
                {invoice.invoice_number}
                <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${st.dot.replace("bg-", "bg-").replace(/\/\d+/, "")}/15 ${st.text}`}>
                  {st.label}
                </span>
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-1">
              {/* Type badge */}
              <p className="text-xs text-muted-foreground">{TYPE_MAP[invoice.invoice_type] || invoice.invoice_type}</p>

              {/* Info grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-border/50 bg-muted/30 p-3">
                  <p className="text-[11px] text-muted-foreground mb-1 flex items-center gap-1"><CalendarDots className="size-3" /> Kỳ thanh toán</p>
                  <p className="text-sm font-semibold">{formatDate(invoice.billing_period_start)} → {formatDate(invoice.billing_period_end)}</p>
                </div>
                <div className="rounded-lg border border-border/50 bg-muted/30 p-3">
                  <p className="text-[11px] text-muted-foreground mb-1 flex items-center gap-1"><ClockCountdown className="size-3" /> Hạn thanh toán</p>
                  <p className="text-sm font-semibold">{formatDate(invoice.due_date)}</p>
                </div>
              </div>

              {/* Customer & Room */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-border/50 bg-muted/30 p-3">
                  <p className="text-[11px] text-muted-foreground mb-1 flex items-center gap-1"><UserIcon className="size-3" /> Khách hàng</p>
                  <p className="text-sm font-semibold">{customerName}</p>
                  {invoice.contract?.customer?.email && (
                    <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1"><Envelope className="size-3" /> {invoice.contract.customer.email}</p>
                  )}
                </div>
                <div className="rounded-lg border border-border/50 bg-muted/30 p-3">
                  <p className="text-[11px] text-muted-foreground mb-1 flex items-center gap-1"><House className="size-3" /> Phòng</p>
                  <p className="text-sm font-semibold">{roomLabel}</p>
                  {invoice.contract?.contract_number && (
                    <p className="text-[11px] text-muted-foreground mt-0.5">HĐ: {invoice.contract.contract_number}</p>
                  )}
                </div>
              </div>

              {/* Amounts */}
              <div className="rounded-lg border border-border/50 bg-muted/30 p-3 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Tiền thuê</span>
                  <span className="font-medium">{fmtVND(invoice.room_rent)}</span>
                </div>
                {Number(invoice.request_fees) > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Phí dịch vụ</span>
                    <span className="font-medium">{fmtVND(invoice.request_fees)}</span>
                  </div>
                )}
                {Number(invoice.penalty_fees) > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Phí phạt</span>
                    <span className="font-medium">{fmtVND(invoice.penalty_fees)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm pt-2 border-t border-border">
                  <span className="font-semibold">Tổng cộng</span>
                  <span className="font-bold text-base">{fmtVND(invoice.total_amount)}</span>
                </div>
              </div>

              {/* Line items */}
              {invoice.items?.length > 0 && (
                <div>
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Chi tiết ({invoice.items.length})</p>
                  <div className="space-y-1.5">
                    {invoice.items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between text-sm rounded-lg border border-border/50 bg-card p-2.5">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm truncate">{item.description}</p>
                          <p className="text-[11px] text-muted-foreground">{ITEM_TYPE_MAP[item.item_type] || item.item_type}</p>
                        </div>
                        <span className="font-medium shrink-0 ml-3">{fmtVND(item.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Payment info */}
              {invoice.paid_at && (
                <div className="rounded-lg border border-success/30 bg-success/5 p-3">
                  <p className="text-sm font-semibold text-success">Đã thanh toán</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Thời gian: {formatDateTime(invoice.paid_at)}</p>
                </div>
              )}

              {/* Notes */}
              {invoice.notes && (
                <div>
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Ghi chú</p>
                  <p className="text-sm mt-0.5">{invoice.notes}</p>
                </div>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

/* ── Main Page ──────────────────────────────────────────── */

export default function InvoicesPage() {
  const [stats, setStats] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingInit, setLoadingInit] = useState(true);

  const [search, setSearch] = useState("");
  const [filterKey, setFilterKey] = useState("all");
  const [filterType, setFilterType] = useState("__all__");
  const [page, setPage] = useState(1);
  const [detailId, setDetailId] = useState(null);

  const fetchInvoices = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page, limit: PER_PAGE });
    const f = STATUS_FILTERS.find((sf) => sf.key === filterKey);
    if (f?.statuses) params.set("status", f.statuses);
    if (filterType && filterType !== "__all__") params.set("invoice_type", filterType);
    if (search.trim()) params.set("search", search.trim());

    api.get(`/api/invoices?${params}`)
      .then((res) => {
        setInvoices(res.data || []);
        setTotal(res.total || 0);
        setTotalPages(res.total_pages || res.totalPages || 1);
      })
      .catch(() => setInvoices([]))
      .finally(() => setLoading(false));
  }, [page, filterKey, filterType, search]);

  useEffect(() => {
    api.get("/api/invoices/stats")
      .then((res) => setStats(res.data || res))
      .catch(console.error)
      .finally(() => setLoadingInit(false));
  }, []);

  useEffect(() => { fetchInvoices(); }, [fetchInvoices]);
  useEffect(() => { setPage(1); }, [filterKey, filterType, search]);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div className="pt-2">
        <h1 className="text-2xl font-bold tracking-tight">Hóa đơn</h1>
        <p className="text-sm text-muted-foreground">Quản lý tất cả hóa đơn thuê phòng và dịch vụ</p>
      </div>

      {/* Summary */}
      <InvoiceSummary stats={stats} filter={filterKey} />

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Tìm theo mã hóa đơn..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[170px]">
            <SelectValue placeholder="Tất cả loại" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Tất cả loại</SelectItem>
            <SelectItem value="RENT">Tiền thuê</SelectItem>
            <SelectItem value="SERVICE">Phí dịch vụ</SelectItem>
            <SelectItem value="SETTLEMENT">Thanh toán cuối kỳ</SelectItem>
          </SelectContent>
        </Select>

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

      {/* Table */}
      {loadingInit ? (
        <div className="flex items-center justify-center py-20">
          <CircleNotch className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="size-7 rounded-lg bg-primary/8 flex items-center justify-center">
                <Receipt className="size-3.5 text-primary" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">{total} kết quả</span>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium">{page}/{totalPages}</span>
                <div className="flex items-center gap-1">
                  <Button size="icon" variant="outline" className="size-8" disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}>
                    <CaretLeft className="size-4" />
                  </Button>
                  <Button size="icon" variant="outline" className="size-8" disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}>
                    <CaretRight className="size-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <CircleNotch className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : invoices.length === 0 ? (
            <div className="flex min-h-[30vh] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border">
              <Receipt className="size-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Không tìm thấy hóa đơn nào</p>
            </div>
          ) : (
            <Card className="overflow-hidden py-0 gap-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="w-10 pl-4">#</TableHead>
                    <TableHead>Mã hóa đơn</TableHead>
                    <TableHead>Loại</TableHead>
                    <TableHead>Kỳ thanh toán</TableHead>
                    <TableHead className="text-right">Tổng tiền</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="text-right pr-4 w-16" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((inv, idx) => (
                    <TableRow key={inv.id} className="cursor-pointer hover:bg-muted/30" onClick={() => setDetailId(inv.id)}>
                      <TableCell className="pl-4 text-muted-foreground text-xs">
                        {(page - 1) * PER_PAGE + idx + 1}
                      </TableCell>
                      <TableCell className="font-medium">{inv.invoice_number}</TableCell>
                      <TableCell className="text-xs">{TYPE_MAP[inv.invoice_type] || inv.invoice_type}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(inv.billing_period_start)} → {formatDate(inv.billing_period_end)}
                      </TableCell>
                      <TableCell className="text-right font-medium">{fmtVND(inv.total_amount)}</TableCell>
                      <TableCell><StatusDot status={inv.status} statusMap={STATUS_MAP} /></TableCell>
                      <TableCell className="pr-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="size-8" onClick={() => setDetailId(inv.id)}>
                          <Eye className="size-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </>
      )}

      <InvoiceDetailDialog
        open={!!detailId}
        onOpenChange={(v) => !v && setDetailId(null)}
        invoiceId={detailId}
      />
    </div>
  );
}
