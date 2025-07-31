import { colors } from "@/constants/Colors"
import type { UserStatusWithLevel } from "@/types/updated_types"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import type React from "react"
import { StyleSheet, Text, View } from "react-native"
import Animated, { FadeInUp } from "react-native-reanimated"

interface PointsStatusCardProps {
  userFirstName: string
  points: number
  name: boolean
  userStatus: UserStatusWithLevel | null
  animationDelay?: number
  style?: any
}

export const PointsStatusCard: React.FC<PointsStatusCardProps> = ({
  userFirstName,
  points,
  name,
  userStatus,
  animationDelay = 100,
  style,
}) => {
  // Map level number to membership tier
  const getMembershipTier = (levelNumber: number | null | undefined) => {
    if (!levelNumber) return "Bronze"
    if (levelNumber <= 2) return "Bronze"
    if (levelNumber <= 4) return "Silver"
    if (levelNumber <= 6) return "Gold"
    if (levelNumber <= 8) return "Platinum"
    return "Diamond"
  }

  const membershipTier = getMembershipTier(userStatus?.level_number)

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case "Bronze":
        return "medal-outline"
      case "Silver":
        return "trophy-award"
      case "Gold":
        return "star-outline"
      case "Platinum":
        return "crown-outline"
      case "Diamond":
        return "diamond-stone"
      default:
        return userStatus?.badge_icon || "star-outline"
    }
  }

  // Calculate progress percentage
  const progressPercentage = userStatus?.level_progress_percentage || 0

  return (
    <Animated.View entering={FadeInUp.duration(600).delay(animationDelay)} style={style}>
      <View style={styles.shadowWrapper}>
        <View style={styles.container}>
          <LinearGradient
            colors={[colors.primary, colors.accent]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.statusCard}
          >
            <View style={styles.statusHeader}>
              <View style={styles.statusInfo}>
                {name && <Text style={styles.statusGreeting}>Hello, {userFirstName}!</Text>}
                <Text style={styles.statusLevel}>{userStatus?.level_name || "Rookie Fan"}</Text>
                <View style={styles.statusBadge}>
                  <MaterialCommunityIcons name={getTierIcon(membershipTier) as any} size={16} color="white" />
                  <Text style={styles.statusBadgeText}>{membershipTier}</Text>
                </View>
              </View>
              <View style={styles.statusPoints}>
                <Text style={styles.statusPointsValue}>{points}</Text>
                <Text style={styles.statusPointsLabel}>Points</Text>
              </View>
            </View>

            {/* Progress to next level */}
            <View style={styles.progressContainer}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>Progress to next level</Text>
                <Text style={styles.progressPoints}>{userStatus?.points_to_next_level || 0} points to go</Text>
              </View>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${Math.min(progressPercentage, 100)}%`,
                    },
                  ]}
                />
              </View>
            </View>
          </LinearGradient>
        </View>
      </View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  statusCard: {
    padding: 24,
  },
  statusHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  shadowWrapper: {
    marginHorizontal: 16,
    borderRadius: 16,
    backgroundColor: "#fff", // Required for iOS shadows
    shadowColor: "black",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4, // Android
  },
  container: {
    borderRadius: 16,
    overflow: "hidden",
  },
  statusInfo: {
    flex: 1,
  },
  statusGreeting: {
    fontSize: 16,
    color: "white",
    opacity: 0.9,
    marginBottom: 4,
  },
  statusLevel: {
    fontSize: 24,
    fontWeight: "700",
    color: "white",
    marginBottom: 8,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: "flex-start",
  },
  statusBadgeText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
  },
  statusPoints: {
    alignItems: "flex-end",
  },
  statusPointsValue: {
    fontSize: 36,
    fontWeight: "800",
    color: "white",
  },
  statusPointsLabel: {
    fontSize: 14,
    color: "white",
    opacity: 0.8,
  },
  progressContainer: {
    marginTop: 8,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    color: "white",
    opacity: 0.9,
  },
  progressPoints: {
    fontSize: 14,
    color: "white",
    fontWeight: "600",
  },
  progressBar: {
    height: 6,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "white",
    borderRadius: 3,
  },
})