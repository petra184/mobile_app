"use client"
import type React from "react"
import { createContext, useContext, useState, useCallback, useEffect, useRef } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { useUserStore } from "@/hooks/userStore"

export interface CartItem {
  id: string
  title: string
  description: string
  points_required: number
  category?: string
  image_url?: string
  quantity: number
  item_type?: "reward" | "special_offer"
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
  refreshTrigger: number // Add this
}

const CartContext = createContext<CartContextType | undefined>(undefined)
const CART_STORAGE_PREFIX = "@rewards_cart_user_"

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const saveTimeoutRef = useRef<number | null>(null)
  const isMountedRef = useRef(true)
  const isInitializedRef = useRef(false)

  const userId = useUserStore((state) => state.userId)

  // Get storage key for current user
  const getStorageKey = useCallback(() => {
    return userId ? `${CART_STORAGE_PREFIX}${userId}` : null
  }, [userId])

  // Save cart to storage (debounced)
  const saveCartToStorage = useCallback(
    async (immediate = false) => {
      const storageKey = getStorageKey()
      if (!storageKey || !isMountedRef.current) return

      const performSave = async () => {
        try {
          await AsyncStorage.setItem(storageKey, JSON.stringify(items))
          console.log("✅ Cart saved to storage")
        } catch (error) {
          console.error("❌ Error saving cart:", error)
        }
      }

      if (immediate) {
        // Clear any pending save
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current)
          saveTimeoutRef.current = null
        }
        await performSave()
      } else {
        // Debounced save
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current)
        }
        saveTimeoutRef.current = setTimeout(performSave, 500)
      }
    },
    [items, getStorageKey],
  )

  // Load cart from storage
  const loadCartFromStorage = useCallback(async () => {
    const storageKey = getStorageKey()

    if (!storageKey) {
      setItems([])
      setIsLoading(false)
      setCurrentUserId(null)
      return
    }

    // Skip if already loaded for this user
    if (currentUserId === userId && isInitializedRef.current) {
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      const storedCart = await AsyncStorage.getItem(storageKey)

      if (storedCart && isMountedRef.current) {
        const parsedCart = JSON.parse(storedCart)
        setItems(parsedCart)
        console.log("✅ Cart loaded from storage:", parsedCart.length, "items")
      } else {
        setItems([])
        console.log("📭 No stored cart found, starting empty")
      }

      setCurrentUserId(userId)
      isInitializedRef.current = true
    } catch (error) {
      console.error("❌ Error loading cart:", error)
      setItems([])
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false)
      }
    }
  }, [userId, currentUserId, getStorageKey])

  // Initialize cart when user changes
  useEffect(() => {
    if (userId !== currentUserId) {
      console.log("👤 User changed, loading cart for:", userId)
      isInitializedRef.current = false
      loadCartFromStorage()
    }
  }, [userId, currentUserId, loadCartFromStorage])

  // Save cart when items change (but not during loading)
  useEffect(() => {
    if (!isLoading && isInitializedRef.current && isMountedRef.current) {
      saveCartToStorage(false)
    }
  }, [items, isLoading, saveCartToStorage])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])

  const triggerUpdate = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1)
  }, [])

  // Cart operations
  const addToCart = useCallback(
    (reward: Omit<CartItem, "quantity">) => {
      console.log("➕ Adding to cart:", reward.title)
      setItems((prevItems) => {
        const existingItem = prevItems.find((item) => item.id === reward.id)
        if (existingItem) {
          return prevItems.map((item) => (item.id === reward.id ? { ...item, quantity: item.quantity + 1 } : item))
        }
        return [...prevItems, { ...reward, quantity: 1 }]
      })
      triggerUpdate() // Trigger update across all consumers
    },
    [triggerUpdate],
  )

  const removeFromCart = useCallback(
    (id: string) => {
      console.log("🗑️ Removing item from cart:", id)
      setItems((prevItems) => prevItems.filter((item) => item.id !== id))
      triggerUpdate() // Trigger update across all consumers
    },
    [triggerUpdate],
  )

  const removeOneFromCart = useCallback(
    (id: string) => {
      console.log("➖ Removing one from cart:", id)
      setItems((prevItems) => {
        return prevItems.reduce((acc, item) => {
          if (item.id === id) {
            if (item.quantity > 1) {
              acc.push({ ...item, quantity: item.quantity - 1 })
            }
            // If quantity is 1, don't add it back (effectively removes it)
          } else {
            acc.push(item)
          }
          return acc
        }, [] as CartItem[])
      })
      triggerUpdate() // Trigger update across all consumers
    },
    [triggerUpdate],
  )

  const updateQuantity = useCallback(
    (id: string, quantity: number) => {
      console.log("🔄 Updating quantity:", id, "to", quantity)
      if (quantity <= 0) {
        removeFromCart(id)
        return
      }

      setItems((prevItems) => prevItems.map((item) => (item.id === id ? { ...item, quantity } : item)))
      triggerUpdate() // Trigger update across all consumers
    },
    [removeFromCart, triggerUpdate],
  )

  const clearCart = useCallback(async () => {
    console.log("🧹 Clearing cart")
    setItems([])

    const storageKey = getStorageKey()
    if (storageKey) {
      try {
        await AsyncStorage.removeItem(storageKey)
        console.log("✅ Cart cleared from storage")
      } catch (error) {
        console.error("❌ Error clearing cart storage:", error)
      }
    }
    triggerUpdate() // Trigger update across all consumers
  }, [getStorageKey, triggerUpdate])

  const refreshCart = useCallback(async () => {
    console.log("🔄 Refreshing cart")
    isInitializedRef.current = false
    await loadCartFromStorage()
  }, [loadCartFromStorage])

  const isInCart = useCallback(
    (id: string) => {
      return items.some((item) => item.id === id)
    },
    [items],
  )

  const getItemQuantity = useCallback(
    (id: string) => {
      const item = items.find((item) => item.id === id)
      return item ? item.quantity : 0
    },
    [items],
  )

  // Calculate totals
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
    refreshTrigger, // Add this to force re-renders
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
