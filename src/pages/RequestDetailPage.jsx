import { useCallback, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CircleNotch,
  User,
  MapPin,
  Wrench,
  Clock,
  Chat as MessageSquare,
  Image as ImageIcon,
  UserPlus,
  ArrowCounterClockwise,
  CheckCircle,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { api } from "@/lib/apiClient";
import { formatDate, formatDateTime } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import StatusDot from "@/components/StatusDot";
import AssignStaffDialog from "@/components/AssignStaffDialog";
import { REQUEST_TYPE_LABELS, REQUEST_STATUS_MAP, ROLE_LABELS } from "@/lib/constants";

const STATUS_MAP = REQUEST_STATUS_MAP;

function InfoCell({ icon: Icon, label, value }) {
  return (
    <div className="rounded-lg border border-border/50 bg-muted/30 p-3.5">
      <div className="flex items-center gap-1.5 mb-1.5">
        {Icon && <Icon className="size-3 text-muted-foreground" />}
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{label}</p>
      </div>
      <p className="text-sm font-semibold">{value || "—"}</p>
    </div>
  );
}

export default function RequestDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [assignOpen, setAssignOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchRequest = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/api/requests/${id}`);
      setRequest(res.data);
    } catch (err) {
      setError(err?.message || "Không thể tải dữ liệu.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchRequest(); }, [fetchRequest]);

  const handleStatusAction = async (newStatus) => {
    setActionLoading(true);
    try {
      await api.patch(`/api/requests/${id}/status`, { status: newStatus });
      toast.success(newStatus === "REFUNDED" ? "Đã hoàn tiền thành công" : "Đã đóng yêu cầu thành công");
      setConfirmAction(null);
      fetchRequest();
    } catch (err) {
      toast.error(err?.message || "Thao tác thất bại");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <CircleNotch className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-5xl py-14 text-center">
        <p className="text-sm text-destructive">{error}</p>
        <Button variant="outline" size="sm" className="mt-3" onClick={fetchRequest}>Thử lại</Button>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="mx-auto max-w-5xl py-14 text-center space-y-3">
        <p className="text-sm text-destructive">Không tìm thấy yêu cầu.</p>
        <Button variant="outline" size="sm" onClick={() => navigate("/requests")}>Quay lại</Button>
      </div>
    );
  }

  const r = request;
  const attachments = (r.images || []).filter((i) => i.image_type === "ATTACHMENT");
  const completionImgs = (r.images || []).filter((i) => i.image_type === "COMPLETION");
  const hasActions = r.status === "PENDING" || r.status === "REVIEWED";

  const residentName = r.resident
    ? `${r.resident.last_name || ""} ${r.resident.first_name || ""}`.trim()
    : "—";
  const staffName = r.staff
    ? `${r.staff.last_name || ""} ${r.staff.first_name || ""}`.trim()
    : null;

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-16">
      {/* Header */}
      <div className="flex items-start gap-3">
        <button
          onClick={() => navigate("/requests")}
          className="mt-0.5 size-9 rounded-full border border-border bg-card flex items-center justify-center hover:bg-muted transition-colors shrink-0"
        >
          <ArrowLeft className="size-4" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2.5 mb-0.5">
            <h1 className="text-lg font-bold">{r.request_number}</h1>
            <StatusDot status={r.status} statusMap={STATUS_MAP} />
          </div>
          <p className="text-[13px] text-muted-foreground flex items-center gap-1.5">
            <Wrench className="size-3.5" /> {r.title}
          </p>
        </div>
      </div>

      {/* Action bar */}
      {hasActions && (
        <div className="flex items-center gap-2 border-b border-border pb-4">
          {r.status === "PENDING" && (
            <Button className="gap-1.5" onClick={() => setAssignOpen(true)}>
              <UserPlus className="size-4" />
              Phân công nhân viên
            </Button>
          )}
          {r.status === "REVIEWED" && (
            <>
              <Button variant="destructive" className="gap-1.5"
                onClick={() => setConfirmAction("REFUNDED")}>
                <ArrowCounterClockwise className="size-4" />
                Hoàn tiền
              </Button>
              <Button className="gap-1.5"
                onClick={() => setConfirmAction("COMPLETED")}>
                <CheckCircle className="size-4" />
                Đóng yêu cầu
              </Button>
            </>
          )}
        </div>
      )}

      {/* Request info */}
      <Card className="overflow-hidden border-border shadow-sm py-0 gap-0">
        <div className="p-5">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
            <Wrench className="size-4 text-primary" /> Thông tin yêu cầu
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <InfoCell label="Loại" value={REQUEST_TYPE_LABELS[r.request_type] || r.request_type} />
            <InfoCell label="Ngày tạo" value={formatDate(r.created_at)} />
            <InfoCell label="Giá dịch vụ" value={r.request_price ? `${Number(r.request_price).toLocaleString("vi-VN")} ₫` : "Chưa báo giá"} />
            {r.completed_at && <InfoCell label="Ngày hoàn thành" value={formatDate(r.completed_at)} />}
            {r.feedback_rating && (
              <InfoCell label="Đánh giá" value={"★".repeat(r.feedback_rating) + "☆".repeat(5 - r.feedback_rating)} />
            )}
          </div>
          {r.description && (
            <div className="mt-3 rounded-lg border border-border/50 bg-muted/30 p-3.5">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Mô tả</p>
              <p className="text-sm leading-relaxed">{r.description}</p>
            </div>
          )}
          {r.completion_note && (
            <div className="mt-3 rounded-lg border border-border/50 bg-muted/30 p-3.5">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Ghi chú hoàn thành</p>
              <p className="text-sm leading-relaxed">{r.completion_note}</p>
            </div>
          )}
          {r.feedback_comment && (
            <div className="mt-3 rounded-lg border border-border/50 bg-muted/30 p-3.5">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Nhận xét</p>
              <p className="text-sm leading-relaxed">{r.feedback_comment}</p>
            </div>
          )}
          {r.report_reason && (
            <div className="mt-3 rounded-lg border border-border/50 bg-muted/30 p-3.5">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Lý do báo cáo</p>
              <p className="text-sm leading-relaxed">{r.report_reason}</p>
            </div>
          )}
        </div>
      </Card>

      {/* Room, Resident, Staff */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Room */}
        <Card className="overflow-hidden border-border shadow-sm py-0 gap-0">
          <div className="p-5">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
              <MapPin className="size-4 text-primary" /> Phòng
            </h2>
            <div className="space-y-1.5">
              <p className="text-sm font-semibold">
                {r.room?.room_number}{r.room?.building?.name ? ` — ${r.room.building.name}` : ""}
              </p>
              {r.room?.floor && (
                <p className="text-xs text-muted-foreground">Tầng: {r.room.floor}</p>
              )}
            </div>
          </div>
        </Card>

        {/* Resident */}
        <Card className="overflow-hidden border-border shadow-sm py-0 gap-0">
          <div className="p-5">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
              <User className="size-4 text-primary" /> Cư dân
            </h2>
            <div className="space-y-1.5">
              <p className="text-sm font-semibold">{residentName}</p>
              {r.resident?.email && (
                <p className="text-xs text-muted-foreground">{r.resident.email}</p>
              )}
              {r.resident?.phone && (
                <p className="text-xs text-muted-foreground">SĐT: {r.resident.phone}</p>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Staff */}
      {r.staff && (
        <Card className="overflow-hidden border-border shadow-sm py-0 gap-0">
          <div className="p-5">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
              <Wrench className="size-4 text-primary" /> Nhân viên xử lý
            </h2>
            <div className="space-y-1.5">
              <p className="text-sm font-semibold">{staffName}</p>
              {r.staff.phone && (
                <p className="text-xs text-muted-foreground">SĐT: {r.staff.phone}</p>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Attachment images — from resident */}
      {attachments.length > 0 && (
        <Card className="overflow-hidden border-border shadow-sm py-0 gap-0">
          <div className="p-5">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
              <ImageIcon className="size-4 text-primary" /> Ảnh từ cư dân ({attachments.length})
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {attachments.map((img) => (
                <a key={img.id} href={img.image_url} target="_blank" rel="noopener noreferrer"
                  className="block aspect-video rounded-lg border border-border overflow-hidden bg-muted hover:opacity-80 transition-opacity">
                  <img src={img.image_url} alt="" className="size-full object-cover" />
                </a>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Completion images — from staff */}
      {completionImgs.length > 0 && (
        <Card className="overflow-hidden border-border shadow-sm py-0 gap-0">
          <div className="p-5">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
              <ImageIcon className="size-4 text-success" /> Ảnh hoàn thành — nhân viên ({completionImgs.length})
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {completionImgs.map((img) => (
                <a key={img.id} href={img.image_url} target="_blank" rel="noopener noreferrer"
                  className="block aspect-video rounded-lg border border-border overflow-hidden bg-muted hover:opacity-80 transition-opacity">
                  <img src={img.image_url} alt="" className="size-full object-cover" />
                </a>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Status history */}
      {r.status_history && r.status_history.length > 0 && (
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-5">
            <Clock className="size-4 text-primary" />
            <span className="text-sm font-semibold">Lịch sử trạng thái</span>
          </div>
          <div className="relative ml-3">
            {[...r.status_history]
              .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
              .map((h, idx, arr) => {
                const s = STATUS_MAP[h.to_status] || { dot: "bg-muted-foreground/30", text: "text-muted-foreground", label: h.to_status };
                const isLast = idx === arr.length - 1;
                return (
                  <div key={h.id} className="relative pl-6 pb-5 last:pb-0">
                    {!isLast && (
                      <div className="absolute left-[4.5px] top-3 bottom-0 w-px bg-border" />
                    )}
                    <div className={`absolute left-0 top-[5px] size-2.5 rounded-full ring-2 ring-background ${s.dot}`} />
                    <div className="flex items-baseline gap-2">
                      <span className={`text-sm font-medium ${s.text}`}>{s.label}</span>
                      <span className="text-xs text-muted-foreground">{formatDateTime(h.created_at)}</span>
                    </div>
                    {h.modifier && (
                      <p className="text-xs text-muted-foreground mt-1">
                        bởi {h.modifier.last_name} {h.modifier.first_name} ({ROLE_LABELS[h.modifier.role] ?? h.modifier.role})
                      </p>
                    )}
                    {h.reason && (
                      <p className="text-xs text-muted-foreground/70 mt-1 flex items-start gap-1.5">
                        <MessageSquare className="size-3 shrink-0 mt-0.5" />
                        {h.reason}
                      </p>
                    )}
                  </div>
                );
              })}
          </div>
        </Card>
      )}

      {/* Assign staff dialog */}
      <AssignStaffDialog
        buildingId={r.room?.building_id || r.room?.building?.id}
        requestId={r.id}
        requestNumber={r.request_number}
        open={assignOpen}
        onOpenChange={setAssignOpen}
        onAssigned={fetchRequest}
      />

      {/* Confirm action dialog */}
      <Dialog open={!!confirmAction} onOpenChange={(v) => !v && setConfirmAction(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Xác nhận thao tác</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn{" "}
              {confirmAction === "REFUNDED" ? "hoàn tiền" : "đóng"}{" "}
              yêu cầu <span className="font-semibold text-foreground">{r.request_number}</span>?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmAction(null)} disabled={actionLoading}>
              Hủy
            </Button>
            <Button
              variant={confirmAction === "REFUNDED" ? "destructive" : "default"}
              onClick={() => handleStatusAction(confirmAction)}
              disabled={actionLoading}
            >
              {actionLoading && <CircleNotch className="size-4 animate-spin mr-1.5" />}
              Xác nhận
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
