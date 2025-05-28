"use client"

import { useState, useEffect } from "react"
import { View, Text, StyleSheet, ScrollView, Pressable, Platform, ActivityIndicator } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useRouter } from "expo-router"
import { colors } from "@/constants/colors"
import { useUserStore } from "@/store/userStore"
import { getUpcomingGames } from "@/mocks/games"
import type { Game } from "@/types"
import PointsCard from "@/components/PointsCard"
import TeamSelector from "@/components/TeamSelector"
import GameCard from "@/components/GameCard"
import { ChevronRight } from "lucide-react-native"
import { getCurrentUser } from "@/lib/actions"
import { getTeams, getTeamsByGender, Team } from "@/app/actions/teams"
import { supabase } from "@/lib/supabase"

type TeamCategory = "all" | "men" | "women"

export default function HomeScreen() {
  const router = useRouter()
  const { points } = useUserStore()
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
  const [teamCategory, setTeamCategory] = useState<TeamCategory>("all")
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Check authentication status
  useEffect(() => {
    checkAuthStatus()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session)
      if (session) {
        fetchTeams() // Refetch teams when user logs in
      } else {
        setTeams([]) // Clear teams when user logs out
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  // Fetch teams when category changes (only if authenticated)
  useEffect(() => {
    if (isAuthenticated) {
      fetchTeams()
    }
  }, [teamCategory, isAuthenticated])

  const checkAuthStatus = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      setIsAuthenticated(!!session)
    } catch (error) {
      console.error("Error checking auth status:", error)
      setIsAuthenticated(false)
    }
  }

  const fetchTeams = async () => {
    if (!isAuthenticated) {
      setError("Please log in to view teams")
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      let fetchedTeams: Team[]
      if (teamCategory === "all") {
        fetchedTeams = await getTeams()
      } else {
        fetchedTeams = await getTeamsByGender(teamCategory)
      }

      setTeams(fetchedTeams)
    } catch (err) {
      console.error("Error fetching teams:", err)
      setError("Failed to load teams. Please check your connection and try again.")
    } finally {
      setLoading(false)
    }
  }

  getCurrentUser()

  const upcomingGames = selectedTeam
    ? getUpcomingGames().filter((game) => game.homeTeam.id === selectedTeam.id || game.awayTeam.id === selectedTeam.id)
    : getUpcomingGames(3)

  const handleTeamSelect = (team: Team) => {
    setSelectedTeam(team)
  }

  const handleTeamPress = (team: Team) => {
    router.push({
      pathname: "../team-details",
      params: { id: team.id },
    })
  }

  const handleGamePress = (game: Game) => {
    router.push({
      pathname: "../game_details",
      params: { id: game.id },
    })
  }

  const navigateToAllGames = () => {
    router.push("../all-games")
  }

  const handleCategoryChange = (category: TeamCategory) => {
    setTeamCategory(category)
    setSelectedTeam(null)
  }

  const navigateToLogin = () => {
    router.push("../auth/login") // Adjust path as needed
  }

  return (
    <SafeAreaView style={styles.container} edges={["left"]}>
      <ScrollView style={styles.scrollC} showsVerticalScrollIndicator={false}>
        {/* Points Card */}
        <Pressable onPress={() => router.push("../points/page")}>
          <PointsCard points={points} />
        </Pressable>

        {/* Team Selector */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Get to know our Teams</Text>

          {!isAuthenticated ? (
            <View style={styles.authPromptContainer}>
              <Text style={styles.authPromptText}>Please log in to view teams</Text>
              <Pressable style={styles.loginButton} onPress={navigateToLogin}>
                <Text style={styles.loginButtonText}>Log In</Text>
              </Pressable>
            </View>
          ) : (
            <>
              {/* Team Category Filter */}
              <View style={styles.categoryFilter}>
                <Pressable
                  style={[styles.categoryButton, teamCategory === "all" && styles.activeCategoryButton]}
                  onPress={() => handleCategoryChange("all")}
                >
                  <Text style={[styles.categoryButtonText, teamCategory === "all" && styles.activeCategoryButtonText]}>
                    All
                  </Text>
                </Pressable>

                <Pressable
                  style={[styles.categoryButton, teamCategory === "women" && styles.activeCategoryButton]}
                  onPress={() => handleCategoryChange("women")}
                >
                  <Text
                    style={[styles.categoryButtonText, teamCategory === "women" && styles.activeCategoryButtonText]}
                  >
                    Women's
                  </Text>
                </Pressable>

                <Pressable
                  style={[styles.categoryButton, teamCategory === "men" && styles.activeCategoryButton]}
                  onPress={() => handleCategoryChange("men")}
                >
                  <Text style={[styles.categoryButtonText, teamCategory === "men" && styles.activeCategoryButtonText]}>
                    Men's
                  </Text>
                </Pressable>
              </View>

              {/* Loading, Error, or Team Selector */}
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text style={styles.loadingText}>Loading teams...</Text>
                </View>
              ) : error ? (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{error}</Text>
                  <Pressable style={styles.retryButton} onPress={fetchTeams}>
                    <Text style={styles.retryButtonText}>Retry</Text>
                  </Pressable>
                </View>
              ) : teams.length > 0 ? (
                <TeamSelector
                  teams={teams}
                  onSelectTeam={handleTeamSelect}
                  onTeamPress={handleTeamPress}
                  showFavorites={true}
                  horizontal={true}
                />
              ) : (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyStateText}>No teams found for this category</Text>
                </View>
              )}
            </>
          )}
        </View>

        {/* Upcoming Games */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upcoming Games</Text>
            <Pressable style={styles.viewAllButton} onPress={navigateToAllGames}>
              <Text style={styles.viewAllText}>View All</Text>
              <ChevronRight size={16} color={colors.primary} />
            </Pressable>
          </View>

          {upcomingGames.length > 0 ? (
            upcomingGames.map((game) => <GameCard key={game.id} game={game} onPress={handleGamePress} />)
          ) : (
            <Text style={styles.emptyStateText}>No upcoming games found</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: 0,
  },
  scrollC: {
    ...Platform.select({
      ios: {
        marginTop: 100,
      },
      android: {
        marginTop: 60,
      },
    }),
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    marginLeft: 16,
    marginBottom: 12,
  },
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
    marginBottom: 12,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary,
  },
  emptyStateText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 20,
    marginBottom: 20,
  },
  categoryFilter: {
    flexDirection: "row",
    marginHorizontal: 10,
    marginBottom: 5,
    borderRadius: 12,
    backgroundColor: colors.card,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 8,
  },
  activeCategoryButton: {
    backgroundColor: "rgba(59, 130, 246, 0.1)",
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.text,
  },
  activeCategoryButtonText: {
    color: colors.primary,
    fontWeight: "600",
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.textSecondary,
  },
  errorContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 14,
    color: colors.error,
    textAlign: "center",
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  authPromptContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  authPromptText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: 16,
  },
  loginButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  loginButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
})
