import { apiRequest } from './client';

// Maps an API product to the shape ProductCard renders.
export function toCardProduct(p) {
  return {
    id: p.id,
    name: p.name,
    price: p.price,
    oldPrice: p.oldPrice,
    discount: p.discount || null,
    rating: Math.round(p.rating || 0),
    reviews: p.ratingCount || 0,
    isNew: p.isNewArrival,
    category: p.category,
    image: p.images?.[0],
    stock: p.stock,
  };
}

// params: { q, category, minPrice, maxPrice, minRating, sort, page, limit }
export async function listProducts(params = {}) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') query.set(key, value);
  }
  const data = await apiRequest(`/products?${query.toString()}`);
  return { products: data.products, pagination: data.pagination };
}

export async function getProduct(id) {
  // returns { product, seller, related, reviews: { items, average, count, distribution } }
  return apiRequest(`/products/${encodeURIComponent(id)}`);
}

export async function getCategories() {
  const data = await apiRequest('/products/categories');
  return data.categories;
}

// Full Category → Subcategory → Product Type tree with live counts.
export async function getCategoryTree() {
  const data = await apiRequest('/products/categories');
  return data.tree;
}
