import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { apiRequest } from '../api/client'

const CartContext = createContext(null)
const STORAGE_KEY = 'user_cart'

function loadCart() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY))
    return Array.isArray(raw) ? raw : []
  } catch {
    return []
  }
}

export function CartProvider({ children }) {
  const { user } = useAuth()
  const [items, setItems] = useState(loadCart)
  // id of the user whose server cart has been loaded; until then local items
  // (a guest cart, or the previous account's) must not be pushed over it
  const loadedFor = useRef(null)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }, [items])

  // once someone logs in, whatever cart they had saved on the server
  // becomes the source of truth instead of the guest cart in localStorage
  useEffect(() => {
    loadedFor.current = null
    if (!user) return
    apiRequest(`/users/${user.id}/cart`)
      .then((data) => {
        loadedFor.current = user.id
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
    if (!user || loadedFor.current !== user.id) return
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

  const HIGH_VALUE_THRESHOLD = 25000;
  const HIGH_VALUE_MAX_QTY = 1;
  const MAX_QTY_PER_ITEM = 5;

  function addItem(product, qty = 1) {
    const isHighVal = Number(product.price || 0) >= HIGH_VALUE_THRESHOLD;
    const maxAllowed = isHighVal ? HIGH_VALUE_MAX_QTY : MAX_QTY_PER_ITEM;

    setItems((current) => {
      const existing = current.find((i) => i.id === product.id)
      if (existing) {
        return current.map((i) => (i.id === product.id ? { ...i, quantity: Math.min(maxAllowed, i.quantity + qty) } : i))
      }
      return [...current, {
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        quantity: Math.min(maxAllowed, qty),
      }]
    })
  }

  function updateQuantity(id, quantity) {
    if (quantity < 1) return
    setItems((current) => current.map((i) => {
      if (i.id !== id) return i;
      const isHighVal = Number(i.price || 0) >= HIGH_VALUE_THRESHOLD;
      const maxAllowed = isHighVal ? HIGH_VALUE_MAX_QTY : MAX_QTY_PER_ITEM;
      return { ...i, quantity: Math.min(maxAllowed, quantity) };
    }))
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
