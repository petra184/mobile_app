"use client"
import type React from "react"
import { useState } from "react"
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Image,
  Modal,
  ScrollView,
  Alert,
} from "react-native"
import { Feather } from "@expo/vector-icons"
import { SafeAreaView } from "react-native-safe-area-context"
import { colors } from "@/constants/colors"
import type { SpecialOffer } from "@/app/actions/points"

const { width } = Dimensions.get("window")

type OfferImageProps = {
  imageUrl?: string
  containerStyle?: any
}

const OfferImage: React.FC<OfferImageProps> = ({ imageUrl, containerStyle }) => {
  const [imageError, setImageError] = useState(false)
  const [imageLoading, setImageLoading] = useState(true)

  if (!imageUrl || imageError) {
    return (
      <View style={[styles.fallbackIconContainer, containerStyle]}>
        <Feather name="zap" size={28} color="#EF4444" />
      </View>
    )
  }

  return (
    <View style={[styles.fullImageContainer, containerStyle]}>
      {imageLoading && (
        <View style={styles.imageLoadingOverlay}>
          <ActivityIndicator size="small" color="#EF4444" />
        </View>
      )}
      <Image
        source={{ uri: imageUrl }}
        style={styles.fullImage}
        onError={() => {
          setImageError(true)
          setImageLoading(false)
        }}
        onLoad={() => setImageLoading(false)}
        onLoadEnd={() => setImageLoading(false)}
        resizeMode="cover"
      />
    </View>
  )
}

// Special Offer Detail Modal Component
const SpecialOfferDetailModal: React.FC<{
  offer: SpecialOffer | null
  visible: boolean
  onClose: () => void
  onRedeem: (offer: SpecialOffer) => void
  canAfford: boolean
  userPoints: number
}> = ({ offer, visible, onClose, onRedeem, canAfford, userPoints }) => {
  if (!offer) return null

  const isExpired = new Date() > new Date(offer.end_date)
  const isNotStarted = new Date() < new Date(offer.start_date)
  const isAvailable = !isExpired && !isNotStarted && offer.is_active
  const isLimitedQuantity = offer.limited_quantity && offer.limited_quantity > 0
  const remainingQuantity = isLimitedQuantity ? (offer.limited_quantity || 0) - (offer.claimed_count || 0) : null
  const isSoldOut = isLimitedQuantity && remainingQuantity !== null && remainingQuantity <= 0
  const canRedeem = canAfford && isAvailable && !isSoldOut

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const getStatusText = () => {
    if (isSoldOut) return "Sold Out"
    if (isExpired) return "Expired"
    if (isNotStarted) return "Coming Soon"
    if (!offer.is_active) return "Inactive"
    return "Available"
  }

  const getStatusColor = () => {
    if (isSoldOut || isExpired || !offer.is_active) return "#EF4444"
    if (isNotStarted) return "#F59E0B"
    return "#10B981"
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.modalContainer} edges={["left"]}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Feather name="x" size={24} color="#666" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Special Offer</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.modalContent}>
          <View style={styles.modalImageContainer}>
            <OfferImage imageUrl={offer.image_url ?? undefined} containerStyle={styles.modalImage} />
            {/* Status Badge */}
            <View style={[styles.modalStatusBadge, { backgroundColor: getStatusColor() }]}>
              <Text style={styles.modalStatusText}>{getStatusText()}</Text>
            </View>
            {/* Limited Time Badge */}
            <View style={styles.modalLimitedBadge}>
              <Feather name="zap" size={12} color="white" />
              <Text style={styles.modalLimitedText}>LIMITED OFFER</Text>
            </View>
            {/* Quantity Badge */}
            {isLimitedQuantity && remainingQuantity !== null && remainingQuantity > 0 && (
              <View style={styles.modalQuantityBadge}>
                <Text style={styles.modalQuantityText}>Only {remainingQuantity} left!</Text>
              </View>
            )}
          </View>

          <View style={styles.modalInfo}>
            <Text style={styles.modalOfferTitle}>{offer.title}</Text>
            <Text style={styles.modalOfferDescription}>{offer.description}</Text>

            {/* Price Section */}
            <View style={styles.modalPriceContainer}>
              <View style={styles.modalPriceRow}>
                <Feather name="star" size={20} color="#FFD700" />
                <View style={styles.modalPriceTextContainer}>
                  {offer.original_points && <Text style={styles.modalOriginalPrice}>{offer.original_points} pts</Text>}
                  <Text style={styles.modalOfferPrice}>{offer.points_required} points</Text>
                </View>
              </View>
              {offer.original_points && (
                <View style={styles.modalSavingsBadge}>
                  <Text style={styles.modalSavingsText}>Save {offer.original_points - offer.points_required} pts!</Text>
                </View>
              )}
            </View>

            {/* Offer Details */}
            <View style={styles.modalDetailsContainer}>
              <Text style={styles.modalDetailsTitle}>Offer Details</Text>
              <View style={styles.modalDetailRow}>
                <Feather name="calendar" size={16} color={colors.primary} />
                <View style={styles.modalDetailTextContainer}>
                  <Text style={styles.modalDetailLabel}>Valid Period</Text>
                  <Text style={styles.modalDetailValue}>
                    {formatDate(offer.start_date)} - {formatDate(offer.end_date)}
                  </Text>
                </View>
              </View>
              {isLimitedQuantity && (
                <View style={styles.modalDetailRow}>
                  <Feather name="package" size={16} color={colors.primary} />
                  <View style={styles.modalDetailTextContainer}>
                    <Text style={styles.modalDetailLabel}>Availability</Text>
                    <Text style={styles.modalDetailValue}>
                      {remainingQuantity} of {offer.limited_quantity} remaining
                    </Text>
                  </View>
                </View>
              )}
              <View style={styles.modalDetailRow}>
                <Feather name="users" size={16} color={colors.primary} />
                <View style={styles.modalDetailTextContainer}>
                  <Text style={styles.modalDetailLabel}>Already Claimed</Text>
                  <Text style={styles.modalDetailValue}>{offer.claimed_count || 0} times</Text>
                </View>
              </View>
            </View>

            {/* Warning Messages */}
            {!canAfford && isAvailable && !isSoldOut && (
              <View style={styles.modalWarningContainer}>
                <Feather name="alert-triangle" size={20} color="#F59E0B" />
                <Text style={styles.modalWarningText}>
                  You need {offer.points_required - userPoints} more points to redeem this offer
                </Text>
              </View>
            )}
            {(isSoldOut || isExpired || isNotStarted || !offer.is_active) && (
              <View style={[styles.modalWarningContainer, { backgroundColor: "#FEE2E2" }]}>
                <Feather name="x-circle" size={20} color="#EF4444" />
                <Text style={[styles.modalWarningText, { color: "#DC2626" }]}>
                  {isSoldOut
                    ? "This offer is sold out"
                    : isExpired
                      ? "This offer has expired"
                      : isNotStarted
                        ? "This offer hasn't started yet"
                        : "This offer is currently inactive"}
                </Text>
              </View>
            )}
          </View>
        </ScrollView>

        <View style={styles.modalActions}>
          <TouchableOpacity
            style={[styles.modalRedeemButton, !canRedeem && styles.modalButtonDisabled]}
            onPress={() => onRedeem(offer)}
            disabled={!canRedeem}
          >
            {!canRedeem && <Feather name="lock" size={20} color="#999" style={{ marginRight: 8 }} />}
            <Feather name="gift" size={20} color={canRedeem ? "#FFFFFF" : "#999"} style={{ marginRight: 8 }} />
            <Text style={[styles.modalRedeemButtonText, !canRedeem && styles.modalButtonTextDisabled]}>
              {canRedeem ? "Redeem Offer" : "Cannot Redeem"}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  )
}

interface SpecialOfferCardProps {
  offer: SpecialOffer
  userPoints: number
  onRedeem: (offer: SpecialOffer) => void
}

const SpecialOfferCard: React.FC<SpecialOfferCardProps> = ({ offer, userPoints, onRedeem }) => {
  const [modalVisible, setModalVisible] = useState(false)

  const canAfford = userPoints >= offer.points_required
  const isExpired = new Date() > new Date(offer.end_date)
  const isNotStarted = new Date() < new Date(offer.start_date)
  const isAvailable = !isExpired && !isNotStarted && offer.is_active
  const isLimitedQuantity = offer.limited_quantity && offer.limited_quantity > 0
  const remainingQuantity = isLimitedQuantity ? (offer.limited_quantity || 0) - (offer.claimed_count || 0) : null
  const isSoldOut = isLimitedQuantity && remainingQuantity !== null && remainingQuantity <= 0

  // Don't render expired offers at all
  if (isExpired) {
    return null
  }

  const canRedeem = canAfford && isAvailable && !isSoldOut

  const handleCardPress = () => {
    setModalVisible(true)
  }

  const handleRedeem = (offerToRedeem: SpecialOffer) => {
    if (!canRedeem) {
      if (!canAfford) {
        Alert.alert(
          "Insufficient Points",
          `You need ${offerToRedeem.points_required - userPoints} more points to redeem this offer.`,
        )
      } else if (isSoldOut) {
        Alert.alert("Sold Out", "This offer is no longer available.")
      } else if (isExpired) {
        Alert.alert("Expired", "This offer has expired.")
      } else if (isNotStarted) {
        Alert.alert("Not Available", "This offer hasn't started yet.")
      }
      return
    }

    Alert.alert("Redeem Offer", `Redeem "${offerToRedeem.title}" for ${offerToRedeem.points_required} points?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Redeem",
        onPress: () => {
          onRedeem(offerToRedeem)
          setModalVisible(false)
        },
      },
    ])
  }

  return (
    <>
      <TouchableOpacity
        style={[styles.offerCard, !isAvailable && styles.offerCardDisabled]}
        onPress={handleCardPress}
        activeOpacity={0.7}
      >
        {/* Limited Badge */}
        <View style={styles.offerBadge}>
          <Feather name="zap" size={12} color="white" />
          <Text style={styles.offerBadgeText}>LIMITED</Text>
        </View>

        {/* Status Badge */}
        {(!isAvailable || isSoldOut) && (
          <View style={styles.statusBadge}>
            <Text style={styles.statusBadgeText}>
              {isSoldOut ? "SOLD OUT" : isExpired ? "EXPIRED" : isNotStarted ? "SOON" : "INACTIVE"}
            </Text>
          </View>
        )}

        <View style={styles.imageContainer}>
          <OfferImage imageUrl={offer.image_url ?? undefined} containerStyle={styles.imageWrapper} />
        </View>

        <View style={styles.offerInfo}>
          <Text style={styles.offerCategory}>SPECIAL OFFER</Text>
          <Text style={styles.offerName} numberOfLines={2}>
            {offer.title}
          </Text>
          <Text style={styles.offerDescription} numberOfLines={2}>
            {offer.description}
          </Text>

          <View style={styles.priceContainer}>
            {offer.original_points && <Text style={styles.originalPrice}>{offer.original_points} pts</Text>}
            <Text style={styles.offerPrice}>{offer.points_required} pts</Text>
          </View>

          {/* Quantity Info */}
          {isLimitedQuantity && remainingQuantity !== null && remainingQuantity > 0 && (
            <Text style={styles.quantityText}>Only {remainingQuantity} left!</Text>
          )}
        </View>

        <View style={styles.redeemButtonContainer}>
          <TouchableOpacity
            style={[styles.redeemButton, !canRedeem && styles.redeemButtonDisabled]}
            onPress={(e) => {
              e.stopPropagation()
              handleRedeem(offer)
            }}
            disabled={!canRedeem}
          >
            {!canRedeem && <Feather name="lock" size={16} color="#999" style={{ marginRight: 4 }} />}
            <Text style={[styles.redeemButtonText, !canRedeem && styles.redeemButtonTextDisabled]}>
              {canRedeem ? "Redeem" : "Locked"}
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>

      <SpecialOfferDetailModal
        offer={offer}
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onRedeem={handleRedeem}
        canAfford={canAfford}
        userPoints={userPoints}
      />
    </>
  )
}

const styles = StyleSheet.create({
  offerCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginRight: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    position: "relative",
  },
  offerCardDisabled: {
    opacity: 0.7,
  },
  offerBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "#EF4444",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 2,
  },
  offerBadgeText: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
    marginLeft: 4,
  },
  statusBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    backgroundColor: "#6B7280",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 2,
  },
  statusBadgeText: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
  },
  imageContainer: {
    width: "100%",
    height: 120,
    backgroundColor: "#F8F9FA",
    position: "relative",
  },
  imageWrapper: {
    width: "100%",
    height: "100%",
  },
  fullImageContainer: {
    width: "100%",
    height: "100%",
    position: "relative",
  },
  fullImage: {
    width: "100%",
    height: "100%",
  },
  fallbackIconContainer: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.05)",
  },
  imageLoadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    zIndex: 1,
  },
  offerInfo: {
    padding: 16,
    flex: 1,
  },
  offerCategory: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#EF4444",
    marginBottom: 4,
  },
  offerName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#222",
    marginBottom: 6,
  },
  offerDescription: {
    fontSize: 13,
    color: "#666",
    lineHeight: 18,
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  originalPrice: {
    fontSize: 13,
    color: "#9CA3AF",
    textDecorationLine: "line-through",
    marginRight: 8,
    fontWeight: "500",
  },
  offerPrice: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
    letterSpacing: -0.3,
  },
  pointsLabel: {
    fontSize: 11,
    color: "#6B7280",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  quantityText: {
    fontSize: 11,
    color: "#F59E0B",
    fontWeight: "600",
    marginBottom: 8,
  },
  redeemButtonContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  redeemButton: {
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 8,
  },
  redeemButtonDisabled: {
    backgroundColor: "#E5E7EB",
  },
  redeemButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  redeemButtonTextDisabled: {
    color: "#9CA3AF",
  },
  // Modal styles
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
  },
  closeButton: {
    padding: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  modalContent: {
    flex: 1,
  },
  modalImageContainer: {
    width: "100%",
    height: 250,
    backgroundColor: "#FFFFFF",
    position: "relative",
  },
  modalImage: {
    width: "100%",
    height: "100%",
  },
  modalStatusBadge: {
    position: "absolute",
    top: 16,
    left: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  modalStatusText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  modalLimitedBadge: {
    position: "absolute",
    top: 16,
    right: 16,
    backgroundColor: "#EF4444",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  modalLimitedText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
    marginLeft: 4,
  },
  modalQuantityBadge: {
    position: "absolute",
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: "#F59E0B",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  modalQuantityText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
    textAlign: "center",
  },
  modalInfo: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    marginTop: 1,
  },
  modalOfferTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
  },
  modalOfferDescription: {
    fontSize: 16,
    color: "#6B7280",
    lineHeight: 24,
    marginBottom: 20,
  },
  modalPriceContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  modalPriceRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  modalPriceTextContainer: {
    marginLeft: 12,
    alignItems: "flex-start",
  },
  modalOriginalPrice: {
    fontSize: 16,
    color: "#9CA3AF",
    textDecorationLine: "line-through",
    fontWeight: "500",
    marginBottom: 2,
  },
  modalOfferPrice: {
    fontSize: 32,
    fontWeight: "800",
    color: "#1F2937",
    letterSpacing: -0.8,
  },
  modalPointsLabel: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 2,
  },
  modalSavingsBadge: {
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  modalSavingsText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#16A34A",
  },
  modalCategoryContainer: {
    marginBottom: 20,
  },
  modalCategoryBadge: {
    backgroundColor: colors.primary + "20",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: "flex-start",
  },
  modalCategoryText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.primary,
  },
  modalDetailsContainer: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  modalDetailsTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 16,
  },
  modalDetailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  modalDetailTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  modalDetailLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: 2,
  },
  modalDetailValue: {
    fontSize: 14,
    color: "#111827",
  },
  modalWarningContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF3C7",
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  modalWarningText: {
    fontSize: 14,
    color: "#92400E",
    marginLeft: 12,
    flex: 1,
  },
  modalActions: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  modalRedeemButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 16,
    marginBottom: 10,
    borderRadius: 32,
    justifyContent: "center",
  },
  modalRedeemButtonText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  modalButtonDisabled: {
    backgroundColor: "#E5E7EB",
  },
  modalButtonTextDisabled: {
    color: "#9CA3AF",
  },
})

export default SpecialOfferCard
