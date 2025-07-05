"use client"
import { useState } from "react"
import { StyleSheet, View, Text, TouchableOpacity } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { colors } from "@/constants/colors"
import type { FormData } from "@/app/(auth)/signup"
import { SwipeableTeamSelector } from "@/components/teams/SwipingCard"
import { TeamSelector } from "@/components/teams/TEAMSELECTOR2"
import type { Team } from "@/app/actions/teams"

interface TeamSelectionStepProps {
  formData: FormData
  updateFormData: (updates: Partial<FormData>) => void
  onNext: () => void
}

export default function TeamSelectionStep({ formData, updateFormData, onNext }: TeamSelectionStepProps) {
  const [viewMode, setViewMode] = useState<"swipe" | "grid">("swipe")

  const handleTeamSelect = (team: Team) => {
    const currentFavorites = formData.favoriteTeams
    const isCurrentlyFavorite = currentFavorites.includes(team.id)
    let newFavorites: string[]

    if (isCurrentlyFavorite) {
      newFavorites = currentFavorites.filter((id) => id !== team.id)
    } else {
      newFavorites = [...currentFavorites, team.id]
    }

    updateFormData({ favoriteTeams: newFavorites })
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerSection}>
        <Text style={styles.subHeaderText}>Choose your favorite teams for early updates!</Text>

        {/* Compact header with toggle and count */}
        <View style={styles.compactHeader}>
          {/* View Mode Toggle */}
          <View style={styles.toggleContainer}>
            <TouchableOpacity
              style={[styles.toggleButton, viewMode === "swipe" && styles.toggleButtonActive]}
              onPress={() => setViewMode("swipe")}
            >
              <Ionicons name="layers-outline" size={14} color={viewMode === "swipe" ? "white" : colors.primary} />
              <Text style={[styles.toggleText, viewMode === "swipe" && styles.toggleTextActive]}>Swipe</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleButton, viewMode === "grid" && styles.toggleButtonActive]}
              onPress={() => setViewMode("grid")}
            >
              <Ionicons name="grid-outline" size={14} color={viewMode === "grid" ? "white" : colors.primary} />
              <Text style={[styles.toggleText, viewMode === "grid" && styles.toggleTextActive]}>Grid</Text>
            </TouchableOpacity>
          </View>

          {/* Selected count badge */}
          <View style={styles.selectedBadge}>
            <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
            <Text style={styles.selectedBadgeText}>{formData.favoriteTeams.length} selected</Text>
          </View>
        </View>
      </View>

      {/* Content Area */}
      <View style={styles.contentContainer}>
        {viewMode === "swipe" ? (
          <SwipeableTeamSelector
            onSelectTeam={handleTeamSelect}
            onTeamPress={handleTeamSelect}
            showFavorites={false}
            filterByGender="all"
          />
        ) : (
          <TeamSelector
            onSelectTeam={handleTeamSelect}
            onTeamPress={handleTeamSelect}
            showFavorites={false}
            allowMultiSelect={true}
            maxSelections={10}
            layoutStyle="grid"
            filterByGender="all"
          />
        )}
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.continueButton} onPress={onNext}>
          <Text style={styles.continueButtonText}>
            {formData.favoriteTeams.length > 0 ? "Continue" : "Skip for Now"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerSection: {
    padding: 24,
    paddingBottom: 12,
  },
  subHeaderText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 20,
  },
  compactHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  toggleContainer: {
    flexDirection: "row",
    backgroundColor: "#F5F5F5",
    borderRadius: 10,
    padding: 3,
  },
  toggleButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 7,
    gap: 4,
  },
  toggleButtonActive: {
    backgroundColor: colors.primary,
  },
  toggleText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.primary,
  },
  toggleTextActive: {
    color: "white",
  },
  selectedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: `${colors.primary}15`,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  selectedBadgeText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.primary,
  },
  contentContainer: {
    flex: 1,
  },
  buttonContainer: {
    padding: 24,
  },
  continueButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  continueButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
})
