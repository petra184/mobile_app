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

  const handleNotifyPress = () => {
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
        return getRelativeTimeDescription(new Date(game.date)) + " • " + game.time
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

  const getStatusGradient = () => {
    switch (game.status) {
      case "live":
        return ["#EF4444", "#DC2626"]
      case "completed":
        return ["#10B981", "#059669"]
      case "postponed":
      case "canceled":
        return ["#F59E0B", "#D97706"]
      default:
        return [colors.primary, colors.accent || "#4338CA"]
    }
  }

  const getSportDisplayName = () => {
    return game.sport?.display_name || game.sport?.name || "GAME"
  }

  const getTeamColor = () => {
    return game.homeTeam.primaryColor || colors.primary
  }

  if (compact) {
    return (
      <Pressable style={styles.compactContainer} onPress={handlePress}>
        <LinearGradient
          colors={["rgba(255, 255, 255, 0.9)", "rgba(255, 255, 255, 0.95)"]}
          style={styles.compactGradient}
        >
          <View style={styles.compactHeader}>
            <View style={styles.compactSportContainer}>
              <View style={[styles.compactSportLine, { backgroundColor: getTeamColor() }]} />
              <Text style={styles.compactSport}>{getSportDisplayName()}</Text>
            </View>
            <View style={[styles.compactStatusBadge, { backgroundColor: getStatusColor() }]}>
              <Text style={styles.compactStatusText}>{getStatusText()}</Text>
            </View>
          </View>

          <View style={styles.compactTeams}>
            <View style={styles.compactTeam}>
              <View style={styles.compactLogoContainer}>
                <Image
                  source={require("@/IMAGES/MAIN_LOGO.png")}
                  style={styles.compactLogo}
                />
              </View>
              <Text style={styles.compactTeamName} numberOfLines={1}>
                {game.homeTeam.shortName}
              </Text>
              {isCompleted && game.score && <Text style={styles.compactScore}>{game.score.home}</Text>}
            </View>

            <View style={styles.compactVsContainer}>
              <Text style={styles.compactVs}>VS</Text>
            </View>

            <View style={styles.compactTeam}>
              <View style={styles.compactLogoContainer}>
                <Image
                  source={{ uri: game.awayTeam.logo }}
                  style={styles.compactLogo}
                />
              </View>
              <Text style={styles.compactTeamName} numberOfLines={1}>
                {game.awayTeam.shortName}
              </Text>
              {isCompleted && game.score && <Text style={styles.compactScore}>{game.score.away}</Text>}
            </View>
          </View>

          <View style={styles.compactFooter}>
            <Feather name="map-pin" size={10} color={colors.textSecondary} />
            <Text style={styles.compactLocation}>{game.location}</Text>
          </View>

          {isUpcoming && (
            <Pressable style={styles.compactNotifyButton} onPress={handleNotifyPress}>
              <Feather name="bell" size={12} color={colors.primary} />
              <Text style={styles.compactNotifyText}>Notify me</Text>
            </Pressable>
          )}
        </LinearGradient>
      </Pressable>
    )
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

          <LinearGradient colors={getStatusGradient() as [string, string, ...string[]]} style={styles.statusBadge}>
            <Text style={styles.statusText}>{getStatusText()}</Text>
            {isLive && <View style={styles.livePulse} />}
          </LinearGradient>
        </View>

        {/* Location */}
        <View style={styles.locationContainer}>
          <Feather name="map-pin" size={12} color={colors.textSecondary} />
          <Text style={styles.location}>
            {game.location} • {game.locationType.toUpperCase()}
          </Text>
        </View>

        {/* Teams Container */}
        <View style={styles.teamsContainer}>
          {/* Home Team */}
          <View style={styles.teamContainer}>
            <View style={styles.teamLogoContainer}>
              <Image
                source={require("@/IMAGES/MAIN_LOGO.png")}
                style={styles.teamLogo}
              />
            </View>
            <Text style={styles.teamName} numberOfLines={2}>
              {game.homeTeam.name}
            </Text>
            {isCompleted && game.score && (
              <View style={styles.scoreContainer}>
                <Text style={styles.score}>{game.score.home}</Text>
              </View>
            )}
          </View>

          {/* VS Separator */}
          <View style={styles.vsContainer}>
            <View style={styles.vsCircle}>
              <Text style={styles.vs}>VS</Text>
            </View>
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
            <Text style={styles.teamName} numberOfLines={2}>
              {game.awayTeam.name}
            </Text>
            {isCompleted && game.score && (
              <View style={styles.scoreContainer}>
                <Text style={styles.score}>{game.score.away}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Live Indicator */}
        {isLive && (
          <LinearGradient colors={["rgba(239, 68, 68, 0.1)", "rgba(239, 68, 68, 0.05)"]} style={styles.liveIndicator}>
            <View style={styles.liveContent}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE NOW</Text>
              <Feather name="radio" size={14} color="#EF4444" />
            </View>
          </LinearGradient>
        )}

        {/* Notify Button for Upcoming Games */}
        {isUpcoming && (
          <Pressable style={styles.notifyButton} onPress={handleNotifyPress}>
            <Feather name="bell" size={16} color={colors.primary} />
            <Text style={styles.notifyButtonText}>Notify me about this game</Text>
          </Pressable>
        )}
      </LinearGradient>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  cardGradient: {
    borderRadius: 16,
    padding: 16,
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
    height: 20,
    borderRadius: 1.5,
    marginRight: 8,
  },
  sportName: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
    color: "white",
    letterSpacing: 0.5,
  },
  livePulse: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "white",
    marginLeft: 5,
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    justifyContent: "center",
  },
  location: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 4,
    fontWeight: "500",
  },
  teamsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 90,
    marginBottom: 12,
  },
  teamContainer: {
    flex: 2,
    alignItems: "center",
  },
  teamLogoContainer: {
    width: 60,
    height: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  teamLogo: {
    width: 60,
    height: 60,
    resizeMode: "contain",
  },
  teamName: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
    color: colors.text,
    maxWidth: 90,
    lineHeight: 18,
  },
  vsContainer: {
    flex: 1,
    alignItems: "center",
  },
  vsCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(107, 114, 128, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  vs: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textSecondary,
  },
  gameTime: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.primary,
  },
  scoreContainer: {
    marginTop: 6,
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  score: {
    fontSize: 20,
    fontWeight: "800",
    color: "#10B981",
  },
  liveIndicator: {
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  liveContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#EF4444",
    marginRight: 6,
  },
  liveText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#EF4444",
    marginRight: 6,
  },
  notifyButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(59, 130, 246, 0.1)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 8,
  },
  notifyButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.primary,
    marginLeft: 6,
  },

  // Compact styles
  compactContainer: {
    marginHorizontal: 8,
    marginVertical: 4,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  compactGradient: {
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.05)",
  },
  compactHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  compactSportContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  compactSportLine: {
    width: 2,
    height: 16,
    borderRadius: 1,
    marginRight: 6,
  },
  compactSport: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.primary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  compactStatusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  compactStatusText: {
    fontSize: 9,
    fontWeight: "700",
    color: "white",
  },
  compactTeams: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  compactTeam: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  compactLogoContainer: {
    width: 24,
    height: 24,
    borderRadius: 4,
    backgroundColor: "rgba(0, 0, 0, 0.02)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 6,
  },
  compactLogo: {
    width: 18,
    height: 18,
    resizeMode: "contain",
  },
  compactTeamName: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.text,
    flex: 1,
  },
  compactScore: {
    fontSize: 14,
    fontWeight: "700",
    color: "#10B981",
    marginLeft: 6,
  },
  compactVsContainer: {
    alignItems: "center",
    marginHorizontal: 8,
  },
  compactVs: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.textSecondary,
  },
  compactFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  compactLocation: {
    fontSize: 10,
    color: colors.textSecondary,
    marginLeft: 3,
    fontWeight: "500",
  },
  compactNotifyButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(59, 130, 246, 0.1)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  compactNotifyText: {
    fontSize: 10,
    fontWeight: "600",
    color: colors.primary,
    marginLeft: 4,
  },
})

export default GameCard
