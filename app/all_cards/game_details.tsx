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
import { getTeamById } from "@/app/actions/teams"
import { useNotifications } from "@/context/notification-context"
import { LinearGradient } from "expo-linear-gradient"

export default function GameDetailsScreen() {
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()
  const { showError, showSuccess } = useNotifications()

  // State
  const [game, setGame] = useState<Game | null>(null)
  const [team, setTeam] = useState<Team | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

      try {
        const teamData = await getTeamById(gameData.homeTeam.id)
        setTeam(teamData)
      } catch (teamErr) {
        console.error("Error loading team data:", teamErr)
      }
    } catch (err) {
      console.error("Error fetching game data:", err)
      setError("Failed to load game details")
    } finally {
      setLoading(false)
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

  const isCompleted = game.status === "completed"
  const isLive = game.status === "live"
  const isUpcoming = game.status === "scheduled"
  const teamColor = team?.primaryColor || game.homeTeam.primaryColor || colors.primary

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

  return (
    <>
      <SafeAreaView style={styles.container}>
        <Image source={require("@/IMAGES/crowd.jpg")} style={styles.backgroundImage} />
        {/* Header */}
        <View style={[styles.header, { backgroundColor: teamColor }]}>
          <Pressable style={styles.headerBackButton} onPress={() => router.back()}>
            <Feather name="chevron-left" size={24} color="white" />
          </Pressable>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>{game.sport?.display_name || "Game"}</Text>
            <Text style={styles.headerSubtitle}>
              {game.homeTeam.name} vs {game.awayTeam.name}
            </Text>
          </View>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Main Image */}
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: team?.logo }}
              style={styles.roster}
            />
          </View>

          <View style={styles.mainContent}>
            {/* Game Status - Now under image */}
            <Animated.View entering={FadeInDown.duration(400)} style={styles.statusSection}>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
                <Text style={styles.statusText}>{getStatusText()}</Text>
                {isLive && <View style={styles.liveDot} />}
              </View>

              <Text style={styles.gameDate}>{formatGameDate(game.date)}</Text>
              <Text style={styles.gameTime}>{formatGameTime(game.time)}</Text>

              <View style={styles.locationRow}>
                <Feather name="map-pin" size={16} color={colors.textSecondary} />
                <Text style={styles.locationText}>{game.location}</Text>
              </View>
            </Animated.View>

            {/* Teams Section with Circular Quick Links */}
            <Animated.View entering={FadeInDown.duration(400).delay(100)} style={styles.teamsSection}>
              <View style={styles.teamsContainer}>
                {/* Home Team */}
                <View style={styles.teamSection}>
                  <View style={[styles.teamLogoContainer, { backgroundColor: teamColor + "20" }]}>
                    <Image
                      source={{ uri: game.homeTeam.logo }}
                      style={styles.teamLogo}
                      defaultSource={require("@/IMAGES/MAIN_LOGO.png")}
                    />
                  </View>
                  <Text style={styles.teamName}>{game.homeTeam.name}</Text>
                  <Text style={[styles.teamLabel, { color: teamColor }]}>HOME</Text>
                  {isCompleted && game.score && (
                    <Text style={[styles.teamScore, { color: teamColor }]}>{game.score.home}</Text>
                  )}
                </View>

                {/* VS Divider */}
                <View style={styles.vsSection}>
                  <Text style={styles.vsText}>VS</Text>
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
                  <Text style={styles.teamLabel}>AWAY</Text>
                  {isCompleted && game.score && <Text style={styles.teamScore}>{game.score.away}</Text>}
                </View>
              </View>

              {/* Circular Quick Links at bottom of card */}
              <View style={styles.quickLinksContainer}>
                {isUpcoming && (
                  <Pressable style={[styles.circularButton, { backgroundColor: teamColor }]} onPress={handleTicketPress}>
                    <Feather name="credit-card" size={20} color="white" />
                  </Pressable>
                )}

                <Pressable style={[styles.circularButton, { backgroundColor: teamColor }]} onPress={handleNotifyPress}>
                  <Feather name="bell" size={20} color="white" />
                </Pressable>

                {isUpcoming && (
                  <Pressable style={[styles.circularButton, { backgroundColor: teamColor }]} onPress={handleQRScanPress}>
                    <Feather name="camera" size={20} color="white" />
                  </Pressable>
                )}
              </View>
            </Animated.View>

            {/* Points Section - Highlighted */}
            {game.points && game.points > 0 && (
              <Animated.View entering={FadeInDown.duration(400).delay(200)} style={styles.pointsSection}>
                <Pressable style={styles.pointsContainer} onPress={handleQRScanPress}>
                  <LinearGradient
                    colors={[teamColor, teamColor + "CC"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFill}
                  />
                  <View style={styles.pointsIconContainer}>
                    <Feather name="award" size={32} color="white" />
                  </View>
                  <View style={styles.pointsContent}>
                    <Text style={styles.pointsTitle}>REWARD POINTS</Text>
                    <Text style={styles.pointsValue}>{game.points} POINTS</Text>
                    <Text style={styles.pointsSubtitle}>Available for attending this game</Text>
                  </View>
                </Pressable>
              </Animated.View>
            )}

            {/* Game Info Section */}
            <Animated.View entering={FadeInDown.duration(400).delay(400)} style={styles.infoSection}>
              <Text style={styles.sectionTitle}>Game Information</Text>

              <View style={styles.infoGrid}>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Sport</Text>
                  <Text style={styles.infoValue}>{game.sport?.display_name || "Game"}</Text>
                </View>

                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Type</Text>
                  <Text style={styles.infoValue}>{game.locationType} Game</Text>
                </View>

                {game.attendance && (
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Expected Attendance</Text>
                    <Text style={styles.infoValue}>{game.attendance.toLocaleString()}</Text>
                  </View>
                )}

                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Gates Open</Text>
                  <Text style={styles.infoValue}>90 minutes before game time</Text>
                </View>
              </View>
            </Animated.View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: -55,
    backgroundColor: colors.background,
  },
  backgroundImage: {
    position: "absolute",
    bottom: 0,
    resizeMode: "cover",
    opacity: 0.03,
    zIndex: 0,
  },
  imageContainer: {
    width: "100%",
  },
  roster: {
    width: "100%",
    height: 200,
    resizeMode: "cover",
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
    color: colors.textSecondary,
    marginVertical: 16,
    textAlign: "center",
  },
  backButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: 60,
  },
  headerBackButton: {
  },
  headerContent: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "white",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
  },
  mainContent: {
    padding: 16,
  },
  statusSection: {
    alignItems: "center",
    marginBottom: 24,
    paddingTop: 16,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 12,
  },
  statusText: {
    color: "white",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "white",
    marginLeft: 6,
  },
  gameDate: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 4,
  },
  gameTime: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  locationText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 6,
  },
  teamsSection: {
    backgroundColor: colors.card,
    borderRadius: 16,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  teamsContainer: {
    flexDirection: "row",
    padding: 24,
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
    width: 80,
    height: 70,
  },
  teamName: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    textAlign: "center",
    marginBottom: 4,
  },
  teamLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: colors.textSecondary,
    marginBottom: 8,
  },
  teamScore: {
    fontSize: 32,
    fontWeight: "700",
    color: colors.text,
  },
  vsSection: {
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  vsText: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textSecondary,
  },
  quickLinksContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingBottom: 20,
    gap: 20,
  },
  circularButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  pointsSection: {
    marginBottom: 24,
  },
  pointsContainer: {
    borderRadius: 16,
    overflow: "hidden",
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  pointsIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  pointsContent: {
    flex: 1,
  },
  pointsTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "rgba(255, 255, 255, 0.9)",
    letterSpacing: 1,
    marginBottom: 4,
  },
  pointsValue: {
    fontSize: 28,
    fontWeight: "900",
    color: "white",
    marginBottom: 2,
  },
  pointsSubtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
    fontWeight: "500",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 16,
  },
  infoSection: {
    marginBottom: 40,
  },
  infoGrid: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  infoItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  infoLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.text,
  },
})