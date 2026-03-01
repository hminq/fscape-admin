import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    ArrowLeft,
    Pencil,
    Trash2,
    Calendar,
    Users,
    Maximize,
    Bed,
    Bath,
    Wifi,
    Wind,
    ShieldCheck,
    Coffee,
    Monitor,
    Tv,
    Utensils,
    Waves,
    Dumbbell,
    BookOpen,
    Bike,
    Video,
    LayoutDashboard,
    Clock,
    Home,
    MapPin,
    CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

/* ── Mock Data (Same as RoomsPage.jsx for consistency) ── */
const MOCK_ROOMS = [
    { id: 1, roomNumber: "A-301", building: "FScape Hà Nội", status: "available", type: "Phòng đơn", area: 18, capacity: 1, floor: 3, price: 4500000, image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&q=80" },
    { id: 2, roomNumber: "B-205", building: "FScape FPT", status: "occupied", type: "Phòng đôi", area: 25, capacity: 2, floor: 2, price: 5200000, image: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&q=80" },
    { id: 3, roomNumber: "C-102", building: "FScape TP.HCM", status: "occupied", type: "Studio", area: 35, capacity: 1, floor: 1, price: 6800000, image: "https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=600&q=80" },
    { id: 4, roomNumber: "A-405", building: "FScape Hà Nội", status: "available", type: "Phòng đơn", area: 20, capacity: 1, floor: 4, price: 4800000, image: "https://images.unsplash.com/photo-1540518614846-7eded433c457?w=600&q=80" },
    { id: 5, roomNumber: "C-308", building: "FScape TP.HCM", status: "available", type: "Phòng đôi", area: 28, capacity: 2, floor: 3, price: 5500000, image: "https://images.unsplash.com/photo-1505693314120-0d443867891c?w=600&q=80" },
    { id: 6, roomNumber: "D-201", building: "FScape Đà Nẵng", status: "maintenance", type: "Ký túc xá", area: 22, capacity: 2, floor: 2, price: 4200000, image: "https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?w=600&q=80" },
];

const AMENITIES_ICONS = {
    wifi: <Wifi className="size-4" />,
    ac: <Wind className="size-4" />,
    study_desk: <BookOpen className="size-4" />,
    chair: <Coffee className="size-4" />,
    wardrobe: <Home className="size-4" />,
    heating: <Wind className="size-4" />,
    window: <LayoutDashboard className="size-4" />,
    mirror: <Users className="size-4" />,
    kitchen: <Utensils className="size-4" />,
    laundry: <Waves className="size-4" />,
    gym: <Dumbbell className="size-4" />,
    study_room: <BookOpen className="size-4" />,
    common_area: <Users className="size-4" />,
    rooftop: <LayoutDashboard className="size-4" />,
    bike_storage: <Bike className="size-4" />,
    cinema: <Video className="size-4" />,
};

const STATUS_MAP = {
    available: { label: "Còn trống", variant: "default", color: "bg-success/15 text-success" },
    occupied: { label: "Đã thuê", variant: "secondary", color: "bg-primary/10 text-primary" },
    maintenance: { label: "Bảo trì", variant: "outline", color: "bg-warning/15 text-warning" },
};

export default function RoomDetailPage() {
    const { id } = useParams();
    console.log("RoomDetailPage ID param:", id);
    const navigate = useNavigate();
    const [room, setRoom] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Simulate fetching
        setLoading(true);
        setTimeout(() => {
            const found = MOCK_ROOMS.find(r => r.id === parseInt(id)) || MOCK_ROOMS[0];
            // Enrich with extra data for display
            setRoom({
                ...found,
                description: "Phòng được thiết kế hiện đại, đầy đủ ánh sáng tự nhiên. Không gian thoáng đãng phù hợp cho sinh viên tập trung học tập và nghỉ ngơi sau giờ học. Tòa nhà có an ninh 24/7 và khu vực để xe an toàn.",
                images: [
                    found.image,
                    "https://images.unsplash.com/photo-1522770179533-24471fcdba45?w=600&q=80",
                    "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&q=80",
                    "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=600&q=80",
                ],
                contractType: "Hợp đồng 12 tháng",
                minStay: "6 tháng",
                availableFrom: "2024-03-15",
                bedType: "Giường đơn",
                bathroomType: "Khép kín",
                floor: found.floor || 3,
                amenities: ["wifi", "ac", "study_desk", "wardrobe", "kitchen", "laundry", "gym"],
                history: [
                    { date: "2024-02-01", action: "Thay mới điều hòa", user: "Kỹ thuật Hùng" },
                    { date: "2024-01-15", action: "Kiểm tra định kỳ", user: "Quản lý Trang" },
                    { date: "2023-12-10", action: "Sửa vòi nước bồn tắm", user: "Kỹ thuật Nam" },
                ]
            });
            setLoading(false);
        }, 500);
    }, [id]);

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
    );

    if (!room) return <div className="text-center py-20 font-bold">Không tìm thấy thông tin phòng!</div>;

    const statusCfg = STATUS_MAP[room.status] || STATUS_MAP.available;

    return (
        <div className="mx-auto max-w-6xl space-y-8 pb-20 animate-in fade-in duration-500">
            {/* Header / Actions */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate("/rooms")}
                        className="rounded-full bg-background border shadow-sm hover:translate-x-[-2px] transition-transform"
                    >
                        <ArrowLeft className="size-4" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-extrabold tracking-tight">{room.roomNumber}</h1>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusCfg.color}`}>
                                {statusCfg.label}
                            </span>
                        </div>
                        <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
                            <MapPin className="size-3.5" /> {room.building} • Tầng {room.floor}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" className="gap-2 shadow-sm font-medium">
                        <Pencil className="size-4" /> Chỉnh sửa
                    </Button>
                    <Button variant="destructive" className="gap-2 shadow-sm font-medium">
                        <Trash2 className="size-4" /> Xóa phòng
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Gallery & Description */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Gallery */}
                    <div className="space-y-4">
                        <div className="aspect-[16/9] rounded-2xl overflow-hidden border border-border shadow-md transition-shadow hover:shadow-lg">
                            <img src={room.images[0]} alt="Room main" className="w-full h-full object-cover" />
                        </div>
                        <div className="grid grid-cols-4 gap-4">
                            {room.images.slice(1).map((img, i) => (
                                <div key={i} className="aspect-square rounded-xl overflow-hidden border border-border/60 cursor-pointer hover:border-primary/50 transition-colors">
                                    <img src={img} alt={`Room ${i}`} className="w-full h-full object-cover" />
                                </div>
                            ))}
                            <div className="aspect-square rounded-xl bg-muted flex flex-col items-center justify-center text-muted-foreground border border-border/40 border-dashed">
                                <Plus className="size-6 mb-1" />
                                <span className="text-[10px] font-bold uppercase tracking-wider">Thêm ảnh</span>
                            </div>
                        </div>
                    </div>

                    {/* Content Tabs */}
                    <Tabs defaultValue="details" className="w-full">
                        <TabsList className="grid w-full grid-cols-3 bg-muted/30 p-1 rounded-xl">
                            <TabsTrigger value="details" className="rounded-lg font-bold">Chi tiết</TabsTrigger>
                            <TabsTrigger value="amenities" className="rounded-lg font-bold">Tiện nghi</TabsTrigger>
                            <TabsTrigger value="history" className="rounded-lg font-bold">Lịch sử</TabsTrigger>
                        </TabsList>

                        <TabsContent value="details" className="mt-6 space-y-6 animate-in slide-in-from-bottom-2 duration-300">
                            <Card className="border-none shadow-sm bg-muted/10">
                                <CardContent className="pt-6">
                                    <h3 className="text-lg font-bold mb-3">Mô tả</h3>
                                    <p className="text-muted-foreground leading-relaxed">
                                        {room.description}
                                    </p>
                                </CardContent>
                            </Card>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Card className="p-4 flex items-center gap-4 bg-muted/5 border-none shadow-none">
                                    <div className="size-12 rounded-xl bg-background flex items-center justify-center border border-border shadow-sm">
                                        <Calendar className="size-5 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Hợp đồng</p>
                                        <p className="font-bold">{room.contractType}</p>
                                    </div>
                                </Card>
                                <Card className="p-4 flex items-center gap-4 bg-muted/5 border-none shadow-none">
                                    <div className="size-12 rounded-xl bg-background flex items-center justify-center border border-border shadow-sm">
                                        <Clock className="size-5 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Ngày trống</p>
                                        <p className="font-bold">{room.availableFrom}</p>
                                    </div>
                                </Card>
                            </div>
                        </TabsContent>

                        <TabsContent value="amenities" className="mt-6 animate-in slide-in-from-bottom-2 duration-300">
                            <Card className="border-border/60 shadow-sm">
                                <CardContent className="pt-6 grid grid-cols-2 sm:grid-cols-3 gap-6">
                                    {room.amenities.map(id => (
                                        <div key={id} className="flex items-center gap-3">
                                            <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                                {AMENITIES_ICONS[id] || <CheckCircle2 className="size-4" />}
                                            </div>
                                            <span className="text-sm font-semibold capitalize">{id.replace("_", " ")}</span>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="history" className="mt-6 animate-in slide-in-from-bottom-2 duration-300">
                            <div className="space-y-4">
                                {room.history.map((h, i) => (
                                    <div key={i} className="flex items-start gap-4 p-4 rounded-xl border border-border/40 bg-card/50">
                                        <div className="size-8 rounded-full bg-primary/5 flex items-center justify-center text-primary shrink-0 mt-0.5">
                                            <CheckCircle2 className="size-4" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-bold">{h.action}</p>
                                            <div className="flex items-center justify-between mt-1">
                                                <p className="text-xs text-muted-foreground">{h.user}</p>
                                                <p className="text-xs text-muted-foreground font-medium">{h.date}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>

                {/* Right Column: Pricing & Specs */}
                <div className="space-y-6">
                    {/* Price Card */}
                    <Card className="border-primary/20 bg-primary/5 shadow-xl/10 overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-3 opacity-10">
                            <KeyRound className="size-24 rotate-12" />
                        </div>
                        <CardHeader className="pb-0">
                            <p className="text-xs font-bold text-primary uppercase tracking-[0.15em]">Giá thuê hàng tháng</p>
                        </CardHeader>
                        <CardContent className="pt-2 pb-6">
                            <div className="flex items-baseline gap-1.5">
                                <h3 className="text-4xl font-extrabold text-primary">{(room.price || 0).toLocaleString("vi-VN")}</h3>
                                <span className="text-sm font-bold text-primary/70">đ/tháng</span>
                            </div>
                            <Button className="w-full mt-6 bg-primary font-bold shadow-lg shadow-primary/20 py-6 text-base">
                                Thuê ngay
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Stats Grid */}
                    <Card className="shadow-sm border-border/40">
                        <CardHeader className="pb-2 border-b border-border/20">
                            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Thông số phòng</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="size-9 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600">
                                        <Maximize className="size-5" />
                                    </div>
                                    <span className="text-sm font-medium text-muted-foreground">Diện tích</span>
                                </div>
                                <span className="font-bold">{room.area} m²</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="size-9 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                                        <Users className="size-5" />
                                    </div>
                                    <span className="text-sm font-medium text-muted-foreground">Sức chứa</span>
                                </div>
                                <span className="font-bold">{room.capacity} người</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="size-9 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600">
                                        <Bed className="size-5" />
                                    </div>
                                    <span className="text-sm font-medium text-muted-foreground">Loại giường</span>
                                </div>
                                <span className="font-bold">{room.bedType}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="size-9 rounded-lg bg-teal-100 flex items-center justify-center text-teal-600">
                                        <Bath className="size-5" />
                                    </div>
                                    <span className="text-sm font-medium text-muted-foreground">Phòng tắm</span>
                                </div>
                                <span className="font-bold">{room.bathroomType}</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Host/Manager Card (Optional extra touch) */}
                    <Card className="shadow-sm border-border/40 bg-muted/5">
                        <CardContent className="p-5 flex items-center gap-4">
                            <div className="size-12 rounded-full overflow-hidden bg-muted border-2 border-primary/20">
                                <img src="https://i.pravatar.cc/150?u=manager" alt="Manager" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Quản lý tòa nhà</p>
                                <p className="text-sm font-extrabold">Nguyễn Hoàng Minh</p>
                            </div>
                            <Button variant="ghost" size="icon" className="ml-auto rounded-full bg-primary/10 text-primary">
                                <Coffee className="size-4" />
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

function KeyRound(props) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M2.14 20.16 3.5 18.8a2.5 2.5 0 0 0 0-3.53l-1.07-1.07" />
            <path d="M5.5 16.5 8 14" />
            <circle cx="15.5" cy="8.5" r="5.5" />
            <path d="M12.5 11.5 10 14" />
            <path d="M10 14a2 2 0 0 1 0 2.83l-1.5 1.5a2 2 0 0 1-2.83 0L4.5 17.5" />
        </svg>
    );
}
