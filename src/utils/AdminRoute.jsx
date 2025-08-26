// utils/AdminRoute.jsx
import { Navigate, Outlet } from "react-router-dom";

// lee el usuario guardado en localStorage
function readUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
}

// Ruta protegida solo para admins
export default function AdminRoute() {
  const user = readUser();

  if (!user) {
    return <Navigate to="/inicio-sesion" replace />;
  }

  return user.role === "admin"
    ? <Outlet />
    : <Navigate to="/" replace />;
}
