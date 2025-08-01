"use client"

import { colors } from "@/constants/Colors"
import { useNotifications } from "@/context/notification-context"
import { getGameById } from "@/lib/actions/games"
import { getTeamById } from "@/lib/actions/teams"
import { supabase } from "@/lib/supabase"
import type { Game, Team } from "@/types/updated_types"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import Feather from "@expo/vector-icons/Feather"
import Ionicons from "@expo/vector-icons/Ionicons"
import { LinearGradient } from "expo-linear-gradient"
import { useLocalSearchParams, useRouter } from "expo-router"
import { StatusBar } from "expo-status-bar"
import * as WebBrowser from "expo-web-browser"
import { useCallback, useEffect, useState } from "react"; // Added useCallback
import { ActivityIndicator, Alert, Image, Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native"
import Animated, { FadeInDown } from "react-native-reanimated"
import { SafeAreaView } from "react-native-safe-area-context"

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

  // Helper function to parse 12-hour time to 24-hour format
  const parse12HourTime = useCallback((timeStr: string): string => {
    try {
      // Handle cases like "7:00 PM" or "10:30 AM"
      const [time, modifier] = timeStr.toUpperCase().split(" ")
      let [hours, minutes] = time.split(":").map(Number)

      if (modifier === "PM" && hours < 12) {
        hours += 12
      }
      if (modifier === "AM" && hours === 12) {
        hours = 0 // Midnight (12 AM) is 0 hours
      }
      return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00`
    } catch (e) {
      console.error("Error parsing 12-hour time:", timeStr, e)
      // Fallback to a default or original string if parsing fails
      return "00:00:00"
    }
  }, []);

  // Calculate game start and end times
  const getGameTimings = useCallback((gameData: Game) => {
    const gameDate = new Date(gameData.date);
    let gameStartTime = new Date(gameDate); // Initialize with date part

    if (gameData.time) {
      const time24h = parse12HourTime(gameData.time);
      // Combine date and 24h time string
      gameStartTime = new Date(`${gameDate.toISOString().split('T')[0]}T${time24h}`);
    } else {
      // If no time is provided, assume midnight of the game date
      gameStartTime.setHours(0, 0, 0, 0);
    }

    const gameEndTime = new Date(gameStartTime.getTime() + 60 * 60 * 1000); // 1 hour after game start

    return { gameStartTime, gameEndTime };
  }, [parse12HourTime]);


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

  // Get game photo from database or fallback (same logic as GameCard)
  const getGamePhoto = () => {
    return game?.photo_url || game?.homeTeam?.logo || "/placeholder.svg?height=200&width=400"
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

  // --- Date and Time Calculations ---
  const now = new Date()
  const { gameStartTime, gameEndTime } = getGameTimings(game) // Use the memoized helper

  const isCompleted = game.status === "completed"
  const isPostponed = game.status === "postponed"
  const isCanceled = game.status === "canceled"

  const gameDateStr = gameStartTime.toISOString().split("T")[0];
  const nowDateStr = now.toISOString().split("T")[0];

  // Check if game is actually in the past (but not completed)
  const isGameInPast = gameDateStr < nowDateStr || (gameDateStr === nowDateStr && now > gameEndTime && !isCompleted);
  const isPostponedInPast = isPostponed && isGameInPast

  // Check if game is today
  const isToday = now.toDateString() === gameStartTime.toDateString()

  // Determine if the game is currently "live" (started and within 1 hour duration)
  const isLive = now >= gameStartTime && now <= gameEndTime;
  // Check if game is within an hour from now (for QR code button)
  const timeDiffUntilGame = gameStartTime.getTime() - now.getTime();
  const isWithinAnHour = timeDiffUntilGame <= 60 * 60 * 1000 && timeDiffUntilGame >= 0;
  // Determine if it's truly upcoming (scheduled AND in the future)
  const isUpcoming =
    (game.status === "scheduled" || (!isCompleted && !isLive && !isPostponed && !isCanceled)) && !isGameInPast


  const teamColor = team?.primaryColor || game.homeTeam.primaryColor || colors.primary

  // Get status display info with proper date logic
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
        bgColor: "#3B82F6",
        gradient: ["#3B82F6", "#2563EB"] as const,
      }
    // If postponed game is in the past, show as FINISHED instead of POSTPONED
    if (isPostponedInPast)
      return {
        text: "FINISHED",
        color: "#FFFFFF",
        bgColor: "#6B7280",
        gradient: ["#6B7280", "#4B5563"] as const,
      }
    if (isPostponed)
      return {
        text: "POSTPONED",
        color: "#FFFFFF",
        bgColor: "#F59E0B",
        gradient: ["#F59E0B", "#D97706"] as const,
      }
    if (isCanceled)
      return {
        text: "CANCELED",
        color: "#FFFFFF",
        bgColor: "#EF4444",
        gradient: ["#EF4444", "#DC2626"] as const,
      }
    if (isGameInPast && !isCompleted) // If it's in the past and not explicitly completed, it's finished
      return {
        text: "FINISHED",
        color: "#FFFFFF",
        bgColor: "#6B7280",
        gradient: ["#6B7280", "#4B5563"] as const,
      }
    if (isToday)
      return {
        text: "TODAY",
        color: "#FFFFFF",
        bgColor: "#3B82F6",
        gradient: ["#3B82F6", "#2563EB"] as const,
      }
    if (isUpcoming)
      return {
        text: "UPCOMING",
        color: "#FFFFFF",
        bgColor: "#10B981",
        gradient: ["#10B981", "#059669"] as const,
      }

    // Fallback for edge cases
    return {
      text: "TBD",
      color: "#FFFFFF",
      bgColor: "#6B7280",
      gradient: ["#6B7280", "#4B5563"] as const,
    }
  }

  const statusInfo = getStatusInfo()

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

  const handleTicketPress = () => {
    const ticketUrl = "https://gojaspers.universitytickets.com/"
    Linking.openURL(ticketUrl).catch(() => {
      showError("Error", "Unable to open ticket link")
    })
  }

  const handleNotifyPress = () => {
    showSuccess("Notification Set", "You'll be notified about this game")
  }

  const handleQRScanPress = () => {
     router.push({ pathname: "../(tabs)/qr_code", params: { id: game.id } })
  }

  const handleMatchupHistoryPress = () => {
    // This route might need to be adjusted based on your actual file structure
    // If it's also a tab, it should probably be accessed similarly to `qr_code`
    router.push(`../(tabs)/matchup_history`) // Assuming a matchup_history tab
  }

  const handleGameNotesPress = async () => {
    if (!game.game_notes) {
      Alert.alert("No Game Notes", "Game notes are not available for this game.")
      return
    }

    try {
      const isPdf = game.game_notes.toLowerCase().endsWith(".pdf")

      if (isPdf) {
        await WebBrowser.openBrowserAsync(game.game_notes)
      } else {
        const supported = await Linking.canOpenURL(game.game_notes)
        if (supported) {
          await Linking.openURL(game.game_notes)
        } else {
          Alert.alert("Error", "Cannot open the link.")
        }
      }
    } catch (err) {
      console.error("Failed to open game notes:", err)
      Alert.alert("Error", "Something went wrong while opening the file.")
    }
  }

  const handleNewsPress = () => {
    if (gameNewsStory) {
      router.push({
        pathname: "../all_cards/news_details",
        params: { id: gameNewsStory.id },
      })
    }
  }

  const getColor = () => {
    if (game.score) {
      if (game.score?.home > game.score?.away) { // Home team wins, show green
        return "#10B981"
      } else if (game.score?.away > game.score?.home) { // Away team wins, show red
        return "rgba(129, 25, 25, 0.84)"
      }
    }
    return colors.text; // Default color if no score or tie
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
        {/* Hero Image Section with Overlay - Now using game photo */}
        <View style={styles.heroSection}>
          <Image source={{ uri: getGamePhoto() }} style={styles.heroImage} resizeMode="cover" />
          <LinearGradient colors={["rgba(0,0,0,0.3)", "rgba(0,0,0,0.7)"]} style={styles.heroOverlay}></LinearGradient>
        </View>

        <View style={styles.contentContainer}>
          {/* Game Details Card */}
          <Animated.View entering={FadeInDown.duration(400)} style={styles.detailsCard}>
            {/* Status Badge */}
            {statusInfo && (
              <View style={styles.topRow}>
                <LinearGradient
                  colors={statusInfo.gradient}
                  style={styles.statusBadge}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {isLive && <View style={styles.liveDot} />}
                  <Text style={styles.statusText}>
                    {statusInfo.text}
                    {/* Only show points for upcoming/today/live games */}
                    {!isCompleted && !isCanceled && !isPostponedInPast && !isGameInPast && ` • EARN ${game.points} POINTS`}
                  </Text>
                </LinearGradient>
              </View>
            )}

            {/* Teams Matchup */}
            <View style={styles.teamsContainer}>
              {/* Home Team */}
              <View style={styles.teamSection}>
                <View style={styles.teamLogoContainer}>
                  <Image source={require("@/IMAGES/MAIN_LOGO.png")} style={styles.teamLogo} />
                </View>
                <Text style={styles.teamName}>{game.homeTeam.name}</Text>
                {game.score && (
                  <Text style={[styles.teamScore, { color: getColor() }]}>{game.score.home}</Text>
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
                {game.score && <Text style = {[styles.teamScore, { color: getColor() }]} >{game.score.away}</Text>}
              </View>
            </View>

            {/* Date, Time and Location */}
            <View style={styles.infoSection}>
              {!isCanceled && (
                <View>
                  <View style={styles.infoRow}>
                    <View style={styles.infoIconContainer}>
                      <Feather name="calendar" size={20} color={teamColor} />
                    </View>
                    <View style={styles.infoTextContainer}>
                      <Text style={styles.infoLabel}>Date & Time</Text>
                      <Text style={styles.infoValue}>
                        {formatGameDate(game.date)} • {game.time}
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
                        <Text style={styles.locationTag}>{game.game_type.toUpperCase()}</Text> •{" "}
                        {game.location || "TBD"}
                      </Text>
                    </View>
                  </View>
                </View>
              )}

              {((game.special_events) && !isCanceled) && (
                <View style={styles.infoRow}>
                  <View style={[styles.infoIconContainer, { backgroundColor: teamColor }]}>
                    <Feather name="star" size={20} color="white" />
                  </View>
                  <View style={styles.infoTextContainer}>
                    <Text style={styles.infoLabel}>Special Events</Text>
                    <Text style={styles.infoValue}>
                      <Text style={styles.locationTag}>{game.special_events}</Text>
                    </Text>
                  </View>
                </View>
              )}

              {game.halftime_activity && (
                <View style={styles.infoRow}>
                  <View style={[styles.infoIconContainer, { backgroundColor: teamColor }]}>
                    <Feather name="star" size={20} color="white" />
                  </View>
                  <View style={styles.infoTextContainer}>
                    <Text style={styles.infoLabel}>Halftime Activity</Text>
                    <Text style={styles.infoValue}>
                      <Text style={styles.locationTag}>{game.halftime_activity}</Text>
                    </Text>
                  </View>
                </View>
              )}

              {/* Postponed/Canceled Status Card - Only show if NOT in the past */}
              {((isPostponed && !isPostponedInPast) || isCanceled) && (
                <View
                  style={[
                    styles.statusCard,
                    {
                      backgroundColor: isPostponed ? "#FEF3C7" : "#FEE2E2",
                      borderLeftColor: isPostponed ? "#D97706" : "#DC2626",
                    },
                  ]}
                >
                  <View style={styles.statusHeader}>
                    <View style={styles.statusBadgeAlert}>
                      <MaterialCommunityIcons
                        name={isPostponed ? "clock-alert" : "cancel"}
                        size={18}
                        color={isPostponed ? "#D97706" : "#DC2626"}
                      />
                      <Text
                        style={[
                          styles.statusTitle,
                          {
                            color: isPostponed ? "#D97706" : "#DC2626",
                          },
                        ]}
                      >
                        {game.status.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  <Text
                    style={[
                      styles.statusAlertText,
                      {
                        color: isPostponed ? "#92400E" : "#991B1B",
                      },
                    ]}
                  >
                    {isPostponed
                      ? "This game has been postponed. New date and time will be announced soon."
                      : "This game has been canceled and will not be rescheduled."}
                  </Text>
                </View>
              )}
            </View>
          </Animated.View>

          {/* Action Buttons - Both in same row - Hide for postponed/canceled games AND past games */}
          {!isPostponed && !isCanceled && !isGameInPast && (
            <Animated.View entering={FadeInDown.duration(400).delay(100)} style={styles.actionsContainer}>
              <View style={styles.buttonRow}>
                {/* Notify Me Button - Only show if game is NOT in the past and NOT completed */}
                {!isCompleted && !isGameInPast && (
                  <Pressable style={[styles.actionButton, { backgroundColor: "white" }]} onPress={handleNotifyPress}>
                    <View style={[styles.actionButtonIcon, { backgroundColor: teamColor + "15" }]}>
                      <Feather name="bell" size={20} color={teamColor} />
                    </View>
                    <Text style={[styles.actionButtonText, { color: colors.text }]}>Notify Me</Text>
                  </Pressable>
                )}

                {/* QR Code Button - Show if live OR within an hour of start */}
                {(isLive || isWithinAnHour) && (
                  <Pressable style={[styles.actionButton]} onPress={handleQRScanPress}>
                    <LinearGradient
                      colors={[teamColor, teamColor + "CC"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={StyleSheet.absoluteFill}
                    />
                    <View style={styles.actionButtonIcon}>
                      <Ionicons name="qr-code-sharp" size={20} color="white" />
                    </View>
                    <Text style={[styles.actionButtonText, { color: "white" }]}>Scan QR Code</Text>
                  </Pressable>
                )}
              </View>
            </Animated.View>
          )}

          {/* Additional Information */}
          {(gameNewsStory || game.game_notes) && (
            <Animated.View entering={FadeInDown.duration(400).delay(200)} style={styles.additionalInfoCard}>
              <Text style={styles.sectionTitle}>Additional Information</Text>
              {gameNewsStory && (
                <Pressable style={styles.infoLink} onPress={handleNewsPress}>
                  <Feather name="book-open" size={20} color={teamColor} />
                  <Text style={styles.infoLinkText}>Read Game Story</Text>
                  <Feather name="chevron-right" size={20} color={colors.textSecondary} />
                </Pressable>
              )}
              {game.game_notes && (
                <Pressable style={styles.infoLink} onPress={handleGameNotesPress}>
                  <Feather name="file-text" size={20} color={teamColor} />
                  <Text style={styles.infoLinkText}>Game Notes</Text>
                  <Feather name="chevron-right" size={20} color={colors.textSecondary} />
                </Pressable>
              )}
              {/* Matchup History should probably be a dedicated screen, not just a QR code. */}
              <Pressable style={styles.infoLink} onPress={handleMatchupHistoryPress}>
                <Feather name="bar-chart-2" size={20} color={teamColor} />
                <Text style={styles.infoLinkText}>Matchup History</Text>
                <Feather name="chevron-right" size={20} color={colors.textSecondary} />
              </Pressable>
              {!isCompleted && !isPostponed && !isCanceled && !isGameInPast && (
                <Pressable style={styles.infoLink} onPress={handleTicketPress}>
                  <Ionicons name="ticket-outline" size={20} color={teamColor} />
                  <Text style={styles.infoLinkText}>Tickets available online or at the entrance</Text>
                  <Feather name="chevron-right" size={20} color={colors.textSecondary} />
                </Pressable>
              )}
            </Animated.View>
          )}
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
    top: -40,
    marginBottom: -30,
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
    width: 90,
    height: 90,
    resizeMode: "contain",
  },
  teamName: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    textAlign: "center",
    height: 45,
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
  // Status Card for Postponed/Canceled - Detailed version
  statusCard: {
    borderLeftWidth: 4,
    padding: 16,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    marginBottom: 16,
  },
  statusHeader: {
    marginBottom: 8,
  },
  statusBadgeAlert: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusTitle: {
    fontSize: 12,
    fontWeight: "700",
    marginLeft: 6,
    letterSpacing: 0.5,
  },
  statusAlertText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
  },
  // Actions Container - Updated for same row layout
  actionsContainer: {
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 22,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtonIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "600",
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
  // Points Badge - Same as GameCard
  pointsBadgeContainer: {
    marginTop: 16,
    alignItems: "flex-start",
  },
  pointsBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  pointsBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "white",
    letterSpacing: 0.3,
  },
  // Special Events - Same as GameCard
  specialEventContainer: {
    marginTop: 12,
    alignItems: "flex-start",
  },
  specialEventBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  specialEventText: {
    fontSize: 12,
    fontWeight: "600",
    color: "white",
    flex: 1,
  },
  // News Button
  newsButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: colors.primary,
    paddingVertical: 10,
    borderRadius: 18,
    marginTop: 8,
  },
  newsButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.primary,
    marginLeft: 6,
    marginRight: 6,
  },
})