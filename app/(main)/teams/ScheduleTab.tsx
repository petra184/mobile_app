"use client"
import { GameCard } from "@/components/games/new_game_card"
import { colors } from "@/constants/Colors"
import { useNotifications } from "@/context/notification-context"
import type { Game } from "@/types/updated_types"
import { Feather } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import type React from "react"
import { useCallback, useMemo } from "react"
import { ActivityIndicator, Image, SectionList, StyleSheet, Text, View } from "react-native"
import Animated, { FadeInDown } from "react-native-reanimated"

interface ScheduleTabProps {
  games: Game[]
  loading?: boolean
}

export const ScheduleTab: React.FC<ScheduleTabProps> = ({ games, loading = false }) => {
  const router = useRouter()
  const { showSuccess } = useNotifications()

  // Helper function to parse 12-hour time to 24-hour format (same as other components)
  const parse12HourTime = useCallback((timeStr: string): string => {
    try {
      const [time, modifier] = timeStr.toUpperCase().split(" ")
      let [hours, minutes] = time.split(":").map(Number)

      if (modifier === "PM" && hours < 12) {
        hours += 12
      }
      if (modifier === "AM" && hours === 12) {
        hours = 0
      }

      return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00`
    } catch (e) {
      console.error("Error parsing 12-hour time:", timeStr, e)
      return "00:00:00"
    }
  }, [])

  // Calculate game start and end times (same as other components)
  const getGameTimings = useCallback(
    (gameData: Game) => {
      const gameDate = new Date(gameData.date)
      let gameStartTime = new Date(gameDate)

      if (gameData.time) {
        const time24h = parse12HourTime(gameData.time)
        gameStartTime = new Date(`${gameDate.toISOString().split("T")[0]}T${time24h}`)
      } else {
        gameStartTime.setHours(0, 0, 0, 0)
      }

      const gameEndTime = new Date(gameStartTime.getTime() + 60 * 60 * 1000) // 1 hour after game start
      return { gameStartTime, gameEndTime }
    },
    [parse12HourTime],
  )

  // Function to determine if a game is actually live using time-based logic
  const isGameLive = useCallback(
    (game: Game): boolean => {
      // Skip completed, postponed, or canceled games
      if (
        game.status === "completed" ||
        game.status === "final" ||
        game.status === "postponed" ||
        game.status === "canceled"
      ) {
        return false
      }

      try {
        const now = new Date()
        const { gameStartTime, gameEndTime } = getGameTimings(game)

        // Game is live if current time is between start and end time
        return now >= gameStartTime && now <= gameEndTime
      } catch (error) {
        console.error("Error calculating game timings for game:", game.id, error)
        return false
      }
    },
    [getGameTimings],
  )

  // UPDATED: Better date-based categorization using time-based logic
  const sections = useMemo(() => {
    // Get current date once
    const currentDate = new Date()
    currentDate.setHours(0, 0, 0, 0)

    const liveGames: Game[] = []
    const upcomingGames: Game[] = []
    const pastGames: Game[] = []

    // Process each game
    games.forEach((game) => {
      // Use time-based logic to determine if game is live
      if (isGameLive(game)) {
        liveGames.push(game)
        return
      }

      // For all other games, use date comparison
      const gameDate = new Date(game.date)
      gameDate.setHours(0, 0, 0, 0)

      // Check if game is completed or in the past
      if (gameDate < currentDate || game.status === "completed" || game.status === "final") {
        pastGames.push(game)
      } else {
        // Game is in the future (upcoming) - includes today and future dates
        upcomingGames.push(game)
      }
    })

    // Create sections
    const sectionData = []

    if (liveGames.length > 0) {
      // Sort live games by start time (earliest first)
      liveGames.sort((a, b) => {
        try {
          const { gameStartTime: startA } = getGameTimings(a)
          const { gameStartTime: startB } = getGameTimings(b)
          return startA.getTime() - startB.getTime()
        } catch {
          return 0
        }
      })
      sectionData.push({ title: "Live Games", data: liveGames })
    }

    if (upcomingGames.length > 0) {
      // Sort upcoming games by date and time (earliest first)
      upcomingGames.sort((a, b) => {
        try {
          const { gameStartTime: startA } = getGameTimings(a)
          const { gameStartTime: startB } = getGameTimings(b)
          return startA.getTime() - startB.getTime()
        } catch {
          // Fallback to date comparison if time parsing fails
          const dateA = new Date(a.date)
          const dateB = new Date(b.date)
          return dateA.getTime() - dateB.getTime()
        }
      })
      sectionData.push({ title: "Upcoming Games", data: upcomingGames })
    }

    if (pastGames.length > 0) {
      // Sort past games by date and time (most recent first)
      pastGames.sort((a, b) => {
        try {
          const { gameStartTime: startA } = getGameTimings(a)
          const { gameStartTime: startB } = getGameTimings(b)
          return startB.getTime() - startA.getTime()
        } catch {
          // Fallback to date comparison if time parsing fails
          const dateA = new Date(a.date)
          const dateB = new Date(b.date)
          return dateB.getTime() - dateA.getTime()
        }
      })
      sectionData.push({ title: "Past Games", data: pastGames })
    }

    return sectionData
  }, [games, isGameLive, getGameTimings])

  const handleGamePress = (game: Game) => {
    router.push({
      pathname: "../all_cards/game_details",
      params: { id: game.id },
    })
  }

  const handleNotifyPress = (game: Game) => {
    showSuccess("Notification Set", `You'll be notified about the game on ${new Date(game.date).toLocaleDateString()}`)
  }

  const handleQRScanPress = (game: Game) => {
    console.log("Navigating to QR Scan for game:", game.id)
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading schedule...</Text>
      </View>
    )
  }

  const renderGameItem = ({ item }: { item: Game }) => (
    <GameCard
      game={item}
      onPress={handleGamePress}
      onNotifyPress={handleNotifyPress}
      onQRScanPress={handleQRScanPress}
    />
  )

  const renderSectionHeader = ({ section }: { section: { title: string; data: Game[] } }) => (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionHeaderContent}>
        {section.title === "Live Games" && (
          <View style={styles.liveIndicator}>
            <View style={styles.liveDot} />
          </View>
        )}
        {section.title === "Upcoming Games" && <Feather name="clock" size={18} color={colors.primary} />}
        {section.title === "Past Games" && <Feather name="check-circle" size={18} color={colors.primary} />}
        <Text style={styles.sectionTitle}>{`${section.title} (${section.data.length})`}</Text>
      </View>
    </View>
  )

  return (
    <View style={styles.container}>
      <Image source={require("../../../IMAGES/crowd.jpg")} style={styles.backgroundImage} />
      <Animated.View entering={FadeInDown.duration(400).delay(300)} style={styles.content}>
        {sections.length > 0 ? (
          <SectionList
            sections={sections}
            keyExtractor={(item) => item.id}
            renderItem={renderGameItem}
            renderSectionHeader={renderSectionHeader}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            stickySectionHeadersEnabled={false}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              <Feather name="calendar" size={60} color={colors.primary + "40"} />
            </View>
            <Text style={styles.emptyTitle}>No Games Scheduled</Text>
            <Text style={styles.emptyText}>This team doesn't have any games scheduled yet.</Text>
          </View>
        )}
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: 5,
  },
  backgroundImage: {
    position: "absolute",
    bottom: 0,
    resizeMode: "cover",
    opacity: 0.06,
    zIndex: 0,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.text + "80",
  },
  listContent: {
    paddingBottom: 20,
  },
  sectionHeader: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 24,
  },
  sectionHeaderContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
  },
  liveIndicator: {
    flexDirection: "row",
    alignItems: "center",
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#EF4444",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  emptyIconContainer: {
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 12,
    textAlign: "center",
  },
  emptyText: {
    fontSize: 15,
    color: colors.text + "80",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 8,
  },
})

export default ScheduleTab
