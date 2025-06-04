"use client"
import { View, Text, StyleSheet, ScrollView, Image, Pressable, ActivityIndicator, Platform } from "react-native"
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
import Ionicons from '@expo/vector-icons/Ionicons';

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
  
  const handleMatchupHistoryPress = () => {
    // Navigate to matchup history screen or show modal
    router.push(`../(tabs)/qr_code`)
  }
  
  const handleGameNotesPress = () => {
    // Navigate to game notes screen or show modal
    router.push(`../(tabs)/qr_code`)
  }

  return (
    <>
      <SafeAreaView style={styles.container}>
        <Image source={require("@/IMAGES/crowd.jpg")} style={styles.backgroundImage} />
        
        {/* Modern Header with Gradient */}
        <LinearGradient
          colors={[teamColor, teamColor + "E6"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <Pressable style={styles.headerBackButton} onPress={() => router.back()}>
            <View style={styles.backButtonContainer}>
              <Feather name="chevron-left" size={24} color="white" />
            </View>
          </Pressable>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>{game.sport?.display_name || "Game"}</Text>
            <Text style={styles.headerSubtitle}>
              {game.homeTeam.name} vs {game.awayTeam.name}
            </Text>
          </View>
        </LinearGradient>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Main Image with Overlay */}
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: team?.logo }}
              style={styles.roster}
            />
            <LinearGradient
              colors={["transparent", "rgba(0,0,0,0.3)"]}
              style={styles.imageOverlay}
            />
          </View>

          <View style={styles.mainContent}>
            {/* Game Details Section */}
            <Animated.View entering={FadeInDown.duration(400)} style={styles.gameDetailsSection}>
              {/* Status and Points Row - Centered */}
              <View style={styles.statusPointsRow}>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
                  <Text style={styles.statusText}>{getStatusText()}</Text>
                  {isLive && <View style={styles.liveDot} />}
                </View>
                
                {game.points && game.points > 0 && (
                  <View style={styles.pointsBadge}>
                    <Feather name="award" size={16} color="#667eea" />
                    <Text style={styles.pointsText}>{game.points} PTS</Text>
                  </View>
                )}
              </View>

              {/* Teams Matchup */}
              <View style={styles.teamsContainer}>
                {/* Home Team */}
                <View style={styles.teamSection}>
                  <View style={[styles.teamLogoContainer, { backgroundColor: teamColor + "15" }]}>
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

              
              {/* Game Notes and Matchup History Links */}
              <View style={styles.linksContainer}>
                <View style={styles.linkItem}>
                  <Feather name="map-pin" size={18} color={colors.primary} />
                  <Text style={styles.linkText}>{game.location}</Text>
                </View>

                <View style={styles.linkItem}>
                  <View style={styles.dateLocationRow}>
                  <View style={styles.dateTimeContainer}>
                    <Feather name="calendar" size={18} color={colors.primary} style={styles.dateTimeIcon} />
                    <View>
                      <Text style={styles.gameDate}>{formatGameDate(game.date)}</Text>
                      <Text style={styles.gameTime}>{formatGameTime(game.time)}</Text>
                    </View>
                  </View>
                </View>
                </View>

                <Pressable style={styles.linkItem} onPress={handleGameNotesPress}>
                  <Feather name="file-text" size={18} color={colors.primary} />
                  <Text style={styles.linkText}>Game Notes</Text>
                  <Feather name="chevron-right" size={18} color={colors.textSecondary} />
                </Pressable>
                
                <Pressable style={styles.linkItem} onPress={handleMatchupHistoryPress}>
                  <Feather name="bar-chart-2" size={18} color={colors.primary} />
                  <Text style={styles.linkText}>Matchup History</Text>
                  <Feather name="chevron-right" size={18} color={colors.textSecondary} />
                </Pressable>
              </View>
            </Animated.View>

            {/* Professional Action Buttons */}
            <Animated.View entering={FadeInDown.duration(400).delay(100)}>
              <View style={styles.actionButtonsRow}>
                {isUpcoming && (
                  <Pressable style={styles.actionButtonPrimary} onPress={handleQRScanPress}>
                    <LinearGradient
                      colors={[teamColor, teamColor + "CC"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={StyleSheet.absoluteFill}
                    />
                    <Ionicons name="qr-code" size={24} color="white" />
                    <Text style={styles.actionButtonTextPrimary}>Scan QR Code</Text>
                  </Pressable>
                )}
              </View>
              
              <View style={styles.secondaryButtonsRow}>
                <Pressable style={styles.actionButtonSecondary} onPress={handleNotifyPress}>
                  <View style={[styles.secondaryButtonIcon, { backgroundColor: teamColor + "15" }]}>
                  <Feather name="bell" size={24} color={colors.primary} />
                  </View>
                  <Text style={[styles.actionButtonTextSecondary, { color: colors.text }]}>
                    Notify me
                  </Text>
                </Pressable>

                {isUpcoming && (
                  <Pressable style={styles.actionButtonSecondary} onPress={handleTicketPress}>
                    <View style={[styles.secondaryButtonIcon, { backgroundColor: teamColor + "15" }]}>
                      <Ionicons name="ticket-outline" size={24} color={colors.primary} />
                    </View>
                    <Text style={[styles.actionButtonTextSecondary, { color: colors.text }]}>
                    Purchase Tickets
                    </Text>
                  </Pressable>
                )}
              </View>
            </Animated.View>

            {/* Game Information Section */}
            <Animated.View entering={FadeInDown.duration(400).delay(200)} style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Additional Information</Text>

              <View style={styles.infoGrid}>
                <View style={styles.infoItem}>
                  <View style={styles.infoItemLeft}>
                    <View style={styles.infoIcon}>
                      <Feather name="activity" size={16} color={colors.primary} />
                    </View>
                    <Text style={styles.infoLabel}>Sport</Text>
                  </View>
                  <Text style={styles.infoValue}>{game.sport?.display_name || "Game"}</Text>
                </View>

                <View style={styles.infoItem}>
                  <View style={styles.infoItemLeft}>
                    <View style={styles.infoIcon}>
                      <Feather name="home" size={16} color={colors.primary} />
                    </View>
                    <Text style={styles.infoLabel}>Type</Text>
                  </View>
                  <Text style={styles.infoValue}>{game.locationType} Game</Text>
                </View>

                {game.attendance && (
                  <View style={styles.infoItem}>
                    <View style={styles.infoItemLeft}>
                      <View style={styles.infoIcon}>
                        <Feather name="users" size={16} color={colors.primary} />
                      </View>
                      <Text style={styles.infoLabel}>Expected Attendance</Text>
                    </View>
                    <Text style={styles.infoValue}>{game.attendance.toLocaleString()}</Text>
                  </View>
                )}

                <View style={styles.infoItem}>
                  <View style={styles.infoItemLeft}>
                    <View style={styles.infoIcon}>
                      <Feather name="clock" size={16} color={colors.primary} />
                    </View>
                    <Text style={styles.infoLabel}>Gates Open</Text>
                  </View>
                  <Text style={styles.infoValue}>90 minutes before</Text>
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
    backgroundColor: "#f8fafc",
    ...Platform.select({
      android: {paddingTop: -55,},
      ios:{paddingTop: -60}
    }),
    bottom:0
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 60,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  headerBackButton: {
    marginRight: -16,
  },
  backButtonContainer: {
  },
  headerContent: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "white",
  },
  headerSubtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.9)",
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
  },
  imageContainer: {
    position: "relative",
  },
  roster: {
    width: "100%",
    height: 220,
    resizeMode: "cover",
  },
  imageOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
  },
  mainContent: {
    padding: 20,
    paddingTop: 0,
  },
  gameDetailsSection: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    marginTop: -30,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    zIndex: 1,
  },
  statusPointsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    gap: 12,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
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
  pointsBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#667eea15",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#667eea30",
    gap: 6,
  },
  pointsText: {
    color: "#667eea",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.5,
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
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    borderRadius: 12,
    padding: 8,
  },
  teamLogo: {
    width: 70,
    height: 60,
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
  // New date and location in same row
  dateLocationRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  dateTimeContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  dateTimeIcon: {
    marginRight: 10,
  },
  gameDate: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
  },
  gameTime: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    justifyContent: "flex-end",
  },
  locationText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: "500",
    flex: 1,
  },
  // Links for Game Notes and Matchup History
  linksContainer: {
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  linkItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  linkText: {
    fontSize: 16,
    fontWeight: "500",
    color: colors.text,
    flex: 1,
    marginLeft: 12,
  },
  // Professional action buttons
  actionButtonsRow: {
    marginBottom: 12,
  },
  actionButtonPrimary: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtonTextPrimary: {
    fontSize: 16,
    fontWeight: "700",
    color: "white",
    marginLeft: 10,
  },
  secondaryButtonsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    gap: 12,
  },
  actionButtonSecondary: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
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
    marginRight: 10,
  },
  actionButtonTextSecondary: {
    fontSize: 14,
    fontWeight: "600",
  },
  sectionContainer: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 16,
  },
  infoGrid: {
    gap: 0,
  },
  infoItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  infoItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  infoIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary + "15",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  infoLabel: {
    fontSize: 16,
    color: colors.text,
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textSecondary,
  },
})