"use client"

import type React from "react"
import { View, Text, StyleSheet, ScrollView, Image, Pressable, Linking } from "react-native"
import { colors } from "@/constants/colors"
import type { Team } from "@/app/actions/teams"
import { Feather } from "@expo/vector-icons"
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated"
import AntDesign from '@expo/vector-icons/AntDesign';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

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

export const TeamInfoTab: React.FC<TeamInfoTabProps> = ({ teamId, team, teamStats }) => {
  const handleSocialPress = (url: string | null) => {
    if (url) {
      Linking.openURL(url)
    }
  }

  const winPercentage =
    teamStats.wins + teamStats.losses > 0
      ? ((teamStats.wins / (teamStats.wins + teamStats.losses)) * 100).toFixed(1)
      : "0.0"

  return (
    <View style={styles.container}>
      <Image source={require("../../IMAGES/crowd.jpg")} style={styles.backgroundImage} />

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>

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
              <MaterialCommunityIcons name="crown-outline" size={25} color={team.primaryColor} style={styles.statCardIcon} />
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

        {/* Team Information */}
        <Animated.View entering={FadeInDown.duration(400).delay(200)} style={styles.detailsSection}>
          <Text style={styles.sectionTitle}>Team Information</Text>

          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Sport</Text>
            <Text style={styles.infoValue}>{team.sport}</Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Gender</Text>
            <Text style={styles.infoValue}>{team.gender}</Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Team ID</Text>
            <Text style={styles.infoValue}>{team.id}</Text>
          </View>

          {team.shortName && (
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>Short Name</Text>
              <Text style={styles.infoValue}>{team.shortName}</Text>
            </View>
          )}
        </Animated.View>

        {/* Social Media Links */}
        {(team.socialMedia?.facebook || team.socialMedia?.instagram || team.socialMedia?.twitter || team.socialMedia?.website) && (
          <Animated.View entering={FadeInDown.duration(400).delay(300)} style={styles.detailsSection}>
            <Text style={styles.sectionTitle}>Connect With Us</Text>
                      <View style={styles.circularButtonsContainer}>
                        {team.socialMedia?.facebook && (
                          <Pressable
                            style={[styles.circularButton, styles.facebookButton]}
                            onPress={() => handleSocialPress(team.socialMedia?.facebook || null)}
                          >
                            <Feather name="facebook" size={22} color="#FFFFFF" />
                          </Pressable>
                        )}
            
                        {team.socialMedia?.instagram && (
                          <Pressable
                            style={[styles.circularButton, styles.instagramButton]}
                            onPress={() => handleSocialPress(team.socialMedia?.instagram || null)}
                          >
                            <Feather name="instagram" size={22} color="#FFFFFF" />
                          </Pressable>
                        )}
            
                        {team.socialMedia?.twitter && (
                          <Pressable
                            style={[styles.circularButton, styles.twitterButton]}
                            onPress={() => handleSocialPress(team.socialMedia?.twitter || null)}
                          >
                            <Feather name="twitter" size={22} color="#FFFFFF" />
                          </Pressable>
                        )}
            
                        {team.socialMedia?.website && (
                          <Pressable
                            style={[styles.circularButton, styles.websiteButton]}
                            onPress={() => handleSocialPress(team.socialMedia?.website || null)}
                          >
                            <Feather name="globe" size={22} color="#FFFFFF" />
                          </Pressable>
                        )}
                      </View>
          </Animated.View>
        )}

        {/* Additional Information */}
        {/* {team.socialMedia?.additional_info && (
          <Animated.View entering={FadeInDown.duration(400).delay(400)} style={styles.detailsSection}>
            <Text style={styles.sectionTitle}>About the Team</Text>
            <Text style={styles.aboutText}>{team.socialMedia?.additional_info || null}</Text>
          </Animated.View>
        )} */}
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
    opacity: 0.1,
    zIndex: 0,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
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
    backgroundColor: "#1877F2",
  },
  instagramButton: {
    backgroundColor: "#E1306C",
  },
  twitterButton: {
    backgroundColor: "#1DA1F2",
  },
  websiteButton: {
    backgroundColor: colors.primary,
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
    fontSize: 14,
    lineHeight: 22,
    color: colors.text,
  },
})

export default TeamInfoTab
