"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { View, Text, StyleSheet, Pressable, Modal, ScrollView, SafeAreaView } from "react-native"
import { colors } from "@/constants/colors"
import Feather from "@expo/vector-icons/Feather"
import { supabase } from "@/lib/supabase"
import type { GameFilterOptions } from "@/types/updated_types"

interface GameFilterProps {
  onFilterChange: (filters: GameFilterOptions) => void
  currentFilters: GameFilterOptions
}

interface Team {
  id: string
  name: string
  sport: string // <-- ADDED
}

// Helper component for a consistent button style
const OptionButton = ({
  label,
  onPress,
  isActive,
}: {
  label: string
  onPress: () => void
  isActive: boolean
}) => (
  <Pressable style={[styles.optionButton, isActive && styles.activeOptionButton]} onPress={onPress}>
    <Text style={[styles.optionButtonText, isActive && styles.activeOptionButtonText]}>{label}</Text>
  </Pressable>
)

// Main Filter Component
export const GameFilter: React.FC<GameFilterProps> = ({ onFilterChange, currentFilters }) => {
  const [modalVisible, setModalVisible] = useState(false)
  const [tempFilters, setTempFilters] = useState<GameFilterOptions>(currentFilters)
  const [teams, setTeams] = useState<Team[]>([])
  const [uniqueSports, setUniqueSports] = useState<string[]>([])

  // Fetch teams and derive sports list
  useEffect(() => {
    const fetchTeamsAndSports = async () => {
      // UPDATED: Fetch 'sport' along with id and name
      const { data, error } = await supabase.from("teams").select("id, name, sport").order("name")
      if (data) {
        setTeams(data)
        // Create a unique, sorted list of sports from the teams data
        const sportsSet = new Set(data.map((team) => team.sport))
        setUniqueSports(Array.from(sportsSet).sort())
      }
      if (error) console.error("Error fetching teams:", error)
    }
    fetchTeamsAndSports()
  }, [])

  const handleOpenModal = () => {
    setTempFilters(currentFilters)
    setModalVisible(true)
  }

  const handleApplyFilters = () => {
    onFilterChange(tempFilters)
    setModalVisible(false)
  }

  const handleClearFilters = () => {
    const clearedFilters: GameFilterOptions = { status: "all" }
    setTempFilters(clearedFilters)
    onFilterChange(clearedFilters)
    setModalVisible(false)
  }

  const getActiveFilterCount = () => {
    let count = 0
    if (currentFilters.status && currentFilters.status !== "all") count++
    if (currentFilters.location) count++
    if (currentFilters.teamId) count++
    if (currentFilters.sport) count++ // <-- ADDED
    return count
  }

  const statuses = [
    { value: "all" as const, label: "All" },
    { value: "upcoming" as const, label: "Upcoming" },
    { value: "past" as const, label: "Past" },
    { value: "live" as const, label: "Live" },
  ]

  const locations = [
    { value: undefined, label: "All" },
    { value: "home" as const, label: "Home" },
    { value: "away" as const, label: "Away" },
    { value: "neutral" as const, label: "Neutral" },
  ]
  
  // Filter teams based on the currently selected sport in the modal
  const filteredTeams = tempFilters.sport ? teams.filter((team) => team.sport === tempFilters.sport) : teams

  return (
    <>
      <Pressable style={styles.filterButton} onPress={handleOpenModal}>
        <Feather name="sliders" size={16} color={colors.primary} />
        <Text style={styles.filterButtonText}>Filter</Text>
        {getActiveFilterCount() > 0 && (
          <View style={styles.filterBadge}>
            <Text style={styles.filterBadgeText}>{getActiveFilterCount()}</Text>
          </View>
        )}
      </Pressable>

      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
          <SafeAreaView style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Filter Games</Text>
              <Pressable onPress={() => setModalVisible(false)} style={styles.closeButton}>
                <Feather name="x" size={24} color={colors.textSecondary} />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.scrollViewContent}>
              {/* Status Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.sectionTitle}>Status</Text>
                <View style={styles.optionsContainer}>
                  {statuses.map((s) => (
                    <OptionButton
                      key={s.value}
                      label={s.label}
                      isActive={tempFilters.status === s.value}
                      onPress={() => setTempFilters({ ...tempFilters, status: s.value })}
                    />
                  ))}
                </View>
              </View>

              {/* Location Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.sectionTitle}>Location</Text>
                <View style={styles.optionsContainer}>
                  {locations.map((l) => (
                    <OptionButton
                      key={l.label}
                      label={l.label}
                      isActive={tempFilters.location === l.value}
                      onPress={() => setTempFilters({ ...tempFilters, location: l.value })}
                    />
                  ))}
                </View>
              </View>

              {/* Team Filter - Now uses filteredTeams */}
              <View style={styles.filterSection}>
                <Text style={styles.sectionTitle}>Team</Text>
                <View style={styles.optionsContainer}>
                  <OptionButton
                    label="All Teams"
                    isActive={!tempFilters.teamId}
                    onPress={() => setTempFilters({ ...tempFilters, teamId: undefined })}
                  />
                  {filteredTeams.map((team) => (
                    <OptionButton
                      key={team.id}
                      label={team.name}
                      isActive={tempFilters.teamId === team.id}
                      onPress={() => setTempFilters({ ...tempFilters, teamId: team.id })}
                    />
                  ))}
                </View>
              </View>
            </ScrollView>

            <View style={styles.footer}>
              <Pressable style={styles.clearButton} onPress={handleClearFilters}>
                <Text style={styles.clearButtonText}>Clear All</Text>
              </Pressable>
              <Pressable style={styles.applyButton} onPress={handleApplyFilters}>
                <Text style={styles.applyButtonText}>Apply Filters</Text>
              </Pressable>
            </View>
          </SafeAreaView>
        </Pressable>
      </Modal>
    </>
  )
}

// --- Styles (Unchanged) ---
const styles = StyleSheet.create({
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.background,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary,
  },
  filterBadge: {
    position: "absolute",
    top: -5,
    right: -5,
    backgroundColor: colors.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "white",
  },
  filterBadgeText: {
    color: "white",
    fontSize: 10,
    fontWeight: "700",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
    paddingTop: 12,
  },
  header: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 12,
    paddingTop:10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  closeButton: {
    position: "absolute",
    right: 16,
    padding: 4,
  },
  scrollViewContent: {
    padding: 20,
    gap: 24,
  },
  filterSection: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
  },
  optionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  optionButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  activeOptionButton: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  optionButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.text,
  },
  activeOptionButtonText: {
    color: "white",
  },
  footer: {
    flexDirection: "row",
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 12,
  },
  clearButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: colors.background,
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  applyButton: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: colors.primary,
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
  },
})