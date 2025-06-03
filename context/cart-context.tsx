"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import type { Product } from "@/app/(tabs)/store"

interface CartItem {
  product: Product
  quantity: number
  size?: string
}

interface CartContextType {
  items: CartItem[]
  addToCart: (product: Product, size?: string) => void
  removeFromCart: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  totalItems: number
  totalPrice: number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([])
  const [totalItems, setTotalItems] = useState(0)
  const [totalPrice, setTotalPrice] = useState(0)

  useEffect(() => {
    // Calculate totals whenever items change
    const itemCount = items.reduce((total, item) => total + item.quantity, 0)
    const price = items.reduce((total, item) => total + item.product.price * item.quantity, 0)

    setTotalItems(itemCount)
    setTotalPrice(price)
  }, [items])

  const addToCart = (product: Product, size?: string) => {
    setItems((prevItems) => {
      // Check if product already exists in cart
      const existingItemIndex = prevItems.findIndex((item) => item.product.id === product.id && item.size === size)

      if (existingItemIndex !== -1) {
        // Update quantity if product exists
        const updatedItems = [...prevItems]
        updatedItems[existingItemIndex].quantity += 1
        return updatedItems
      } else {
        // Add new item if product doesn't exist
        return [...prevItems, { product, quantity: 1, size }]
      }
    })
  }

  const removeFromCart = (productId: string) => {
    setItems((prevItems) => prevItems.filter((item) => item.product.id !== productId))
  }

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId)
      return
    }

    setItems((prevItems) => prevItems.map((item) => (item.product.id === productId ? { ...item, quantity } : item)))
  }

  const clearCart = () => {
    setItems([])
  }

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider")
  }
  return context
}
