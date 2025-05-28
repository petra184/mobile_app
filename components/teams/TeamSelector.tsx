"use client"

import React, { useState } from "react"
import { View, Text, StyleSheet, FlatList, Pressable, Image } from "react-native"
import type { Team } from "@/app/actions/teams"
import { colors } from "@/constants/colors"
import { useUserStore } from "@/store/userStore"
import { Heart } from "lucide-react-native"
import Animated, { useAnimatedStyle, withTiming, useSharedValue } from "react-native-reanimated"

interface TeamSelectorProps {
  teams: Team[]
  onSelectTeam?: (team: Team) => void
  onTeamPress?: (team: Team) => void
  showFavorites?: boolean
  horizontal?: boolean
}

const TeamItem = React.memo(
  ({
    team,
    isSelected,
    isFavorite,
    onPress,
    onFavoriteToggle,
    showFavorites,
  }: {
    team: Team
    isSelected: boolean
    isFavorite: boolean
    onPress: () => void
    onFavoriteToggle: () => void
    showFavorites: boolean
  }) => {
    // Create a single shared value for this specific item
    const scale = useSharedValue(1)

    const animatedStyle = useAnimatedStyle(() => {
      return {
        transform: [{ scale: scale.value }],
      }
    })

    const handlePressIn = () => {
      scale.value = withTiming(0.97, { duration: 100 })
    }

    const handlePressOut = () => {
      scale.value = withTiming(1, { duration: 150 })
    }

    // Create a color with reduced opacity for the background
    const teamColorBackground = `${team.primaryColor}15` // 15 is hex for ~8% opacity

    return (
      <Animated.View style={animatedStyle}>
        <Pressable
          style={[
            styles.teamItem,
            isSelected && styles.selectedTeamItem,
            {
              borderColor: isSelected ? team.primaryColor : colors.border,
              backgroundColor: isSelected ? teamColorBackground : colors.card,
            },
          ]}
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          android_ripple={{ color: "rgba(0, 0, 0, 0.1)", borderless: false }}
        >
          {/* Color accent bar */}
          <View style={[styles.colorAccent, { backgroundColor: team.primaryColor }]} />

          <Image source={{ uri: team.logo }} style={styles.teamLogo} resizeMode="contain" />

          <Text style={[styles.teamName, { color: team.primaryColor }]} numberOfLines={1} ellipsizeMode="tail">
            {team.shortName}
          </Text>

          {showFavorites && (
            <Pressable
              style={styles.favoriteButton}
              onPress={onFavoriteToggle}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Heart
                size={20}
                color={isFavorite ? colors.error : colors.textSecondary}
                fill={isFavorite ? colors.error : "transparent"}
                strokeWidth={2}
              />
            </Pressable>
          )}
        </Pressable>
      </Animated.View>
    )
  },
)

export const TeamSelector: React.FC<TeamSelectorProps> = ({
  teams,
  onSelectTeam,
  onTeamPress,
  showFavorites = true,
  horizontal = true,
}) => {
  const { preferences, toggleFavoriteTeam } = useUserStore()
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null)

  const handleSelectTeam = (team: Team) => {
    setSelectedTeamId(team.id)
    if (onSelectTeam) {
      onSelectTeam(team)
    }
  }

  const handleTeamPress = (team: Team) => {
    if (onTeamPress) {
      onTeamPress(team)
    } else {
      handleSelectTeam(team)
    }
  }

  const renderTeamItem = ({ item }: { item: Team }) => {
    const isSelected = selectedTeamId === item.id
    const isFavorite = preferences.favoriteTeams.includes(item.id)

    return (
      <View style={{ marginRight: horizontal ? 12 : 0, marginBottom: horizontal ? 0 : 12 }}>
        <TeamItem
          team={item}
          isSelected={isSelected}
          isFavorite={isFavorite}
          onPress={() => handleTeamPress(item)}
          onFavoriteToggle={() => toggleFavoriteTeam(item.id)}
          showFavorites={showFavorites}
        />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={teams}
        renderItem={renderTeamItem}
        keyExtractor={(item) => item.id}
        horizontal={horizontal}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={horizontal ? styles.horizontalList : styles.verticalList}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  horizontalList: {
    paddingHorizontal: 16,
  },
  verticalList: {
    padding: 16,
  },
  teamItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderColor: colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 3,
    minWidth: 130,
    position: "relative",
    overflow: "hidden",
  },
  selectedTeamItem: {
    shadowOpacity: 0.15,
    elevation: 4,
  },
  colorAccent: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  teamLogo: {
    width: 32,
    height: 32,
    marginRight: 12,
  },
  teamName: {
    fontSize: 15,
    fontWeight: "600",
    flex: 1,
  },
  favoriteButton: {
    padding: 8,
    marginLeft: 4,
    justifyContent: "center",
    alignItems: "center",
  },
})

export default TeamSelector
