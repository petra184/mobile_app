"use client"

import type React from "react"
import { useState } from "react"
import { View, Text, StyleSheet, SafeAreaView, StatusBar, Pressable } from "react-native"
import { TeamSelector } from "@/components/teams/TEAMSELECTOR2"
import { colors } from "@/constants/colors"
import type { Team } from "@/app/actions/teams"
import Feather from "@expo/vector-icons/Feather"

type GenderFilter = "all" | "men" | "women"

const TeamsPage: React.FC = () => {
  const [selectedGenderFilter, setSelectedGenderFilter] = useState<GenderFilter>("all")

  const handleTeamPress = (team: Team) => {
    // Handle team press - navigate to team details, etc.
    console.log("Team pressed:", team.name, "Gender:", team.gender)
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

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      {/* Header */}
      <View style={styles.header}>
        
        {/* Professional Gender Filter */}
        <View style={styles.filterContainer}>
          <FilterButton filter="all" label="All Teams" isActive={selectedGenderFilter === "all"} icon="users" />
          <FilterButton filter="women" label="Women's" isActive={selectedGenderFilter === "women"} icon="user" />
          <FilterButton filter="men" label="Men's" isActive={selectedGenderFilter === "men"} icon="user" />
        </View>
      </View>

      {/* Teams List */}
      <View style={styles.content}>
        <TeamSelector
          key={selectedGenderFilter} // Force re-render when filter changes
          onTeamPress={handleTeamPress}
          showFavorites={true}
          horizontal={false}
          allowMultiSelect={false}
          filterByGender={selectedGenderFilter}
          layoutStyle="grid" // Use grid layout for all teams page
        />
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filterContainer: {
    flexDirection: "row",
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
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
    paddingTop:20,
    backgroundColor: colors.background,
  },
})

export default TeamsPage
