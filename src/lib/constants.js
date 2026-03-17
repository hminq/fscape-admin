/* ── Role labels ────────────────────────────── */

export const ROLE_LABELS = {
  ADMIN: "Quản trị viên",
  BUILDING_MANAGER: "Quản lý tòa nhà",
  STAFF: "Nhân viên",
  RESIDENT: "Cư dân",
  CUSTOMER: "Khách hàng",
};

/* ── Request type labels ────────────────────── */

export const REQUEST_TYPE_LABELS = {
  REPAIR: "Sửa chữa",
  CLEANING: "Vệ sinh",
  COMPLAINT: "Khiếu nại",
  ASSET_CHANGE: "Đổi tài sản",
  CHECKOUT: "Trả phòng",
  OTHER: "Khác",
};

export const REQUEST_TYPES = Object.keys(REQUEST_TYPE_LABELS);

/* ── Request status ────────────────────────── */

export const REQUEST_STATUS_MAP = {
  PENDING: { label: "Chờ xử lý", dot: "bg-chart-4", text: "text-chart-4" },
  ASSIGNED: { label: "Đã phân công", dot: "bg-chart-2", text: "text-chart-2" },
  PRICE_PROPOSED: { label: "Đã báo giá", dot: "bg-chart-3", text: "text-chart-3" },
  APPROVED: { label: "Đã duyệt", dot: "bg-chart-1", text: "text-chart-1" },
  IN_PROGRESS: { label: "Đang xử lý", dot: "bg-primary", text: "text-primary" },
  DONE: { label: "Hoàn thành", dot: "bg-success", text: "text-success" },
  COMPLETED: { label: "Đã đóng", dot: "bg-muted-foreground/60", text: "text-muted-foreground" },
  REVIEWED: { label: "Đang xem xét", dot: "bg-chart-5", text: "text-chart-5" },
  REFUNDED: { label: "Đã hoàn tiền", dot: "bg-destructive", text: "text-destructive" },
  CANCELLED: { label: "Đã hủy", dot: "bg-destructive/60", text: "text-destructive" },
};

/* ── Contract status ───────────────────────── */

export const CONTRACT_STATUS_MAP = {
  PENDING_CUSTOMER_SIGNATURE: { label: "Chờ KH ký", dot: "bg-chart-2", text: "text-chart-2", badge: "bg-chart-2/15 text-chart-2" },
  PENDING_MANAGER_SIGNATURE: { label: "Chờ QL ký", dot: "bg-chart-4", text: "text-chart-4", badge: "bg-chart-4/15 text-chart-4" },
  ACTIVE: { label: "Đang hiệu lực", dot: "bg-success", text: "text-success", badge: "bg-success/15 text-success" },
  EXPIRING_SOON: { label: "Sắp hết hạn", dot: "bg-amber-500", text: "text-amber-500", badge: "bg-amber-500/15 text-amber-500" },
  FINISHED: { label: "Đã kết thúc", dot: "bg-primary", text: "text-primary", badge: "bg-primary/15 text-primary" },
  TERMINATED: { label: "Đã chấm dứt", dot: "bg-destructive", text: "text-destructive", badge: "bg-destructive/15 text-destructive" },
};

/* ── Invoice status ────────────────────────── */

export const INVOICE_STATUS_MAP = {
  UNPAID: { label: "Chưa thanh toán", dot: "bg-amber-500", text: "text-amber-500" },
  PAID: { label: "Đã thanh toán", dot: "bg-success", text: "text-success" },
  OVERDUE: { label: "Quá hạn", dot: "bg-destructive", text: "text-destructive" },
  CANCELLED: { label: "Đã hủy", dot: "bg-primary", text: "text-primary" },
};

/* ── Invoice type labels ───────────────────── */

export const INVOICE_TYPE_LABELS = {
  RENT: "Tiền thuê",
  SERVICE: "Phí dịch vụ",
  SETTLEMENT: "Thanh toán cuối kỳ",
};

export const INVOICE_ITEM_TYPE_LABELS = {
  RENT: "Tiền thuê",
  REQUEST: "Phí dịch vụ",
  PENALTY: "Phí phạt",
  REFUND: "Hoàn tiền",
};

/* ── Billing cycle labels ──────────────────── */

export const BILLING_CYCLE_LABELS = {
  CYCLE_1M: "1 tháng",
  CYCLE_3M: "3 tháng",
  CYCLE_6M: "6 tháng",
  ALL_IN: "Trọn gói",
};
