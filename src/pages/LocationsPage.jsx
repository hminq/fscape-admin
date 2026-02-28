import { MapPin } from "lucide-react";

export default function LocationsPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="pt-2">
        <h1 className="text-2xl font-bold tracking-tight">Khu vực</h1>
        <p className="text-sm text-muted-foreground">Quản lý các khu vực hoạt động của FScape</p>
      </div>
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <MapPin className="size-12 mb-4 opacity-30" />
        <p className="text-lg font-medium">Trang đang được phát triển</p>
        <p className="text-sm mt-1">Chức năng quản lý khu vực sẽ sớm được cập nhật.</p>
      </div>
    </div>
  );
}
