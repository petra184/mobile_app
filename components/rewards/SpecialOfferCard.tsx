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
import type { SpecialOffer } from "@/types/updated_types"

const { width: screenWidth } = Dimensions.get("window")

const DEFAULT_CARD_WIDTH_PERCENTAGE = 0.45
const CARD_HEIGHT = 280
const CARD_IMAGE_HEIGHT = 100

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
        <Feather name="image" size={28} color={colors.textSecondary} />
      </View>
    )
  }

  return (
    <View style={[styles.fullImageContainer, containerStyle]}>
      {imageLoading && (
        <View style={styles.imageLoadingOverlay}>
          <ActivityIndicator size="small" color={colors.primary} />
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
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const handleModalRedeem = () => {
    if (canRedeem) {
      onRedeem(offer)
      onClose()
    } else {
      if (!canAfford) {
        Alert.alert(
          "Insufficient Points",
          `You need ${offer.points_required - userPoints} more points to redeem this offer.`,
        )
      } else if (isSoldOut) {
        Alert.alert("Sold Out", "This offer is no longer available.")
      } else if (isExpired) {
        Alert.alert("Expired", "This offer has expired.")
      } else if (isNotStarted) {
        Alert.alert("Not Available", "This offer hasn't started yet.")
      }
    }
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.modalContainer} edges={["left", "right", "top"]}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Feather name="x" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Offer Details</Text>
          <View style={{ width: 24 }} />
        </View>
        <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
          <View style={styles.modalImageContainer}>
            <OfferImage imageUrl={offer.image_url ?? undefined} containerStyle={styles.modalImage} />

            {isLimitedQuantity && remainingQuantity !== null && remainingQuantity > 0 && (
              <View style={styles.modalQuantityBadge}>
                <Text style={styles.modalQuantityText}>Only {remainingQuantity} left!</Text>
              </View>
            )}
          </View>
          <View style={styles.modalInfo}>
            <Text style={styles.modalOfferTitle}>{offer.title}</Text>
            <Text style={styles.modalOfferDescription}>{offer.description}</Text>

            <View style={styles.modalPriceContainer}>
              <View style={styles.modalPriceRow}>
                <Feather name="star" size={24} color={colors.accent} />
                <View style={styles.modalPriceTextContainer}>
                  {offer.original_points && <Text style={styles.modalOriginalPrice}>{offer.original_points} pts</Text>}
                  <Text style={styles.modalOfferPrice}>{offer.points_required} points</Text>
                </View>
              </View>
              {offer.original_points && (
                <View style={styles.modalSavingsBadge}>
                  <Text style={styles.modalSavingsText}>Save {offer.original_points - offer.points_required} pts</Text>
                </View>
              )}
              {offer.is_active && !isExpired && (
                <View style={styles.modalLimitedBadge}>
                  <Feather name="zap" size={12} color="white" />
                  <Text style={styles.modalLimitedText}>LIMITED OFFER</Text>
                </View>
              )}
            </View>
            <View style={styles.modalDetailsContainer}>
              <Text style={styles.modalDetailsTitle}>Offer Details</Text>
              <View style={styles.modalDetailRow}>
                <Feather name="calendar" size={18} color={colors.primary} />
                <View style={styles.modalDetailTextContainer}>
                  <Text style={styles.modalDetailLabel}>Valid Period</Text>
                  <Text style={styles.modalDetailValue}>
                    {formatDate(offer.start_date)} - {formatDate(offer.end_date)}
                  </Text>
                </View>
              </View>
              {isLimitedQuantity && (
                <View style={styles.modalDetailRow}>
                  <Feather name="package" size={18} color={colors.primary} />
                  <View style={styles.modalDetailTextContainer}>
                    <Text style={styles.modalDetailLabel}>Availability</Text>
                    <Text style={styles.modalDetailValue}>
                      {remainingQuantity} of {offer.limited_quantity} remaining
                    </Text>
                  </View>
                </View>
              )}
              <View style={styles.modalDetailRow}>
                <Feather name="users" size={18} color={colors.primary} />
                <View style={styles.modalDetailTextContainer}>
                  <Text style={styles.modalDetailLabel}>Already Claimed</Text>
                  <Text style={styles.modalDetailValue}>{offer.claimed_count || 0} times</Text>
                </View>
              </View>
            </View>
            {!canAfford && isAvailable && !isSoldOut && (
              <View style={[styles.modalWarningContainer, { backgroundColor: colors.warningBackground }]}>
                <Feather name="alert-triangle" size={20} color={colors.warning} />
                <Text style={[styles.modalWarningText, { color: colors.warningText }]}>
                  You need {offer.points_required - userPoints} more points to redeem this offer.
                </Text>
              </View>
            )}
            {(isSoldOut || isExpired || isNotStarted || !offer.is_active) && (
              <View style={[styles.modalWarningContainer, { backgroundColor: colors.errorBackground }]}>
                <Feather name="x-circle" size={20} color={colors.error} />
                <Text style={[styles.modalWarningText, { color: colors.errorText }]}>
                  {isSoldOut
                    ? "This offer is sold out."
                    : isExpired
                    ? "This offer has expired."
                    : isNotStarted
                    ? "This offer hasn't started yet."
                    : "This offer is currently inactive."}
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
        <View style={styles.modalActions}>
          <TouchableOpacity
            style={[styles.modalRedeemButton, !canRedeem && styles.modalButtonDisabled]}
            onPress={handleModalRedeem}
            disabled={!canRedeem}
          >
            {!canRedeem && <Feather name="lock" size={20} color={colors.buttonDisabledText} style={{ marginRight: 8 }} />}
            <Feather name="gift" size={20} color={canRedeem ? "#FFFFFF" : colors.buttonDisabledText} style={{ marginRight: 8 }} />
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
  cardWidth?: number | `${number}%` // Explicitly type percentage strings
}

const SpecialOfferCard: React.FC<SpecialOfferCardProps> = ({ offer, userPoints, onRedeem, cardWidth }) => {
  const [modalVisible, setModalVisible] = useState(false)

  // Calculate the actual card width based on the prop
  // This logic now directly produces a number or a percentage string accepted by DimensionValue
  const calculatedCardWidth = typeof cardWidth === 'string' && cardWidth.endsWith('%')
    ? cardWidth // Already a percentage string, use directly
    : cardWidth // If it's a number, use directly
    || screenWidth * DEFAULT_CARD_WIDTH_PERCENTAGE; // Default to a number

  const canAfford = userPoints >= offer.points_required
  const isExpired = new Date() > new Date(offer.end_date)
  const isNotStarted = new Date() < new Date(offer.start_date)
  const isAvailable = !isExpired && !isNotStarted && offer.is_active
  const isLimitedQuantity = offer.limited_quantity && offer.limited_quantity > 0
  const remainingQuantity = isLimitedQuantity ? (offer.limited_quantity || 0) - (offer.claimed_count || 0) : null
  const isSoldOut = isLimitedQuantity && remainingQuantity !== null && remainingQuantity <= 0

  if (isExpired) {
    return null
  }

  const canRedeem = canAfford && isAvailable && !isSoldOut

  const handleCardPress = () => {
    setModalVisible(true)
  }

  const handleCardRedeem = (offerToRedeem: SpecialOffer) => {
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
    onRedeem(offerToRedeem)
  }

  return (
    <>
      <TouchableOpacity
        style={[styles.offerCard, { width: calculatedCardWidth }, !isAvailable && styles.offerCardDisabled]}
        onPress={handleCardPress}
        activeOpacity={0.7}
      >
        {offer.is_active && !isExpired && (
          <View style={styles.offerBadge}>
            <Feather name="zap" size={12} color="white" />
            <Text style={styles.offerBadgeText}>LIMITED</Text>
          </View>
        )}

        {(!isAvailable || isSoldOut) && (
          <View style={styles.statusOverlay}>
            <Text style={styles.statusOverlayText}>
              {isSoldOut ? "SOLD OUT" : isNotStarted ? "COMING SOON" : "INACTIVE"}
            </Text>
          </View>
        )}

        <View style={styles.imageContainer}>
          <OfferImage imageUrl={offer.image_url ?? undefined} containerStyle={styles.imageWrapper} />
        </View>

        <View style={styles.offerInfo}>
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
          {isLimitedQuantity && remainingQuantity !== null && remainingQuantity > 0 && (
            <Text style={styles.quantityText}>Only {remainingQuantity} left!</Text>
          )}
        </View>

        <View style={styles.redeemButtonContainer}>
          <TouchableOpacity
            style={[styles.redeemButton, !canRedeem && styles.redeemButtonDisabled]}
            onPress={(e) => {
              e.stopPropagation()
              handleCardRedeem(offer)
            }}
            disabled={!canRedeem}
          >
            {!canRedeem && <Feather name="lock" size={16} color={colors.buttonDisabledText} style={{ marginRight: 4 }} />}
            <Text style={[styles.redeemButtonText, !canRedeem && styles.redeemButtonTextDisabled]}>
              {canRedeem ? "Add to Cart" : "Locked"}
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>

      <SpecialOfferDetailModal
        offer={offer}
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onRedeem={onRedeem}
        canAfford={canAfford}
        userPoints={userPoints}
      />
    </>
  )
}

const styles = StyleSheet.create({
  offerCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginRight: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 5,
    position: "relative",
    height: CARD_HEIGHT,
  },
  offerCardDisabled: {
    opacity: 0.6,
  },
  offerBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: colors.accent,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
    zIndex: 2,
  },
  offerBadgeText: {
    color: "white",
    fontSize: 10,
    fontWeight: "600",
    marginLeft: 4,
    textTransform: "uppercase",
  },
  statusOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
    borderRadius: 12,
  },
  statusOverlayText: {
    color: "white",
    fontSize: 14,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  imageContainer: {
    width: "100%",
    height: CARD_IMAGE_HEIGHT,
    backgroundColor: colors.backgroundLight,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    overflow: "hidden",
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
    backgroundColor: colors.backgroundLight,
  },
  imageLoadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    zIndex: 1,
  },
  offerInfo: {
    padding: 12,
    flex: 1,
    justifyContent: "space-between",
  },
  offerName: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 4,
    lineHeight: 20,
  },
  offerDescription: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: 6,
    flex: 1,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 6,
  },
  originalPrice: {
    fontSize: 12,
    color: colors.textPlaceholder,
    textDecorationLine: "line-through",
    marginRight: 6,
    fontWeight: "500",
  },
  offerPrice: {
    fontSize: 17,
    fontWeight: "800",
    color: colors.textDark,
    letterSpacing: -0.2,
  },
  quantityText: {
    fontSize: 10,
    color: colors.warning,
    fontWeight: "600",
    marginTop: 2,
  },
  redeemButtonContainer: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    paddingTop: 8,
  },
  redeemButton: {
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 9,
    borderRadius: 23,
    minHeight: 38,
  },
  redeemButtonDisabled: {
    backgroundColor: colors.buttonDisabledBackground,
  },
  redeemButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },
  redeemButtonTextDisabled: {
    color: colors.buttonDisabledText,
  },

  modalContainer: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 18,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  closeButton: {
    padding: 4,
  },
  modalTitle: {
    fontSize: 19,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  modalContent: {
    flex: 1,
  },
  modalImageContainer: {
    width: "100%",
    height: 220,
    position: "relative",
    backgroundColor: colors.backgroundLight,
    overflow: "hidden",
  },
  modalImage: {
    width: "100%",
    height: "100%",
  },
  modalStatusBadge: {
    position: "absolute",
    top: 14,
    left: 14,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  modalStatusText: {
    color: "white",
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  modalLimitedBadge: {
    position: "absolute",
    right: 0,
    backgroundColor: colors.accent,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  modalLimitedText: {
    color: "white",
    fontSize: 11,
    fontWeight: "600",
    marginLeft: 4,
    textTransform: "uppercase",
  },
  modalQuantityBadge: {
    position: "absolute",
    bottom: 14,
    left: 14,
    right: 14,
    backgroundColor: colors.warning,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  modalQuantityText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "600",
    textAlign: "center",
  },
  modalInfo: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    marginBottom: 20,
    marginHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  modalOfferTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.textDark,
    marginBottom: 8,
  },
  modalOfferDescription: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: 18,
  },
  modalPriceContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  modalPriceRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  modalPriceTextContainer: {
    marginLeft: 10,
    alignItems: "flex-start",
  },
  modalOriginalPrice: {
    fontSize: 15,
    color: colors.textPlaceholder,
    textDecorationLine: "line-through",
    fontWeight: "500",
    marginBottom: 2,
  },
  modalOfferPrice: {
    fontSize: 30,
    fontWeight: "800",
    color: colors.textDark,
    letterSpacing: -0.6,
  },
  modalSavingsBadge: {
    backgroundColor: colors.successBackground,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  modalSavingsText: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.successText,
    textTransform: "uppercase",
  },
  modalDetailsContainer: {
    backgroundColor: colors.backgroundMuted,
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
  },
  modalDetailsTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 14,
  },
  modalDetailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  modalDetailTextContainer: {
    marginLeft: 10,
    flex: 1,
  },
  modalDetailLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.textPlaceholder,
    marginBottom: 2,
    textTransform: "uppercase",
  },
  modalDetailValue: {
    fontSize: 14,
    color: colors.textPrimary,
  },
  modalWarningContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8,
    padding: 14,
    marginBottom: 12,
  },
  modalWarningText: {
    fontSize: 13,
    marginLeft: 10,
    flex: 1,
    fontWeight: "500",
  },
  modalActions: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 0.5,
    borderTopColor: colors.border,
  },
  modalRedeemButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 28,
    marginBottom:20,
    justifyContent: "center",
  },
  modalRedeemButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  modalButtonDisabled: {
    backgroundColor: colors.buttonDisabledBackground,
  },
  modalButtonTextDisabled: {
    color: colors.buttonDisabledText,
  },
})

export default SpecialOfferCard