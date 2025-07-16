"use client"
import { StyleSheet, Text, View, ScrollView, Platform, TouchableOpacity, Image, ActivityIndicator } from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { colors } from "@/constants/colors"
import SectionHeader from "@/components/teams/SectionHeader"
import { StatusBar } from "expo-status-bar"
import { useState, useEffect } from "react"
import { SafeAreaView } from "react-native-safe-area-context"
import { useLocalSearchParams, useRouter } from "expo-router"
import { getCoachDetails } from "@/app/actions/info_teams"
import AntDesign from "@expo/vector-icons/AntDesign"
import Feather from "@expo/vector-icons/Feather"
import FontAwesome6 from "@expo/vector-icons/FontAwesome6"
import FontAwesome from "@expo/vector-icons/FontAwesome"
// Define the Coach type based on database structure
export type CoachData = {
  id: string
  first_name: string | null
  last_name: string | null
  title: string | null
  coaching_experience: string | null
  image: string | null
  bio: string | null
  birthdate: string | null
  age: number | null
  origin: string | null
  education: string | null
  achievements: string | null
  coaching_year: string | null
  twitter: string | null
  instagram: string | null
  facebook: string | null
  team_id: string
}

export default function CoachProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const [coach, setCoach] = useState<CoachData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (id) {
      fetchCoachData(id)
    }
  }, [id])

  const fetchCoachData = async (coachId: string) => {
    try {
      setLoading(true)
      setError(null)
      const coachData = await getCoachDetails(coachId)

      if (coachData) {
        setCoach(coachData)
      } else {
        setError("Coach not found")
      }
    } catch (err) {
      console.error("Error fetching coach data:", err)
      setError("Failed to load coach data")
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

  const getCoachName = (coach: CoachData): string => {
    return `${coach.first_name || ""} ${coach.last_name || ""}`.trim() || "Unknown Coach"
  }

  // Parse achievements from string to array
  const parseAchievements = (achievements: string | null): string[] => {
    if (!achievements) return []
    try {
      // Try to parse as JSON array first
      return JSON.parse(achievements)
    } catch {
      // If not JSON, split by common delimiters
      return achievements
        .split(/[,;|\n]/)
        .map((item) => item.trim())
        .filter(Boolean)
    }
  }

  // Loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading coach profile...</Text>
        </View>
      </SafeAreaView>
    )
  }

  // Error state
  if (error || !coach) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error || "Coach not found"}</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Feather name="chevron-left" size={20} color="#fff" />
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  const achievements = parseAchievements(coach.achievements)

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
              source={{ uri: coach.image || "https://via.placeholder.com/400x400?text=Coach" }}
              style={styles.coachImage}
              resizeMethod="auto"
            />
            <LinearGradient colors={["transparent", "rgba(0,0,0,0.7)"]} style={styles.imageGradient} />
          </View>

          {/* Coach Basic Info*/}
          <View style={styles.coachInfo}>
            <Text style={styles.coachName}>{getCoachName(coach)}</Text>
            <View style={styles.teamContainer}>
              {coach.title && (
                <View style={styles.positionPill}>
                  <Text style={styles.positionText}>{coach.title}</Text>
                </View>
              )}
            </View>

            <View style={styles.basicInfoContainer}>
              {coach.origin && (
                <View style={styles.infoRow}>
                  <Feather name="map-pin" size={16} color={colors.primary} style={styles.icon} />
                  <Text style={styles.infoText}>{coach.origin}</Text>
                </View>
              )}
              {coach.coaching_experience && (
                <View style={styles.infoRow}>
                  <Feather name="briefcase" size={16} color={colors.primary} style={styles.icon} />
                  <Text style={styles.infoText}>{coach.coaching_experience} of coaching experience</Text>
                </View>
              )}
              {coach.birthdate && (
                <View style={styles.infoRow}>
                  <FontAwesome name="birthday-cake" size={16} color={colors.primary} style={styles.icon} />
                  <Text style={styles.infoText}>{`${calculateAge(coach.birthdate)} years old`}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Career Highlights */}
          <View style={styles.careerHighlightsContainer}>
            <View style={styles.highlightItem}>
              <Text style={styles.highlightValue}>{coach.coaching_year || "N/A"}</Text>
              <Text style={styles.highlightLabel}>Coaching Year</Text>
            </View>
            <View style={styles.highlightDivider} />
            <View style={styles.highlightItem}>
              <Text style={styles.highlightValue}>{achievements.length}</Text>
              <Text style={styles.highlightLabel}>Achievements</Text>
            </View>
          </View>

          {/* Bio Section */}
          {coach.bio && (
            <View style={styles.section}>
              <SectionHeader title="Biography" icon="user" />
              <View style={styles.cardContainer}>
                <Text style={styles.bioText}>{coach.bio}</Text>
              </View>
            </View>
          )}

          {/* Education Section */}
          {coach.education && (
            <View style={styles.section}>
              <View style={styles.titleSection}>
                <AntDesign name="book" size={16} color={colors.primary} style={styles.titleIcon} />
                <SectionHeader title="Education" />
              </View>
              <View style={styles.cardContainer}>
                <View style={styles.educationItem}>
                  <Text style={styles.educationText}>{coach.education}</Text>
                </View>
              </View>
            </View>
          )}

          {/* Coaching Experience Section */}
          {coach.coaching_experience && (
            <View style={styles.section}>
              <View style={styles.titleSection}>
                <Feather name="briefcase" size={16} color={colors.primary} style={styles.xxx} />
                <SectionHeader title="Coaching Experience" />
              </View>
              <View style={styles.cardContainer}>
                <View style={styles.experienceItem}>
                  <Text style={styles.experienceText}>{coach.coaching_experience}</Text>
                </View>
              </View>
            </View>
          )}

          {/* Achievements Section */}
          {achievements.length > 0 && (
            <View style={styles.section}>
              <SectionHeader title="Achievements" icon="award" />
              <View style={styles.cardContainer}>
                {achievements.map((achievement, index) => (
                  <View key={index} style={styles.achievementItem}>
                    <Text style={styles.achievementText}>{achievement}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Social Media */}
          {(coach.twitter || coach.instagram || coach.facebook) && (
            <View style={styles.section}>
              <SectionHeader title="Social Media" icon="share" />
              <View style={styles.cardContainer}>
                {coach.twitter && (
                  <TouchableOpacity style={styles.socialItem}>
                    <View style={[styles.socialIconContainer, { backgroundColor: "black" }]}>
                      <FontAwesome6 name="x-twitter" size={18} color="white" />
                    </View>
                    <Text style={styles.socialText}>{coach.twitter}</Text>
                  </TouchableOpacity>
                )}

                {coach.instagram && (
                  <TouchableOpacity style={styles.socialItem}>
                    <View style={[styles.socialIconContainer, { backgroundColor: "#E1306C" }]}>
                      <AntDesign name="instagram" size={18} color="white" />
                    </View>
                    <Text style={styles.socialText}>{coach.instagram}</Text>
                  </TouchableOpacity>
                )}

                {coach.facebook && (
                  <TouchableOpacity style={styles.socialItem}>
                    <View style={[styles.socialIconContainer, { backgroundColor: "#1877F2" }]}>
                      <Feather name="facebook" size={18} color="white" />
                    </View>
                    <Text style={styles.socialText}>{coach.facebook}</Text>
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
  coachImage: {
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
  coachInfo: {
    padding: 20,
    paddingTop: 24,
  },
  coachName: {
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
  titleSection: {
    flexDirection: "row",
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
    textAlign: "center",
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
    borderRadius: 12,
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
  achievementItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  achievementIcon: {
    marginRight: 10,
  },
  titleIcon: {
    marginRight: 10,
    paddingTop: 4,
  },
  xxx: {
    marginRight: 10,
    marginTop: 4,
  },
  achievementText: {
    fontSize: 14,
    color: colors.text,
    flex: 1,
  },
  experienceItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  experienceText: {
    fontSize: 14,
    color: colors.text,
    flex: 1,
  },
  educationItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  educationText: {
    fontSize: 14,
    color: colors.text,
    flex: 1,
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