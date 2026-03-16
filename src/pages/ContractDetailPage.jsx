import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, CircleNotch, FileText, DownloadSimple, FilePdf,
  User as UserIcon, Envelope, House, CalendarDots,
  CurrencyDollar, ClockCountdown, PencilSimple, Notebook,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { api } from "@/lib/apiClient";
import { formatDate, formatDateTime } from "@/lib/utils";
import defaultUserImg from "@/assets/default_user_img.jpg";

const STATUS_MAP = {
  PENDING_CUSTOMER_SIGNATURE: { label: "Chờ KH ký", dot: "bg-chart-2", text: "text-chart-2", badge: "bg-chart-2/15 text-chart-2" },
  PENDING_MANAGER_SIGNATURE: { label: "Chờ QL ký", dot: "bg-chart-4", text: "text-chart-4", badge: "bg-chart-4/15 text-chart-4" },
  ACTIVE: { label: "Đang hiệu lực", dot: "bg-success", text: "text-success", badge: "bg-success/15 text-success" },
  EXPIRING_SOON: { label: "Sắp hết hạn", dot: "bg-amber-500", text: "text-amber-500", badge: "bg-amber-500/15 text-amber-500" },
  FINISHED: { label: "Đã kết thúc", dot: "bg-primary", text: "text-primary", badge: "bg-primary/15 text-primary" },
  TERMINATED: { label: "Đã chấm dứt", dot: "bg-destructive", text: "text-destructive", badge: "bg-destructive/15 text-destructive" },
};

const BILLING_CYCLE_LABEL = {
  CYCLE_1M: "1 tháng",
  CYCLE_3M: "3 tháng",
  CYCLE_6M: "6 tháng",
  ALL_IN: "Trọn gói",
};

const fmtVND = (v) => {
  if (v == null) return "—";
  return Number(v).toLocaleString("vi-VN") + " đ";
};

function InfoCell({ icon: Icon, label, value, sub }) {
  return (
    <div className="rounded-lg border border-border/50 bg-muted/30 p-3.5">
      <div className="flex items-center gap-1.5 mb-1.5">
        {Icon && <Icon className="size-3 text-muted-foreground" />}
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{label}</p>
      </div>
      <p className="text-sm font-semibold">{value || "—"}</p>
      {sub && <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}

function SignatureCard({ label, signedAt, signatureUrl, name }) {
  const signed = !!signedAt;
  return (
    <div className={`rounded-xl border p-4 ${signed ? "border-success/30 bg-success/5" : "border-border bg-muted/20"}`}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</p>
        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${signed ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}>
          {signed ? "Đã ký" : "Chưa ký"}
        </span>
      </div>
      {name && <p className="text-sm font-semibold mb-1">{name}</p>}
      {signed && (
        <p className="text-xs text-muted-foreground">
          Ký lúc: {formatDateTime(signedAt)}
        </p>
      )}
      {signatureUrl && (
        <div className="mt-2 rounded-lg border border-border bg-card p-2">
          <img src={signatureUrl} alt="Chữ ký" className="max-h-16 mx-auto object-contain" />
        </div>
      )}
    </div>
  );
}

export default function ContractDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    const fetchContract = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/api/contracts/${id}`);
        setContract(res.data || res);
      } catch {
        setError("Không thể tải thông tin hợp đồng.");
      } finally {
        setLoading(false);
      }
    };
    fetchContract();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <CircleNotch className="animate-spin text-muted-foreground size-8" />
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="text-center py-20 space-y-4">
        <p className="text-sm text-destructive">{error || "Không tìm thấy hợp đồng."}</p>
        <Button variant="outline" size="sm" onClick={() => navigate("/contracts")}>Quay lại</Button>
      </div>
    );
  }

  const st = STATUS_MAP[contract.status] || STATUS_MAP.ACTIVE;

  const customerName = contract.customer
    ? `${contract.customer.last_name || ""} ${contract.customer.first_name || ""}`.trim()
    : "—";

  const managerName = contract.manager
    ? `${contract.manager.last_name || ""} ${contract.manager.first_name || ""}`.trim()
    : null;

  const roomLabel = contract.room
    ? `${contract.room.room_number || ""}${contract.room.building?.name ? " — " + contract.room.building.name : ""}`
    : "—";

  return (
    <div className="mx-auto max-w-4xl space-y-6 animate-in fade-in duration-500 pb-16">
      {/* Header */}
      <div className="flex items-start gap-3">
        <button
          onClick={() => navigate("/contracts")}
          className="mt-0.5 size-9 rounded-full border border-border bg-card flex items-center justify-center hover:bg-muted transition-colors shrink-0"
        >
          <ArrowLeft className="size-4" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2.5 mb-0.5">
            <h1 className="text-lg font-bold">{contract.contract_number}</h1>
            <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${st.badge}`}>
              {st.label}
            </span>
          </div>
          <p className="text-[13px] text-muted-foreground flex items-center gap-1.5">
            <FileText className="size-3.5" /> Hợp đồng thuê phòng
            {contract.renewed_from_contract_id && (
              <span className="text-[11px] text-muted-foreground/70 ml-1">(Gia hạn)</span>
            )}
          </p>
        </div>
      </div>

      {/* Actions bar */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-2">
          {contract.rendered_content && (
            <Button variant="outline" className="gap-2" onClick={() => setPreviewOpen(true)}>
              <FilePdf className="size-4" /> Xem hợp đồng
            </Button>
          )}
          {contract.pdf_url && (
            <Button className="gap-2" asChild>
              <a href={contract.pdf_url} target="_blank" rel="noopener noreferrer">
                <DownloadSimple className="size-4" /> Tải PDF
              </a>
            </Button>
          )}
        </div>
      </div>

      {/* Contract Info Card */}
      <Card className="overflow-hidden border-border shadow-sm py-0 gap-0">
        <div className="p-5">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
            <FileText className="size-4 text-primary" /> Thông tin hợp đồng
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <InfoCell icon={CalendarDots} label="Ngày bắt đầu" value={formatDate(contract.start_date)} />
            <InfoCell icon={CalendarDots} label="Ngày kết thúc" value={formatDate(contract.end_date)} />
            <InfoCell icon={ClockCountdown} label="Thời hạn" value={contract.duration_months ? `${contract.duration_months} tháng` : "—"} />
            <InfoCell icon={CurrencyDollar} label="Tiền thuê" value={fmtVND(contract.base_rent)} />
            <InfoCell icon={CurrencyDollar} label="Tiền cọc" value={fmtVND(contract.deposit_amount)} />
            <InfoCell icon={PencilSimple} label="Chu kỳ thanh toán" value={BILLING_CYCLE_LABEL[contract.billing_cycle] || contract.billing_cycle || "—"} />
          </div>
        </div>
      </Card>

      {/* Customer & Manager */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Customer */}
        <Card className="overflow-hidden border-border shadow-sm py-0 gap-0">
          <div className="p-5">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
              <UserIcon className="size-4 text-primary" /> Khách hàng
            </h2>
            {contract.customer ? (
              <div className="flex items-start gap-3">
                <img
                  src={contract.customer.avatar_url || defaultUserImg}
                  alt=""
                  className="size-11 rounded-lg object-cover ring-1 ring-border shrink-0"
                  onError={(e) => { e.target.src = defaultUserImg; }}
                />
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{customerName}</p>
                  {contract.customer.email && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <Envelope className="size-3" /> {contract.customer.email}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Không có thông tin.</p>
            )}
          </div>
        </Card>

        {/* Room */}
        <Card className="overflow-hidden border-border shadow-sm py-0 gap-0">
          <div className="p-5">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
              <House className="size-4 text-primary" /> Phòng
            </h2>
            <div className="space-y-1.5">
              <p className="text-sm font-semibold">{roomLabel}</p>
              {contract.room?.room_type?.name && (
                <p className="text-xs text-muted-foreground">Loại: {contract.room.room_type.name}</p>
              )}
              {contract.room?.id && (
                <Button variant="link" size="sm" className="px-0 h-auto text-xs" onClick={() => navigate(`/rooms/${contract.room.id}`)}>
                  Xem chi tiết phòng →
                </Button>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Signatures */}
      <section>
        <h2 className="text-base font-bold mb-3">Chữ ký</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SignatureCard
            label="Chữ ký khách hàng"
            signedAt={contract.customer_signed_at}
            signatureUrl={contract.customer_signature_url}
            name={customerName}
          />
          <SignatureCard
            label="Chữ ký quản lý"
            signedAt={contract.manager_signed_at}
            signatureUrl={contract.manager_signature_url}
            name={managerName}
          />
        </div>

        {contract.signature_expires_at && !contract.manager_signed_at && (
          <div className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 flex items-center gap-2">
            <ClockCountdown className="size-4 text-amber-500 shrink-0" />
            <p className="text-xs text-amber-500 font-medium">
              Hạn ký: {formatDateTime(contract.signature_expires_at)}
            </p>
          </div>
        )}
      </section>

      {/* Template */}
      {contract.template && (
        <section>
          <h2 className="text-base font-bold mb-3">Mẫu hợp đồng</h2>
          <div className="flex items-center rounded-xl border border-border bg-card p-3 gap-3">
            <Notebook className="size-4 text-muted-foreground shrink-0" />
            <p className="text-sm font-semibold">{contract.template.name || "Mẫu hợp đồng"}</p>
          </div>
        </section>
      )}

      {/* Notes */}
      {contract.notes && (
        <section>
          <h2 className="text-base font-bold mb-3">Ghi chú</h2>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-sm leading-relaxed">{contract.notes}</p>
          </div>
        </section>
      )}

      {/* Timestamps */}
      {(contract.created_at || contract.updated_at) && (
        <div className="flex items-center gap-6 text-xs text-muted-foreground pt-2 border-t border-border">
          {contract.created_at && <span>Tạo lúc: {formatDateTime(contract.created_at)}</span>}
          {contract.updated_at && <span>Cập nhật: {formatDateTime(contract.updated_at)}</span>}
        </div>
      )}

      {/* Contract preview dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Xem hợp đồng — {contract.contract_number}</DialogTitle>
          </DialogHeader>
          <div
            className="flex-1 overflow-y-auto prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: contract.rendered_content }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
