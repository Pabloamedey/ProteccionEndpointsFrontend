import { Routes, Route, Navigate } from "react-router-dom";
import ProductsView from "./ProductsView.jsx";
import ProductForm from "./ProductForm.jsx";

export default function ProductsIndex() {
  return (
    <Routes>
      <Route index element={<ProductsView />} />
      <Route path="nuevo" element={<ProductForm />} />
      <Route path="editar/:id" element={<ProductForm />} />
      <Route path="*" element={<Navigate to="/productos" replace />} />
    </Routes>
  );
}
