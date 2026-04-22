import { Navigate, Route, Routes } from "react-router-dom";
import AppShell from "./components/AppShell";
import ProtectedRoute from "./components/ProtectedRoute";
import AuthPage from "./pages/AuthPage";
import HomePage from "./pages/HomePage";
import StudentDashboard from "./pages/StudentDashboard";
import ShopPage from "./pages/ShopPage";
import CartPage from "./pages/CartPage";
import VendorDashboard from "./pages/VendorDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import DeliveryDashboard from "./pages/DeliveryDashboard";

export default function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/shops/:shopId" element={<ShopPage />} />
        <Route
          path="/student"
          element={
            <ProtectedRoute roles={["student"]}>
              <StudentDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/cart"
          element={
            <ProtectedRoute roles={["student"]}>
              <CartPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/vendor"
          element={
            <ProtectedRoute roles={["vendor"]}>
              <VendorDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute roles={["admin"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/delivery"
          element={
            <ProtectedRoute roles={["delivery"]}>
              <DeliveryDashboard />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  );
}
