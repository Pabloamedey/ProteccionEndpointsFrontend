// Contexto de usuarios (solo admin para listar/editar roles)
// - GET /api/users
// - PUT /api/users/:id/role
// - CRUD opcional (si tu UI lo usa)
// - Envía Authorization: Bearer <token>

import { createContext, useState, useEffect, useContext } from "react";
import axios from "axios";

export const UserContext = createContext();

const BASE = (import.meta.env.VITE_API_URL || "http://localhost:3000") + "/api/users";

// helper de headers con token
function authConfig() {
  const token = localStorage.getItem("token");
  return {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  };
}

export const UserProvider = ({ children }) => {
  const [users, setUsers]     = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  // GET (solo admin)
  const getUsers = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(BASE, authConfig());
      setUsers(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e?.response?.data?.error || e.message);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  // POST (opcional; admin)
  const addUser = async (newUser) => {
    setLoading(true);
    try {
      const { data } = await axios.post(BASE, newUser, authConfig());
      setUsers((prev) => [...prev, data]);
    } catch (e) {
      setError(e?.response?.data?.error || e.message);
    } finally {
      setLoading(false);
    }
  };

  // PUT (opcional; admin)
  const editUser = async (id, updated) => {
    setLoading(true);
    try {
      const { data } = await axios.put(`${BASE}/${id}`, updated, authConfig());
      setUsers((prev) => prev.map((u) => (u.id === id ? data : u)));
    } catch (e) {
      setError(e?.response?.data?.error || e.message);
    } finally {
      setLoading(false);
    }
  };

  // DELETE (opcional; admin)
  const deleteUser = async (id) => {
    try {
      await axios.delete(`${BASE}/${id}`, authConfig());
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (e) {
      setError(e?.response?.data?.error || e.message);
    }
  };

  // ✅ Cambiar rol (solo admin)
  const updateUserRole = async (id, role) => {
    setLoading(true);
    try {
      const { data } = await axios.put(`${BASE}/${id}/role`, { role }, authConfig());
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, role: data.role ?? data.rol } : u)));
      return data;
    } catch (e) {
      setError(e?.response?.data?.error || e.message);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { getUsers(); }, []);

  return (
    <UserContext.Provider
      value={{ users, loading, error, getUsers, addUser, editUser, deleteUser, updateUserRole }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUserContext = () => useContext(UserContext);
