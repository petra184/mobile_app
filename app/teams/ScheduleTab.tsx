"use client"

import type React from "react"
import { View, Text, StyleSheet, FlatList, Image, ActivityIndicator } from "react-native"
import { useRouter } from "expo-router"
import { colors } from "@/constants/colors"
import type { Game } from "@/types/game"
import { GameCard } from "@/components/games/new_game_card"
import Animated, { FadeInDown } from "react-native-reanimated"
import { Feather } from "@expo/vector-icons"

interface ScheduleTabProps {
  games: Game[]
  loading?: boolean
}

export const ScheduleTab: React.FC<ScheduleTabProps> = ({ games, loading = false }) => {
  const router = useRouter()

  // Sort games by date (upcoming first, then past)
  const sortedGames = [...games].sort((a, b) => {
    const dateA = new Date(a.date)
    const dateB = new Date(b.date)
    return dateA.getTime() - dateB.getTime()
  })

  // Separate upcoming and past games with proper date comparison
  const now = new Date()

  const upcomingGames = sortedGames.filter((game) => {
    const gameDate = new Date(game.date)
    return gameDate >= now || game.status === "scheduled" || game.status === "live"
  })

  const pastGames = sortedGames.filter((game) => {
    const gameDate = new Date(game.date)
    return gameDate < now && (game.status === "completed" || game.status === "canceled" || game.status === "postponed")
  })

  const handleGamePress = (game: Game) => {
    router.push({
      pathname: "../all_cards/game_details",
      params: { id: game.id },
    })
  }

  const handleNotifyPress = (game: Game) => {
    // Handle notification logic here
    console.log("Notify for game:", game.id)
  }

  // Enhanced loading state with ActivityIndicator
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading schedule...</Text>
      </View>
    )
  }

  // Prepare data for FlatList
  const sections = []

  if (upcomingGames.length > 0) {
    sections.push({
      type: "header",
      title: `Upcoming Games (${upcomingGames.length})`,
      id: "upcoming-header",
    })
    upcomingGames.forEach((game) => {
      sections.push({
        type: "game",
        game,
        id: `upcoming-${game.id}`,
      })
    })
  }

  if (pastGames.length > 0) {
    sections.push({
      type: "header",
      title: `Past Games (${pastGames.length})`,
      id: "past-header",
    })
    pastGames.forEach((game) => {
      sections.push({
        type: "game",
        game,
        id: `past-${game.id}`,
      })
    })
  }

  const renderItem = ({ item }: { item: any }) => {
    if (item.type === "header") {
      return (
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{item.title}</Text>
        </View>
      )
    }

    if (item.type === "game") {
      return (
        <GameCard
          game={item.game}
          onPress={() => handleGamePress(item.game)}
          onNotifyPress={() => handleNotifyPress(item.game)}
        />
      )
    }

    return null
  }

  return (
    <View style={styles.container}>
      <Image
        source={require("../../IMAGES/crowd.jpg")}
        style={styles.backgroundImage}
      />

      <Animated.View entering={FadeInDown.duration(400).delay(300)} style={styles.content}>
        {sections.length > 0 ? (
          <FlatList
            data={sections}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              <Feather name="calendar" size={60} color={colors.primary + '40'} />
            </View>
            <Text style={styles.emptyTitle}>No Games Scheduled</Text>
            <Text style={styles.emptyText}>
              This team doesn't have any games scheduled yet.
            </Text>
            <Text style={styles.emptySubtext}>
              Check back later for schedule updates!
            </Text>
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
  emptySubtext: {
    fontSize: 14,
    color: colors.text + '60',
    textAlign: "center",
    fontStyle: "italic",
  },
})

export default ScheduleTab