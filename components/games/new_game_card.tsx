"use client"

import type React from "react"
import { View, Text, StyleSheet, Pressable, ImageBackground } from "react-native"
import { colors } from "@/constants/colors"
import type { Game } from "@/types/game"
import Feather from "@expo/vector-icons/Feather"
import Animated, { useAnimatedStyle, withTiming, useSharedValue, withSpring } from "react-native-reanimated"
import { useState, useEffect } from "react"
import { getStoryByGameId } from "@/app/actions/news"
import { router } from "expo-router"
import { LinearGradient } from "expo-linear-gradient"

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
  const scale = useSharedValue(1)
  const opacity = useSharedValue(1)

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

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }))

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
  const isPostponed = game.status === "postponed"
  const isCanceled = game.status === "canceled"

  // Check if game is today
  const gameDate = new Date(game.date)
  const isToday = new Date().toDateString() === gameDate.toDateString()

  // Get game photo from database or fallback
  const getGamePhoto = () => {
    // Use photo_url directly since it's already a text URL, then team logo, then placeholder
    console.log("Photo URL:", game.photo_url)
    return game.photo_url || game.homeTeam?.logo || "/placeholder.svg?height=200&width=400"
  }

  // Determine location status
  const getLocationStatus = () => {
    if (!game.location) return "TBD"

    const location = game.location.toLowerCase()
    if (location.includes("neutral")) return "NEUTRAL"
    if (location.includes("away") || location.includes("@")) return "AWAY"
    return "HOME"
  }

  // Get status display info
  const getStatusInfo = () => {
    if (isLive)
      return {
        text: "LIVE NOW",
        color: "#FFFFFF",
        bgColor: "#EF4444",
        gradient: ["#EF4444", "#DC2626"] as const,
      }
    if (isCompleted)
      return {
        text: "FINAL",
        color: "#FFFFFF",
        bgColor: "#3B82F6", // blue
        gradient: ["#3B82F6", "#2563EB"] as const,
      }
    if (isPostponed)
      return {
        text: "POSTPONED",
        color: "#FFFFFF",
        bgColor: "#F59E0B", // yellow
        gradient: ["#F59E0B", "#D97706"] as const,
      }
    if (isCanceled)
      return {
        text: "CANCELED",
        color: "#FFFFFF",
        bgColor: "#EF4444", // red
        gradient: ["#EF4444", "#DC2626"] as const,
      }
    if (isToday)
      return {
        text: "TODAY",
        color: "#FFFFFF",
        bgColor: "#3B82F6", // keeping it blue
        gradient: ["#3B82F6", "#2563EB"] as const,
      }
    return {
      text: "UPCOMING",
      color: "#FFFFFF",
      bgColor: "#10B981", // green
      gradient: ["#10B981", "#059669"] as const,
    }
  }

  const statusInfo = getStatusInfo()

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

    if (gameStory) {
      router.push({
        pathname: "../all_cards/news_details",
        params: { id: gameStory.id },
      })
    } else if (onNewsPress) {
      onNewsPress(game)
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
      <View style={styles.shadowWrapper}>
        <Pressable
          onPress={handlePress}
          style={styles.container}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          android_ripple={{ color: "rgba(0, 0, 0, 0.1)", borderless: false }}
        >
          {/* Hero Image Section with Overlay */}
          <View style={styles.heroSection}>
            <ImageBackground
              source={{ uri: getGamePhoto() }}
              style={styles.heroImage}
              imageStyle={styles.heroImageStyle}
              resizeMode="cover"
            >
              {/* Dark overlay for better text readability */}
              <LinearGradient colors={["rgba(0,0,0,0.3)", "rgba(0,0,0,0.7)"]} style={styles.heroOverlay}>
                {/* Status Badge and Sport */}
                <View style={styles.topRow}>
                  <LinearGradient
                    colors={statusInfo.gradient}
                    style={styles.statusBadge}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    {isLive && <View style={styles.liveDot} />}
                    <Text style={styles.statusText}>{statusInfo.text}</Text>
                  </LinearGradient>
                </View>

                {/* QR Button - Made more visible */}
                {(isUpcoming || isLive) && onQRScanPress && (
                  <View style={styles.qrButtonContainer}>
                    <Pressable style={styles.qrButton} onPress={handleQRScanPress}>
                      <Feather name="camera" size={24} color="white" />
                    </Pressable>
                  </View>
                )}
                <Text style={styles.sportText}>
                  {game.homeTeam?.name || "Home Team"} VS {game.awayTeam?.name || "Away Team"}
                </Text>
              </LinearGradient>
            </ImageBackground>
          </View>

          {/* Main Content Section */}
          <View style={styles.contentSection}>
            {/* Teams and Score Layout */}
            {isCompleted ? (
              // Completed Game Layout: Score centered
              <View style={styles.completedGameContainer}>
                {game.score && (
                  <View style={styles.scoreContainer}>
                    <Text style={styles.scoreText}>{game.score.home}</Text>
                    <Text style={styles.scoreDivider}>-</Text>
                    <Text style={styles.scoreText}>{game.score.away}</Text>
                  </View>
                )}
              </View>
            ) : (
              // Live/Upcoming Game Layout: Teams in one row
              <View style={styles.upcomingGameContainer}>{/* Teams are now in the hero overlay */}</View>
            )}

            {/* Date, Time, and Location - Fixed Layout */}
            {isCompleted ? (
              // Completed Game: Show date and time in a subtle way
              <View style={styles.completedGameInfo}>
                <View style={styles.completedDateContainer}>
                  <Feather name="calendar" size={16} color={colors.textSecondary} />
                  <Text style={styles.completedDateText}>
                    {formatGameDate(game.date)} • {formatGameTime(game.time)}
                  </Text>
                </View>
                <Text style={styles.completedLocationText}>
                  {getLocationStatus()} • {game.location || "TBD"}
                </Text>
              </View>
            ) : (
              // Upcoming/Live Game: Improved date, time, location layout
              <View style={styles.upcomingGameInfo}>
                <View style={styles.calendarIconContainer}>
                  <Feather name="calendar" size={32} color={colors.primary} />
                </View>

                <View style={styles.gameDetailsContainer}>
                  <View style={styles.dateTimeRow}>
                    <Text style={styles.sportText2}>
                      {isToday ? "Today" : formatGameDate(game.date)} • {formatGameTime(game.time)}
                    </Text>
                  </View>
                  <Text style={styles.locationText} numberOfLines={1}>
                    {getLocationStatus()} • {game.location || "TBD"}
                  </Text>
                </View>

                {onNotifyPress && (
                  <View style={styles.notificationButtonContainer}>
                    <Pressable style={styles.notificationButton} onPress={handleNotifyPress}>
                      <Feather name="bell" size={20} color="white" />
                    </Pressable>
                  </View>
                )}
              </View>
            )}

            {/* Points Section - Enhanced for upcoming games */}
            {game.points && game.points > 0 && !isCompleted && (
              <View style={styles.pointsHighlight}>
                <LinearGradient
                  colors={["#3B82F6", "#1D4ED8"]}
                  style={styles.pointsGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <View style={styles.pointsContent}>
                    <View style={styles.pointsIconContainer}>
                      <Feather name="award" size={28} color="white" />
                    </View>
                    <View style={styles.pointsTextContainer}>
                      <Text style={styles.pointsMainText}>EARN {game.points} POINTS</Text>
                      <Text style={styles.pointsSubText}>Check in at this game to collect points!</Text>
                    </View>
                  </View>
                </LinearGradient>
              </View>
            )}

            {/* Special Events Highlight */}
            {game.special_events && (
              <View style={styles.specialEventsHighlight}>
                <LinearGradient
                  colors={["#F59E0B", "#D97706"]}
                  style={styles.specialEventsGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <View style={styles.specialEventsContent}>
                    <Feather name="star" size={20} color="white" />
                    <Text style={styles.specialEventsText}>{game.special_events}</Text>
                  </View>
                </LinearGradient>
              </View>
            )}

            {/* Completed Game News Link */}
            {isCompleted && gameStory && !isLoadingStory && (
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

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: 16,
    overflow: "hidden",
  },
  shadowWrapper: {
    marginHorizontal: 16,
    borderRadius: 16,
    backgroundColor: "#fff", // Required for iOS shadows
    shadowColor: "gray",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    marginBottom: 10,
    elevation: 4, // Android
  },
  // Hero Section
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
    justifyContent: "space-between",
  },

  // Top Row with Status and Sport
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "white",
    marginRight: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
    color: "white",
    letterSpacing: 0.3,
  },
  sportText: {
    fontSize: 14,
    fontWeight: "600",
    color: "white",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  sportText2: {
    fontSize: 14,
    fontWeight: "600",
    color: "black",
    textTransform: "uppercase",
  },

  // Points Badge in Hero
  pointsBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(59, 130, 246, 0.8)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pointsBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "white",
    marginLeft: 4,
  },

  // Content Section - Reduced padding
  contentSection: {
    padding: 16,
  },

  // Completed Game Layout
  completedGameContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    justifyContent: "center",
  },
  scoreContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0FDF4",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  scoreText: {
    fontSize: 22,
    fontWeight: "800",
    color: "#10B981",
  },
  scoreDivider: {
    fontSize: 18,
    fontWeight: "600",
    color: "#10B981",
    marginHorizontal: 8,
  },

  // Upcoming/Live Game Layout
  upcomingGameContainer: {
    marginBottom: 12,
  },
  vsText: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.textSecondary,
  },

  // Completed Game Info - Improved
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

  // Upcoming Game Info - Compact layout with calendar icon
  upcomingGameInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  calendarIconContainer: {
    marginRight: 10,
  },
  gameDetailsContainer: {
    flex: 1,
  },
  dateTimeRow: {
    marginBottom: 4,
  },
  dateTimeText: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
  },
  locationText: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.textSecondary,
  },
  notificationButtonContainer: {
    marginLeft: 12,
  },
  notificationButton: {
    backgroundColor: "#6366F1",
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#6366F1",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },

  // Points Highlight - Enhanced
  pointsHighlight: {
    marginBottom: 16,
  },
  pointsGradient: {
    borderRadius: 12,
    padding: 14,
  },
  pointsContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  pointsIconContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  pointsTextContainer: {
    flex: 1,
  },
  pointsMainText: {
    fontSize: 16,
    fontWeight: "700",
    color: "white",
    letterSpacing: 0.3,
  },
  pointsSubText: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.9)",
    fontWeight: "400",
    marginTop: 2,
  },

  // Special Events - Reduced
  specialEventsHighlight: {
    marginBottom: 12,
  },
  specialEventsGradient: {
    borderRadius: 10,
    padding: 10,
  },
  specialEventsContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  specialEventsText: {
    fontSize: 12,
    color: "white",
    marginLeft: 8,
    flex: 1,
    fontWeight: "500",
    lineHeight: 16,
  },

  // QR Button
  qrButtonContainer: {
    position: "absolute",
    top: 16,
    right: 16,
  },
  qrButton: {
    backgroundColor: "#3B82F6",
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#3B82F6",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },

  // News Button - Simplified
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
})

export default GameCard
