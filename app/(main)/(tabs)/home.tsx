"use client"
import { useState, useEffect, useCallback } from "react"
import { View, StyleSheet, ScrollView, Pressable, Platform, Text, RefreshControl } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useRouter } from "expo-router"
import { colors } from "@/constants/colors"
import { PointsStatusCard } from "@/components/rewards/ProgressPoints"
import { useUserStore } from "@/hooks/userStore"
import { useNotifications } from "@/context/notification-context"
import TeamSelector from "@/components/teams/SwipingCard"
import { GameCard } from "@/components/games/new_game_card"
import Feather from "@expo/vector-icons/Feather"
import type { Team, Game, UserStatusWithLevel, GameFilterOptions } from "@/types/updated_types"
import { getUpcomingGames, getPastGames, getLiveGames, getGamesCount } from "@/app/actions/games"
import { fetchUserStatus } from "@/app/actions/points"
import Animated, { useAnimatedStyle, withTiming, useSharedValue, withSpring } from "react-native-reanimated"
import { sortGamesByPriority } from "@/utils/sortGame"
import { StatusBar } from "expo-status-bar"
import { LinearGradient } from "expo-linear-gradient"

export default function HomeScreen() {
  const router = useRouter()
  const { points, preferences, getUserFirstName, userId } = useUserStore()
  const { showSuccess, showInfo } = useNotifications()

  const [game_count, setGamesCount] = useState<number>(0)
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
  const [allGames, setAllGames] = useState<Game[]>([])
  const [userStatus, setUserStatus] = useState<UserStatusWithLevel | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [gameFilters, setGameFilters] = useState<GameFilterOptions>({
    status: "all",
    sport: undefined,
    location: undefined,
    teamId: undefined,
  })

  // Helper function to parse 12-hour time to 24-hour format (same as game details)
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

  // Calculate game start and end times (same as game details)
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

  // Function to determine if a game is actually live
  const isGameLive = useCallback(
    (game: Game): boolean => {
      // Skip completed, postponed, or canceled games
      if (game.status === "completed" || game.status === "postponed" || game.status === "canceled") {
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

  // Consolidated data fetching function
  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const games_count = await getGamesCount()
      setGamesCount(games_count)

      const [upcoming, past, live] = await Promise.all([getUpcomingGames(20), getPastGames(10), getLiveGames(5)])

      const combinedGames = [...live, ...upcoming, ...past]
      const gameMap = new Map<string, Game>()
      combinedGames.forEach((game) => gameMap.set(game.id, game))
      const uniqueGames = Array.from(gameMap.values())

      const sortedGames = sortGamesByPriority(uniqueGames)
      setAllGames(sortedGames)

      if (userId) {
        const statusData = await fetchUserStatus(userId)
        setUserStatus(statusData)
      }
    } catch (error) {
      console.error("Error fetching data:", error)
      showInfo("Error", "Failed to load data. Please try again.")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [userId, showInfo, isGameLive])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleTeamSelect = (team: Team) => {
    setSelectedTeam(team)
    showSuccess("Team Selected", `You selected ${team.name}`)
  }

  const handleTeamPress = (team: Team) => {
    router.push({
      pathname: "../teams",
      params: { id: team.id },
    })
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
    router.push("../all_cards/all_teams")
  }

  const handleViewAllGames = () => {
    router.push("../all_cards/all_games")
  }

  const getTimeBasedGreeting = () => {
    const currentHour = new Date().getHours()
    if (currentHour >= 5 && currentHour < 12) {
      return "Good Morning"
    } else if (currentHour >= 12 && currentHour < 17) {
      return "Good Afternoon"
    } else if (currentHour >= 17 && currentHour < 22) {
      return "Good Evening"
    } else {
      return "Good Night"
    }
  }

  const getPersonalizedMessage = () => {
    const currentHour = new Date().getHours()
    if (currentHour >= 5 && currentHour < 12) {
      return "Ready to start your day with some exciting games?"
    } else if (currentHour >= 12 && currentHour < 17) {
      return "Hope you're having a great day! Check out today's updates."
    } else if (currentHour >= 17 && currentHour < 22) {
      return "Perfect time to catch up on your favorite teams!"
    }
    return "Late night sports fan? We've got you covered."
  }

  const getTimeIcon = () => {
    const currentHour = new Date().getHours()
    if (currentHour >= 5 && currentHour < 12) {
      return "sunrise"
    } else if (currentHour >= 12 && currentHour < 17) {
      return "sun"
    } else if (currentHour >= 17 && currentHour < 22) {
      return "sunset"
    }
    return "moon"
  }

  const filteredGames = allGames.filter((game) => {
    if (gameFilters.teamId && game.homeTeam.id !== gameFilters.teamId) {
      return false
    }
    if (gameFilters.sport && game.sport?.name.toLowerCase() !== gameFilters.sport.toLowerCase()) {
      return false
    }
    if (gameFilters.location) {
      const location = game.location.toLowerCase()
      if (gameFilters.location === "home" && !location.includes("home")) return false
      if (gameFilters.location === "away" && !(location.includes("away") || location.includes("@"))) return false
      if (gameFilters.location === "neutral" && !location.includes("neutral")) return false
    }
    if (gameFilters.status && gameFilters.status !== "all") {
      if (gameFilters.status === "upcoming" && game.status !== "scheduled") return false
      if (gameFilters.status === "past" && game.status !== "completed") return false
      if (gameFilters.status === "live" && !isGameLive(game)) return false // Use time-based logic
    }
    return true
  })

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Updated categorization function with proper sorting for past games
  const categorizeGamesByDate = (games: Game[]) => {
    const live: Game[] = []
    const upcoming: Game[] = []
    const past: Game[] = []

    games.forEach((game) => {
      const gameDate = new Date(game.date)
      gameDate.setHours(0, 0, 0, 0)

      // Use time-based logic to determine if game is live
      if (isGameLive(game)) {
        live.push(game)
      } else if (gameDate < today || game.status === "completed") {
        past.push(game)
      } else {
        upcoming.push(game)
      }
    })

    // Sort past games by most recent first (descending order)
    past.sort((a, b) => {
      const dateA = new Date(a.date)
      const dateB = new Date(b.date)

      // If dates are the same, sort by time if available
      if (dateA.getTime() === dateB.getTime()) {
        if (a.time && b.time) {
          const timeA = parse12HourTime(a.time)
          const timeB = parse12HourTime(b.time)
          return timeB.localeCompare(timeA) // Most recent time first
        }
      }

      return dateB.getTime() - dateA.getTime() // Most recent date first
    })

    // Sort upcoming games by soonest first (ascending order)
    upcoming.sort((a, b) => {
      const dateA = new Date(a.date)
      const dateB = new Date(b.date)

      // If dates are the same, sort by time if available
      if (dateA.getTime() === dateB.getTime()) {
        if (a.time && b.time) {
          const timeA = parse12HourTime(a.time)
          const timeB = parse12HourTime(b.time)
          return timeA.localeCompare(timeB) // Earliest time first
        }
      }

      return dateA.getTime() - dateB.getTime() // Earliest date first
    })

    // Sort live games by start time (most recently started first)
    live.sort((a, b) => {
      try {
        const { gameStartTime: startA } = getGameTimings(a)
        const { gameStartTime: startB } = getGameTimings(b)
        return startB.getTime() - startA.getTime() // Most recently started first
      } catch (error) {
        console.error("Error sorting live games:", error)
        return 0
      }
    })

    return { live, upcoming, past }
  }

  const { live: liveGames, upcoming: upcomingGames, past: pastGames } = categorizeGamesByDate(filteredGames)

  // Get live games status message
  const getLiveGamesMessage = () => {
    if (loading) return "Checking for live games..."
    if (liveGames.length === 0) {
      return "No live games right now"
    } else if (liveGames.length === 1) {
      return "1 game is live right now!"
    } else {
      return `${liveGames.length} games are live right now!`
    }
  }

  const scale = useSharedValue(1)
  const opacity = useSharedValue(1)

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }))

  const handlePressIn = () => {
    scale.value = withSpring(0.96, { damping: 15 })
    opacity.value = withTiming(0.8, { duration: 100 })
  }

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15 })
    opacity.value = withTiming(1, { duration: 150 })
  }

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    loadData()
  }, [loadData])

  return (
    <SafeAreaView style={styles.container} edges={["left"]}>
      <StatusBar style="dark" />
      <ScrollView
        style={styles.scrollC}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            colors={[colors.primary]} 
          />
        }
      >
        {/* Enhanced Welcome Card */}
        <View style={styles.welcomeCard}>
          <View style={styles.welcomeHeader}>
            <View style={styles.welcomeContent}>
              <Text style={styles.greetingText}>{getTimeBasedGreeting()},</Text>
              <Text style={styles.nameText}>{getUserFirstName()}</Text>
              <Text style={styles.personalizedMessage}>{getPersonalizedMessage()}</Text>

              {/* Live Games Status */}
              {liveGames.length > 0 && (
                <View style={styles.liveStatusContainer}>
                  <LinearGradient
                    colors={["#EF4444", "#DC2626"]}
                    style={styles.liveStatusBadge}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <View style={styles.livePulse} />
                    <Text style={styles.liveStatusText}>{getLiveGamesMessage()}</Text>
                  </LinearGradient>
                </View>
              )}
            </View>
            <View style={styles.timeIcon}>
              <Feather name={getTimeIcon()} size={24} color={colors.primary} />
            </View>
          </View>
        </View>

        {/* Points Card with Greeting */}
        <Animated.View style={animatedStyle}>
          <Pressable
            onPress={() => router.push("../all_cards/points")}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            android_ripple={{ color: "rgba(0, 0, 0, 0.1)", borderless: false }}
          >
            <PointsStatusCard
              userFirstName={getUserFirstName()}
              points={points}
              userStatus={userStatus}
              name={false}
              animationDelay={200}
            />
          </Pressable>
        </Animated.View>

        {/* Teams Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <View style={[styles.sectionTitleAccent, { backgroundColor: colors.accent }]} />
              <View>
                <Text style={styles.sectionTitle}>Teams</Text>
                <Text style={styles.sectionSubtitle}>Get to know our teams!</Text>
              </View>
            </View>
            <Pressable style={styles.viewAllButton} onPress={handleViewAllTeams}>
              <Text style={styles.viewAllText}>View All</Text>
            </Pressable>
          </View>
            <TeamSelector onSelectTeam={handleTeamSelect} onTeamPress={handleTeamPress} showFavorites={true} />
        </View>

        {/* All Games Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <View style={[styles.sectionTitleAccent, { backgroundColor: colors.primary }]} />
              <View>
                <Text style={styles.sectionTitle}>Games</Text>
                <Text style={styles.sectionSubtitle}>
                  {loading ? "Loading..." : `Showing ${filteredGames.length}/${game_count} games`}
                </Text>
              </View>
            </View>
            <View style={styles.headerActions}>
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
              {/* Live Games - Time Based Logic */}
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
                    <Feather name="clock" size={18} color={colors.primary} />
                    <Text style={styles.gameGroupTitle}>Upcoming ({upcomingGames.length})</Text>
                  </View>
                  {upcomingGames.map((game) => (
                    <GameCard key={game.id} game={game} onPress={handleGamePress} onNotifyPress={handleNotifyPress} />
                  ))}
                </View>
              )}

              {/* Past Games - Now sorted by most recent first */}
              {pastGames.length > 0 && (
                <View style={styles.gameGroup}>
                  <View style={styles.gameGroupHeader}>
                    <Feather name="check-circle" size={18} color={colors.primary} />
                    <Text style={styles.gameGroupTitle}>Recent ({pastGames.length})</Text>
                  </View>
                  {pastGames.map((game) => (
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
    marginTop: 34,
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
    borderRadius: 18,
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
    paddingHorizontal: 5,
  },
  gameGroupHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  gameGroupTitle: {
    fontSize: 20,
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
  welcomeCard: {
    marginHorizontal: 20,
    borderRadius: 20,
  },
  welcomeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingTop: 20,
  },
  welcomeContent: {
    flex: 1,
  },
  greetingText: {
    fontSize: 28,
    fontWeight: "800",
    color: "#1F2937",
    marginBottom: 4,
  },
  nameText: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.primary,
    marginBottom: 8,
  },
  personalizedMessage: {
    fontSize: 16,
    color: "#6B7280",
    lineHeight: 22,
    marginBottom: 16,
  },
  timeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(59, 130, 246, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  // New Live Status Styles
  liveStatusContainer: {
    marginTop: 4,
    marginBottom: 10,
  },
  liveStatusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: "flex-start",
    shadowColor: "#EF4444",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  livePulse: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FFFFFF",
    marginRight: 8,
    opacity: 0.9,
  },
  liveStatusText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  noLiveStatusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    alignSelf: "flex-start",
  },
  noLiveStatusText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 6,
  },
  connectionStatus: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  connectionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  connectionText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: "500",
  },
})
