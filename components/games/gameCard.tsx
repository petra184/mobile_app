import type React from "react"
import { View, Text, StyleSheet, Pressable, Image } from "react-native"
import { colors } from "@/constants/colors"
import type { Game } from "@/types/game"
import Feather from "@expo/vector-icons/Feather"

interface GameCardProps {
  game: Game
  onPress?: (game: Game) => void
  onNotifyPress?: (game: Game) => void
  onQRScanPress?: (game: Game) => void
}

export const GameCard: React.FC<GameCardProps> = ({ game, onPress, onNotifyPress, onQRScanPress }) => {
  // Format date properly
  const formatGameDate = (dateString: string) => {
    const date = new Date(dateString)
    const options: Intl.DateTimeFormatOptions = {
      weekday: "short",
      month: "short",
      day: "numeric",
    }
    return date.toLocaleDateString("en-US", options)
  }

  // Format time properly
  const formatGameTime = (timeString?: string) => {
    if (!timeString) return "TBD"

    try {
      let date: Date

      if (timeString.includes(":")) {
        const [hours, minutes] = timeString.split(":")
        date = new Date()
        date.setHours(Number.parseInt(hours), Number.parseInt(minutes))
      } else {
        date = new Date(timeString)
      }

      return date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
    } catch (error) {
      return timeString
    }
  }

  const isCompleted = game.status === "completed"
  const isLive = game.status === "live"
  const isUpcoming = game.status === "scheduled" || (!isCompleted && !isLive)
  const isPastGame = isCompleted && !isLive

  // Check if game is today
  const gameDate = new Date(game.date)
  const isToday = new Date().toDateString() === gameDate.toDateString()

  // Get team logo or placeholder
  const getTeamLogo = (team: any) => {
    return team?.photo || team?.logo || null
  }

  // Get team primary color or default
  const getTeamColor = () => {
    return game.homeTeam?.primaryColor || colors.primary
  }

  // Add this utility function if you don't have it already
  const hexToRgba = (hex: string, alpha = 1): string => {
    if (!hex) return `rgba(0, 0, 0, ${alpha})`

    hex = hex.replace("#", "")

    if (hex.length === 3) {
      hex = hex
        .split("")
        .map((char) => char + char)
        .join("")
    }

    const r = Number.parseInt(hex.substring(0, 2), 16)
    const g = Number.parseInt(hex.substring(2, 4), 16)
    const b = Number.parseInt(hex.substring(4, 6), 16)

    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }

  const teamColor = getTeamColor()

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

  const handleQRScanPress = (e: any) => {
    e.stopPropagation()
    if (onQRScanPress) {
      onQRScanPress(game)
    }
  }

  return (
    <Pressable onPress={handlePress} style={styles.container}>
      {/* Today Badge */}
      {isToday && !isPastGame && (
        <View style={styles.todayBadge}>
          <Text style={styles.todayText}>TODAY</Text>
        </View>
      )}

      {/* Live Badge */}
      {isLive && (
        <View style={styles.liveBadge}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>LIVE</Text>
        </View>
      )}

      {/* Teams Container */}
      <View style={styles.teamsContainer}>
        {/* Home Team */}
        <View style={styles.teamColumn}>
          <View style={[styles.logoContainer]}>
            {getTeamLogo(game.homeTeam) ? (
              <Image source={{ uri: getTeamLogo(game.homeTeam) }} style={styles.logo} />
            ) : (
              <Feather name="home" size={32} color={isPastGame ? "#6b7280" : teamColor} />
            )}
          </View>
          <Text style={[styles.teamName, { color: isPastGame ? "#6b7280" : colors.text }]}>
            {game.homeTeam?.name || "Home"}
          </Text>
          {isCompleted && game.score?.home !== null && game.score?.home !== undefined && (
            <Text style={[styles.score, { color: isPastGame ? "#6b7280" : "#10B981" }]}>{game.score.home}</Text>
          )}
        </View>

        {/* VS Container */}
        <View style={styles.vsContainer}>
          <Text style={[styles.vsText, { color: isPastGame ? "#6b7280" : colors.textSecondary }]}>VS</Text>
          {isCompleted && game.score && (
            <Text style={[styles.finalText, { color: isPastGame ? "#6b7280" : "#10B981" }]}>FINAL</Text>
          )}
        </View>

        {/* Away Team */}
        <View style={styles.teamColumn}>
          <View style={[styles.logoContainer]}>
            {getTeamLogo(game.awayTeam) ? (
              <Image source={{ uri: getTeamLogo(game.awayTeam) }} style={styles.logo} />
            ) : (
              <Feather name="users" size={32} color={isPastGame ? "#6b7280" : colors.textSecondary} />
            )}
          </View>
          <Text style={[styles.teamName, { color: isPastGame ? "#6b7280" : colors.text }]}>
            {game.awayTeam?.shortName || game.awayTeam?.name || "Away"}
          </Text>
          {isCompleted && game.score?.away !== null && game.score?.away !== undefined && (
            <Text style={[styles.score, { color: isPastGame ? "#6b7280" : colors.text }]}>{game.score.away}</Text>
          )}
        </View>
      </View>

      {/* Details Container */}
      <View style={styles.detailsContainer}>
        <View style={styles.detailRow}>
          <Feather name="calendar" size={16} color={isPastGame ? "#6b7280" : colors.textSecondary} />
          <Text style={[styles.detailText, { color: isPastGame ? "#6b7280" : colors.textSecondary }]}>
            {isToday ? "Today" : formatGameDate(game.date)}, {formatGameTime(game.time)}
          </Text>
        </View>

        {game.location && (
          <View style={styles.detailRow}>
            <Feather name="map-pin" size={16} color={isPastGame ? "#6b7280" : colors.textSecondary} />
            <Text style={[styles.detailText, { color: isPastGame ? "#6b7280" : colors.textSecondary }]}>
              {game.location}
            </Text>
          </View>
        )}

        {game.points && game.points > 0 && (
          <View style={styles.detailRow}>
            <Feather name="award" size={16} color={isPastGame ? "#6b7280" : colors.secondary} />
            <Text style={[styles.detailText, styles.pointsText, { color: isPastGame ? "#6b7280" : colors.secondary }]}>
              {game.points} points for attending
            </Text>
          </View>
        )}
      </View>

      {/* Action Buttons - Only for upcoming games */}
      {isUpcoming && (
        <View style={styles.buttonsContainer}>
          {onNotifyPress && (
            <Pressable style={[styles.actionButton, styles.notifyButton]} onPress={handleNotifyPress}>
              <Feather name="bell" size={16} color={teamColor} />
              <Text style={[styles.buttonText, { color: teamColor }]}>Notify Me</Text>
            </Pressable>
          )}

          {onQRScanPress && (
            <Pressable
              style={[styles.actionButton, styles.scanButton, { backgroundColor: teamColor }]}
              onPress={handleQRScanPress}
            >
              <Feather name="camera" size={16} color="white" />
              <Text style={[styles.buttonText, { color: "white" }]}>Check In</Text>
            </Pressable>
          )}
        </View>
      )}

      {/* Single Check In Button for past games or when no specific actions */}
      {(isPastGame || (!onNotifyPress && !onQRScanPress)) && (
        <View style={[styles.attendButton, { backgroundColor: isPastGame ? "#6b7280" : teamColor }]}>
          <Text style={styles.attendButtonText}>{isPastGame ? "Game Completed" : "Check In"}</Text>
        </View>
      )}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    elevation: 3,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    position: "relative",
  },
  todayBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: colors.secondary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 1,
  },
  todayText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "bold",
  },
  liveBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    backgroundColor: "#EF4444",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    zIndex: 1,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "white",
    marginRight: 4,
  },
  liveText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  teamsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  teamColumn: {
    alignItems: "center",
    flex: 2,
  },
  logoContainer: {
    width: "100%",
    height: 70,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    marginBottom: 8,
  },
  logo: {
    width: 80,
    height: 70,
  },
  teamName: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.text,
    textAlign: "center",
    marginBottom: 4,
  },
  score: {
    fontSize: 24,
    fontWeight: "700",
    marginTop: 4,
  },
  vsContainer: {
    flex: 1,
    alignItems: "center",
  },
  vsText: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.textSecondary,
  },
  finalText: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: 4,
  },
  detailsContainer: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 8,
  },
  pointsText: {
    fontWeight: "500",
  },
  buttonsContainer: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  notifyButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: colors.border,
  },
  scanButton: {
    // backgroundColor set dynamically with teamColor
  },
  buttonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  attendButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  attendButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
})

export default GameCard
