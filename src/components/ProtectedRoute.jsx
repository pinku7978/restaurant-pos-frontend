import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const roleHomeRoute = {
  chef: "/kitchen",
  cashier: "/cashier",
  owner: "/owner",
  customer: "/menu"
};

const ProtectedRoute = ({ allowedRoles, children }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to={allowedRoles.includes("customer") ? "/login" : "/staff-login"} replace />;
  }

  // Owners have administrative oversight over kitchen and cashier screens
  if (
    user.role === "owner" &&
    (allowedRoles.includes("chef") || allowedRoles.includes("cashier") || allowedRoles.includes("owner"))
  ) {
    return children;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to={roleHomeRoute[user.role] || "/"} replace />;
  }

  return children;
};

export default ProtectedRoute;
