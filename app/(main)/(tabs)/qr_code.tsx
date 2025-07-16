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
  FlatList,
  Image,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useLocalSearchParams } from "expo-router"
import { colors } from "@/constants/colors"
import { useUserStore } from "@/hooks/userStore"
import Ionicons from "@expo/vector-icons/Ionicons"
import { LinearGradient } from "expo-linear-gradient"
import QRCode from "react-native-qrcode-svg"
import { sortGamesByPriority } from "@/utils/sortGame"
import {
  loadGamesAction,
  generateOrGetQRCodeAction,
  checkIfAlreadyScannedAction,
  type QRCodeData,
} from "@/app/actions/qr_scanning"
import type { Game } from "@/types/game"

interface GameSelectionModalProps {
  visible: boolean
  onClose: () => void
  games: Game[]
  selectedGame: Game | null
  onSelect: (game: Game) => void
}

// --- Helper Functions ---
const formatDate = (dateString: string): string =>
  new Date(dateString).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })

// --- Game Selection Modal Component ---
const GameSelectionModal = ({ visible, onClose, games, selectedGame, onSelect }: GameSelectionModalProps) => {
  const modalSlideAnim = useRef(new Animated.Value(Dimensions.get("window").height)).current

  useEffect(() => {
    if (visible) {
      Animated.spring(modalSlideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 40,
        friction: 10,
      }).start()
    } else {
      Animated.timing(modalSlideAnim, {
        toValue: Dimensions.get("window").height,
        duration: 250,
        useNativeDriver: true,
      }).start()
    }
  }, [visible])

  const renderGameItem = ({ item }: { item: Game }) => (
    <TouchableOpacity style={styles.modalGameItem} onPress={() => onSelect(item)}>
      <View style={styles.modalGameItemContent}>
        <View style={styles.gameTeamsContainer}>
          <Text style={styles.modalGameItemTitle}>
            {item.homeTeam?.name || "Home"} vs {item.awayTeam?.name || "Away"} • {item.points} PTS
          </Text>
        </View>
        <Text style={styles.modalGameItemSubtitle}>
          {item.location} • {formatDate(item.date)} at {item.time}
        </Text>
      </View>
      {selectedGame?.id === item.id && <Ionicons name="checkmark-circle" size={24} color={colors.primary} />}
    </TouchableOpacity>
  )

  return (
    <Modal transparent visible={visible} onRequestClose={onClose} animationType="none">
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Animated.View style={[styles.modalContainer, { transform: [{ translateY: modalSlideAnim }] }]}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select a Game</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={28} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={games}
              renderItem={renderGameItem}
              keyExtractor={(item) => item.id}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 40 }}
            />
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  )
}

export default function QRCodeScreen() {
  const { userId, isLoading: userLoading } = useUserStore()
  const { id: gameIdFromParams } = useLocalSearchParams<{ id?: string }>()

  const [games, setGames] = useState<Game[]>([])
  const [selectedGame, setSelectedGame] = useState<Game | null>(null)
  const [qrCodeData, setQrCodeData] = useState<QRCodeData | null>(null)

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [isQRAvailable, setIsQRAvailable] = useState(false)
  const [timeUntilAvailable, setTimeUntilAvailable] = useState("")
  const [hasAlreadyScanned, setHasAlreadyScanned] = useState(false)
  const [isModalVisible, setIsModalVisible] = useState(false)

  const loadData = useCallback(
    async (isRefresh = false) => {
      if (!userId) {
        setLoading(false)
        return
      }
      if (!isRefresh) setLoading(true)

      try {
        const result = await loadGamesAction(gameIdFromParams, isRefresh)

        if (!result.success) {
          Alert.alert("Error", result.error)
          return
        }

        let sortedGames: Game[] = [];
        if (result.data !== undefined) {
          sortedGames = sortGamesByPriority(result.data);
        }
        setGames(sortedGames)

        if (sortedGames.length > 0) {
          const gameToSelect = gameIdFromParams ? sortedGames.find((g) => g.id === gameIdFromParams) : sortedGames[0]
          handleSelectGame(gameToSelect || sortedGames[0], true)
        }
      } catch (error) {
        console.error("Error loading data:", error)
        Alert.alert("Error", "Failed to load game schedule.")
      } finally {
        setLoading(false)
        if (isRefresh) setRefreshing(false)
      }
    },
    [userId, gameIdFromParams],
  )

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    loadData(true)
  }, [loadData])

  const checkQRAvailability = useCallback((game: Game) => {
  if (!game?.date || !game?.time) return

  const parse12HourTime = (timeStr: string): string => {
    const [time, modifier] = timeStr.split(' ')
    let [hours, minutes] = time.split(':').map(Number)

    if (modifier === 'PM' && hours < 12) hours += 12
    if (modifier === 'AM' && hours === 12) hours = 0

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`
  }

  const time24h = parse12HourTime(game.time)
  const gameDateTime = new Date(`${game.date}T${time24h}`)

  if (isNaN(gameDateTime.getTime())) {
    console.error("Invalid parsed date:", `${game.date}T${time24h}`)
    return
  }

  const now = new Date()
  const oneHourBefore = new Date(gameDateTime.getTime() - 60 * 60 * 1000)

  if (now >= oneHourBefore) {
    setIsQRAvailable(true)
    setTimeUntilAvailable("")
  } else {
    const diff = oneHourBefore.getTime() - now.getTime()
    const days = Math.floor(diff / (24 * 60 * 60 * 1000))
    const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000))
    const minutes = Math.floor((diff % (60 * 60 * 1000)) / 60000)

    let timeParts: string[] = []

    if (days > 0) timeParts.push(`${days}d`)
    if (hours > 0) timeParts.push(`${hours}h`)
    if (minutes > 0) timeParts.push(`${minutes}m`)
    if (timeParts.length === 0) timeParts.push("less than a minute")

    setTimeUntilAvailable(timeParts.join(" "))
    setIsQRAvailable(false)
  }
}, [])

  const handleSelectGame = async (game: Game, isInitialLoad = false) => {
    if (!userId) return

    setSelectedGame(game)
    checkQRAvailability(game)

    // Generate or get QR code for this game
    const qrCode = await generateOrGetQRCodeAction(userId, game.id)
    if (qrCode) {
      setQrCodeData(qrCode)
    }

    // Check if already scanned
    const alreadyScanned = await checkIfAlreadyScannedAction(userId, game.id)
    setHasAlreadyScanned(alreadyScanned)

    if (!isInitialLoad) setIsModalVisible(false)
  }

  useEffect(() => {
    if (userId) loadData()
  }, [userId, loadData])

  useEffect(() => {
    if (!selectedGame) return
    const interval = setInterval(() => checkQRAvailability(selectedGame), 30000)
    return () => clearInterval(interval)
  }, [selectedGame])

  if (loading || userLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator style={{ flex: 1 }} size="large" color={colors.primary} />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <GameSelectionModal
        visible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        games={games}
        selectedGame={selectedGame}
        onSelect={handleSelectGame}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
      >
        <Text style={styles.instructions}>
          Show this QR code at games, events, and merchandise stores to earn points and unlock rewards!
        </Text>

        {selectedGame ? (
          <View style={styles.mainCard}>
            <TouchableOpacity style={styles.cardHeader} onPress={() => setIsModalVisible(true)}>
              <View style={styles.cardHeaderContent}>
                <View style={styles.gameHeaderContainer}>
                  <View style={styles.teamsRow}>
                    <Image source={require('@/IMAGES/MAIN_LOGO.png')} style={styles.headerTeamLogo} />
                    <Text style={styles.cardTitle}>
                      {selectedGame.homeTeam?.name || "Home"} vs {selectedGame.awayTeam?.name || "Away"}
                    </Text>
                    {selectedGame.awayTeam?.logo && (
                      <Image source={{ uri: selectedGame.awayTeam.logo }} style={styles.headerTeamLogo} />
                    )}
                  </View>
                  <Text style={styles.sportText}>{selectedGame.game_type.toUpperCase()}</Text>
                </View>

                {/* Wrap location/time and icon in a row */}
                <View style={styles.detailsRow}>
                  <Text style={styles.cardDetails}>
                    {selectedGame.location} • {formatDate(selectedGame.date)} at {selectedGame.time}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color={colors.primary} style={styles.chevronIcon} />
                </View>
              </View>
            </TouchableOpacity>
            <View style={[styles.qrWrapper, { opacity: isQRAvailable && !hasAlreadyScanned ? 1 : 0.4 }]}>
              <LinearGradient
                colors={[selectedGame.homeTeam?.primaryColor || colors.primary, colors.accent]}
                style={styles.qrGradient}
              >
                <View style={styles.qrBackground}>
                  {qrCodeData ? (
                    <QRCode value={qrCodeData.qr_code_data} size={Dimensions.get("window").width * 0.55} />
                  ) : (
                    <ActivityIndicator size="large" color={colors.primary} />
                  )}
                </View>
              </LinearGradient>
            </View>

            <View style={styles.statusContainer}>
              {hasAlreadyScanned ? (
                <View style={[styles.statusBadge, { backgroundColor: "#10B981" }]}>
                  <Ionicons name="checkmark-circle" size={16} color="white" />
                  <Text style={styles.statusText}>Points Received</Text>
                </View>
              ) : isQRAvailable ? (
                <View style={[styles.statusBadge, { backgroundColor: colors.success }]}>
                  <Ionicons name="checkmark-circle" size={16} color="white" />
                  <Text style={styles.statusText}>Ready to Scan for {selectedGame.points} PTS</Text>
                </View>
              ) : (
                <View style={[styles.statusBadge, { backgroundColor: colors.warning }]}>
                  <Ionicons name="time" size={16} color="white" />
                  <Text style={styles.statusText}>Available in {timeUntilAvailable}</Text>
                </View>
              )}
            </View>
          </View>
        ) : (
          <View style={styles.noGamesContainer}>
            <Ionicons name="calendar-outline" size={64} color={colors.textSecondary} />
            <Text style={styles.noGamesText}>No upcoming games found</Text>
          </View>
        )}

        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>How It Works</Text>
          <Text style={styles.infoText}>1. Show your QR code at participating locations</Text>
          <Text style={styles.infoText}>2. Staff will scan your code to award points</Text>
          <Text style={styles.infoText}>3. Earn points for attending games, buying merchandise, and more</Text>
          <Text style={styles.infoText}>4. Redeem your points for exclusive rewards</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: 40,
  },
  content: { padding: 16, paddingBottom: 40 },
  instructions: { fontSize: 16, color: colors.textSecondary, textAlign: "center", marginBottom: 24, lineHeight: 24 },

  mainCard: {
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  cardHeaderContent: { flex: 1, marginRight: 8 },
  gameHeaderContainer: {
    marginBottom: 8,
  },
  teamsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  headerTeamLogo: {
    width: 34,
    height: 28,
  },
  cardTitle: { fontSize: 20, fontWeight: "700", color: colors.text, flex: 1, textAlign: "center" },
  sportText: { fontSize: 14, color: colors.primary, fontWeight: "600", textAlign: "center" },
  cardDetails: { fontSize: 14, color: colors.textSecondary, marginTop: 4 },
  locationText: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  qrWrapper: { alignItems: "center", marginVertical: 24 },
  qrGradient: { padding: 12, borderRadius: 20 },
  qrBackground: { backgroundColor: "#FFFFFF", padding: 16, borderRadius: 12 },
  statusContainer: {
    alignItems: "center",
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 99,
  },
  statusText: { color: "white", fontSize: 14, fontWeight: "600", marginLeft: 8 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
  modalContainer: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "75%",
    padding: 16,
    paddingTop: 8,
  },
  modalContent: {},
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 16,
    paddingTop: 8,
  },
  modalTitle: { fontSize: 20, fontWeight: "bold", color: colors.text },
  closeButton: { padding: 8 },

  modalGameItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
  },
  modalGameItemContent: { flex: 1 },
  gameTeamsContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  teamLogo: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginHorizontal: 6,
  },
  modalGameItemTitle: { fontSize: 16, fontWeight: "600", color: colors.text, flex: 1, textAlign:"left" },
  modalGameItemSubtitle: { fontSize: 14, color: colors.textSecondary },
  gameLocationText: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  separator: { height: 1, backgroundColor: colors.border },

  noGamesContainer: { alignItems: "center", paddingVertical: 80 },
  noGamesText: { fontSize: 16, color: colors.textSecondary, marginTop: 16 },
  infoContainer: {
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    borderRadius: 16,
    padding: 16,
    marginTop: 30,
    width: "90%",
    alignSelf: "center",
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 16,
    textAlign: "center",
  },
  infoText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
    marginBottom: 8,
  },
  detailsRow: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginTop: 4,
},
chevronIcon: {
  marginLeft: 8,
},
})
