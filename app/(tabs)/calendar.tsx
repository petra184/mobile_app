"use client"

import { useState, useEffect } from "react"
import { View, Text, StyleSheet, ScrollView, Platform, Pressable } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useRouter } from "expo-router"
import { colors } from "@/constants/colors"
import type { Team } from "@/app/actions/teams"
import type { Team as DbTeam } from "@/types"
import type { Game } from "@/types/game"
import { CalendarView } from "@/components/games/CalendarView"
import { GameCard } from "@/components/games/game-card"
import { Dropdown } from "@/components/ui/dropdown"
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

export default function CalendarScreen() {
  const router = useRouter()
  const [teams, setTeams] = useState<Team[]>([])
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
  const [locationType, setLocationType] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [gamesOnSelectedDate, setGamesOnSelectedDate] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)
  const [filtersVisible, setFiltersVisible] = useState(true)

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

  const formatSelectedDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    })
  }

  // Prepare dropdown options
  const teamOptions = [
    { label: "All Teams", value: null },
    ...teams.map((team) => ({
      label: team.name,
      value: team.id,
      color: team.primaryColor,
    })),
  ]

  const locationOptions = [
    { label: "All Games", value: null },
    { label: "Home Game", value: "home" },
    { label: "Away Game", value: "away" },
    { label: "Neutral Game", value: "neutral" },
  ]

  return (
    <SafeAreaView style={styles.container} edges={["left"]}>
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>

        {/* Filters Section */}
        <View style={styles.filtersSection}>

          {filtersVisible && (
            <View style={styles.filtersGrid}>
              <View style={styles.filterItem}>
                <Dropdown
                  options={teamOptions}
                  selectedValue={selectedTeam?.id || null}
                  onSelect={handleTeamSelect}
                  placeholder="Select a team"
                />
              </View>

              <View style={styles.filterItem}>
                <Dropdown
                  options={locationOptions}
                  selectedValue={locationType}
                  onSelect={handleLocationTypeChange}
                  placeholder="Select a locations"
                />
              </View>
            </View>
          )}

          {/* Active Filters Summary */}
          {(selectedTeam || locationType) && (
            <View style={styles.activeFiltersSummary}>
              <View style={styles.summaryHeader}>
                <Feather name="filter" size={16} color={colors.primary} />
                <Text style={styles.summaryText}>
                  {selectedTeam ? `${selectedTeam.name}` : "All teams"}
                  {locationType ? ` • ${locationOptions.find((opt) => opt.value === locationType)?.label}` : ""}
                </Text>
              </View>
            </View>
          )}
        </View>

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
            <View style={styles.gamesSectionHeader}>
              <View style={styles.gamesHeaderContent}>
                <Text style={styles.gamesTitle}>{formatSelectedDate(selectedDate)}</Text>
                <Text style={styles.gamesSubtitle}>
                  {gamesOnSelectedDate.length} game{gamesOnSelectedDate.length !== 1 ? "s" : ""} scheduled
                </Text>
              </View>
            </View>

            {gamesOnSelectedDate.length > 0 ? (
              <View style={styles.gamesList}>
                {gamesOnSelectedDate.map((game) => (
                  <GameCard key={game.id} game={game} onPress={() => handleGameSelect(game)} />
                ))}
              </View>
            ) : (
              <View style={styles.noGamesContainer}>
                <View style={styles.noGamesIcon}>
                  <Feather name="calendar" size={32} color={colors.textSecondary} />
                </View>
                <Text style={styles.noGamesTitle}>No games scheduled</Text>
                <Text style={styles.noGamesText}>There are no games scheduled for this date.</Text>
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
  filterLabel: {
  },
  filtersSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
    marginTop: 16,
  },
  filtersGrid: {
    flexDirection: "row",
    gap: 15,
    marginTop: 16,
  },
  filterItem: {
    flex: 1,
  },
  filtersHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  filtersHeaderText: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
    paddingLeft:10
  },
  activeFiltersSummary: {
    marginTop: 16,
    padding: 10,
    alignContent: "center",
    alignItems: "center",
    backgroundColor: `${colors.primary}08`,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: `${colors.primary}20`,
  },
  summaryHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  summaryText: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.text,
    marginLeft: 8,
  },
  calendarSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  gamesSection: {
    paddingHorizontal: 10,
    marginBottom: 24,
  },
  gamesSectionHeader: {
    marginBottom: 16,
    paddingLeft: 10
  },
  gamesHeaderContent: {
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  gamesTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 4,
  },
  gamesSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  gamesList: {
    gap: 12,
  },
  noGamesContainer: {
    alignItems: "center",
    padding: 40,
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
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
