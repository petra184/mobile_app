"use client"

import { useState, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Image,
  ActivityIndicator,
  TextInput,
  Platform,
} from "react-native"
import { useRouter } from "expo-router"
import { SafeAreaView } from "react-native-safe-area-context"
import { colors } from "@/constants/colors"
import { useUserStore } from "@/hooks/userStore" // Updated import path
import { getTeams, type Team } from "@/app/actions/teams"
import { Feather } from "@expo/vector-icons"
import Animated, { useAnimatedStyle, withTiming, useSharedValue, withSpring } from "react-native-reanimated"

// Separate component for each team item with individual animation
const AnimatedTeamItem = ({
  item,
  isFavorite,
  isUpdating,
  onToggleFavorite,
  onTeamPress,
}: {
  item: Team
  isFavorite: boolean
  isUpdating: boolean
  onToggleFavorite: (teamId: string) => void
  onTeamPress: (team: Team) => void
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

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        style={styles.teamItem}
        onPress={() => onTeamPress(item)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <Image source={{ uri: item.logo }} style={styles.teamLogo} />
        <View
          style={{ padding: 15, flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}
        >
          <View style={styles.teamInfo}>
            <Text style={styles.teamName}>{item.name}</Text>
            <Text style={styles.teamSport}>
              {item.gender} {item.sport}
            </Text>
          </View>
          <Pressable
            style={styles.favoriteButton}
            onPress={(e) => {
              e.stopPropagation() // Prevent team press when heart is pressed
              onToggleFavorite(item.id)
            }}
            disabled={isUpdating}
          >
            {isUpdating ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Feather name="heart" size={20} color={isFavorite ? "#EF4444" : colors.textSecondary} />
            )}
          </Pressable>
        </View>
      </Pressable>
    </Animated.View>
  )
}

export default function ManageFavoriteTeamsScreen() {
  const router = useRouter()
  const { preferences, toggleFavoriteTeam } = useUserStore()
  const [searchQuery, setSearchQuery] = useState("")
  const [teams, setTeams] = useState<Team[]>([])
  const [loadingTeams, setLoadingTeams] = useState(true)
  const [updatingFavorites, setUpdatingFavorites] = useState<string[]>([])

  // Load teams from database
  async function loadTeams() {
    try {
      setLoadingTeams(true)
      const fetchedTeams = await getTeams()
      console.log("Fetched teams:", fetchedTeams) // Debug log
      setTeams(fetchedTeams)
    } catch (error) {
      console.error("Error loading teams:", error)
    } finally {
      setLoadingTeams(false)
    }
  }

  useEffect(() => {
    loadTeams()
  }, [])

  // Filter teams based on search query
  const filteredTeams = teams.filter((team) => {
    if (!searchQuery.trim()) return true

    const query = searchQuery.toLowerCase()
    return (
      team.name.toLowerCase().includes(query) ||
      team.sport.toLowerCase().includes(query) ||
      team.gender.toLowerCase().includes(query)
    )
  })

  const handleToggleFavorite = async (teamId: string) => {
    try {
      setUpdatingFavorites((prev) => [...prev, teamId])
      await toggleFavoriteTeam(teamId)
    } catch (error) {
      console.error("Error toggling favorite team:", error)
      // You could show an alert here if needed
    } finally {
      setUpdatingFavorites((prev) => prev.filter((id) => id !== teamId))
    }
  }

  const handleTeamPress = (team: Team) => {
    router.push({
      pathname: "../teams",
      params: { id: team.id },
    })
  }

  const renderTeamItem = ({ item }: { item: Team }) => {
    const isFavorite = preferences.favoriteTeams.includes(item.id)
    const isUpdating = updatingFavorites.includes(item.id)

    return (
      <AnimatedTeamItem
        item={item}
        isFavorite={isFavorite}
        isUpdating={isUpdating}
        onToggleFavorite={handleToggleFavorite}
        onTeamPress={handleTeamPress}
      />
    )
  }

  if (loadingTeams) {
    return (
      <SafeAreaView style={styles.container} edges={["bottom"]}>
        <Image source={require("../../../IMAGES/crowd.jpg")} style={styles.backgroundImage} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading teams...</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <>
      <SafeAreaView style={styles.container} edges={["right"]}>
        <Image source={require("../../../IMAGES/crowd.jpg")} style={styles.backgroundImage} />

        {/* Functional Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Feather name="search" size={20} color={colors.textSecondary} />
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search teams..."
              placeholderTextColor={colors.textSecondary}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery("")} style={styles.clearButton}>
                <Feather name="x" size={16} color={colors.textSecondary} />
              </Pressable>
            )}
          </View>
        </View>

        {/* Results info */}
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsText}>
            {searchQuery.trim()
              ? `${filteredTeams.length} team${filteredTeams.length !== 1 ? "s" : ""} found`
              : `${teams.length} total teams`}
          </Text>
          <Text style={styles.instructions}>Tap the heart icon to add or remove teams from your favorites</Text>
        </View>

        {/* Teams List */}
        {teams.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Feather name="users" size={48} color={colors.textSecondary} />
            <Text style={styles.emptyTitle}>No teams available</Text>
            <Text style={styles.emptySubtitle}>Teams will appear here when they are added to the database</Text>
            <Pressable onPress={loadTeams} style={styles.retryButton}>
              <Feather name="refresh-cw" size={16} color={colors.primary} />
              <Text style={styles.retryText}>Refresh</Text>
            </Pressable>
          </View>
        ) : filteredTeams.length === 0 && searchQuery.trim() ? (
          <View style={styles.emptyContainer}>
            <Feather name="search" size={48} color={colors.textSecondary} />
            <Text style={styles.emptyTitle}>No teams found</Text>
            <Text style={styles.emptySubtitle}>Try adjusting your search terms or browse all teams</Text>
            <Pressable onPress={() => setSearchQuery("")} style={styles.clearSearchButton}>
              <Text style={styles.clearSearchText}>Show all teams</Text>
            </Pressable>
          </View>
        ) : (
          <FlatList
            data={filteredTeams}
            renderItem={renderTeamItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </SafeAreaView>
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    top: 0,
  },
  backgroundImage: {
    position: "absolute",
    bottom: 0,
    resizeMode: "cover",
    opacity: 0.1,
    zIndex: 0,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.card,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.textSecondary,
  },
  searchContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingHorizontal: 16,
    ...Platform.select({
      android: {
        paddingVertical: 2,
      },
      ios: {
        paddingVertical: 10,
      },
    }),
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    marginLeft: 12,
    marginRight: 8,
  },
  clearButton: {},
  resultsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  resultsText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.primary,
    marginBottom: 4,
  },
  instructions: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
  clearSearchButton: {
    marginTop: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: "rgba(59, 130, 246, 0.1)",
    borderRadius: 8,
  },
  clearSearchText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary,
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: "rgba(59, 130, 246, 0.1)",
    borderRadius: 8,
  },
  retryText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary,
    marginLeft: 8,
  },
  listContent: {
    padding: 16,
  },
  teamItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  teamLogo: {
    width: 78,
    height: "100%",
    borderRadius: 8,
  },
  teamInfo: {
    flex: 1,
  },
  teamName: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 4,
  },
  teamSport: {
    fontSize: 14,
    color: colors.textSecondary,
    textTransform: "capitalize",
  },
  favoriteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
})