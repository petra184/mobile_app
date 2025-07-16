"use client"
import type React from "react"
import { useState, useCallback, useEffect } from "react"
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, Alert } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Feather } from "@expo/vector-icons"
import { useRouter, useLocalSearchParams } from "expo-router"
import { colors } from "@/constants/colors"
import { useCart, type CartItem } from "@/context/cart-context"
import { useUserStore } from "@/hooks/userStore"
import { useNotifications } from "@/context/notification-context"
import { supabase } from "@/lib/supabase"
import Animated, { FadeInUp } from "react-native-reanimated"

const RewardsCheckoutScreen: React.FC = () => {
  const router = useRouter()
  const params = useLocalSearchParams()
  const { items, totalItems, totalPoints, updateQuantity, removeFromCart, clearCart, isLoading } = useCart()
  const { points, userId, userEmail, redeemPoints } = useUserStore() // Added userEmail here
  const { showSuccess, showError } = useNotifications()
  const [processing, setProcessing] = useState(false)
  const canAfford = points >= totalPoints
  const hasItems = items.length > 0

  // Force refresh cart when params change (coming from store screen)
  useEffect(() => {
    if (params.timestamp) {
      console.log("🔄 Checkout screen refreshed with new params:", params)
    }
  }, [params])

  // Debug cart state
  useEffect(() => {
    console.log("🛒 Checkout screen - Cart state:", {
      items: items.length,
      totalItems,
      totalPoints,
      isLoading,
      userPoints: points,
      canAfford,
    })
  }, [items, totalItems, totalPoints, isLoading, points, canAfford])

  const handleQuantityChange = useCallback(
    (id: string, change: number) => {
      const item = items.find((item) => item.id === id)
      if (item) {
        const newQuantity = item.quantity + change
        if (newQuantity > 0) {
          updateQuantity(id, newQuantity)
        } else {
          removeFromCart(id)
        }
      }
    },
    [items, updateQuantity, removeFromCart],
  )

  const handleRemoveItem = useCallback(
    (id: string) => {
      removeFromCart(id)
    },
    [removeFromCart],
  )

  // Database lookup to determine if item is a special offer or reward
  const determineItemType = useCallback(
    async (itemId: string): Promise<{ isSpecialOffer: boolean; exists: boolean }> => {
      try {
        // First check if the item exists in special_offers table
        const { data: specialOffer, error: specialOfferError } = await supabase
          .from("special_offers")
          .select("id")
          .eq("id", itemId)
          .single()
        if (specialOffer && !specialOfferError) {
          return { isSpecialOffer: true, exists: true }
        }
        // If not found in special_offers, check if it exists in rewards table
        const { data: reward, error: rewardError } = await supabase
          .from("rewards")
          .select("id")
          .eq("id", itemId)
          .single()
        if (reward && !rewardError) {
          return { isSpecialOffer: false, exists: true }
        }
        // If not found in either table
        return { isSpecialOffer: false, exists: false }
      } catch (error) {
        console.error(`Error determining item type for ${itemId}:`, error)
        return { isSpecialOffer: false, exists: false }
      }
    },
    [],
  )

  const processCheckout = useCallback(async () => {
    setProcessing(true)
    try {
      // Verify user is authenticated and get the session
      const {
        data: { session }, // Get the session object
        error: authError,
      } = await supabase.auth.getSession()

      if (authError || !session || !session.user) {
        throw new Error("User not authenticated or session not found")
      }
      const user = session.user // Extract the user from the session
      const accessToken = session.access_token // Get the access_token from the session

      // Create a snapshot of current cart items before clearing
      const cartSnapshot = [...items]
      const snapshotTotalItems = totalItems
      const snapshotTotalPoints = totalPoints
      console.log("🛒 Processing checkout with items:", cartSnapshot)
      console.log("🔐 Authenticated user:", user.id)

      // Determine item types for all items first
      const itemsWithTypes = await Promise.all(
        cartSnapshot.map(async (item) => {
          const { isSpecialOffer, exists } = await determineItemType(item.id)
          if (!exists) {
            throw new Error(`Item "${item.title}" not found in database`)
          }
          return {
            ...item,
            isSpecialOffer,
          }
        }),
      )

      // Determine transaction subtype
      const hasRewards = itemsWithTypes.some((item) => !item.isSpecialOffer)
      const hasOffers = itemsWithTypes.some((item) => item.isSpecialOffer)
      let transactionSubtype = "reward_only"
      if (hasRewards && hasOffers) transactionSubtype = "mixed"
      else if (hasOffers) transactionSubtype = "offer_only"

      // Generate a unique 6-digit confirmation number
      // Note: While Math.random provides a good distribution,
      // the UNIQUE constraint on the database column will ensure true uniqueness.
      // If a collision occurs, the insert will fail, and the error will be caught.
      const confirmationNumber = Math.floor(Math.random() * 900000 + 100000).toString()

      // Start a transaction - make sure to use the authenticated user's ID
      const { data: transaction, error: transactionError } = await supabase
        .from("reward_transactions")
        .insert({
          user_id: user.id, // Use the authenticated user's ID
          transaction_type: "reward_purchase",
          transaction_subtype: transactionSubtype,
          total_points_used: snapshotTotalPoints,
          items: itemsWithTypes.map((item) => ({
            id: item.id,
            title: item.title,
            points_required: item.points_required,
            quantity: item.quantity,
            total_points: item.points_required * item.quantity,
            item_type: item.isSpecialOffer ? "special_offer" : "reward",
          })),
          status: "completed",
          confirmation_number: confirmationNumber, // Store the generated confirmation number
        })
        .select()
        .single()

      if (transactionError) {
        console.error("Transaction error:", transactionError)
        throw new Error("Failed to create transaction record")
      }
      console.log("✅ Transaction created:", transaction.id)

      // Process each item and create unified transaction items
      for (const item of itemsWithTypes) {
        const itemType = item.isSpecialOffer ? "special_offer" : "reward"
        console.log(`Processing ${itemType}: ${item.title}`)

        // Insert unified transaction item with correct foreign key
        const transactionItemData = {
          transaction_id: transaction.id,
          quantity: item.quantity,
          points_per_item: item.points_required,
          total_points: item.points_required * item.quantity,
          item_title: item.title,
          item_type: itemType,
          ...(item.isSpecialOffer
            ? { special_offer_id: item.id, reward_id: null }
            : { reward_id: item.id, special_offer_id: null }),
        }
        const { error: itemError } = await supabase.from("transaction_items").insert(transactionItemData)
        if (itemError) {
          console.error("Transaction item error:", itemError)
          throw new Error(`Failed to create transaction item for ${item.title}`)
        }

        // Handle item-specific logic
        if (item.isSpecialOffer) {
          // Mark special offer as claimed
          const { data: claimResult, error: claimError } = await supabase.rpc("mark_special_offer_as_claimed", {
            p_offer_id: item.id,
            p_quantity: item.quantity,
          })
          if (claimError || !claimResult) {
            console.error("Special offer claim error:", claimError)
            throw new Error(`Failed to claim special offer ${item.title}`)
          }
        } else {
          // Mark reward as purchased using the database function
          const { data: markResult, error: markError } = await supabase.rpc("mark_reward_as_purchased", {
            p_reward_id: item.id,
            p_quantity: item.quantity,
          })
          if (markError || !markResult) {
            console.error("Reward mark error:", markError)
            throw new Error(`Failed to update stock for reward ${item.title}`)
          }
        }

        // Create unified redemption record
        const redemptionData = {
          user_id: user.id, // Use the authenticated user's ID
          item_title: item.title,
          item_type: itemType,
          points_used: item.points_required * item.quantity,
          quantity: item.quantity,
          status: "completed",
          ...(item.isSpecialOffer
            ? { special_offer_id: item.id, reward_id: null }
            : { reward_id: item.id, special_offer_id: null }),
        }
        const { error: redemptionError } = await supabase.from("user_redemptions_unified").insert(redemptionData)
        if (redemptionError) {
          console.error("Redemption error:", redemptionError)
          throw new Error(`Failed to create redemption record for ${item.title}`)
        }

        // Record purchase history
        const { error: purchaseHistoryError } = await supabase.rpc("record_purchase_history", {
          p_user_id: user.id,
          p_item_id: item.id,
          p_item_title: item.title,
          p_item_type: itemType,
          p_points_used: item.points_required * item.quantity,
          p_quantity: item.quantity,
          p_transaction_id: transaction.id,
        })
        if (purchaseHistoryError) {
          console.error("Purchase history error:", purchaseHistoryError)
          // Don't throw error for purchase history as it's not critical
        }
      }
      console.log("✅ All transaction items and redemptions created")

      // Create points transaction record - use the authenticated user's ID
      const pointsTransactionData = {
        user_id: user.id, // Use the authenticated user's ID
        points_change: -snapshotTotalPoints,
        transaction_type: "redemption",
        source_type: transactionSubtype,
        source_id: transaction.id,
        description: `Redeemed ${snapshotTotalItems} item${snapshotTotalItems > 1 ? "s" : ""} for ${snapshotTotalPoints} points`,
      }
      console.log("📝 Creating points transaction:", pointsTransactionData)
      const { error: pointsTransactionError } = await supabase.from("points_transactions").insert(pointsTransactionData)
      if (pointsTransactionError) {
        console.error("Points transaction error:", pointsTransactionError)
        throw new Error("Failed to create points transaction record")
      }
      console.log("✅ Points transaction created")

      // Deduct points from user
      await redeemPoints(snapshotTotalPoints)

      // NEW: Send confirmation email directly via Supabase Edge Function
      if (userEmail && accessToken) {
        // Ensure accessToken is available
        const SUPABASE_EDGE_FUNCTION_EMAIL_URL = process.env.EXPO_PUBLIC_SUPABASE_EDGE_FUNCTION_EMAIL_URL // Access Expo public env var
        if (!SUPABASE_EDGE_FUNCTION_EMAIL_URL) {
          console.error("SUPABASE_EDGE_FUNCTION_EMAIL_URL is not configured. Skipping email sending.")
          showError("Email Sending Failed", "Email service not configured. Please contact support.")
        } else {
          console.log("📧 Sending redemption confirmation email...")
          const response = await fetch(SUPABASE_EDGE_FUNCTION_EMAIL_URL, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              // Add the Authorization header with the user's access token
              Authorization: `Bearer ${accessToken}`, // Use accessToken from the session
            },
            body: JSON.stringify({
              userEmail: userEmail, // Use userEmail from the Zustand store
              redeemedItems: itemsWithTypes.map((item) => ({
                id: item.id,
                title: item.title,
                points_required: item.points_required,
                quantity: item.quantity,
                isSpecialOffer: item.isSpecialOffer,
              })),
              confirmationNumber: confirmationNumber, // Pass the generated confirmation number
            }),
          })

          if (!response.ok) {
            const errorData = await response.json()
            console.error("Failed to send redemption email via Edge Function:", errorData)
            showError("Email Sending Failed", "Could not send confirmation email. Please check your email address.")
          } else {
            console.log("✅ Redemption email sent successfully.")
          }
        }
      } else {
        console.warn("User email or access token not available, skipping email confirmation.")
      }

      // Clear cart first
      console.log("🧹 Clearing cart after successful purchase")
      await clearCart()

      // Show success message
      showSuccess(
        "Purchase Successful!",
        `You've successfully redeemed ${snapshotTotalItems} item${snapshotTotalItems > 1 ? "s" : ""} for ${snapshotTotalPoints} points. A confirmation email has been sent. Your confirmation number is #${confirmationNumber}.`, // Updated success message
      )

      // Navigate back after a short delay
      setTimeout(() => {
        console.log("🚀 Navigating back to store")
        router.back()
      }, 1000)
    } catch (error) {
      console.error("❌ Checkout error:", error)
      showError("Purchase Failed", error instanceof Error ? error.message : "Something went wrong. Please try again.")
    } finally {
      setProcessing(false)
    }
  }, [
    items,
    totalItems,
    totalPoints,
    userId,
    userEmail, // Added to dependencies
    redeemPoints,
    clearCart,
    showSuccess,
    showError,
    router,
    determineItemType,
  ])

  const handleCheckout = useCallback(async () => {
    if (!userId) {
      Alert.alert("Login Required", "Please log in to complete your purchase.")
      return
    }
    if (!canAfford) {
      Alert.alert("Insufficient Points", `You need ${totalPoints - points} more points to complete this purchase.`)
      return
    }
    if (!hasItems) {
      Alert.alert("Empty Cart", "Please add some items to your cart before checking out.")
      return
    }

    Alert.alert(
      "Confirm Purchase",
      `Are you sure you want to redeem ${totalItems} item${totalItems > 1 ? "s" : ""} for ${totalPoints} points?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Confirm", onPress: processCheckout },
      ],
    )
  }, [userId, canAfford, hasItems, totalItems, totalPoints, points, processCheckout])

  // Show loading state while cart is loading
  if (isLoading) {
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
    // For rendering purposes, use a simple heuristic (will be properly determined during checkout)
    const itemIsSpecialOffer = item.category === "special_offer" || item.title.toLowerCase().includes("offer")
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
            <Feather name="star" size={14} color="#FFD700" />
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
              style={styles.quantityButton}
              onPress={() => handleQuantityChange(item.id, -1)}
              disabled={processing}
            >
              <Feather name="minus" size={16} color={colors.primary} />
            </TouchableOpacity>
            <Text style={styles.quantityText}>{item.quantity}</Text>
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => handleQuantityChange(item.id, 1)}
              disabled={processing}
            >
              <Feather name="plus" size={16} color={colors.primary} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.removeButton} onPress={() => handleRemoveItem(item.id)} disabled={processing}>
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
          {/* Cart Items */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <Animated.View entering={FadeInUp.duration(500).delay(200)} style={styles.section}>
              <Text style={styles.sectionTitle}>Your Cart ({totalItems} items)</Text>
              {items.map((item, index) => renderCartItem(item, index))}
            </Animated.View>
            {/* Points Summary */}
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
          {/* Checkout Button */}
          <Animated.View entering={FadeInUp.duration(500).delay(600)} style={styles.checkoutContainer}>
            <TouchableOpacity
              style={[styles.checkoutButton, (!canAfford || processing) && styles.checkoutButtonDisabled]}
              onPress={handleCheckout}
              disabled={!canAfford || processing}
            >
              {processing ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Feather name="check-circle" size={20} color="#FFFFFF" />
                  <Text style={styles.checkoutButtonText}>Complete Purchase ({totalPoints.toLocaleString()} pts)</Text>
                </>
              )}
            </TouchableOpacity>
          </Animated.View>
        </>
      ) : (
        /* Empty Cart */
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
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  shopButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
})

export default RewardsCheckoutScreen
