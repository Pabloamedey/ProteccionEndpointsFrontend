// Manejo de sesión (login/register/logout) con compatibilidad de payload JWT
// - Soporta tokens con payload { id, email, role } o { user:{ id,nombre/email/rol } }
// - Persiste token y user en localStorage
// - Inyecta Authorization en axios

import { createContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { jwtDecode } from "jwt-decode";

export const AuthContext = createContext();

const API = import.meta.env.VITE_API_URL || "http://localhost:3000";

// mapea el payload del token a un objeto user consistente
function mapDecodedToUser(decoded) {
  // exp check (segundos -> ms)
  if (!decoded?.exp || decoded.exp * 1000 < Date.now()) return null;

  // formato 1: { id, email, role, name? }
  if (decoded.id || decoded.role || decoded.email) {
    return {
      id: decoded.id ?? decoded.user?.id ?? null,
      // name/nombre: intentamos ambas claves
      name: decoded.name ?? decoded.nombre ?? decoded.user?.name ?? decoded.user?.nombre ?? "",
      email: decoded.email ?? decoded.user?.email ?? "",
      role: decoded.role ?? decoded.rol ?? decoded.user?.role ?? decoded.user?.rol ?? "cliente",
    };
  }

  // formato 2: { user:{ ... } }
  if (decoded.user) {
    const u = decoded.user;
    return {
      id: u.id ?? null,
      name: u.name ?? u.nombre ?? "",
      email: u.email ?? "",
      role: u.role ?? u.rol ?? "cliente",
    };
  }

  return null;
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("user") || "null"); }
    catch { return null; }
  });
  const navigate = useNavigate();

  // configura axios Authorization al montar (si hay token válido)
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const decoded = jwtDecode(token);
      const mapped = mapDecodedToUser(decoded);
      if (mapped) {
        setUser(mapped);
        axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        // sincroniza user en localStorage para Navbar/Guards
        localStorage.setItem("user", JSON.stringify(mapped));
      } else {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        delete axios.defaults.headers.common["Authorization"];
        setUser(null);
      }
    } catch {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      delete axios.defaults.headers.common["Authorization"];
      setUser(null);
    }
  }, []);

  // login contra /auth/login
  const login = async (credentials) => {
    try {
      const res = await axios.post(`${API}/auth/login`, credentials);
      if (res.status !== 200) throw new Error("Las credenciales son erróneas");

      const token = res.data?.token;
      if (!token) throw new Error("Token no recibido");

      // seteo token y header
      localStorage.setItem("token", token);
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      // preferimos el user que viene en la respuesta; si no, decodificamos
      const serverUser = res.data?.user;
      let mapped = serverUser
        ? {
            id: serverUser.id,
            name: serverUser.name ?? serverUser.nombre ?? "",
            email: serverUser.email,
            role: serverUser.role ?? serverUser.rol ?? "cliente",
          }
        : mapDecodedToUser(jwtDecode(token));

      if (!mapped) {
        localStorage.removeItem("token");
        delete axios.defaults.headers.common["Authorization"];
        alert("Token inválido o expirado");
        return;
      }

      setUser(mapped);
      localStorage.setItem("user", JSON.stringify(mapped));
      navigate("/");
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || "Hubo un error al iniciar sesión");
    }
  };

  // register contra /auth/register
  const register = async (userData) => {
    try {
      // si tu form envía name, mapealo a nombre en el llamado
      const payload = { ...userData };
      if (payload.name && !payload.nombre) payload.nombre = payload.name;

      const res = await axios.post(`${API}/auth/register`, payload);
      // Algunos backends devuelven 201 + token+user; otros solo 201
      if (res.status === 201 && res.data?.token) {
        alert("Usuario creado exitosamente");
        // auto-login si vino token
        const token = res.data.token;
        const serverUser = res.data.user;

        localStorage.setItem("token", token);
        axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

        const mapped = serverUser
          ? {
              id: serverUser.id,
              name: serverUser.name ?? serverUser.nombre ?? "",
              email: serverUser.email,
              role: serverUser.role ?? serverUser.rol ?? "cliente",
            }
          : mapDecodedToUser(jwtDecode(token));

        if (mapped) {
          setUser(mapped);
          localStorage.setItem("user", JSON.stringify(mapped));
          navigate("/productos");
          return;
        }
      }

      // Si no vino token, mandamos a login
      alert("Usuario creado exitosamente");
      navigate("/inicio-sesion");
    } catch (err) {
      alert(err?.response?.data?.message || "Hubo un error al registrar el usuario");
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    delete axios.defaults.headers.common["Authorization"];
    navigate("/inicio-sesion");
  };

  return (
    <AuthContext.Provider value={{ user, setUser, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
