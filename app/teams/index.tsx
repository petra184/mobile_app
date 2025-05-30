"use client"
import { useState, useEffect } from "react"
import { View, Text, StyleSheet, Pressable, Image, Dimensions, ActivityIndicator } from "react-native"
import { useLocalSearchParams, useRouter } from "expo-router"
import { SafeAreaView } from "react-native-safe-area-context"
import { colors } from "@/constants/colors"
import { getTeamById } from "@/app/actions/teams"
import { getTeamGames } from "@/app/actions/games"
import { getPlayersByTeam, type Player, getCoachesByTeam, type Coach, getStoriesByTeam, type Story } from "@/app/actions/info_teams"
import type { Team } from "@/app/actions/teams"
import type { Game } from "@/types/game"
import RosterTab from "@/app/teams/RosterTab"
import ScheduleTab from "@/app/teams/ScheduleTab"
import TeamInfoTab from "@/app/teams/InfoTab"
import { Feather } from "@expo/vector-icons"
import { StatusBar } from "expo-status-bar"
import Animated, { useSharedValue, useAnimatedStyle, withTiming, FadeIn, FadeInDown } from "react-native-reanimated"

const { width } = Dimensions.get("window")
const TAB_WIDTH = width / 3

export default function TeamDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()

  // State
  const [team, setTeam] = useState<Team | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [coaches, setCoaches] = useState<Coach[]>([])
  const [games, setGames] = useState<Game[]>([])
  const [stories, setStories] = useState<Story[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("details")
  const tabPosition = useSharedValue(0)

  // Load team data
  useEffect(() => {
    if (id) {
      loadTeamData(id)
    }
  }, [id])

  const loadTeamData = async (teamId: string) => {
    try {
      setLoading(true)
      setError(null)

      // Load team data in parallel
      const [teamData, playersData, coachesData, gamesData, storiesData] = await Promise.all([
        getTeamById(teamId),
        getPlayersByTeam(teamId),
        getCoachesByTeam(teamId),
        getTeamGames(teamId),
        getStoriesByTeam(teamId, 10),
      ])

      setTeam(teamData)
      setPlayers(playersData)
      setCoaches(coachesData)
      setGames(gamesData)
      setStories(storiesData)
    } catch (err) {
      console.error("Error loading team data:", err)
      setError("Failed to load team data. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  // Calculate team stats
  const teamStats = {
    wins:
      games.filter((g) => g.status === "completed" && g.homeTeam.id === id && g.score && g.score.home > g.score.away)
        .length +
      games.filter((g) => g.status === "completed" && g.awayTeam.id === id && g.score && g.score.away > g.score.home)
        .length,
    losses:
      games.filter((g) => g.status === "completed" && g.homeTeam.id === id && g.score && g.score.home < g.score.away)
        .length +
      games.filter((g) => g.status === "completed" && g.awayTeam.id === id && g.score && g.score.away < g.score.home)
        .length,
    totalPlayers: players.length,
    totalCoaches: coaches.length,
  }

  // Handle tab changes
  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
  }

  // Update tab indicator position when active tab changes
  useEffect(() => {
    switch (activeTab) {
      case "details":
        tabPosition.value = withTiming(0, { duration: 300 })
        break
      case "roster":
        tabPosition.value = withTiming(1, { duration: 300 })
        break
      case "schedule":
        tabPosition.value = withTiming(2, { duration: 300 })
        break
    }
  }, [activeTab, tabPosition])

  // Animated styles for tab indicator
  const tabIndicatorStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: tabPosition.value * TAB_WIDTH }],
    }
  })

  // Loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Animated.View entering={FadeIn.duration(300)} style={styles.loadingContent}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading team details...</Text>
        </Animated.View>
      </SafeAreaView>
    )
  }

  // Error state
  if (error || !team) {
    return (
      <SafeAreaView style={styles.notFoundContainer}>
        <Animated.View entering={FadeIn.duration(300)}>
          <Image source={{ uri: "https://via.placeholder.com/150?text=Error" }} style={styles.notFoundImage} />
          <Text style={styles.notFoundText}>{error || "Team not found"}</Text>
          <Pressable style={styles.backButtonLarge} onPress={() => router.back()}>
            <Feather name="chevron-left" size={20} color="#fff" />
            <Text style={styles.backButtonText}>Go Back</Text>
          </Pressable>
          {error && (
            <Pressable style={styles.retryButton} onPress={() => id && loadTeamData(id)}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </Pressable>
          )}
        </Animated.View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={["left", "right"]}>
      <StatusBar style="light" />

      {/* Team Header */}
      <Animated.View entering={FadeIn.duration(400)} style={[styles.header, { backgroundColor: team.primaryColor }]}>
        <View style={styles.teamInfo}>
          <Pressable
            style={styles.backButton}
            onPress={() => router.back()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Feather name="chevron-left" size={24} color="#fff" />
          </Pressable>

          <View style={styles.centeredTeamName}>
            <Text style={styles.teamName}>{team.name}</Text>
            <Text style={styles.teamSubtitle}>
              {team.gender} {team.sport}
            </Text>
          </View>
        </View>
      </Animated.View>

      {/* Custom Tab Bar */}
      <View style={styles.tabBarContainer}>
        <Animated.View
          style={[
            styles.tabIndicator,
            {
              width: TAB_WIDTH,
              backgroundColor: team.primaryColor,
            },
            tabIndicatorStyle,
          ]}
        />

        <Pressable style={styles.tabItem} onPress={() => handleTabChange("details")}>
          <Feather name="info" size={22} color={activeTab === "details" ? team.primaryColor : colors.textSecondary} />
          <Text style={[styles.tabText, activeTab === "details" && { color: team.primaryColor, fontWeight: "700" }]}>
            Details
          </Text>
        </Pressable>

        <Pressable style={styles.tabItem} onPress={() => handleTabChange("roster")}>
          <Feather name="users" size={22} color={activeTab === "roster" ? team.primaryColor : colors.textSecondary} />
          <Text style={[styles.tabText, activeTab === "roster" && { color: team.primaryColor, fontWeight: "700" }]}>
            Roster
          </Text>
        </Pressable>

        <Pressable style={styles.tabItem} onPress={() => handleTabChange("schedule")}>
          <Feather
            name="calendar"
            size={22}
            color={activeTab === "schedule" ? team.primaryColor : colors.textSecondary}
          />
          <Text style={[styles.tabText, activeTab === "schedule" && { color: team.primaryColor, fontWeight: "700" }]}>
            Schedule
          </Text>
        </Pressable>

      </View>

      {/* Tab Content */}
      <Animated.View entering={FadeInDown.duration(400).delay(300)} style={styles.tabContent}>
        {activeTab === "details" && <TeamInfoTab teamId={id as string} team={team} teamStats={teamStats} />}
        {activeTab === "roster" && (
          <RosterTab players={players} coaches={coaches} teamId={id as string} loading={false} />
        )}
        {activeTab === "schedule" && <ScheduleTab games={games} loading={false} />}
      </Animated.View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingContent: {
    alignItems: "center",
    padding: 40,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 16,
    textAlign: "center",
  },
  header: {
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  backButton: {
    borderRadius: 20,
    alignItems: "center",
  },
  teamName: {
    fontSize: 22,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  teamSubtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    textTransform: "capitalize",
  },
  teamInfo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    position: "relative",
    marginTop: 15,
    marginBottom: 5,
  },
  centeredTeamName: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
  },
  notFoundContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
    padding: 24,
  },
  notFoundImage: {
    width: 120,
    height: 120,
    marginBottom: 24,
    borderRadius: 60,
  },
  notFoundText: {
    fontSize: 20,
    fontWeight: "600",
    color: colors.textSecondary,
    marginBottom: 24,
    textAlign: "center",
  },
  backButtonLarge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 12,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    marginLeft: 8,
  },
  retryButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: colors.accent,
    borderRadius: 12,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  tabBarContainer: {
    flexDirection: "row",
    height: 64,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    position: "relative",
    backgroundColor: colors.card,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  tabIndicator: {
    position: "absolute",
    bottom: 0,
    height: 3,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
  },
  tabText: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.textSecondary,
    marginTop: 5,
  },
  tabContent: {
    flex: 1,
  },
})
