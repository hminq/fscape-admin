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

/* ── Request status (BM view) ──────────────── */

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
