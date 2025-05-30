"use client"

import type React from "react"
import { View, Text, StyleSheet, FlatList, Image } from "react-native"
import { useRouter } from "expo-router"
import { colors } from "@/constants/colors"
import type { Game } from "@/types/game"
import { GameCard } from "@/components/games/gameCard"

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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
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
          <View style={styles.emptyIcon}>
            <Text style={styles.emptyIconText}>📅</Text>
          </View>
          <Text style={styles.emptyText}>No games scheduled for this team</Text>
          <Text style={styles.emptySubtext}>Check back later for updates</Text>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  backgroundImage: {
    position: "absolute",
    bottom: 0,
    resizeMode: "cover",
    opacity: 0.1,
    zIndex: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
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
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${colors.textSecondary}10`,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  emptyIconText: {
    fontSize: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
    textAlign: "center",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    opacity: 0.7,
  },
})

export default ScheduleTab
