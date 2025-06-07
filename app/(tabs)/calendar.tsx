"use client"

import { useState, useEffect, useMemo } from "react"
import { View, Text, StyleSheet, ScrollView, Platform, Pressable } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useRouter } from "expo-router"
import { LinearGradient } from "expo-linear-gradient"
import { colors } from "@/constants/colors"
import type { Team } from "@/app/actions/teams"
import type { Team as DbTeam } from "@/types"
import type { Game } from "@/types/game"
import { CalendarView } from "@/components/games/CalendarView"
import { GameCard } from "@/components/games/gameCard"
import { EnhancedDropdown } from "@/components/ui/new_dropdown"
import { Feather } from "@expo/vector-icons"
import { getTeams } from "@/app/actions/teams"

// Helper function to convert UI Team to Database Team
function convertUiTeamToDbTeam(uiTeam: Team): DbTeam {
  return {
    id: uiTeam.id,
    name: uiTeam.name,
    short_name: uiTeam.shortName,
    color: uiTeam.primaryColor,
    photo: uiTeam.logo,
    sport: uiTeam.sport,
    gender: uiTeam.gender,
    additional_info: null,
    facebook: null,
    instagram: null,
    twitter: null,
    website: null,
    image_fit: null,
    image_position: null,
    image_scale: null,
  }
}

export default function EnhancedCalendarScreen() {
  const router = useRouter()
  const [teams, setTeams] = useState<Team[]>([])
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
  const [locationType, setLocationType] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [gamesOnSelectedDate, setGamesOnSelectedDate] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)
  const [filtersExpanded, setFiltersExpanded] = useState(true)

  useEffect(() => {
    loadTeams()
  }, [])

  const loadTeams = async () => {
    try {
      const teamsData = await getTeams()
      setTeams(teamsData)
    } catch (error) {
      console.error("Error loading teams:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDateSelect = (date: Date, games: Game[]) => {
    setSelectedDate(date)
    setGamesOnSelectedDate(games)
  }

  const handleTeamSelect = (teamId: string | null) => {
    const team = teams.find((t) => t.id === teamId) || null
    setSelectedTeam(team)
  }

  const handleGameSelect = (game: Game) => {
    router.push({
      pathname: "../all_cards/game_details",
      params: { id: game.id },
    })
  }

  const handleLocationTypeChange = (type: string | null) => {
    setLocationType(type)
  }

  const clearAllFilters = () => {
    setSelectedTeam(null)
    setLocationType(null)
  }

  const formatSelectedDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    })
  }

  // Enhanced dropdown options with better UX
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
        subtitle: `${team.sport} • ${team.gender}`,
      })),
    ],
    [teams],
  )

  const locationOptions = [
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
  ]

  // Filter chips for quick access
  const filterChips = useMemo(() => {
    const chips = []

    // Popular teams as quick filters
    const popularTeams = teams.slice(0, 4)
    popularTeams.forEach((team) => {
      chips.push({
        id: `team-${team.id}`,
        label: team.shortName || team.name,
        value: team.id,
        color: team.primaryColor,
        isActive: selectedTeam?.id === team.id,
      })
    })

    // Location type chips
    chips.push(
      {
        id: "location-home",
        label: "Home",
        value: "home",
        icon: "home",
        isActive: locationType === "home",
      },
      {
        id: "location-away",
        label: "Away",
        value: "away",
        icon: "map-pin",
        isActive: locationType === "away",
      },
    )

    return chips
  }, [teams, selectedTeam, locationType])

  const handleChipPress = (chipId: string, value: string | null) => {
    if (chipId.startsWith("team-")) {
      handleTeamSelect(selectedTeam?.id === value ? null : value)
    } else if (chipId.startsWith("location-")) {
      handleLocationTypeChange(locationType === value ? null : value)
    }
  }

  const hasActiveFilters = selectedTeam || locationType

  return (
    <SafeAreaView style={styles.container} edges={["left"]}>
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>

        {/* Advanced Filters Section */}
        {filtersExpanded && (
          <View style={styles.filtersSection}>
            <Text style={styles.filtersTitle}></Text>

            <View style={styles.filtersGrid}>
              <View style={styles.filterItem}>
                <Text style={styles.filterLabel}>Filter by Team</Text>
                <EnhancedDropdown
                  options={teamOptions}
                  selectedValue={selectedTeam?.id || null}
                  onSelect={handleTeamSelect}
                  placeholder="Select a team"
                  variant="team"
                />
              </View>

              <View style={styles.filterItem}>
                <Text style={styles.filterLabel}>Filter by Location</Text>
                <EnhancedDropdown
                  options={locationOptions}
                  selectedValue={locationType}
                  onSelect={handleLocationTypeChange}
                  placeholder="Game location"
                  variant="location"
                />
              </View>
            </View>
          </View>
        )}

        {/* Active Filters Summary */}
        {hasActiveFilters && (
          <View style={styles.activeFiltersSummary}>
            <LinearGradient
              colors={[`${colors.primary}15`, `${colors.accent}15`]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.summaryGradient}
            >
              <View style={styles.summaryContent}>
                <View style={styles.summaryHeader}>
                  <Feather name="filter" size={16} color={colors.primary} />
                  <Text style={styles.summaryText}>
                    {selectedTeam ? `${selectedTeam.name}` : "All teams"}
                    {locationType ? ` • ${locationOptions.find((opt) => opt.value === locationType)?.label}` : ""}
                  </Text>
                </View>
                <Pressable onPress={clearAllFilters} style={styles.clearButton}>
                  <Text style={styles.clearButtonText}>Clear</Text>
                </Pressable>
              </View>
            </LinearGradient>
          </View>
        )}

        {/* Calendar Section */}
        <View style={styles.calendarSection}>
          <CalendarView
            selectedTeam={selectedTeam ? convertUiTeamToDbTeam(selectedTeam) : undefined}
            locationType={locationType ?? undefined}
            onDateSelect={handleDateSelect}
          />
        </View>

        {/* Selected Date Games */}
        {selectedDate && (
          <View style={styles.gamesSection}>
            <LinearGradient
              colors={[`${colors.primary}08`, `${colors.accent}08`]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gamesSectionHeader}
            >
              <View style={styles.gamesHeaderContent}>
                <View style={styles.gamesHeaderLeft}>
                  <Text style={styles.gamesTitle}>{formatSelectedDate(selectedDate)}</Text>
                  <Text style={styles.gamesSubtitle}>
                    {gamesOnSelectedDate.length} game{gamesOnSelectedDate.length !== 1 ? "s" : ""} scheduled
                  </Text>
                </View>
              </View>
            </LinearGradient>

            {gamesOnSelectedDate.length > 0 ? (
              <View style={styles.gamesList}>
                {gamesOnSelectedDate.map((game, index) => (
                  <View key={game.id} style={[styles.gameCardWrapper, { marginTop: index === 0 ? 16 : 8 }]}>
                    <GameCard game={game} onPress={() => handleGameSelect(game)} />
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.noGamesContainer}>
                <View style={styles.noGamesIcon}>
                  <Feather name="calendar" size={32} color={colors.textSecondary} />
                </View>
                <Text style={styles.noGamesTitle}>No games scheduled</Text>
                <Text style={styles.noGamesText}>
                  There are no games scheduled for this date with your current filters.
                </Text>
              </View>
            )}
          </View>
        )}

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
  scrollContainer: {
    flex: 1,
    ...Platform.select({
      ios: {
        marginTop: 80,
      },
      android: {
        marginTop: 105,
      },
    }),
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 24,
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 20,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "white",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
  },
  filterToggle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  quickFiltersSection: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  quickFiltersTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 12,
  },
  filtersSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  filtersTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 16,
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
    color: colors.text,
    marginLeft: 4,
  },
  activeFiltersSummary: {
    marginHorizontal: 20,
    marginBottom: 24,
    borderRadius: 26,
    overflow: "hidden",
  },
  summaryGradient: {
    paddingHorizontal: 16,
    paddingVertical:10
  },
  summaryContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  summaryHeader: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  summaryText: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.text,
    marginLeft: 8,
  },
  clearButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  clearButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "white",
  },
  calendarSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  gamesSection: {
    marginBottom: 24,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: colors.card,
  },
  gamesSectionHeader: {
    paddingHorizontal: 20,
    paddingTop:20
  },
  gamesHeaderContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 10,
    borderBottomColor:colors.border,
    borderBottomWidth:1
  },
  gamesHeaderLeft: {
    flex: 1,
  },
  gamesTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 4,
  },
  gamesSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  gamesHeaderIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${colors.primary}20`,
    alignItems: "center",
    justifyContent: "center",
  },
  gamesList: {
    paddingBottom: 16,
    backgroundColor:colors.background
  },
  gameCardWrapper: {
    backgroundColor:colors.background
  },
  noGamesContainer: {
    alignItems: "center",
    padding: 40,
  },
  noGamesIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: `${colors.textSecondary}10`,
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
  bottomSpacing: {
    height: 40,
  },
})
