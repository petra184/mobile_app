"use client"
import type React from "react"
import { useState } from "react"
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Dimensions,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Feather } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import { colors } from "@/constants/colors"
import type { RewardCardData } from "@/types/updated_types"

const { width, height } = Dimensions.get("window")

interface RewardDetailModalProps {
  reward: RewardCardData | null
  visible: boolean
  userPoints: number
  isInCart?: boolean
  cartQuantity?: number
  onClose: () => void
  onAddToCart?: (reward: RewardCardData) => void
  onRemoveFromCart?: (reward: RewardCardData) => void
}

const RewardModalImage: React.FC<{
  imageUrl?: string
  title: string
}> = ({ imageUrl, title }) => {
  const [imageError, setImageError] = useState(false)
  const [imageLoading, setImageLoading] = useState(true)

  if (!imageUrl || imageError) {
    return (
      <View style={styles.fallbackImageContainer}>
        <LinearGradient colors={[colors.primary + "20", colors.primary + "10"]} style={styles.fallbackImageGradient}>
          <Feather name="gift" size={64} color={colors.primary} />
          <Text style={styles.fallbackImageText}>{title}</Text>
        </LinearGradient>
      </View>
    )
  }

  return (
    <View style={styles.modalImageContainer}>
      {imageLoading && (
        <View style={styles.imageLoadingOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading image...</Text>
        </View>
      )}
      <Image
        source={{ uri: imageUrl }}
        style={styles.modalImage}
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

export const RewardDetailModal: React.FC<RewardDetailModalProps> = ({
  reward,
  visible,
  userPoints,
  isInCart = false,
  cartQuantity = 0,
  onClose,
  onAddToCart,
  onRemoveFromCart,
}) => {
  if (!reward) return null

  const canAfford = userPoints >= reward.points_required
  const isLowStock = (reward.stock_quantity ?? 0) <= 5 && (reward.stock_quantity ?? 0) > 0
  const isOutOfStock = (reward.stock_quantity ?? 0) === 0 || reward.is_sold
  const pointsNeeded = reward.points_required - userPoints

  const handleAddToCart = () => {
    if (canAfford && !isOutOfStock) {
      onAddToCart?.(reward)
    }
  }

  const handleRemoveFromCart = () => {
    onRemoveFromCart?.(reward)
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.modalContainer}>
        {/* Header */}
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <View style={styles.closeButtonBackground}>
              <Feather name="x" size={20} color="#6B7280" />
            </View>
          </TouchableOpacity>
          <Text style={styles.modalHeaderTitle}>Reward Details</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
          {/* Image Section */}
          <View style={styles.imageSection}>
            <RewardModalImage imageUrl={reward.image_url} title={reward.title} />

            {/* Overlays */}
            {isInCart && cartQuantity > 0 && (
              <View style={styles.modalCartBadge}>
                <LinearGradient colors={["#10B981", "#059669"]} style={styles.cartBadgeGradient}>
                  <Feather name="shopping-cart" size={16} color="#FFFFFF" />
                  <Text style={styles.modalCartBadgeText}>{cartQuantity} in cart</Text>
                </LinearGradient>
              </View>
            )}
          </View>

          {/* Content Section */}
          <View style={styles.contentSection}>
            {/* Title and Category */}
            <View style={styles.titleSection}>
              <Text style={styles.modalTitle}>{reward.title}</Text>
              {isLowStock && !isOutOfStock && (
                <View style={styles.stockWarningGradient}>
                  <Feather name="alert-triangle" size={16} color="#FFA500" />
                  <Text style={styles.stockWarningText}>Only {reward.stock_quantity} left!</Text>
                </View>
              )}
            </View>

            {/* Description */}
            {reward.description && <Text style={styles.modalDescription}>{reward.description}</Text>}
            {/* Points Section */}
            <View style={styles.pointsSection}>
              <View style={styles.pointsDisplay}>
                <LinearGradient
                  colors={canAfford ? ["#FFD700", "#FFA500"] : ["#D1D5DB", "#9CA3AF"]}
                  style={styles.pointsIconGradient}
                >
                  <Feather name="star" size={20} color={canAfford ? "#FFFFFF" : "#6B7280"} />
                </LinearGradient>
                <View style={styles.pointsInfo}>
                  <Text style={styles.pointsLabel}>Points Required</Text>
                  <Text style={[styles.pointsValue, !canAfford && styles.pointsValueDisabled]}>
                    {reward.points_required}
                  </Text>
                </View>
              </View>

              <View style={styles.userPointsDisplay}>
                <Text style={styles.userPointsLabel}>Your Points</Text>
                <Text
                  style={[
                    styles.userPointsValue,
                    canAfford ? styles.userPointsSufficient : styles.userPointsInsufficient,
                  ]}
                >
                  {userPoints}
                </Text>
              </View>
            </View>

            {/* Status Messages */}
            {isOutOfStock && (
              <View style={styles.statusMessage}>
                <LinearGradient colors={["#FEE2E2", "#FECACA"]} style={styles.statusGradient}>
                  <Feather name="x-circle" size={20} color="#EF4444" />
                  <Text style={styles.statusText}>This reward is currently out of stock</Text>
                </LinearGradient>
              </View>
            )}
          </View>
        </ScrollView>

        {/* Action Buttons */}
        <View style={styles.actionSection}>
          {isOutOfStock ? (
            <View style={styles.disabledActionButton}>
              <Text style={styles.disabledActionText}>Out of Stock</Text>
            </View>
          ) : !canAfford ? (
            <View style={styles.disabledActionButton}>
              <Text style={styles.disabledActionText}>Insufficient Points</Text>
            </View>
          ) : isInCart ? (
            <View style={styles.cartActionButtons}>
              <TouchableOpacity style={styles.removeFromCartButton} onPress={handleRemoveFromCart}>
                <Feather name="minus" size={20} color="#EF4444" />
                <Text style={styles.removeFromCartText}>Remove</Text>
              </TouchableOpacity>

              <View style={styles.quantityDisplay}>
                <Text style={styles.quantityText}>In Cart: {cartQuantity}</Text>
              </View>

              <TouchableOpacity style={styles.addMoreButton} onPress={handleAddToCart}>
                <LinearGradient colors={[colors.primary, colors.primary + "CC"]} style={styles.addMoreGradient}>
                  <Feather name="plus" size={20} color="#FFFFFF" />
                  <Text style={styles.addMoreText}>Add More</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.addToCartButton} onPress={handleAddToCart}>
              <LinearGradient colors={[colors.primary, colors.primary + "CC"]} style={styles.addToCartGradient}>
                <Feather name="shopping-cart" size={24} color="#FFFFFF" />
                <Text style={styles.addToCartText}>Add to Cart</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  closeButton: {
    padding: 4,
  },
  closeButtonBackground: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  modalHeaderTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  headerSpacer: {
    width: 40,
  },
  modalContent: {
    flex: 1,
  },
  imageSection: {
    position: "relative",
    backgroundColor: "#FFFFFF",
  },
  modalImageContainer: {
    width: "100%",
    height: 280,
    position: "relative",
  },
  modalImage: {
    width: "100%",
    height: "100%",
  },
  fallbackImageContainer: {
    width: "100%",
    height: 280,
  },
  fallbackImageGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  fallbackImageText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.primary,
    marginTop: 12,
    textAlign: "center",
    paddingHorizontal: 20,
  },
  imageLoadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    zIndex: 1,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#6B7280",
  },
  modalCartBadge: {
    position: "absolute",
    top: 20,
    right: 20,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  cartBadgeGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  modalCartBadgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
    marginLeft: 6,
  },
  modalStockWarning: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  stockWarningGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius:22,
    backgroundColor: "#FFF3CD",
    borderWidth: 1,
    borderColor: "#FFA500",
  },
  stockWarningText: {
    color: "#FFA500",
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 8,
  },
  contentSection: {
    backgroundColor: "#FFFFFF",
    marginTop: 1,
    padding: 24,
  },
  titleSection: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
    flex: 1,
    marginRight: 12,
    lineHeight: 32,
  },
  modalCategoryBadge: {
    flex:1,
    flexDirection: "row",
    backgroundColor: colors.primary + "15",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.primary + "30",
  },
  modalDescription: {
    fontSize: 16,
    color: "#6B7280",
    lineHeight: 24,
    marginBottom: 24,
  },
  pointsSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  pointsDisplay: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  pointsIconGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  pointsInfo: {
    flex: 1,
  },
  pointsLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: "#6B7280",
    marginBottom: 2,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  pointsValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },
  pointsValueDisabled: {
    color: "#9CA3AF",
  },
  userPointsDisplay: {
    alignItems: "flex-end",
  },
  userPointsLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: "#6B7280",
    marginBottom: 2,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  userPointsValue: {
    fontSize: 18,
    fontWeight: "700",
  },
  userPointsSufficient: {
    color: "#10B981",
  },
  userPointsInsufficient: {
    color: "#EF4444",
  },
  statusMessage: {
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 20,
  },
  statusGradient: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  statusText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
  actionSection: {
    backgroundColor: "#FFFFFF",
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  addToCartButton: {
    borderRadius: 40,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  addToCartGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
    paddingHorizontal: 24,
  },
  addToCartText: {
    fontSize: 18,
    fontWeight: "500",
    color: "#FFFFFF",
    marginLeft: 12,
  },
  cartActionButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  removeFromCartButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FEE2E2",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flex: 1,
  },
  removeFromCartText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#EF4444",
    marginLeft: 8,
  },
  quantityDisplay: {
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  quantityText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  addMoreButton: {
    borderRadius: 12,
    overflow: "hidden",
    flex: 1,
  },
  addMoreGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  addMoreText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    marginLeft: 8,
  },
  disabledActionButton: {
    backgroundColor: "#F3F4F6",
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  disabledActionText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#9CA3AF",
  },
})
