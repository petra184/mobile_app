"use client"

import type React from "react"
import { useState, useCallback, useEffect } from "react"
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, Alert } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Feather } from "@expo/vector-icons"
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router"
import { colors } from "@/constants/colors"
import { useCart, type CartItem } from "@/context/cart-context"
import { useUserStore } from "@/hooks/userStore"
import { useNotifications } from "@/context/notification-context"
import { supabase } from "@/lib/supabase"
import Animated, { FadeInUp } from "react-native-reanimated"

const RewardsCheckoutScreen: React.FC = () => {
  const router = useRouter()
  const params = useLocalSearchParams()
  const { items, totalItems, totalPoints, updateQuantity, removeFromCart, clearCart, isLoading, refreshCart } =
    useCart()
  const { points, userId, userEmail, redeemPoints } = useUserStore()
  const { showSuccess, showError } = useNotifications()
  const [processing, setProcessing] = useState(false)
  const [screenLoading, setScreenLoading] = useState(true)

  const canAfford = points >= totalPoints
  const hasItems = items.length > 0

  useFocusEffect(
    useCallback(() => {
      console.log("🔄 Checkout screen focused, ensuring cart is loaded...")
      const loadCart = async () => {
        setScreenLoading(true)
        await refreshCart()
        setTimeout(() => {
          setScreenLoading(false)
        }, 100)
      }
      loadCart()
    }, [refreshCart]),
  )

  useEffect(() => {
    if (params.timestamp) {
      console.log("🔄 Checkout screen refreshed with new params:", params)
      refreshCart()
    }
  }, [params, refreshCart])

  useEffect(() => {
    console.log("🛒 Checkout screen - Detailed cart state:", {
      items: items.length,
      itemsArray: items,
      totalItems,
      totalPoints,
      isLoading,
      screenLoading,
      userPoints: points,
      canAfford,
      hasItems,
      userId,
    })
  }, [items, totalItems, totalPoints, isLoading, screenLoading, points, canAfford, hasItems, userId])

  useEffect(() => {
    console.log(
      "🛒 Cart items detailed:",
      items.map((item) => ({
        id: item.id,
        title: item.title,
        quantity: item.quantity,
      })),
    )
  }, [items])

  // --- MODIFIED handleQuantityChange ---
  const handleQuantityChange = useCallback(
    (id: string, change: number) => {
      console.log("🔄 Quantity change requested:", { id, change })

      const item = items.find((item) => item.id === id)
      if (item) {
        const newQuantity = item.quantity + change
        console.log("📊 Quantity calculation:", { currentQuantity: item.quantity, change, newQuantity })

        // The key is to pass the 'newQuantity' to updateQuantity.
        // Your CartProvider's updateQuantity correctly handles quantity <= 0 by calling removeFromCart.
        updateQuantity(id, newQuantity)
      } else {
        console.log("❌ Item not found in cart:", id)
      }
    },
    [items, updateQuantity], // Dependencies for useCallback
  )

  const handleRemoveItem = useCallback(
    (id: string) => {
      console.log("REMOVE THE ITEM VHDVSJKXNC SGVDNK🗑️ Remove item requested (trash icon):", id)
      removeFromCart(id)
    },
    [removeFromCart],
  )
  // --- END handleRemoveItem ---

  const processCheckout = useCallback(async () => {
    setProcessing(true)
    try {
      const {
        data: { session },
        error: authError,
      } = await supabase.auth.getSession()

      if (authError || !session || !session.user) {
        throw new Error("User not authenticated or session not found")
      }

      const accessToken = session.access_token
      const cartSnapshot = [...items]
      const snapshotTotalItems = totalItems
      const snapshotTotalPoints = totalPoints

      console.log("🛒 Processing checkout with items:", cartSnapshot)

      const CHECKOUT_URL = process.env.EXPO_PUBLIC_SUPABASE_CHECKOUT_FUNCTION_URL

      if (!CHECKOUT_URL) {
        throw new Error("Checkout service not configured. Please contact support.")
      }

      const response = await fetch(CHECKOUT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          cartItems: cartSnapshot.map((item) => ({
            id: item.id,
            title: item.title,
            points_required: item.points_required,
            quantity: item.quantity,
            description: item.description,
            image_url: item.image_url,
          })),
          totalPoints: snapshotTotalPoints,
          totalItems: snapshotTotalItems,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Checkout API error:", response.status, errorText)
        throw new Error(`Checkout failed: ${response.status} ${response.statusText}`)
      }

      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error || "Checkout failed")
      }

      console.log("✅ Checkout completed successfully:", result)

      await redeemPoints(snapshotTotalPoints)
      await clearCart()

      showSuccess(
        "Success!",
        `You've successfully redeemed ${snapshotTotalItems} item${
          snapshotTotalItems > 1 ? "s" : ""
        } for ${snapshotTotalPoints} points.${
          result.confirmation_number ? ` Confirmation #${result.confirmation_number}.` : ""
        }`,
      )

      setTimeout(() => {
        router.back()
      }, 1000)
    } catch (error) {
      console.error("❌ Checkout error:", error)
      showError("Purchase Failed", error instanceof Error ? error.message : "Something went wrong. Please try again.")
    } finally {
      setProcessing(false)
    }
  }, [items, totalItems, totalPoints, userEmail, redeemPoints, clearCart, showSuccess, showError, router])

  const handleCheckout = useCallback(async () => {
    if (!userId) {
      Alert.alert("Login Required", "Please log in to complete your order.")
      return
    }
    if (!canAfford) {
      Alert.alert("Insufficient Points", `You need ${totalPoints - points} more points to place this order.`)
      return
    }
    if (!hasItems) {
      Alert.alert("Empty Cart", "Please add some items to your cart before placing the order.")
      return
    }

    Alert.alert(
      "Confirm Order",
      `Are you sure you want to redeem ${totalItems} item${totalItems > 1 ? "s" : ""} for ${totalPoints} points?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Confirm", onPress: processCheckout },
      ],
    )
  }, [userId, canAfford, hasItems, totalItems, totalPoints, points, processCheckout])

  if (isLoading || screenLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading cart...</Text>
        </View>
      </SafeAreaView>
    )
  }

  const renderCartItem = (item: CartItem, index: number) => {
    const itemCanAfford = points >= item.points_required * item.quantity
    const itemIsSpecialOffer = item.item_type === "special_offer" || item.category === "special_offer"

    return (
      <Animated.View key={item.id} entering={FadeInUp.duration(400).delay(index * 100)} style={styles.cartItem}>
        <View style={styles.itemImageContainer}>
          {item.image_url ? (
            <Image source={{ uri: item.image_url }} style={styles.itemImage} resizeMode="cover" />
          ) : (
            <View style={[styles.itemIconWrapper, itemIsSpecialOffer && styles.specialOfferIconWrapper]}>
              <Feather
                name={itemIsSpecialOffer ? "zap" : "gift"}
                size={24}
                color={itemIsSpecialOffer ? "#EF4444" : colors.primary}
              />
            </View>
          )}
        </View>
        <View style={styles.itemInfo}>
          <View style={styles.itemTitleRow}>
            <Text style={styles.itemTitle}>{item.title}</Text>
            {itemIsSpecialOffer && (
              <View style={styles.offerBadge}>
                <Text style={styles.offerBadgeText}>OFFER</Text>
              </View>
            )}
          </View>
          <Text style={styles.itemDescription} numberOfLines={2}>
            {item.description}
          </Text>
          <View style={styles.itemPointsContainer}>
            <Feather name="star" size={14} color={colors.accent} />
            <Text style={styles.itemPoints}>{item.points_required} points each</Text>
          </View>
          {!itemCanAfford && (
            <View style={styles.itemWarning}>
              <Feather name="alert-triangle" size={12} color="#F59E0B" />
              <Text style={styles.itemWarningText}>Insufficient points</Text>
            </View>
          )}
        </View>
        <View style={styles.itemActions}>
          <View style={styles.quantityContainer}>
            <TouchableOpacity
              style={[styles.quantityButton, item.quantity <= 1 && styles.quantityButtonDisabled]}
              onPress={() => handleQuantityChange(item.id, -1)}
              disabled={item.quantity <= 1} // Disable minus button if quantity is 1
            >
              <Feather name="minus" size={16} color={item.quantity <= 1 ? "#999" : colors.primary} />
            </TouchableOpacity>
            <Text style={styles.quantityText}>{item.quantity}</Text>
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => handleQuantityChange(item.id, 1)}
            >
              <Feather name="plus" size={16} color={colors.primary} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => handleRemoveItem(item.id)} // This calls removeFromCart directly
          >
            <Feather name="trash-2" size={16} color="#EF4444" />
          </TouchableOpacity>
          <Text style={[styles.itemTotal, !itemCanAfford && styles.itemTotalWarning]}>
            {(item.points_required * item.quantity).toLocaleString()} pts
          </Text>
        </View>
      </Animated.View>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <Image source={require("../../../IMAGES/crowd.jpg")} style={styles.backgroundImage} />

      {hasItems ? (
        <>
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <Animated.View entering={FadeInUp.duration(500).delay(200)} style={styles.section}>
              <Text style={styles.sectionTitle}>Your Cart ({totalItems} items)</Text>
              {items.map((item, index) => renderCartItem(item, index))}
            </Animated.View>

            <Animated.View entering={FadeInUp.duration(500).delay(400)} style={styles.summarySection}>
              <Text style={styles.sectionTitle}>Points Summary</Text>
              <View style={styles.summaryCard}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Available Points</Text>
                  <Text style={styles.summaryValue}>{points.toLocaleString()}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Total Cost</Text>
                  <Text style={styles.summaryValue}>-{totalPoints.toLocaleString()}</Text>
                </View>
                <View style={[styles.summaryRow, styles.summaryTotal]}>
                  <Text style={styles.summaryTotalLabel}>Remaining Points</Text>
                  <Text style={[styles.summaryTotalValue, !canAfford && styles.insufficientPoints]}>
                    {(points - totalPoints).toLocaleString()}
                  </Text>
                </View>
              </View>
              {!canAfford && (
                <View style={styles.warningContainer}>
                  <Feather name="alert-triangle" size={20} color="#F59E0B" />
                  <Text style={styles.warningText}>
                    You need {(totalPoints - points).toLocaleString()} more points to complete this purchase.
                  </Text>
                </View>
              )}
            </Animated.View>
          </ScrollView>

          <Animated.View entering={FadeInUp.duration(500).delay(600)} style={styles.checkoutContainer}>
            <TouchableOpacity
              style={[styles.checkoutButton, (!canAfford || processing || !hasItems) && styles.checkoutButtonDisabled]}
              onPress={handleCheckout}
              disabled={!canAfford || processing || !hasItems}
            >
              {processing ? (
                <View style={styles.processingContainer}>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                  <Text style={styles.processingText}>Processing...</Text>
                </View>
              ) : (
                <>
                  <Feather name="check-circle" size={20} color="#FFFFFF" />
                  <Text style={styles.checkoutButtonText}>Complete Order ({totalPoints.toLocaleString()} pts)</Text>
                </>
              )}
            </TouchableOpacity>
          </Animated.View>
        </>
      ) : (
        <View style={styles.emptyContainer}>
          <Feather name="shopping-cart" size={64} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptySubtitle}>Add some rewards or special offers to get started!</Text>
          <TouchableOpacity style={styles.shopButton} onPress={() => router.back()}>
            <Text style={styles.shopButtonText}>Continue Shopping</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  )
}

// Styles remain the same
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
    marginTop: -60,
  },
  backgroundImage: {
    position: "absolute",
    bottom: 0,
    resizeMode: "cover",
    opacity: 0.1,
    zIndex: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
  },
  content: {
    flex: 1,
    paddingTop: 20,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 16,
  },
  cartItem: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  itemImageContainer: {
    marginRight: 12,
  },
  itemImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  itemIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary + "20",
    justifyContent: "center",
    alignItems: "center",
  },
  specialOfferIconWrapper: {
    backgroundColor: "#EF444420",
  },
  itemInfo: {
    flex: 1,
    marginRight: 12,
  },
  itemTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    flex: 1,
  },
  offerBadge: {
    backgroundColor: "#EF4444",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  offerBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "white",
  },
  itemDescription: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 8,
    lineHeight: 18,
  },
  itemPointsContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  itemPoints: {
    fontSize: 12,
    color: "#6B7280",
    marginLeft: 4,
  },
  itemWarning: {
    flexDirection: "row",
    alignItems: "center",
  },
  itemWarningText: {
    fontSize: 11,
    color: "#F59E0B",
    marginLeft: 4,
    fontWeight: "600",
  },
  itemActions: {
    alignItems: "flex-end",
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
    marginBottom: 8,
  },
  quantityButton: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  quantityText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    minWidth: 24,
    textAlign: "center",
  },
  removeButton: {
    padding: 8,
    marginBottom: 4,
  },
  itemTotal: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
  },
  itemTotalWarning: {
    color: "#F59E0B",
  },
  summarySection: {
    padding: 20,
    paddingTop: 0,
  },
  summaryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 16,
    color: "#6B7280",
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
  },
  summaryTotal: {
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingTop: 12,
    marginBottom: 0,
  },
  summaryTotalLabel: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
  },
  summaryTotalValue: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
  },
  insufficientPoints: {
    color: "#EF4444",
  },
  warningContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF3C7",
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
  },
  warningText: {
    fontSize: 14,
    color: "#92400E",
    marginLeft: 8,
    flex: 1,
  },
  checkoutContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  checkoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    borderRadius: 32,
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  checkoutButtonDisabled: {
    backgroundColor: "#D1D5DB",
  },
  checkoutButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    marginLeft: 8,
  },
  processingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  processingText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.text,
    marginTop: 24,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 32,
  },
  shopButton: {
    backgroundColor: colors.primary,
    borderRadius: 32,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  shopButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  quantityButtonDisabled: {
    opacity: 0.5,
  },
  removeButtonDisabled: {
    opacity: 0.5,
  },
})

export default RewardsCheckoutScreen