"use client"

import { useState, useEffect, useMemo } from "react"
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  ActivityIndicator,
  FlatList,
  Modal,
} from "react-native"
import { useRouter } from "expo-router"
import { SafeAreaView } from "react-native-safe-area-context"
import { colors } from "@/constants/colors"
import { GameCard } from "@/components/games/new_game_card"
import { getUpcomingGames, getPastGames, getLiveGames } from "@/app/actions/games" 
import { getTeams } from "@/app/actions/teams"
import { useNotifications } from "@/context/notification-context"
import type { Team } from "@/app/actions/teams"
import type { Game } from "@/types/game"
import Feather from "@expo/vector-icons/Feather"
import Animated, { FadeIn, Layout } from "react-native-reanimated"
import { sortGamesByPriority } from "@/utils/sortGame"

export default function AllGamesScreen() {
  const router = useRouter()
  const { showSuccess, showInfo } = useNotifications()

  const [allGames, setAllGames] = useState<Game[]>([])
  const [allTeams, setAllTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState<"all" | "upcoming" | "live" | "completed">("all")
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
  const [isTeamPickerOpen, setIsTeamPickerOpen] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [gamesData, teamsData] = await Promise.all([fetchAllGames(), fetchAllTeams()])
        setAllGames(gamesData)
        setAllTeams(teamsData)
      } catch (error) {
        showInfo("Error", "Failed to load data.")
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const fetchAllGames = async () => {
    try {
      const [upcoming, past, live] = await Promise.all([
        getUpcomingGames(50),
        getPastGames(20),
        getLiveGames(10)
      ]);
      const combinedGames = [...live, ...upcoming, ...past];
      return sortGamesByPriority(combinedGames);
    } catch (error) {
      console.error("Error fetching games:", error);
      showInfo("Error", "Failed to load games. Please try again.");
      return [];
    }
  };
  
  const fetchAllTeams = async () => {
    try {
      const teams = await getTeams();
      return teams.sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      console.error("Error fetching teams:", error);
      showInfo("Error", "Failed to load teams. Please try again.");
      return [];
    }
  };

  const handleGamePress = (game: Game) => router.push({ pathname: "./game_details", params: { id: game.id } })
  const handleNotifyPress = (game: Game) => showSuccess("Notification Set", `You'll be notified about the game.`)
  const handleTeamSelect = (team: Team | null) => {
    setSelectedTeam(team)
    setIsTeamPickerOpen(false)
  }
  const handleClearTeam = () => setSelectedTeam(null)

  // Filtering and Sorting Logic
  const filteredAndSortedGames = useMemo(() => {
    const filtered = allGames.filter((game) => {
      const teamMatches = selectedTeam ? game.homeTeam.id === selectedTeam.id || game.awayTeam.id === selectedTeam.id : true;
      
      // --- THE FIX ---
      // Handle the mismatch between the "upcoming" filter and the "scheduled" status.
      let statusMatches = true;
      if (activeFilter !== "all") {
        if (activeFilter === "upcoming") {
          statusMatches = game.status === "scheduled"; // Correctly check for "scheduled"
        } else {
          statusMatches = game.status === activeFilter; // "live" and "completed" work as is
        }
      }
      
      return teamMatches && statusMatches;
    });

    return sortGamesByPriority(filtered);
  }, [allGames, selectedTeam, activeFilter]);

  const FilterTab = ({ filter, label, icon }: { filter: string; label: string; icon: string }) => {
    const isActive = activeFilter === filter
    return (
      <Pressable style={[styles.filterTab, isActive && styles.activeFilterTab]} onPress={() => setActiveFilter(filter as any)}>
        <Feather name={icon as any} size={16} color={isActive ? colors.primary : colors.textSecondary} />
        <Text style={[styles.filterTabText, isActive && styles.activeFilterTabText]}>{label}</Text>
      </Pressable>
    )
  }

  const renderGameSection = (title: string, games: Game[], icon: string, color: string) => {
    if (games.length === 0) return null
    return (
      <Animated.View layout={Layout.springify()} style={styles.gameSection}>
        <View style={styles.sectionHeader}>
          <View style={[styles.sectionIcon, { backgroundColor: `${color}20` }]}>
            <Feather name={icon as any} size={18} color={color} />
          </View>
          <Text style={styles.sectionTitle}>{title}</Text>
        </View>
        {games.map((game) => <GameCard key={game.id} game={game} onPress={handleGamePress} onNotifyPress={handleNotifyPress} />)}
      </Animated.View>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={["left"]}>
      <Image source={require("@/IMAGES/crowd.jpg")} style={styles.backgroundImage} />

      <View style={styles.filterContainer}>
        <View style={styles.statusFilterGroup}>
          <FilterTab filter="all" label="All" icon="grid" />
          <FilterTab filter="live" label="Live" icon="radio" />
          <FilterTab filter="upcoming" label="Upcoming" icon="clock" />
          <FilterTab filter="completed" label="Past" icon="check-circle" />
        </View>
        <View style={styles.teamFilterGroup}>
          <Pressable style={styles.teamPickerButton} onPress={() => setIsTeamPickerOpen(true)}>
            <Feather name="shield" size={16} color={selectedTeam ? colors.primary : colors.textSecondary} />
            <Text style={[styles.teamPickerButtonText, selectedTeam && styles.activeTeamText]}>
              {selectedTeam?.name || "Filter by Team"}
            </Text>
          </Pressable>
          {selectedTeam && (
            <Pressable style={styles.clearTeamButton} onPress={handleClearTeam}>
              <Feather name="x" size={18} color={colors.primary} />
            </Pressable>
          )}
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ flex: 1 }} />
      ) : filteredAndSortedGames.length > 0 ? (
        <FlatList
          data={[{ key: "games" }]}
          keyExtractor={(item) => item.key}
          renderItem={() => (
            <>
              {renderGameSection("Live Now", filteredAndSortedGames.filter(g => g.status === 'live'), "radio", "#EF4444")}
              {renderGameSection("Upcoming Games", filteredAndSortedGames.filter(g => g.status === "scheduled"), "clock", colors.primary)}
              {renderGameSection("Recent Results", filteredAndSortedGames.filter(g => g.status === 'completed'), "check-circle", "#10B981")}
            </>
          )}
          contentContainerStyle={styles.gamesContent}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <Animated.View entering={FadeIn} style={styles.emptyContainer}>
          <Feather name="search" size={48} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>No Games Found</Text>
          <Text style={styles.emptyText}>Try adjusting your filters or check back later.</Text>
        </Animated.View>
      )}

      <Modal visible={isTeamPickerOpen} transparent={true} animationType="fade">
        <Pressable style={styles.modalBackdrop} onPress={() => setIsTeamPickerOpen(false)}>
          <View style={styles.modalContent}>
            <FlatList
              data={[{ id: null, name: "All Teams" }, ...allTeams]}
              keyExtractor={(item) => item.id || 'all'}
              renderItem={({ item }) => (
                <Pressable style={styles.teamPickerItem} onPress={() => handleTeamSelect(item.id ? (item as Team) : null)}>
                  <Text style={styles.teamPickerItemText}>{item.name}</Text>
                </Pressable>
              )}
            />
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  )
}

// Styles remain the same
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  backgroundImage: {
    position: "absolute",
    bottom: 0,
    resizeMode: "cover",
    opacity: 0.05,
  },
  filterContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop:20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 12,
  },
  statusFilterGroup: {
    flexDirection: 'row',
    backgroundColor: colors.background + "E6",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  filterTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 6,
  },
  activeFilterTab: {
    backgroundColor: colors.primary + '1A',
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  activeFilterTabText: {
    color: colors.primary,
    fontWeight: '700',
  },
  teamFilterGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  teamPickerButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  teamPickerButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  activeTeamText: {
    color: colors.primary,
    fontWeight: '600',
  },
  clearTeamButton: {
    backgroundColor: colors.primary + '1A',
    padding: 10,
    borderRadius: 10,
  },
  gamesContent: {
  },
  gameSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding:20
  },
  sectionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#374151",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: "#6B7280",
    textAlign: "center",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    width: '80%',
    maxHeight: '60%',
    paddingVertical: 8,
  },
  teamPickerItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    alignContent:"flex-start",
  },
  teamPickerItemText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    textAlign: 'left',
  },
});