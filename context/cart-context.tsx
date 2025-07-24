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
}

const CartContext = createContext<CartContextType | undefined>(undefined)

const CART_STORAGE_PREFIX = "@rewards_cart_user_"

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const saveTimeoutRef = useRef<number | null>(null)
  const isMountedRef = useRef(true)
  // Removed isInitializedRef, as its logic can be handled by currentUserId and forceReload more reliably.

  // Get userId from user store
  const userId = useUserStore((state) => state.userId)

  // Get the user-specific storage key
  const getStorageKey = useCallback(
    (userIdParam?: string | null) => {
      const targetUserId = userIdParam ?? userId
      return targetUserId ? `${CART_STORAGE_PREFIX}${targetUserId}` : null
    },
    [userId],
  )

  // Save cart to storage for current user
  // Added an 'immediate' flag to bypass debounce for critical saves
  const saveCartToStorage = useCallback(async (immediate: boolean = false) => {
    const storageKey = getStorageKey()

    if (!storageKey) {
      console.log("⚠️ No user logged in, cart will not be persisted.")
      return
    }

    // Clear any existing debounce timeout if we're performing an immediate save
    if (immediate && saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
      saveTimeoutRef.current = null
      console.log("⏱️ Cleared pending debounced save for immediate operation.")
    }

    try {
      console.log(`💾 ${immediate ? "Immediately " : "Debounced "}saving cart to storage for user:`, userId, "Items:", items.length)
      await AsyncStorage.setItem(storageKey, JSON.stringify(items))
      console.log("✅ Cart saved successfully.")
    } catch (error) {
      console.error("❌ Error saving cart to storage:", error)
    }
  }, [getStorageKey, items, userId]) // Dependencies for saveCartToStorage

  // Load cart from storage for specific user
  const loadCartFromStorage = useCallback(
    async (userIdParam?: string | null, forceReload = false) => {
      const storageKey = getStorageKey(userIdParam)
      const targetUserId = userIdParam ?? userId

      console.log("📱 Loading cart from storage:", { storageKey, targetUserId, forceReload })

      // If no storage key (no user logged in), clear cart state and finish loading
      if (!storageKey) {
        console.log("📭 No user logged in, starting with empty cart.")
        if (isMountedRef.current) {
          setItems([])
          setIsLoading(false)
          setCurrentUserId(null) // Ensure currentUserId is null if no user
        }
        return
      }

      // Optimization: If user hasn't changed, it's not a forced reload, and we already have items,
      // skip reloading. This needs to be carefully managed with `currentUserId`.
      if (!forceReload && currentUserId === targetUserId && items.length > 0 && !isLoading) {
        console.log("📋 Cart already loaded for this user and not forced, skipping redundant reload.")
        setIsLoading(false) // Ensure loading is false
        return
      }

      try {
        if (isMountedRef.current) {
          setIsLoading(true)
        }
        const storedCart = await AsyncStorage.getItem(storageKey)

        if (storedCart && isMountedRef.current) {
          const parsedCart = JSON.parse(storedCart)
          console.log("✅ Loaded cart from storage:", parsedCart)
          setItems(parsedCart)
        } else if (isMountedRef.current) {
          console.log("📭 No cart found for user or empty storage, starting with empty cart.")
          setItems([])
        }
      } catch (error) {
        console.error("❌ Error loading cart from storage:", error)
        if (isMountedRef.current) {
          setItems([]) // Ensure cart is empty on error
        }
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false)
          setCurrentUserId(targetUserId) // Update currentUserId after load attempt
        }
      }
    },
    [getStorageKey, userId, currentUserId, items.length, isLoading], // Added isLoading to dependencies
  )


  // --- Effects for Lifecycle and User Changes ---

  // Effect to handle user ID changes:
  // When userId from the store changes, or when the component mounts and userId is initially set,
  // we treat it as a potential user change and force a cart reload for the new user.
  useEffect(() => {
    // Only proceed if userId is stable and differs from currentUserId, or if it's the initial load for a user.
    if (userId !== currentUserId) {
      console.log("👤 User ID changed or initial load. From:", currentUserId, "To:", userId)
      // Clear any pending debounced save from the previous user's session
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
        saveTimeoutRef.current = null
      }
      loadCartFromStorage(userId, true) // Always force reload for a new user context
    }
  }, [userId, currentUserId, loadCartFromStorage]) // Dependencies: userId, currentUserId, loadCartFromStorage


  // Effect for initial component mount/unmount cleanup:
  useEffect(() => {
    console.log("🚀 CartProvider mounted.")
    // This effect handles the initial load when the component first mounts.
    // The `userId` dependency ensures it reacts if `userId` is initially null and then populated.
    // The `loadCartFromStorage` also has logic to handle `null` userId.
    if (userId !== undefined) { // Ensure userId is available before attempting initial load
        loadCartFromStorage(userId, true);
    }

    return () => {
      console.log("🛑 CartProvider unmounted. Cleaning up.")
      isMountedRef.current = false
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [userId]) // Run once on mount and if userId changes (initial load case)

  // Effect to debounce saving cart to storage whenever 'items' change
  useEffect(() => {
    // Only schedule a save if not currently loading and component is mounted.
    // This prevents saving an incomplete cart during a load operation.
    if (!isLoading && isMountedRef.current) {
      console.log("💾 Scheduling debounced cart save. Items count:", items.length)

      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }

      saveTimeoutRef.current = setTimeout(() => {
        if (isMountedRef.current) {
          saveCartToStorage(false) // This is the standard debounced save
        }
      }, 300) // Increased debounce to 300ms for more stability
    }
  }, [items, isLoading, saveCartToStorage]) // Dependencies: items, isLoading, saveCartToStorage


  // --- Cart Modification Functions (now async where immediate save is needed) ---

  const refreshCart = useCallback(async () => {
    console.log("🔄 Manual refresh cart initiated. Forcing reload from storage.")
    await loadCartFromStorage(userId, true) // Force reload to ensure latest state from storage
  }, [loadCartFromStorage, userId])

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
    // No immediate save here, debounce handles it for adds.
  }, [])

  const removeFromCart = useCallback(async (id: string) => {
    console.log("🗑️ Removing item completely from cart:", id)
    setItems((prevItems) => {
      const newItems = prevItems.filter((item) => item.id !== id)
      console.log("✅ Item completely removed, new cart:", newItems)
      return newItems
    })
    // Crucial: Immediately save the changes after a complete item removal
    await saveCartToStorage(true)
  }, [saveCartToStorage]) // saveCartToStorage is now a dependency

  const removeOneFromCart = useCallback(async (id: string) => {
    console.log("➖ Removing one quantity from cart item:", id)
    let itemWasFullyRemoved = false // Flag to track if quantity drops to 0
    setItems((prevItems) => {
      const newItems = prevItems
        .map((item) => {
          if (item.id === id) {
            const updatedItem = { ...item, quantity: item.quantity - 1 }
            if (updatedItem.quantity <= 0) {
              itemWasFullyRemoved = true // Mark for immediate save if item is fully removed
            }
            return updatedItem
          }
          return item
        })
        .filter((item) => item.quantity > 0) // Filter out items with quantity <= 0
      console.log("✅ Quantity decremented, new cart:", newItems)
      return newItems
    })
    // Conditionally save immediately if an item was completely removed (quantity dropped to 0)
    if (itemWasFullyRemoved) {
      await saveCartToStorage(true)
    }
  }, [saveCartToStorage]) // saveCartToStorage is now a dependency

  const updateQuantity = useCallback(
    async (id: string, quantity: number) => {
      console.log("🔄 Updating quantity of item:", id, "to", quantity)
      if (quantity <= 0) {
        // If quantity is 0 or less, delegate to removeFromCart (which will trigger an immediate save)
        await removeFromCart(id)
        return // IMPORTANT: Return to prevent further setItems call in this function
      }
      setItems((prevItems) => {
        const newItems = prevItems.map((item) => (item.id === id ? { ...item, quantity } : item))
        console.log("✅ Quantity updated, new cart:", newItems)
        return newItems
      })
      // For simple quantity updates (not resulting in removal), the debounced save will handle persistence.
    },
    [removeFromCart], // removeFromCart is a dependency
  )

  const clearCart = useCallback(async () => {
    console.log("🧹 Clearing cart completely.")

    // Clear state immediately
    setItems([])

    // Clear AsyncStorage for current user IMMEDIATELY (no debounce needed for full clear)
    const storageKey = getStorageKey()
    if (storageKey) {
      try {
        await AsyncStorage.removeItem(storageKey)
        console.log("✅ Cart cleared from storage for user:", userId)
      } catch (error) {
        console.error("❌ Error clearing cart from storage:", error)
      }
    }
    console.log("✅ Cart cleared successfully.")
  }, [getStorageKey, userId])

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

  // Calculate totals reactively
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
  const totalPoints = items.reduce((sum, item) => sum + item.points_required * item.quantity, 0)

  // Debug logging for state changes (for development, consider removing in production)
  useEffect(() => {
    console.log("🛒 Cart state updated (render cycle):", {
      itemsCount: items.length,
      totalItems,
      totalPoints,
      isLoading,
      currentUserId, // Use currentUserId to track loaded user
      userId,        // User ID from store
      items: items.map((item) => ({
        id: item.id,
        title: item.title,
        quantity: item.quantity,
        points: item.points_required,
      })),
    })
  }, [items, totalItems, totalPoints, isLoading, userId, currentUserId])

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