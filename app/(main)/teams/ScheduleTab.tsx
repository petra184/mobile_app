"use client"
import type React from "react"
import { useMemo } from "react"
import { View, Text, StyleSheet, Image, ActivityIndicator, SectionList } from "react-native"
import { useRouter } from "expo-router"
import { colors } from "@/constants/colors"
import type { Game } from "@/types/game"
import { GameCard } from "@/components/games/new_game_card"
import Animated, { FadeInDown } from "react-native-reanimated"
import { Feather } from "@expo/vector-icons"
import { useNotifications } from "@/context/notification-context"
import { sortGamesByPriority } from "@/utils/sortGame"

interface ScheduleTabProps {
  games: Game[]
  loading?: boolean
}

// Helper function to properly compare dates
const compareDates = (gameDate: string, currentDate: Date) => {
  // Parse the game date
  const game = new Date(gameDate)
  
  // Create a copy of current date and reset time
  const today = new Date(currentDate)
  today.setHours(0, 0, 0, 0)
  
  // Reset game date time for comparison
  game.setHours(0, 0, 0, 0)

  if (game < today) return 'past'
  if (game.getTime() === today.getTime()) return 'today'
  return 'future'
}

export const ScheduleTab: React.FC<ScheduleTabProps> = ({ games, loading = false }) => {
  const router = useRouter()
  const { showSuccess } = useNotifications()

  // FIXED: Better date-based categorization with debugging
  const sections = useMemo(() => {
    // Get current date once
    const currentDate = new Date()
    
    const liveGames: Game[] = []
    const upcomingGames: Game[] = []
    const pastGames: Game[] = []

    // Process each game
    games.forEach((game, index) => {
    
      // Live games always go to live section regardless of date
      if (game.status === "live") {
        liveGames.push(game)
        return
      }

      // For all other games, use date comparison
      const dateCategory = compareDates(game.date, currentDate)
      
      if (dateCategory === 'past') {
        pastGames.push(game)
      } else {
        upcomingGames.push(game)
      }
    })


    // Create sections
    const sectionData = []

    if (liveGames.length > 0) {
      sectionData.push({ title: "Live Games", data: liveGames })
    }

    if (upcomingGames.length > 0) {
      // Sort upcoming games by date (earliest first)
      upcomingGames.sort((a, b) => {
        const dateA = new Date(a.date)
        const dateB = new Date(b.date)
        return dateA.getTime() - dateB.getTime()
      })
      sectionData.push({ title: "Upcoming Games", data: upcomingGames })
    }

    if (pastGames.length > 0) {
      // Sort past games by date (most recent first)
      pastGames.sort((a, b) => {
        const dateA = new Date(a.date)
        const dateB = new Date(b.date)
        return dateB.getTime() - dateA.getTime()
      })
      sectionData.push({ title: "Past Games", data: pastGames })
    }

    return sectionData
  }, [games])

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

  return (
    <View style={styles.container}>
      <Image source={require("../../../IMAGES/crowd.jpg")} style={styles.backgroundImage} />
      <Animated.View entering={FadeInDown.duration(400).delay(300)} style={styles.content}>
        {sections.length > 0 ? (
          <SectionList
            sections={sections}
            keyExtractor={(item) => item.id}
            renderItem={renderGameItem}
            renderSectionHeader={({ section }) => (
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{`${section.title} (${section.data.length})`}</Text>
              </View>
            )}
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
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