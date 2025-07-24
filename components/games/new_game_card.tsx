"use client"
import type React from "react"
import { View, Text, StyleSheet, Pressable, ImageBackground } from "react-native"
import { colors } from "@/constants/colors"
import type { Game } from "@/types/updated_types"
import Feather from "@expo/vector-icons/Feather"
import Animated, { useAnimatedStyle, withTiming, useSharedValue, withSpring } from "react-native-reanimated"
import { useState, useEffect, useCallback } from "react"
import { getStoryByGameId } from "@/app/actions/news"
import { router } from "expo-router"
import { LinearGradient } from "expo-linear-gradient"
import { MaterialCommunityIcons } from "@expo/vector-icons"

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

  // Helper function to parse 12-hour time to 24-hour format (same as game details and home screen)
  const parse12HourTime = useCallback((timeStr: string): string => {
    try {
      const [time, modifier] = timeStr.toUpperCase().split(" ")
      let [hours, minutes] = time.split(":").map(Number)

      if (modifier === "PM" && hours < 12) {
        hours += 12
      }
      if (modifier === "AM" && hours === 12) {
        hours = 0
      }

      return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00`
    } catch (e) {
      console.error("Error parsing 12-hour time:", timeStr, e)
      return "00:00:00"
    }
  }, [])

  // Calculate game start and end times (same as game details and home screen)
  const getGameTimings = useCallback(
    (gameData: Game) => {
      const gameDate = new Date(gameData.date)
      let gameStartTime = new Date(gameDate)

      if (gameData.time) {
        const time24h = parse12HourTime(gameData.time)
        gameStartTime = new Date(`${gameDate.toISOString().split("T")[0]}T${time24h}`)
      } else {
        gameStartTime.setHours(0, 0, 0, 0)
      }

      const gameEndTime = new Date(gameStartTime.getTime() + 60 * 60 * 1000) // 1 hour after game start
      return { gameStartTime, gameEndTime }
    },
    [parse12HourTime],
  )

  // UPDATED: Use time-based logic to determine if game is live
  const isGameLive = useCallback((): boolean => {
    // Skip completed, postponed, or canceled games
    if (
      game.status === "completed" ||
      game.status === "final" ||
      game.status === "postponed" ||
      game.status === "canceled"
    ) {
      return false
    }

    try {
      const now = new Date()
      const { gameStartTime, gameEndTime } = getGameTimings(game)

      // Game is live if current time is between start and end time
      return now >= gameStartTime && now <= gameEndTime
    } catch (error) {
      console.error("Error calculating game timings for game:", game.id, error)
      return false
    }
  }, [game, getGameTimings])

  // UPDATED: Use time-based logic for date comparisons
  const getGameDateInfo = useCallback(() => {
    const now = new Date()
    const { gameStartTime, gameEndTime } = getGameTimings(game)

    const isCompleted = game.status === "completed" || game.status === "final"
    const isPostponed = game.status === "postponed"
    const isCanceled = game.status === "canceled"
    const isLive = isGameLive()

    // Check if game is in the past (ended and not completed status)
    const gameDateStr = gameStartTime.toISOString().split("T")[0]
    const nowDateStr = now.toISOString().split("T")[0]
    const isGameInPast = gameDateStr < nowDateStr || (gameDateStr === nowDateStr && now > gameEndTime && !isCompleted)

    // Check if game is today
    const isToday = now.toDateString() === gameStartTime.toDateString()

    // Determine if it's truly upcoming (scheduled AND in the future)
    const isUpcoming = !isCompleted && !isLive && !isPostponed && !isCanceled && !isGameInPast

    return {
      isLive,
      isCompleted,
      isPostponed,
      isCanceled,
      isToday,
      isUpcoming,
      isPastGame: isGameInPast || isCompleted,
      gameStartTime,
      gameEndTime,
    }
  }, [game, getGameTimings, isGameLive])

  const gameInfo = getGameDateInfo()

  // UPDATED: Check if game is within an hour from now using proper time logic
  const isWithinOneHour = useCallback((): boolean => {
    if (!game.date || !game.time) return false

    try {
      const now = new Date()
      const { gameStartTime } = getGameTimings(game)
      const timeDiff = gameStartTime.getTime() - now.getTime()
      const oneHourInMs = 60 * 60 * 1000

      return timeDiff <= oneHourInMs && timeDiff >= 0
    } catch (error) {
      console.error("Error in isWithinOneHour:", error)
      return false
    }
  }, [game, getGameTimings])

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
      if (game.id && gameInfo.isPastGame) {
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
  }, [game.id, gameInfo.isPastGame])

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
          month: "short",
          day: "numeric",
          year: "numeric",
        }
    return date.toLocaleDateString("en-US", options)
  }

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }))

  // Get game photo from database or fallback
  const getGamePhoto = () => {
    return game.photo_url || game.homeTeam?.logo || "/placeholder.svg?height=200&width=400"
  }

  // UPDATED: Get status display info using time-based logic
  const getStatusInfo = () => {
    if (gameInfo.isLive) return { text: "LIVE NOW", gradient: ["#EF4444", "#DC2626"] as const }
    if (gameInfo.isPastGame || gameInfo.isCompleted) return { text: "FINAL", gradient: ["#3B82F6", "#2563EB"] as const }
    if (gameInfo.isPostponed) return { text: "POSTPONED", gradient: ["#F59E0B", "#D97706"] as const }
    if (gameInfo.isCanceled) return { text: "CANCELED", gradient: ["#EF4444", "#DC2626"] as const }
    if (gameInfo.isToday) return { text: "TODAY", gradient: ["#3B82F6", "#2563EB"] as const }
    return { text: "UPCOMING", gradient: ["#10B981", "#059669"] as const }
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

  // RENDER PAST GAME LAYOUT - ONLY IF DATE IS IN THE PAST
  if (gameInfo.isPastGame) {
    const getColor = () => {
      if (game.score) {
        if (game.score?.away < game.score?.home) {
          return ["#F0FDF4", "#10B981"]
        } else {
          return ["rgba(204, 93, 81, 0.12)", "rgba(129, 25, 25, 0.84)"]
        }
      }
      return ["#F0FDF4", "#10B981"]
    }

    return (
      <Animated.View style={animatedStyle}>
        <View style={styles.shadowWrapper}>
          <Pressable
            onPress={handlePress}
            style={styles.container}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            android_ripple={{ color: "rgba(0, 0, 0, 0.1)", borderless: false }}
          >
            <View style={styles.heroSection}>
              <ImageBackground
                source={{ uri: getGamePhoto() }}
                style={styles.heroImage}
                imageStyle={styles.heroImageStyle}
                resizeMode="cover"
              >
                <LinearGradient
                  colors={["rgba(0,0,0,0.3)", "rgba(0,0,0,0.7)"]}
                  style={[styles.heroOverlay, styles.completedHeroOverlayContent]}
                >
                  <View style={styles.topRow2}>
                    <LinearGradient colors={statusInfo.gradient} style={styles.statusBadge}>
                      <Text style={styles.statusText}>{statusInfo.text}</Text>
                    </LinearGradient>
                  </View>
                  <Text style={styles.sportText}>
                    {game.homeTeam?.name || "Home Team"} VS {game.awayTeam?.name || "Away Team"}
                  </Text>
                </LinearGradient>
              </ImageBackground>
            </View>
            <View style={styles.contentSection}>
              <View style={styles.completedGameContainer}>
                {game.score && (
                  <View style={[styles.scoreContainer, { backgroundColor: getColor()[0] }]}>
                    <Text style={[styles.scoreText, { color: getColor()[1] }]}>{game.score.home}</Text>
                    <Text style={[styles.scoreDivider, { color: getColor()[1] }]}>-</Text>
                    <Text style={[styles.scoreText, { color: getColor()[1] }]}>{game.score.away}</Text>
                  </View>
                )}
              </View>
              <View style={styles.completedGameInfo}>
                <View style={styles.completedDateContainer}>
                  <Feather name="calendar" size={16} color={colors.textSecondary} />
                  <Text style={styles.completedDateText}>
                    {formatGameDate(game.date, true)} • {game.time}
                  </Text>
                </View>
                <Text style={styles.completedLocationText}>
                  {game.game_type?.toUpperCase() || "GAME"} • {game.location || "TBD"}
                </Text>
              </View>
              {gameStory && !isLoadingStory && (
                <Pressable style={styles.newsButton} onPress={handleNewsPress}>
                  <Feather name="book-open" size={18} color={colors.primary} />
                  <Text style={styles.newsButtonText}>Read Game Story</Text>
                  <Feather name="chevron-right" size={18} color={colors.primary} />
                </Pressable>
              )}
            </View>
          </Pressable>
        </View>
      </Animated.View>
    )
  }

  // RENDER UPCOMING/TODAY GAME LAYOUT - FOR TODAY AND FUTURE DATES
  return (
    <Animated.View style={animatedStyle}>
      <View style={styles.shadowWrapper}>
        <Pressable
          onPress={handlePress}
          style={[styles.container, gameInfo.isCanceled && styles.canceledContainer]}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          android_ripple={{ color: "rgba(0, 0, 0, 0.1)", borderless: false }}
        >
          {/* Header Section */}
          <View style={styles.headerSection}>
            <ImageBackground
              source={{ uri: getGamePhoto() }}
              style={styles.heroImage}
              imageStyle={styles.heroImageStyle}
              resizeMode="cover"
            >
              <LinearGradient
                colors={
                  gameInfo.isCanceled ? ["rgba(0,0,0,0.5)", "rgba(0,0,0,0.8)"] : ["rgba(0,0,0,0.3)", "rgba(0,0,0,0.7)"]
                }
                style={styles.heroOverlay}
              >
                {/* Points Banner - Top Right */}
                {game.points && game.points > 0 && (
                  <View style={styles.pointsBadgeContainer}>
                    <View style={styles.bannerHangerContainer}>
                      <View style={styles.bannerHanger} />
                      <View style={styles.bannerHanger} />
                    </View>
                    <View style={styles.bannerShape}>
                      <LinearGradient
                        colors={[colors.primary, colors.accent]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.bannerGradient}
                      >
                        <MaterialCommunityIcons name="fire" size={20} color="#FFFFFF" />
                        <Text style={styles.pointsValue}>{game.points}</Text>
                        <Text style={styles.pointsLabel}>PTS</Text>
                      </LinearGradient>
                      <View style={styles.bannerNotch}>
                        <LinearGradient
                          colors={[colors.primary, colors.accent]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={styles.notchGradientFill}
                        />
                        <View style={styles.notchCoverLeft} />
                        <View style={styles.notchCoverRight} />
                      </View>
                    </View>
                  </View>
                )}
                {/* Game Title - Bottom Left */}
                <View style={styles.bottomRow}>
                  <Text style={styles.sportText}>
                    {game.homeTeam?.name || "Home Team"} VS {game.awayTeam?.name || "Away Team"}
                  </Text>
                </View>
              </LinearGradient>
            </ImageBackground>
          </View>
          {/* Content Section */}
          <View style={styles.contentSection}>
            {gameInfo.isCanceled && (
              <View style={styles.canceledBanner}>
                <LinearGradient colors={["#EF4444", "#DC2626"]} style={styles.canceledBannerGradient}>
                  <MaterialCommunityIcons name="cancel" size={18} color="white" />
                  <Text style={styles.canceledBannerText}>GAME CANCELED</Text>
                </LinearGradient>
              </View>
            )}
            {!gameInfo.isCanceled &&
              (gameInfo.isPostponed ? (
                <View style={styles.postponedInfoRow}>
                  <View style={styles.dateLocationContainer}>
                    <View style={styles.dateTimeRow}>
                      <Feather name="calendar" size={20} color={colors.primary} />
                      <Text style={styles.dateTimeText}>
                        {formatGameDate(game.date)} • {game.time}
                      </Text>
                    </View>
                    <View style={styles.locationRow}>
                      <Feather name="map-pin" size={20} color={colors.primary} />
                      <Text style={styles.locationText}>
                        {game.game_type?.toUpperCase() || "GAME"} • {game.location}
                      </Text>
                    </View>
                    <View style={styles.locationRow}>
                      <MaterialCommunityIcons name="trophy-award" size={20} color={colors.primary} />
                      <Text style={styles.locationText}>
                        {game.seasonType
                          ?.split("-")
                          .map((word) => word.toUpperCase())
                          .join(" ")}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.postponedWarning}>
                    <View style={[styles.statusNotification, { backgroundColor: "#FEF3C7" }]}>
                      <MaterialCommunityIcons name="clock-alert" size={18} color="#D97706" />
                      <Text style={[styles.statusNotificationText, { color: "#D97706" }]}>POSTPONED</Text>
                    </View>
                  </View>
                </View>
              ) : (
                <>
                  <View style={styles.dateTimeContainer}>
                    <Feather name="calendar" size={20} color={colors.primary} />
                    <View style={styles.dateTimeTextContainer}>
                      <Text style={styles.dateTimeText}>
                        {formatGameDate(game.date)} • {game.time}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.locationContainer}>
                    <Feather name="map-pin" size={20} color={colors.primary} />
                    <Text style={styles.locationText}>
                      {game.game_type?.toUpperCase() || "GAME"} • {game.location}
                    </Text>
                  </View>
                  <View style={styles.locationContainer2}>
                    <MaterialCommunityIcons name="trophy-award" size={20} color={colors.primary} />
                    <Text style={styles.locationText}>
                      {game.seasonType
                        ?.split("-")
                        .map((word) => word.toUpperCase())
                        .join(" ")}
                    </Text>
                  </View>
                </>
              ))}
            {getSpecialEventsCount() > 0 && !gameInfo.isCanceled && (
              <View style={styles.alertsSection}>
                <View style={styles.specialEventCard}>
                  <View style={styles.specialEventHeader}>
                    <View style={styles.specialEventBadge}>
                      <MaterialCommunityIcons name="star-circle" size={18} color="#8B5CF6" />
                      <Text style={styles.specialEventTitle}>{getSpecialEventsText()}</Text>
                    </View>
                  </View>
                </View>
              </View>
            )}
            {!gameInfo.isCanceled && (
              <View style={styles.actionsContainer}>
                {onNotifyPress && (
                  <Pressable style={styles.notifyButton} onPress={handleNotifyPress}>
                    <Feather name="bell" size={16} color="#6366F1" />
                    <Text style={styles.notifyButtonText}>Notify Me</Text>
                  </Pressable>
                )}
                {/* UPDATED: Use time-based logic for QR code button */}
                {(isWithinOneHour() || gameInfo.isLive) && (
                  <Pressable style={styles.qrScanButton} onPress={handleQRScanPress}>
                    <MaterialCommunityIcons name="qrcode" size={20} color="white" />
                    <Text style={styles.qrScanButtonText}>Scan QR Code</Text>
                  </Pressable>
                )}
              </View>
            )}
          </View>
        </Pressable>
      </View>
    </Animated.View>
  )
}

// Keep all your existing styles
const styles = StyleSheet.create({
  container: {
    backgroundColor: "white",
    borderRadius: 16,
    overflow: "hidden",
  },
  canceledContainer: {
    opacity: 0.7,
    backgroundColor: "#F8F9FA",
  },
  shadowWrapper: {
    marginHorizontal: 16,
    borderRadius: 16,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    marginBottom: 16,
    elevation: 4,
  },
  heroSection: {
    height: 170,
    width: "100%",
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  heroImageStyle: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  heroOverlay: {
    flex: 1,
    padding: 16,
  },
  completedHeroOverlayContent: {
    justifyContent: "space-between",
  },
  topRow: {
    position: "absolute",
    top: 16,
    left: 16,
    flexDirection: "row",
  },
  bottomRow: {
    position: "absolute",
    bottom: 16,
    left: 16,
    right: 16,
  },
  topRow2: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
  },
  sportText: {
    fontSize: 14,
    fontWeight: "600",
    color: "white",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  headerSection: {
    height: 170,
    width: "100%",
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "700",
    color: "white",
    textTransform: "uppercase",
  },
  pointsBadgeContainer: {
    position: "absolute",
    top: -7,
    right: 12,
    alignItems: "center",
    width: 90,
  },
  bannerHangerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "60%",
    marginBottom: -2,
  },
  bannerHanger: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#4B5563",
    borderWidth: 1,
    borderColor: "#1F2937",
  },
  bannerShape: {
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  bannerGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    justifyContent: "center",
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  bannerNotch: {
    height: 12,
    width: "100%",
    backgroundColor: "transparent",
    overflow: "hidden",
  },
  notchGradientFill: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  notchCoverLeft: {
    position: "absolute",
    bottom: 0,
    left: 0,
    width: 0,
    height: 0,
    backgroundColor: "transparent",
    borderStyle: "solid",
    borderRightWidth: 45,
    borderTopWidth: 12,
    borderRightColor: "transparent",
    borderTopColor: "white",
    transform: [{ rotate: "180deg" }],
  },
  notchCoverRight: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 0,
    height: 0,
    backgroundColor: "transparent",
    borderStyle: "solid",
    borderLeftWidth: 45,
    borderTopWidth: 12,
    borderLeftColor: "transparent",
    borderTopColor: "white",
    transform: [{ rotate: "180deg" }],
  },
  pointsValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    marginHorizontal: 4,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  pointsLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  contentSection: {
    padding: 16,
  },
  completedGameContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    justifyContent: "center",
  },
  scoreContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  scoreText: {
    fontSize: 22,
    fontWeight: "800",
  },
  scoreDivider: {
    fontSize: 18,
    fontWeight: "600",
    marginHorizontal: 8,
  },
  completedGameInfo: {
    marginBottom: 16,
    alignItems: "center",
  },
  completedDateContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  completedDateText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginLeft: 6,
    fontWeight: "500",
  },
  completedLocationText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: "400",
  },
  dateTimeContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  dateTimeTextContainer: {
    flex: 1,
    marginLeft: 8,
  },
  dateTimeText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
  },
  statusNotification: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
    alignSelf: "flex-start",
  },
  statusNotificationText: {
    fontSize: 10,
    fontWeight: "600",
    marginLeft: 4,
    letterSpacing: 0.3,
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  locationContainer2: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  locationText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
    marginLeft: 8,
  },
  alertsSection: {
    marginBottom: 16,
    gap: 12,
  },
  specialEventCard: {
    backgroundColor: "#F8FAFC",
    borderLeftWidth: 4,
    borderLeftColor: "#8B5CF6",
    paddingHorizontal: 6,
    paddingVertical: 8,
    borderRadius: 8,
    shadowColor: "#8B5CF6",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  specialEventHeader: {
    marginBottom: 0,
  },
  specialEventBadge: {
    flexDirection: "row",
    alignItems: "center",
  },
  specialEventTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#8B5CF6",
    marginLeft: 6,
    letterSpacing: 0.5,
  },
  specialEventText: {
    fontSize: 13,
    color: "#475569",
    lineHeight: 20,
    fontWeight: "500",
    marginLeft: 2,
  },
  actionsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
    gap: 12,
  },
  notifyButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#6366F1",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 22,
  },
  notifyButtonText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#6366F1",
    marginLeft: 6,
  },
  qrScanButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#6366F1",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#6366F1",
  },
  qrScanButtonText: {
    fontSize: 16,
    fontWeight: "500",
    color: "white",
    marginLeft: 6,
  },
  newsButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  newsButtonText: {
    fontSize: 12,
    fontWeight: "500",
    color: colors.primary,
    marginLeft: 6,
    marginRight: 6,
  },
  canceledBanner: {
    marginBottom: 12,
  },
  canceledBannerGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 11,
    gap: 6,
  },
  canceledBannerText: {
    fontSize: 12,
    fontWeight: "700",
    color: "white",
    letterSpacing: 0.5,
  },
  postponedInfoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
    gap: 12,
  },
  dateLocationContainer: {
    flex: 1,
    gap: 8,
  },
  dateTimeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  postponedWarning: {
    alignItems: "flex-end",
    justifyContent: "center",
    padding: 10,
  },
})

export default GameCard
