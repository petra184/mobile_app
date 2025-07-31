"use client"
import { colors } from "@/constants/Colors"
import { getStoryByGameId } from "@/lib/actions/news"
import type { Game } from "@/types/updated_types"
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import { router } from "expo-router"
import type React from "react"
import { useEffect, useState } from "react"
import { Image, Pressable, StyleSheet, Text, View } from "react-native"
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from "react-native-reanimated"

interface GameCardProps {
  game: Game
  onPress?: (game: Game) => void
  onNotifyPress?: (game: Game) => void
  onQRScanPress?: (game: Game) => void
  onNewsPress?: (game: Game) => void
  onGameDetailsPress?: (game: Game) => void
}

export const GameCard: React.FC<GameCardProps> = ({ game, onPress, onNotifyPress, onNewsPress }) => {
  const [gameStory, setGameStory] = useState<{ id: string; title: string; headline: string } | null>(null)
  const [isLoadingStory, setIsLoadingStory] = useState(false)
  const scale = useSharedValue(1)
  const opacity = useSharedValue(1)

  // SIMPLE DATE COMPARISON - ONLY BASED ON DATE
  const gameDate = new Date(game.date)
  const today = new Date()
  // Reset time to 00:00:00 for both dates to compare only the date part
  gameDate.setHours(0, 0, 0, 0)
  today.setHours(0, 0, 0, 0)

  // Simple comparison: is game date before today?
  const isPastGame = gameDate < today
  const isToday = gameDate.getTime() === today.getTime()
  const isFutureGame = gameDate > today

  // Status checks (only for display purposes, not for filtering)
  const isCompleted = game.status === "completed" || game.status === "final"
  const isLive = game.status === "live"
  const isPostponed = game.status === "postponed"
  const isCanceled = game.status === "canceled"

  // Function to count special events
  const getSpecialEventsCount = () => {
    let count = 0
    if (game.special_events && game.special_events.trim()) count++
    if (game.halftime_activity && game.halftime_activity.trim()) count++
    return count
  }

  // Function to get special events display text
  const getSpecialEventsText = () => {
    const count = getSpecialEventsCount()
    if (count === 0) return null
    if (count === 1) return "1 Special Event!"
    return `${count} Special Events`
  }

  // Check for story when component mounts or game changes
  useEffect(() => {
    const checkForStory = async () => {
      if (game.id && isPastGame) {
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
  }, [game.id, isPastGame])

  // Format date properly - different for completed vs upcoming
  const formatGameDate = (dateString: string, isCompleted = false) => {
    const date = new Date(dateString)
    const options: Intl.DateTimeFormatOptions = isCompleted
      ? {
          weekday: "short",
          month: "short",
          day: "numeric",
        }
      : {
          weekday: "long",
          month: "long",
          day: "numeric",
          year: "numeric",
        }
    return date.toLocaleDateString("en-US", options)
  }

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }))

  // Check if game is within an hour from now
  const isWithinOneHour = () => {
    if (!game.date || !game.time) return false
    try {
      const gameDateTime = new Date(game.date)
      if (game.time.includes(":")) {
        const [hours, minutes] = game.time.split(":")
        gameDateTime.setHours(Number.parseInt(hours, 10), Number.parseInt(minutes, 10), 0, 0)
      }
      const now = new Date()
      const timeDiff = gameDateTime.getTime() - now.getTime()
      const oneHourInMs = 60 * 60 * 1000
      return timeDiff <= oneHourInMs && timeDiff >= 0
    } catch (error) {
      return false
    }
  }

  // Get game photo from database or fallback
  const getGamePhoto = () => {
    return game.photo_url || game.homeTeam?.logo || "/placeholder.svg?height=200&width=400"
  }

  // Get status display info
  const getStatusInfo = () => {
    if (isLive) return { text: "LIVE NOW", color: colors.error }
    if (isPastGame || isCompleted) return { text: "FINAL", color: colors.success }
    if (isPostponed) return { text: "POSTPONED", color: colors.warning }
    if (isCanceled) return { text: "CANCELED", color: colors.error }
    if (isToday) return { text: "TODAY", color: colors.primary }
    return { text: "UPCOMING", color: colors.success }
  }

  const statusInfo = getStatusInfo()

  const handlePress = () => onPress?.(game)

  const handleNotifyPress = (e: any) => {
    e.stopPropagation()
    onNotifyPress?.(game)
  }

  const handleQRScanPress = (e: any) => {
    e.stopPropagation()
    router.push({ pathname: "../(tabs)/qr_code", params: { id: game.id } })
  }

  const handleNewsPress = (e: any) => {
    e.stopPropagation()
    if (gameStory) {
      router.push({ pathname: "../all_cards/news_details", params: { id: gameStory.id } })
    } else {
      onNewsPress?.(game)
    }
  }

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 15 })
    opacity.value = withTiming(0.9, { duration: 100 })
  }

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15 })
    opacity.value = withTiming(1, { duration: 150 })
  }

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        style={[styles.card, !isCompleted && !isPastGame && isCanceled && styles.unavailableCard]}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        android_ripple={{ color: "rgba(0,0,0,0.1)" }}
      >
        {/* Left Section - Image */}
        <View style={styles.leftSection}>
          <View style={styles.imageContainer}>
            <Image source={{ uri: getGamePhoto() }} style={styles.image} />

            {/* Points Badge - Using the banner design from original */}
            {game.points && game.points > 0 && (
              <View style={styles.pointsBadge}>
                <LinearGradient
                  colors={[colors.primary, colors.accent]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.pointsBadgeGradient}
                >
                  <MaterialCommunityIcons name="fire" size={16} color="#FFFFFF" />
                  <Text style={styles.pointsText}>{game.points}</Text>
                  <Text style={styles.pointsLabel}>PTS</Text>
                </LinearGradient>
              </View>
            )}
          </View>
        </View>

        {/* Right Section - Content */}
        <View style={styles.rightSection}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.teamName} numberOfLines={2}>
              {game.homeTeam?.name || "Home Team"} VS {game.awayTeam?.name || "Away Team"}
            </Text>
            <View style={[styles.statusIndicator, { backgroundColor: statusInfo.color }]}>
              <Text style={styles.statusText}>{statusInfo.text}</Text>
            </View>
          </View>

          {/* Game Info */}
          <View style={styles.infoContainer}>
            <View style={styles.infoRow}>
              <Feather name="calendar" size={16} color={colors.textSecondary} />
              <Text style={styles.infoText}>{formatGameDate(game.date, isPastGame)}</Text>
            </View>

            <View style={styles.infoRow}>
              <Feather name="clock" size={16} color={colors.textSecondary} />
              <Text style={styles.infoText}>{game.time}</Text>
            </View>

            <View style={styles.infoRow}>
              <Feather name="map-pin" size={16} color={colors.textSecondary} />
              <Text style={styles.infoText}>{game.location}</Text>
            </View>
          </View>

          {/* Season Type */}
          <View style={styles.seasonContainer}>
            <Text style={styles.seasonType}>
              {game.seasonType
                ?.split("-")
                .map((word) => word.toUpperCase())
                .join(" ")}
            </Text>
          </View>

          {/* Special Events */}
          {getSpecialEventsCount() > 0 && !isCanceled && (
            <View style={styles.specialEventsContainer}>
              <View style={styles.specialEventBadge}>
                <MaterialCommunityIcons name="star-circle" size={14} color={colors.accent} />
                <Text style={styles.specialEventText}>{getSpecialEventsText()}</Text>
              </View>
            </View>
          )}

          {/* Score Display for Past Games */}
          {isPastGame && game.score && (
            <View style={styles.scoreContainer}>
              <Text style={styles.scoreText}>
                {game.score.home} - {game.score.away}
              </Text>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            {/* Notify Button */}
            {onNotifyPress && !isPostponed && !isCompleted && !isLive && !isPastGame && !isCanceled && (
              <Pressable
                style={styles.button}
                onPress={handleNotifyPress}
                android_ripple={{ color: "rgba(30, 136, 229, 0.1)" }}
              >
                <Feather name="bell" size={16} color={colors.primary} />
                <Text style={styles.buttonText}>Notify Me</Text>
              </Pressable>
            )}

            {/* QR Scan Button */}
            {(isWithinOneHour() || isLive) && (
              <Pressable
                style={[styles.button, styles.qrButton]}
                onPress={handleQRScanPress}
                android_ripple={{ color: "rgba(59, 130, 246, 0.1)" }}
              >
                <MaterialCommunityIcons name="qrcode" size={16} color="#3B82F6" />
                <Text style={[styles.buttonText, styles.qrButtonText]}>Scan QR</Text>
              </Pressable>
            )}

            {/* Story Button for Past Games */}
            {gameStory && !isLoadingStory && isPastGame && (
              <Pressable
                style={[styles.button, styles.storyButton]}
                onPress={handleNewsPress}
                android_ripple={{ color: "rgba(255, 87, 34, 0.1)" }}
              >
                <Feather name="book-open" size={16} color={colors.secondary} />
                <Text style={[styles.buttonText, styles.storyButtonText]}>Read Story</Text>
              </Pressable>
            )}
          </View>
        </View>
      </Pressable>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    marginBottom: 16,
    marginHorizontal: 16,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    flexDirection: "row",
    minHeight: 140,
  },
  unavailableCard: {
    opacity: 0.6,
  },
  leftSection: {
    width: 120,
    position: "relative",
  },
  imageContainer: {
    flex: 1,
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  pointsBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    borderRadius: 12,
    overflow: "hidden",
    minWidth: 50,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  pointsBadgeGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
    paddingVertical: 6,
    gap: 2,
  },
  pointsText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 18,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  pointsLabel: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 10,
    fontWeight: "500",
    lineHeight: 12,
  },
  rightSection: {
    flex: 1,
    padding: 16,
    justifyContent: "space-between",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  teamName: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    flex: 1,
    marginRight: 12,
  },
  statusIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  infoContainer: {
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    color: colors.textSecondary,
    flex: 1,
  },
  seasonContainer: {
    marginBottom: 8,
  },
  seasonType: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  specialEventsContainer: {
    marginBottom: 12,
  },
  specialEventBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.accent + "20",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
    gap: 4,
  },
  specialEventText: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: "600",
  },
  scoreContainer: {
    alignItems: "center",
    marginBottom: 12,
  },
  scoreText: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.primary,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 8,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.primary,
    flex: 1,
    gap: 6,
    backgroundColor: "rgba(30, 136, 229, 0.05)",
  },
  buttonText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: "600",
  },
  qrButton: {
    borderColor: "#3B82F6",
    backgroundColor: "rgba(59, 130, 246, 0.05)",
  },
  qrButtonText: {
    color: "#3B82F6",
  },
  storyButton: {
    borderColor: colors.secondary,
    backgroundColor: "rgba(255, 87, 34, 0.05)",
  },
  storyButtonText: {
    color: colors.secondary,
  },
})

export default GameCard
