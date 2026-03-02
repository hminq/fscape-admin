import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminLayout from "./layouts/AdminLayout";
import LoginPage from "./pages/LoginPage";
import ForbiddenPage from "./pages/ForbiddenPage";
import DashboardPage from "./pages/DashboardPage";
import LocationsPage from "./pages/LocationsPage";
import UniversitiesPage from "./pages/UniversitiesPage";
import BuildingsPage from "./pages/BuildingsPage";
import CreateBuildingPage from "./pages/CreateBuildingPage";
import RoomsPage from "./pages/RoomsPage";
import CreateRoomPage from "./pages/CreateRoomPage";
import RoomTypesPage from "./pages/RoomTypesPage";
import AssetsPage from "./pages/AssetsPage";
import AccountsPage from "./pages/AccountsPage";
import CreateAccountPage from "./pages/CreateAccountPage";
import CreateAssetPage from "./pages/CreateAssetPage";
import RoomDetailPage from "./pages/RoomDetailPage";

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/403" element={<ForbiddenPage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<AdminLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="accounts" element={<AccountsPage />} />
            <Route path="accounts/create" element={<CreateAccountPage />} />
            <Route path="locations" element={<LocationsPage />} />
            <Route path="universities" element={<UniversitiesPage />} />
            <Route path="buildings" element={<BuildingsPage />} />
            <Route path="buildings/create" element={<CreateBuildingPage />} />
            <Route path="rooms">
              <Route index element={<RoomsPage />} />
              <Route path=":id" element={<RoomDetailPage />} />
              <Route path="create" element={<CreateRoomPage />} />
              <Route path="types" element={<RoomTypesPage />} />
            </Route>
            <Route path="assets" element={<AssetsPage />} />
            <Route path="assets/create" element={<CreateAssetPage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
