import {
  Users,
  DollarSign,
  Activity,
  TrendingUp,
  ClipboardList,
  Bell,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { useAuth } from "../contexts/AuthContext";

const stats = [
  { title: "Tổng người dùng", value: "1.234", icon: Users, trend: "+12%" },
  { title: "Doanh thu", value: "12.345.000₫", icon: DollarSign, trend: "+8,2%" },
  { title: "Đang hoạt động", value: "42", icon: Activity, trend: "+3" },
  { title: "Tăng trưởng", value: "+12,5%", icon: TrendingUp, trend: "so với tháng trước" },
];

const quickActions = [
  {
    icon: ClipboardList,
    title: "Hoạt động gần đây",
    description: "3 đăng ký mới hôm nay",
    color: "bg-amber-100 text-amber-700",
  },
  {
    icon: Bell,
    title: "Thông báo",
    description: "2 yêu cầu chờ duyệt",
    color: "bg-blue-100 text-blue-700",
  },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const firstName = user.name?.split(" ")[0] || "Admin";

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      {/* Welcome header */}
      <div className="space-y-1 pt-4">
        <h1 className="text-4xl font-bold tracking-tight">
          Xin chào, {firstName}!
        </h1>
        <p className="text-lg text-muted-foreground">
          Hôm nay bạn cần gì?
        </p>
      </div>

      {/* Quick action cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        {quickActions.map((action) => (
          <Card
            key={action.title}
            className="cursor-pointer transition-shadow hover:shadow-md"
          >
            <CardContent className="flex items-start gap-4 pt-6">
              <div className={`rounded-lg p-2.5 ${action.color}`}>
                <action.icon className="size-5" />
              </div>
              <div>
                <p className="font-semibold">{action.title}</p>
                <p className="text-sm text-muted-foreground">
                  {action.description}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Stat cards */}
      <div>
        <h2 className="mb-4 text-sm font-medium text-muted-foreground">
          Tổng quan
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <stat.icon className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {stat.trend}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
