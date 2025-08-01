"use client"

import { CalendarView } from "@/components/games/CalendarView"
import { GameCard } from "@/components/games/new_game_card"
import { EnhancedDropdown } from "@/components/ui/new_dropdown"
import { colors } from "@/constants/Colors"
import { useNotifications } from "@/context/notification-context"
import { convertUiTeamToDbTeam } from "@/lib/actions/games"
import { getTeams } from "@/lib/actions/teams"
import type { Game, Team } from "@/types/updated_types"
import { Feather } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import { useRouter } from "expo-router"
import { useCallback, useEffect, useMemo, useState } from "react"
import { LayoutAnimation, Platform, Pressable, ScrollView, StyleSheet, Text, UIManager, View } from "react-native"
import { RefreshControl } from "react-native-gesture-handler"
import { SafeAreaView } from "react-native-safe-area-context"

// Enable LayoutAnimation for smooth transitions on Android
if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true)
}

// --- OPTIMIZED: Interactive, Selectable Game Item Component ---
const SelectableGameItem = ({ game }: { game: Game }) => {
  const { showSuccess } = useNotifications()
  const router = useRouter()

  const handleGameSelect = useCallback(() => {
    router.push({
      pathname: "../all_cards/game_details",
      params: { id: game.id },
    })
  }, [game.id, router])

  const handleNotifyPress = useCallback(
    (selectedGame: Game) => {
      try {
        showSuccess(
          "Notification Set",
          `You'll be notified about ${selectedGame.homeTeam?.name} vs ${selectedGame.awayTeam?.name}`,
        )
      } catch (error) {
        console.error("Error showing notification:", error)
      }
    },
    [showSuccess],
  )

  return (
    <View style={styles.selectableGameContainer}>
      <GameCard game={game} onPress={handleGameSelect} onNotifyPress={handleNotifyPress} />
    </View>
  )
}

export default function EnhancedCalendarScreen() {
  const router = useRouter()
  const [teams, setTeams] = useState<Team[]>([])
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
  const [locationType, setLocationType] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [gamesOnSelectedDate, setGamesOnSelectedDate] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)
  const [filtersExpanded, setFiltersExpanded] = useState(false)

  const loadTeams = useCallback(async () => {
    try {
      const teamsData = await getTeams()
      setTeams(teamsData)
    } catch (error) {
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadTeams()
  }, [loadTeams])

  const handleDateSelect = useCallback((date: Date, games: Game[]) => {
    setSelectedDate(date)
    setGamesOnSelectedDate(games)
  }, [])

  const handleTeamSelect = useCallback(
    (teamId: string | null) => {
      const team = teams.find((t) => t.id === teamId) || null
      setSelectedTeam(team)
    },
    [teams],
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

  const toggleFilters = useCallback(() => {
    // Use requestAnimationFrame to avoid insertion effect conflicts
    requestAnimationFrame(() => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
      setFiltersExpanded((prev) => !prev)
    })
  }, [filtersExpanded])

  const formatSelectedDate = useCallback((date: Date) => {
    const formatted = date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    })
    return formatted
  }, [])

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

  const teamOptions = useMemo(
    () => [
      {
        label: "All Teams",
        value: null,
        icon: "users",
      },
      ...teams.map((team) => ({
        label: team.name,
        value: team.id,
        color: team.primaryColor,
      })),
    ],
    [teams],
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

  const hasActiveFilters = useMemo(() => selectedTeam || locationType, [selectedTeam, locationType])

  const renderGameItem = useCallback(
    (game: Game) => {
      return <SelectableGameItem key={game.id} game={game} />
    },
    [selectedDate],
  )

  const getNoGamesMessage = useCallback(() => {
    if (selectedTeam && locationType) {
      return `No ${getLocationDisplayName(locationType).toLowerCase()} found for ${selectedTeam.name} on this date.`
    } else if (selectedTeam) {
      return `No games found for ${selectedTeam.name} on this date.`
    } else if (locationType) {
      return `No ${getLocationDisplayName(locationType).toLowerCase()} found on this date.`
    }
    return "There are no games on this date with your current filters."
  }, [selectedTeam, locationType, getLocationDisplayName])

    const [refreshing, setRefreshing] = useState(false)
    const onRefresh = useCallback(async () => {
      setRefreshing(true)
      try {
        await loadTeams()
        setSelectedTeam(null)
        setLocationType(null)
        setSelectedDate(null)
        setGamesOnSelectedDate([])
      } catch (error) {
        console.error("Error refreshing teams:", error)
      } finally {
        setRefreshing(false)
      }
    }, [loadTeams])


  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
        
      >
        {/* Header */}
        <LinearGradient colors={[colors.primary, colors.accent]} style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.headerSubtitle}>Find games by date and team</Text>
          </View>
          <Pressable onPress={toggleFilters} style={styles.filterToggle}>
            <Feather name="sliders" size={20} color="white" />
          </Pressable>
        </LinearGradient>

        {/* Collapsible Advanced Filters Section */}
        {filtersExpanded && (
          <View style={styles.filtersSection}>
            <View style={styles.filtersGrid}>
              <View style={styles.filterItem}>
                <Text style={styles.filterLabel}>Filter by Team</Text>
                <EnhancedDropdown
                  options={teamOptions}
                  selectedValue={selectedTeam?.id || null}
                  onSelect={handleTeamSelect}
                  placeholder="Select a team"
                />
              </View>
              <View style={styles.filterItem}>
                <Text style={styles.filterLabel}>Filter by Location</Text>
                <EnhancedDropdown
                  options={locationOptions}
                  selectedValue={locationType}
                  onSelect={handleLocationTypeChange}
                  placeholder="Game location"
                />
              </View>

              {/* Active Filters Display */}
              {hasActiveFilters && (
                <View style={styles.activeFiltersContainer}>
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
              )}
            </View>
          </View>
        )}

        {/* Calendar Section */}
        <View style={styles.card}>
          <CalendarView
            selectedTeam={selectedTeam ? convertUiTeamToDbTeam(selectedTeam) : undefined}
            locationType={locationType ?? undefined}
            onDateSelect={handleDateSelect}
          />
        </View>

        {/* Selected Date Games */}
        {selectedDate && (
          <View style={styles.gamesSection}>
            <View style={styles.gamesHeaderContent}>
              <Text style={styles.gamesTitle}>{formatSelectedDate(selectedDate)}</Text>
              <Text style={styles.gamesSubtitle}>
                {gamesOnSelectedDate.length} game{gamesOnSelectedDate.length !== 1 ? "s" : ""} found
              </Text>
            </View>

            {gamesOnSelectedDate.length > 0 ? (
              <View style={styles.gamesList}>{gamesOnSelectedDate.map(renderGameItem)}</View>
            ) : (
              <View style={styles.noGamesContainer}>
                <View style={styles.noGamesIcon}>
                  <Feather name="calendar" size={32} color={colors.textSecondary} />
                </View>
                <Text style={styles.noGamesTitle}>No Games Scheduled</Text>
                <Text style={styles.noGamesText}>{getNoGamesMessage()}</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

// Optimized styles - removed any potential style conflicts
const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 40,
    backgroundColor: "#F3F4F6",
  },
  scrollContainer: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 20 : 40,
    paddingBottom: 20,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "white",
  },
  headerSubtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
  },
  filterToggle: {
    padding: 8,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 20,
  },
  card: {
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 8,
  },
  filtersSection: {
    padding: 20,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  filtersGrid: {
    gap: 16,
  },
  filterItem: {
    gap: 8,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.textSecondary,
  },
  activeFiltersContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
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
  gamesSection: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  gamesHeaderContent: {
    marginBottom: 16,
    paddingLeft: 4,
  },
  gamesTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: colors.text,
  },
  gamesSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  gamesList: {
    gap: 16,
  },
  selectableGameContainer: {
    // Simplified container without complex styling
  },
  noGamesContainer: {
    alignItems: "center",
    padding: 40,
    backgroundColor: "white",
    borderRadius: 16,
  },
  noGamesIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  noGamesTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 8,
  },
  noGamesText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
})
