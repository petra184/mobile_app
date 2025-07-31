import { colors } from "@/constants/Colors"
import type { Reward } from "@/types/updated_types"
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons"
import type React from "react"
import { Dimensions, Image, Platform, Pressable, StyleSheet, Text, View } from "react-native"

const { width: screenWidth } = Dimensions.get("window")

interface RewardCardProps {
  reward: Reward
  userPoints: number
  onPress: (reward: Reward) => void
  onAddToCart?: (reward: Reward) => void
  cardWidth?: number | `${number}%`
}

export const RewardCard: React.FC<RewardCardProps> = ({
  reward,
  userPoints,
  onPress,
  onAddToCart,
  cardWidth = screenWidth * 0.9,
}) => {
  const canAfford = userPoints >= reward.points_required
  const isAvailable = (reward.stock_quantity ?? 0) > 0 && !reward.is_sold
  const isExpired = reward.expirty_date ? new Date() > new Date(reward.expirty_date) : false

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return ""
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const handlePress = () => {
    onPress(reward)
  }

  return (
    <Pressable
      style={[styles.card, { width: cardWidth }, (!canAfford || !isAvailable || isExpired) && styles.unavailableCard]}
      onPress={handlePress}
      android_ripple={{ color: "rgba(0,0,0,0.1)" }}
    >
      <View style={styles.imageContainer}>
        <Image
          source={reward.image_url ? { uri: reward.image_url } : require("../../IMAGES/MAIN_LOGO.png")}
          style={styles.image}
        />

        {/* Stock Warning Badge */}
        {reward.stock_quantity && reward.stock_quantity <= 5 && (
          <View style={styles.stockBadge}>
            <Feather name="alert-triangle" size={12} color={colors.error} />
            <Text style={styles.stockBadgeText}>Only {reward.stock_quantity} left!</Text>
          </View>
        )}
        {/* Out of Stock Overlay */}
        {!isAvailable && (
          <View style={styles.unavailableOverlay}>
            <Text style={styles.unavailableText}>OUT OF STOCK</Text>
          </View>
        )}
      </View>

      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.title} numberOfLines={1}>
            {reward.title}
          </Text>
        </View>

        {reward.category && <Text style={styles.category}>{reward.category}</Text>}

        <Text style={styles.description} 
          numberOfLines={2}
          ellipsizeMode="tail">
          {reward.description}
        </Text>

        <View style={styles.footer}>
          <View style={styles.pointsContainer}>
            <MaterialCommunityIcons name="star-circle" size={16} color={colors.accent} />
            <Text style={[styles.points, !canAfford && styles.disabledText]}>{reward.points_required}</Text>
            <Text style={[styles.pointsLabel, !canAfford && styles.disabledText]}>POINTS</Text>
          </View>

          {/* Insufficient Points Warning */}
          {!canAfford && (
            <View style={styles.insufficientContainer}>
              <Feather name="lock" size={12} color="#EF4444" />
              <Text style={styles.insufficientText}>
                Need {(reward.points_required - userPoints).toLocaleString()} more
              </Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    marginVertical: 8,
    alignSelf: "center",
    overflow: Platform.OS === "android" ? "hidden" : "visible",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  unavailableCard: {
    opacity: 0.6,
  },
  imageContainer: {
    position: "relative",
    width: "100%",
    height: 140,
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  stockBadge: {
    position: "absolute",
    top: -5,
    right: -5,
    backgroundColor: "#FEF3C7",
    borderColor: "#F59E0B",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  stockBadgeText: {
    fontSize: 11,
    color: "#F59E0B",
    fontWeight: "500",
  },
  expiryBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "#FFF5F0",
    borderColor: colors.error,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  expiryBadgeText: {
    fontSize: 11,
    color: colors.error,
    fontWeight: "500",
  },
  unavailableOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  unavailableText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 14,
    textAlign: "center",
  },
  content: {
    padding: 16,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    flexShrink: 1,
  },
  category: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: "600",
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
    lineHeight: 20,
    height: 40,
  },
  footer: {
    flexDirection: "column",
    gap: 8,
  },
  pointsContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
  },
  points: {
    fontSize: 18,
    fontWeight: "800",
    color: "#8B5CF6",
  },
  pointsLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.accent,
    marginLeft: 4,
  },
  insufficientContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEE2E2",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: "flex-start",
    gap: 4,
  },
  insufficientText: {
    fontSize: 11,
    color: "#EF4444",
    fontWeight: "600",
  },
  disabledText: {
    color: "#999",
  },
})

export default RewardCard
