"use client";

import { useEffect, useState } from "react";
import { Client, Databases, ID } from "appwrite";

// ✅ Initialize Appwrite client
const client = new Client()
  .setEndpoint("https://nyc.cloud.appwrite.io/v1")
  .setProject("68f850730006c4578258");

const databases = new Databases(client);

const DATABASE_ID = "68f8530b003098352d0a";
const COLLECTION_ID = "68f85a6b0015f3a041a7";

interface Product {
  $id: string;
  name: string;
  price: number;
  description?: string;
  category?: string;
  inStock: boolean;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [newProduct, setNewProduct] = useState<Omit<Product, "$id">>({
    name: "",
    price: 0,
    description: "",
    category: "",
    inStock: true,
  });
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // 🔹 Fetch all products
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await databases.listDocuments(DATABASE_ID, COLLECTION_ID);
      const mapped: Product[] = res.documents.map((doc: any) => ({
        $id: doc.$id,
        name: doc.name,
        price: doc.price,
        description: doc.description,
        category: doc.category,
        inStock: doc.inStock,
      }));
      setProducts(mapped);
    } catch (err) {
      console.error(err);
      setError("❌ Failed to fetch products.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // 🔹 Add a new product
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await databases.createDocument(DATABASE_ID, COLLECTION_ID, ID.unique(), newProduct);
      setNewProduct({ name: "", price: 0, description: "", category: "", inStock: true });
      fetchProducts();
    } catch (err) {
      console.error(err);
      setError("❌ Failed to add product.");
    }
  };

  // 🔹 Update product
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    try {
      await databases.updateDocument(DATABASE_ID, COLLECTION_ID, editingProduct.$id, editingProduct);
      setEditingProduct(null);
      fetchProducts();
    } catch (err) {
      console.error(err);
      setError("❌ Failed to update product.");
    }
  };

  // 🔹 Delete product
  const handleDelete = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    try {
      await databases.deleteDocument(DATABASE_ID, COLLECTION_ID, id);
      fetchProducts();
    } catch (err) {
      console.error(err);
      setError("❌ Failed to delete product.");
    }
  };

  // ✅ Helper to safely display number values
  const safePrice = (price: number | undefined) => (isNaN(price ?? 0) ? "" : String(price));

  return (
    <div className="page-container">
      <h1 className="title">🛒 Product Manager</h1>

      <form
        onSubmit={editingProduct ? handleUpdate : handleAdd}
        className="form-container"
      >
        <h2>{editingProduct ? "✏️ Edit Product" : "➕ Add New Product"}</h2>

        <div className="form-grid">
          {/* Product Name */}
          <input
            type="text"
            placeholder="Product Name"
            value={editingProduct ? editingProduct.name : newProduct.name}
            onChange={(e) =>
              editingProduct
                ? setEditingProduct({ ...editingProduct, name: e.target.value })
                : setNewProduct({ ...newProduct, name: e.target.value })
            }
            required
          />

          {/* Price Field with Label */}
          <div className="price-group">
            <label htmlFor="price" className="price-label">Price:</label>
            <input
              id="price"
              type="number"
              placeholder="0.00"
              value={editingProduct ? safePrice(editingProduct.price) : safePrice(newProduct.price)}
              onChange={(e) =>
                editingProduct
                  ? setEditingProduct({
                      ...editingProduct,
                      price: parseFloat(e.target.value) || 0,
                    })
                  : setNewProduct({
                      ...newProduct,
                      price: parseFloat(e.target.value) || 0,
                    })
              }
              required
            />
          </div>

          {/* Category */}
          <input
            type="text"
            placeholder="Category"
            value={editingProduct ? editingProduct.category : newProduct.category}
            onChange={(e) =>
              editingProduct
                ? setEditingProduct({ ...editingProduct, category: e.target.value })
                : setNewProduct({ ...newProduct, category: e.target.value })
            }
          />

          {/* In Stock Checkbox */}
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={editingProduct ? editingProduct.inStock : newProduct.inStock}
              onChange={(e) =>
                editingProduct
                  ? setEditingProduct({
                      ...editingProduct,
                      inStock: e.target.checked,
                    })
                  : setNewProduct({
                      ...newProduct,
                      inStock: e.target.checked,
                    })
              }
            />
            In Stock
          </label>
        </div>

        {/* Description */}
        <textarea
          placeholder="Description"
          rows={3}
          value={editingProduct ? editingProduct.description : newProduct.description}
          onChange={(e) =>
            editingProduct
              ? setEditingProduct({ ...editingProduct, description: e.target.value })
              : setNewProduct({ ...newProduct, description: e.target.value })
          }
        />

        {/* Buttons */}
        <div className="button-row">
          <button
            type="submit"
            className={editingProduct ? "btn-warning" : "btn-primary"}
          >
            {editingProduct ? "Update Product" : "Add Product"}
          </button>

          {editingProduct && (
            <button
              type="button"
              onClick={() => setEditingProduct(null)}
              className="btn-secondary"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {error && <p className="error-text">{error}</p>}

      <h2 className="subtitle">🧾 Product List</h2>

      {loading ? (
        <p className="loading">Loading...</p>
      ) : products.length === 0 ? (
        <p className="empty">No products found.</p>
      ) : (
        <div className="product-grid">
          {products.map((p) => (
            <div key={p.$id} className="product-card">
              <h3>{p.name}</h3>
              <p className="price">₱{p.price.toFixed(2)}</p>
              <p className="category">{p.category || "Uncategorized"}</p>
              <p>{p.description || "No description provided."}</p>
              <p className={p.inStock ? "instock" : "outstock"}>
                {p.inStock ? "✅ In Stock" : "❌ Out of Stock"}
              </p>

              <div className="card-buttons">
                <button onClick={() => setEditingProduct(p)} className="btn-warning">
                  Edit
                </button>
                <button onClick={() => handleDelete(p.$id)} className="btn-danger">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
