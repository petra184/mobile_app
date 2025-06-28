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
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useLocalSearchParams } from "expo-router"
import { colors } from "@/constants/colors"
import { useUserStore } from "@/hooks/userStore"
import Ionicons from "@expo/vector-icons/Ionicons"
import { LinearGradient } from "expo-linear-gradient"
import QRCode from "react-native-qrcode-svg"
import { supabase } from "@/lib/supabase"
import { sortGamesByPriority } from "@/utils/sortGame" // Assuming a sorting utility exists
import { Team } from "@/types"
import { Game, OpposingTeamRow } from "@/types/game"


interface GameWithTeams extends Game {
  teams?: Team | null
  opposing_teams?: OpposingTeamRow | null
}

interface GameSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  games: GameWithTeams[];
  selectedGame: GameWithTeams | null;
  onSelect: (game: GameWithTeams) => void;
}

// --- Helper Functions ---
const formatDate = (dateString: string): string => new Date(dateString).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
const formatTime = (timeString: string | null): string => {
  if (!timeString) return "TBD"
  try {
    const [hours, minutes] = timeString.split(":")
    const date = new Date()
    date.setHours(Number.parseInt(hours), Number.parseInt(minutes))
    return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
  } catch {
    return timeString;
  }
}

// --- Game Selection Modal Component ---
const GameSelectionModal = ({ visible, onClose, games, selectedGame, onSelect }: GameSelectionModalProps) => {
  const modalSlideAnim = useRef(new Animated.Value(Dimensions.get('window').height)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(modalSlideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 40,
        friction: 10,
      }).start();
    } else {
       Animated.timing(modalSlideAnim, {
        toValue: Dimensions.get('window').height,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const renderGameItem = ({ item }: { item: Game }) => (
    <TouchableOpacity
      style={styles.modalGameItem}
      onPress={() => onSelect(item)}
    >
      <View style={styles.modalGameItemContent}>
        <Text style={styles.modalGameItemTitle}>{item.homeTeam?.name || "Game"} vs {item.awayTeam?.name || "Away"}</Text>
        <Text style={styles.modalGameItemSubtitle}>{formatDate(item.date)} at {formatTime(item.time)}</Text>
      </View>
      {selectedGame?.id === item.id && (
        <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
      )}
    </TouchableOpacity>
  );

  return (
    <Modal
      transparent
      visible={visible}
      onRequestClose={onClose}
      animationType="none"
    >
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
  );
};


export default function QRCodeScreen() {
  const { userId, isLoading: userLoading } = useUserStore()
  const { id: gameIdFromParams } = useLocalSearchParams<{ id?: string }>();
  
  const [games, setGames] = useState<GameWithTeams[]>([])
  const [selectedGame, setSelectedGame] = useState<GameWithTeams | null>(null)
  
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [isQRAvailable, setIsQRAvailable] = useState(false)
  const [timeUntilAvailable, setTimeUntilAvailable] = useState("")
  const [hasAlreadyScanned, setHasAlreadyScanned] = useState(false)
  const [isModalVisible, setIsModalVisible] = useState(false)

  const loadData = useCallback(async (isRefresh = false) => {
    if (!userId) {
      setLoading(false);
      return;
    }
    if (!isRefresh) setLoading(true);

    try {
      let finalGamesList: GameWithTeams[] = [];
      
      if (gameIdFromParams && !isRefresh) {
        const [specificGameRes, upcomingGamesRes] = await Promise.all([
          supabase.from("game_schedule").select(`*, teams:sport_id(*), opposing_teams:opponent_id(*)`).eq("id", gameIdFromParams).single(),
          supabase.from("game_schedule").select(`*, teams:sport_id(*), opposing_teams:opponent_id(*)`).gte("date", new Date().toISOString().split("T")[0]).order("date", { ascending: true }).limit(10)
        ]);
        
        if (specificGameRes.error && specificGameRes.error.code !== 'PGRST116') throw specificGameRes.error;
        if (upcomingGamesRes.error) throw upcomingGamesRes.error;

        const gamesMap = new Map<string, GameWithTeams>();
        if (specificGameRes.data) {
          gamesMap.set(specificGameRes.data.id, specificGameRes.data as GameWithTeams);
        }
        (upcomingGamesRes.data as GameWithTeams[] || []).forEach(game => {
          if (!gamesMap.has(game.id)) {
            gamesMap.set(game.id, game);
          }
        });
        finalGamesList = Array.from(gamesMap.values());

      } else {
        const { data: gameData, error: gameError } = await supabase
          .from("game_schedule")
          .select(`*, teams:sport_id(*), opposing_teams:opponent_id(*)`)
          .gte("date", new Date().toISOString().split("T")[0])
          .order("date", { ascending: true }).limit(10);

        if (gameError) throw gameError;
        finalGamesList = (gameData as GameWithTeams[]) || [];
      }
      
      const sortedGames = sortGamesByPriority(finalGamesList);
      setGames(sortedGames);

      if (sortedGames.length > 0) {
        const gameToSelect = gameIdFromParams ? sortedGames.find(g => g.id === gameIdFromParams) : sortedGames[0];
        handleSelectGame(gameToSelect || sortedGames[0], true);
      }

    } catch (error) {
      console.error("Error loading games:", error);
      Alert.alert("Error", "Failed to load game schedule.");
    } finally {
      setLoading(false);
      if (isRefresh) setRefreshing(false);
    }
  }, [userId, gameIdFromParams]);

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    loadData(true)
  }, [loadData])

  const checkQRAvailability = (game: GameWithTeams) => {
    if (!game?.date || !game?.time) return;
  
    const gameDateTime = new Date(`${game.date}T${game.time}`);
    const now = new Date();
    const oneHourBefore = new Date(gameDateTime.getTime() - 60 * 60 * 1000);
  
    if (now >= oneHourBefore) {
      setIsQRAvailable(true);
      setTimeUntilAvailable("");
    } else {
      const diff = oneHourBefore.getTime() - now.getTime();
      const days = Math.floor(diff / (24 * 60 * 60 * 1000));
      const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
      const minutes = Math.floor((diff % (60 * 60 * 1000)) / 60000);
      const timeString = days > 0 ? `in ${days}d ${hours}h ${minutes}m` : `in ${hours}h ${minutes}m`;
      setTimeUntilAvailable(timeString);
      setIsQRAvailable(false);
    }
  };

  const checkIfAlreadyScanned = async (gameId: string) => {
    if (!userId) return
    const { data, error } = await supabase
      .from("scan_history").select("id").eq("user_id", userId).eq("id", gameId).single()
    if (error && error.code !== "PGRST116") console.error("Error checking scan:", error)
    setHasAlreadyScanned(!!data)
  }

  const handleSelectGame = (game: GameWithTeams, isInitialLoad = false) => {
    setSelectedGame(game)
    checkQRAvailability(game)
    checkIfAlreadyScanned(game.id)
    if (!isInitialLoad) setIsModalVisible(false)
  }

  useEffect(() => { if (userId) loadData() }, [userId, loadData])
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

  const qrData = selectedGame ? JSON.stringify({ userId, gameId: selectedGame.id }) : ""

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
        <Text style={styles.instructions}>Show this QR code at games, events, and merchandise stores to earn points and unlock rewards!</Text>

        {selectedGame ? (
          <View style={styles.mainCard}>
            <TouchableOpacity style={styles.cardHeader} onPress={() => setIsModalVisible(true)}>
              <View style={styles.cardHeaderContent}>
                <Text style={styles.cardTitle}>{selectedGame.teams?.sport || "Game"} vs {selectedGame.opposing_teams?.name || "Away"}</Text>
                 <Text style={styles.cardDetails}>{formatDate(selectedGame.date)} at {formatTime(selectedGame.time)}</Text>
              </View>
              <Ionicons name="chevron-down" size={24} color={colors.primary} />
            </TouchableOpacity>

            <View style={[styles.qrWrapper, { opacity: isQRAvailable && !hasAlreadyScanned ? 1 : 0.4 }]}>
              <LinearGradient colors={[colors.primary, colors.accent]} style={styles.qrGradient}>
                <View style={styles.qrBackground}>
                  <QRCode value={qrData} size={Dimensions.get('window').width * 0.55} />
                </View>
              </LinearGradient>
            </View>

            <View style={styles.statusContainer}>
              {hasAlreadyScanned ? (
                <View style={[styles.statusBadge, { backgroundColor: '#10B981'}]}>
                  <Ionicons name="checkmark-circle" size={16} color="white" />
                  <Text style={styles.statusText}>Points Received</Text>
                </View>
              ) : isQRAvailable ? (
                <View style={[styles.statusBadge, { backgroundColor: colors.success }]}>
                  <Ionicons name="scan" size={16} color="white" />
                  <Text style={styles.statusText}>Ready to Scan</Text>
                </View>
              ) : (
                <View style={[styles.statusBadge, { backgroundColor: colors.warning }]}>
                  <Ionicons name="time" size={16} color="white" />
                  <Text style={styles.statusText}>Available {timeUntilAvailable}</Text>
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
          <Text style={styles.infoText}>
            1. Show your QR code at participating locations
          </Text>
          <Text style={styles.infoText}>
            2. Staff will scan your code to award points
          </Text>
          <Text style={styles.infoText}>
            3. Earn points for attending games, buying merchandise, and more
          </Text>
          <Text style={styles.infoText}>
            4. Redeem your points for exclusive rewards
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: colors.background,
    paddingTop:40, 
  },
  content: { padding: 16, paddingBottom: 40 },
  instructions: { fontSize: 16, color: colors.textSecondary, textAlign: 'center', marginBottom: 24, lineHeight: 24 },
  
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  cardHeaderContent: { flex: 1, marginRight: 8 },
  cardTitle: { fontSize: 22, fontWeight: '700', color: colors.text, marginBottom: 4 },
  cardSubtitle: { fontSize: 16, fontWeight: '500', color: colors.textSecondary },
  cardDetails: { fontSize: 14, color: colors.textSecondary, marginTop: 4 },
  qrWrapper: { alignItems: 'center', marginVertical: 24 },
  qrGradient: { padding: 12, borderRadius: 20 },
  qrBackground: { backgroundColor: '#FFFFFF', padding: 16, borderRadius: 12 },

  statusContainer: {
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 99,
  },
  statusText: { color: 'white', fontSize: 14, fontWeight: '600', marginLeft: 8 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContainer: { 
    backgroundColor: colors.card, 
    borderTopLeftRadius: 24, 
    borderTopRightRadius: 24, 
    maxHeight: '75%', 
    padding: 16,
    paddingTop: 8,
  },
  modalContent: {},
  modalHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingBottom: 16, 
    paddingTop: 8,
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text },
  closeButton: { padding: 8 },
  
  modalGameItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: 16,
  },
  modalGameItemContent: { flex: 1 },
  modalGameItemTitle: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 4 },
  modalGameItemSubtitle: { fontSize: 14, color: colors.textSecondary },
  separator: { height: 1, backgroundColor: colors.border },
  
  noGamesContainer: { alignItems: "center", paddingVertical: 80 },
  noGamesText: { fontSize: 16, color: colors.textSecondary, marginTop: 16 },
  infoContainer: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 16,
    padding: 16,
    marginTop:30,
    width: '90%',
    alignSelf:"center"
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  infoText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
    marginBottom: 8, // Added for better spacing
  },
});