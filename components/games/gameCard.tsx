"use client"

import type React from "react"
import { View, Text, StyleSheet, Pressable, Image } from "react-native"
import { colors } from "@/constants/colors"
import type { Game } from "@/types/game"
import Feather from "@expo/vector-icons/Feather"
import Animated, { useAnimatedStyle, withTiming, useSharedValue, withSpring } from "react-native-reanimated"
import { useState, useEffect } from "react"
import { getStoryByGameId } from "@/app/actions/news"
import { router } from "expo-router"

interface GameCardProps {
  game: Game
  onPress?: (game: Game) => void
  onNotifyPress?: (game: Game) => void
  onQRScanPress?: (game: Game) => void
  onNewsPress?: (game: Game) => void
  onGameDetailsPress?: (game: Game) => void
}

export const GameCard: React.FC<GameCardProps> = ({
  game,
  onPress,
  onNotifyPress,
  onQRScanPress,
  onNewsPress,
  onGameDetailsPress,
}) => {
  const [gameStory, setGameStory] = useState<{ id: string; title: string; headline: string } | null>(null)
  const [isLoadingStory, setIsLoadingStory] = useState(false)

  // Check for story when component mounts or game changes
  useEffect(() => {
    const checkForStory = async () => {
      if (game.id && isCompleted) {
        setIsLoadingStory(true)
        try {
          const story = await getStoryByGameId(game.id)
          setGameStory(story)
        } catch (error) {
          console.error("Error checking for game story:", error)
          setGameStory(null)
        } finally {
          setIsLoadingStory(false)
        }
      }
    }

    checkForStory()
  }, [game.id])

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

  const scale = useSharedValue(1)
  const opacity = useSharedValue(1)

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }))

  // Format time properly
  const formatGameTime = (timeString?: string | null) => {
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

  const handleNewsPress = (e: any) => {
    e.stopPropagation()

    // If we have a story for this game, navigate to news details
    if (gameStory) {
      router.push({
        pathname: "../all_cards/news_details",
        params: { id: gameStory.id },
      })
    } else if (onNewsPress) {
      // Fallback to the original onNewsPress handler
      onNewsPress(game)
    }
  }

  const handleGameDetailsPress = (e: any) => {
    e.stopPropagation()
    if (onGameDetailsPress) {
      onGameDetailsPress(game)
    }
  }

  const handlePressIn = () => {
    scale.value = withSpring(0.96, { damping: 15 })
    opacity.value = withTiming(0.8, { duration: 100 })
  }

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15 })
    opacity.value = withTiming(1, { duration: 150 })
  }

  // Check if there are points to add bottom padding - ensure it's always boolean
  const hasPoints = Boolean(game.points && game.points > 0)

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPress={handlePress}
        style={[styles.container, hasPoints && styles.containerWithPoints]}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        android_ripple={{ color: "rgba(0, 0, 0, 0.1)", borderless: false }}
      >
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
            <View style={styles.logoContainer}>
              {getTeamLogo(game.homeTeam) ? (
                <Image source={{ uri: getTeamLogo(game.homeTeam) }} style={styles.logo} />
              ) : (
                <Feather name="home" size={32} color={isPastGame ? "#6b7280" : teamColor} />
              )}
            </View>
            <View style={styles.teamNameContainer}>
              <Text style={[styles.teamName, { color: isPastGame ? "#6b7280" : colors.text }]} numberOfLines={2}>
                {game.homeTeam?.name || "Home"}
              </Text>
            </View>
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
            <View style={styles.logoContainer}>
              {getTeamLogo(game.awayTeam) ? (
                <Image source={{ uri: getTeamLogo(game.awayTeam) }} style={styles.logo} />
              ) : (
                <Feather name="users" size={32} color={isPastGame ? "#6b7280" : colors.textSecondary} />
              )}
            </View>
            <View style={styles.teamNameContainer}>
              <Text style={[styles.teamName, { color: isPastGame ? "#6b7280" : colors.text }]} numberOfLines={2}>
                {game.awayTeam?.shortName || game.awayTeam?.name || "Away"}
              </Text>
            </View>
            {isCompleted && game.score?.away !== null && game.score?.away !== undefined && (
              <Text style={[styles.score, { color: isPastGame ? "#6b7280" : colors.text }]}>{game.score.away}</Text>
            )}
          </View>
        </View>

        {/* Completed Game Status - Centered */}
        {isCompleted && (
          <View style={styles.completedStatusContainer}>
            <Text style={styles.completedStatusText}>GAME COMPLETED</Text>
          </View>
        )}

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

          {hasPoints && (
            <View style={styles.detailRow}>
              <Feather name="award" size={16} color={isPastGame ? "#6b7280" : colors.secondary} />
              <Text
                style={[styles.detailText, styles.pointsText, { color: isPastGame ? "#6b7280" : colors.secondary }]}
              >
                {game.points} points for attending
              </Text>
            </View>
          )}
        </View>

        {/* Action Buttons - Only for upcoming games */}
        {isUpcoming && (
          <View style={styles.buttonsContainer}>
            {onNotifyPress && (
              <Pressable
                style={({ pressed, hovered }) => [
                  styles.actionButton,
                  {
                    backgroundColor: pressed
                      ? `${game.homeTeam.primaryColor}20`
                      : hovered
                        ? `${game.homeTeam.primaryColor}10`
                        : "transparent",
                    borderWidth: 1,
                  },
                ]}
                onPress={handleNotifyPress}
              >
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

        {/* Completed Game Actions - Only show if there's a story */}
        {isCompleted && gameStory && !isLoadingStory && (
          <View style={styles.completedActionsContainer}>
            {/* Read News Link */}
            <Pressable style={styles.newsLinkContainer} onPress={handleNewsPress}>
              <Text style={styles.newsLinkText}>Read More About it</Text>
              <Feather name="chevron-right" size={16} color={colors.primary} />
            </Pressable>
          </View>
        )}

        {/* Single Check In Button for when no specific actions */}
        {!isCompleted && !isUpcoming && !onNotifyPress && !onQRScanPress && (
          <View style={[styles.attendButton, { backgroundColor: teamColor }]}>
            <Text style={styles.attendButtonText}>Check In</Text>
          </View>
        )}
      </Pressable>
    </Animated.View>
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
  containerWithPoints: {
    paddingBottom: 24, // Extra padding when points are present
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
  completedStatusContainer: {
    alignItems: "center",
    marginVertical: 12,
    paddingVertical: 8,
    backgroundColor: "#FEF2F2",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  completedStatusText: {
    color: "#DC2626",
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
  },
  teamsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
    minHeight: 120,
  },
  teamColumn: {
    alignItems: "center",
    flex: 2,
    height: 120,
  },
  logoContainer: {
    width: 80,
    height: 60,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    marginBottom: 8,
  },
  logo: {
    width: 80,
    height: 60,
    resizeMode: "contain",
  },
  teamNameContainer: {
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  teamName: {
    fontSize: 14,
    fontWeight: "bold",
    color: colors.text,
    textAlign: "center",
    lineHeight: 18,
  },
  score: {
    fontSize: 24,
    fontWeight: "700",
    marginTop: 4,
  },
  vsContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    height: 120,
  },
  vsText: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.textSecondary,
  },
  finalText: {
    fontSize: 12,
    fontWeight: "600",
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
    borderColor: "gray",
  },
  scanButton: {
    // backgroundColor set dynamically with teamColor
  },
  buttonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  completedActionsContainer: {},
  newsLinkContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  newsLinkText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: "400",
    paddingRight: 20,
  },
  completedActionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
    borderWidth: 1,
  },
  detailsButton: {
    backgroundColor: "transparent",
    borderColor: "#10B981",
  },
  completedActionText: {
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
