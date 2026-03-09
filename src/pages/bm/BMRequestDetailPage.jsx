import { useCallback, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CircleNotch,
  User,
  MapPin,
  Wrench,
  Clock,
  MessageSquare,
  Image as ImageIcon,
} from "@phosphor-icons/react";
import { api } from "@/lib/apiClient";
import { formatDate, formatDateTime } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import StatusDot from "@/components/StatusDot";
import { REQUEST_TYPE_LABELS, REQUEST_STATUS_MAP } from "@/lib/constants";

const STATUS_MAP = REQUEST_STATUS_MAP;

function InfoRow({ label, children }) {
  return (
    <div className="flex justify-between py-2 border-b border-border/50 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-right max-w-[60%]">{children || "—"}</span>
    </div>
  );
}

export default function BMRequestDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <CircleNotch className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-3xl py-14 text-center">
        <p className="text-sm text-destructive">{error}</p>
        <Button variant="outline" size="sm" className="mt-3" onClick={fetchRequest}>Thử lại</Button>
      </div>
    );
  }

  if (!request) return null;

  const r = request;
  const attachments = (r.images || []).filter((i) => i.image_type === "ATTACHMENT");
  const completionImgs = (r.images || []).filter((i) => i.image_type === "COMPLETION");

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 pt-2">
        <Button variant="outline" size="icon" className="size-9 rounded-full shrink-0"
          onClick={() => navigate("/building-manager/requests")}>
          <ArrowLeft className="size-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">{r.request_number}</h1>
            <StatusDot status={r.status} statusMap={STATUS_MAP} />
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">{r.title}</p>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {/* Thông tin chung */}
        <Card className="p-5 space-y-1">
          <div className="flex items-center gap-2 mb-3">
            <Wrench className="size-4 text-primary" />
            <span className="text-sm font-semibold">Thông tin yêu cầu</span>
          </div>
          <InfoRow label="Loại">
            <Badge variant="secondary" className="text-xs font-normal">
              {REQUEST_TYPE_LABELS[r.request_type] || r.request_type}
            </Badge>
          </InfoRow>
          <InfoRow label="Mô tả">{r.description}</InfoRow>
          <InfoRow label="Ngày tạo">{formatDate(r.created_at)}</InfoRow>
          {r.request_price && (
            <InfoRow label="Giá dịch vụ">
              {Number(r.request_price).toLocaleString("vi-VN")} ₫
            </InfoRow>
          )}
          {r.completion_note && <InfoRow label="Ghi chú hoàn thành">{r.completion_note}</InfoRow>}
          {r.completed_at && <InfoRow label="Ngày hoàn thành">{formatDate(r.completed_at)}</InfoRow>}
          {r.feedback_rating && (
            <InfoRow label="Đánh giá">{"★".repeat(r.feedback_rating)}{"☆".repeat(5 - r.feedback_rating)}</InfoRow>
          )}
          {r.feedback_comment && <InfoRow label="Nhận xét">{r.feedback_comment}</InfoRow>}
          {r.report_reason && <InfoRow label="Lý do báo cáo">{r.report_reason}</InfoRow>}
        </Card>

        {/* Phòng + Cư dân + Nhân viên */}
        <div className="space-y-5">
          <Card className="p-5 space-y-1">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="size-4 text-primary" />
              <span className="text-sm font-semibold">Phòng</span>
            </div>
            <InfoRow label="Số phòng">{r.room?.room_number}</InfoRow>
            <InfoRow label="Tầng">{r.room?.floor}</InfoRow>
            <InfoRow label="Tòa nhà">{r.room?.building?.name}</InfoRow>
          </Card>

          <Card className="p-5 space-y-1">
            <div className="flex items-center gap-2 mb-3">
              <User className="size-4 text-primary" />
              <span className="text-sm font-semibold">Cư dân</span>
            </div>
            <InfoRow label="Họ tên">{r.resident?.last_name} {r.resident?.first_name}</InfoRow>
            <InfoRow label="Email">{r.resident?.email}</InfoRow>
            <InfoRow label="SĐT">{r.resident?.phone}</InfoRow>
          </Card>

          {r.staff && (
            <Card className="p-5 space-y-1">
              <div className="flex items-center gap-2 mb-3">
                <Wrench className="size-4 text-primary" />
                <span className="text-sm font-semibold">Nhân viên xử lý</span>
              </div>
              <InfoRow label="Họ tên">{r.staff?.last_name} {r.staff?.first_name}</InfoRow>
              <InfoRow label="SĐT">{r.staff?.phone}</InfoRow>
            </Card>
          )}
        </div>
      </div>

      {/* Ảnh đính kèm */}
      {attachments.length > 0 && (
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <ImageIcon className="size-4 text-primary" />
            <span className="text-sm font-semibold">Ảnh đính kèm ({attachments.length})</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {attachments.map((img) => (
              <a key={img.id} href={img.image_url} target="_blank" rel="noopener noreferrer"
                className="block aspect-video rounded-lg border border-border overflow-hidden bg-muted hover:opacity-80 transition-opacity">
                <img src={img.image_url} alt="" className="size-full object-cover" />
              </a>
            ))}
          </div>
        </Card>
      )}

      {/* Ảnh hoàn thành */}
      {completionImgs.length > 0 && (
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <ImageIcon className="size-4 text-success" />
            <span className="text-sm font-semibold">Ảnh hoàn thành ({completionImgs.length})</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {completionImgs.map((img) => (
              <a key={img.id} href={img.image_url} target="_blank" rel="noopener noreferrer"
                className="block aspect-video rounded-lg border border-border overflow-hidden bg-muted hover:opacity-80 transition-opacity">
                <img src={img.image_url} alt="" className="size-full object-cover" />
              </a>
            ))}
          </div>
        </Card>
      )}

      {/* Lịch sử trạng thái */}
      {r.status_history && r.status_history.length > 0 && (
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="size-4 text-primary" />
            <span className="text-sm font-semibold">Lịch sử trạng thái</span>
          </div>
          <div className="relative pl-5 space-y-4">
            <div className="absolute left-[7px] top-1.5 bottom-1.5 w-px bg-border" />
            {[...r.status_history].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).map((h) => (
              <div key={h.id} className="relative">
                <div className="absolute -left-5 top-1.5 size-2.5 rounded-full bg-primary ring-2 ring-background" />
                <div className="flex items-center gap-2 text-sm">
                  <StatusDot status={h.to_status} statusMap={STATUS_MAP} />
                  <span className="text-muted-foreground">•</span>
                  <span className="text-xs text-muted-foreground">{formatDateTime(h.created_at)}</span>
                </div>
                {h.modifier && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    bởi {h.modifier.last_name} {h.modifier.first_name} ({h.modifier.role})
                  </p>
                )}
                {h.reason && (
                  <p className="text-xs text-muted-foreground/70 mt-0.5 flex items-start gap-1">
                    <MessageSquare className="size-3 shrink-0 mt-0.5" />
                    {h.reason}
                  </p>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
