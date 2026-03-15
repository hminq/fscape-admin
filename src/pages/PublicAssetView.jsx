import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { 
  Package, 
  Tag, 
  MapPin, 
  CircleNotch, 
  Info,
  ShieldCheck,
  Calendar
} from "@phosphor-icons/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export default function PublicAssetView() {
  const { id } = useParams();
  const [asset, setAsset] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAsset = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/assets/public/${id}`);
        setAsset(res.data.data);
      } catch (err) {
        console.error("Error fetching asset:", err);
        setError("Không tìm thấy thông tin tài sản này hoặc mã QR đã hết hạn.");
      } finally {
        setLoading(false);
      }
    };
    fetchAsset();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50">
        <CircleNotch className="size-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground animate-pulse font-medium">Đang tải thông tin tài sản...</p>
      </div>
    );
  }

  if (error || !asset) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 text-center">
        <div className="bg-destructive/10 p-4 rounded-full mb-4">
          <Info className="size-12 text-destructive" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Lỗi truy xuất</h2>
        <p className="text-muted-foreground max-w-xs">{error || "Tài sản không tồn tại."}</p>
      </div>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "AVAILABLE": return "bg-emerald-500/10 text-emerald-600 border-emerald-200";
      case "IN_USE": return "bg-blue-500/10 text-blue-600 border-blue-200";
      case "MAINTENANCE": return "bg-amber-500/10 text-amber-600 border-amber-200";
      default: return "bg-gray-500/10 text-gray-600 border-gray-200";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "AVAILABLE": return "Sẵn sàng";
      case "IN_USE": return "Đang sử dụng";
      case "MAINTENANCE": return "Bảo trì";
      default: return status;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-12 font-sans">
      {/* Header with Background Blur */}
      <div className="relative h-48 bg-primary overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-blue-600 shadow-inner" />
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:20px_20px]" />
        
        <div className="relative z-10 flex flex-col items-center justify-center h-full text-white px-6">
          <Package className="size-12 mb-2 opacity-80" />
          <h1 className="text-2xl font-bold tracking-tight">FScape Asset Info</h1>
          <p className="text-xs opacity-70 mt-1 uppercase tracking-widest font-semibold font-mono">Verified Integrity</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-md mx-auto -mt-10 px-4 space-y-4">
        {/* Asset Main Card */}
        <Card className="shadow-xl shadow-slate-200/50 border-white/50 overflow-hidden backdrop-blur-sm bg-white/95">
          <CardHeader className="pb-3 text-center border-b border-slate-100">
            <Badge variant="outline" className={`mb-3 py-1 px-3 self-center inline-flex gap-1.5 font-bold ${getStatusColor(asset.status)}`}>
              <div className={`size-2 rounded-full animate-pulse bg-current`} />
              {getStatusText(asset.status)}
            </Badge>
            <CardTitle className="text-2xl font-black text-slate-800 uppercase tracking-tight leading-tight">
              {asset.name}
            </CardTitle>
          </CardHeader>

          {asset.image_url && (
             <div className="w-full h-56 relative bg-slate-100">
                <img 
                  src={asset.image_url} 
                  alt={asset.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-3 right-3">
                   <div className="bg-black/40 backdrop-blur-md p-2 rounded-lg border border-white/20">
                      <ShieldCheck className="size-5 text-white" />
                   </div>
                </div>
             </div>
          )}

          <CardContent className="pt-6 space-y-6">
            <div className="grid grid-cols-1 gap-5">
              
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-orange-500/5 text-orange-600 border border-orange-100">
                  <Tag className="size-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Loại tài sản</p>
                  <p className="font-semibold text-slate-700">{asset.asset_type?.name || "Chưa phân loại"}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-blue-500/5 text-blue-600 border border-blue-100">
                  <MapPin className="size-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Vị trí hiện tại</p>
                  <p className="font-semibold text-slate-700">
                    {asset.room ? `Phòng ${asset.room.room_number}` : "Chưa bàn giao"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-purple-500/5 text-purple-600 border border-purple-100">
                  <Calendar className="size-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Ngày khởi tạo</p>
                  <p className="font-semibold text-slate-700">
                    {asset.createdAt || asset.created_at 
                      ? new Date(asset.createdAt || asset.created_at).toLocaleDateString('vi-VN') 
                      : "Không rõ"}
                  </p>
                </div>
              </div>

            </div>

            <div className="pt-4 border-t border-slate-100">
               <div className="p-4 rounded-2xl bg-slate-900 text-white flex justify-between items-center shadow-lg shadow-primary/20">
                  <div>
                    <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Giá trị gốc</p>
                    <p className="text-xl font-black">{Number(asset.price || 0).toLocaleString('vi-VN')} ₫</p>
                  </div>
                  <div className="bg-white/10 p-2 rounded-xl">
                    <ShieldCheck className="size-6" />
                  </div>
               </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer info box */}
        <div className="text-center py-4 px-2">
           <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
             Dữ liệu được xác thực bởi hệ thống quản lý bất động sản FScape. <br/> 
             Cung cấp thông tin tài sản chính xác qua mã QR thời gian thực.
           </p>
           <div className="mt-4 flex justify-center gap-4 grayscale opacity-40">
              <div className="h-6 w-20 bg-slate-200 rounded animate-pulse" />
              <div className="h-6 w-16 bg-slate-200 rounded animate-pulse" />
           </div>
        </div>
      </div>
    </div>
  );
}
