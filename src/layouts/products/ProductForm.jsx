import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";

import { useProductContext } from "../../context/ProductContext.jsx";
import { Button } from "primereact/button";

const API = import.meta.env.VITE_API_URL || "http://localhost:3000";

// lee el usuario guardado en localStorage
function getStoredUser() {
  try { return JSON.parse(localStorage.getItem("user") || "null"); }
  catch { return null; }
}

// arma headers con token si existe
function authHeadersJSON() {
  const token = localStorage.getItem("token");
  const base = token ? { Authorization: `Bearer ${token}` } : {};
  return { ...base, "Content-Type": "application/json" };
}

// esquema de validaciones
const validationSchema = Yup.object({
  nombre: Yup.string()
    .trim()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .required("El nombre es requerido"),
  precio: Yup.number()
    .typeError("El precio debe ser un número")
    .positive("El precio debe ser mayor que 0")
    .required("El precio es requerido"),
});

export default function ProductForm() {
  // contexto
  const { products, addProduct, editProduct } = useProductContext();

  // routing
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  // sesión y rol
  const user = useMemo(() => getStoredUser(), []);
  const isAdmin = user?.role === "admin" || user?.rol === "admin";

  // estado inicial del form
  const [initialValues, setInitialValues] = useState({ nombre: "", precio: 0 });

  // guarda: create/update (solo admin)
  async function handleSubmit(values) {
    if (!isAdmin) return alert("Solo admin puede guardar.");
    // mapeo a los nombres que espera el backend
    const payload = { name: values.nombre, price: Number(values.precio) };

    try {
      if (isEdit) {
        await editProduct(Number(id), payload); // ProductContext hace PUT /api/products/:id
        alert("Producto actualizado");
      } else {
        await addProduct(payload);              // ProductContext hace POST /api/products
        alert("Producto creado");
      }
      navigate("/productos");
    } catch (e) {
      alert("No autorizado o error al guardar");
    }
  }

  // carga del producto en modo edición
  useEffect(() => {
    // sin token → a login
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Tu sesión expiró o no estás logueado.");
      navigate("/inicio-sesion");
      return;
    }

    if (!isEdit) return;

    // intenta obtener del contexto primero
    const ctxProduct = products.find((p) => p.id === Number(id));
    if (ctxProduct) {
      setInitialValues({
        nombre: ctxProduct.name ?? ctxProduct.nombre ?? "",
        precio: ctxProduct.price ?? ctxProduct.precio ?? 0,
      });
      return;
    }

    // si no está en contexto, lo traemos del backend
    (async () => {
      try {
        const res = await fetch(`${API}/api/products/${id}`, { headers: authHeadersJSON() });
        if (res.status === 401) {
          alert("Tu sesión expiró o no estás logueado.");
          return navigate("/inicio-sesion");
        }
        if (res.status === 403) {
          alert("No autorizado (solo admin).");
          return navigate("/productos");
        }
        if (!res.ok) throw new Error("No autorizado o producto no encontrado");
        const data = await res.json();
        setInitialValues({
          nombre: data.name ?? data.nombre ?? "",
          precio: data.price ?? data.precio ?? 0,
        });
      } catch (err) {
        alert(err.message);
        navigate("/productos");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isEdit]);

  // bloqueo visual si no es admin
  if (!isAdmin) {
    return (
      <div style={{ padding: 16 }}>
        <h2>Permisos insuficientes</h2>
        <p>Solo un administrador puede crear o editar productos.</p>
        <Button
          label="Volver"
          className="p-button-secondary p-button-rounded"
          onClick={() => navigate("/productos")}
        />
      </div>
    );
  }

  return (
    <div className="p-d-flex p-flex-column p-align-center p-mt-3" style={{ padding: 16 }}>
      <h2>{isEdit ? "Editar" : "Crear"} Producto</h2>

      <Formik
        initialValues={initialValues}
        enableReinitialize
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        <Form
          className="p-d-flex p-flex-column p-gap-3"
          style={{ width: "100%", maxWidth: 420 }}
        >
          <div>
            <label>Nombre:</label>
            <Field
              name="nombre"
              className="p-inputtext p-component p-mb-3"
              placeholder="Nombre del producto"
            />
            <ErrorMessage name="nombre" component="div" className="p-text-danger" />
          </div>

          <div>
            <label>Precio:</label>
            <Field
              name="precio"
              type="number"
              className="p-inputtext p-component p-mb-3"
              placeholder="Precio"
            />
            <ErrorMessage name="precio" component="div" className="p-text-danger" />
          </div>

          <div className="p-d-flex p-gap-3" style={{ display: "flex", gap: 8 }}>
            <Button type="submit" label={isEdit ? "Actualizar" : "Crear"} className="p-button-success p-button-rounded" />
            <Button type="button" label="Volver" className="p-button-secondary p-button-rounded" onClick={() => navigate("/productos")} />
          </div>
        </Form>
      </Formik>
    </div>
  );
}
