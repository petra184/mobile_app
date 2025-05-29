import type React from "react"
import { View, Text, StyleSheet, Pressable, Image } from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { colors } from "@/constants/colors"
import { getRelativeTimeDescription } from "@/utils/dateUtils"
import type { Game } from "@/types/game"
import Feather from "@expo/vector-icons/Feather"

interface GameCardProps {
  game: Game
  onPress?: (game: Game) => void
  onNotifyPress?: (game: Game) => void
  compact?: boolean
}

export const GameCard: React.FC<GameCardProps> = ({ game, onPress, onNotifyPress, compact = false }) => {
  const isCompleted = game.status === "completed"
  const isLive = game.status === "live"
  const isUpcoming = game.status === "scheduled"

  const handlePress = () => {
    if (onPress) {
      onPress(game)
    }
  }

  const handleNotifyPress = (e: any) => {
    e.stopPropagation()
    if (onNotifyPress) {
      onNotifyPress(game)
    }
  }

  const getStatusText = () => {
    switch (game.status) {
      case "live":
        return "LIVE"
      case "completed":
        return "FINAL"
      case "postponed":
        return "POSTPONED"
      case "canceled":
        return "CANCELED"
      default:
        return getRelativeTimeDescription(new Date(game.date))
    }
  }

  const getStatusColor = () => {
    switch (game.status) {
      case "live":
        return "#EF4444"
      case "completed":
        return "#10B981"
      case "postponed":
      case "canceled":
        return "#F59E0B"
      default:
        return colors.primary
    }
  }

  const getSportDisplayName = () => {
    return game.sport?.display_name || game.sport?.name || "GAME"
  }

  const getTeamColor = () => {
    return game.homeTeam.primaryColor || colors.primary
  }

  return (
    <Pressable style={styles.container} onPress={handlePress}>
      <LinearGradient colors={["rgba(255, 255, 255, 0.95)", "rgba(255, 255, 255, 1)"]} style={styles.cardGradient}>
        {/* Header with Sport and Status */}
        <View style={styles.header}>
          <View style={styles.sportContainer}>
            <View style={[styles.sportLine, { backgroundColor: getTeamColor() }]} />
            <Text style={styles.sportName}>{getSportDisplayName()}</Text>
          </View>

          <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
            <Text style={styles.statusText}>{getStatusText()}</Text>
            {isLive && <View style={styles.livePulse} />}
          </View>
        </View>

        {/* Teams Container */}
        <View style={styles.teamsContainer}>
          {/* Home Team */}
          <View style={styles.teamContainer}>
            <View style={styles.teamLogoContainer}>
              <Image source={require("@/IMAGES/MAIN_LOGO.png")} style={styles.teamLogo} />
            </View>
            <Text style={styles.teamName} numberOfLines={1}>
              {game.homeTeam.name}
            </Text>
            {isCompleted && game.score && <Text style={styles.score}>{game.score.home}</Text>}
          </View>

          {/* VS Separator */}
          <View style={styles.vsContainer}>
            <Text style={styles.vs}>VS</Text>
            {isUpcoming && <Text style={styles.gameTime}>{game.time}</Text>}
          </View>

          {/* Away Team */}
          <View style={styles.teamContainer}>
            <View style={styles.teamLogoContainer}>
              <Image
                source={{ uri: game.awayTeam.logo }}
                style={styles.teamLogo}
                defaultSource={require("@/IMAGES/MAIN_LOGO.png")}
              />
            </View>
            <Text style={styles.teamName} numberOfLines={1}>
              {game.awayTeam.shortName || game.awayTeam.name}
            </Text>
            {isCompleted && game.score && <Text style={styles.score}>{game.score.away}</Text>}
          </View>
        </View>

        {/* Location - Only for upcoming games */}
        {isUpcoming && (
          <View style={styles.locationContainer}>
            <Feather name="map-pin" size={12} color={colors.textSecondary} />
            <Text style={styles.location}>{game.location}</Text>

            {/* Notify Button for Upcoming Games */}
            <Pressable style={styles.notifyButton} onPress={handleNotifyPress}>
              <Feather name="bell" size={14} color={colors.primary} />
            </Pressable>
          </View>
        )}

        {/* Live Indicator */}
        {isLive && (
          <View style={styles.liveIndicator}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE NOW</Text>
          </View>
        )}
      </LinearGradient>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  cardGradient: {
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.05)",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  sportContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  sportLine: {
    width: 3,
    height: 16,
    borderRadius: 1.5,
    marginRight: 8,
  },
  sportName: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.text,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  statusText: {
    fontSize: 10,
    fontWeight: "700",
    color: "white",
    letterSpacing: 0.5,
  },
  livePulse: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "white",
    marginLeft: 4,
  },
  teamsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  teamContainer: {
    flex: 2,
    alignItems: "center",
  },
  teamLogoContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
    overflow: "hidden",
  },
  teamLogo: {
    width: 60,
    height: 50,
    resizeMode: "cover",
  },
  teamName: {
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
    color: colors.text,
  },
  vsContainer: {
    flex: 1,
    alignItems: "center",
  },
  vs: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textSecondary,
    marginBottom: 2,
  },
  gameTime: {
    fontSize: 10,
    fontWeight: "600",
    color: colors.primary,
  },
  score: {
    fontSize: 18,
    fontWeight: "800",
    color: "#10B981",
    marginTop: 2,
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: "rgba(0, 0, 0, 0.05)",
  },
  location: {
    fontSize: 11,
    color: colors.textSecondary,
    marginLeft: 4,
    fontWeight: "500",
    flex: 1,
  },
  notifyButton: {
    padding: 6,
    backgroundColor: "rgba(59, 130, 246, 0.1)",
    borderRadius: 8,
  },
  liveIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: "rgba(0, 0, 0, 0.05)",
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#EF4444",
    marginRight: 6,
    opacity: 0.8,
  },
  liveText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#EF4444",
  },
})

export default GameCard
