"use client"

import React, { useState, useEffect, useCallback } from "react"
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Image,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from "react-native"
import { getTeams, getTeamsByGender, type Team } from "@/app/actions/teams"
import { colors } from "@/constants/colors"
import { useUserStore } from "@/hooks/userStore"
import AntDesign from "@expo/vector-icons/AntDesign"
import Feather from "@expo/vector-icons/Feather"
import Animated, { useAnimatedStyle, withTiming, useSharedValue, withSpring } from "react-native-reanimated"

const { width: screenWidth } = Dimensions.get("window")
const cardWidth = (screenWidth - 50) / 2 // 56 = padding (16*2) + gap (24)

interface TeamSelectorProps {
  onSelectTeam?: (team: Team) => void
  onTeamPress?: (team: Team) => void
  showFavorites?: boolean
  horizontal?: boolean
  allowMultiSelect?: boolean
  filterByGender?: "men" | "women" | "all"
  maxSelections?: number
  layoutStyle?: "grid" | "list" // New prop for layout style
}

const TeamItem = React.memo(
  ({
    team,
    isSelected,
    isFavorite,
    onPress,
    onFavoriteToggle,
    showFavorites,
    layoutStyle = "grid",
  }: {
    team: Team
    isSelected: boolean
    isFavorite: boolean
    onPress: () => void
    onFavoriteToggle: () => void
    showFavorites: boolean
    layoutStyle?: "grid" | "list"
  }) => {
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

    const teamColorBackground = `${team.primaryColor}15`

    if (layoutStyle === "list") {
      // List layout similar to rewards screen
      return (
        <Animated.View style={animatedStyle}>
          <Pressable
            style={[
              styles.teamItemList,
              isSelected && styles.selectedTeamItemList,
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
            <View style={styles.teamContentList}>
              <View style={styles.teamInfoList}>
                <View style={styles.teamHeaderList}>
                  <View style={[styles.colorLineList, { backgroundColor: team.primaryColor }]} />
                  <View style={styles.teamTextInfo}>
                    <Text style={[styles.teamNameList, { color: isSelected ? team.primaryColor : colors.text }]}>
                      {team.shortName} {/* Show full name instead of shortName */}
                    </Text>
                    <Text style={styles.teamSportList}>
                      {team.shortName} {team.sport}
                    </Text>
                  </View>
                </View>

                {showFavorites && (
                  <Pressable
                    style={styles.favoriteButtonList}
                    onPress={onFavoriteToggle}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <AntDesign
                      name={isFavorite ? "heart" : "hearto"}
                      size={20}
                      color={isFavorite ? "#EF4444" : colors.textSecondary}
                    />
                  </Pressable>
                )}
              </View>
            </View>

            <View style={styles.teamLogoContainerList}>
              <Image source={{ uri: team.logo }} style={styles.teamLogoList} resizeMode="cover" />
            </View>

            {isSelected && (
              <View style={[styles.selectedIndicatorList, { backgroundColor: team.primaryColor }]}>
                <Feather name="check" size={14} color="white" />
              </View>
            )}
          </Pressable>
        </Animated.View>
      )
    }

    // Grid layout (original)
    return (
      <Animated.View style={[animatedStyle, { width: cardWidth }]}>
        <View style={styles.shadow}>
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
          {/* Team Logo at the top */}
          <View style={styles.logoContainer}>
            <Image source={{ uri: team.logo }} style={styles.teamLogo} resizeMode="cover" />
          </View>

          {/* Team info section with vertical color line */}
          <View style={styles.bottomSection}>
            <View style={styles.teamInfoContainer}>
              {/* Vertical color line */}
              <View style={[styles.colorLine, { backgroundColor: team.primaryColor }]} />

              {/* Team info */}
              <View style={styles.teamInfo}>
                <Text style={[styles.teamName, { color: isSelected ? team.primaryColor : colors.text }]}>
                  {team.shortName} {/* Show full name instead of shortName */}
                </Text>
                <Text style={styles.teamSport}>
                  {team.gender}
                </Text>
                <Text style={styles.teamSport}>
                  {team.sport}
                </Text>
              </View>
            </View>

            {showFavorites && (
              <Pressable
                style={styles.favoriteButton}
                onPress={onFavoriteToggle}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <AntDesign
                  name={isFavorite ? "heart" : "hearto"}
                  size={16}
                  color={isFavorite ? "#EF4444" : colors.textSecondary}
                />
              </Pressable>
            )}
          </View>

          {isSelected && (
            <View style={[styles.selectedIndicator, { backgroundColor: team.primaryColor }]}>
              <Feather name="check" size={12} color="white" />
            </View>
          )}
        </Pressable>
        </View>
      </Animated.View>
    )
  },
)

export const TeamSelector: React.FC<TeamSelectorProps> = ({
  onSelectTeam,
  onTeamPress,
  showFavorites = true,
  horizontal = false,
  allowMultiSelect = false,
  filterByGender = "all",
  maxSelections = 5,
  layoutStyle = "grid",
}) => {
  const { preferences, toggleFavoriteTeam } = useUserStore()

  // State
  const [teams, setTeams] = useState<Team[]>([])
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([])
  const [loadingTeams, setLoadingTeams] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Load teams from database
  const loadTeams = useCallback(async () => {
    try {
      setLoadingTeams(true)
      let fetchedTeams: Team[] = []

      console.log("Loading teams with gender filter:", filterByGender)

      if (filterByGender === "men") {
        fetchedTeams = await getTeamsByGender("men")
      } else if (filterByGender === "women") {
        fetchedTeams = await getTeamsByGender("women")
      } else {
        fetchedTeams = await getTeams()
      }

      console.log(
        `Fetched ${fetchedTeams.length} teams:`,
        fetchedTeams.map((t) => ({
          name: t.name,
          gender: t.gender,
          sport: t.sport,
        })),
      )

      setTeams(fetchedTeams)
    } catch (error) {
      console.error("Error loading teams:", error)
      setTeams([])
    } finally {
      setLoadingTeams(false)
    }
  }, [filterByGender])

  // Refresh teams
  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await loadTeams()
    setRefreshing(false)
  }, [loadTeams])

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

  // Handle favorite toggle
  const handleToggleFavorite = async (teamId: string) => {
    try {
      await toggleFavoriteTeam(teamId)
    } catch (error) {
      console.error("Error toggling favorite team:", error)
    }
  }

  // Effects
  useEffect(() => {
    loadTeams()
  }, [loadTeams])

  // Render functions
  const renderTeamItem = ({ item, index }: { item: Team; index: number }) => {
    const isSelected = selectedTeamIds.includes(item.id)
    const isFavorite = preferences.favoriteTeams.includes(item.id)

    return (
      <TeamItem
        team={item}
        isSelected={isSelected}
        isFavorite={isFavorite}
        onPress={() => handleTeamPress(item)}
        onFavoriteToggle={() => handleToggleFavorite(item.id)}
        showFavorites={showFavorites}
        layoutStyle={layoutStyle}
      />
    )
  }

  const renderEmptyState = () => {
    if (teams.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Feather name="users" size={48} color={colors.textSecondary} />
          <Text style={styles.emptyStateTitle}>No teams available</Text>
          <Text style={styles.emptyStateText}>Teams will appear here when they are added to the database</Text>
          <Pressable style={styles.retryButton} onPress={loadTeams}>
            <Feather name="refresh-cw" size={16} color={colors.primary} />
            <Text style={styles.retryButtonText}>Refresh</Text>
          </Pressable>
        </View>
      )
    }

    return (
      <View style={styles.emptyState}>
        <Feather name="users" size={48} color={colors.textSecondary} />
        <Text style={styles.emptyStateTitle}>No teams found</Text>
        <Text style={styles.emptyStateText}>No teams match the selected filter</Text>
      </View>
    )
  }

  // Loading state
  if (loadingTeams) {
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
        data={teams}
        renderItem={renderTeamItem}
        keyExtractor={(item) => item.id}
        horizontal={horizontal}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          horizontal ? styles.horizontalList : layoutStyle === "list" ? styles.listLayout : styles.verticalList,
          teams.length === 0 && styles.emptyList,
        ]}
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
        numColumns={horizontal || layoutStyle === "list" ? 1 : 2}
        columnWrapperStyle={!horizontal && layoutStyle === "grid" ? styles.row : undefined}
        ItemSeparatorComponent={() => <View style={{ height: layoutStyle === "list" ? 16 : 20 }} />}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  shadow: {
    borderRadius: 16,
    backgroundColor: colors.card, // required for iOS shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3, // Android
  },
  horizontalList: {
    paddingHorizontal: 16,
  },
  verticalList: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  listLayout: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 20,
  },
  emptyList: {
    flexGrow: 1,
  },
  row: {
    justifyContent: "space-between",
  },
  // Grid layout styles
  teamItem: {
    flexDirection: "column",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 10,
    paddingBottom: 16,
    borderWidth: 1.5,
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
  logoContainer: {
    width: "100%",
    alignItems: "center",
    marginBottom: 10,
  },
  teamLogo: {
    width: "100%",
    height: 80,
    borderRadius: 12,
  },
  bottomSection: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    width: "100%",
    flex: 1,
    marginTop: 8,
  },
  teamInfoContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    flex: 1,
  },
  colorLine: {
    width: 3,
    height: 60,
    borderRadius: 1.5,
    marginRight: 8,
    marginTop: 2,
  },
  teamInfo: {
    flex: 1,
    alignItems: "flex-start",
  },
  teamName: {
    fontSize: 16,
    fontWeight: "700",
    textAlign: "left",
  },
  teamSport: {
    fontSize: 14,
    color: colors.textSecondary,
    textTransform: "capitalize",
    textAlign: "left",
    marginTop: 4,
  },
  favoriteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
  selectedIndicator: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
  },
  // List layout styles (similar to rewards screen)
  teamItemList: {
    backgroundColor: colors.card,
    borderRadius: 16,
    overflow: "hidden",
    flexDirection: "row",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1.5,
    borderColor: colors.border,
    position: "relative",
  },
  selectedTeamItemList: {
    shadowOpacity: 0.15,
    elevation: 6,
  },
  teamContentList: {
    flex: 1,
    padding: 16,
  },
  teamInfoList: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  teamHeaderList: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  colorLineList: {
    width: 4,
    height: 40,
    borderRadius: 2,
    marginRight: 12,
  },
  teamTextInfo: {
    flex: 1,
  },
  teamNameList: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 4,
  },
  teamSportList: {
    fontSize: 14,
    color: colors.textSecondary,
    textTransform: "capitalize",
  },
  favoriteButtonList: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
  },
  teamLogoContainerList: {
    width: 100,
    height: "100%",
    backgroundColor: colors.card + "80",
    alignItems: "center",
    justifyContent: "center",
  },
  teamLogoList: {
    width: "100%",
    height: "100%",
  },
  selectedIndicatorList: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  // Common styles
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
    lineHeight: 20,
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: "rgba(59, 130, 246, 0.1)",
    borderRadius: 8,
  },
  retryButtonText: {
    color: colors.primary,
    fontWeight: "600",
    marginLeft: 8,
  },
})

export default TeamSelector
