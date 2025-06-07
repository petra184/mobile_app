"use client"

import type React from "react"
import { useState } from "react"
import { View, Text, StyleSheet, StatusBar, Pressable, TouchableOpacity } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { TeamSelector } from "@/components/teams/TEAMSELECTOR2"
import { colors } from "@/constants/colors"
import type { Team } from "@/app/actions/teams"
import Feather from "@expo/vector-icons/Feather"
import { useRouter } from "expo-router"
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue } from "react-native-reanimated"

type GenderFilter = "all" | "men" | "women"

const TeamsPage: React.FC = () => {
  const [selectedGenderFilter, setSelectedGenderFilter] = useState<GenderFilter>("all")
  const router = useRouter()

  const handleTeamPress = (team: Team) => {
    router.push({
      pathname: "../teams",
      params: { id: team.id },
    })
  }

  const getTeamCount = (filter: GenderFilter): string => {
    switch (filter) {
      case "all":
        return "All Teams"
      case "men":
        return "Men's Teams"
      case "women":
        return "Women's Teams"
      default:
        return "Teams"
    }
  }

  const FilterButton = ({
    filter,
    label,
    isActive,
    icon,
  }: {
    filter: GenderFilter
    label: string
    isActive: boolean
    icon?: string
  }) => (
    <Pressable
      style={[styles.filterButton, isActive && styles.activeFilterButton]}
      onPress={() => {
        console.log("Filter changed to:", filter)
        setSelectedGenderFilter(filter)
      }}
    >
      {icon && (
        <Feather
          name={icon as any}
          size={16}
          color={isActive ? "white" : colors.textSecondary}
          style={styles.filterIcon}
        />
      )}
      <Text style={[styles.filterButtonText, isActive && styles.activeFilterButtonText]}>{label}</Text>
    </Pressable>
  )

  const scale = useSharedValue(1)
  const opacity = useSharedValue(1)
      
   const animatedStyle = useAnimatedStyle(() => ({
     transform: [{ scale: scale.value }],
     opacity: opacity.value,
    }))

  return (
    <SafeAreaView style={styles.container} edges={["left"]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      {/* Header */}
      <View style={styles.header}>

        {/* Professional Gender Filter */}
        <View style={styles.tabContainer}>
        <TouchableOpacity
            style={[styles.tab, selectedGenderFilter === 'all' && styles.activeTab]}
            onPress={() => setSelectedGenderFilter('all')}
        >
            <Text
            style={[
                styles.tabText,
                selectedGenderFilter === 'all' && styles.activeTabText,
            ]}
            >
            All Teams
            </Text>
        </TouchableOpacity>

        <TouchableOpacity
            style={[styles.tab, selectedGenderFilter === 'women' && styles.activeTab]}
            onPress={() => setSelectedGenderFilter('women')}
        >
            <Text
            style={[
                styles.tabText,
                selectedGenderFilter === 'women' && styles.activeTabText,
            ]}
            >
            Women's
            </Text>
        </TouchableOpacity>

        <TouchableOpacity
            style={[styles.tab, selectedGenderFilter === 'men' && styles.activeTab]}
            onPress={() => setSelectedGenderFilter('men')}
        >
            <Text
            style={[
                styles.tabText,
                selectedGenderFilter === 'men' && styles.activeTabText,
            ]}
            >
            Men's
            </Text>
        </TouchableOpacity>
        </View>
      </View>

      {/* Teams List */}
     
      <View style={styles.content}>
      <Animated.View entering={FadeInDown.duration(400).delay(300)} style={{ flex: 1 }}>
        <TeamSelector
          key={selectedGenderFilter} // Force re-render when filter changes
          onTeamPress={handleTeamPress}
          showFavorites={true}
          horizontal={false}
          allowMultiSelect={false}
          filterByGender={selectedGenderFilter}
          layoutStyle="grid" // Use grid layout for all teams page
        />
        </Animated.View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 0,
    backgroundColor: colors.background,
  },
  backgroundImage: {
    position: "absolute",
    bottom:0,
    resizeMode: "cover",
    opacity: 0.03,
    zIndex: 0,
  },
  header: {
    backgroundColor: colors.background,
    paddingHorizontal: 10,
    paddingTop: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: colors.primary + '15',
  },
  tabIcon: {
    marginRight: 6,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text + '80',
  },
  activeTabText: {
    color: colors.primary,
    fontWeight: '700',
  },
  filterButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  activeFilterButton: {
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  filterIcon: {
    marginRight: 6,
  },
  filterButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  activeFilterButtonText: {
    color: "white",
  },
  content: {
    flex: 1,
    backgroundColor: colors.background,
  },
})

export default TeamsPage
