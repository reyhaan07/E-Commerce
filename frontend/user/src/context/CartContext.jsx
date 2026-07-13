import React, { createContext, useContext, useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { apiRequest } from '../api/client'

const CartContext = createContext(null)
const STORAGE_KEY = 'user_cart'

function loadCart() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY))
    return Array.isArray(raw) ? raw : []
  } catch (e) {
    return []
  }
}

export function CartProvider({ children }) {
  const { user } = useAuth()
  const [items, setItems] = useState(loadCart)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }, [items])

  // once someone logs in, whatever cart they had saved on the server
  // becomes the source of truth instead of the guest cart in localStorage
  useEffect(() => {
    if (!user) return
    apiRequest(`/users/${user.id}/cart`)
      .then((data) => {
        setItems(data.cart.map((i) => ({
          id: i.productId,
          name: i.name,
          price: i.price,
          image: i.image,
          quantity: i.qty,
        })))
      })
      .catch(() => {})
  }, [user])

  // push cart changes to the server so it's there next time they log in
  useEffect(() => {
    if (!user) return
    apiRequest(`/users/${user.id}/cart`, {
      method: 'PUT',
      body: JSON.stringify({
        items: items.map((i) => ({
          productId: i.id,
          name: i.name,
          price: i.price,
          image: i.image,
          qty: i.quantity,
        })),
      }),
    }).catch(() => {})
  }, [items, user])

  function addItem(product, qty = 1) {
    setItems((current) => {
      const existing = current.find((i) => i.id === product.id)
      if (existing) {
        return current.map((i) => (i.id === product.id ? { ...i, quantity: i.quantity + qty } : i))
      }
      return [...current, {
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        quantity: qty,
      }]
    })
  }

  function updateQuantity(id, quantity) {
    if (quantity < 1) return
    setItems((current) => current.map((i) => (i.id === id ? { ...i, quantity } : i)))
  }

  function removeItem(id) {
    setItems((current) => current.filter((i) => i.id !== id))
  }

  function clearCart() {
    setItems([])
  }

  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0)

  return (
    <CartContext.Provider value={{ items, addItem, updateQuantity, removeItem, clearCart, itemCount }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within a CartProvider')
  return ctx
}
