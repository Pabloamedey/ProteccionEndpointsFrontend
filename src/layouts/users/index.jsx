// Rutas anidadas de /usuarios/*
// Para este práctico, la gestión de roles vive en UsersView

import { Routes, Route, Navigate } from "react-router-dom";
import UsersView from "./UsersView.jsx";
import UserForm from "./UserForm.jsx";

export default function UsersIndex() {
  return (
    <Routes>
      <Route index element={<UsersView />} />
      <Route path="nuevo" element={<UserForm />} />
      <Route path="editar/:id" element={<UserForm />} />
      <Route path="*" element={<Navigate to="/usuarios" replace />} />
    </Routes>
  );
}
