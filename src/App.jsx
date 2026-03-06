import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import RoleRoute from "./components/RoleRoute";
import AdminLayout from "./layouts/AdminLayout";
import LoginPage from "./pages/LoginPage";
import ForbiddenPage from "./pages/ForbiddenPage";
import DashboardPage from "./pages/DashboardPage";
import LocationsPage from "./pages/LocationsPage";
import UniversitiesPage from "./pages/UniversitiesPage";
import BuildingsPage from "./pages/BuildingsPage";
import BuildingStaffPage from "./pages/BuildingStaffPage";
import CreateBuildingPage from "./pages/CreateBuildingPage";
import RoomsPage from "./pages/RoomsPage";
import CreateRoomPage from "./pages/CreateRoomPage";
import EditRoomPage from "./pages/EditRoomPage";
import RoomTypesPage from "./pages/RoomTypesPage";
import AssetsPage from "./pages/AssetsPage";
import AssetTypesPage from "./pages/AssetTypesPage";
import AccountsPage from "./pages/AccountsPage";
import FacilitiesPage from "./pages/FacilitiesPage";

import CreateAssetPage from "./pages/CreateAssetPage";
import RoomDetailPage from "./pages/RoomDetailPage";
import ContractTemplatesPage from "./pages/ContractTemplatesPage";
import ContractTemplateEditorPage from "./pages/ContractTemplateEditorPage";
import RequestsPage from "./pages/RequestsPage";
import AuditLogsPage from "./pages/AuditLogsPage";
import SystemLogsPage from "./pages/SystemLogsPage";
import StaffHomePage from "./pages/StaffHomePage";
import BuildingManagerHomePage from "./pages/BuildingManagerHomePage";

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/403" element={<ForbiddenPage />} />

        <Route element={<ProtectedRoute />}>
          {/* STAFF */}
          <Route element={<RoleRoute allowedRoles={["STAFF"]} />}>
            <Route path="/staff" element={<StaffHomePage />} />
          </Route>

          {/* BUILDING_MANAGER */}
          <Route element={<RoleRoute allowedRoles={["BUILDING_MANAGER"]} />}>
            <Route path="/building-manager" element={<BuildingManagerHomePage />} />
          </Route>

          {/* ADMIN */}
          <Route element={<RoleRoute allowedRoles={["ADMIN"]} />}>
            <Route element={<AdminLayout />}>
              <Route index element={<DashboardPage />} />
              <Route path="accounts" element={<AccountsPage />} />

              <Route path="facilities" element={<FacilitiesPage />} />
              <Route path="locations" element={<LocationsPage />} />
              <Route path="universities" element={<UniversitiesPage />} />
              <Route path="buildings" element={<BuildingsPage />} />
              <Route path="buildings/create" element={<CreateBuildingPage />} />
              <Route path="buildings/:id/staff" element={<BuildingStaffPage />} />
              <Route path="rooms">
                <Route index element={<RoomsPage />} />
                <Route path=":id" element={<RoomDetailPage />} />
                <Route path="create" element={<CreateRoomPage />} />
                <Route path=":id/edit" element={<EditRoomPage />} />
                <Route path="types" element={<RoomTypesPage />} />
              </Route>
              <Route path="assets" element={<AssetsPage />} />
              <Route path="assets/create" element={<CreateAssetPage />} />
              <Route path="assets/types" element={<AssetTypesPage />} />
              <Route path="contracts/templates" element={<ContractTemplatesPage />} />
              <Route path="contracts/templates/create" element={<ContractTemplateEditorPage />} />
              <Route path="contracts/templates/:id/edit" element={<ContractTemplateEditorPage />} />
              <Route path="requests" element={<RequestsPage />} />
              <Route path="logs" element={<AuditLogsPage />} />
              <Route path="logs/system" element={<SystemLogsPage />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
