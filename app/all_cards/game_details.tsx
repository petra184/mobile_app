"use client"
import { View, Text, StyleSheet, ScrollView, Image, Pressable, ActivityIndicator } from "react-native"
import { useLocalSearchParams, useRouter } from "expo-router"
import { SafeAreaView } from "react-native-safe-area-context"
import { colors } from "@/constants/colors"
import type { Game } from "@/types/game"
import type { Team } from "@/app/actions/teams"
import Feather from "@expo/vector-icons/Feather"
import { Linking } from "react-native"
import Animated, { FadeInDown } from "react-native-reanimated"
import { useState, useEffect } from "react"
import { getGameById } from "@/app/actions/games"
import { getTeamById, getRandomTeamPhotoWithCache } from "@/app/actions/teams"
import { useNotifications } from "@/context/notification-context"
import { LinearGradient } from "expo-linear-gradient"
import Ionicons from "@expo/vector-icons/Ionicons"
import { StatusBar } from "expo-status-bar"
import { supabase } from "@/lib/supabase"

// Type for news story
type NewsStory = {
  id: string
  title: string
  content: string
  game_id: string | null
  created_at: string
}

export default function GameDetailsScreen() {
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()
  const { showError, showSuccess } = useNotifications()

  // State
  const [game, setGame] = useState<Game | null>(null)
  const [team, setTeam] = useState<Team | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [gameNewsStory, setGameNewsStory] = useState<NewsStory | null>(null)
  const [teamPhoto, setTeamPhoto] = useState<string | null>(null)

  // Fetch game data on component mount
  useEffect(() => {
    if (id) {
      loadGameData(id)
    }
  }, [id])

  const loadGameData = async (gameId: string) => {
    try {
      setLoading(true)
      setError(null)

      const gameData = await getGameById(gameId)

      if (!gameData) {
        setError("Game not found")
        return
      }

      setGame(gameData)

      // Load team data
      try {
        const teamData = await getTeamById(gameData.homeTeam.id)
        setTeam(teamData)

        // Fetch team photo
        if (teamData?.id) {
          const photo = await getRandomTeamPhotoWithCache(teamData.id)
          setTeamPhoto(photo)
        }
      } catch (teamErr) {
        console.error("Error loading team data:", teamErr)
      }

      // Check for news stories about this game
      await checkForGameNews(gameId)
    } catch (err) {
      console.error("Error fetching game data:", err)
      setError("Failed to load game details")
    } finally {
      setLoading(false)
    }
  }

  // Check if there are news stories about this game
  const checkForGameNews = async (gameId: string) => {
    try {
      const { data: stories, error } = await supabase
        .from("stories")
        .select("id, title, content, game_id, created_at")
        .eq("game_id", gameId)
        .order("created_at", { ascending: false })
        .limit(1)

      if (error) {
        console.error("Error fetching game news:", error)
        return
      }

      if (stories && stories.length > 0) {
        setGameNewsStory(stories[0])
      }
    } catch (error) {
      console.error("Error checking for game news:", error)
    }
  }

  // Enhanced game status detection
  const getGameStatus = (game: Game) => {
    const now = new Date()
    const gameDate = new Date(game.date)

    // If no explicit status, determine based on date and time
    if (game.time) {
      try {
        // Parse time and create full game datetime
        const [hours, minutes] = game.time.split(":")
        const gameDateTime = new Date(gameDate)
        gameDateTime.setHours(Number.parseInt(hours), Number.parseInt(minutes))

        // Game is in the past
        if (gameDateTime < now) {
          return "completed"
        }

        // Game is within 3 hours of start time (could be live)
        const timeDiff = gameDateTime.getTime() - now.getTime()
        const hoursUntilGame = timeDiff / (1000 * 60 * 60)

        if (hoursUntilGame <= 0 && hoursUntilGame >= -3) {
          return "live"
        }

        // Game is upcoming
        return "scheduled"
      } catch (error) {
        console.error("Error parsing game time:", error)
      }
    }

    // Fallback: just compare dates
    if (gameDate < now) {
      return "completed"
    } else if (gameDate.toDateString() === now.toDateString()) {
      return "live" // Assume today's games are live
    } else {
      return "scheduled"
    }
  }

  // Loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading game details...</Text>
      </SafeAreaView>
    )
  }

  // Error state
  if (error || !game) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Feather name="alert-circle" size={48} color={colors.textSecondary} />
        <Text style={styles.errorText}>{error || "Game not found"}</Text>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </Pressable>
      </SafeAreaView>
    )
  }

  // Get actual game status
  const actualStatus = getGameStatus(game)
  const isCompleted = actualStatus === "completed"
  const isLive = actualStatus === "live"
  const isUpcoming = actualStatus === "scheduled"
  const teamColor = team?.primaryColor || game.homeTeam.primaryColor || colors.primary

  const getStatusText = () => {
    switch (actualStatus) {
      case "live":
        return "LIVE NOW"
      case "completed":
        return "FINAL"
      default:
        return "UPCOMING"
    }
  }

  const getStatusColor = () => {
    switch (actualStatus) {
      case "live":
        return ["#EF4444", "#DC2626"] as const
      case "completed":
        return ["#3B82F6", "#2563EB"] as const
      default:
        return ["#10B981", "#059669"] as const
    }
  }

  // Format date properly
  const formatGameDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      const options: Intl.DateTimeFormatOptions = {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      }
      return date.toLocaleDateString("en-US", options)
    } catch (error) {
      return dateString
    }
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

  const handleTicketPress = () => {
    const ticketUrl = `https://tickets.gojaspers.com/game/${game.id}`
    Linking.openURL(ticketUrl).catch(() => {
      showError("Error", "Unable to open ticket link")
    })
  }

  const handleNotifyPress = () => {
    showSuccess("Notification Set", "You'll be notified about this game")
  }

  const handleQRScanPress = () => {
    router.push("../(tabs)/qr_code")
  }

  const handleMatchupHistoryPress = () => {
    router.push(`../(tabs)/qr_code`)
  }

  const handleGameNotesPress = () => {
    router.push(`../(tabs)/qr_code`)
  }

  const handleNewsPress = () => {
    if (gameNewsStory) {
      router.push({
        pathname: "../all_cards/news_details",
        params: { id: gameNewsStory.id },
      })
    }
  }

  // Determine location status
  const getLocationStatus = () => {
    if (!game.location) return "TBD"

    const location = game.location.toLowerCase()
    if (location.includes("neutral")) return "NEUTRAL"
    if (location.includes("away") || location.includes("@")) return "AWAY"
    return "HOME"
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <Image source={require("@/IMAGES/crowd.jpg")} style={styles.backgroundImage} />

      {/* Back Button - Floating on top of hero image */}
      <Pressable style={styles.backButtonAbsolute} onPress={() => router.back()}>
        <View style={styles.backButtonCircle}>
          <Feather name="chevron-left" size={24} color="white" />
        </View>
      </Pressable>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Hero Image Section with Overlay */}
        <View style={styles.heroSection}>
          <Image
            source={{ uri: teamPhoto || team?.logo || game.homeTeam.logo }}
            style={styles.heroImage}
            resizeMode="cover"
          />
          <LinearGradient colors={["rgba(0,0,0,0.3)", "rgba(0,0,0,0.7)"]} style={styles.heroOverlay}>
            {/* Status Badge */}
           
          </LinearGradient>
        </View>

        <View style={styles.contentContainer}>
          {/* Game Details Card */}
          <Animated.View entering={FadeInDown.duration(400)} style={styles.detailsCard}>

          <View style={styles.topRow}>
              <LinearGradient
                colors={getStatusColor()}
                style={styles.statusBadge}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {isLive && <View style={styles.liveDot} />}
                <Text style={styles.statusText}>{getStatusText()}</Text>
              </LinearGradient>
            </View>
            {/* Teams Matchup */}
            <View style={styles.teamsContainer}>
              {/* Home Team */}
              <View style={styles.teamSection}>
                <View style={styles.teamLogoContainer}>
                  <Image
                    source={{ uri: game.homeTeam.logo }}
                    style={styles.teamLogo}
                    defaultSource={require("@/IMAGES/MAIN_LOGO.png")}
                  />
                </View>
                <Text style={styles.teamName}>{game.homeTeam.name}</Text>
                {isCompleted && game.score && (
                  <Text style={[styles.teamScore, { color: teamColor }]}>{game.score.home}</Text>
                )}
              </View>

              {/* VS Divider */}
              <View style={styles.vsSection}>
                <View style={styles.vsCircle}>
                  <Text style={styles.vsText}>VS</Text>
                </View>
              </View>

              {/* Away Team */}
              <View style={styles.teamSection}>
                <View style={styles.teamLogoContainer}>
                  <Image
                    source={{ uri: game.awayTeam.logo }}
                    style={styles.teamLogo}
                    defaultSource={require("@/IMAGES/MAIN_LOGO.png")}
                  />
                </View>
                <Text style={styles.teamName}>{game.awayTeam.name}</Text>
                {isCompleted && game.score && <Text style={styles.teamScore}>{game.score.away}</Text>}
              </View>
            </View>

            {/* Date, Time and Location */}
            <View style={styles.infoSection}>
              <View style={styles.infoRow}>
                <View style={styles.infoIconContainer}>
                  <Feather name="calendar" size={20} color={teamColor} />
                </View>
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoLabel}>Date & Time</Text>
                  <Text style={styles.infoValue}>
                    {formatGameDate(game.date)} • {formatGameTime(game.time)}
                  </Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <View style={styles.infoIconContainer}>
                  <Feather name="map-pin" size={20} color={teamColor} />
                </View>
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoLabel}>Location</Text>
                  <Text style={styles.infoValue}>
                    <Text style={styles.locationTag}>{getLocationStatus()}</Text> • {game.location || "TBD"}
                  </Text>
                </View>
              </View>
            </View>
          </Animated.View>

          {/* Action Buttons */}
          <Animated.View entering={FadeInDown.duration(400).delay(100)} style={styles.actionsContainer}>
            {isUpcoming && (
              <Pressable style={styles.primaryButton} onPress={handleQRScanPress}>
                <LinearGradient
                  colors={[teamColor, teamColor + "CC"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFill}
                />
                <Ionicons name="qr-code" size={24} color="white" />
                <Text style={styles.primaryButtonText}>Scan QR Code</Text>
              </Pressable>
            )}

            <View style={styles.secondaryButtonsRow}>
              {!isCompleted && (
                <Pressable style={styles.secondaryButton} onPress={handleNotifyPress}>
                  <View style={[styles.secondaryButtonIcon, { backgroundColor: teamColor + "15" }]}>
                    <Feather name="bell" size={22} color={teamColor} />
                  </View>
                  <Text style={styles.secondaryButtonText}>Notify me</Text>
                </Pressable>
              )}

              {isUpcoming && (
                <Pressable style={styles.secondaryButton} onPress={handleTicketPress}>
                  <View style={[styles.secondaryButtonIcon, { backgroundColor: teamColor + "15" }]}>
                    <Ionicons name="ticket-outline" size={22} color={teamColor} />
                  </View>
                  <Text style={styles.secondaryButtonText}>Get Tickets</Text>
                </Pressable>
              )}
            </View>
          </Animated.View>

          {/* Additional Information */}
          <Animated.View entering={FadeInDown.duration(400).delay(200)} style={styles.additionalInfoCard}>
            <Text style={styles.sectionTitle}>Additional Information</Text>

            <Pressable style={styles.infoLink} onPress={handleGameNotesPress}>
              <Feather name="file-text" size={20} color={teamColor} />
              <Text style={styles.infoLinkText}>Game Notes</Text>
              <Feather name="chevron-right" size={20} color={colors.textSecondary} />
            </Pressable>

            <Pressable style={styles.infoLink} onPress={handleMatchupHistoryPress}>
              <Feather name="bar-chart-2" size={20} color={teamColor} />
              <Text style={styles.infoLinkText}>Matchup History</Text>
              <Feather name="chevron-right" size={20} color={colors.textSecondary} />
            </Pressable>

            {/* Points Section for upcoming games */}
            {game.points && game.points > 0 && (isUpcoming || isLive) && (
              <View style={styles.pointsSection}>
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

            {/* Special Events */}
            {game.special_events && (
              <View style={styles.specialEventsSection}>
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

            {/* News Story Link */}
            {isCompleted && gameNewsStory && (
              <Pressable style={styles.newsButton} onPress={handleNewsPress}>
                <Ionicons name="newspaper-outline" size={20} color={teamColor} />
                <Text style={styles.newsButtonText}>Read Game Story</Text>
                <Feather name="chevron-right" size={20} color={teamColor} />
              </Pressable>
            )}
          </Animated.View>
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  backgroundImage: {
    position: "absolute",
    bottom: 0,
    resizeMode: "cover",
    opacity: 0.1,
    zIndex: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: "500",
    color: colors.textSecondary,
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
    padding: 24,
  },
  errorText: {
    fontSize: 18,
    fontWeight: "500",
    color: colors.textSecondary,
    marginVertical: 16,
    textAlign: "center",
  },
  backButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  backButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  backButtonAbsolute: {
    position: "absolute",
    top: 50,
    left: 16,
    zIndex: 10,
  },
  backButtonCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
  },

  // Hero Section
  heroSection: {
    height: 280,
    width: "100%",
    position: "relative",
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  heroOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    padding: 20,
    paddingTop: 60,
    justifyContent: "space-between",
  },
  topRow: {
    alignItems: "center",
    top:-40,
    marginBottom: -30
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 14,
    fontWeight: "700",
    color: "white",
    letterSpacing: 0.5,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "white",
    marginRight: 6,
  },
  pointsBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(59, 130, 246, 0.8)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  pointsBadgeText: {
    fontSize: 14,
    fontWeight: "700",
    color: "white",
  },
  sportTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.9)",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  matchupText: {
    fontSize: 24,
    fontWeight: "700",
    color: "white",
    marginTop: 8,
  },

  // Content Container
  contentContainer: {
    padding: 20,
    paddingTop: 0,
    marginTop: -30,
  },

  // Details Card
  detailsCard: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    marginBottom: 20,
  },
  teamsContainer: {
    flexDirection: "row",
    marginBottom: 24,
  },
  teamSection: {
    flex: 1,
    alignItems: "center",
  },
  teamLogoContainer: {
    width: 80,
    height: 80,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  teamLogo: {
    width: 70,
    height: 70,
    resizeMode: "contain",
  },
  teamName: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    textAlign: "center",
    marginBottom: 8,
  },
  teamScore: {
    fontSize: 32,
    fontWeight: "900",
    color: colors.text,
  },
  vsSection: {
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  vsCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#f1f5f9",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#e2e8f0",
  },
  vsText: {
    fontSize: 14,
    fontWeight: "900",
    color: colors.textSecondary,
  },

  // Info Section
  infoSection: {
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    paddingTop: 16,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  infoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f1f5f9",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.textSecondary,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
  },
  locationTag: {
    fontWeight: "700",
  },

  // Actions Container
  actionsContainer: {
    marginBottom: 20,
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "white",
    marginLeft: 10,
  },
  secondaryButtonsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "white",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  secondaryButtonIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
  },

  // Additional Info Card
  additionalInfoCard: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 16,
  },
  infoLink: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  infoLinkText: {
    fontSize: 16,
    fontWeight: "500",
    color: colors.text,
    flex: 1,
    marginLeft: 12,
  },

  // Points Section
  pointsSection: {
    marginTop: 16,
  },
  pointsGradient: {
    borderRadius: 12,
    padding: 16,
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

  // Special Events
  specialEventsSection: {
    marginTop: 16,
  },
  specialEventsGradient: {
    borderRadius: 12,
    padding: 14,
  },
  specialEventsContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  specialEventsText: {
    fontSize: 14,
    color: "white",
    marginLeft: 10,
    flex: 1,
    fontWeight: "500",
  },

  // News Button
  newsButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginTop: 16,
  },
  newsButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.primary,
    marginLeft: 10,
    marginRight: 10,
  },
})
