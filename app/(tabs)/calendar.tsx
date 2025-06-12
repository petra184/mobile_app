"use client"

import { useState, useEffect, useMemo } from "react"
import { View, Text, StyleSheet, ScrollView, Platform, Pressable, LayoutAnimation, UIManager, Image } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useRouter } from "expo-router"
import { LinearGradient } from "expo-linear-gradient"
import { colors } from "@/constants/colors"
import type { Team } from "@/app/actions/teams"
import type { Team as DbTeam } from "@/types"
import type { Game } from "@/types/game"
import { CalendarView } from "@/components/games/CalendarView"
import { GameCard } from "@/components/games/new_game_card"
import { EnhancedDropdown } from "@/components/ui/new_dropdown"
import { Feather } from "@expo/vector-icons"
import { getTeams } from "@/app/actions/teams"

// Enable LayoutAnimation for smooth transitions on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

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
    about_team: null,
    facebook: null,
    instagram: null,
    twitter: null,
    website: null,
    image_fit: null,
    image_position: null,
    image_scale: null,
  }
}

// --- NEW: Interactive, Selectable Game Item Component ---
const SelectableGameItem = ({ game }: { game: Game }) => {
  const router = useRouter()
  const [isExpanded, setIsExpanded] = useState(false)

  const handleToggle = () => {
    // Animate the layout change
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsExpanded(!isExpanded)
  }

  const handleGameSelect = () => {
    router.push({
      pathname: "../all_cards/game_details",
      params: { id: game.id },
    })
  }

  return (
    <View style={styles.selectableGameContainer}>
      <Pressable onPress={handleToggle}>
        <GameCard game={game} />
      </Pressable>
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
  const [filtersExpanded, setFiltersExpanded] = useState(false) // Filters start collapsed

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

  const handleLocationTypeChange = (type: string | null) => {
    setLocationType(type)
  }

  const clearAllFilters = () => {
    setSelectedTeam(null)
    setLocationType(null)
  }

  const toggleFilters = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setFiltersExpanded(!filtersExpanded)
  }

  const formatSelectedDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    })
  }

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

  const hasActiveFilters = selectedTeam || locationType

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* NEW: Polished Header */}
      <LinearGradient colors={[colors.primary, colors.accent]} style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerSubtitle}>Find games by date and team</Text>
        </View>
        <Pressable onPress={toggleFilters} style={styles.filterToggle}>
          <Feather name="sliders" size={20} color="white" />
        </Pressable>
      </LinearGradient>


        {/* NEW: Collapsible Advanced Filters Section */}
        {filtersExpanded && (
          <View style={styles.filtersSection}>
            <View style={styles.filtersGrid}>
              <View style={styles.filterItem}>
                <Text style={styles.filterLabel}>Filter by Team</Text>
                <EnhancedDropdown options={teamOptions} selectedValue={selectedTeam?.id || null} onSelect={handleTeamSelect} placeholder="Select a team" />
              </View>
              <View style={styles.filterItem}>
                <Text style={styles.filterLabel}>Filter by Location</Text>
                <EnhancedDropdown options={locationOptions} selectedValue={locationType} onSelect={handleLocationTypeChange} placeholder="Game location" />
              </View>
              {hasActiveFilters &&
                <Pressable onPress={clearAllFilters} style={styles.clearFiltersButton}>
                    <Feather name="x-circle" size={14} color={colors.primary} />
                    <Text style={styles.clearFiltersButtonText}>Clear All Filters</Text>
                </Pressable>
              }
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
              <View style={styles.gamesList}>
                {gamesOnSelectedDate.map((game) => (
                   // NEW: Use the interactive SelectableGameItem component
                  <SelectableGameItem key={game.id} game={game} />
                ))}
              </View>
            ) : (
              <View style={styles.noGamesContainer}>
                <View style={styles.noGamesIcon}>
                  <Feather name="calendar" size={32} color={colors.textSecondary} />
                </View>
                <Text style={styles.noGamesTitle}>No Games Scheduled</Text>
                <Text style={styles.noGamesText}>There are no games on this date with your current filters.</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

// --- NEW, POLISHED STYLES ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop:40,
    backgroundColor: '#F3F4F6', // A slightly off-white background
  },
  scrollContainer: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 20 : 40,
    paddingBottom: 20,
  },
  headerContent: { flex: 1 },
  headerTitle: { fontSize: 28, fontWeight: "bold", color: "white" },
  headerSubtitle: { fontSize: 16, color: "rgba(255, 255, 255, 0.8)" },
  filterToggle: { padding: 8, backgroundColor: "rgba(255, 255, 255, 0.2)", borderRadius: 20 },
  
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
    borderColor: colors.border
  },
  filtersGrid: { gap: 16 },
  filterItem: { gap: 8 },
  filterLabel: { fontSize: 14, fontWeight: "500", color: colors.textSecondary },
  clearFiltersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    marginTop: 8,
    borderRadius: 8,
    backgroundColor: `${colors.primary}1A`,
    gap: 8,
  },
  clearFiltersButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },

  gamesSection: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  gamesHeaderContent: {
    marginBottom: 16,
    paddingLeft: 4,
  },
  gamesTitle: { fontSize: 22, fontWeight: "bold", color: colors.text },
  gamesSubtitle: { fontSize: 14, color: colors.textSecondary, marginTop: 4 },
  
  gamesList: {
    gap: 16,
  },

  // SelectableGameItem styles
  selectableGameContainer: {
  },
  expandedContent: {
    padding: 16,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    borderTopWidth: 1,
    borderColor: colors.border
  },
  qrTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: colors.text,
  },
  qrCodeContainer: {
    padding: 10,
    backgroundColor: 'white',
    borderRadius: 8,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  qrCodeImage: {
    width: 150,
    height: 150,
  },
  detailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    gap: 8,
  },
  detailsButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },

  noGamesContainer: {
    alignItems: "center",
    padding: 40,
    backgroundColor: 'white',
    borderRadius: 16
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
  noGamesTitle: { fontSize: 18, fontWeight: "600", color: colors.text, marginBottom: 8 },
  noGamesText: { fontSize: 14, color: colors.textSecondary, textAlign: "center", lineHeight: 20 },
});