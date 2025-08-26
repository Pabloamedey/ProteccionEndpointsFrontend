import { useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useProductContext } from "../../context/ProductContext.jsx";
import { exportToPDF } from "../../utils/ExportToPdf.jsx";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";

// ---- helpers de sesión/rol ----
// lee el usuario guardado en localStorage
function getStoredUser() {
  try { return JSON.parse(localStorage.getItem("user") || "null"); }
  catch { return null; }
}

// (opcional) formato de precio simple
function formatPrice(value) {
  const n = Number(value);
  if (Number.isNaN(n)) return value;
  return n.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function ProductsView() {
  // datos desde el contexto (lista + acciones)
  const { products, deleteProduct, loading, error, getProducts } = useProductContext();

  // sesión y rol desde storage (para ocultar/mostrar botones)
  const user = useMemo(() => getStoredUser(), []);
  const isAdmin = user?.role === "admin" || user?.rol === "admin";

  const navigate = useNavigate();

  // si no hay token -> a login; si hay token, pedimos datos (por si entraste directo)
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Tu sesión expiró o no estás logueado.");
      navigate("/inicio-sesion");
      return;
    }
    // opcional: refrescar listado si viniste desde otra ruta
    if (!Array.isArray(products) || products.length === 0) {
      getProducts?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // borrar con confirmación (solo admin)
  async function onDelete(id) {
    if (!isAdmin) return alert("Solo admin puede eliminar.");
    if (!confirm("¿Eliminar producto?")) return;
    try {
      await deleteProduct(id);
      alert("Producto eliminado");
    } catch (e) {
      alert("No autorizado o error al eliminar");
    }
  }

  // exportación a PDF (usa las claves que tengas en tu backend)
  function handleExport() {
    const rows = Array.isArray(products) ? products : [];
    // intentamos normalizar nombre/precio al exportar
    const normalized = rows.map(r => ({
      nombre: r.name ?? r.nombre ?? "",
      precio: r.price ?? r.precio ?? ""
    }));
    exportToPDF(normalized, "Productos", ["nombre", "precio"]);
  }

  // columna acciones (solo admin)
  function actionsBody(row) {
    if (!isAdmin) return <em>Solo lectura</em>;
    return (
      <>
        <Link to={`/productos/editar/${row.id}`}>
          <Button
            label="Editar"
            icon="pi pi-pencil"
            className="p-button-rounded p-button-info mr-2"
          />
        </Link>
        <Button
          label="Eliminar"
          icon="pi pi-trash"
          className="p-button-rounded p-button-danger"
          onClick={() => onDelete(row.id)}
        />
      </>
    );
  }

  // body de precio con formato
  function priceBody(row) {
    const value = row.price ?? row.precio;
    return formatPrice(value);
  }

  return (
    <div style={{ padding: 16 }}>
      <h2>📦 Lista de Productos</h2>

      {/* Botonera superior */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        {isAdmin && (
          <Link to="/productos/nuevo">
            <Button
              label="Crear producto"
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

      {/* Estados de carga/error */}
      {loading && <p>Cargando productos...</p>}
      {!!error && <p style={{ color: "red" }}>{error}</p>}

      {/* Tabla */}
      <DataTable
        value={Array.isArray(products) ? products : []}
        paginator={false}
        className="p-datatable-sm p-shadow-2 mt-4"
        emptyMessage="No hay datos (o no estás autorizado)."
      >
        <Column
          field="id"
          header="ID"
          body={(row) => row.id}
          style={{ width: "120px" }}
        />
        <Column
          field="nombre"
          header="Nombre"
          body={(row) => row.name ?? row.nombre}
        />
        <Column
          field="precio"
          header="Precio"
          body={priceBody}
          style={{ width: "160px" }}
        />
        <Column
          header="Acciones"
          body={actionsBody}
          style={{ width: "260px" }}
        />
      </DataTable>
    </div>
  );
}
