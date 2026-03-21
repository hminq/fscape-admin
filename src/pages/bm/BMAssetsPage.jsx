import { useState, useEffect, useCallback, useMemo } from "react";
import {
  MagnifyingGlass, Package, QrCode, Eye,
  Door, CircleNotch, DownloadSimple, Printer,
  Clock,
} from "@phosphor-icons/react";
import { api } from "@/lib/apiClient";
import { formatDateTime } from "@/lib/utils";
import { ASSET_STATUS_MAP, ASSET_HISTORY_ACTION_LABELS } from "@/lib/constants";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import Pagination from "@/components/Pagination";
import SectionHeader from "@/components/SectionHeader";
import { LoadingState, EmptyState } from "@/components/StateDisplay";

/* ── constants ──────────────────────────────────────────── */

const FETCH_LIMIT = 999;
const PER_PAGE = 10;

const STATUS_MAP = ASSET_STATUS_MAP;

const STATUS_FILTERS = [
  { key: "all", label: "Tất cả" },
  { key: "AVAILABLE", label: "Sẵn sàng" },
  { key: "IN_USE", label: "Đang sử dụng" },
];

/* ── Status Bar (available / in_use) ────────────────────── */

function AssetStatusBar({ available, inUse }) {
  const total = available + inUse;
  const pAvail = total > 0 ? (available / total) * 100 : 0;
  const pInUse = total > 0 ? (inUse / total) * 100 : 0;

  return (
    <div className="space-y-2.5">
      <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden flex">
        <div className="h-full bg-success transition-all duration-500" style={{ width: `${pAvail}%` }} />
        <div className="h-full bg-primary transition-all duration-500" style={{ width: `${pInUse}%` }} />
      </div>
      <div className="flex items-center gap-4 text-[11px] text-muted-foreground flex-wrap">
        {total === 0 && (
          <span className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-muted-foreground/30" /> 0 tài sản
          </span>
        )}
        {available > 0 && (
          <span className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-success" /> {Math.round(pAvail)}% Sẵn sàng ({available})
          </span>
        )}
        {inUse > 0 && (
          <span className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-primary" /> {Math.round(pInUse)}% Đang sử dụng ({inUse})
          </span>
        )}
      </div>
    </div>
  );
}

/* ── QR Dialog ──────────────────────────────────────────── */

function QRDialog({ open, onOpenChange, asset }) {
  if (!asset) return null;
  const qrData = asset.qr_code || `FSCAPE_ASSET_${asset.id}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrData)}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-center">Mã QR Tài sản</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center p-6 space-y-4">
          <div className="bg-white p-4 rounded-xl border-4 border-muted shadow-inner">
            <img src={qrUrl} alt="QR Code" className="size-48" />
          </div>
          <div className="text-center">
            <p className="font-bold text-lg">{asset.name}</p>
            <p className="text-xs text-muted-foreground font-mono">{qrData}</p>
          </div>
        </div>
        <DialogFooter className="grid grid-cols-2 gap-2">
          <Button variant="outline" className="gap-2" onClick={() => window.open(qrUrl)}>
            <DownloadSimple className="size-4" /> Tải về
          </Button>
          <Button className="gap-2" onClick={() => window.print()}>
            <Printer className="size-4" /> In mã
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ── Action labels ──────────────────────────────────────── */

const ACTION_LABELS = ASSET_HISTORY_ACTION_LABELS;

/* ── Detail Dialog (read-only, fetches full data + history) ── */

function AssetDetailDialog({ open, onOpenChange, assetId }) {
  const [asset, setAsset] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchDetail = useCallback(async (id) => {
    setLoading(true);
    try {
      const res = await api.get(`/api/assets/${id}`);
      setAsset(res.data || res);
    } catch {
      setAsset(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open && assetId) fetchDetail(assetId);
    return () => setAsset(null);
  }, [open, assetId, fetchDetail]);

  if (!open) return null;

  const st = asset ? (STATUS_MAP[asset.status] || STATUS_MAP.AVAILABLE) : null;
  const histories = asset?.histories || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
        {loading || !asset ? (
          <div className="flex items-center justify-center py-16">
            <CircleNotch className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2.5">
                {asset.name}
                <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${
                  st.text === "text-success"
                    ? "bg-success/15 text-success"
                    : "bg-primary/15 text-primary"
                }`}>
                  {st.label}
                </span>
              </DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto space-y-4 py-2 pr-1">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-border/50 bg-muted/30 p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Door className="size-3.5 text-muted-foreground" />
                    <p className="text-[11px] text-muted-foreground">Phòng</p>
                  </div>
                  <p className="text-sm font-semibold">{asset.room ? `Phòng ${asset.room.room_number}` : "Kho"}</p>
                </div>
                <div className="rounded-lg border border-border/50 bg-muted/30 p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <QrCode className="size-3.5 text-muted-foreground" />
                    <p className="text-[11px] text-muted-foreground">Mã QR</p>
                  </div>
                  <p className="text-sm font-semibold font-mono truncate">{asset.qr_code || "—"}</p>
                </div>
              </div>

              {asset.notes && (
                <div>
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Ghi chú</p>
                  <p className="text-sm mt-0.5">{asset.notes}</p>
                </div>
              )}

              {/* History timeline */}
              {histories.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Clock className="size-4 text-primary" />
                    <span className="text-sm font-semibold">Lịch sử</span>
                  </div>
                  <div className="relative pl-5 space-y-4">
                    <div className="absolute left-[7px] top-1.5 bottom-1.5 w-px bg-border" />
                    {histories.map((h) => {
                      const toSt = STATUS_MAP[h.to_status];
                      return (
                        <div key={h.id} className="relative">
                          <div className={`absolute -left-5 top-1.5 size-2.5 rounded-full ring-2 ring-background ${toSt?.dot || "bg-muted-foreground"}`} />
                          <div className="flex items-center gap-2 text-sm flex-wrap">
                            <span className="font-medium text-xs">
                              {ACTION_LABELS[h.action] || h.action}
                            </span>
                            {h.from_status && h.to_status && h.from_status !== h.to_status && (
                              <span className="text-xs text-muted-foreground">
                                {STATUS_MAP[h.from_status]?.label || h.from_status} → {toSt?.label || h.to_status}
                              </span>
                            )}
                            <span className="text-muted-foreground">•</span>
                            <span className="text-xs text-muted-foreground">{formatDateTime(h.created_at)}</span>
                          </div>
                          {h.notes && (
                            <p className="text-xs text-muted-foreground/70 mt-0.5">{h.notes}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
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

export default function BMAssetsPage() {
  const [allAssets, setAllAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [page, setPage] = useState(0);

  const [detailAssetId, setDetailAssetId] = useState(null);
  const [qrAsset, setQrAsset] = useState(null);

  /* ── fetch all assets (auto-scoped by API to BM's building) ── */

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/api/assets?limit=${FETCH_LIMIT}`);
      setAllAssets(res.data || []);
    } catch {
      setError("Không thể tải dữ liệu.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  /* ── derived data ─────────────────────────────────────── */

  const statusCounts = useMemo(() => {
    const counts = { available: 0, in_use: 0 };
    allAssets.forEach((a) => {
      if (a.status === "AVAILABLE") counts.available++;
      else if (a.status === "IN_USE") counts.in_use++;
    });
    return counts;
  }, [allAssets]);

  const filtered = useMemo(() => {
    return allAssets.filter((a) => {
      if (filterStatus !== "all" && a.status !== filterStatus) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        if (
          !a.name?.toLowerCase().includes(q) &&
          !a.qr_code?.toLowerCase().includes(q) &&
          !a.room?.room_number?.toLowerCase().includes(q)
        ) return false;
      }
      return true;
    });
  }, [allAssets, filterStatus, search]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const visible = filtered.slice(page * PER_PAGE, (page + 1) * PER_PAGE);

  // Reset page when filter/search changes
  useEffect(() => { setPage(0); }, [filterStatus, search]);

  /* ── summary values (reactive to filter) ──────────────── */

  const filteredTotal = filterStatus === "all"
    ? allAssets.length
    : filterStatus === "AVAILABLE"
      ? statusCounts.available
      : statusCounts.in_use;

  const filteredStatusBar = filterStatus === "all"
    ? statusCounts
    : { available: filterStatus === "AVAILABLE" ? statusCounts.available : 0, in_use: filterStatus === "IN_USE" ? statusCounts.in_use : 0 };

  /* ── render ──────────────────────────────────────────── */

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div className="pt-2">
        <h1 className="text-2xl font-bold tracking-tight">Tài sản</h1>
        <p className="text-sm text-muted-foreground">Theo dõi trang thiết bị trong tòa nhà của bạn</p>
      </div>

      {/* Summary Card */}
      {!loading && !error && (
        <div className="rounded-2xl border border-border bg-card">
          <div className="flex items-center gap-6 p-5 flex-wrap">
            <div className="flex items-center gap-4 min-w-[140px]">
              <div className="size-11 rounded-xl bg-primary/8 flex items-center justify-center shrink-0">
                <Package className="size-5 text-primary" />
              </div>
              <div>
                <p className="text-3xl font-bold leading-none tracking-tight">{filteredTotal}</p>
                <p className="text-sm text-muted-foreground mt-1">Tài sản</p>
              </div>
            </div>
            <div className="w-px h-14 bg-border shrink-0" />
            <div className="flex-1 min-w-[200px]">
              <AssetStatusBar
                available={filteredStatusBar.available}
                inUse={filteredStatusBar.in_use}
              />
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Tìm theo tên, mã QR, phòng..."
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
        <LoadingState />
      ) : error ? (
        <div className="py-14 text-center">
          <p className="text-sm text-destructive">{error}</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={fetchAll}>Thử lại</Button>
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Package} message="Không tìm thấy tài sản nào" />
      ) : (
        <>
          <SectionHeader icon={Package} count={filtered.length} countUnit="kết quả">
            <Pagination page={page + 1} totalPages={totalPages}
              onPrev={() => setPage((p) => Math.max(0, p - 1))}
              onNext={() => setPage((p) => Math.min(totalPages - 1, p + 1))} />
          </SectionHeader>

          <Card className="overflow-hidden py-0 gap-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10 pl-4">#</TableHead>
                  <TableHead>Tài sản</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Phòng</TableHead>
                  <TableHead className="text-right pr-4 w-24">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((asset, idx) => {
                  const st = STATUS_MAP[asset.status] || STATUS_MAP.AVAILABLE;
                  return (
                    <TableRow key={asset.id} className="cursor-pointer hover:bg-muted/30" onClick={() => setDetailAssetId(asset.id)}>
                      <TableCell className="pl-4 text-muted-foreground text-xs">
                        {page * PER_PAGE + idx + 1}
                      </TableCell>
                      <TableCell>
                        <span className="font-medium text-sm">{asset.name}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-xs">
                          <span className={`size-2 rounded-full ${st.dot}`} />
                          <span className={`font-medium ${st.text}`}>{st.label}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {asset.room ? (
                          <span className="flex items-center gap-1"><Door className="size-3" /> {asset.room.room_number}</span>
                        ) : "Kho"}
                      </TableCell>
                      <TableCell className="pr-4">
                        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                          <Button size="icon" variant="ghost" className="size-8 text-primary hover:bg-primary/10"
                            title="Xem QR" onClick={() => setQrAsset(asset)}>
                            <QrCode className="size-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" className="size-8"
                            title="Chi tiết" onClick={() => setDetailAssetId(asset.id)}>
                            <Eye className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        </>
      )}

      {/* Detail dialog (read-only) */}
      <AssetDetailDialog
        open={!!detailAssetId}
        onOpenChange={(v) => !v && setDetailAssetId(null)}
        assetId={detailAssetId}
      />

      {/* QR dialog */}
      <QRDialog
        open={!!qrAsset}
        onOpenChange={(v) => !v && setQrAsset(null)}
        asset={qrAsset}
      />
    </div>
  );
}
