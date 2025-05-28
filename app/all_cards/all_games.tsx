"use client"

import { useState, useEffect } from "react"
import { View, Text, StyleSheet, Image, Pressable, ActivityIndicator, ScrollView } from "react-native"
import { useRouter } from "expo-router"
import { SafeAreaView } from "react-native-safe-area-context"
import { colors } from "@/constants/colors"
import { TeamSelector } from "@/components/teams/TeamSelector"
import { GameCard } from "@/components/games/gameCard"
import { getUpcomingGames, getPastGames, getLiveGames } from "@/app/actions/games"
import { useNotifications } from "@/context/notification-context"
import type { Team } from "@/app/actions/teams"
import type { Game } from "@/types/game"
import { LinearGradient } from "expo-linear-gradient"
import Feather from "@expo/vector-icons/Feather"
import Animated, { FadeIn, SlideInDown } from "react-native-reanimated"

export default function AllGamesScreen() {
  const router = useRouter()
  const { showSuccess, showInfo } = useNotifications()
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
  const [allGames, setAllGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState<"all" | "upcoming" | "live" | "completed">("all")

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
        getUpcomingGames(50), // Get more upcoming games
        getPastGames(30), // Get recent past games
        getLiveGames(10), // Get live games
      ])

      // Combine all games
      const combinedGames = [...live, ...upcoming, ...past]
      setAllGames(combinedGames)
    } catch (error) {
      console.error("Error fetching games:", error)
      showInfo("Error", "Failed to load games. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleTeamSelect = (team: Team) => {
    setSelectedTeam(team === selectedTeam ? null : team)
    if (team !== selectedTeam) {
      showSuccess("Team Selected", `Showing games for ${team.name}`)
    }
  }

  const handleGamePress = (game: Game) => {
    router.push({
      pathname: "../game-details",
      params: { id: game.id },
    })
  }

  const handleNotifyPress = (game: Game) => {
    showSuccess("Notification Set", `You'll be notified about ${game.homeTeam.name} vs ${game.awayTeam.name}`)
  }

  // Filter games based on selected team and active filter
  const filteredGames = allGames.filter((game) => {
    // Team filter
    const teamMatches = selectedTeam
      ? game.homeTeam.id === selectedTeam.id || game.awayTeam.id === selectedTeam.id
      : true

    // Status filter
    let statusMatches = true
    if (activeFilter === "upcoming") {
      statusMatches = game.status === "scheduled"
    } else if (activeFilter === "live") {
      statusMatches = game.status === "live"
    } else if (activeFilter === "completed") {
      statusMatches = game.status === "completed"
    }

    return teamMatches && statusMatches
  })

  // Sort games by date (live first, then upcoming, then past)
  const sortedGames = [...filteredGames].sort((a, b) => {
    // Live games first
    if (a.status === "live" && b.status !== "live") return -1
    if (b.status === "live" && a.status !== "live") return 1

    const dateA = new Date(a.date)
    const dateB = new Date(b.date)

    // Then upcoming games (soonest first)
    if (a.status === "scheduled" && b.status === "scheduled") {
      return dateA.getTime() - dateB.getTime()
    }

    // Then completed games (most recent first)
    if (a.status === "completed" && b.status === "completed") {
      return dateB.getTime() - dateA.getTime()
    }

    // Mixed status - upcoming before completed
    if (a.status === "scheduled" && b.status === "completed") return -1
    if (b.status === "scheduled" && a.status === "completed") return 1

    return dateA.getTime() - dateB.getTime()
  })

  // Group games by status
  const liveGames = sortedGames.filter((game) => game.status === "live")
  const upcomingGames = sortedGames.filter((game) => game.status === "scheduled")
  const completedGames = sortedGames.filter((game) => game.status === "completed")

  const renderFilterButton = (
    filter: "all" | "upcoming" | "live" | "completed",
    label: string,
    icon: string,
    count: number,
  ) => {
    const isActive = activeFilter === filter
    return (
      <Pressable
        style={[styles.filterButton, isActive && styles.activeFilterButton]}
        onPress={() => setActiveFilter(filter)}
      >
        <View style={styles.filterButtonContent}>
          <Feather name={icon as any} size={16} color={isActive ? "white" : colors.primary} />
          <Text style={[styles.filterButtonText, isActive && styles.activeFilterButtonText]}>{label}</Text>
          <View style={[styles.filterBadge, isActive && styles.activeFilterBadge]}>
            <Text style={[styles.filterBadgeText, isActive && styles.activeFilterBadgeText]}>{count}</Text>
          </View>
        </View>
      </Pressable>
    )
  }

  const renderGameSection = (title: string, games: Game[], icon: string, color: string) => {
    if (games.length === 0) return null

    return (
      <Animated.View entering={FadeIn.duration(600)} style={styles.gameSection}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleContainer}>
            <View style={[styles.sectionIcon, { backgroundColor: `${color}20` }]}>
              <Feather name={icon as any} size={18} color={color} />
            </View>
            <View>
              <Text style={styles.sectionTitle}>{title}</Text>
              <Text style={styles.sectionSubtitle}>
                {games.length} game{games.length !== 1 ? "s" : ""}
              </Text>
            </View>
          </View>
          {title === "Live Now" && (
            <View style={styles.liveIndicator}>
              <View style={styles.livePulse} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
          )}
        </View>
        <View style={styles.gamesContainer}>
          {games.map((game, index) => (
            <Animated.View key={game.id} entering={SlideInDown.duration(400).delay(index * 100)}>
              <GameCard game={game} onPress={handleGamePress} onNotifyPress={handleNotifyPress} />
            </Animated.View>
          ))}
        </View>
      </Animated.View>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={["left"]}>
      <Image source={require("@/IMAGES/crowd.jpg")} style={styles.backgroundImage} />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <LinearGradient colors={["rgba(255,255,255,0.98)", "rgba(255,255,255,0.95)"]} style={styles.header}>


          {/* Team Filter */}
          <View style={styles.teamFilterContainer}>
            <Text style={styles.filterLabel}>Filter by Team</Text>
            <TeamSelector
              onSelectTeam={handleTeamSelect}
              onTeamPress={handleTeamSelect}
              showFavorites={true}
              horizontal={true}
              showSearch={false}
              showFilters={false}
            />
          </View>

          {/* Status Filters */}
          <View style={styles.statusFiltersContainer}>
            <Text style={styles.filterLabel}>Game Status</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statusFilters}>
              {renderFilterButton("all", "All", "calendar", sortedGames.length)}
              {renderFilterButton("live", "Live", "radio", liveGames.length)}
              {renderFilterButton("upcoming", "Upcoming", "clock", upcomingGames.length)}
              {renderFilterButton("completed", "Results", "check-circle", completedGames.length)}
            </ScrollView>
          </View>
        </LinearGradient>

        {/* Content */}
        <View style={styles.content}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Loading games...</Text>
            </View>
          ) : sortedGames.length > 0 ? (
            <View style={styles.gamesContent}>
              {activeFilter === "all" ? (
                <>
                  {renderGameSection("Live Now", liveGames, "radio", "#EF4444")}
                  {renderGameSection("Upcoming Games", upcomingGames, "clock", colors.primary)}
                  {renderGameSection("Recent Results", completedGames, "check-circle", "#10B981")}
                </>
              ) : (
                <>
                  {activeFilter === "live" && renderGameSection("Live Games", liveGames, "radio", "#EF4444")}
                  {activeFilter === "upcoming" &&
                    renderGameSection("Upcoming Games", upcomingGames, "clock", colors.primary)}
                  {activeFilter === "completed" &&
                    renderGameSection("Game Results", completedGames, "check-circle", "#10B981")}
                </>
              )}
            </View>
          ) : (
            <Animated.View entering={FadeIn.duration(600)} style={styles.emptyContainer}>
              <View style={styles.emptyIconContainer}>
                <Feather name="search" size={48} color="#D1D5DB" />
              </View>
              <Text style={styles.emptyTitle}>No games found</Text>
              <Text style={styles.emptyText}>
                {selectedTeam
                  ? `No ${activeFilter !== "all" ? activeFilter : ""} games found for ${selectedTeam.name}`
                  : `No ${activeFilter !== "all" ? activeFilter : ""} games available`}
              </Text>
              <Pressable
                style={styles.resetButton}
                onPress={() => {
                  setSelectedTeam(null)
                  setActiveFilter("all")
                }}
              >
                <Feather name="refresh-ccw" size={16} color="white" />
                <Text style={styles.resetButtonText}>Reset Filters</Text>
              </Pressable>
            </Animated.View>
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
  backgroundImage: {
    position: "absolute",
    bottom:0,
    resizeMode: "cover",
    opacity: 0.03,
    zIndex: 0,
  },
  scrollView: {
    flex: 1,
    zIndex: 1,
  },
  header: {
    paddingTop: 20,
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  titleContainer: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  teamFilterContainer: {
    marginBottom: 24,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 12,
    paddingHorizontal: 20,
    marginLeft: 4,
  },
  statusFiltersContainer: {
  },
  statusFilters: {
    flexDirection: "row",
    paddingHorizontal: 20,
  },
  filterButton: {
    backgroundColor: "rgba(107, 114, 128, 0.08)",
    borderRadius: 16,
    marginRight: 12,
    borderWidth: 1,
    borderColor: "rgba(107, 114, 128, 0.1)",
  },
  activeFilterButton: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
    marginLeft: 8,
    marginRight: 8,
  },
  activeFilterButtonText: {
    color: "white",
  },
  filterBadge: {
    backgroundColor: "rgba(107, 114, 128, 0.15)",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: "center",
  },
  activeFilterBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  filterBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.text,
  },
  activeFilterBadgeText: {
    color: "white",
  },
  content: {
    flex: 1,
    paddingTop: 24,
  },
  gamesContent: {
    paddingHorizontal: 4,
  },
  gameSection: {
    marginBottom: 32,
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
  },
  sectionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 2,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  liveIndicator: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  livePulse: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#EF4444",
    marginRight: 6,
  },
  liveText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#EF4444",
  },
  gamesContainer: {
    gap: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 80,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 16,
    fontWeight: "500",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 40,
    marginHorizontal: 20,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.05)",
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(107, 114, 128, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#374151",
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 24,
  },
  resetButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 14,
    backgroundColor: colors.primary,
    borderRadius: 12,
  },
  resetButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
    marginLeft: 8,
  },
  bottomSpacing: {
    height: 40,
  },
})
