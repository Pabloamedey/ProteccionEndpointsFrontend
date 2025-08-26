import { useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useUserContext } from "../../context/UserContext.jsx";
import { exportToPDF } from "../../utils/ExportToPdf.jsx";

// PrimeReact
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";

// --- helpers de sesión ---
function getStoredUser() {
  try { return JSON.parse(localStorage.getItem("user") || "null"); }
  catch { return null; }
}

export default function UsersView() {
  const {
    users,
    loading,
    error,
    getUsers,
    deleteUser,
    updateUserRole, // PUT /api/users/:id/role
  } = useUserContext();

  const me = useMemo(() => getStoredUser(), []);
  const isAdmin = me?.role === "admin" || me?.rol === "admin";
  const navigate = useNavigate();

  // protección básica: si no hay token → login; si hay, cargamos lista
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Tu sesión expiró o no estás logueado.");
      navigate("/inicio-sesion");
      return;
    }
    // trae usuarios (el back devolverá 403 si no es admin)
    getUsers?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // guardar rol (solo admin)
  async function onSaveRole(row) {
    if (!isAdmin) return alert("Solo admin puede cambiar roles.");
    const current = row.role ?? row.rol;
    const next = row._newRole ?? current;
    if (next === current) return alert("No hay cambios de rol.");

    try {
      await updateUserRole(row.id, next);
      alert("Rol actualizado");
    } catch {
      alert("No autorizado o error al actualizar el rol");
    }
  }

  // exportar a PDF (sin contraseña)
  function handleExport() {
    const rows = Array.isArray(users) ? users : [];
    const sanitized = rows.map(u => ({
      nombre: u.name ?? u.nombre ?? "",
      email: u.email ?? "",
      rol: u.role ?? u.rol ?? "",
      edad: u.edad ?? "",
    }));
    exportToPDF(sanitized, "Usuarios", ["nombre", "email", "rol", "edad"]);
  }

  // columna rol: select si admin, texto si no
  function roleBody(row) {
    const currentRole = row.role ?? row.rol ?? "cliente";
    if (!isAdmin) return currentRole;

    return (
      <select
        defaultValue={currentRole}
        onChange={(e) => (row._newRole = e.target.value)}
      >
        <option value="cliente">cliente</option>
        <option value="moderador">moderador</option>
        <option value="admin">admin</option>
      </select>
    );
  }

  // columna acciones: editar/eliminar/guardar rol
  function actionsBody(row) {
    if (!isAdmin) return <em>-</em>;
    return (
      <>
        <Link to={`/usuarios/editar/${row.id}`}>
          <Button
            label="Editar"
            icon="pi pi-pencil"
            className="p-button-rounded p-button-info mr-2"
          />
        </Link>
        <Button
          label="Eliminar"
          icon="pi pi-trash"
          className="p-button-rounded p-button-danger mr-2"
          onClick={() => {
            if (!confirm("¿Eliminar usuario?")) return;
            deleteUser(row.id).catch(() => alert("No autorizado o error al eliminar"));
          }}
        />
        <Button
          label="Guardar rol"
          icon="pi pi-save"
          className="p-button-rounded p-button-help"
          onClick={() => onSaveRole(row)}
        />
      </>
    );
  }

  return (
    <div style={{ padding: 16 }}>
      <h2>👤 Lista de Usuarios</h2>

      {/* Botonera superior */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        {isAdmin && (
          <Link to="/usuarios/nuevo">
            <Button
              label="Crear nuevo usuario"
              icon="pi pi-plus"
              className="p-button-rounded p-button-success"
            />
          </Link>
        )}
        <Link to="/">
          <Button
            label="Volver al inicio"
            icon="pi pi-home"
            className="p-button-rounded p-button-secondary"
          />
        </Link>
        <Button
          label="Exportar PDF"
          icon="pi pi-file-pdf"
          className="p-button-rounded p-button-warning"
          onClick={handleExport}
        />
      </div>

      {/* Estados */}
      {loading && <p>Cargando usuarios...</p>}
      {!!error && <p style={{ color: "red" }}>{error}</p>}

      {/* Tabla */}
      <DataTable
        value={Array.isArray(users) ? users : []}
        paginator={false}
        className="p-datatable-sm p-shadow-2 mt-4"
        emptyMessage="No hay datos (o no estás autorizado)."
      >
        <Column
          field="nombre"
          header="Nombre"
          body={(row) => row.name ?? row.nombre}
        />
        <Column field="email" header="Email" />
        <Column
          field="rol"
          header="Rol"
          body={roleBody}
          style={{ width: 180 }}
        />
        <Column field="edad" header="Edad" style={{ width: 120 }} />
        <Column header="Acciones" body={actionsBody} style={{ width: 380 }} />
      </DataTable>

      {/* Nota: quitamos la columna "Contraseña" a propósito */}
    </div>
  );
}
