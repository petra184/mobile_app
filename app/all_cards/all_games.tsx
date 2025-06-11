"use client"

import { useState, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  ActivityIndicator,
  ScrollView,
  FlatList,
  Platform,
} from "react-native"
import { useRouter } from "expo-router"
import { SafeAreaView } from "react-native-safe-area-context"
import { colors } from "@/constants/colors"
import { TeamSelector } from "@/components/teams/TeamSelector"
import { GameCard } from "@/components/games/gameCard"
import { getUpcomingGames, getPastGames, getLiveGames } from "@/app/actions/games"
import { useNotifications } from "@/context/notification-context"
import type { Team } from "@/app/actions/teams"
import type { Game } from "@/types/game"
import Feather from "@expo/vector-icons/Feather"
import Animated, { FadeIn, SlideInRight, SlideInUp, SlideOutDown } from "react-native-reanimated"

export default function AllGamesScreen() {
  const router = useRouter()
  const { showSuccess, showInfo } = useNotifications()
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
  const [allGames, setAllGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState<"all" | "upcoming" | "live" | "completed">("all")
  const [showFilters, setShowFilters] = useState(false)

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
        pathname: "./game_details",
        params: { id: game.id },
      })
  }

  const handleNotifyPress = (game: Game) => {
    showSuccess("Notification Set", `You'll be notified about ${game.homeTeam.name} vs ${game.awayTeam.name}`)
  }

  const handleTeamPress = (team: Team) => {
    console.log("Team pressed:", team)
    // Implement your navigation logic here
  }

  const toggleFilters = () => {
    setShowFilters(!showFilters)
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

  const renderGameSection = (section: {
    id: string
    title: string
    games: Game[]
    icon: string
    color: string
  }) => {
    if (section.games.length === 0) return null

    return (
      <Animated.View key={section.id} entering={FadeIn.duration(600)} style={styles.gameSection}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleContainer}>
            <View style={[styles.sectionIcon, { backgroundColor: `${section.color}20` }]}>
              <Feather name={section.icon as any} size={18} color={section.color} />
            </View>
            <View>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <Text style={styles.sectionSubtitle}>
                {section.games.length} game{section.games.length !== 1 ? "s" : ""}
              </Text>
            </View>
          </View>
          {section.title === "Live Now" && (
            <View style={styles.liveIndicator}>
              <View style={styles.livePulse} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
          )}
        </View>
        <View style={styles.gamesContainer}>
          {section.games.map((game, index) => (
            <Animated.View key={game.id} entering={SlideInRight.duration(300).delay(index * 50)}>
              <GameCard game={game} onPress={handleGamePress} onNotifyPress={handleNotifyPress} />
            </Animated.View>
          ))}
        </View>
      </Animated.View>
    )
  }

  const renderFilters = () => {
    if (!showFilters) return null

    return (
      <Animated.View
        entering={SlideInUp.duration(300)}
        exiting={SlideOutDown.duration(300)}
        style={styles.filtersContainer}
      >
        {/* Status Filters - First */}
        <View style={styles.statusFiltersContainer}>
          <Text style={styles.filterLabel2}>Filter by Type</Text>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={[
              { id: "all", label: "All", icon: "calendar", count: sortedGames.length },
              { id: "live", label: "Live", icon: "radio", count: liveGames.length },
              { id: "upcoming", label: "Upcoming", icon: "clock", count: upcomingGames.length },
              { id: "completed", label: "Past", icon: "check-circle", count: completedGames.length },
            ]}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) =>
              renderFilterButton(
                item.id as "all" | "upcoming" | "live" | "completed",
                item.label,
                item.icon,
                item.count,
              )
            }
            contentContainerStyle={styles.statusFilters}
          />
        </View>

        {/* Team Filter - Second with proper spacing */}
        <View style={styles.teamFilterContainer}>
          <Text style={styles.filterLabel}>Filter by Team</Text>
          <View style={styles.teamSelectorWrapper}>
            <TeamSelector
              onSelectTeam={handleTeamSelect}
              onTeamPress={handleTeamPress}
              showFavorites={true}
              horizontal={true}
              showSearch={false}
              showFilters={false}
            />
          </View>
        </View>
      </Animated.View>
    )
  }

  // Prepare sections data
  const sections =
    activeFilter === "all"
      ? [
          { id: "live", title: "Live Now", games: liveGames, icon: "radio", color: "#EF4444" },
          {
            id: "upcoming",
            title: "Upcoming Games",
            games: upcomingGames,
            icon: "clock",
            color: colors.primary,
          },
          {
            id: "completed",
            title: "Recent Games",
            games: completedGames,
            icon: "check-circle",
            color: "#10B981",
          },
        ].filter((section) => section.games.length > 0)
      : [
          {
            id: activeFilter,
            title:
              activeFilter === "live" ? "Live Games" : activeFilter === "upcoming" ? "Upcoming Games" : "Game Results",
            games: activeFilter === "live" ? liveGames : activeFilter === "upcoming" ? upcomingGames : completedGames,
            icon: activeFilter === "live" ? "radio" : activeFilter === "upcoming" ? "clock" : "check-circle",
            color: activeFilter === "live" ? "#EF4444" : activeFilter === "upcoming" ? colors.primary : "#10B981",
          },
        ]

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Image source={require("@/IMAGES/crowd.jpg")} style={styles.backgroundImage} />

      {/* Toggle button at top */}
      <Pressable style={styles.toggleButton} onPress={toggleFilters}>
        <View style={styles.toggleButtonInner}>
          <Feather name={showFilters ? "chevron-down" : "chevron-up"} size={24} color={colors.primary} />
        </View>
      </Pressable>

      {/* Render filters if visible */}
      {renderFilters()}

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading games...</Text>
        </View>
      ) : sortedGames.length > 0 ? (
        <FlatList
          data={sections}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => renderGameSection(item)}
          contentContainerStyle={styles.gamesContent}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={<View style={styles.bottomSpacing} />}
        />
      ) : (
        <ScrollView contentContainerStyle={styles.emptyScrollContent}>
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
          </Animated.View>
        </ScrollView>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    top:0,
    backgroundColor: colors.background,
  },
  backgroundImage: {
    position: "absolute",
    bottom:0,
    resizeMode: "cover",
    opacity: 0.06,
    zIndex: 0,
  },
  filtersContainer: {
    borderBottomWidth: 1,
    paddingBottom: 20,
    ...Platform.select({
        android: {
            top: -15,}
    }),
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  statusFilters: {
    paddingHorizontal: 16,
  },
  statusFiltersContainer: {
    marginBottom: 20, // Add space between sections
  },
  teamFilterContainer: {
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 8, // Increased margin
    paddingLeft: 20,
  },
  filterLabel2: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 10,
    paddingLeft: 20,
  },
  filterButton: {
    backgroundColor: "rgba(107, 114, 128, 0.08)",
    borderRadius: 12,
    marginRight: 10,
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
    paddingHorizontal: 14,
    paddingVertical: 7,
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
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
    minWidth: 20,
    alignItems: "center",
  },
  activeFilterBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  filterBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.text,
  },
  activeFilterBadgeText: {
    color: "white",
  },
  teamSelectorWrapper: {
    marginTop: 0,
    minHeight: 85, // Increased minimum height
    paddingBottom: 8, // Add bottom padding to prevent clipping
  },
  gamesContent: {
    paddingHorizontal: 4,
    paddingTop: 16,
    paddingBottom: 30,
  },
  gameSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  sectionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 1,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  liveIndicator: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
  },
  livePulse: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#EF4444",
    marginRight: 6,
  },
  liveText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#EF4444",
  },
  gamesContainer: {
    gap: 6,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
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
    paddingVertical: 50,
    paddingHorizontal: 30,
    marginHorizontal: 20,
  },
  emptyIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "rgba(107, 114, 128, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#374151",
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 22,
  },
  bottomSpacing: {
    height: 30,
  },
  emptyScrollContent: {
    flexGrow: 1,
    ...Platform.select({
      android: {
        top:0,
      },
    }),
    justifyContent: "center",
  },
  toggleButton: {
    position: "absolute",
    top: 0,
    alignSelf: "center",
    zIndex: 100,
  },
  toggleButtonInner: {
    width: 50,
    height: 30,
    backgroundColor: "white",
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.05)",
  },
})
