import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";

import { useUserContext } from "../../context/UserContext.jsx";
import { Button } from "primereact/button";

// --- helpers de sesión / API ---
const API = import.meta.env.VITE_API_URL || "http://localhost:3000";

function getStoredUser() {
  try { return JSON.parse(localStorage.getItem("user") || "null"); }
  catch { return null; }
}
function authHeadersJSON() {
  const token = localStorage.getItem("token");
  const base = token ? { Authorization: `Bearer ${token}` } : {};
  return { ...base, "Content-Type": "application/json" };
}

// --- esquema de validaciones ---
// contrasenia requerida SOLO en creación
const validationSchema = Yup.object({
  nombre: Yup.string().required("El nombre es requerido"),
  email: Yup.string().email("Debe ser un email válido").required("El email es requerido"),
  contrasenia: Yup.string().when("$isEdit", {
    is: true,
    then: (s) => s.notRequired(),
    otherwise: (s) => s.required("La contraseña es requerida").min(6, "La contraseña debe tener al menos 6 caracteres"),
  }),
  edad: Yup.number()
    .typeError("La edad debe ser un número")
    .integer("La edad debe ser un número entero")
    .positive("La edad debe ser mayor que 0")
    .required("La edad es requerida"),
});

export default function UserForm() {
  const { users, addUser, editUser } = useUserContext();

  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  // sesión/rol
  const me = useMemo(() => getStoredUser(), []);
  const isAdmin = me?.role === "admin" || me?.rol === "admin";

  // UI: ver/ocultar contraseña
  const [showPassword, setShowPassword] = useState(false);

  // estado inicial
  const [initialValues, setInitialValues] = useState({
    nombre: "",
    email: "",
    contrasenia: "",
    edad: 0,
  });

  // cargar datos en edición
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Tu sesión expiró o no estás logueado.");
      navigate("/inicio-sesion");
      return;
    }
    if (!isAdmin) {
      alert("Solo un administrador puede crear o editar usuarios.");
      navigate("/usuarios");
      return;
    }

    if (!isEdit) return;

    // 1) primero intentamos desde el contexto
    const ctxUser = users.find((u) => u.id === Number(id));
    if (ctxUser) {
      setInitialValues({
        nombre: ctxUser.name ?? ctxUser.nombre ?? "",
        email: ctxUser.email ?? "",
        contrasenia: "", // no rellenamos contraseñas en edición
        edad: Number(ctxUser.edad ?? 0),
      });
      return;
    }

    // 2) si no está, vamos al backend
    (async () => {
      try {
        const res = await fetch(`${API}/api/users/${id}`, { headers: authHeadersJSON() });
        if (res.status === 401) {
          alert("Tu sesión expiró o no estás logueado.");
          return navigate("/inicio-sesion");
        }
        if (res.status === 403) {
          alert("No autorizado (solo admin).");
          return navigate("/usuarios");
        }
        if (!res.ok) throw new Error("No autorizado o usuario no encontrado");

        const data = await res.json();
        setInitialValues({
          nombre: data.name ?? data.nombre ?? "",
          email: data.email ?? "",
          contrasenia: "",
          edad: Number(data.edad ?? 0),
        });
      } catch (err) {
        alert(err.message);
        navigate("/usuarios");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isEdit]);

  // submit (crea/edita)
  async function handleSubmit(values) {
    if (!isAdmin) return alert("Solo admin puede guardar.");

    try {
      if (isEdit) {
        // en edición, si viene contrasenia vacía NO la mandamos
        const payload = {
          nombre: values.nombre,
          email: values.email,
          edad: Number(values.edad),
          ...(values.contrasenia ? { password: values.contrasenia } : {}),
        };
        await editUser(Number(id), payload); // PUT /api/users/:id
        alert("Usuario actualizado");
      } else {
        // creación: mapeamos contrasenia -> password
        const payload = {
          nombre: values.nombre,
          email: values.email,
          password: values.contrasenia,
          edad: Number(values.edad),
        };
        await addUser(payload); // POST /api/users
        alert("Usuario creado");
      }
      navigate("/usuarios");
    } catch (e) {
      alert("No autorizado o error al guardar");
    }
  }

  // bloqueo visual si no es admin
  if (!isAdmin) {
    return (
      <div style={{ padding: 16 }}>
        <h2>Permisos insuficientes</h2>
        <p>Solo un administrador puede crear o editar usuarios.</p>
        <Button
          label="Volver"
          className="p-button-secondary p-button-rounded"
          onClick={() => navigate("/usuarios")}
        />
      </div>
    );
  }

  return (
    <div className="p-d-flex p-flex-column p-align-center p-mt-3" style={{ padding: 16 }}>
      <h2>{isEdit ? "Editar" : "Crear"} Usuario</h2>

      <Formik
        initialValues={initialValues}
        enableReinitialize
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
        // pasamos flag a Yup para el campo contrasenia
        context={{ isEdit }}
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
              placeholder="Nombre del usuario"
            />
            <ErrorMessage name="nombre" component="div" className="p-text-danger" />
          </div>

          <div>
            <label>Email:</label>
            <Field
              name="email"
              type="email"
              className="p-inputtext p-component p-mb-3"
              placeholder="Email del usuario"
            />
            <ErrorMessage name="email" component="div" className="p-text-danger" />
          </div>

          {!isEdit && (
            <div>
              <label>Contraseña:</label>
              <div className="p-inputgroup p-mb-1">
                <Field
                  name="contrasenia"
                  type={showPassword ? "text" : "password"}
                  placeholder="Contraseña del usuario"
                  className="p-inputtext p-component"
                />
                <span
                  className="p-inputgroup-addon"
                  style={{ cursor: "pointer" }}
                  onClick={() => setShowPassword((prev) => !prev)}
                >
                  <i className={`pi ${showPassword ? "pi-eye-slash" : "pi-eye"}`} />
                </span>
              </div>
              <ErrorMessage name="contrasenia" component="div" className="p-text-danger" />
            </div>
          )}

          <div>
            <label>Edad:</label>
            <Field
              name="edad"
              type="number"
              className="p-inputtext p-component p-mb-3"
              placeholder="Edad"
            />
            <ErrorMessage name="edad" component="div" className="p-text-danger" />
          </div>

          <div className="p-d-flex p-gap-3" style={{ display: "flex", gap: 8 }}>
            <Button
              type="submit"
              label={isEdit ? "Actualizar" : "Crear"}
              className="p-button-success p-button-rounded"
            />
            <Button
              label="Volver"
              className="p-button-secondary p-button-rounded"
              onClick={() => navigate("/usuarios")}
              type="button"
            />
          </div>
        </Form>
      </Formik>
    </div>
  );
}
