// Form de registro
// - Valida con Formik + Yup
// - Usa AuthContext.register (se encarga de llamar al backend y navegar)
// - UI con PrimeReact
// - Variables en inglés; comentarios en español

import { useContext } from "react";
import { AuthContext } from "../../context/AuthContext.jsx";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";

// PrimeReact
import { Card } from "primereact/card";
import { InputText } from "primereact/inputtext";
import { Password } from "primereact/password";
import { InputNumber } from "primereact/inputnumber";
import { Button } from "primereact/button";

const validationSchema = Yup.object({
  // validaciones básicas
  nombre: Yup.string().required("Campo requerido"),
  email: Yup.string().email("Email inválido").required("Campo requerido"),
  password: Yup.string().min(6, "Mínimo 6 caracteres").required("Campo requerido"),
  edad: Yup.number()
    .typeError("La edad debe ser un número")
    .integer("La edad debe ser un entero")
    .min(1, "Mínimo 1")
    .max(120, "Máximo 120")
    .required("Campo requerido"),
});

export default function RegisterForm() {
  const { register } = useContext(AuthContext);

  // valores iniciales del form
  const initialValues = {
    nombre: "",
    email: "",
    password: "",
    edad: null,
  };

  // submit: delega en AuthContext.register
  async function handleSubmit(values, { setSubmitting }) {
    try {
      await register(values); // { nombre, email, password, edad }
      // El AuthContext decide si auto-logea o redirige a /inicio-sesion.
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ padding: 16, display: "grid", placeItems: "center" }}>
      <Card title="Registrarse" style={{ width: 460, maxWidth: "100%" }}>
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ values, handleChange, setFieldValue, isSubmitting }) => (
            <Form className="p-fluid" autoComplete="on">
              {/* nombre */}
              <label htmlFor="nombre" style={{ marginBottom: 4 }}>Nombre</label>
              <InputText
                id="nombre"
                name="nombre"
                value={values.nombre}
                onChange={handleChange}
                autoComplete="name"
              />
              <small className="p-error">
                <ErrorMessage name="nombre" />
              </small>

              {/* email */}
              <label htmlFor="email" style={{ marginTop: 12, marginBottom: 4 }}>Email</label>
              <InputText
                id="email"
                name="email"
                value={values.email}
                onChange={handleChange}
                autoComplete="email"
              />
              <small className="p-error">
                <ErrorMessage name="email" />
              </small>

              {/* password */}
              <label htmlFor="password" style={{ marginTop: 12, marginBottom: 4 }}>Contraseña</label>
              <Field name="password">
                {({ field }) => (
                  <Password
                    id="password"
                    {...field}
                    feedback={false}          // sin medidor de fuerza
                    toggleMask                // botón mostrar/ocultar
                    inputProps={{ autoComplete: "new-password" }}
                  />
                )}
              </Field>
              <small className="p-error">
                <ErrorMessage name="password" />
              </small>

              {/* edad */}
              <label htmlFor="edad" style={{ marginTop: 12, marginBottom: 4 }}>Edad</label>
              <InputNumber
                id="edad"
                value={values.edad}
                onValueChange={(e) => setFieldValue("edad", e.value)}
                useGrouping={false}
                min={1}
                max={120}
                inputId="edad"
              />
              <small className="p-error">
                <ErrorMessage name="edad" />
              </small>

              {/* acciones */}
              <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                <Button
                  type="submit"
                  label={isSubmitting ? "Creando..." : "Registrarse"}
                  disabled={isSubmitting}
                />
              </div>
            </Form>
          )}
        </Formik>
      </Card>
    </div>
  );
}
