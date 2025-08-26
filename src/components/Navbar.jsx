// Navbar condicional por sesión y rol (lee AuthContext y hace fallback a localStorage)

import { Link, useNavigate } from "react-router-dom";
import { useContext, useMemo } from "react";
import { AuthContext } from "../context/AuthContext.jsx";

function readStoredUser() {
  try { return JSON.parse(localStorage.getItem("user") || "null"); }
  catch { return null; }
}

export default function Navbar() {
  const { user: ctxUser, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  // fallback por si el contexto aún no montó pero el storage ya tiene user
  const user = useMemo(() => ctxUser || readStoredUser(), [ctxUser]);
  const isLogged = !!user;
  const role = user?.role ?? user?.rol;

  function handleLogout() {
    logout();
    navigate("/inicio-sesion");
  }

  return (
    <nav style={{ display: "flex", gap: 12, padding: 12, borderBottom: "1px solid #ddd" }}>
      <Link to="/">Inicio</Link>

      {!isLogged && (
        <>
          <Link to="/inicio-sesion">Login</Link>
          <Link to="/registro">Registro</Link>
        </>
      )}

      {isLogged && (
        <>
          <Link to="/productos">Productos</Link>
          <Link to="/usuarios">Usuarios</Link>

          {/* badge de rol a la derecha */}
          <span style={{ marginLeft: "auto" }}>
            {user?.name ?? user?.nombre} <b>({role})</b>
          </span>
          <button onClick={handleLogout}>Logout</button>
        </>
      )}
    </nav>
  );
}
