"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
  Animated,
  Dimensions,
  RefreshControl,
  TouchableOpacity,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { colors } from "@/constants/colors"
import { useUserStore } from "@/hooks/userStore"
import Ionicons from "@expo/vector-icons/Ionicons"
import { LinearGradient } from "expo-linear-gradient"
import QRCode from "react-native-qrcode-svg"
import { supabase } from "@/lib/supabase"
import type { Database } from "@/types/supabase"

type GameSchedule = Database["public"]["Tables"]["game_schedule"]["Row"]
type Team = Database["public"]["Tables"]["teams"]["Row"]
type OpposingTeam = Database["public"]["Tables"]["opposing_teams"]["Row"]
type ScanHistoryItem = Database["public"]["Tables"]["scan_history"]["Row"]

interface GameWithTeams extends GameSchedule {
  teams?: Team
  opposing_teams?: OpposingTeam
}

export default function QRCodeScreen() {
  const { points, userId, getUserFirstName, isLoading: userLoading } = useUserStore()

  const [games, setGames] = useState<GameWithTeams[]>([])
  const [selectedGame, setSelectedGame] = useState<GameWithTeams | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [recentScans, setRecentScans] = useState<ScanHistoryItem[]>([])
  const [showQRModal, setShowQRModal] = useState(false)
  const [isQRAvailable, setIsQRAvailable] = useState(false)
  const [timeUntilAvailable, setTimeUntilAvailable] = useState("")
  const [hasAlreadyScanned, setHasAlreadyScanned] = useState(false)
  const [showGameDropdown, setShowGameDropdown] = useState(false)

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(1)).current
  const scaleAnim = useRef(new Animated.Value(1)).current
  const slideAnim = useRef(new Animated.Value(0)).current
  const modalFadeAnim = useRef(new Animated.Value(0)).current
  const modalScaleAnim = useRef(new Animated.Value(0.8)).current

  const loadData = useCallback(
    async (isRefresh = false) => {
      if (!userId) {
        setLoading(false)
        return
      }

      try {
        if (!isRefresh) setLoading(true)

        // Load upcoming games with team information
        const { data: gameData, error: gameError } = await supabase
          .from("game_schedule")
          .select(`
          *,
          teams:sport_id (
            id,
            name,
            short_name,
            sport,
            color,
            photo
          ),
          opposing_teams:opponent_id (
            id,
            name,
            logo
          )
        `)
          .gte("date", new Date().toISOString().split("T")[0])
          .order("date", { ascending: true })
          .limit(10)

        if (gameError) {
          console.error("Game data error:", gameError)
          throw gameError
        }

        // Load recent scan history from database
        const { data: scanData, error: scanError } = await supabase
          .from("scan_history")
          .select("*")
          .eq("user_id", userId)
          .order("scanned_at", { ascending: false })
          .limit(5)

        if (scanError) {
          console.error("Scan data error:", scanError)
          throw scanError
        }

        setGames(gameData || [])
        setRecentScans(scanData || [])

        if (gameData && gameData.length > 0 && !selectedGame) {
          setSelectedGame(gameData[0])
          checkQRAvailability(gameData[0])
          checkIfAlreadyScanned(gameData[0].game_id)
        }
      } catch (error) {
        console.error("Error loading data:", error)
        Alert.alert("Error", "Failed to load games and scan history")
      } finally {
        setLoading(false)
        if (isRefresh) setRefreshing(false)
      }
    },
    [userId, selectedGame],
  )

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    loadData(true)
  }, [loadData])

  const generateQRData = useCallback(
    (game: GameWithTeams) => {
      return JSON.stringify({
        type: "USER_GAME_ATTENDANCE",
        userId: userId,
        userName: getUserFirstName(),
        gameId: game.game_id,
        gameDate: game.date,
        gameTime: game.game_time,
        gameLocation: game.location,
        homeTeam: game.teams?.name || "Home Team",
        awayTeam: game.opposing_teams?.name || "Away Team",
        sport: game.teams?.sport || "Game",
        pointsToAward: game.points || 50,
        timestamp: Date.now(),
        version: "1.0",
      })
    },
    [userId, getUserFirstName],
  )

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const formatTime = (timeString: string | null) => {
    if (!timeString) return ""

    try {
      const [hours, minutes] = timeString.split(":")
      const date = new Date()
      date.setHours(Number.parseInt(hours), Number.parseInt(minutes))

      return date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      })
    } catch {
      return timeString
    }
  }

  const formatScanDate = (dateString: string | null) => {
    if (!dateString) return ""

    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    })
  }

  const formatTimeUntilAvailable = (timeDiff: number) => {
    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60))

    if (days > 0) {
      return `Available in ${days}d ${hours}h ${minutes}m`
    } else if (hours > 0) {
      return `Available in ${hours}h ${minutes}m`
    } else {
      return `Available in ${minutes}m`
    }
  }

  const checkQRAvailability = useCallback((game: GameWithTeams) => {
    if (!game.date || !game.game_time) {
      setIsQRAvailable(false)
      setTimeUntilAvailable("Game time not available")
      return false
    }

    try {
      const gameDateTime = new Date(`${game.date}T${game.game_time}`)
      const now = new Date()
      const oneHourBefore = new Date(gameDateTime.getTime() - 60 * 60 * 1000)
      const gameEnd = new Date(gameDateTime.getTime() + 3 * 60 * 60 * 1000)

      if (now >= oneHourBefore && now <= gameEnd) {
        setIsQRAvailable(true)
        setTimeUntilAvailable("")
        return true
      } else if (now < oneHourBefore) {
        const timeDiff = oneHourBefore.getTime() - now.getTime()
        setTimeUntilAvailable(formatTimeUntilAvailable(timeDiff))
        setIsQRAvailable(false)
        return false
      } else {
        setTimeUntilAvailable("Game has ended")
        setIsQRAvailable(false)
        return false
      }
    } catch (error) {
      console.error("Error checking QR availability:", error)
      setIsQRAvailable(false)
      setTimeUntilAvailable("Error checking availability")
      return false
    }
  }, [])

  const checkIfAlreadyScanned = useCallback(
    async (gameId: string) => {
      if (!userId) return false

      try {
        const { data, error } = await supabase
          .from("scan_history")
          .select("id")
          .eq("user_id", userId)
          .eq("id", gameId)
          .single()

        if (error && error.code !== "PGRST116") {
          console.error("Error checking scan history:", error)
          return false
        }

        const hasScanned = !!data
        setHasAlreadyScanned(hasScanned)
        return hasScanned
      } catch (error) {
        console.error("Error checking scan history:", error)
        setHasAlreadyScanned(false)
        return false
      }
    },
    [userId],
  )

  const openQRModal = () => {
    setShowQRModal(true)
    Animated.parallel([
      Animated.timing(modalFadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(modalScaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start()
  }

  const closeQRModal = () => {
    Animated.parallel([
      Animated.timing(modalFadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(modalScaleAnim, {
        toValue: 0.8,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowQRModal(false)
    })
  }

  const handleSelectGame = (game: GameWithTeams) => {
    setSelectedGame(game)
    checkQRAvailability(game)
    checkIfAlreadyScanned(game.game_id)
    setShowGameDropdown(false)
  }

  // Initial load
  useEffect(() => {
    if (userId) {
      loadData()
    }
  }, [userId])

  // Set up interval for time checking
  useEffect(() => {
    if (!selectedGame) return

    const interval = setInterval(() => {
      checkQRAvailability(selectedGame)
    }, 60000) // Check every minute

    return () => clearInterval(interval)
  }, [selectedGame, checkQRAvailability])

  // Entry animation
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start()
  }, [])

  if (loading || userLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    )
  }

  if (!userId) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="person-outline" size={64} color={colors.textSecondary} />
          <Text style={styles.errorText}>Please log in to view your QR code</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Animated.ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        style={{ opacity: fadeAnim }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
      >
        {/* Header */}
        <Animated.View style={[styles.header, { transform: [{ translateY: slideAnim }] }]}>
          <Text style={styles.instructions}>Show this QR code to staff at games and events to earn points!</Text>
        </Animated.View>

        {/* Game Selection Dropdown */}
        <View style={styles.gameSelectionWrapper}>
          <TouchableOpacity 
            style={styles.gameDropdownButton} 
            onPress={() => setShowGameDropdown(!showGameDropdown)}
          >
            <Text style={styles.gameDropdownText}>
              {selectedGame ? 
                `${selectedGame.teams?.sport || "Game"} - ${formatDate(selectedGame.date)}` : 
                "Select a game"}
            </Text>
            <Ionicons 
              name={showGameDropdown ? "chevron-up" : "chevron-down"} 
              size={20} 
              color={colors.text} 
            />
          </TouchableOpacity>
          
          {showGameDropdown && (
            <View style={styles.gameDropdownList}>
              {games.map((game) => (
                <TouchableOpacity
                  key={game.game_id}
                  style={[
                    styles.gameDropdownItem,
                    selectedGame?.game_id === game.game_id && styles.gameDropdownItemSelected
                  ]}
                  onPress={() => handleSelectGame(game)}
                >
                  <View style={styles.gameDropdownItemContent}>
                    <Text style={[
                      styles.gameDropdownItemTitle,
                      selectedGame?.game_id === game.game_id && styles.gameDropdownItemTextSelected
                    ]}>
                      {game.teams?.sport || "Game"} - {formatDate(game.date)}
                    </Text>
                    <Text style={[
                      styles.gameDropdownItemSubtitle,
                      selectedGame?.game_id === game.game_id && styles.gameDropdownItemTextSelected
                    ]}>
                      {game.teams?.short_name || "Home"} vs {game.opposing_teams?.name || "Away"}
                    </Text>
                    <Text style={[
                      styles.gameDropdownItemDetails,
                      selectedGame?.game_id === game.game_id && styles.gameDropdownItemTextSelected
                    ]}>
                      {formatTime(game.game_time)} at {game.location}
                    </Text>
                  </View>
                  {selectedGame?.game_id === game.game_id && (
                    <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Current Game QR Code */}
        {selectedGame ? (
          <>
            <Animated.View style={[styles.gameInfo, { transform: [{ translateY: slideAnim }] }]}>
              <Text style={styles.gameTitle}>
                {selectedGame.teams?.sport || "Game"} - {formatDate(selectedGame.date)}
              </Text>
              <Text style={styles.gameMatchup}>
                {selectedGame.teams?.short_name || "Home"} vs {selectedGame.opposing_teams?.name || "Away"}
              </Text>
              <Text style={styles.gameLocation}>
                {formatTime(selectedGame.game_time)} at {selectedGame.location}
              </Text>
              <Text style={styles.qrPointsText}>{selectedGame.points || 50} Points</Text>

              {!isQRAvailable && timeUntilAvailable && (
                <View style={styles.availabilityContainer}>
                  <Ionicons name="time-outline" size={16} color={colors.warning} />
                  <Text style={styles.availabilityText}>{timeUntilAvailable}</Text>
                </View>
              )}

              {hasAlreadyScanned && (
                <View style={styles.scannedContainer}>
                  <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                  <Text style={styles.scannedText}>Already scanned for this game</Text>
                </View>
              )}
            </Animated.View>

            <Pressable
              onPress={isQRAvailable && !hasAlreadyScanned ? openQRModal : undefined}
              disabled={!isQRAvailable || hasAlreadyScanned}
            >
              <Animated.View
                style={[
                  styles.qrContainer,
                  {
                    opacity: isQRAvailable && !hasAlreadyScanned ? 1 : 0.5,
                    transform: [{ scale: scaleAnim }],
                  },
                ]}
              >
                <View style={styles.shadowWrapper}>
                <LinearGradient
                  colors={[colors.primary, colors.accent]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.qrGradient}
                >
                  <View style={styles.qrBackground}>
                    {isQRAvailable && !hasAlreadyScanned ? (
                      <QRCode
                        value={generateQRData(selectedGame)}
                        size={220}
                        color={colors.text}
                        backgroundColor="#FFFFFF"
                      />
                    ) : (
                      <View style={styles.qrPlaceholder}>
                        <Ionicons
                          name={hasAlreadyScanned ? "checkmark-circle" : "time-outline"}
                          size={80}
                          color={colors.textSecondary}
                        />
                        <Text style={styles.qrPlaceholderText}>
                          {hasAlreadyScanned ? "Already Scanned" : "QR Code Not Available"}
                        </Text>
                      </View>
                    )}
                  </View>
                </LinearGradient>
                </View>
              </Animated.View>
            </Pressable>
          </>
        ) : (
          <View style={styles.noGamesContainer}>
            <Ionicons name="calendar-outline" size={64} color={colors.textSecondary} />
            <Text style={styles.noGamesText}>No upcoming games scheduled</Text>
            <Pressable style={styles.refreshButton} onPress={() => loadData()}>
              <Text style={styles.refreshButtonText}>Refresh</Text>
            </Pressable>
          </View>
        )}

        {/* Recent Scans */}
        <View style={styles.historyContainer}>
          <Text style={styles.historyTitle}>Recent Scans</Text>
          {recentScans && recentScans.length > 0 ? (
            recentScans.map((scan) => (
              <View key={scan.id} style={styles.historyItem}>
                <View style={styles.historyInfo}>
                  <Text style={styles.historyDescription}>{scan.description}</Text>
                  <Text style={styles.historyDate}>{formatScanDate(scan.scanned_at)}</Text>
                </View>
                <Text style={styles.historyPoints}>+{scan.points}</Text>
              </View>
            ))
          ) : (
            <View style={styles.noHistoryContainer}>
              <Ionicons name="trophy-outline" size={32} color={colors.textSecondary} />
              <Text style={styles.noHistoryText}>No scans yet. Start attending games to earn points!</Text>
            </View>
          )}
        </View>

        {/* How it works */}
        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>How It Works</Text>
          <View style={styles.infoStep}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <Text style={styles.infoText}>Show your QR code to staff at games and events</Text>
          </View>
          <View style={styles.infoStep}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <Text style={styles.infoText}>Staff will scan your code to award points instantly</Text>
          </View>
          <View style={styles.infoStep}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <Text style={styles.infoText}>Redeem your points for exclusive rewards and merchandise</Text>
          </View>
        </View>

        <View style={styles.bottomSpacing} />
      </Animated.ScrollView>

      {/* QR Code Modal */}
      <Modal visible={showQRModal} transparent={true} animationType="none" onRequestClose={closeQRModal}>
        <Pressable style={styles.modalOverlay} onPress={closeQRModal}>
          <Animated.View
            style={[
              styles.modalContainer,
              {
                opacity: modalFadeAnim,
                transform: [{ scale: modalScaleAnim }],
              },
            ]}
          >
            <Pressable onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Your QR Code</Text>
                  <Pressable onPress={closeQRModal} style={styles.closeButton}>
                    <Ionicons name="close" size={24} color={colors.text} />
                  </Pressable>
                </View>

                <View style={styles.modalQRContainer}>
                  <QRCode
                    value={selectedGame ? generateQRData(selectedGame) : ""}
                    size={280}
                    color={colors.text}
                    backgroundColor="#FFFFFF"
                  />
                </View>

                <View style={styles.modalInfo}>
                  <Text style={styles.modalGameTitle}>
                    {selectedGame?.teams?.sport || "Game"} - {selectedGame ? formatDate(selectedGame.date) : ""}
                  </Text>
                  <Text style={styles.modalGameDetails}>
                    {selectedGame?.teams?.short_name || "Home"} vs {selectedGame?.opposing_teams?.name || "Away"}
                  </Text>
                  <Text style={styles.modalPoints}>Earn {selectedGame?.points || 50} Points</Text>
                </View>

                <Text style={styles.modalInstructions}>Show this QR code to staff to earn your points!</Text>
              </View>
            </Pressable>
          </Animated.View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 40,
    backgroundColor: colors.background,
  },
  shadowWrapper: {
    borderRadius: 24, 
    backgroundColor: '#fff', // Required for iOS shadows
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4, // Android
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.text,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 18,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 16,
  },
  content: {
    paddingHorizontal: 16,
  },
  header: {
    marginBottom: 24,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.text,
    textAlign: "center",
    marginBottom: 8,
  },
  instructions: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 24,
    paddingTop: 20,
  },
  gameSelectionWrapper: {
    marginBottom: 20,
    zIndex: 10,
  },
  gameDropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  gameDropdownText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  gameDropdownList: {
    backgroundColor: colors.card,
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: colors.border,
    maxHeight: 300,
    overflow: 'hidden',
  },
  gameDropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  gameDropdownItemSelected: {
    backgroundColor: `${colors.primary}10`,
  },
  gameDropdownItemContent: {
    flex: 1,
  },
  gameDropdownItemTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 4,
  },
  gameDropdownItemSubtitle: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 2,
  },
  gameDropdownItemDetails: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  gameDropdownItemTextSelected: {
    color: colors.primary,
  },
  gameInfo: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    alignItems: "center",
  },
  gameTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 8,
    textAlign: "center",
  },
  gameMatchup: {
    fontSize: 16,
    fontWeight: "500",
    color: colors.text,
    marginBottom: 4,
    textAlign: "center",
  },
  gameLocation: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  qrPointsText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.success,
  },
  qrContainer: {
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  qrGradient: {
    padding: 20,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  qrBackground: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: 16,
    alignItems: "center",
  },
  qrPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
    height: 220,
    width: 220,
  },
  qrPlaceholderText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 12,
    fontWeight: "500",
  },
  gameSelection: {
    marginBottom: 24,
  },
  selectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 12,
  },
  gameOption: {
    backgroundColor: colors.card,
    padding: 12,
    borderRadius: 12,
    marginRight: 12,
    minWidth: 140,
    alignItems: "center",
  },
  selectedGame: {
    backgroundColor: colors.primary,
  },
  gameOptionDate: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.text,
    textAlign: "center",
    marginBottom: 4,
  },
  gameOptionTeams: {
    fontSize: 11,
    fontWeight: "500",
    color: colors.text,
    textAlign: "center",
    marginBottom: 4,
  },
  gameOptionLocation: {
    fontSize: 10,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: 4,
  },
  gameOptionPoints: {
    fontSize: 11,
    fontWeight: "500",
    color: colors.success,
    textAlign: "center",
  },
  selectedGameText: {
    color: "#FFFFFF",
  },
  noGamesContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  noGamesText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 16,
    marginBottom: 20,
  },
  refreshButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  refreshButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  historyContainer: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 16,
  },
  historyItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  historyInfo: {
    flex: 1,
  },
  historyDescription: {
    fontSize: 14,
    color: colors.text,
    fontWeight: "500",
    marginBottom: 4,
  },
  historyDate: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  historyPoints: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.success,
  },
  noHistoryContainer: {
    alignItems: "center",
    paddingVertical: 20,
  },
  noHistoryText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 12,
    lineHeight: 20,
  },
  infoContainer: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 16,
    textAlign: "center",
  },
  infoStep: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    marginTop: 2,
  },
  stepNumberText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  bottomSpacing: {
    height: 40,
  },
  availabilityContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "rgba(255, 193, 7, 0.1)",
    borderRadius: 8,
  },
  availabilityText: {
    fontSize: 12,
    color: colors.warning,
    marginLeft: 4,
    fontWeight: "500",
  },
  scannedContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    borderRadius: 8,
  },
  scannedText: {
    fontSize: 12,
    color: colors.success,
    marginLeft: 4,
    fontWeight: "500",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    margin: 20,
    borderRadius: 24,
    overflow: "hidden",
  },
  modalContent: {
    backgroundColor: colors.background,
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    maxWidth: Dimensions.get("window").width - 40,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
  },
  closeButton: {
    padding: 4,
  },
  modalQRContainer: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  modalInfo: {
    alignItems: "center",
    marginBottom: 16,
  },
  modalGameTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    textAlign: "center",
    marginBottom: 4,
  },
  modalGameDetails: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: 8,
  },
  modalPoints: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.success,
  },
  modalInstructions: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
})