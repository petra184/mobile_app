"use client"
import { GameCard } from "@/components/games/new_game_card"
import { EnhancedDropdown } from "@/components/ui/new_dropdown"
import { colors } from "@/constants/Colors"
import { useNotifications } from "@/context/notification-context"
import { getLiveGames, getPastGames, getUpcomingGames } from "@/lib/actions/games"
import { getTeams } from "@/lib/actions/teams"
import type { Game, Team } from "@/types/updated_types"
import { sortGamesByPriority } from "@/utils/sortGame"
import Feather from "@expo/vector-icons/Feather"
import { useRouter } from "expo-router"
import { useCallback, useEffect, useMemo, useState } from "react"
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native"
import Animated, { FadeIn } from "react-native-reanimated"
import { SafeAreaView } from "react-native-safe-area-context"

export default function AllGamesScreen() {
  const router = useRouter()
  const { showSuccess, showInfo } = useNotifications()

  const [allGames, setAllGames] = useState<Game[]>([])
  const [allTeams, setAllTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState<"all" | "upcoming" | "live" | "completed">("all")
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
  const [locationType, setLocationType] = useState<string | null>(null)
  const [filterModalVisible, setFilterModalVisible] = useState(false)

  // Helper function to parse 12-hour time to 24-hour format (same as other components)
  const parse12HourTime = useCallback((timeStr: string): string => {
    try {
      const [time, modifier] = timeStr.toUpperCase().split(" ")
      let [hours, minutes] = time.split(":").map(Number)

      if (modifier === "PM" && hours < 12) {
        hours += 12
      }
      if (modifier === "AM" && hours === 12) {
        hours = 0
      }

      return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00`
    } catch (e) {
      console.error("Error parsing 12-hour time:", timeStr, e)
      return "00:00:00"
    }
  }, [])

  // Calculate game start and end times (same as other components)
  const getGameTimings = useCallback(
    (gameData: Game) => {
      const gameDate = new Date(gameData.date)
      let gameStartTime = new Date(gameDate)

      if (gameData.time) {
        const time24h = parse12HourTime(gameData.time)
        gameStartTime = new Date(`${gameDate.toISOString().split("T")[0]}T${time24h}`)
      } else {
        gameStartTime.setHours(0, 0, 0, 0)
      }

      const gameEndTime = new Date(gameStartTime.getTime() + 60 * 60 * 1000) // 1 hour after game start
      return { gameStartTime, gameEndTime }
    },
    [parse12HourTime],
  )

  // Function to determine if a game is actually live using time-based logic
  const isGameLive = useCallback(
    (game: Game): boolean => {
      // Skip completed, postponed, or canceled games
      if (
        game.status === "completed" ||
        game.status === "final" ||
        game.status === "postponed" ||
        game.status === "canceled"
      ) {
        return false
      }

      try {
        const now = new Date()
        const { gameStartTime, gameEndTime } = getGameTimings(game)

        // Game is live if current time is between start and end time
        return now >= gameStartTime && now <= gameEndTime
      } catch (error) {
        console.error("Error calculating game timings for game:", game.id, error)
        return false
      }
    },
    [getGameTimings],
  )

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
      const [upcoming, past, live] = await Promise.all([getUpcomingGames(500), getPastGames(200), getLiveGames(100)])
      const combinedGames = [...live, ...upcoming, ...past]

      // Remove duplicates by creating a Map with game IDs as keys
      const gameMap = new Map<string, Game>()
      combinedGames.forEach((game) => gameMap.set(game.id, game))
      const uniqueGames = Array.from(gameMap.values())

      return sortGamesByPriority(uniqueGames)
    } catch (error) {
      console.error("Error fetching games:", error)
      showInfo("Error", "Failed to load games. Please try again.")
      return []
    }
  }

  const fetchAllTeams = async () => {
    try {
      const teams = await getTeams()
      return teams.sort((a, b) => a.name.localeCompare(b.name))
    } catch (error) {
      console.error("Error fetching teams:", error)
      showInfo("Error", "Failed to load teams. Please try again.")
      return []
    }
  }

  const handleGamePress = (game: Game) => router.push({ pathname: "./game_details", params: { id: game.id } })
  const handleNotifyPress = (game: Game) => showSuccess("Notification Set", `You'll be notified about the game.`)

  // Team selection handlers
  const handleTeamSelect = useCallback(
    (teamId: string | null) => {
      const team = allTeams.find((t) => t.id === teamId) || null
      setSelectedTeam(team)
    },
    [allTeams],
  )

  const handleLocationTypeChange = useCallback((type: string | null) => {
    setLocationType(type)
  }, [])

  const clearTeamFilter = useCallback(() => {
    setSelectedTeam(null)
  }, [])

  const clearLocationFilter = useCallback(() => {
    setLocationType(null)
  }, [])

  const clearGameTypeFilter = useCallback(() => {
    setActiveFilter("all")
  }, [])

  const clearAllFilters = useCallback(() => {
    setSelectedTeam(null)
    setLocationType(null)
    setActiveFilter("all")
  }, [])

  // UPDATED: Helper function to categorize games using time-based logic
  const categorizeGamesByDate = useCallback(
    (games: Game[]) => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const live: Game[] = []
      const upcoming: Game[] = []
      const past: Game[] = []

      games.forEach((game) => {
        // Use time-based logic to determine if game is live
        if (isGameLive(game)) {
          live.push(game)
        } else {
          const gameDate = new Date(game.date)
          gameDate.setHours(0, 0, 0, 0)

          // Check if game is completed or in the past
          if (gameDate < today || game.status === "completed" || game.status === "final") {
            past.push(game)
          } else {
            // Game is in the future (upcoming)
            upcoming.push(game)
          }
        }
      })

      return { live, upcoming, past }
    },
    [isGameLive],
  )

  // Apply team and location filters first, then categorize by date
  const teamAndLocationFilteredGames = useMemo(() => {
    return allGames.filter((game) => {
      // Team filter
      const teamMatches = selectedTeam
        ? game.homeTeam.id === selectedTeam.id || game.awayTeam.id === selectedTeam.id
        : true

      // Location filter - Use game.game_type instead of game.location
      let locationMatches = true
      if (locationType) {
        const gameType = game.game_type?.toLowerCase() || ""
        if (locationType === "home" && gameType !== "home") locationMatches = false
        if (locationType === "away" && gameType !== "away") locationMatches = false
        if (locationType === "neutral" && gameType !== "neutral") locationMatches = false
      }

      return teamMatches && locationMatches
    })
  }, [allGames, selectedTeam, locationType])

  // Categorize games by date using time-based logic
  const {
    live: liveGames,
    upcoming: upcomingGames,
    past: pastGames,
  } = useMemo(() => {
    return categorizeGamesByDate(teamAndLocationFilteredGames)
  }, [teamAndLocationFilteredGames, categorizeGamesByDate])

  // Apply active filter to get final filtered games
  const filteredGames = useMemo(() => {
    let filtered: Game[] = []
    if (activeFilter === "all") {
      filtered = teamAndLocationFilteredGames
    } else if (activeFilter === "live") {
      filtered = liveGames
    } else if (activeFilter === "upcoming") {
      filtered = upcomingGames
    } else if (activeFilter === "completed") {
      filtered = pastGames
    }
    return sortGamesByPriority(filtered)
  }, [teamAndLocationFilteredGames, liveGames, upcomingGames, pastGames, activeFilter])

  // Dropdown options
  const teamOptions = useMemo(
    () => [
      {
        label: "All Teams",
        value: null,
        icon: "users",
      },
      ...allTeams.map((team) => ({
        label: team.name,
        value: team.id,
        color: team.primaryColor,
      })),
    ],
    [allTeams],
  )

  const locationOptions = useMemo(
    () => [
      {
        label: "All Games",
        value: null,
        icon: "globe",
      },
      {
        label: "Home Games",
        value: "home",
        subtitle: "Games at home venue",
        icon: "home",
      },
      {
        label: "Away Games",
        value: "away",
        subtitle: "Games at opponent venue",
        icon: "map-pin",
      },
      {
        label: "Neutral Games",
        value: "neutral",
        subtitle: "Games at neutral venue",
        icon: "navigation",
      },
    ],
    [],
  )

  const hasActiveFilters = useMemo(
    () => selectedTeam || locationType || activeFilter !== "all",
    [selectedTeam, locationType, activeFilter],
  )

  const getLocationDisplayName = useCallback((type: string) => {
    switch (type) {
      case "home":
        return "Home Games"
      case "away":
        return "Away Games"
      case "neutral":
        return "Neutral Games"
      default:
        return ""
    }
  }, [])

  const getGameTypeDisplayName = useCallback((type: string) => {
    switch (type) {
      case "live":
        return "Live Games"
      case "upcoming":
        return "Upcoming Games"
      case "completed":
        return "Past Games"
      default:
        return ""
    }
  }, [])

  const FilterTab = ({ filter, label, icon }: { filter: string; label: string; icon: string }) => {
    const isActive = activeFilter === filter
    return (
      <Pressable
        style={[styles.filterTab, isActive && styles.activeFilterTab]}
        onPress={() => setActiveFilter(filter as any)}
      >
        <Feather name={icon as any} size={16} color={isActive ? colors.primary : colors.textSecondary} />
        <Text style={[styles.filterTabText, isActive && styles.activeFilterTabText]}>{label}</Text>
      </Pressable>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Image source={require("@/IMAGES/crowd.jpg")} style={styles.backgroundImage} />

      {/* Header with Title and Filter Button */}
      <View style={styles.header}>
        <TouchableOpacity onPress={router.back} activeOpacity={0.7}>
          <Feather name="chevron-left" size={24} color="BLACK" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>All Games</Text>
        <Pressable onPress={() => setFilterModalVisible(true)} style={styles.filterButton}>
          <Feather name="filter" size={20} color={colors.primary} />
        </Pressable>
      </View>

      {/* Active Filters Display - Always visible when filters are applied */}
      {hasActiveFilters && (
        <View style={styles.activeFiltersSection}>
          <View style={styles.activeFiltersContainer}>
            {activeFilter !== "all" && (
              <View style={styles.activeFilterChip}>
                <Text style={styles.activeFilterText}>{getGameTypeDisplayName(activeFilter)}</Text>
                <Pressable onPress={clearGameTypeFilter} style={styles.filterRemoveButton}>
                  <Feather name="x" size={14} color={colors.primary} />
                </Pressable>
              </View>
            )}
            {selectedTeam && (
              <View style={styles.activeFilterChip}>
                <Text style={styles.activeFilterText}>{selectedTeam.name}</Text>
                <Pressable onPress={clearTeamFilter} style={styles.filterRemoveButton}>
                  <Feather name="x" size={14} color={colors.primary} />
                </Pressable>
              </View>
            )}
            {locationType && (
              <View style={styles.activeFilterChip}>
                <Text style={styles.activeFilterText}>{getLocationDisplayName(locationType)}</Text>
                <Pressable onPress={clearLocationFilter} style={styles.filterRemoveButton}>
                  <Feather name="x" size={14} color={colors.primary} />
                </Pressable>
              </View>
            )}
          </View>
          <Pressable onPress={clearAllFilters} style={styles.clearAllButton}>
            <Feather name="x" size={14} color={colors.primary} />
          </Pressable>
        </View>
      )}

      {loading ? (
        <View style={styles.loadingContainer}>
          <Feather name="loader" size={24} color={colors.primary} />
          <Text style={styles.loadingText}>Loading games...</Text>
        </View>
      ) : filteredGames.length > 0 ? (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.gamesContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Live Games - Time Based Logic */}
          {activeFilter === "all" && liveGames.length > 0 && (
            <View style={styles.gameGroup}>
              <View style={styles.gameGroupHeader}>
                <View style={styles.liveIndicator}>
                  <View style={styles.liveDot} />
                  <Text style={styles.gameGroupTitle}>Live Now ({liveGames.length})</Text>
                </View>
              </View>
              {sortGamesByPriority(liveGames).map((game) => (
                <GameCard
                  key={`live-${game.id}`}
                  game={game}
                  onPress={handleGamePress}
                  onNotifyPress={handleNotifyPress}
                />
              ))}
            </View>
          )}

          {/* Upcoming Games - Date Based (Today + Future) */}
          {activeFilter === "all" && upcomingGames.length > 0 && (
            <View style={styles.gameGroup}>
              <View style={styles.gameGroupHeader}>
                <Feather name="clock" size={18} color={colors.primary} />
                <Text style={styles.gameGroupTitle}>Upcoming ({upcomingGames.length})</Text>
              </View>
              {sortGamesByPriority(upcomingGames).map((game) => (
                <GameCard
                  key={`upcoming-${game.id}`}
                  game={game}
                  onPress={handleGamePress}
                  onNotifyPress={handleNotifyPress}
                />
              ))}
            </View>
          )}

          {/* Past Games - Date Based */}
          {activeFilter === "all" && pastGames.length > 0 && (
            <View style={styles.gameGroup}>
              <View style={styles.gameGroupHeader}>
                <Feather name="check-circle" size={18} color={colors.primary} />
                <Text style={styles.gameGroupTitle}>Recent ({pastGames.length})</Text>
              </View>
              {sortGamesByPriority(pastGames).map((game) => (
                <GameCard
                  key={`past-${game.id}`}
                  game={game}
                  onPress={handleGamePress}
                  onNotifyPress={handleNotifyPress}
                />
              ))}
            </View>
          )}

          {/* Filtered Games - When a specific filter is active */}
          {activeFilter !== "all" &&
            filteredGames.map((game) => (
              <GameCard
                key={`filtered-${activeFilter}-${game.id}`}
                game={game}
                onPress={handleGamePress}
                onNotifyPress={handleNotifyPress}
              />
            ))}
        </ScrollView>
      ) : (
        <Animated.View entering={FadeIn} style={styles.emptyContainer}>
          <Feather name="search" size={48} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>No Games Found</Text>
          <Text style={styles.emptyText}>Try adjusting your filters or check back later.</Text>
        </Animated.View>
      )}

      {/* Filter Modal */}
      <Modal visible={filterModalVisible} transparent={true} animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter Games</Text>
              <Pressable onPress={() => setFilterModalVisible(false)} style={styles.modalCloseButton}>
                <Feather name="x" size={24} color={colors.text} />
              </Pressable>
            </View>

            {/* Filter Content */}
            <View style={styles.modalBody}>
              {/* Game Type Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Game Type</Text>
                <View style={styles.statusFilterGroup}>
                  <FilterTab filter="all" label="All" icon="grid" />
                  <FilterTab filter="live" label="Live" icon="radio" />
                  <FilterTab filter="upcoming" label="Upcoming" icon="clock" />
                  <FilterTab filter="completed" label="Past" icon="check-circle" />
                </View>
              </View>

              {/* Team Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Team</Text>
                <EnhancedDropdown
                  options={teamOptions}
                  selectedValue={selectedTeam?.id || null}
                  onSelect={handleTeamSelect}
                  placeholder="Select team"
                />
              </View>

              {/* Location Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Location</Text>
                <EnhancedDropdown
                  options={locationOptions}
                  selectedValue={locationType}
                  onSelect={handleLocationTypeChange}
                  placeholder="Game location"
                />
              </View>
            </View>

            {/* Modal Footer */}
            <View style={styles.modalFooter}>
              <Pressable onPress={clearAllFilters} style={styles.clearButton}>
                <Text style={styles.clearButtonText}>Clear All</Text>
              </Pressable>
              <Pressable onPress={() => setFilterModalVisible(false)} style={styles.applyButton}>
                <Text style={styles.applyButtonText}>Apply Filters</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.text,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary + "1A",
    alignItems: "center",
    justifyContent: "center",
  },
  activeFiltersSection: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  activeFiltersContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    flex: 1,
  },
  activeFilterChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: `${colors.primary}1A`,
    paddingVertical: 6,
    paddingLeft: 12,
    paddingRight: 8,
    borderRadius: 20,
    gap: 8,
  },
  activeFilterText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "500",
  },
  filterRemoveButton: {
    padding: 2,
  },
  clearAllButton: {
    paddingHorizontal: 6,
    paddingVertical: 6,
    backgroundColor: colors.textSecondary + "1A",
    borderRadius: 16,
  },
  scrollView: {
    flex: 1,
  },
  gamesContent: {
    paddingBottom: 20,
  },
  gameGroup: {
    marginBottom: 24,
  },
  gameGroupHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  gameGroupTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    marginLeft: 8,
  },
  liveIndicator: {
    flexDirection: "row",
    alignItems: "center",
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#EF4444",
    marginRight: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
  // Modal Styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalBody: {
    padding: 20,
    gap: 24,
  },
  filterSection: {
    gap: 12,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
  },
  statusFilterGroup: {
    flexDirection: "row",
    backgroundColor: colors.background + "E6",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  filterTab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    gap: 6,
  },
  activeFilterTab: {
    backgroundColor: colors.primary + "1A",
    borderRadius: 12,
    padding: 5,
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.textSecondary,
  },
  activeFilterTabText: {
    color: colors.primary,
    fontWeight: "700",
  },
  modalFooter: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    paddingBottom: 30,
    borderTopColor: colors.border,
    gap: 12,
  },
  clearButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: colors.textSecondary + "1A",
    borderRadius: 22,
    alignItems: "center",
  },
  clearButtonText: {
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: "600",
  },
  applyButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: colors.primary,
    borderRadius: 22,
    alignItems: "center",
  },
  applyButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
})
