import {
  Home,
  Lock,
  Users,
  CalendarDays,
  Activity,
  DollarSign,
  UserPlus,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const revenueData = [150, 162, 155, 170, 178, 192];
const months = ["T1", "T2", "T3", "T4", "T5", "T6"];

const roomTypes = [
  { label: "Đơn", value: 45 },
  { label: "Đôi", value: 38 },
  { label: "Studio", value: 22 },
  { label: "KTX", value: 65 },
];

const bookings = [
  { id: 1, name: "Nguyễn Văn An", room: "A-301", school: "ĐH Quốc gia Hà Nội", date: "15/02/2026", price: "4.500.000 đ", status: "confirmed" },
  { id: 2, name: "Trần Thị Bình", room: "B-205", school: "ĐH FPT", date: "14/02/2026", price: "5.200.000 đ", status: "pending" },
  { id: 3, name: "Lê Minh Châu", room: "C-102", school: "RMIT Việt Nam", date: "14/02/2026", price: "6.800.000 đ", status: "confirmed" },
  { id: 4, name: "Phạm Quốc Đạt", room: "A-405", school: "ĐH Bách Khoa HN", date: "13/02/2026", price: "4.800.000 đ", status: "confirmed" },
];

const stats = [
  { label: "Tổng số phòng", value: "170", change: "+8.2%", icon: Home, color: "bg-primary/10 text-primary" },
  { label: "Phòng đã thuê", value: "142", change: "+12.5%", icon: Lock, color: "bg-blue-100 text-blue-600" },
  { label: "Doanh thu tháng", value: "192M đ", change: "+15.3%", icon: DollarSign, color: "bg-red-100 text-red-600" },
  { label: "Tổng sinh viên", value: "168", change: "+6.7%", icon: Users, color: "bg-amber-100 text-amber-600" },
];

const bottomStats = [
  { label: "Tỉ lệ lấp đầy", value: "83.5%", icon: Activity, color: "bg-primary/10 text-primary" },
  { label: "Doanh thu TB/phòng", value: "1.35M đ", icon: DollarSign, color: "bg-blue-100 text-blue-600" },
  { label: "SV mới tháng này", value: "24", icon: UserPlus, color: "bg-amber-100 text-amber-600" },
];

function LineChart({ data, labels }) {
  const W = 500, H = 180, pad = { top: 20, right: 20, bottom: 30, left: 40 };
  const innerW = W - pad.left - pad.right;
  const innerH = H - pad.top - pad.bottom;
  const minVal = Math.min(...data) - 10;
  const maxVal = Math.max(...data) + 10;
  const xStep = innerW / (data.length - 1);
  const yScale = (v) => innerH - ((v - minVal) / (maxVal - minVal)) * innerH;
  const points = data.map((v, i) => ({ x: i * xStep, y: yScale(v) }));
  const polyline = points.map((p) => `${p.x},${p.y}`).join(" ");
  const areaPath = `M${points.map((p) => `${p.x},${p.y}`).join("L")}L${points.at(-1).x},${innerH}L0,${innerH}Z`;
  const yTicks = 4;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
      <defs>
        <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="oklch(0.214 0.065 253.813)" stopOpacity="0.2" />
          <stop offset="100%" stopColor="oklch(0.214 0.065 253.813)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <g transform={`translate(${pad.left},${pad.top})`}>
        {Array.from({ length: yTicks + 1 }, (_, i) => {
          const y = (i / yTicks) * innerH;
          const val = Math.round(maxVal - (i / yTicks) * (maxVal - minVal));
          return (
            <g key={i}>
              <line x1={0} y1={y} x2={innerW} y2={y} stroke="#f0f0f0" strokeWidth="1" />
              <text x={-6} y={y + 4} fontSize="10" fill="#999" textAnchor="end">{val}M</text>
            </g>
          );
        })}
        <path d={areaPath} fill="url(#lineGrad)" />
        <polyline points={polyline} fill="none" stroke="oklch(0.214 0.065 253.813)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="4" fill="oklch(0.214 0.065 253.813)" stroke="white" strokeWidth="2" />
        ))}
        {labels.map((l, i) => (
          <text key={i} x={i * xStep} y={innerH + 20} fontSize="11" fill="#aaa" textAnchor="middle">{l}</text>
        ))}
      </g>
    </svg>
  );
}

function BarChart({ data }) {
  const W = 320, H = 180, pad = { top: 20, right: 20, bottom: 30, left: 30 };
  const innerW = W - pad.left - pad.right;
  const innerH = H - pad.top - pad.bottom;
  const maxVal = Math.max(...data.map((d) => d.value)) + 10;
  const barW = (innerW / data.length) * 0.55;
  const gap = innerW / data.length;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
      <g transform={`translate(${pad.left},${pad.top})`}>
        {data.map((d, i) => {
          const barH = (d.value / maxVal) * innerH;
          const x = i * gap + (gap - barW) / 2;
          const y = innerH - barH;
          return (
            <g key={i}>
              <rect x={x} y={y} width={barW} height={barH} fill="oklch(0.214 0.065 253.813)" rx="4" opacity="0.85" />
              <text x={x + barW / 2} y={innerH + 18} fontSize="10" fill="#aaa" textAnchor="middle">{d.label}</text>
              <text x={x + barW / 2} y={y - 5} fontSize="10" fill="#555" textAnchor="middle">{d.value}</text>
            </g>
          );
        })}
        <line x1={0} y1={innerH} x2={innerW} y2={innerH} stroke="#eee" strokeWidth="1" />
      </g>
    </svg>
  );
}

export default function DashboardPage() {

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="flex items-center justify-between pt-5 pb-5">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-medium">{s.label}</p>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs font-semibold text-primary">↑ {s.change} <span className="text-muted-foreground font-normal">so với tháng trước</span></p>
              </div>
              <div className={`flex items-center justify-center size-11 rounded-xl ${s.color}`}>
                <s.icon className="size-5" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <Card className="lg:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Doanh thu 6 tháng gần đây</CardTitle>
            <p className="text-xs text-muted-foreground">Đơn vị: Triệu đồng</p>
          </CardHeader>
          <CardContent>
            <LineChart data={revenueData} labels={months} />
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Phân bố loại phòng</CardTitle>
            <p className="text-xs text-muted-foreground">Tổng quan các loại phòng hiện có</p>
          </CardHeader>
          <CardContent>
            <BarChart data={roomTypes} />
          </CardContent>
        </Card>
      </div>

      {/* Recent Bookings */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div>
            <CardTitle className="text-sm font-semibold">Đặt phòng gần đây</CardTitle>
            <p className="text-xs text-muted-foreground">Các booking mới nhất trong hệ thống</p>
          </div>
          <a href="#" className="text-xs font-semibold text-primary hover:underline">Xem tất cả →</a>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sinh viên</TableHead>
                <TableHead>Phòng</TableHead>
                <TableHead>Trường</TableHead>
                <TableHead>Ngày đặt</TableHead>
                <TableHead>Giá</TableHead>
                <TableHead>Trạng thái</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings.map((b) => (
                <TableRow key={b.id}>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <div className="flex items-center justify-center size-8 rounded-full bg-primary text-primary-foreground text-xs font-bold shrink-0">
                        {b.name[0]}
                      </div>
                      <span className="font-medium text-sm">{b.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="font-semibold">{b.room}</Badge>
                  </TableCell>
                  <TableCell className="text-sm">{b.school}</TableCell>
                  <TableCell className="text-sm">{b.date}</TableCell>
                  <TableCell className="text-sm font-semibold">{b.price}</TableCell>
                  <TableCell>
                    <Badge variant={b.status === "confirmed" ? "default" : "outline"}>
                      {b.status === "confirmed" ? "Đã xác nhận" : "Chờ xử lý"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Bottom Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {bottomStats.map((s) => (
          <Card key={s.label}>
            <CardContent className="flex items-center gap-4 pt-5 pb-5">
              <div className={`flex items-center justify-center size-12 rounded-xl ${s.color}`}>
                <s.icon className="size-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-xl font-bold">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
