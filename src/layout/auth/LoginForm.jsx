// Form de login
// - Valida con Formik + Yup
// - Usa AuthContext.login (ya setea token, user y navega)
// - UI con PrimeReact

import { useContext } from "react";
import { AuthContext } from "../../context/AuthContext.jsx";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";

// PrimeReact
import { Card } from "primereact/card";
import { InputText } from "primereact/inputtext";
import { Password } from "primereact/password";
import { Button } from "primereact/button";
import { Link } from "react-router-dom";

const validationSchema = Yup.object({
  // validación de email y contraseña
  email: Yup.string().email("Email inválido").required("Campo requerido"),
  password: Yup.string().required("Campo requerido"),
});

export default function LoginForm() {
  const { login } = useContext(AuthContext);

  // valores iniciales del form
  const initialValues = { email: "", password: "" };

  // submit: delega en AuthContext.login
  async function handleSubmit(values, { setSubmitting }) {
    try {
      await login(values);
      // AuthContext se encarga de navegar y guardar token/user
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ padding: 16, display: "grid", placeItems: "center" }}>
      <Card title="Iniciar sesión" style={{ width: 420, maxWidth: "100%" }}>
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ values, handleChange, isSubmitting }) => (
            <Form className="p-fluid" autoComplete="on">
              {/* email */}
              <label htmlFor="email" style={{ marginBottom: 4 }}>Email</label>
              <InputText
                id="email"
                name="email"
                value={values.email}
                onChange={handleChange}
                autoComplete="username"
              />
              <small className="p-error">
                <ErrorMessage name="email" />
              </small>

              {/* password */}
              <label htmlFor="password" style={{ marginTop: 12, marginBottom: 4 }}>
                Contraseña
              </label>
              <Field name="password">
                {({ field }) => (
                  <Password
                    id="password"
                    {...field}
                    feedback={false}           // desactiva fuerza de contraseña
                    toggleMask                 // botón mostrar/ocultar
                    inputProps={{ autoComplete: "current-password" }}
                  />
                )}
              </Field>
              <small className="p-error">
                <ErrorMessage name="password" />
              </small>

              {/* acciones */}
              <div style={{ display: "flex", gap: 8, marginTop: 16, alignItems: "center" }}>
                <Button
                  type="submit"
                  label={isSubmitting ? "Ingresando..." : "Iniciar sesión"}
                  disabled={isSubmitting}
                />
                <Link to="/registro">
                  <Button
                    type="button"
                    label="Crear cuenta"
                    className="p-button-text"
                  />
                </Link>
              </div>
            </Form>
          )}
        </Formik>
      </Card>
    </div>
  );
}
