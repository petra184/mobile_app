"use client"
import type React from "react"
import { useState } from "react"
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator, Dimensions } from "react-native"
import { Feather } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import { colors } from "@/constants/colors"

const { width } = Dimensions.get("window")

export interface RewardCardData {
  id: string
  title: string
  description?: string
  points_required: number
  category?: string
  image_url?: string
  stock_quantity?: number
  is_sold?: boolean
}

interface RewardCardProps {
  reward: RewardCardData
  userPoints: number
  isInCart?: boolean
  cartQuantity?: number
  onPress?: (reward: RewardCardData) => void
  onAddToCart?: (reward: RewardCardData) => void
  onRemoveFromCart?: (reward: RewardCardData) => void
  size?: "small" | "medium" | "large"
  showActions?: boolean
}

const RewardImage: React.FC<{
  imageUrl?: string
  containerStyle?: any
  fallbackSize?: number
}> = ({ imageUrl, containerStyle, fallbackSize = 32 }) => {
  const [imageError, setImageError] = useState(false)
  const [imageLoading, setImageLoading] = useState(true)

  if (!imageUrl || imageError) {
    return (
      <View style={[styles.fallbackContainer, containerStyle]}>
        <LinearGradient colors={[colors.primary + "20", colors.primary + "10"]} style={styles.fallbackGradient}>
          <Feather name="gift" size={fallbackSize} color={colors.primary} />
        </LinearGradient>
      </View>
    )
  }

  return (
    <View style={[styles.imageContainer, containerStyle]}>
      {imageLoading && (
        <View style={styles.imageLoadingOverlay}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      )}
      <Image
        source={{ uri: imageUrl }}
        style={styles.rewardImage}
        onError={() => {
          setImageError(true)
          setImageLoading(false)
        }}
        onLoad={() => setImageLoading(false)}
        onLoadStart={() => setImageLoading(true)}
        resizeMode="cover"
      />
    </View>
  )
}

export const RewardCard: React.FC<RewardCardProps> = ({
  reward,
  userPoints,
  isInCart = false,
  cartQuantity = 0,
  onPress,
  onAddToCart,
  onRemoveFromCart,
  size = "medium",
  showActions = true,
}) => {
  const canAfford = userPoints >= reward.points_required
  const isLowStock = (reward.stock_quantity ?? 0) <= 5 && (reward.stock_quantity ?? 0) > 0
  const isOutOfStock = (reward.stock_quantity ?? 0) === 0 || reward.is_sold

  const cardWidth = size === "small" ? width * 0.4 : size === "large" ? width * 0.9 : width * 0.43
  const imageHeight = size === "small" ? 120 : size === "large" ? 200 : 140

  const handlePress = () => {
    if (!isOutOfStock) {
      onPress?.(reward)
    }
  }

  const handleAddToCart = (e: any) => {
    e.stopPropagation()
    if (canAfford && !isOutOfStock) {
      onAddToCart?.(reward)
    }
  }

  const handleRemoveFromCart = (e: any) => {
    e.stopPropagation()
    onRemoveFromCart?.(reward)
  }

  return (
    <TouchableOpacity
      style={[
        styles.card,
        { width: cardWidth },
        !canAfford && styles.cardDisabled,
        isOutOfStock && styles.cardOutOfStock,
      ]}
      onPress={handlePress}
      activeOpacity={isOutOfStock ? 1 : 0.8}
      disabled={isOutOfStock}
    >
      {/* Image Container */}
      <View style={[styles.imageWrapper, { height: imageHeight }]}>
        <RewardImage
          imageUrl={reward.image_url}
          containerStyle={styles.imageContainerStyle}
          fallbackSize={size === "small" ? 24 : size === "large" ? 48 : 32}
        />

        {/* Overlays */}
        {isInCart && cartQuantity > 0 && (
          <View style={styles.cartBadge}>
            <Text style={styles.cartBadgeText}>{cartQuantity}</Text>
          </View>
        )}

        {isLowStock && !isOutOfStock && (
          <View style={styles.stockBadge}>
            <Text style={styles.stockBadgeText}>Only {reward.stock_quantity} left!</Text>
          </View>
        )}

        {isOutOfStock && (
          <View style={styles.outOfStockOverlay}>
            <LinearGradient colors={["rgba(0,0,0,0.7)", "rgba(0,0,0,0.9)"]} style={styles.outOfStockGradient}>
              <Feather name="x-circle" size={32} color="#FFFFFF" />
              <Text style={styles.outOfStockText}>Out of Stock</Text>
            </LinearGradient>
          </View>
        )}

        {!canAfford && !isOutOfStock && (
          <View style={styles.insufficientPointsOverlay}>
            <LinearGradient colors={["rgba(0,0,0,0.6)", "rgba(0,0,0,0.8)"]} style={styles.insufficientPointsGradient}>
              <Feather name="lock" size={24} color="#FFFFFF" />
              <Text style={styles.insufficientPointsText}>Need {reward.points_required - userPoints} more points</Text>
            </LinearGradient>
          </View>
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={[styles.title, !canAfford && styles.titleDisabled]} numberOfLines={2}>
          {reward.title}
        </Text>

        {reward.description && (
          <Text style={[styles.description, !canAfford && styles.descriptionDisabled]} numberOfLines={2}>
            {reward.description}
          </Text>
        )}

        {/* Points and Actions */}
        <View style={styles.footer}>
          <View style={styles.pointsContainer}>
            <View style={styles.pointsGradient}>
              <Feather name="star" size={18} color={canAfford ? "#F59E0B" : "#6B7280"} />
            </View>
            <Text style={[styles.pointsText, !canAfford && styles.pointsTextDisabled]}>{reward.points_required}</Text>
          </View>

          {showActions && canAfford && !isOutOfStock && (
            <View style={styles.actions}>
              {isInCart ? (
                <View style={styles.cartActions}>
                  <TouchableOpacity style={styles.removeButton} onPress={handleRemoveFromCart}>
                    <Feather name="minus" size={16} color="#EF4444" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.addButton} onPress={handleAddToCart}>
                    <Feather name="plus" size={16} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity style={styles.primaryButton} onPress={handleAddToCart}>
                  <LinearGradient colors={[colors.primary, colors.primary + "CC"]} style={styles.buttonGradient}>
                    <Feather name="plus" size={16} color="#FFFFFF" />
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    overflow: "hidden",
  },
  cardDisabled: {
    opacity: 0.7,
  },
  cardOutOfStock: {
    opacity: 0.8,
  },
  imageWrapper: {
    width: "100%",
    position: "relative",
    backgroundColor: "#F8F9FA",
  },
  imageContainerStyle: {
    width: "100%",
    height: "100%",
  },
  imageContainer: {
    width: "100%",
    height: "100%",
  },
  rewardImage: {
    width: "100%",
    height: "100%",
  },
  fallbackContainer: {
    width: "100%",
    height: "100%",
  },
  fallbackGradient: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  imageLoadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    zIndex: 1,
  },
  cartBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#10B981",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 10,
  },
  cartBadgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  stockBadge: {
    position: "absolute",
    bottom: 12,
    left: 12,
    right: 12,
    backgroundColor: "#F59E0B",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  stockBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
    textAlign: "center",
  },
  categoryBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: "600",
    color: colors.primary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  outOfStockOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 5,
  },
  outOfStockGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  outOfStockText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 8,
    textAlign: "center",
  },
  insufficientPointsOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 5,
  },
  insufficientPointsGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 12,
  },
  insufficientPointsText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "600",
    marginTop: 6,
    textAlign: "center",
    lineHeight: 14,
  },
  content: {
    padding: 16,
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 6,
    lineHeight: 20,
  },
  titleDisabled: {
    color: "#9CA3AF",
  },
  description: {
    fontSize: 13,
    color: "#6B7280",
    lineHeight: 18,
    marginBottom: 12,
  },
  descriptionDisabled: {
    color: "#D1D5DB",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: "auto",
  },
  pointsContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  pointsGradient: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  pointsText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
  },
  pointsTextDisabled: {
    color: "#9CA3AF",
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
  },
  cartActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FEE2E2",
    justifyContent: "center",
    alignItems: "center",
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  primaryButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: "hidden",
  },
  buttonGradient: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
})
