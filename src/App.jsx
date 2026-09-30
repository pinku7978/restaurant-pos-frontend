import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

import PortalSelect from "./pages/PortalSelect";
import StaffLogin from "./pages/auth/StaffLogin";
import OwnerSignup from "./pages/auth/OwnerSignup";
import CustomerLogin from "./pages/auth/CustomerLogin";
import CustomerSignup from "./pages/auth/CustomerSignup";
import MenuPage from "./pages/customer/MenuPage";
import KitchenDisplay from "./pages/kitchen/KitchenDisplay";
import CashierDashboard from "./pages/cashier/CashierDashboard";
import OwnerDashboard from "./pages/owner/OwnerDashboard";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Main Portal Selection Landing */}
          <Route path="/" element={<PortalSelect />} />

          {/* Auth screens */}
          <Route path="/staff-login" element={<StaffLogin />} />
          <Route path="/owner-signup" element={<OwnerSignup />} />
          <Route path="/login" element={<CustomerLogin />} />
          <Route path="/signup" element={<CustomerSignup />} />

          {/* Customer / Diner routes */}
          <Route path="/order" element={<CustomerLogin />} />
          <Route
            path="/menu"
            element={
              <ProtectedRoute allowedRoles={["customer", "owner"]}>
                <MenuPage />
              </ProtectedRoute>
            }
          />

          {/* Staff screens — role locked, with administrative oversight for Owner */}
          <Route
            path="/kitchen"
            element={
              <ProtectedRoute allowedRoles={["chef", "owner"]}>
                <KitchenDisplay />
              </ProtectedRoute>
            }
          />
          <Route
            path="/cashier"
            element={
              <ProtectedRoute allowedRoles={["cashier", "owner"]}>
                <CashierDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/owner"
            element={
              <ProtectedRoute allowedRoles={["owner"]}>
                <OwnerDashboard />
              </ProtectedRoute>
            }
          />

          {/* Catch-all redirect to Portal Home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
