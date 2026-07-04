import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ roles }) {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.mustChangePassword && location.pathname !== "/cambiar-contrasena-obligatorio") {
    return <Navigate to="/cambiar-contrasena-obligatorio" replace />;
  }

  if (!user?.mustChangePassword && location.pathname === "/cambiar-contrasena-obligatorio") {
    return <Navigate to="/" replace />;
  }

  if (roles?.length && !roles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}
