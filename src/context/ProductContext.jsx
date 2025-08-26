// Contexto de productos
// - Maneja CRUD de productos
// - Usa token en headers (verifyToken / isAdmin)
// - Se conecta a /api/products del backend

import { createContext, useState, useEffect, useContext } from "react";
import axios from "axios";

export const ProductContext = createContext();

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api/products";

// helper para armar headers con token
function authHeaders() {
  const token = localStorage.getItem("token");
  return {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  };
}

export const ProductProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);

  // GET todos los productos
  const getProducts = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(BASE_URL, authHeaders());
      setProducts(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // POST nuevo producto
  const addProduct = async (newProduct) => {
    setLoading(true);
    try {
      const { data } = await axios.post(BASE_URL, newProduct, authHeaders());
      setProducts((prev) => [...prev, data]);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // PUT editar producto
  const editProduct = async (id, updated) => {
    setLoading(true);
    try {
      const { data } = await axios.put(`${BASE_URL}/${id}`, updated, authHeaders());
      setProducts((prev) => prev.map((p) => (p.id === id ? data : p)));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // DELETE producto
  const deleteProduct = async (id) => {
    try {
      await axios.delete(`${BASE_URL}/${id}`, authHeaders());
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (e) {
      setError(e.message);
    }
  };

  useEffect(() => {
    getProducts();
  }, []);

  return (
    <ProductContext.Provider
      value={{
        products,
        loading,
        error,
        getProducts,
        addProduct,
        editProduct,
        deleteProduct
      }}
    >
      {children}
    </ProductContext.Provider>
  );
};

// custom hook
export const useProductContext = () => useContext(ProductContext);
