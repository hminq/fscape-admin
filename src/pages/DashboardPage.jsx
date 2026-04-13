import { useEffect, useMemo, useState } from "react";
import {
  Briefcase,
  Buildings,
  CalendarBlank,
  CaretLeft,
  CaretRight,
  CheckCircle,
  CurrencyDollar,
  Door,
  Lock,
  TrendUp,
} from "@phosphor-icons/react";
import { api } from "@/lib/apiClient";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const ITEMS_PER_PAGE = 5;
const CURRENCY_FORMATTER = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
});

function Pagination({ totalItems, itemsPerPage, currentPage, onPageChange }) {
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between border-t px-6 py-4">
      <p className="text-sm text-muted-foreground">
        Hiển thị {Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)} -{" "}
        {Math.min(currentPage * itemsPerPage, totalItems)} trong {totalItems}
      </p>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <CaretLeft weight="bold" />
        </Button>
        <span className="min-w-16 text-center text-sm font-medium text-foreground">
          {currentPage} / {totalPages}
        </span>
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          <CaretRight weight="bold" />
        </Button>
      </div>
    </div>
  );
}

function StatCard({ title, value, description, icon: Icon }) {
  const accentClasses = {
    "Tổng số phòng": "border-chart-1/25 bg-chart-1/6 text-chart-1",
    "Phòng đang thuê": "border-chart-4/25 bg-chart-4/8 text-chart-4",
    "Tỉ lệ lấp đầy": "border-chart-2/25 bg-chart-2/8 text-chart-2",
    "Doanh thu 30 ngày": "border-chart-5/30 bg-chart-5/14 text-chart-5",
  };

  return (
    <Card className="gap-4">
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div className="space-y-1">
          <CardDescription>{title}</CardDescription>
          <CardTitle className="text-2xl">{value}</CardTitle>
        </div>
        <div className={cn("rounded-lg border p-2", accentClasses[title] || "bg-muted text-muted-foreground")}>
          <Icon className="size-5" weight="duotone" />
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

function EmptyState({ colSpan, message }) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} className="h-32 text-center text-sm text-muted-foreground">
        {message}
      </TableCell>
    </TableRow>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookingPage, setBookingPage] = useState(1);
  const [roomTypePage, setRoomTypePage] = useState(1);

  useEffect(() => {
    api
      .get("/api/dashboard")
      .then((res) => {
        setData(res.data);
      })
      .catch((err) => {
        console.error("Failed to fetch dashboard", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const dashboard = data || {};
  const totalRooms = Number(dashboard.total_rooms || 0);
  const occupiedRooms = Number(dashboard.occupied_rooms || 0);
  const recentRevenue = Number(dashboard.recent_revenue || 0);
  const roomTypeDistribution = dashboard.room_type_distribution || [];
  const roomTypesOverview = dashboard.room_types_overview || [];
  const recentBookings = dashboard.recent_bookings || [];
  const employeeStats = dashboard.employee_stats || { total: 0, active: 0, inactive: 0 };
  const vacantRooms = Math.max(0, totalRooms - occupiedRooms);
  const occupancyRate = totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0;

  const topStats = useMemo(
    () => [
      {
        title: "Tổng số phòng",
        value: totalRooms.toLocaleString("vi-VN"),
        description: "Tổng số phòng hiện có trên toàn hệ thống.",
        icon: Door,
      },
      {
        title: "Phòng đang thuê",
        value: occupiedRooms.toLocaleString("vi-VN"),
        description: `${vacantRooms.toLocaleString("vi-VN")} phòng còn trống.`,
        icon: Lock,
      },
      {
        title: "Tỉ lệ lấp đầy",
        value: `${occupancyRate.toFixed(1)}%`,
        description: "Tính trên tổng phòng đang được khai thác.",
        icon: CheckCircle,
      },
      {
        title: "Doanh thu 30 ngày",
        value: CURRENCY_FORMATTER.format(recentRevenue),
        description: "Tổng từ các giao dịch thanh toán thành công gần đây.",
        icon: CurrencyDollar,
      },
    ],
    [occupiedRooms, occupancyRate, recentRevenue, totalRooms, vacantRooms],
  );

  const roomTypeBarData = useMemo(
    () =>
      roomTypeDistribution
        .map((item) => ({ label: item.name, value: Number(item.count || 0) }))
        .sort((a, b) => b.value - a.value),
    [roomTypeDistribution],
  );

  const occupancyDonutStyle = useMemo(() => {
    const occupiedPercent = totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0;
    return {
      background: `conic-gradient(var(--color-chart-4) 0% ${occupiedPercent}%, var(--color-chart-2) ${occupiedPercent}% 100%)`,
    };
  }, [occupiedRooms, totalRooms]);

  const paginatedBookings = recentBookings.slice(
    (bookingPage - 1) * ITEMS_PER_PAGE,
    bookingPage * ITEMS_PER_PAGE,
  );

  const paginatedRoomTypes = roomTypesOverview.slice(
    (roomTypePage - 1) * ITEMS_PER_PAGE,
    roomTypePage * ITEMS_PER_PAGE,
  );

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="space-y-3 text-center">
          <div className="mx-auto size-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
          <p className="text-sm text-muted-foreground">Đang tải dữ liệu dashboard...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <Card className="mx-auto max-w-xl">
        <CardHeader>
          <CardTitle>Không thể tải dashboard</CardTitle>
          <CardDescription>
            API không phản hồi hoặc dữ liệu không hợp lệ. Kiểm tra lại server rồi tải lại trang.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 font-sans">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Tổng quan vận hành, doanh thu và tình trạng khai thác phòng cho khu vực quản trị.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {topStats.map((item) => (
          <StatCard key={item.title} {...item} />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_1.4fr]">
        <Card>
          <CardHeader>
            <CardTitle>Tình trạng phòng</CardTitle>
            <CardDescription>Phân bổ số phòng đang thuê và còn trống.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-[220px_1fr] lg:items-center">
              <div className="flex justify-center">
                <div className="relative flex size-44 items-center justify-center rounded-full border bg-muted/20 p-3">
                  <div className="size-full rounded-full" style={occupancyDonutStyle} />
                  <div className="absolute flex size-28 flex-col items-center justify-center rounded-full border bg-background">
                    <span className="text-3xl font-semibold">{occupancyRate.toFixed(1)}%</span>
                    <span className="text-xs uppercase tracking-wide text-muted-foreground">Lấp đầy</span>
                  </div>
                </div>
              </div>

              <div className="space-y-5">
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Tỉ lệ lấp đầy</span>
                    <span className="font-medium">{occupancyRate.toFixed(1)}%</span>
                  </div>
                  <Progress value={occupancyRate} className="h-2.5 bg-chart-2/20 [&_[data-slot=progress-indicator]]:bg-chart-4" />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border border-chart-4/20 bg-chart-4/8 p-4">
                    <p className="text-sm text-muted-foreground">Đã thuê</p>
                    <p className="mt-1 text-2xl font-semibold text-chart-4">{occupiedRooms.toLocaleString("vi-VN")}</p>
                  </div>
                  <div className="rounded-lg border border-chart-2/20 bg-chart-2/8 p-4">
                    <p className="text-sm text-muted-foreground">Còn trống</p>
                    <p className="mt-1 text-2xl font-semibold text-chart-2">{vacantRooms.toLocaleString("vi-VN")}</p>
                  </div>
                </div>

                <div className="rounded-lg border bg-muted/20 p-4">
                  <div className="flex items-start gap-3">
                    <div className="rounded-md border bg-background p-2 text-chart-1">
                      <Buildings className="size-4" weight="duotone" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Nhân sự nội bộ</p>
                      <p className="text-sm text-muted-foreground">
                        Tổng {employeeStats.total} người, gồm {employeeStats.active} đang hoạt động và{" "}
                        {employeeStats.inactive} tạm ngưng.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Phân bổ loại phòng</CardTitle>
            <CardDescription>Số lượng phòng theo từng hạng mục đang được cấu hình.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {roomTypeBarData.length > 0 ? (
                roomTypeBarData.map((item) => {
                  const percent = totalRooms > 0 ? (item.value / totalRooms) * 100 : 0;
                  return (
                    <div key={item.label} className="space-y-2">
                      <div className="flex items-center justify-between gap-4 text-sm">
                        <span className="truncate font-medium">{item.label}</span>
                        <span className="shrink-0 text-muted-foreground">
                          {item.value} phòng
                        </span>
                      </div>
                      <Progress value={percent} className="h-2.5 bg-chart-2/16 [&_[data-slot=progress-indicator]]:bg-chart-1" />
                    </div>
                  );
                })
              ) : (
                <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                  Chưa có dữ liệu phân bổ loại phòng.
                </div>
              )}

              {roomTypeBarData.length > 0 && (
                <div className="grid gap-3 border-t pt-4 sm:grid-cols-2">
                  <div className="rounded-lg border border-chart-1/20 bg-chart-1/6 p-4">
                    <div className="flex items-center gap-2 text-chart-1">
                      <TrendUp className="size-4" weight="duotone" />
                      <p className="text-sm font-medium">Loại phổ biến nhất</p>
                    </div>
                    <p className="mt-2 text-base font-semibold">{roomTypeBarData[0]?.label || "—"}</p>
                  </div>
                  <div className="rounded-lg border border-chart-5/20 bg-chart-5/12 p-4">
                    <div className="flex items-center gap-2 text-chart-5">
                      <Briefcase className="size-4" weight="duotone" />
                      <p className="text-sm font-medium">Số lượng hạng phòng</p>
                    </div>
                    <p className="mt-2 text-base font-semibold">{roomTypeBarData.length} loại đang hiển thị</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle>Booking gần đây</CardTitle>
                <CardDescription>Danh sách booking mới nhất trên hệ thống.</CardDescription>
              </div>
              <Badge variant="secondary">
                <CalendarBlank className="size-3.5" weight="duotone" />
                {recentBookings.length} booking
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="px-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mã booking</TableHead>
                    <TableHead>Khách hàng</TableHead>
                    <TableHead>Phòng</TableHead>
                    <TableHead className="text-right">Check-in</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedBookings.length > 0 ? (
                    paginatedBookings.map((booking) => {
                      let customerName = booking.customer || "Khách ẩn danh";

                      if (customerName.startsWith("null null ")) {
                        const match = customerName.match(/\((.*?)\)/);
                        if (match) customerName = match[1];
                      }

                      return (
                        <TableRow key={booking.id}>
                          <TableCell className="font-medium">{booking.booking_number}</TableCell>
                          <TableCell>{customerName}</TableCell>
                          <TableCell>{booking.room}</TableCell>
                          <TableCell className="text-right text-muted-foreground">
                            {booking.check_in_date || "—"}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <EmptyState colSpan={4} message="Không có booking gần đây." />
                  )}
                </TableBody>
              </Table>
            </div>

            <Pagination
              totalItems={recentBookings.length}
              itemsPerPage={ITEMS_PER_PAGE}
              currentPage={bookingPage}
              onPageChange={setBookingPage}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle>Tổng quan hạng phòng</CardTitle>
                <CardDescription>Mô tả ngắn, giá đề xuất và số lượng theo từng loại.</CardDescription>
              </div>
              <Badge variant="outline">{roomTypesOverview.length} loại</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="px-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Loại phòng</TableHead>
                    <TableHead>Giá đề xuất</TableHead>
                    <TableHead className="text-right">Số phòng</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedRoomTypes.length > 0 ? (
                    paginatedRoomTypes.map((roomType) => (
                      <TableRow key={roomType.id}>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="font-medium">{roomType.name}</p>
                            <p className="max-w-xs truncate text-sm text-muted-foreground">
                              {roomType.description || "Không có mô tả"}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>{CURRENCY_FORMATTER.format(Number(roomType.base_price || 0))}</TableCell>
                        <TableCell className="text-right">
                          <Badge
                            variant={Number(roomType.room_count) > 0 ? "default" : "secondary"}
                            className={cn(Number(roomType.room_count) > 0 && "bg-chart-1/10 text-chart-1 hover:bg-chart-1/10")}
                          >
                            {roomType.room_count}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <EmptyState colSpan={3} message="Chưa có dữ liệu hạng phòng." />
                  )}
                </TableBody>
              </Table>
            </div>

            <Pagination
              totalItems={roomTypesOverview.length}
              itemsPerPage={ITEMS_PER_PAGE}
              currentPage={roomTypePage}
              onPageChange={setRoomTypePage}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
