"use client"

import React, { useState, useEffect, useCallback } from "react"
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Image,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from "react-native"
import {
  getTeams,
  getTeamsByGender,
  getTeamsBySport,
  searchTeams,
} from "@/app/actions/teams"
import type { Team } from "@/types/updated_types"
import { colors } from "@/constants/colors"
import { useUserStore } from "@/hooks/userStore"
import { useNotifications } from "@/context/notification-context"
import AntDesign from "@expo/vector-icons/AntDesign"
import Feather from "@expo/vector-icons/Feather"
import Animated, { useAnimatedStyle, withTiming, useSharedValue, withSpring } from "react-native-reanimated"

interface TeamSelectorProps {
  onSelectTeam?: (team: Team) => void
  onTeamPress?: (team: Team) => void
  showFavorites?: boolean
  horizontal?: boolean
  allowMultiSelect?: boolean
  filterByGender?: "men" | "women" | "all"
  filterBySport?: string
  showSearch?: boolean
  showFilters?: boolean
  maxSelections?: number
}

const TeamItem = React.memo(
  ({
    team,
    isSelected,
    isFavorite,
    onPress,
    onFavoriteToggle,
    showFavorites,
  }: {
    team: Team
    isSelected: boolean
    isFavorite: boolean
    onPress: () => void
    onFavoriteToggle: () => void
    showFavorites: boolean
  }) => {
    const scale = useSharedValue(1)
    const opacity = useSharedValue(1)

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    }))

    const handlePressIn = () => {
      scale.value = withSpring(0.95, { damping: 15 })
      opacity.value = withTiming(0.8, { duration: 100 })
    }

    const handlePressOut = () => {
      scale.value = withSpring(1, { damping: 15 })
      opacity.value = withTiming(1, { duration: 150 })
    }

    const teamColorBackground = `${team.primaryColor}15`

    return (
      <Animated.View style={animatedStyle}>
        <Pressable
          style={[
            styles.teamItem,
            isSelected && styles.selectedTeamItem,
            {
              borderColor: isSelected ? team.primaryColor : colors.border,
              backgroundColor: isSelected ? teamColorBackground : colors.card,
            },
          ]}
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          android_ripple={{ color: "rgba(0, 0, 0, 0.1)", borderless: false }}
        >
          {/* Color accent bar */}
          <View style={[styles.colorAccent, { backgroundColor: team.primaryColor }]} />

          <Image
            source={require("@/IMAGES/MAIN_LOGO.png")}
            style={styles.teamLogo}
            resizeMode="contain"
          />

          <View style={styles.teamInfo}>
            <Text
              style={[styles.teamName, { color: isSelected ? team.primaryColor : colors.text }]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {team.shortName}
            </Text>
            <Text style={styles.teamSport} numberOfLines={1}>
              {team.gender} {team.sport} 
            </Text>
          </View>

          {showFavorites && (
            <Pressable
              style={styles.favoriteButton}
              onPress={onFavoriteToggle}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <AntDesign
                name={isFavorite ? "heart" : "hearto"}
                size={20}
                color={isFavorite ? "#EF4444" : colors.textSecondary}
              />
            </Pressable>
          )}

          {isSelected && (
            <View style={[styles.selectedIndicator, { backgroundColor: team.primaryColor }]}>
              <Feather name="check" size={16} color="white" />
            </View>
          )}
        </Pressable>
      </Animated.View>
    )
  },
)

const FilterChip = ({
  label,
  isActive,
  onPress,
}: {
  label: string
  isActive: boolean
  onPress: () => void
}) => (
  <Pressable style={[styles.filterChip, isActive && styles.activeFilterChip]} onPress={onPress}>
    <Text style={[styles.filterChipText, isActive && styles.activeFilterChipText]}>{label}</Text>
  </Pressable>
)

export const TeamSelector: React.FC<TeamSelectorProps> = ({
  onSelectTeam,
  onTeamPress,
  showFavorites = true,
  horizontal = false,
  allowMultiSelect = false,
  filterByGender,
  filterBySport,
  showSearch = true,
  showFilters = true,
  maxSelections = 5,
}) => {
  const { preferences, toggleFavoriteTeam } = useUserStore()
  const { showError, showSuccess, showWarning } = useNotifications()

  // State
  const [teams, setTeams] = useState<Team[]>([])
  const [filteredTeams, setFilteredTeams] = useState<Team[]>([])
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeGenderFilter, setActiveGenderFilter] = useState<"all" | "men" | "women">(filterByGender || "all")
  const [activeSportFilter, setActiveSportFilter] = useState<string>(filterBySport || "all")
  const [availableSports, setAvailableSports] = useState<string[]>([])

 const loadTeams = useCallback(async () => {
      try {
        setLoading(true)
        let fetchedTeams: Team[] = []

        if (filterByGender && filterByGender !== "all") {
          fetchedTeams = await getTeamsByGender(filterByGender) // ✅ Now safe
        } else if (filterBySport) {
          fetchedTeams = await getTeamsBySport(filterBySport)
        } else {
          fetchedTeams = await getTeams()
        }

        setTeams(fetchedTeams)
        setFilteredTeams(fetchedTeams)

        const sports = [...new Set(fetchedTeams.map((team) => team.sport))]
        setAvailableSports(sports)

        if (fetchedTeams.length === 0) {
          showWarning("No teams found", "No teams are available at the moment")
        }
      } catch (error) {
        console.error("Error loading teams:", error)
        showError("Failed to load teams", "Please check your connection and try again")
      } finally {
        setLoading(false)
      }
    }, [filterByGender, filterBySport, showError, showWarning])

  // Refresh teams
  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await loadTeams()
    setRefreshing(false)
  }, [loadTeams])

  // Search teams
  const handleSearch = useCallback(
    async (query: string) => {
      setSearchQuery(query)

      if (!query.trim()) {
        setFilteredTeams(teams)
        return
      }

      try {
        const searchResults = await searchTeams(query)
        setFilteredTeams(searchResults)
      } catch (error) {
        console.error("Search error:", error)
        // Fallback to local search
        const localResults = teams.filter(
          (team) =>
            team.name.toLowerCase().includes(query.toLowerCase()) ||
            team.shortName.toLowerCase().includes(query.toLowerCase()) ||
            team.sport.toLowerCase().includes(query.toLowerCase()),
        )
        setFilteredTeams(localResults)
      }
    },
    [teams],
  )

  // Apply filters
  const applyFilters = useCallback(() => {
    let filtered = teams

    // Gender filter
    if (activeGenderFilter !== "all") {
      filtered = filtered.filter((team) => team.gender === activeGenderFilter)
    }

    // Sport filter
    if (activeSportFilter !== "all") {
      filtered = filtered.filter((team) => team.sport === activeSportFilter)
    }

    // Search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (team) =>
          team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          team.shortName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          team.sport.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    setFilteredTeams(filtered)
  }, [teams, activeGenderFilter, activeSportFilter, searchQuery])

  // Handle team selection
  const handleSelectTeam = (team: Team) => {
    if (allowMultiSelect) {
      setSelectedTeamIds((prev) => {
        const isSelected = prev.includes(team.id)
        let newSelection: string[]

        if (isSelected) {
          newSelection = prev.filter((id) => id !== team.id)
        } else {
          if (prev.length >= maxSelections) {
            showWarning("Selection limit reached", `You can only select up to ${maxSelections} teams`)
            return prev
          }
          newSelection = [...prev, team.id]
        }

        return newSelection
      })
    } else {
      setSelectedTeamIds([team.id])
    }

    if (onSelectTeam) {
      onSelectTeam(team)
    }
  }

  const handleTeamPress = (team: Team) => {
    if (onTeamPress) {
      onTeamPress(team)
    } else {
      handleSelectTeam(team)
    }
  }

  const handleFavoriteToggle = (teamId: string) => {
    toggleFavoriteTeam(teamId)
    const team = teams.find((t) => t.id === teamId)
    if (team) {
      const isFavorite = preferences.favoriteTeams.includes(teamId)
      showSuccess(
        isFavorite ? "Removed from favorites" : "Added to favorites",
        `${team.shortName} ${isFavorite ? "removed from" : "added to"} your favorites`,
      )
    }
  }

  // Effects
  useEffect(() => {
    loadTeams()
  }, [loadTeams])

  useEffect(() => {
    applyFilters()
  }, [applyFilters])

  // Render functions
  const renderTeamItem = ({ item, index }: { item: Team; index: number }) => {
    const isSelected = selectedTeamIds.includes(item.id)
    const isFavorite = preferences.favoriteTeams.includes(item.id)

    return (
      <View style={[styles.teamItemWrapper, horizontal && { marginRight: 12 }, !horizontal && { marginBottom: 12 }]}>
        <TeamItem
          team={item}
          isSelected={isSelected}
          isFavorite={isFavorite}
          onPress={() => handleTeamPress(item)}
          onFavoriteToggle={() => handleFavoriteToggle(item.id)}
          showFavorites={showFavorites}
        />
      </View>
    )
  }

  const renderHeader = () => (
    <View style={styles.header}>
      {/* Search */}
      {showSearch && (
        <View style={styles.searchContainer}>
          <Feather name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search teams..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={handleSearch}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => handleSearch("")} style={styles.clearButton}>
              <Feather name="x" size={20} color={colors.textSecondary} />
            </Pressable>
          )}
        </View>
      )}

      {/* Filters */}
      {showFilters && !filterByGender && !filterBySport && (
        <View style={styles.filtersContainer}>
          <Text style={styles.filterLabel}>Gender:</Text>
          <View style={styles.filterRow}>
            <FilterChip
              label="All"
              isActive={activeGenderFilter === "all"}
              onPress={() => setActiveGenderFilter("all")}
            />
            <FilterChip
              label="Men"
              isActive={activeGenderFilter === "men"}
              onPress={() => setActiveGenderFilter("men")}
            />
            <FilterChip
              label="Women"
              isActive={activeGenderFilter === "women"}
              onPress={() => setActiveGenderFilter("women")}
            />
          </View>

          <Text style={styles.filterLabel}>Sport:</Text>
          <View style={styles.filterRow}>
            <FilterChip
              label="All"
              isActive={activeSportFilter === "all"}
              onPress={() => setActiveSportFilter("all")}
            />
            {availableSports.map((sport) => (
              <FilterChip
                key={sport}
                label={sport}
                isActive={activeSportFilter === sport}
                onPress={() => setActiveSportFilter(sport)}
              />
            ))}
          </View>
        </View>
      )}

      {/* Results count */}
      <View style={styles.resultsContainer}>
        <Text style={styles.resultsText}>
          {filteredTeams.length} team{filteredTeams.length !== 1 ? "s" : ""} found
        </Text>
        {allowMultiSelect && selectedTeamIds.length > 0 && (
          <Text style={styles.selectionText}>{selectedTeamIds.length} selected</Text>
        )}
      </View>
    </View>
  )

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Feather name="users" size={48} color={colors.textSecondary} />
      <Text style={styles.emptyStateTitle}>No teams found</Text>
      <Text style={styles.emptyStateText}>
        {searchQuery ? "Try adjusting your search or filters" : "No teams are available"}
      </Text>
      <Pressable style={styles.retryButton} onPress={loadTeams}>
        <Text style={styles.retryButtonText}>Retry</Text>
      </Pressable>
    </View>
  )

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading teams...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredTeams}
        renderItem={renderTeamItem}
        keyExtractor={(item) => item.id}
        horizontal={horizontal}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          horizontal ? styles.horizontalList : styles.verticalList,
          filteredTeams.length === 0 && styles.emptyList,
        ]}
        ListHeaderComponent={!horizontal ? renderHeader : null}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          !horizontal ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          ) : undefined
        }
        numColumns={horizontal ? 1 : 1}
        ItemSeparatorComponent={() => <View style={{ height: horizontal ? 0 : 8 }} />}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
  clearButton: {
    padding: 4,
  },
  filtersContainer: {
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 8,
    marginTop: 8,
  },
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  activeFilterChip: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.text,
  },
  activeFilterChipText: {
    color: "white",
  },
  resultsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  resultsText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  selectionText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary,
  },
  horizontalList: {
    paddingHorizontal: 16,
  },
  verticalList: {
    paddingBottom: 20,
  },
  emptyList: {
    flexGrow: 1,
  },
  teamItemWrapper: {
    // Spacing handled in renderTeamItem
  },
  teamItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
    position: "relative",
    overflow: "hidden",
  },
  selectedTeamItem: {
    shadowOpacity: 0.15,
    elevation: 6,
  },
  colorAccent: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  teamLogo: {
    width: 50,
    height: 60,
    marginRight: 12,
    borderRadius: 8,
  },
  teamInfo: {
    flex: 1,
  },
  teamName: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 2,
  },
  teamSport: {
    fontSize: 12,
    color: colors.textSecondary,
    textTransform: "capitalize",
  },
  favoriteButton: {
    padding: 8,
    marginLeft: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  selectedIndicator: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: 24,
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
  },
})

export default TeamSelector
