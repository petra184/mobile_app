"use client"

import React, { useState, useEffect, useCallback, useRef } from "react"
import { View, Text, StyleSheet, Pressable, Image, ActivityIndicator, Dimensions } from "react-native"
import { Gesture, GestureDetector } from "react-native-gesture-handler"
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated"
import { getTeams, getTeamsByGender } from "@/lib/actions/teams"
import type { Team } from "@/types/updated_types"
import { colors } from "@/constants/Colors"
import { useUserStore } from "@/hooks/userStore"
import { useNotifications } from "@/context/notification-context"
import AntDesign from "@expo/vector-icons/AntDesign"
import Feather from "@expo/vector-icons/Feather"

const { width: screenWidth, height: screenHeight } = Dimensions.get("window")
const CARD_WIDTH = screenWidth - 40
const CARD_HEIGHT = 280
const SWIPE_THRESHOLD = screenWidth * 0.4

interface SwipeableTeamSelectorProps {
  onSelectTeam?: (team: Team) => void
  onTeamPress?: (team: Team) => void
  showFavorites?: boolean
  filterByGender?: "men" | "women" | "all"
  autoAdvance?: boolean
  autoAdvanceDelay?: number
  overlayOnSelect?: boolean
}

const SwipeableCard = React.memo(
  ({
    team,
    index,
    currentIndex,
    isSelected,
    isFavorite,
    onPress,
    onFavoriteToggle,
    onSwipeNext,
    onSwipePrevious,
    showFavorites,
    totalCards,
    overlayOnSelect = false,
  }: {
    team: Team
    index: number
    currentIndex: number
    isSelected: boolean
    isFavorite: boolean
    onPress: () => void
    onFavoriteToggle: () => void
    onSwipeNext: () => void
    onSwipePrevious: () => void
    showFavorites: boolean
    totalCards: number
    overlayOnSelect?: boolean
  }) => {
    const translateX = useSharedValue(0)
    const translateY = useSharedValue(0)
    const rotate = useSharedValue(0)
    const scale = useSharedValue(1)
    const opacity = useSharedValue(1)

    const cardOffset = index - currentIndex
    const isVisible = Math.abs(cardOffset) <= 2

    useEffect(() => {
      if (cardOffset === 0) {
        translateX.value = withSpring(0)
        translateY.value = withSpring(0)
        rotate.value = withSpring(0)
        scale.value = withSpring(1)
        opacity.value = withTiming(1)
      } else if (cardOffset > 0) {
        const offset = Math.min(cardOffset, 3)
        translateX.value = withSpring(offset * 8)
        translateY.value = withSpring(offset * 8)
        rotate.value = withSpring(offset * 1)
        scale.value = withSpring(1 - offset * 0.03)
        opacity.value = withTiming(Math.max(0.4, 1 - offset * 0.15))
      } else {
        translateX.value = withSpring(cardOffset < 0 ? -screenWidth : screenWidth)
        opacity.value = withTiming(0)
      }
    }, [currentIndex, index, translateX, translateY, rotate, scale, opacity])

    const panGesture = Gesture.Pan()
      .onStart(() => {
        if (cardOffset !== 0) return
      })
      .onUpdate((event) => {
        if (cardOffset !== 0) return
        translateX.value = event.translationX
        translateY.value = event.translationY * 0.2
        rotate.value = interpolate(
          event.translationX,
          [-screenWidth, 0, screenWidth],
          [-10, 0, 10],
          Extrapolation.CLAMP,
        )
        scale.value = interpolate(Math.abs(event.translationX), [0, screenWidth], [1, 0.95], Extrapolation.CLAMP)
        opacity.value = interpolate(Math.abs(event.translationX), [0, screenWidth], [1, 0.7], Extrapolation.CLAMP)
      })
      .onEnd((event) => {
        if (cardOffset !== 0) return
        const shouldSwipeRight = event.translationX > SWIPE_THRESHOLD && event.velocityX > 0
        const shouldSwipeLeft = event.translationX < -SWIPE_THRESHOLD && event.velocityX < 0

        if (shouldSwipeRight) {
          translateX.value = withTiming(screenWidth * 1.2, { duration: 300 })
          rotate.value = withTiming(15, { duration: 300 })
          opacity.value = withTiming(0, { duration: 300 })
          runOnJS(onSwipePrevious)()
        } else if (shouldSwipeLeft) {
          translateX.value = withTiming(-screenWidth * 1.2, { duration: 300 })
          rotate.value = withTiming(-15, { duration: 300 })
          opacity.value = withTiming(0, { duration: 300 })
          runOnJS(onSwipeNext)()
        } else {
          translateX.value = withSpring(0)
          translateY.value = withSpring(0)
          rotate.value = withSpring(0)
          scale.value = withSpring(1)
          opacity.value = withTiming(1)
        }
      })

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotate.value}deg` },
        { scale: scale.value },
      ],
      opacity: opacity.value,
      zIndex: totalCards - cardOffset,
    }))

    if (!isVisible) return null

    // Only show border color when overlayOnSelect is true AND team is selected
    const borderColor = overlayOnSelect && isSelected ? team.primaryColor : colors.border

    return (
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.cardContainer, animatedStyle]}>
          <Pressable
            style={[
              styles.teamCard,
              {
                borderColor: borderColor,
                borderWidth: overlayOnSelect && isSelected ? 3 : 1, // Only thick border when overlayOnSelect is true
                backgroundColor: overlayOnSelect && isSelected ? `${team.primaryColor}08` : colors.card, // Only background tint when overlayOnSelect is true
              },
              overlayOnSelect && isSelected && styles.selectedTeamCard,
            ]}
            onPress={() => {
              // Removed console.log for team selection
              onPress()
            }}
            android_ripple={{ color: "rgba(0, 0, 0, 0.1)", borderless: false }}
          >
            <View style={{ flex: 1 }}>
              <View style={styles.logoSection}>
                <Image source={{ uri: team.logo }} style={styles.teamLogo} resizeMode="cover" />
              </View>

              <View style={styles.infoSection}>
                <View style={styles.teamHeader}>
                  <View style={[styles.colorAccent, { backgroundColor: team.primaryColor }]} />
                  <View style={styles.teamDetails}>
                    <View style={styles.teamNameRow}>
                      <Text
                        style={[
                          styles.teamName,
                          {
                            color: overlayOnSelect && isSelected ? team.primaryColor : colors.text, // Only change color when overlayOnSelect is true
                            fontWeight: overlayOnSelect && isSelected ? "900" : "800", // Only make bolder when overlayOnSelect is true
                          },
                        ]}
                      >
                        {team.name}
                      </Text>
                      {showFavorites && (
                        <Pressable
                          style={styles.inlineFavoriteButton}
                          onPress={onFavoriteToggle}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <AntDesign
                            name={isFavorite ? "heart" : "hearto"}
                            size={22}
                            color={isFavorite ? "#EF4444" : colors.textSecondary}
                          />
                        </Pressable>
                      )}
                    </View>
                    <Text style={styles.teamShortName}>{team.shortName}</Text>
                  </View>
                </View>
              </View>

              {isSelected && overlayOnSelect && (
                <View style={[styles.overlayEffect, { backgroundColor: `${team.primaryColor}40` }]} />
              )}
            </View>
          </Pressable>
        </Animated.View>
      </GestureDetector>
    )
  },
)

export const SwipeableTeamSelector: React.FC<SwipeableTeamSelectorProps> = ({
  onSelectTeam,
  onTeamPress,
  showFavorites = true,
  filterByGender = "all",
  autoAdvance = false,
  autoAdvanceDelay = 3000,
  overlayOnSelect = false,
}) => {
  const { preferences, toggleFavoriteTeam } = useUserStore()
  const { showSuccess, showInfo } = useNotifications()
  const [teams, setTeams] = useState<Team[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([])
  const [loadingTeams, setLoadingTeams] = useState(true)
  const autoAdvanceRef = useRef<number | null>(null)

  const loadTeams = useCallback(async () => {
    try {
      setLoadingTeams(true)
      let fetchedTeams: Team[] = []
      if (filterByGender === "men") {
        fetchedTeams = await getTeamsByGender("men")
      } else if (filterByGender === "women") {
        fetchedTeams = await getTeamsByGender("women")
      } else {
        fetchedTeams = await getTeams()
      }
      setTeams(fetchedTeams)
      setCurrentIndex(0)
    } catch (error) {
      console.error("Error loading teams:", error)
      setTeams([])
    } finally {
      setLoadingTeams(false)
    }
  }, [filterByGender])

  useEffect(() => {
    if (autoAdvance && teams.length > 1) {
      autoAdvanceRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % teams.length)
      }, autoAdvanceDelay)
      return () => {
        if (autoAdvanceRef.current) {
          clearInterval(autoAdvanceRef.current)
        }
      }
    }
  }, [autoAdvance, autoAdvanceDelay, teams.length])

  const goToNext = useCallback(() => {
    if (teams.length > 0) {
      setCurrentIndex((prev) => (prev + 1) % teams.length)
    }
  }, [teams.length])

  const goToPrevious = useCallback(() => {
    if (teams.length > 0) {
      setCurrentIndex((prev) => (prev - 1 + teams.length) % teams.length)
    }
  }, [teams.length])

  // Fixed handleSelectTeam - no notifications for team selection
  const handleSelectTeam = useCallback(
    (team: Team) => {
      setSelectedTeamIds((prevSelectedTeamIds) => {
        const isCurrentlySelected = prevSelectedTeamIds.includes(team.id)

        let newSelectedIds: string[]
        if (isCurrentlySelected) {
          // If the tapped team is already selected, deselect it
          newSelectedIds = []
        } else {
          // If the tapped team is not selected, select it (and deselect any other)
          newSelectedIds = [team.id]
        }

        return newSelectedIds
      })

      // Always call onSelectTeam if provided
      if (onSelectTeam) {
        onSelectTeam(team)
      }
    },
    [onSelectTeam],
  )

  // Fixed handleTeamPress - always update selection state
  const handleTeamPress = useCallback(
    (team: Team) => {
      // Always update the internal selection state
      handleSelectTeam(team)

      // Also call the external onTeamPress handler if provided
      if (onTeamPress) {
        onTeamPress(team)
      }
    },
    [handleSelectTeam, onTeamPress],
  )

  const handleToggleFavorite = async (teamId: string) => {
    try {
      const team = teams.find((t) => t.id === teamId)
      const wasAlreadyFavorite = preferences.favoriteTeams.includes(teamId)
      await toggleFavoriteTeam(teamId)

      // Show notifications for favorite actions
      if (team) {
        if (wasAlreadyFavorite) {
          showInfo("Removed from Favorites", `${team.name} has been removed from your favorite teams.`)
        } else {
          showSuccess("Added to Favorites", `${team.name} has been added to your favorite teams!`)
        }
      }
    } catch (error) {
      console.error("Error toggling favorite team:", error)
    }
  }

  useEffect(() => {
    loadTeams()
  }, [loadTeams])

  if (loadingTeams) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading teams...</Text>
      </View>
    )
  }

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
    <View style={styles.container}>
      <View style={styles.cardStack}>
        {teams.map((team, index) => {
          const isSelected = selectedTeamIds.includes(team.id)
          const isFavorite = preferences.favoriteTeams.includes(team.id)

          return (
            <SwipeableCard
              key={team.id}
              team={team}
              index={index}
              currentIndex={currentIndex}
              isSelected={isSelected}
              isFavorite={isFavorite}
              onPress={() => handleTeamPress(team)}
              onFavoriteToggle={() => handleToggleFavorite(team.id)}
              onSwipeNext={goToNext}
              onSwipePrevious={goToPrevious}
              showFavorites={showFavorites}
              totalCards={teams.length}
              overlayOnSelect={overlayOnSelect}
            />
          )
        })}
      </View>

      <View style={styles.navigationControls}>
        <Pressable style={styles.navButton} onPress={goToPrevious}>
          <Feather name="chevron-left" size={24} color={colors.primary} />
        </Pressable>
        <View style={styles.cardCounter}>
          <Text style={styles.counterText}>
            {currentIndex + 1} of {teams.length}
          </Text>
          <View style={styles.dotsContainer}>
            {teams.slice(0, Math.min(teams.length, 5)).map((_, index) => {
              const dotIndex =
                teams.length <= 5
                  ? index
                  : currentIndex < 2
                    ? index
                    : currentIndex > teams.length - 3
                      ? teams.length - 5 + index
                      : currentIndex - 2 + index
              const isActive = dotIndex === currentIndex
              return (
                <Pressable
                  key={dotIndex}
                  style={[
                    styles.dot,
                    isActive && styles.activeDot,
                    { backgroundColor: isActive ? colors.primary : colors.border },
                  ]}
                  onPress={() => setCurrentIndex(dotIndex)}
                />
              )
            })}
          </View>
        </View>
        <Pressable style={styles.navButton} onPress={goToNext}>
          <Feather name="chevron-right" size={24} color={colors.primary} />
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  cardStack: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    position: "relative",
    alignItems: "center",
    marginBottom: 20,
  },
  cardContainer: {
    position: "absolute",
    width: screenWidth * 0.8,
    height: "100%",
  },
  teamCard: {
    width: screenWidth * 0.8,
    height: "100%",
    backgroundColor: colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    overflow: "hidden",
  },
  selectedTeamCard: {
    shadowOpacity: 0.3,
    elevation: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 15,
  },
  logoSection: {
    height: 180,
    position: "relative",
    backgroundColor: colors.background,
  },
  teamLogo: {
    width: "100%",
    height: "100%",
  },
  selectedIndicator: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  infoSection: {
    flex: 1,
    padding: 20,
    backgroundColor: colors.card,
  },
  overlayEffect: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 20,
    pointerEvents: "none",
  },
  teamHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  colorAccent: {
    width: 4,
    height: 60,
    borderRadius: 2,
    marginRight: 16,
  },
  teamDetails: {
    flex: 1,
  },
  teamNameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  teamName: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.text,
    flex: 1,
    letterSpacing: -0.5,
  },
  inlineFavoriteButton: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.05)",
  },
  teamShortName: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textSecondary,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  teamMeta: {
    flexDirection: "row",
    alignItems: "center",
  },
  teamSport: {
    fontSize: 14,
    color: colors.textSecondary,
    textTransform: "capitalize",
    fontWeight: "500",
  },
  enhancedContent: {
    flex: 1,
    justifyContent: "space-between",
  },
  teamDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 16,
    fontStyle: "italic",
  },
  actionButtons: {
    marginTop: "auto",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "white",
    letterSpacing: -0.3,
  },
  navigationControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: CARD_WIDTH,
    marginBottom: 20,
  },
  navButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardCounter: {
    alignItems: "center",
    marginBottom: 10,
  },
  counterText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  currentTeamName: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    marginTop: 2,
    textAlign: "center",
  },
  dotsContainer: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
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

export default SwipeableTeamSelector
