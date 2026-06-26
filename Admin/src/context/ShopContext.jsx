import React, { createContext, useContext, useState, useMemo } from "react";
import { products as allProducts } from "../data/dummyData";

const ShopContext = createContext(null);

export function ShopProvider({ children }) {
  const [cart, setCart] = useState([
    { ...allProducts[0], qty: 1 },
    { ...allProducts[3], qty: 2 },
  ]);
  const [wishlist, setWishlist] = useState([allProducts[2], allProducts[7], allProducts[11]]);

  const addToCart = (product, qty = 1) => {
    setCart((prev) => {
      const existing = prev.find((p) => p.id === product.id);
      if (existing) {
        return prev.map((p) =>
          p.id === product.id ? { ...p, qty: p.qty + qty } : p
        );
      }
      return [...prev, { ...product, qty }];
    });
  };

  const removeFromCart = (id) => setCart((prev) => prev.filter((p) => p.id !== id));

  const updateQty = (id, qty) => {
    if (qty < 1) return;
    setCart((prev) => prev.map((p) => (p.id === id ? { ...p, qty } : p)));
  };

  const toggleWishlist = (product) => {
    setWishlist((prev) => {
      const exists = prev.find((p) => p.id === product.id);
      if (exists) return prev.filter((p) => p.id !== product.id);
      return [...prev, product];
    });
  };

  const isWishlisted = (id) => wishlist.some((p) => p.id === id);

  const cartCount = useMemo(() => cart.reduce((sum, item) => sum + item.qty, 0), [cart]);
  const cartTotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.qty, 0),
    [cart]
  );

  return (
    <ShopContext.Provider
      value={{
        cart,
        wishlist,
        addToCart,
        removeFromCart,
        updateQty,
        toggleWishlist,
        isWishlisted,
        cartCount,
        cartTotal,
      }}
    >
      {children}
    </ShopContext.Provider>
  );
}

export const useShop = () => useContext(ShopContext);
