import {
  House,
  Lock,
  Users,
  ChartLine,
  CurrencyDollar,
  Wrench,
  WarningCircle,
  CheckCircle,
  Clock,
} from "@phosphor-icons/react";
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

const stats = [
  { label: "Tổng số phòng", value: "48", change: "+2", icon: House, color: "bg-primary/10 text-primary" },
  { label: "Phòng đã thuê", value: "41", change: "+3", icon: Lock, color: "bg-blue-100 text-blue-600" },
  { label: "Doanh thu tháng", value: "52M đ", change: "+8.1%", icon: CurrencyDollar, color: "bg-red-100 text-red-600" },
  { label: "Cư dân hiện tại", value: "56", change: "+4", icon: Users, color: "bg-amber-100 text-amber-600" },
];

const bottomStats = [
  { label: "Tỉ lệ lấp đầy", value: "85.4%", icon: ChartLine, color: "bg-primary/10 text-primary" },
  { label: "Yêu cầu đang xử lý", value: "7", icon: Wrench, color: "bg-amber-100 text-amber-600" },
  { label: "Hợp đồng sắp hết hạn", value: "3", icon: WarningCircle, color: "bg-red-100 text-red-600" },
];

const recentRequests = [
  { id: 1, resident: "Nguyễn Văn An", room: "301", type: "Sửa chữa", desc: "Vòi nước bị rỉ", date: "06/03/2026", status: "pending" },
  { id: 2, resident: "Trần Thị Bình", room: "205", type: "Bảo trì", desc: "Điều hòa không mát", date: "05/03/2026", status: "in_progress" },
  { id: 3, resident: "Lê Minh Châu", room: "102", type: "Sửa chữa", desc: "Bóng đèn hỏng phòng tắm", date: "05/03/2026", status: "completed" },
  { id: 4, resident: "Phạm Quốc Đạt", room: "405", type: "Khác", desc: "Yêu cầu đổi phòng", date: "04/03/2026", status: "pending" },
  { id: 5, resident: "Hoàng Thị Em", room: "110", type: "Bảo trì", desc: "Khóa cửa bị kẹt", date: "04/03/2026", status: "in_progress" },
];

const roomOccupancy = [
  { floor: "Tầng 1", total: 12, occupied: 10 },
  { floor: "Tầng 2", total: 12, occupied: 11 },
  { floor: "Tầng 3", total: 12, occupied: 10 },
  { floor: "Tầng 4", total: 12, occupied: 10 },
];

const STATUS_MAP = {
  pending: { label: "Chờ xử lý", icon: Clock, class: "text-amber-600 bg-amber-50 border-amber-200" },
  in_progress: { label: "Đang xử lý", icon: Wrench, class: "text-blue-600 bg-blue-50 border-blue-200" },
  completed: { label: "Hoàn thành", icon: CheckCircle, class: "text-emerald-600 bg-emerald-50 border-emerald-200" },
};

function OccupancyBar({ floor, total, occupied }) {
  const pct = total > 0 ? (occupied / total) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm font-medium w-16 shrink-0">{floor}</span>
      <div className="flex-1 h-3 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-muted-foreground w-14 text-right">{occupied}/{total}</span>
    </div>
  );
}

export default function BuildingManagerHomePage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Header */}
      <div className="pt-1">
        <h1 className="text-2xl font-bold tracking-tight">Tổng quan tòa nhà</h1>
        <p className="text-sm text-muted-foreground">FScape Hòa Lạc 3 - Khu vực Hà Nội</p>
      </div>

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

      {/* Occupancy + Bottom stats */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <Card className="lg:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Tình trạng lấp đầy theo tầng</CardTitle>
            <p className="text-xs text-muted-foreground">Phòng đang có cư dân / tổng phòng</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {roomOccupancy.map((item) => (
              <OccupancyBar key={item.floor} {...item} />
            ))}
          </CardContent>
        </Card>

        <div className="lg:col-span-2 grid grid-cols-1 gap-4">
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

      {/* Recent Requests */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div>
            <CardTitle className="text-sm font-semibold">Yêu cầu gần đây</CardTitle>
            <p className="text-xs text-muted-foreground">Các yêu cầu bảo trì/sửa chữa mới nhất</p>
          </div>
          <a href="#" className="text-xs font-semibold text-primary hover:underline">Xem tất cả →</a>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cư dân</TableHead>
                <TableHead>Phòng</TableHead>
                <TableHead>Loại</TableHead>
                <TableHead>Mô tả</TableHead>
                <TableHead>Ngày gửi</TableHead>
                <TableHead>Trạng thái</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentRequests.map((r) => {
                const st = STATUS_MAP[r.status];
                return (
                  <TableRow key={r.id}>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <div className="flex items-center justify-center size-8 rounded-full bg-primary text-primary-foreground text-xs font-bold shrink-0">
                          {r.resident[0]}
                        </div>
                        <span className="font-medium text-sm">{r.resident}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-semibold">{r.room}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">{r.type}</TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{r.desc}</TableCell>
                    <TableCell className="text-sm">{r.date}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${st.class}`}>
                        <st.icon className="size-3" />
                        {st.label}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
