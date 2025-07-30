"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { View, Text, StyleSheet, FlatList, Image, Pressable, ActivityIndicator } from "react-native"
import { colors } from "@/constants/colors"
import type { Player, Coach } from "@/types/updated_types"
import { getTeamData } from "@/app/actions/info_teams"
import { useRouter } from "expo-router"
import Animated, { FadeInDown } from "react-native-reanimated"
import { Feather } from "@expo/vector-icons"

type RosterItem = (Player & { type: "player" }) | (Coach & { type: "coach" }) | { type: "label"; label: string }

interface RosterTabProps {
  players: Player[]
  coaches: Coach[]
  teamId: string
  loading?: boolean
}

export const RosterTab: React.FC<RosterTabProps> = ({ players, coaches, teamId, loading = false }) => {
  const router = useRouter()
  const [teamData, setTeamData] = useState<{
    id: string
    name: string
    photo: string | null
    sport: string
    gender: string
    primaryColor?: string
  } | null>(null)
  const [loadingTeam, setLoadingTeam] = useState(true)

  // Fetch team data for roster photo
  useEffect(() => {
    const fetchTeamData = async () => {
      try {
        const data = await getTeamData(teamId)
        setTeamData(data)
      } catch (error) {
        console.error("Error fetching team data:", error)
      } finally {
        setLoadingTeam(false)
      }
    }

    fetchTeamData()
  }, [teamId])

  const handlePlayerPress = (playerId: string) => {
    router.push({
      pathname: "../teams/Players",
      params: { id: playerId },
    })
  }

  const handleCoachPress = (coachId: string) => {
    router.push({
      pathname: "../teams/Coaches",
      params: { id: coachId },
    })
  }

  const renderItem = ({ item }: { item: RosterItem }) => {
    if (item.type === "label") {
      return (
        <View style={styles.sectionLabelContainer}>
          <Text style={styles.sectionLabel}>{item.label}</Text>
        </View>
      )
    }

    if (item.type === "player") {
      const player = item as Player
      const playerName = `${player.first_name || ""} ${player.last_name || ""}`.trim() || "Unknown Player"

      return (
        <Pressable style={styles.playerCard} onPress={() => handlePlayerPress(player.id)}>
          <Image
            source={{
              uri: player.photo || "https://via.placeholder.com/60x60?text=Player",
            }}
            style={styles.playerImage}
          />
          <View style={styles.playerInfo}>
            <Text style={styles.playerName}>{playerName}</Text>
            {player.jersey_number && (
              <View style={styles.numberBadge}>
                <Text style={styles.playerNumber}>#{player.jersey_number}</Text>
              </View>
            )}
            {player.position && <Text style={styles.playerPosition}>{player.position}</Text>}
          </View>
        </Pressable>
      )
    }

    const coach = item as Coach
    const coachName = `${coach.first_name || ""} ${coach.last_name || ""}`.trim() || "Unknown Coach"

    return (
      <Pressable style={styles.playerCard} onPress={() => handleCoachPress(coach.id)}>
        <Image
          source={{
            uri: coach.image || "https://via.placeholder.com/60x60?text=Coach",
          }}
          style={styles.playerImage}
        />
        <View style={styles.playerInfo}>
          <Text style={styles.playerName}>{coachName}</Text>
          {coach.title && <Text style={styles.coachTitle}>{coach.title}</Text>}
          {coach.coaching_experience && <Text style={styles.playerDetail}>{coach.coaching_experience} experience</Text>}
        </View>
      </Pressable>
    )
  }

  // Enhanced loading state with ActivityIndicator
  if (loading || loadingTeam) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading roster...</Text>
      </View>
    )
  }

  const rosterData: RosterItem[] = [
    ...(players.length > 0 ? [{ type: "label" as const, label: "Players" }] : []),
    ...players.map((p) => ({ ...p, type: "player" as const })),
    ...(coaches.length > 0 ? [{ type: "label" as const, label: "Coaching Staff" }] : []),
    ...coaches.map((c) => ({ ...c, type: "coach" as const })),
  ]

  return (
    <View style={styles.container}>
      <Image
        source={require("../../../IMAGES/crowd.jpg")}
        style={styles.backgroundImage}
      />

      <Animated.View entering={FadeInDown.duration(400).delay(300)} style={styles.content}>
        {rosterData.length > 0 ? (
          <FlatList
            data={rosterData}
            renderItem={renderItem}
            keyExtractor={(item, index) => {
              if ("id" in item) return item.id
              if (item.type === "label") return `label-${index}`
              return `item-${index}`
            }}
            contentContainerStyle={styles.listContent}
            ListHeaderComponent={() => (
              <View style={styles.headerContainer}>
                {teamData?.photo ? (
                  <Image source={{ uri: teamData.photo }} style={styles.roster} />
                ) : (
                  <Image source={{ uri: "https://via.placeholder.com/800x400?text=Team+Roster" }} style={styles.roster} />
                )}
              </View>
            )}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              <Feather name="users" size={60} color={colors.primary + '40'} />
            </View>
            <Text style={styles.emptyTitle}>No Roster Available</Text>
            <Text style={styles.emptyText}>
              This team doesn't have any players or coaches listed yet.
            </Text>
            <Text style={styles.emptySubtext}>
              Check back later for roster updates!
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
  sectionLabelContainer: {
    marginTop: 20,
    marginBottom: 10,
  },
  sectionLabel: {
    fontSize: 18,
    color: colors.text,
    fontWeight: "600",
    fontStyle: "italic",
  },
  backgroundImage: {
    position: "absolute",
    bottom: 0,
    resizeMode: "cover",
    opacity: 0.06,
    zIndex: 0,
  },
  headerContainer: {
    alignItems: "center",
    marginBottom: 30,
  },
  listContent: {
    padding: 16,
  },
  rosterStats: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
  },
  coachTitle: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: "500",
    marginBottom: 4,
  },
  playerCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 10,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
    minHeight: 90,
  },
  roster: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    marginBottom: 20,
  },
  playerImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
    marginRight: 16,
    backgroundColor: colors.border,
  },
  playerInfo: {
    flex: 1,
    justifyContent: "center",
  },
  playerName: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    flex: 1,
  },
  numberBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: colors.primary,
    marginTop: 4,
    marginBottom: 4,
  },
  playerPosition: {
    fontSize: 14,
    color: colors.primary,
    marginBottom: 6,
    fontWeight: "500",
  },
  playerDetails: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
    flexWrap: "wrap",
  },
  playerDetail: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  detailSeparator: {
    fontSize: 12,
    color: colors.textSecondary,
    marginHorizontal: 6,
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
  playerNumber: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
})

export default RosterTab