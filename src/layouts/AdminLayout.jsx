import { Outlet } from "react-router-dom";
import AppSidebar from "../components/AppSidebar";

export default function AdminLayout() {
  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar />
      <main className="flex-1 overflow-y-auto bg-muted/30 p-8">
        <Outlet />
      </main>
    </div>
  );
}
