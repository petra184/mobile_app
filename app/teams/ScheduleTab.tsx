"use client"

import React, { useMemo } from "react"
import { View, Text, StyleSheet, Image, ActivityIndicator, SectionList } from "react-native"
import { useRouter } from "expo-router"
import { colors } from "@/constants/colors"
import type { Game } from "@/types/game"
// Your powerful, multi-layout GameCard is imported here.
import { GameCard } from "@/components/games/new_game_card"
import Animated, { FadeInDown } from "react-native-reanimated"
import { Feather } from "@expo/vector-icons"
import { useNotifications } from "@/context/notification-context" // Assuming you have this for notifications
import { sortGamesByPriority } from '@/utils/sortGame'

interface ScheduleTabProps {
  games: Game[]
  loading?: boolean
}

export const ScheduleTab: React.FC<ScheduleTabProps> = ({ games, loading = false }) => {
  const router = useRouter()
  const { showSuccess } = useNotifications()

  // Use useMemo to efficiently sort and group games only when the `games` prop changes.
  const sections = useMemo(() => {
    // 1. Sort all games by priority (Live > Upcoming > Past)
    const sortedGames = sortGamesByPriority(games)

    // 2. Group games into different sections in a single pass
    const liveGames: Game[] = []
    const upcomingGames: Game[] = []
    const pastGames: Game[] = []

    for (const game of sortedGames) {
      if (game.status === 'live') {
        liveGames.push(game)
      } else if (game.status === 'scheduled') {
        upcomingGames.push(game)
      } else { // Catches 'completed', 'postponed', etc.
        pastGames.push(game)
      }
    }

    // 3. Create the data structure for the SectionList component
    const sectionData = []
    if (liveGames.length > 0) {
      sectionData.push({ title: "Live Games", data: liveGames })
    }
    if (upcomingGames.length > 0) {
      sectionData.push({ title: "Upcoming Games", data: upcomingGames })
    }
    if (pastGames.length > 0) {
      // For past games, it's nice to show the most recent first
      pastGames.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      sectionData.push({ title: "Past Games", data: pastGames })
    }

    return sectionData
  }, [games])

  const handleGamePress = (game: Game) => {
    // This is the default action when any card is pressed
    router.push({
      pathname: "../all_cards/game_details",
      params: { id: game.id },
    })
  }

  const handleNotifyPress = (game: Game) => {
    // This will only be called from cards that show the "Notify Me" button (i.e., upcoming games)
    showSuccess("Notification Set", `You'll be notified about the game on ${new Date(game.date).toLocaleDateString()}`)
  }

  const handleQRScanPress = (game: Game) => {
    // This will only be called from cards that show the "Scan QR" button (i.e., live or soon-to-start games)
    console.log("Navigating to QR Scan for game:", game.id)
    // Example: router.push({ pathname: '/qr-scanner', params: { gameId: game.id } });
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
      game={item} // We pass the game object to the card
      onPress={handleGamePress} // The card will call this when pressed
      onNotifyPress={handleNotifyPress} // The card will call this if the "Notify" button is pressed
      onQRScanPress={handleQRScanPress} // The card will call this if the "QR Scan" button is pressed
    />
  )

  return (
    <View style={styles.container}>
      <Image source={require("../../IMAGES/crowd.jpg")} style={styles.backgroundImage} />
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
              <Feather name="calendar" size={60} color={colors.primary + '40'} />
            </View>
            <Text style={styles.emptyTitle}>No Games Scheduled</Text>
            <Text style={styles.emptyText}>This team doesn't have any games scheduled yet.</Text>
          </View>
        )}
      </Animated.View>
    </View>
  )
}

// --- Styles are unchanged ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal:5
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
    color: colors.text + '80',
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
    color: colors.text + '80',
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 8,
  },
})

export default ScheduleTab