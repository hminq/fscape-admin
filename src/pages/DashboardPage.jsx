import { useEffect, useState } from "react";
import { api } from "@/lib/apiClient";
import {
  House,
  Lock,
  CurrencyDollar,
  Briefcase,
  CheckCircle,
  CaretLeft,
  CaretRight,
} from "@phosphor-icons/react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Custom Pagination Component
function Pagination({ totalItems, itemsPerPage, currentPage, onPageChange }) {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between px-4 py-3">
      <div className="text-sm font-medium text-muted-foreground">
        Hiển thị {Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)} - {Math.min(currentPage * itemsPerPage, totalItems)} trong {totalItems}
      </div>
      <div className="flex items-center space-x-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-1.5 rounded-md border bg-background text-sm font-medium shadow-sm hover:bg-muted disabled:opacity-50 transition-colors"
        >
          <CaretLeft weight="bold" />
        </button>
        <span className="text-sm font-medium px-3 shadow-sm border py-1 rounded-md bg-background">
          {currentPage} / {totalPages}
        </span>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-1.5 rounded-md border bg-background text-sm font-medium shadow-sm hover:bg-muted disabled:opacity-50 transition-colors"
        >
          <CaretRight weight="bold" />
        </button>
      </div>
    </div>
  );
}

// Donut Chart - Bigger and Clearer
function DonutChart({ data, centerText, centerSubtext }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  let cumulativePercent = 0;

  if (total === 0) return <div className="h-64 flex items-center justify-center text-muted-foreground">Chưa có dữ liệu</div>;

  const gradientStops = data.map(item => {
    const percent = (item.value / total) * 100;
    const stop = `${item.color} ${cumulativePercent}% ${cumulativePercent + percent}%`;
    cumulativePercent += percent;
    return stop;
  }).join(', ');

  return (
    <div className="flex flex-col md:flex-row items-center gap-8 justify-center w-full px-6">
      <div
        className="relative w-56 h-56 rounded-full shadow-md shrink-0"
        style={{ background: `conic-gradient(${gradientStops})` }}
      >
        <div className="absolute inset-4 bg-card rounded-full flex flex-col items-center justify-center shadow-inner">
          <span className="text-4xl font-extrabold text-foreground drop-shadow-sm">{centerText}</span>
          {centerSubtext && <span className="text-sm font-medium text-muted-foreground mt-1 uppercase tracking-wider">{centerSubtext}</span>}
        </div>
      </div>
      <div className="flex flex-col gap-4 w-full md:w-auto">
        {data.map((item, i) => (
          <div key={i} className="flex justify-between items-center gap-6 p-4 rounded-xl border bg-muted/20 hover:bg-muted/50 transition-colors shadow-sm">
            <div className="flex items-center gap-3">
              <span className="w-5 h-5 rounded-md shadow-sm" style={{ backgroundColor: item.color }}></span>
              <span className="text-base font-semibold text-muted-foreground">{item.label}</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="font-bold text-xl">{item.value}</span>
              <span className="text-sm font-medium text-muted-foreground">{((item.value / total) * 100).toFixed(1)}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Bar Chart - Larger, better spacing, tooltips via titles
function BarChart({ data }) {
  if (!data || data.length === 0) return null;
  const W = 800, H = 350, pad = { top: 40, right: 30, bottom: 80, left: 50 };
  const innerW = W - pad.left - pad.right;
  const innerH = H - pad.top - pad.bottom;
  const maxVal = Math.max(...data.map((d) => d.value)) || 1;
  const barW = Math.min((innerW / data.length) * 0.5, 60);
  const gap = innerW / data.length;

  return (
    <div className="w-full overflow-x-auto pb-4">
      <svg viewBox={`0 0 ${W} ${H}`} className="min-w-[700px] w-full h-auto">
        <defs>
          <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#2563eb" />
          </linearGradient>
          <linearGradient id="barHoverGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#60a5fa" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
        </defs>
        <g transform={`translate(${pad.left},${pad.top})`}>
          {/* Horizontal grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
            const y = innerH * (1 - ratio);
            return (
              <g key={`grid-${i}`}>
                <line x1={0} y1={y} x2={innerW} y2={y} stroke="#f1f5f9" strokeWidth="1.5" />
                <text x={-10} y={y + 4} fontSize="13" fill="#94a3b8" textAnchor="end" fontWeight="600">
                  {Math.round(maxVal * ratio)}
                </text>
              </g>
            )
          })}

          {data.map((d, i) => {
            const barH = (d.value / maxVal) * innerH;
            const x = i * gap + (gap - barW) / 2;
            const y = innerH - barH;
            return (
              <g key={i} className="group cursor-pointer">
                <title>{d.label}: {d.value} phòng</title>
                <rect
                  x={x} y={y} width={barW} height={barH}
                  fill="url(#barGrad)"
                  rx="6"
                  className="opacity-90 group-hover:fill-[url(#barHoverGrad)] group-hover:opacity-100 transition-all duration-300 transform group-hover:-translate-y-1"
                />
                <text x={x + barW / 2} y={innerH + 25} fontSize="13" fill="#64748b" textAnchor="middle" transform={`rotate(15, ${x + barW / 2}, ${innerH + 20})`} fontWeight="600">
                  {d.label.length > 20 ? d.label.substring(0, 18) + "..." : d.label}
                </text>
                <text x={x + barW / 2} y={y - 8} fontSize="15" fill="#0f172a" fontWeight="800" textAnchor="middle" className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  {d.value}
                </text>
              </g>
            );
          })}
          <line x1={0} y1={innerH} x2={innerW} y2={innerH} stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" />
        </g>
      </svg>
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Pagination states
  const [bookingPage, setBookingPage] = useState(1);
  const [roomTypePage, setRoomTypePage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    api.get("/api/dashboard/stats")
      .then(res => {
        setData(res.data);
      })
      .catch(err => {
        console.error("Failed to fetch dashboard stats", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] space-y-4">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        <p className="text-lg font-medium text-muted-foreground animate-pulse">Đang chuẩn bị dữ liệu...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] space-y-2">
        <div className="p-4 bg-red-100 text-red-600 rounded-full mb-2">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        </div>
        <p className="text-xl font-bold text-red-600">Lỗi kết nối</p>
        <p className="text-muted-foreground text-center max-w-md">Không thể tải dữ liệu từ API. Vui lòng kiểm tra lại kết nối mạng hoặc server.</p>
      </div>
    );
  }

  const {
    total_rooms = 0,
    occupied_rooms = 0,
    recent_revenue = 0,
    room_type_distribution = [],
    room_types_overview = [],
    recent_bookings = [],
    employee_stats = { total: 0, active: 0, inactive: 0 }
  } = data;

  const vacant_rooms = total_rooms - occupied_rooms;
  const occupancyRate = total_rooms > 0 ? ((occupied_rooms / total_rooms) * 100).toFixed(1) : 0;

  const topStats = [
    { label: "Tổng số phòng", value: total_rooms, icon: House, color: "bg-blue-100 text-blue-600", borderColor: "border-blue-200" },
    { label: "Phòng đang thuê", value: occupied_rooms, icon: Lock, color: "bg-emerald-100 text-emerald-600", borderColor: "border-emerald-200" },
    { label: "Tỉ lệ lấp đầy", value: `${occupancyRate}%`, icon: CheckCircle, color: "bg-purple-100 text-purple-600", borderColor: "border-purple-200" },
    { label: "Doanh thu", value: new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(recent_revenue), icon: CurrencyDollar, color: "bg-orange-100 text-orange-600", borderColor: "border-orange-200" },
  ];

  const occupancyChartData = [
    { label: "Đã thuê", value: occupied_rooms, color: "#10b981" },
    { label: "Trống", value: Math.max(0, vacant_rooms), color: "#f1f5f9" }
  ];

  const roomTypeBarData = room_type_distribution.map(rt => ({
    label: rt.name,
    value: rt.count
  })).sort((a, b) => b.value - a.value);

  // Pagination logic
  const paginatedBookings = recent_bookings.slice(
    (bookingPage - 1) * itemsPerPage,
    bookingPage * itemsPerPage
  );

  const paginatedRoomTypes = room_types_overview.slice(
    (roomTypePage - 1) * itemsPerPage,
    roomTypePage * itemsPerPage
  );

  return (
    <div className="mx-auto max-w-[1400px] space-y-8 pb-16 transition-all duration-300 w-full px-2">

      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 rounded-2xl border-l-[6px] border-l-primary shadow-sm">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Màn hình chính</h1>
          <p className="text-muted-foreground mt-2 font-medium text-sm md:text-base">Số liệu vận hành, doanh thu & tình trạng lấp đầy</p>
        </div>
        <div className="flex items-center gap-4">
          {/* Employee Stats Block */}
          <div className="flex bg-card items-center gap-5 p-4 px-6 rounded-xl border shadow-sm hover:shadow-md transition-shadow">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
              <Briefcase size={28} weight="fill" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-1">Nhân sự</span>
              <div className="flex items-baseline gap-4">
                <span className="text-2xl font-black">{employee_stats.total}</span>
                <div className="flex gap-3 text-sm font-semibold">
                  <span className="text-emerald-600 flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500"></span>{employee_stats.active}</span>
                  <span className="text-rose-500 flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-500"></span>{employee_stats.inactive}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {topStats.map((s, idx) => (
          <Card key={idx} className={`border ${s.borderColor} hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden group rounded-2xl`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground font-bold uppercase tracking-widest">{s.label}</p>
                  <p className="text-3xl font-black tracking-tight group-hover:text-primary transition-colors">{s.value}</p>
                </div>
                <div className={`flex items-center justify-center size-16 rounded-2xl shadow-sm ${s.color}`}>
                  <s.icon className="size-8" weight="duotone" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Occupancy Donut */}
        <Card className="flex flex-col shadow-sm hover:shadow-md transition-shadow border-t-[6px] border-t-primary rounded-2xl">
          <CardHeader className="pb-6">
            <CardTitle className="text-xl font-bold">Lấp đầy phòng</CardTitle>
            <CardDescription className="text-base font-medium">Tỉ lệ phòng đang cho thuê hiện tại</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex items-center justify-center pb-8">
            <DonutChart
              data={occupancyChartData}
              centerText={occupancyRate + "%"}
              centerSubtext="Lấp đầy"
            />
          </CardContent>
        </Card>

        {/* Room Types Bar */}
        <Card className="xl:col-span-2 flex flex-col shadow-sm hover:shadow-md transition-shadow border-t-[6px] border-t-blue-500 rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl font-bold">Phân bổ Mẫu Phòng</CardTitle>
            <CardDescription className="text-base font-medium">Thống kê số lượng phòng theo từng hạng mục</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex items-end justify-center pt-8 pr-6">
            <BarChart data={roomTypeBarData} />
          </CardContent>
        </Card>
      </div>

      {/* Bottom Area: Large Data Tables */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">

        {/* Recent Bookings */}
        <Card className="shadow-sm hover:shadow-md transition-shadow flex flex-col rounded-2xl overflow-hidden">
          <CardHeader className="py-5 border-b bg-muted/10">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold">Booking Gần Đây</CardTitle>
              </div>
              <Badge variant="default" className="text-sm px-3 py-1 shadow-sm font-semibold">Mới nhất</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0 flex-1 flex flex-col">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead className="w-[140px] font-bold text-sm">Mã BK</TableHead>
                    <TableHead className="font-bold text-sm">Khách hàng</TableHead>
                    <TableHead className="font-bold text-sm">Phòng</TableHead>
                    <TableHead className="text-right font-bold text-sm">Check-in</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedBookings.length > 0 ? (
                    paginatedBookings.map((b) => {
                      let customerName = b.customer || "Khách ẩn danh";
                      if (customerName.startsWith("null null ")) {
                        const match = customerName.match(/\((.*?)\)/);
                        if (match) customerName = match[1];
                      }
                      return (
                        <TableRow key={b.id} className="cursor-pointer hover:bg-muted/50 transition-colors h-[72px]">
                          <TableCell className="font-bold text-sm text-primary">
                            <span className="bg-primary/10 px-2.5 py-1.5 rounded-lg">{b.booking_number.split('-').slice(0, 2).join('-')}</span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm font-bold text-foreground/90">{customerName.length > 30 ? customerName.substring(0, 30) + '...' : customerName}</span>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-bold text-xs shadow-sm bg-background border-border/80 px-2 py-1">
                              {b.room.replace('FScape ', '')}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right text-sm font-bold text-muted-foreground">
                            {b.check_in_date}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="h-48 text-center text-muted-foreground text-base">Không có booking mới</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            {/* Pagination Box */}
            <div className="border-t bg-muted/10 mt-auto">
              <Pagination
                totalItems={recent_bookings.length}
                itemsPerPage={itemsPerPage}
                currentPage={bookingPage}
                onPageChange={setBookingPage}
              />
            </div>
          </CardContent>
        </Card>

        {/* Room Types Overview Table */}
        <Card className="shadow-sm hover:shadow-md transition-shadow flex flex-col rounded-2xl overflow-hidden">
          <CardHeader className="py-5 border-b bg-muted/10">
            <CardTitle className="text-xl font-bold">Danh sách Hạng Phòng</CardTitle>
          </CardHeader>
          <CardContent className="p-0 flex-1 flex flex-col">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead className="font-bold text-sm">Loại phòng</TableHead>
                    <TableHead className="font-bold text-sm">Giá đề xuất</TableHead>
                    <TableHead className="text-right font-bold text-sm">Tồn dư</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedRoomTypes.length > 0 ? (
                    paginatedRoomTypes.map((rt) => (
                      <TableRow key={rt.id} className="hover:bg-muted/50 transition-colors h-[72px]">
                        <TableCell>
                          <div className="font-extrabold text-sm text-foreground/90">{rt.name}</div>
                          <div className="text-xs font-medium text-muted-foreground mt-1.5 max-w-[220px] truncate">{rt.description || 'Không có mô tả'}</div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm font-black text-emerald-600 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-100">
                            {new Intl.NumberFormat('vi-VN').format(Number(rt.base_price))} đ
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant={Number(rt.room_count) > 0 ? "default" : "secondary"} className="text-sm px-3.5 py-1.5 shadow-sm font-bold">
                            {rt.room_count}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="h-48 text-center text-muted-foreground text-base">Chưa có thông tin hạng phòng</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            {/* Pagination Box */}
            <div className="border-t bg-muted/10 mt-auto">
              <Pagination
                totalItems={room_types_overview.length}
                itemsPerPage={itemsPerPage}
                currentPage={roomTypePage}
                onPageChange={setRoomTypePage}
              />
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
