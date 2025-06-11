"use client"
import { StyleSheet, Text, View, ScrollView, Platform, TouchableOpacity, Image, ActivityIndicator } from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { colors } from "@/constants/colors"
import InfoItem from "@/components/teams/InfoItem"
import SectionHeader from "@/components/teams/SectionHeader"
import { StatusBar } from "expo-status-bar"
import { useState, useEffect } from "react"
import { SafeAreaView } from "react-native-safe-area-context"
import { useLocalSearchParams, useRouter } from "expo-router"
import { getPlayerDetails } from "@/app/actions/info_teams"
import AntDesign from "@expo/vector-icons/AntDesign"
import Feather from "@expo/vector-icons/Feather"
import FontAwesome6 from "@expo/vector-icons/FontAwesome6"
import FontAwesome from '@expo/vector-icons/FontAwesome';

// Define the Player type based on database structure
export type PlayerData = {
  id: string
  first_name: string | null
  last_name: string | null
  jersey_number: string | null
  position: string | null
  height: string | null
  school_year: string | null
  home_country: string | null
  photo: string | null
  bio: string | null
  birthday: string | null
  age: string | null
  previous_school: string | null
  twitter: string | null
  instagram: string | null
  facebook: string | null
  team_id: string
}

export default function PlayerProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const [player, setPlayer] = useState<PlayerData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (id) {
      fetchPlayerData(id)
    }
  }, [id])

  const fetchPlayerData = async (playerId: string) => {
    try {
      setLoading(true)
      setError(null)
      const playerData = await getPlayerDetails(playerId)

      if (playerData) {
        setPlayer(playerData)
      } else {
        setError("Player not found")
      }
    } catch (err) {
      console.error("Error fetching player data:", err)
      setError("Failed to load player data")
    } finally {
      setLoading(false)
    }
  }

  // Calculate age from birthdate
  const calculateAge = (birthdate: string | null): number => {
    if (!birthdate) return 0

    const today = new Date()
    const birthDate = new Date(birthdate)
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }

    return age
  }

  const getPlayerName = (player: PlayerData): string => {
    return `${player.first_name || ""} ${player.last_name || ""}`.trim() || "Unknown Player"
  }

  // Loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading player profile...</Text>
        </View>
      </SafeAreaView>
    )
  }

  // Error state
  if (error || !player) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error || "Player not found"}</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Feather name="chevron-left" size={20} color="#fff" />
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <>
      <SafeAreaView style={styles.container} edges={["left"]}>
        <StatusBar style="dark" />
        <Image
          source={require("@/IMAGES/crowd.jpg")}
          style={styles.backgroundImage}
        />

        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Image
              source={{ uri: player.photo || "https://via.placeholder.com/400x400?text=Player" }}
              style={styles.playerImage}
              resizeMethod="auto"
            />
            <LinearGradient colors={["transparent", "rgba(0,0,0,0.7)"]} style={styles.imageGradient} />

            {/* Player name overlay on image with new layout */}
            <View style={styles.playerInfoOverlay}>
              <View style={styles.playerNumberWrapper}>
                <View style={styles.playerNumberContainer}>
                  <Text style={styles.playerNumber}>#{player.jersey_number || "0"}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Player Basic Info*/}
          <View style={styles.playerInfo}>
            <Text style={styles.playerName}>{getPlayerName(player)}</Text>
            <View style={styles.teamContainer}>
              <Text style={styles.playerTeam}>{player.height || "N/A"}</Text>
              {player.position && (
                <View style={styles.positionPill}>
                  <Text style={styles.positionText}>{player.position}</Text>
                </View>
              )}
            </View>

            <View style={styles.basicInfoContainer}>
              {player.home_country && (
                <View style={styles.infoRow}>
                  <Feather name="map-pin" size={16} color={colors.primary} style={styles.icon} />
                  <Text style={styles.infoText}>{player.home_country}</Text>
                </View>
              )}
              {player.birthday && (
                <View style={styles.infoRow}>
                  <FontAwesome name="birthday-cake" size={16} color={colors.primary} style={styles.icon} />
                  <Text style={styles.infoText}>{`${calculateAge(player.birthday)} years old`}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Career Highlights */}
          <View style={styles.careerHighlightsContainer}>
            <View style={styles.highlightItem}>
              <Text style={styles.highlightValue}>{player.jersey_number || "N/A"}</Text>
              <Text style={styles.highlightLabel}>Jersey</Text>
            </View>
            <View style={styles.highlightDivider} />
            <View style={styles.highlightItem}>
              <Text style={styles.highlightValue}>{player.school_year || "N/A"}</Text>
              <Text style={styles.highlightLabel}>Year</Text>
            </View>
            <View style={styles.highlightDivider} />
            <View style={styles.highlightItem}>
              <Text style={styles.highlightValue}>{player.position || "N/A"}</Text>
              <Text style={styles.highlightLabel}>Position</Text>
            </View>
          </View>

          {/* Bio Section */}
          {player.bio && (
            <View style={styles.section}>
              <SectionHeader title="Biography" icon="user" />
              <View style={styles.cardContainer}>
                <Text style={styles.bioText}>{player.bio}</Text>
              </View>
            </View>
          )}

          {/* Player Details */}
          <View style={styles.section}>
            <SectionHeader title="Player Details" icon="info" />
            <View style={styles.cardContainer}>
              <View style={styles.statsColumn}>
                <InfoItem label="Height" value={player.height || "N/A"} />
                <InfoItem label="Position" value={player.position || "N/A"} />
                <InfoItem label="Jersey Number" value={player.jersey_number || "N/A"} />
              </View>
              <View style={styles.statsDivider} />
              <View style={styles.statsColumn}>
                <InfoItem label="School Year" value={player.school_year || "N/A"} />
                <InfoItem label="Home Country" value={player.home_country || "N/A"} />
                <InfoItem label="Previous School" value={player.previous_school || "N/A"} />
              </View>
            </View>
          </View>

          {/* Social Media */}
          {(player.twitter || player.instagram || player.facebook) && (
            <View style={styles.section}>
              <SectionHeader title="Social Media" icon="share" />
              <View style={styles.cardContainer}>
                {player.twitter && (
                  <TouchableOpacity style={styles.socialItem}>
                    <View style={[styles.socialIconContainer, { backgroundColor: "black" }]}>
                      <FontAwesome6 name="x-twitter" size={18} color="white" />
                    </View>
                    <Text style={styles.socialText}>{player.twitter}</Text>
                  </TouchableOpacity>
                )}

                {player.instagram && (
                  <TouchableOpacity style={styles.socialItem}>
                    <View style={[styles.socialIconContainer, { backgroundColor: "#E1306C" }]}>
                      <AntDesign name="instagram" size={18} color="white" />
                    </View>
                    <Text style={styles.socialText}>{player.instagram}</Text>
                  </TouchableOpacity>
                )}

                {player.facebook && (
                  <TouchableOpacity style={styles.socialItem}>
                    <View style={[styles.socialIconContainer, { backgroundColor: "#1877F2" }]}>
                      <Feather name="facebook" size={18} color="white" />
                    </View>
                    <Text style={styles.socialText}>{player.facebook}</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
        <View style={styles.bottomSpacing} />
        </ScrollView>
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
  bottomSpacing: {
    height: 40,
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
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  errorText: {
    fontSize: 18,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: 24,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    marginLeft: 8,
  },
  backButtonOverlay: {
    position: "absolute",
    left: 16,
    top: 60,
    zIndex: 10,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 20,
    padding: 8,
  },
  backgroundImage: {
    position: "absolute",
    bottom: 0,
    resizeMode: "cover",
    opacity: 0.06,
    zIndex: 0,
  },
  header: {
    height: 350,
    position: "relative",
  },
  playerImage: {
    width: "100%",
    height: "100%",
  },
  imageGradient: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 150,
  },
  playerInfoOverlay: {
    position: "absolute",
    bottom: 20,
    left: 20,
    flexDirection: "row",
    alignItems: "center",
    width: "80%",
  },
  playerNumberWrapper: {
    marginRight: 15,
  },
  playerNumberContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  playerNumber: {
    fontSize: 28,
    fontWeight: "bold",
    color: "white",
  },
  playerInfo: {
    padding: 20,
    paddingTop: 24,
  },
  playerName: {
    fontSize: 28,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: 4,
  },
  teamContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  playerTeam: {
    fontSize: 16,
    color: colors.textSecondary,
    marginRight: 12,
  },
  positionPill: {
    backgroundColor: `${colors.primary}20`,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  positionText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: "600",
  },
  basicInfoContainer: {
    marginTop: 8,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  icon: {
    marginRight: 8,
  },
  infoText: {
    fontSize: 14,
    color: colors.text,
  },
  careerHighlightsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.primary,
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  highlightItem: {
    flex: 1,
    alignItems: "center",
  },
  highlightValue: {
    fontSize: 22,
    fontWeight: "bold",
    color: "white",
  },
  highlightLabel: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 4,
  },
  highlightDivider: {
    width: 1,
    height: 40,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  cardContainer: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  bioText: {
    fontSize: 14,
    lineHeight: 22,
    color: colors.text,
  },
  statsColumn: {
    flex: 1,
  },
  statsDivider: {
    width: 1,
    backgroundColor: "rgba(0,0,0,0.1)",
    marginHorizontal: 10,
  },
  socialItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  socialIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  socialText: {
    fontSize: 14,
    color: colors.text,
  },
})
