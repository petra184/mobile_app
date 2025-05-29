"use client"

import { useState, useEffect } from "react"
import { View, StyleSheet, ScrollView, Pressable, Platform, Text } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useRouter } from "expo-router"
import { colors } from "@/constants/colors"
import PointsCard from "@/components/rewards/main_card"
import { useUserStore } from "@/hooks/userStore"
import { useNotifications } from "@/context/notification-context"
import { TeamSelector } from "@/components/teams/TeamSelector"
import { GameCard } from "@/components/games/gameCard"
import { GameFilter, type GameFilterOptions } from "@/components/games/GameFilter"
import Feather from "@expo/vector-icons/Feather"
import type { Team } from "@/app/actions/teams"
import { getUpcomingGames, getPastGames, getLiveGames } from "@/app/actions/games"
import type { Game } from "@/types/game"

export default function HomeScreen() {
  const router = useRouter()
  const { points, preferences } = useUserStore()
  const { showSuccess, showInfo } = useNotifications()
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
  const [allGames, setAllGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)
  const [gameFilters, setGameFilters] = useState<GameFilterOptions>({
    sport: undefined,
    gender: undefined,
    status: "all",
  })

  // Fetch all games on component mount
  useEffect(() => {
    fetchAllGames()
  }, [])

  // Fetch all games (past, live, and upcoming)
  const fetchAllGames = async () => {
    try {
      setLoading(true)

      // Fetch all types of games in parallel
      const [upcoming, past, live] = await Promise.all([
        getUpcomingGames(20), // Get more upcoming games
        getPastGames(10), // Get recent past games
        getLiveGames(5), // Get live games
      ])

      // Combine all games and sort by date
      const combinedGames = [...live, ...upcoming, ...past]

      // Sort games by date (most recent/upcoming first)
      const sortedGames = combinedGames.sort((a, b) => {
        const dateA = new Date(a.date)
        const dateB = new Date(b.date)
        const now = new Date()

        // Prioritize live games first
        if (a.status === "live" && b.status !== "live") return -1
        if (b.status === "live" && a.status !== "live") return 1

        // Then upcoming games
        if (dateA >= now && dateB >= now) {
          return dateA.getTime() - dateB.getTime()
        }

        // Then past games (most recent first)
        if (dateA < now && dateB < now) {
          return dateB.getTime() - dateA.getTime()
        }

        // Mixed: upcoming before past
        if (dateA >= now && dateB < now) return -1
        if (dateB >= now && dateA < now) return 1

        return dateA.getTime() - dateB.getTime()
      })

      setAllGames(sortedGames)
    } catch (error) {
      console.error("Error fetching games:", error)
      showInfo("Error", "Failed to load games. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleTeamSelect = (team: Team) => {
    setSelectedTeam(team)
    showSuccess("Team Selected", `You selected ${team.name}`)
  }

  const handleTeamPress = (team: Team) => {
    showInfo("Team Details", `Viewing ${team.name} details`)
    router.push(`..`)
  }

  const handleGamePress = (game: Game) => {
    router.push({
        pathname: "../all_cards/game_details",
        params: { id: game.id },
      })
  }

  const handleNotifyPress = (game: Game) => {
    showSuccess("Notification Set", `You'll be notified about ${game.homeTeam.name} vs ${game.awayTeam.name}`)
  }

  const handleViewAllTeams = () => {
    router.push("..")
  }

  const handleViewAllGames = () => {
    router.push("../all_cards/all_games")
  }

  const handleFilterChange = (filters: GameFilterOptions) => {
    setGameFilters(filters)
    showInfo("Filters Applied", "Games filtered successfully")
  }

  // Apply filters to games
  const filteredGames = allGames.filter((game) => {
    // Sport filter
    if (gameFilters.sport && game.sport?.name !== gameFilters.sport.toLowerCase()) {
      return false
    }

    // Gender filter
    if (gameFilters.gender) {
      const teamGender = game.homeTeam.gender?.toLowerCase()
      if (gameFilters.gender === "men" && teamGender !== "men") return false
      if (gameFilters.gender === "women" && teamGender !== "women") return false
    }

    // Status filter
    if (gameFilters.status && gameFilters.status !== "all") {
      if (gameFilters.status === "upcoming" && game.status !== "scheduled") return false
      if (gameFilters.status === "past" && game.status !== "completed") return false
      if (gameFilters.status === "live" && game.status !== "live") return false
    }

    return true
  })

  // Group filtered games by status for better organization
  const liveGames = filteredGames.filter((game) => game.status === "live")
  const upcomingGames = filteredGames.filter((game) => game.status === "scheduled")
  const completedGames = filteredGames.filter((game) => game.status === "completed")
  const otherGames = filteredGames.filter((game) => !["live", "scheduled", "completed"].includes(game.status))

  return (
    <SafeAreaView style={styles.container} edges={["left"]}>
      <ScrollView style={styles.scrollC} showsVerticalScrollIndicator={false}>
        {/* Points Card with Greeting */}
        <Pressable onPress={() => router.push("../points/page")}>
          <PointsCard points={points} />
        </Pressable>

        {/* Teams Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <View style={[styles.sectionTitleAccent, { backgroundColor: colors.accent }]} />
              <View>
                <Text style={styles.sectionTitle}>Discover Teams</Text>
                <Text style={styles.sectionSubtitle}>Get to know our teams!</Text>
              </View>
            </View>
            <Pressable style={styles.viewAllButton} onPress={handleViewAllTeams}>
              <Text style={styles.viewAllText}>View All</Text>
            </Pressable>
          </View>

          <TeamSelector
            onSelectTeam={handleTeamSelect}
            onTeamPress={handleTeamPress}
            showFavorites={true}
            horizontal={true}
            showSearch={false}
            showFilters={false}
          />
        </View>

        {/* All Games Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <View style={[styles.sectionTitleAccent, { backgroundColor: colors.primary }]} />
              <View>
                <Text style={styles.sectionTitle}>View Games</Text>
                <Text style={styles.sectionSubtitle}>{loading ? "Loading..." : `${filteredGames.length} games`}</Text>
              </View>
            </View>
            <View style={styles.headerActions}>
              <GameFilter onFilterChange={handleFilterChange} currentFilters={gameFilters} />
              <Pressable style={styles.viewAllButton} onPress={handleViewAllGames}>
                <Text style={styles.viewAllText}>View All</Text>
              </Pressable>
            </View>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <Feather name="loader" size={24} color={colors.primary} />
              <Text style={styles.loadingText}>Loading games...</Text>
            </View>
          ) : filteredGames.length > 0 ? (
            <View>
              {/* Live Games */}
              {liveGames.length > 0 && (
                <View style={styles.gameGroup}>
                  <View style={styles.gameGroupHeader}>
                    <View style={styles.liveIndicator}>
                      <View style={styles.liveDot} />
                      <Text style={styles.gameGroupTitle}>Live Now ({liveGames.length})</Text>
                    </View>
                  </View>
                  {liveGames.map((game) => (
                    <GameCard key={game.id} game={game} onPress={handleGamePress} onNotifyPress={handleNotifyPress} />
                  ))}
                </View>
              )}

              {/* Upcoming Games */}
              {upcomingGames.length > 0 && (
                <View style={styles.gameGroup}>
                  <View style={styles.gameGroupHeader}>
                    <Feather name="calendar" size={16} color={colors.primary} />
                    <Text style={styles.gameGroupTitle}>Upcoming ({upcomingGames.length})</Text>
                  </View>
                  {upcomingGames.map((game) => (
                    <GameCard key={game.id} game={game} onPress={handleGamePress} onNotifyPress={handleNotifyPress} />
                  ))}
                </View>
              )}

              {/* Completed Games */}
              {completedGames.length > 0 && (
                <View style={styles.gameGroup}>
                  {completedGames.map((game) => (
                    <GameCard key={game.id} game={game} onPress={handleGamePress} onNotifyPress={handleNotifyPress} />
                  ))}
                </View>
              )}

              {/* Other Games (postponed, canceled, etc.) */}
              {otherGames.length > 0 && (
                <View style={styles.gameGroup}>
                  <View style={styles.gameGroupHeader}>
                    <Feather name="alert-circle" size={16} color="#F59E0B" />
                    <Text style={styles.gameGroupTitle}>Other ({otherGames.length})</Text>
                  </View>
                  {otherGames.map((game) => (
                    <GameCard key={game.id} game={game} onPress={handleGamePress} onNotifyPress={handleNotifyPress} />
                  ))}
                </View>
              )}
            </View>
          ) : (
            <View style={styles.noGamesContainer}>
              <Feather name="search" size={48} color="#D1D5DB" />
              <Text style={styles.noGamesTitle}>No games found</Text>
              <Text style={styles.noGamesText}>Try adjusting your filters or check back later</Text>
              <Pressable style={styles.retryButton} onPress={() => setGameFilters({ status: "all" })}>
                <Text style={styles.retryButtonText}>Clear Filters</Text>
              </Pressable>
            </View>
          )}
        </View>

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollC: {
    ...Platform.select({
      ios: {
        marginTop: 100,
      },
      android: {
        marginTop: 115,
      },
    }),
  },
  section: {
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  sectionTitleAccent: {
    width: 4,
    height: 44,
    backgroundColor: colors.primary,
    borderRadius: 2,
    marginRight: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  viewAllButton: {
    backgroundColor: "rgba(59, 130, 246, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary,
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 12,
  },
  gameGroup: {
    marginBottom: 20,
  },
  gameGroupHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  gameGroupTitle: {
    fontSize: 16,
    fontWeight: "600",
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
  noGamesContainer: {
    alignItems: "center",
    padding: 40,
    marginHorizontal: 20,
    backgroundColor: "white",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  noGamesTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#374151",
    marginTop: 16,
    marginBottom: 8,
  },
  noGamesText: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 20,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 14,
  },
  bottomSpacing: {
    height: 40,
  },
})
