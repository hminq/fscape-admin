import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Door,
  Lock,
  WarningCircle,
  Wrench,
} from "@phosphor-icons/react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ResponsivePie } from "@nivo/pie";
import { api } from "@/lib/apiClient";
import { cn, formatDateTime } from "@/lib/utils";
import {
  CONTRACT_STATUS_MAP,
  REQUEST_STATUS_MAP,
  REQUEST_TYPE_LABELS,
  ROOM_STATUS_MAP,
} from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const REQUEST_BADGE_MAP = {
  PENDING: "border-chart-5/20 bg-chart-5/8 text-chart-5",
  ASSIGNED: "border-chart-2/20 bg-chart-2/8 text-chart-2",
  PRICE_PROPOSED: "border-chart-3/20 bg-chart-3/8 text-chart-3",
  APPROVED: "border-chart-4/20 bg-chart-4/8 text-chart-4",
  IN_PROGRESS: "border-primary/20 bg-primary/8 text-primary",
  DONE: "border-chart-1/20 bg-chart-1/8 text-chart-1",
  COMPLETED: "border-muted-foreground/20 bg-muted/60 text-muted-foreground",
  REVIEWED: "border-chart-5/20 bg-chart-5/8 text-chart-5",
  REFUNDED: "border-destructive/20 bg-destructive/8 text-destructive",
  CANCELLED: "border-destructive/20 bg-destructive/8 text-destructive",
};

const ROOM_STATUS_COLORS = {
  OCCUPIED: "var(--color-primary)",
  AVAILABLE: "var(--color-chart-4)",
  LOCKED: "var(--color-chart-2)",
  MAINTENANCE: "var(--color-chart-5)",
};

const REQUEST_STATUS_COLORS = {
  PENDING: "var(--color-chart-5)",
  ASSIGNED: "var(--color-chart-2)",
  PRICE_PROPOSED: "var(--color-chart-3)",
  APPROVED: "var(--color-chart-4)",
  IN_PROGRESS: "var(--color-primary)",
  DONE: "var(--color-chart-1)",
  COMPLETED: "var(--color-muted-foreground)",
};

function StatusTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg border bg-card px-3 py-2 shadow-sm">
      <p className="text-xs font-medium text-muted-foreground">
        {payload[0]?.payload?.label || payload[0]?.name}
      </p>
      <p className="mt-1 text-sm font-semibold text-foreground">
        {payload[0]?.value || 0}
      </p>
    </div>
  );
}

function KpiCard({ title, value, description, icon: Icon }) {
  return (
    <Card className="gap-4">
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div className="space-y-1">
          <CardDescription>{title}</CardDescription>
          <CardTitle className="text-2xl">{value}</CardTitle>
        </div>
        <div className="rounded-lg border border-primary/20 bg-primary/8 p-2 text-primary">
          <Icon className="size-5" weight="duotone" />
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-xs leading-5 text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

function EmptyChart({ message }) {
  return (
    <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
      {message}
    </div>
  );
}

function RoomStatusBadgeLayer({ dataWithArc = [], centerX, centerY }) {
  if (!Array.isArray(dataWithArc) || dataWithArc.length === 0) return null;

  return (
    <g>
      {dataWithArc.map(({ arc, data }) => {
        if (!data?.value) return null;

        const angle = (arc.startAngle + arc.endAngle) / 2 - Math.PI / 2;
        const lineStartRadius = arc.outerRadius + 6;
        const lineEndRadius = arc.outerRadius + 26;
        const x1 = centerX + Math.cos(angle) * lineStartRadius;
        const y1 = centerY + Math.sin(angle) * lineStartRadius;
        const x2 = centerX + Math.cos(angle) * lineEndRadius;
        const y2 = centerY + Math.sin(angle) * lineEndRadius;
        const isRight = Math.cos(angle) >= 0;
        const badgeWidth = 92;
        const badgeHeight = 24;
        const badgeX = isRight ? x2 + 6 : x2 - badgeWidth - 6;
        const badgeY = y2 - badgeHeight / 2;
        const lineEndX = isRight ? badgeX : badgeX + badgeWidth;
        const textX = badgeX + badgeWidth / 2;
        const label = `${data.label} ${data.value}`;

        return (
          <g key={data.id}>
            <line
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="var(--color-muted-foreground)"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <line
              x1={x2}
              y1={y2}
              x2={lineEndX}
              y2={y2}
              stroke="var(--color-muted-foreground)"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <rect
              x={badgeX}
              y={badgeY}
              rx="12"
              ry="12"
              width={badgeWidth}
              height={badgeHeight}
              fill={data.color}
              fillOpacity="0.14"
              stroke={data.color}
              strokeOpacity="0.32"
            />
            <text
              x={textX}
              y={badgeY + badgeHeight / 2}
              textAnchor="middle"
              dominantBaseline="central"
              fill={data.color}
              style={{ fontSize: 11, fontWeight: 600 }}
            >
              {label}
            </text>
          </g>
        );
      })}
    </g>
  );
}

export default function BuildingManagerHomePage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/api/dashboard/building-manager")
      .then((res) => setData(res.data))
      .catch((err) => {
        console.error("Failed to fetch building manager dashboard", err);
      })
      .finally(() => setLoading(false));
  }, []);

  const dashboard = data || {};
  const building = dashboard.building || null;
  const kpis = dashboard.kpis || {};
  const roomStatusSummary = dashboard.room_status_summary || [];
  const requestStatusSummary = dashboard.request_status_summary || [];
  const recentRequests = dashboard.recent_requests || [];
  const pendingContracts = dashboard.pending_contracts || [];
  const recentBookings = dashboard.recent_bookings || [];

  const roomStatusChartData = useMemo(
    () =>
      roomStatusSummary
        .filter((item) => Number(item.count || 0) > 0)
        .map((item) => ({
          ...item,
          label: ROOM_STATUS_MAP[item.status]?.label || item.status,
          value: Number(item.count || 0),
          fill: ROOM_STATUS_COLORS[item.status] || "var(--color-chart-2)",
        })),
    [roomStatusSummary],
  );

  const requestStatusChartData = useMemo(
    () =>
      requestStatusSummary
        .filter((item) => Number(item.count || 0) > 0)
        .map((item) => ({
          ...item,
          label: REQUEST_STATUS_MAP[item.status]?.label || item.status,
          count: Number(item.count || 0),
          fill: REQUEST_STATUS_COLORS[item.status] || "var(--color-chart-2)",
        })),
    [requestStatusSummary],
  );

  const totalRoomCount = roomStatusSummary.reduce((sum, item) => sum + Number(item.count || 0), 0);
  const occupiedRate = totalRoomCount > 0
    ? ((Number(kpis.occupied_rooms || 0) / totalRoomCount) * 100).toFixed(1)
    : "0.0";

  const topStats = [
    {
      title: "Phòng đang thuê",
      value: Number(kpis.occupied_rooms || 0).toLocaleString("vi-VN"),
      description: `${occupiedRate}% công suất phòng hiện tại.`,
      icon: Lock,
    },
    {
      title: "Phòng còn trống",
      value: Number(kpis.available_rooms || 0).toLocaleString("vi-VN"),
      description: "Sẵn sàng cho đặt phòng hoặc hợp đồng mới.",
      icon: Door,
    },
    {
      title: "Yêu cầu đang xử lý",
      value: Number(kpis.active_requests || 0).toLocaleString("vi-VN"),
      description: "Bao gồm yêu cầu mới, đã phân công và đang xử lý.",
      icon: Wrench,
    },
    {
      title: "Hợp đồng sắp hết hạn",
      value: Number(kpis.expiring_contracts || 0).toLocaleString("vi-VN"),
      description: "Cần theo dõi gia hạn hoặc xử lý rời phòng.",
      icon: WarningCircle,
    },
  ];

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="space-y-3 text-center">
          <div className="mx-auto size-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
          <p className="text-sm text-muted-foreground">Đang tải dữ liệu tòa nhà...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <Card className="mx-auto max-w-xl">
        <CardHeader>
          <CardTitle>Không thể tải tổng quan quản lý tòa nhà</CardTitle>
          <CardDescription>
            API không phản hồi hoặc dữ liệu không hợp lệ. Kiểm tra lại server rồi tải lại trang.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Tổng quan tòa nhà</h1>
        <p className="text-sm text-muted-foreground">
          {building?.name || "Tòa nhà của bạn"} - Bảng điều hành vận hành theo thời gian thực.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {topStats.map((item) => (
          <KpiCard key={item.title} {...item} />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
            <CardHeader>
              <CardTitle>Tình trạng phòng</CardTitle>
              <CardDescription>Phân bổ phòng theo trạng thái vận hành.</CardDescription>
            </CardHeader>
            <CardContent>
              {roomStatusChartData.length > 0 ? (
                <div className="space-y-5">
                  <div className="mx-auto h-80 w-full max-w-[520px]">
                    <ResponsivePie
                      data={roomStatusChartData.map((item) => ({
                        id: item.label,
                        label: item.label,
                        value: item.value,
                        color: item.fill,
                      }))}
                      margin={{ top: 28, right: 150, bottom: 28, left: 150 }}
                      innerRadius={0.62}
                      padAngle={1.5}
                      cornerRadius={3}
                      activeOuterRadiusOffset={4}
                      colors={({ data }) => data.color}
                      borderWidth={1}
                      borderColor="var(--color-background)"
                      enableArcLinkLabels={false}
                      arcLabelsSkipAngle={360}
                      enableArcLabels={false}
                      layers={["arcs", RoomStatusBadgeLayer]}
                      isInteractive
                      theme={{
                        tooltip: {
                          container: {
                            background: "var(--color-card)",
                            color: "var(--color-foreground)",
                            border: "1px solid var(--color-border)",
                            borderRadius: "0.75rem",
                            boxShadow: "0 4px 16px rgba(15, 23, 42, 0.08)",
                            fontSize: "12px",
                            padding: "8px 10px",
                          },
                        },
                        labels: {
                          text: {
                            fill: "var(--color-foreground)",
                            fontSize: 12,
                            fontWeight: 600,
                          },
                        },
                      }}
                      tooltip={({ datum }) => (
                        <div className="rounded-lg border bg-card px-3 py-2 shadow-sm">
                          <p className="text-xs font-medium text-muted-foreground">{datum.label}</p>
                          <p className="mt-1 text-sm font-semibold text-foreground">{datum.value}</p>
                        </div>
                      )}
                    />
                  </div>
                </div>
              ) : (
                <EmptyChart message="Chưa có dữ liệu trạng thái phòng." />
              )}
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
              <CardTitle>Yêu cầu theo trạng thái</CardTitle>
              <CardDescription>Khối lượng công việc hiện tại của tòa nhà theo từng giai đoạn xử lý.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {requestStatusChartData.length > 0 ? (
                <>
                  <div className="h-64 rounded-lg border bg-muted/10 p-3">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={requestStatusChartData}
                        layout="vertical"
                        margin={{ top: 6, right: 12, left: 6, bottom: 6 }}
                      >
                        <CartesianGrid horizontal={false} stroke="var(--color-border)" strokeDasharray="3 3" />
                        <XAxis
                          type="number"
                          allowDecimals={false}
                          tickLine={false}
                          axisLine={false}
                          tickMargin={8}
                          stroke="var(--color-muted-foreground)"
                          fontSize={12}
                        />
                        <YAxis
                          type="category"
                          dataKey="label"
                          tickLine={false}
                          axisLine={false}
                          width={104}
                          stroke="var(--color-muted-foreground)"
                          fontSize={12}
                        />
                        <Tooltip content={<StatusTooltip />} cursor={{ fill: "var(--color-muted)", opacity: 0.2 }} />
                        <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                          {requestStatusChartData.map((entry) => (
                            <Cell key={entry.status} fill={entry.fill} />
                          ))}
                          <LabelList
                            dataKey="count"
                            position="right"
                            offset={10}
                            fill="var(--color-foreground)"
                            fontSize={12}
                            fontWeight={600}
                          />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-wrap gap-x-5 gap-y-3">
                    {requestStatusChartData.map((item) => (
                      <div key={item.status} className="flex items-center gap-2">
                          <span className="size-2.5 rounded-full" style={{ backgroundColor: item.fill }} />
                          <span className="text-xs text-muted-foreground">{item.label}</span>
                          <span className="text-sm font-semibold text-foreground">{item.count}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <EmptyChart message="Chưa có dữ liệu yêu cầu để hiển thị." />
              )}
            </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base">Yêu cầu gần đây</CardTitle>
              <CardDescription>Các yêu cầu mới nhất cần theo dõi hoặc phân công.</CardDescription>
            </div>
            <Link to="/building-manager/requests" className="text-sm font-medium text-primary hover:underline">
              Xem tất cả
            </Link>
          </CardHeader>
          <CardContent>
            {recentRequests.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cư dân</TableHead>
                    <TableHead>Phòng</TableHead>
                    <TableHead>Loại</TableHead>
                    <TableHead>Trạng thái</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-medium">{request.resident_name || "—"}</p>
                          <p className="text-xs text-muted-foreground">{formatDateTime(request.created_at)}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{request.room_number}</Badge>
                      </TableCell>
                      <TableCell>{REQUEST_TYPE_LABELS[request.request_type] || request.request_type}</TableCell>
                      <TableCell>
                        <span className={cn(
                          "inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium",
                          REQUEST_BADGE_MAP[request.status] || "border-border bg-muted text-foreground"
                        )}>
                          {REQUEST_STATUS_MAP[request.status]?.label || request.status}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <EmptyChart message="Chưa có yêu cầu nào trong tòa nhà." />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base">Hợp đồng chờ xử lý</CardTitle>
              <CardDescription>Ưu tiên hợp đồng chờ ký và các trường hợp sắp hết hạn.</CardDescription>
            </div>
            <Link to="/building-manager/contracts/pending" className="text-sm font-medium text-primary hover:underline">
              Xem tất cả
            </Link>
          </CardHeader>
          <CardContent>
            {pendingContracts.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Khách hàng</TableHead>
                    <TableHead>Phòng</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Hạn xử lý</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingContracts.map((contract) => (
                    <TableRow key={contract.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-medium">{contract.customer_name || "—"}</p>
                          <p className="text-xs text-muted-foreground">{contract.contract_number}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{contract.room_number}</Badge>
                      </TableCell>
                      <TableCell>{CONTRACT_STATUS_MAP[contract.status]?.label || contract.status}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDateTime(contract.signature_expires_at) || contract.end_date || "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <EmptyChart message="Không có hợp đồng cần xử lý ngay lúc này." />
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base">Đặt phòng mới</CardTitle>
            <CardDescription>Theo dõi các lượt đặt phòng mới phát sinh trong tòa nhà.</CardDescription>
          </div>
          <Link to="/building-manager/bookings" className="text-sm font-medium text-primary hover:underline">
            Xem tất cả
          </Link>
        </CardHeader>
        <CardContent>
          {recentBookings.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Khách hàng</TableHead>
                  <TableHead>Phòng</TableHead>
                  <TableHead>Mã đặt phòng</TableHead>
                  <TableHead>Ngày nhận phòng</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentBookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-medium">{booking.customer_name || "—"}</p>
                        <p className="text-xs text-muted-foreground">{formatDateTime(booking.created_at)}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{booking.room_number}</Badge>
                    </TableCell>
                    <TableCell>{booking.booking_number}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{booking.check_in_date || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <EmptyChart message="Chưa có lượt đặt phòng mới trong tòa nhà." />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
