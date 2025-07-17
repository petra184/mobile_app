"use client"
import type React from "react"
import { View, Text, StyleSheet, ScrollView, Image, Pressable, Linking, Dimensions, FlatList } from "react-native"
import { colors } from "@/constants/colors"
import type { Team } from "@/types/updated_types"
import { getTeamPhotos } from "@/app/actions/teams"
import { Feather } from "@expo/vector-icons"
import Animated, { FadeInDown, withTiming, withSpring, useAnimatedStyle, useSharedValue } from "react-native-reanimated"
import AntDesign from "@expo/vector-icons/AntDesign"
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons"
import FontAwesome6 from "@expo/vector-icons/FontAwesome6"
import { useState, useEffect, useRef } from "react"

const { width: screenWidth } = Dimensions.get("window")

interface TeamInfoTabProps {
  teamId: string
  team: Team
  teamStats: {
    wins: number
    losses: number
    totalPlayers?: number
    totalCoaches?: number
  }
}

// Separate component for each social media button with individual animation
const AnimatedSocialButton = ({
  icon,
  style,
  onPress,
}: {
  icon: React.ReactNode
  style: any
  onPress: () => void
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
        style={[styles.circularButton, style]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        {icon}
      </Pressable>
    </Animated.View>
  )
}

export const TeamInfoTab: React.FC<TeamInfoTabProps> = ({ teamId, team, teamStats }) => {
  const [teamPhotos, setTeamPhotos] = useState<any[]>([])
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
  const flatListRef = useRef<FlatList>(null)

  useEffect(() => {
    const fetchPhotos = async () => {
      try {
        const photos = await getTeamPhotos(teamId)
        setTeamPhotos(photos)
      } catch (error) {
        console.error("Error fetching team photos:", error)
        setTeamPhotos([])
      }
    }
    fetchPhotos()
  }, [teamId])

  const handleSocialPress = (url: string | null) => {
    if (url) {
      Linking.openURL(url)
    }
  }

  const winPercentage =
    teamStats.wins + teamStats.losses > 0
      ? ((teamStats.wins / (teamStats.wins + teamStats.losses)) * 100).toFixed(1)
      : "0.0"

  const renderPhotoItem = ({ item }: { item: any }) => {
    return (
      <View style={styles.photoContainer}>
        <Image
          source={{ uri: item.photo_url }}
          style={styles.photoImage}
          resizeMode="cover"
          onError={(error) => {
            console.log("Image load error:", error.nativeEvent.error)
            console.log("Failed URL:", item.photo_url)
          }}
        />
        <View style={styles.photoOverlay} />
      </View>
    )
  }

  const onPhotoScroll = (event: any) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x
    const currentIndex = Math.round(contentOffsetX / screenWidth)
    setCurrentPhotoIndex(currentIndex)
  }

  const renderPaginationDot = (index: number) => (
    <View key={index} style={[styles.paginationDot, currentPhotoIndex === index && styles.paginationDotActive]} />
  )

  return (
    <View style={styles.container}>
      <Image source={require("../../../IMAGES/crowd.jpg")} style={styles.backgroundImage} />
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Team Photos Carousel */}
        {teamPhotos.length > 0 && (
          <Animated.View entering={FadeInDown.duration(400)} style={styles.photosSection}>
            <FlatList
              ref={flatListRef}
              data={teamPhotos}
              renderItem={renderPhotoItem}
              keyExtractor={(item) => item.id}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={onPhotoScroll}
              scrollEventThrottle={16}
            />
            {/* Pagination Dots */}
            {teamPhotos.length > 1 && (
              <View style={styles.paginationContainer}>{teamPhotos.map((_, index) => renderPaginationDot(index))}</View>
            )}
          </Animated.View>
        )}

        {/* Social Media Links */}
        {(team.socialMedia?.facebook ||
          team.socialMedia?.instagram ||
          team.socialMedia?.twitter ||
          team.socialMedia?.website) && (
          <Animated.View entering={FadeInDown.duration(400).delay(300)} style={styles.detailsSection2}>
            <View style={styles.circularButtonsContainer}>
              {team.socialMedia?.facebook && (
                <AnimatedSocialButton
                  icon={<Feather name="facebook" size={22} color="#FFFFFF" />}
                  style={styles.facebookButton}
                  onPress={() => handleSocialPress(team.socialMedia?.facebook || null)}
                />
              )}
              {team.socialMedia?.instagram && (
                <AnimatedSocialButton
                  icon={<Feather name="instagram" size={22} color="#FFFFFF" />}
                  style={styles.instagramButton}
                  onPress={() => handleSocialPress(team.socialMedia?.instagram || null)}
                />
              )}
              {team.socialMedia?.twitter && (
                <AnimatedSocialButton
                  icon={<FontAwesome6 name="x-twitter" size={22} color="#FFFFFF" />}
                  style={styles.twitterButton}
                  onPress={() => handleSocialPress(team.socialMedia?.twitter || null)}
                />
              )}
              {team.socialMedia?.website && (
                <AnimatedSocialButton
                  icon={<Feather name="globe" size={22} color="#FFFFFF" />}
                  style={styles.websiteButton}
                  onPress={() => handleSocialPress(team.socialMedia?.website || null)}
                />
              )}
            </View>
          </Animated.View>
        )}

        {/* Team Record */}
        <Animated.View entering={FadeInDown.duration(400).delay(100)} style={styles.detailsSection}>
          <Text style={styles.sectionTitle}>Team Record</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <AntDesign name="Trophy" size={24} color={team.primaryColor} style={styles.statCardIcon} />
              <Text style={styles.statCardLabel}>Overall</Text>
              <Text style={styles.statCardValue}>
                {teamStats.wins}-{teamStats.losses}
              </Text>
            </View>
            <View style={styles.statCard}>
              <MaterialCommunityIcons
                name="crown-outline"
                size={25}
                color={team.primaryColor}
                style={styles.statCardIcon}
              />
              <Text style={styles.statCardLabel}>Win %</Text>
              <Text style={styles.statCardValue}>{winPercentage}%</Text>
            </View>
            {teamStats.totalPlayers !== undefined && (
              <View style={styles.statCard}>
                <Feather name="users" size={24} color={team.primaryColor} style={styles.statCardIcon} />
                <Text style={styles.statCardLabel}>Players</Text>
                <Text style={styles.statCardValue}>{teamStats.totalPlayers}</Text>
              </View>
            )}
            {teamStats.totalCoaches !== undefined && (
              <View style={styles.statCard}>
                <Feather name="user-check" size={24} color={team.primaryColor} style={styles.statCardIcon} />
                <Text style={styles.statCardLabel}>Coaches</Text>
                <Text style={styles.statCardValue}>{teamStats.totalCoaches}</Text>
              </View>
            )}
          </View>
        </Animated.View>

        {(() => {
          const aboutArray = JSON.parse(team.about_team || "[]")
          return Array.isArray(aboutArray) && aboutArray.length > 0 ? (
            <Animated.View entering={FadeInDown.duration(400).delay(250)} style={styles.detailsSection}>
              <Text style={styles.sectionTitle}>About the Team</Text>
              {aboutArray.map((item: string, index: number) => (
                <View key={index} style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
                  <Feather name="star" size={20} color={team.primaryColor} style={{ marginRight: 6 }} />
                  <Text style={styles.aboutText}>{item}</Text>
                </View>
              ))}
            </Animated.View>
          ) : null
        })()}
      </ScrollView>
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
    opacity: 0.06,
    zIndex: 0,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  // Photo carousel styles
  photosSection: {
    marginBottom: 24,
    marginHorizontal: -16,
    marginTop: -16, // This negates the container's padding
    borderRadius: 0, // Remove border radius since it goes edge to edge
    overflow: "hidden",
    backgroundColor: colors.card,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  photoContainer: {
    width: screenWidth, // Use full screen width instead of screenWidth - 32
    height: 220,
    position: "relative",
  },
  photoImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  paginationContainer: {
    position: "absolute",
    bottom: 8, // Reduced from 16
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 0, // Removed padding
  },
  paginationDot: {
    width: 5, // Reduced from 6
    height: 5, // Reduced from 6
    borderRadius: 2.5,
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    marginHorizontal: 3,
  },
  paginationDotActive: {
    backgroundColor: "#FFFFFF",
    width: 7, // Reduced from 8
    height: 7, // Reduced from 8
    borderRadius: 3.5,
  },
  teamHeader: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  circularButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
    paddingHorizontal: 20,
  },
  circularButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  facebookButton: {
    backgroundColor: "#1558D6",
  },
  instagramButton: {
    backgroundColor: "#C02CBE",
  },
  twitterButton: {
    backgroundColor: "black",
  },
  websiteButton: {
    backgroundColor: "rgba(0, 103, 0, 0.8)",
  },
  teamLogo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 16,
    backgroundColor: colors.border,
  },
  teamBasicInfo: {
    flex: 1,
  },
  teamFullName: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 4,
  },
  teamSport: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: "500",
    marginBottom: 4,
  },
  teamShortName: {
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: "italic",
  },
  detailsSection: {
    marginBottom: 24,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  detailsSection2: {
    marginBottom: 24,
    borderRadius: 12,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  statCard: {
    width: "48%",
    backgroundColor: colors.background,
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    alignItems: "center",
  },
  statCardIcon: {
    marginBottom: 8,
  },
  statCardLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  statCardValue: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
  },
  infoCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
  },
  socialButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  socialButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 14,
  },
  aboutText: {
    fontSize: 16,
    lineHeight: 22,
    color: colors.text,
  },
  photoOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 20, // Reduced from 50
    backgroundColor: "rgba(0, 0, 0, 0.2)",
  },
})

export default TeamInfoTab