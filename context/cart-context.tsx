"use client"

import type React from "react"
import { createContext, useContext, useState, useCallback, useEffect, useRef } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"

export interface CartItem {
  id: string
  title: string
  description: string
  points_required: number
  category?: string
  image_url?: string
  quantity: number
}

interface CartContextType {
  items: CartItem[]
  totalItems: number
  totalPoints: number
  addToCart: (reward: Omit<CartItem, "quantity">) => void
  removeFromCart: (id: string) => void
  removeOneFromCart: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: () => Promise<void>
  isInCart: (id: string) => boolean
  getItemQuantity: (id: string) => number
  isLoading: boolean
  refreshCart: () => Promise<void>
}

const CartContext = createContext<CartContextType | undefined>(undefined)

const CART_STORAGE_KEY = "@rewards_cart"

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const saveTimeoutRef = useRef<number | null>(null)

  const isMountedRef = useRef(true)

  // Load cart from storage on mount
  useEffect(() => {
    loadCartFromStorage()

    return () => {
      isMountedRef.current = false
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])

  // Save cart to storage whenever items change (but only after loading is complete)
  useEffect(() => {
    if (!isLoading && isMountedRef.current) {
      // Debounce the save operation
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }

      saveTimeoutRef.current = setTimeout(() => {
        if (isMountedRef.current) {
          saveCartToStorage()
        }
      }, 100)
    }
  }, [items, isLoading])

  const loadCartFromStorage = async () => {
    try {
      const storedCart = await AsyncStorage.getItem(CART_STORAGE_KEY)
      if (storedCart && isMountedRef.current) {
        const parsedCart = JSON.parse(storedCart)
        setItems(parsedCart)
      } else {
        setItems([])
      }
    } catch (error) {
      console.error("❌ Error loading cart from storage:", error)
      setItems([])
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false)
      }
    }
  }

  const saveCartToStorage = async () => {
    try {
      console.log("💾 Saving cart to storage:", items)
      await AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items))
    } catch (error) {
      console.error("❌ Error saving cart to storage:", error)
    }
  }

  const refreshCart = useCallback(async () => {
    console.log("🔄 Refreshing cart...")
    setIsLoading(true)
    await loadCartFromStorage()
  }, [])

  const addToCart = useCallback((reward: Omit<CartItem, "quantity">) => {
    console.log("➕ Adding to cart:", reward.title)
    setItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.id === reward.id)

      if (existingItem) {
        const updatedItems = prevItems.map((item) =>
          item.id === reward.id ? { ...item, quantity: item.quantity + 1 } : item,
        )
        console.log("✅ Updated existing item, new cart:", updatedItems)
        return updatedItems
      } else {
        const newItems = [...prevItems, { ...reward, quantity: 1 }]
        console.log("✅ Added new item, new cart:", newItems)
        return newItems
      }
    })
  }, [])

  const removeFromCart = useCallback((id: string) => {
    console.log("🗑️ Removing from cart:", id)
    setItems((prevItems) => {
      const newItems = prevItems.filter((item) => item.id !== id)
      console.log("✅ Item removed, new cart:", newItems)
      return newItems
    })
  }, [])

  const removeOneFromCart = useCallback((id: string) => {
    console.log("➖ Removing one from cart:", id)
    setItems((prevItems) => {
      const newItems = prevItems
        .map((item) => {
          if (item.id === id) {
            return { ...item, quantity: item.quantity - 1 }
          }
          return item
        })
        .filter((item) => item.quantity > 0)
      console.log("✅ Removed one, new cart:", newItems)
      return newItems
    })
  }, [])

  const updateQuantity = useCallback(
    (id: string, quantity: number) => {
      console.log("🔄 Updating quantity:", id, quantity)
      if (quantity <= 0) {
        removeFromCart(id)
        return
      }

      setItems((prevItems) => {
        const newItems = prevItems.map((item) => (item.id === id ? { ...item, quantity } : item))
        console.log("✅ Quantity updated, new cart:", newItems)
        return newItems
      })
    },
    [removeFromCart],
  )

  const clearCart = useCallback(async () => {
    console.log("🧹 Clearing cart...")

    // Clear state immediately
    setItems([])

    // Clear AsyncStorage
    try {
      await AsyncStorage.removeItem(CART_STORAGE_KEY)
      console.log("✅ Cart cleared from storage")
    } catch (error) {
      console.error("❌ Error clearing cart from storage:", error)
    }

    console.log("✅ Cart cleared successfully")
  }, [])

  const isInCart = useCallback(
    (id: string) => {
      const inCart = items.some((item) => item.id === id)
      return inCart
    },
    [items],
  )

  const getItemQuantity = useCallback(
    (id: string) => {
      const item = items.find((item) => item.id === id)
      const quantity = item ? item.quantity : 0
      return quantity
    },
    [items],
  )

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
  const totalPoints = items.reduce((sum, item) => sum + item.points_required * item.quantity, 0)

  const value: CartContextType = {
    items,
    totalItems,
    totalPoints,
    addToCart,
    removeFromCart,
    removeOneFromCart,
    updateQuantity,
    clearCart,
    isInCart,
    getItemQuantity,
    isLoading,
    refreshCart,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export const useCart = () => {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider")
  }
  return context
}
