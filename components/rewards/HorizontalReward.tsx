import { colors } from "@/constants/Colors"
import type { Reward } from "@/types/updated_types"
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons"
import type React from "react"
import { Alert, Image, Pressable, StyleSheet, Text, View } from "react-native"

interface HorizontalRewardItemProps {
  reward: Reward
  userPoints: number
  isInCart: boolean
  cartQuantity: number
  onPress: (reward: Reward) => void
  onAddToCart: (reward: Reward) => void
  onRemoveFromCart: (reward: Reward) => void
}

export const HorizontalRewardItem: React.FC<HorizontalRewardItemProps> = ({
  reward,
  userPoints,
  isInCart,
  cartQuantity,
  onPress,
  onAddToCart,
  onRemoveFromCart,
}) => {
  const canAfford = userPoints >= reward.points_required
  const isAvailable = (reward.stock_quantity ?? 0) > 0 && !reward.is_sold

  const handlePress = () => {
    onPress(reward)
  }

  const handleAddToCart = () => {
    if (!isAvailable) {
      Alert.alert("Out of Stock", "This reward is currently out of stock.")
      return
    }
    onAddToCart(reward)
  }

  const handleRemoveFromCart = () => {
    onRemoveFromCart(reward)
  }

  return (
    <Pressable
      style={({ pressed }) => [
        styles.container,
        !isAvailable && styles.unavailableContainer,
        pressed && styles.pressed,
      ]}
      onPress={handlePress}
    >
      <View style={styles.imageContainer}>
        <Image 
        source={ reward.image_url ? { uri: reward.image_url } : require("../../IMAGES/MAIN_LOGO.png")} style={styles.image} />
        {!isAvailable && (
          <View style={styles.unavailableOverlay}>
            <Text style={styles.unavailableText}>OUT OF STOCK</Text>
          </View>
        )}
      </View>

      <View style={styles.detailsContainer}>
        <Text style={styles.title} numberOfLines={1}>
          {reward.title}
        </Text>
        <Text style={styles.description} numberOfLines={2}>
          {reward.description || "No description available."}
        </Text>

        {reward.category && (
          <Text style={styles.category} numberOfLines={1}>
            {reward.category}
          </Text>
        )}

        <View style={styles.pointsContainer}>
          <MaterialCommunityIcons name="star-circle" size={16} color={colors.accent} />
          <Text style={styles.points}>{reward.points_required} POINTS</Text>
        </View>
      </View>

      <View style={styles.actionsContainer}>
        {isInCart ? (
          <View style={styles.quantityControl}>
            <Pressable onPress={handleRemoveFromCart} style={styles.quantityButton}>
              <Feather name="minus" size={18} color={"white"} />
            </Pressable>
            <Text style={styles.quantityText}>{cartQuantity}</Text>
            <Pressable
              onPress={handleAddToCart}
              style={[styles.quantityButton, !canAfford && styles.disabledButton]}
              disabled={!canAfford || cartQuantity >= (reward.stock_quantity ?? 0)}
            >
              <Feather name="plus" size={18} color={"white"} />
            </Pressable>
          </View>
        ) : (
          <View style={[styles.addButton]}>
            <Text style={styles.addButtonText}>View</Text>
          </View>
        )}
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginVertical: 8,
    marginHorizontal: 16,
    padding: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: "center",
    width: "auto",
  },
  unavailableContainer: {
    opacity: 0.6,
  },
  pressed: {
    opacity: 0.8,
  },
  imageContainer: {
    position: "relative",
    width: 90,
    height: 90,
    overflow: "hidden",
    marginRight: 12,
    borderRadius: 12,
    backgroundColor: colors.backgroundMuted,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  unavailableOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  unavailableText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 10,
    textAlign: "center",
  },
  detailsContainer: {
    flex: 1,
    justifyContent: "center",
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: 4,
  },
  description: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  category: {
    fontSize: 11,
    color: colors.textSecondary,
    fontStyle: "italic",
    marginBottom: 4,
  },
  pointsContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  points: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.accent,
    marginLeft: 4,
  },
  stock: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 2,
  },
  actionsContainer: {
    marginLeft: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  addButton: {
    backgroundColor: colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    minWidth: 70,
    marginRight:6,
    alignItems: "center",
  },
  addButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  quantityControl: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primaryLight,
    borderRadius: 20,
    overflow: "hidden",
  },
  quantityButton: {
    padding: 8,
  },
  quantityText: {
    fontSize: 14,
    fontWeight: "600",
    color: "white",
    marginHorizontal: 4,
  },
  disabledButton: {
    opacity: 0.5,
  },
})
