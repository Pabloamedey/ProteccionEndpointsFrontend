import { Fragment } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";

// Vistas desde layouts
import Home from "./layouts/home/index";

import { ProductProvider } from "./context/ProductContext";
import ProductRoutes from "./layouts/products/index";

import UserRoutes from './layouts/users/index';
import { UserProvider } from './context/UserContext'

import { AuthProvider } from "./context/AuthContext";
import LoginForm from "./layouts/auth/LoginForm";
import RegisterForm from "./layouts/auth/RegisterForm";

import PrivateRoute from "./utils/PrivateRoute";
import PublicRoute from "./utils/PublicRoute";
import AdminRoute from "./utils/AdminRoute";

import "./App.css";
import "primereact/resources/themes/lara-dark-indigo/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <Fragment>
          <Navbar />
          <Routes>
            {/* Home siempre accesible */}
            <Route path="/" element={<Home />} />

            {/* Rutas públicas */}
            <Route element={<PublicRoute />}>
              <Route path="/inicio-sesion" element={<LoginForm />} />
              <Route path="/registro" element={<RegisterForm />} />
            </Route>

            {/* Rutas privadas */}
            <Route element={<PrivateRoute />}>
              {/* Productos → accesible a cualquier usuario logueado */}
              <Route
                path="/productos/*"
                element={
                  <ProductProvider>
                    <ProductRoutes />
                  </ProductProvider>
                }
              />

              {/* Usuarios → accesible solo a admins */}
              <Route element={<AdminRoute />}>
                <Route
                  path="/usuarios/*"
                  element={
                    <UserProvider>
                      <UserRoutes />
                    </UserProvider>
                  }
                />
              </Route>
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Fragment>
      </AuthProvider>
    </Router>
  );
}
