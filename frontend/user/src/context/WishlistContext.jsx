import React, { createContext, useContext, useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { apiRequest } from '../api/client'

const WishlistContext = createContext(null)

export function WishlistProvider({ children }) {
  const { user } = useAuth()
  const [items, setItems] = useState([])

  useEffect(() => {
    if (!user) {
      setItems([])
      return
    }
    apiRequest(`/users/${user.id}/wishlist`)
      .then((data) => setItems(data.wishlist))
      .catch(() => {})
  }, [user])

  function isWishlisted(productId) {
    return items.some((i) => i.productId === String(productId))
  }

  async function addItem(product) {
    if (!user) return
    const data = await apiRequest(`/users/${user.id}/wishlist`, {
      method: 'POST',
      body: JSON.stringify({
        productId: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
      }),
    })
    setItems(data.wishlist)
  }

  async function removeItem(productId) {
    if (!user) return
    const data = await apiRequest(`/users/${user.id}/wishlist/${encodeURIComponent(productId)}`, {
      method: 'DELETE',
    })
    setItems(data.wishlist)
  }

  return (
    <WishlistContext.Provider value={{ items, isWishlisted, addItem, removeItem }}>
      {children}
    </WishlistContext.Provider>
  )
}

export function useWishlist() {
  const ctx = useContext(WishlistContext)
  if (!ctx) throw new Error('useWishlist must be used within a WishlistProvider')
  return ctx
}
