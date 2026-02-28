import { GraduationCap } from "lucide-react";

export default function UniversitiesPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="pt-2">
        <h1 className="text-2xl font-bold tracking-tight">Đại học</h1>
        <p className="text-sm text-muted-foreground">Quản lý các trường đại học đối tác của FScape</p>
      </div>
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <GraduationCap className="size-12 mb-4 opacity-30" />
        <p className="text-lg font-medium">Trang đang được phát triển</p>
        <p className="text-sm mt-1">Chức năng quản lý đại học sẽ sớm được cập nhật.</p>
      </div>
    </div>
  );
}
