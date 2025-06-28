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
import { MaterialCommunityIcons } from "@expo/vector-icons"

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
  }, [game.id, game.status])

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

  const isCompleted = game.status === "completed"
  const isLive = game.status === "live"
  const isUpcoming = game.status === "scheduled" || (!isCompleted && !isLive)
  const isPostponed = game.status === "postponed"
  const isCanceled = game.status === "canceled"

  // Check if game is today
  const gameDate = new Date(game.date)
  const isToday = new Date().toDateString() === gameDate.toDateString()

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
    if (isLive) return { text: "LIVE NOW", gradient: ["#EF4444", "#DC2626"] as const }
    if (isCompleted) return { text: "FINAL", gradient: ["#3B82F6", "#2563EB"] as const }
    if (isPostponed) return { text: "POSTPONED", gradient: ["#F59E0B", "#D97706"] as const }
    if (isCanceled) return { text: "CANCELED", gradient: ["#EF4444", "#DC2626"] as const }
    if (isToday) return { text: "TODAY", gradient: ["#3B82F6", "#2563EB"] as const }
    return { text: "UPCOMING", gradient: ["#10B981", "#059669"] as const }
  }

  const statusInfo = getStatusInfo()
  const shouldShowStatus = isToday || isLive

  const handlePress = () => onPress?.(game)
  const handleNotifyPress = (e: any) => {
    e.stopPropagation()
    onNotifyPress?.(game)
  }
  const handleQRScanPress = (e: any) => {
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

  // Render completed game layout
  if (isCompleted) {
    const getColor = () => {
      if (game.score)
        if (game.score?.away < game.score?.home )
          return ["#F0FDF4", "#10B981"]
        else 
        return ["rgba(204, 93, 81, 0.12)","rgba(129, 25, 25, 0.84)"]
      return "#F0FDF4"
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
                  style={[styles.heroOverlay, styles.completedHeroOverlayContent]} // <-- THE FIX
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
                  {getLocationStatus()} • {game.location || "TBD"}
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

  // Render upcoming/live game layout
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
          {/* Header Section */}
          <View style={styles.headerSection}>
            <ImageBackground
              source={{ uri: getGamePhoto() }}
              style={styles.heroImage}
              imageStyle={styles.heroImageStyle}
              resizeMode="cover"
            >
              <LinearGradient colors={["rgba(0,0,0,0.3)", "rgba(0,0,0,0.7)"]} style={styles.heroOverlay}>
                {/* Status Badge - Top Left */}
                {shouldShowStatus && (
                  <View style={styles.topRow}>
                    <LinearGradient
                      colors={statusInfo.gradient}
                      style={styles.statusBadge}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    >
                      <Text style={styles.statusText}>{statusInfo.text}</Text>
                    </LinearGradient>
                  </View>
                )}

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
            {/* Date and Time */}
            <View style={styles.dateTimeContainer}>
              <Feather name="calendar" size={16} color="#6B7280" />
              <Text style={styles.dateTimeText}>
                {formatGameDate(game.date)} • {game.time}
              </Text>
            </View>

            {/* Location */}
            <View style={styles.locationContainer}>
              <Feather name="map-pin" size={16} color="#6B7280" />
              <Text style={styles.locationText}>
                {getLocationStatus()} • {game.location}
              </Text>
            </View>

            {/* Special Events */}
            {game.special_events && (
              <View style={styles.specialEventContainer}>
                <View style={styles.specialEventBadge}>
                  <Feather name="star" size={16} color="#8B5CF6" />
                  <Text style={styles.specialEventTitle}>Fan Appreciation Night</Text>
                </View>
                <Text style={styles.specialEventText}>{game.special_events}</Text>
              </View>
            )}

            {/* Action Buttons Container */}
            <View style={styles.actionsContainer}>
              {onNotifyPress && (
                <Pressable style={styles.notifyButton} onPress={handleNotifyPress}>
                  <Feather name="bell" size={16} color="#6366F1" />
                  <Text style={styles.notifyButtonText}>Notify Me</Text>
                </Pressable>
              )}

              {(isWithinOneHour() || isLive) && (
                <Pressable style={styles.qrScanButton} onPress={handleQRScanPress}>
                  <MaterialCommunityIcons name="qrcode" size={20} color="white" />
                  <Text style={styles.qrScanButtonText}>Scan QR Code</Text>
                </Pressable>
              )}
            </View>
          </View>
        </Pressable>
      </View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "white",
    borderRadius: 16,
    overflow: "hidden",
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
  sportText2: {
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
    alignItems: "center",
    marginBottom: 8,
  },
  dateTimeText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
    marginLeft: 8,
  },
  locationContainer: {
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
  specialEventContainer: {
    backgroundColor: "#F3F4F6",
    padding: 12,
    borderRadius: 8,
  },
  specialEventBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  specialEventTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#8B5CF6",
    marginLeft: 6,
  },
  specialEventText: {
    fontSize: 14,
    color: "#4B5563",
    lineHeight: 18,
    paddingLeft:22
  },
  actionsContainer: {
    flexDirection: "row",
    justifyContent: "center", // Aligns buttons to the right
    alignItems: "center",
    marginTop: 8,
    gap: 12, // Creates space between buttons
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
    backgroundColor: "#3B82F6",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 22,
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
})

export default GameCard