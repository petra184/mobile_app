"use client"
import { View, Text, StyleSheet, ScrollView, Image, Pressable, Platform, ActivityIndicator } from "react-native"
import { useLocalSearchParams, useRouter } from "expo-router"
import { SafeAreaView } from "react-native-safe-area-context"
import { colors } from "@/constants/colors"
import type { Game } from "@/types/game"
import { formatDate } from "@/utils/dateUtils"
import Feather from "@expo/vector-icons/Feather"
import { Linking } from "react-native"
import { StatusBar } from "expo-status-bar"
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated"
import { useState, useEffect } from "react"
import { getGameById } from "@/app/actions/games"
import { useNotifications } from "@/context/notification-context"

export default function GameDetailsScreen() {
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()
  const { showError, showSuccess } = useNotifications()

  const [game, setGame] = useState<Game | null>(null)
  const [loading, setLoading] = useState(true)

  // Fetch game data on component mount
  useEffect(() => {
    if (id) {
      fetchGameData(id)
    }
  }, [id])

  const fetchGameData = async (gameId: string) => {
    try {
      setLoading(true)
      const gameData = await getGameById(gameId)

      if (gameData) {
        setGame(gameData)
      } else {
        showError("Error", "Game not found")
      }
    } catch (error) {
      console.error("Error fetching game data:", error)
      showError("Error", "Failed to load game details")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Image source={require("@/IMAGES/crowd.jpg")} style={styles.backgroundImage} />
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading game details...</Text>
      </SafeAreaView>
    )
  }

  if (!game) {
    return (
      <SafeAreaView style={styles.notFoundContainer}>
        <Image source={require("@/IMAGES/crowd.jpg")} style={styles.backgroundImage} />
        <View style={styles.notFoundContent}>
          <Feather name="alert-circle" size={48} color="#D1D5DB" />
          <Text style={styles.notFoundText}>Game not found</Text>
          <Text style={styles.notFoundSubtext}>The game you're looking for doesn't exist or has been removed.</Text>
          <Pressable
            style={styles.backButton}
            onPress={() => router.back()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Feather name="chevron-left" size={24} color={colors.primary} />
            <Text style={styles.backButtonText}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    )
  }

  const isCompleted = game.status === "completed"
  const isLive = game.status === "live"
  const isUpcoming = game.status === "scheduled"

  const getStatusText = () => {
    switch (game.status) {
      case "live":
        return "LIVE NOW"
      case "completed":
        return "FINAL"
      case "postponed":
        return "POSTPONED"
      case "canceled":
        return "CANCELED"
      default:
        return "UPCOMING"
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

  const homeTeamColor = game.homeTeam.primaryColor || colors.primary
  const awayTeamColor = game.awayTeam.primaryColor || "#666666"

  // Get sport display name with fallback
  const getSportDisplayName = () => {
    return game.sport?.display_name || game.sport?.name || game.homeTeam.sport || "Game"
  }

  const handleTicketPress = () => {
    const ticketUrl = `https://tickets.gojaspers.com/game/${game.id}`
    Linking.openURL(ticketUrl).catch(() => {
      showError("Error", "Unable to open ticket link")
    })
  }

  const handleGameNotesPress = () => {
    const sportName = game.sport?.name || game.homeTeam.sport
    const gameNotesUrl = `https://gojaspers.com/sports/${sportName}/schedule/${game.id}/notes`
    Linking.openURL(gameNotesUrl).catch(() => {
      showError("Error", "Game notes not available")
    })
  }

  const handleMatchupHistoryPress = () => {
    const sportName = game.sport?.name || game.homeTeam.sport
    const opponentSlug = game.awayTeam.name.replace(/\s+/g, "-").toLowerCase()
    const historyUrl = `https://gojaspers.com/sports/${sportName}/opponents/${opponentSlug}`
    Linking.openURL(historyUrl).catch(() => {
      showError("Error", "Matchup history not available")
    })
  }

  const handleNotifyPress = () => {
    showSuccess("Notification Set", `You'll be notified about this ${getSportDisplayName()} game`)
  }

  return (
    <>
      <StatusBar style="dark" />

      <SafeAreaView style={styles.container} edges={["top"]}>
        <Image source={require("@/IMAGES/crowd.jpg")} style={styles.backgroundImage} />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <Pressable
            style={styles.headerBackButton}
            onPress={() => router.back()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Feather name="chevron-left" size={24} color="black" />
          </Pressable>

          <Animated.View entering={FadeIn.duration(300)} style={styles.headerContainer}>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
              <Text style={styles.statusText}>{getStatusText()}</Text>
              {isLive && <View style={styles.livePulse} />}
            </View>
            <Text style={styles.sportText}>{getSportDisplayName()}</Text>
            {game.seasonType && <Text style={styles.seasonText}>{game.seasonType} Season</Text>}
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(400).delay(100)} style={styles.teamsContainer}>
            <View style={styles.teamContainer}>
              <View style={[styles.logoContainer, { borderColor: homeTeamColor }]}>
                <Image
                  source={{ uri: game.homeTeam.logo }}
                  style={styles.teamLogo}
                  resizeMode="contain"
                  defaultSource={require("@/IMAGES/MAIN_LOGO.png")}
                />
              </View>
              <Text style={[styles.teamName, { color: homeTeamColor }]}>{game.homeTeam.name}</Text>
              <Text style={styles.teamShortName}>{game.homeTeam.shortName}</Text>
              {isCompleted && game.score && (
                <Text style={[styles.score, { color: homeTeamColor }]}>{game.score.home}</Text>
              )}
            </View>

            <View style={styles.vsContainer}>
              <View style={styles.vsLine} />
              <Text style={styles.vs}>VS</Text>
              <View style={styles.vsLine} />
              {game.locationType && <Text style={styles.locationTypeText}>{game.locationType.toUpperCase()}</Text>}
            </View>

            <View style={styles.teamContainer}>
              <View style={[styles.logoContainer, { borderColor: awayTeamColor }]}>
                <Image
                  source={{ uri: game.awayTeam.logo }}
                  style={styles.teamLogo}
                  resizeMode="contain"
                  defaultSource={require("@/IMAGES/MAIN_LOGO.png")}
                />
              </View>
              <Text style={[styles.teamName, { color: awayTeamColor }]}>{game.awayTeam.name}</Text>
              <Text style={styles.teamShortName}>{game.awayTeam.shortName}</Text>
              {isCompleted && game.score && (
                <Text style={[styles.score, { color: awayTeamColor }]}>{game.score.away}</Text>
              )}
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(400).delay(200)} style={styles.infoContainer}>
            <View style={styles.infoItem}>
              <Feather name="calendar" size={20} color={colors.primary} style={styles.infoIcon} />
              <Text style={styles.infoText}>{formatDate(new Date(game.date), "EEEE, MMMM d, yyyy")}</Text>
            </View>

            <View style={styles.infoItem}>
              <Feather name="clock" size={20} color={colors.primary} style={styles.infoIcon} />
              <Text style={styles.infoText}>{game.time}</Text>
            </View>

            <View style={styles.infoItem}>
              <Feather name="map-pin" size={20} color={colors.primary} style={styles.infoIcon} />
              <Text style={styles.infoText}>{game.location}</Text>
            </View>

            {game.points && game.points > 0 && (
              <View style={styles.infoItem}>
                <Feather name="award" size={20} color={colors.primary} style={styles.infoIcon} />
                <Text style={styles.infoText}>{game.points} Points Available</Text>
              </View>
            )}

            {game.attendance && game.attendance > 0 && (
              <View style={styles.infoItem}>
                <Feather name="users" size={20} color={colors.primary} style={styles.infoIcon} />
                <Text style={styles.infoText}>{game.attendance.toLocaleString()} Expected Attendance</Text>
              </View>
            )}

            <View style={styles.divider} />

            <Pressable style={styles.linkItem} onPress={handleGameNotesPress}>
              <View style={styles.linkIconContainer}>
                <Feather name="file-text" size={18} color={colors.primary} />
              </View>
              <Text style={styles.linkText}>Game Notes & Preview</Text>
              <Feather name="external-link" size={16} color={colors.primary} />
            </Pressable>

            <Pressable style={styles.linkItem} onPress={handleMatchupHistoryPress}>
              <View style={styles.linkIconContainer}>
                <Feather name="clock" size={18} color={colors.primary} />
              </View>
              <Text style={styles.linkText}>Matchup History</Text>
              <Feather name="external-link" size={16} color={colors.primary} />
            </Pressable>

            {isUpcoming && (
              <Pressable style={styles.linkItem} onPress={handleNotifyPress}>
                <View style={styles.linkIconContainer}>
                  <Feather name="bell" size={18} color={colors.primary} />
                </View>
                <Text style={styles.linkText}>Set Game Reminder</Text>
                <Feather name="chevron-right" size={16} color={colors.primary} />
              </Pressable>
            )}
          </Animated.View>

          {isUpcoming && (
            <Animated.View entering={FadeInDown.duration(400).delay(300)}>
              <Pressable
                style={styles.ticketButton}
                onPress={handleTicketPress}
                android_ripple={{ color: "rgba(255,255,255,0.2)" }}
              >
                <Feather name="credit-card" size={20} color="#FFFFFF" style={styles.buttonIcon} />
                <Text style={styles.ticketButtonText}>Buy Tickets</Text>
              </Pressable>
            </Animated.View>
          )}

          <Animated.View entering={FadeInDown.duration(400).delay(400)} style={styles.section}>
            <Text style={styles.sectionTitle}>
              {isCompleted ? "Game Recap" : isLive ? "Live Updates" : "Game Preview"}
            </Text>
            <Text style={styles.previewText}>
              {isCompleted
                ? `The ${game.homeTeam.name} ${game.score && game.score.home > game.score.away ? "defeated" : "fell to"} the ${game.awayTeam.name} in this ${getSportDisplayName().toLowerCase()} matchup at ${game.location}.`
                : isLive
                  ? `The ${game.homeTeam.name} are currently facing off against the ${game.awayTeam.name} in an exciting ${getSportDisplayName().toLowerCase()} game at ${game.location}.`
                  : `Don't miss this exciting ${getSportDisplayName().toLowerCase()} matchup between the ${game.homeTeam.name} and the ${game.awayTeam.name}!`}
            </Text>
            <Text style={styles.previewText}>
              {isCompleted
                ? `This was a ${game.locationType.toLowerCase()} game for the ${game.homeTeam.name}. Check back for highlights and post-game coverage.`
                : `The ${game.homeTeam.name} will be playing at ${game.location}. This promises to be an exciting battle that fans won't want to miss.`}
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(400).delay(500)} style={styles.section}>
            <Text style={styles.sectionTitle}>Game Information</Text>
            <Text style={styles.stadiumText}>
              {`${game.location} is the venue for this exciting ${getSportDisplayName().toLowerCase()} matchup. The facility offers excellent viewing angles and modern amenities for all attendees.`}
            </Text>

            <View style={styles.stadiumInfo}>
              <View style={styles.stadiumInfoItem}>
                <Text style={styles.stadiumInfoLabel}>Date & Time</Text>
                <Text style={styles.stadiumInfoValue}>
                  {formatDate(new Date(game.date), "MMM d, yyyy")} at {game.time}
                </Text>
              </View>

              <View style={styles.stadiumInfoItem}>
                <Text style={styles.stadiumInfoLabel}>Location</Text>
                <Text style={styles.stadiumInfoValue}>{game.location}</Text>
              </View>

              <View style={styles.stadiumInfoItem}>
                <Text style={styles.stadiumInfoLabel}>Game Type</Text>
                <Text style={styles.stadiumInfoValue}>{game.locationType} Game</Text>
              </View>

              <View style={styles.stadiumInfoItem}>
                <Text style={styles.stadiumInfoLabel}>Sport</Text>
                <Text style={styles.stadiumInfoValue}>{getSportDisplayName()}</Text>
              </View>

              {game.seasonType && (
                <View style={styles.stadiumInfoItem}>
                  <Text style={styles.stadiumInfoLabel}>Season</Text>
                  <Text style={styles.stadiumInfoValue}>{game.seasonType}</Text>
                </View>
              )}

              {game.points && game.points > 0 && (
                <View style={styles.stadiumInfoItem}>
                  <Text style={styles.stadiumInfoLabel}>Reward Points</Text>
                  <Text style={styles.stadiumInfoValue}>{game.points} points for attending</Text>
                </View>
              )}

              <View style={styles.stadiumInfoItem}>
                <Text style={styles.stadiumInfoLabel}>Gates Open</Text>
                <Text style={styles.stadiumInfoValue}>90 minutes before game time</Text>
              </View>

              <View style={styles.stadiumInfoItem}>
                <Text style={styles.stadiumInfoLabel}>Bag Policy</Text>
                <Text style={styles.stadiumInfoValue}>Clear bags only, max 12" x 6" x 12"</Text>
              </View>
            </View>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 16,
    fontWeight: "500",
  },
  scrollContent: {
    paddingBottom: 40,
  },
  backgroundImage: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    height: "100%",
    resizeMode: "cover",
    opacity: 0.1,
    zIndex: 0,
  },
  headerContainer: {
    height: 120,
    justifyContent: "flex-end",
    alignItems: "center",
    paddingBottom: 20,
  },
  notFoundContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  notFoundContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  notFoundText: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
    color: colors.text,
  },
  notFoundSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: 24,
  },
  headerBackButton: {
    position: "absolute",
    left: 16,
    top: Platform.OS === "ios" ? 0 : 10,
    zIndex: 1000,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 20,
    padding: 8,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
    marginLeft: 4,
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  livePulse: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "white",
    marginLeft: 8,
  },
  sportText: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 4,
  },
  seasonText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  teamsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 24,
    marginTop: 10,
    backgroundColor: "white",
    borderRadius: 16,
    marginHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  teamContainer: {
    flex: 1,
    alignItems: "center",
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 12,
  },
  teamLogo: {
    width: 80,
    height: 80,
  },
  teamName: {
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 4,
  },
  teamShortName: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: 4,
  },
  vsContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: 60,
  },
  vsLine: {
    width: 30,
    height: 1,
    backgroundColor: "rgba(0,0,0,0.1)",
    marginVertical: 8,
  },
  vs: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textSecondary,
  },
  locationTypeText: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 4,
    fontWeight: "600",
  },
  score: {
    fontSize: 32,
    fontWeight: "800",
    marginTop: 4,
  },
  infoContainer: {
    backgroundColor: "white",
    padding: 20,
    marginTop: 16,
    borderRadius: 16,
    marginHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  infoIcon: {
    marginRight: 12,
  },
  infoText: {
    fontSize: 16,
    color: colors.text,
    fontWeight: "500",
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(0,0,0,0.1)",
    marginVertical: 16,
  },
  linkItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    paddingVertical: 8,
  },
  linkIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: `${colors.primary}15`,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  linkText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: "600",
    flex: 1,
  },
  ticketButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 24,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonIcon: {
    marginRight: 8,
  },
  ticketButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  section: {
    backgroundColor: "white",
    padding: 20,
    marginTop: 24,
    borderRadius: 16,
    marginHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 16,
  },
  previewText: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 24,
    marginBottom: 16,
  },
  stadiumText: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 24,
    marginBottom: 16,
  },
  stadiumInfo: {
    backgroundColor: "rgba(59, 130, 246, 0.05)",
    borderRadius: 12,
    padding: 16,
  },
  stadiumInfoItem: {
    marginBottom: 16,
  },
  stadiumInfoLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary,
    marginBottom: 4,
  },
  stadiumInfoValue: {
    fontSize: 16,
    color: colors.text,
  },
})
