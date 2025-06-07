"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { View, Text, StyleSheet, Pressable, Modal, ScrollView, SafeAreaView, Animated, Dimensions } from "react-native"
import { colors } from "@/constants/colors"
import Feather from "@expo/vector-icons/Feather"
import { supabase } from "@/lib/supabase"

const { width } = Dimensions.get("window")

export interface GameFilterOptions {
  sport?: string
  gender?: "men" | "women"
  status?: "upcoming" | "past" | "live" | "all"
  team?: string
  sortBy?: "date" | "sport" | "status"
  sortOrder?: "asc" | "desc"
}

interface GameFilterProps {
  onFilterChange: (filters: GameFilterOptions) => void
  currentFilters: GameFilterOptions
}

interface Team {
  id: string
  name: string
  short_name: string
  sport: string
  gender: string
  photo: string | null
  color: string | null
}

export const GameFilter: React.FC<GameFilterProps> = ({ onFilterChange, currentFilters }) => {
  const [isVisible, setIsVisible] = useState(false)
  const [tempFilters, setTempFilters] = useState<GameFilterOptions>(currentFilters)
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(false)
  const [slideAnim] = useState(new Animated.Value(width * 0.75))

  // Fetch teams from database
  const fetchTeams = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("teams")
        .select("id, name, short_name, sport, gender, photo, color")
        .order("sport")
        .order("name")

      if (error) {
        console.error("Error fetching teams:", error)
        return
      }

      setTeams(data || [])
    } catch (error) {
      console.error("Unexpected error fetching teams:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isVisible) {
      fetchTeams()
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start()
    } else {
      Animated.timing(slideAnim, {
        toValue: width * 0.75,
        duration: 250,
        useNativeDriver: true,
      }).start()
    }
  }, [isVisible])

  useEffect(() => {
    setTempFilters(currentFilters)
  }, [currentFilters])

  // Get unique sports from teams
  const getUniqueSports = () => {
    const sportsSet = new Set(teams.map((team) => team.sport))
    return Array.from(sportsSet).sort()
  }

  const statuses = [
    { value: "all" as const, label: "All", icon: "calendar", color: "#6B7280" },
    { value: "live" as const, label: "Live", icon: "radio", color: "#EF4444" },
    { value: "upcoming" as const, label: "Upcoming", icon: "clock", color: "#3B82F6" },
    { value: "past" as const, label: "Past", icon: "check-circle", color: "#10B981" },
  ]

  const sortOptions = [
    { value: "date" as const, label: "Date", icon: "calendar" },
    { value: "sport" as const, label: "Sport", icon: "target" },
    { value: "status" as const, label: "Status", icon: "activity" },
  ]

  const handleApplyFilters = () => {
    onFilterChange(tempFilters)
    setIsVisible(false)
  }

  const handleClearFilters = () => {
    const clearedFilters: GameFilterOptions = {
      sport: undefined,
      gender: undefined,
      status: "all",
      team: undefined,
      sortBy: "date",
      sortOrder: "asc",
    }
    setTempFilters(clearedFilters)
    onFilterChange(clearedFilters)
    setIsVisible(false)
  }

  const getActiveFilterCount = () => {
    let count = 0
    if (currentFilters.sport) count++
    if (currentFilters.gender) count++
    if (currentFilters.status && currentFilters.status !== "all") count++
    if (currentFilters.team) count++
    if (currentFilters.sortBy && currentFilters.sortBy !== "date") count++
    return count
  }

  const closeDrawer = () => {
    setIsVisible(false)
  }

  return (
    <>
      {/* Filter Button */}
      <Pressable style={styles.filterButton} onPress={() => setIsVisible(true)}>
        <Feather name="sliders" size={16} color={colors.primary} />
        <Text style={styles.filterButtonText}>Filter</Text>
        {getActiveFilterCount() > 0 && (
          <View style={styles.filterBadge}>
            <Text style={styles.filterBadgeText}>{getActiveFilterCount()}</Text>
          </View>
        )}
      </Pressable>

      {/* Side Drawer Modal */}
      <Modal visible={isVisible} transparent animationType="fade" onRequestClose={closeDrawer}>
        <View style={styles.modalOverlay}>
          {/* Backdrop */}
          <Pressable style={styles.backdrop} onPress={closeDrawer} />

          {/* Drawer */}
          <Animated.View style={[styles.drawer, { transform: [{ translateX: slideAnim }] }]}>
            <SafeAreaView style={styles.drawerContent}>
              {/* Header */}
              <View style={styles.drawerHeader}>
                <Text style={styles.drawerTitle}>Filter & Sort</Text>
                <Pressable onPress={closeDrawer} style={styles.closeButton}>
                  <Feather name="x" size={20} color={colors.text} />
                </Pressable>
              </View>

              {/* Content */}
              <ScrollView style={styles.drawerBody} showsVerticalScrollIndicator={false}>
                {/* Sort Section */}
                <View style={styles.filterSection}>
                  <Text style={styles.sectionTitle}>Sort By</Text>
                  <View style={styles.sortContainer}>
                    {sortOptions.map((option) => (
                      <Pressable
                        key={option.value}
                        style={[styles.sortOption, tempFilters.sortBy === option.value && styles.activeSortOption]}
                        onPress={() => setTempFilters({ ...tempFilters, sortBy: option.value })}
                      >
                        <Feather
                          name={option.icon as any}
                          size={14}
                          color={tempFilters.sortBy === option.value ? "white" : colors.text}
                        />
                        <Text
                          style={[
                            styles.sortOptionText,
                            tempFilters.sortBy === option.value && styles.activeSortOptionText,
                          ]}
                        >
                          {option.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>

                  {/* Sort Order */}
                  <View style={styles.sortOrderContainer}>
                    <Pressable
                      style={[styles.sortOrderButton, tempFilters.sortOrder === "asc" && styles.activeSortOrder]}
                      onPress={() => setTempFilters({ ...tempFilters, sortOrder: "asc" })}
                    >
                      <Feather
                        name="arrow-up"
                        size={14}
                        color={tempFilters.sortOrder === "asc" ? "white" : colors.text}
                      />
                      <Text
                        style={[styles.sortOrderText, tempFilters.sortOrder === "asc" && styles.activeSortOrderText]}
                      >
                        Ascending
                      </Text>
                    </Pressable>
                    <Pressable
                      style={[styles.sortOrderButton, tempFilters.sortOrder === "desc" && styles.activeSortOrder]}
                      onPress={() => setTempFilters({ ...tempFilters, sortOrder: "desc" })}
                    >
                      <Feather
                        name="arrow-down"
                        size={14}
                        color={tempFilters.sortOrder === "desc" ? "white" : colors.text}
                      />
                      <Text
                        style={[styles.sortOrderText, tempFilters.sortOrder === "desc" && styles.activeSortOrderText]}
                      >
                        Descending
                      </Text>
                    </Pressable>
                  </View>
                </View>

                {/* Status Filter */}
                <View style={styles.filterSection}>
                  <Text style={styles.sectionTitle}>Status</Text>
                  <View style={styles.optionsGrid}>
                    {statuses.map((status) => (
                      <Pressable
                        key={status.value}
                        style={[
                          styles.filterOption,
                          (tempFilters.status || "all") === status.value && styles.activeFilterOption,
                        ]}
                        onPress={() => setTempFilters({ ...tempFilters, status: status.value })}
                      >
                        <Feather
                          name={status.icon as any}
                          size={14}
                          color={(tempFilters.status || "all") === status.value ? "white" : status.color}
                        />
                        <Text
                          style={[
                            styles.filterOptionText,
                            (tempFilters.status || "all") === status.value && styles.activeFilterOptionText,
                          ]}
                        >
                          {status.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                {/* Sport Filter */}
                <View style={styles.filterSection}>
                  <Text style={styles.sectionTitle}>Sport</Text>
                  <View style={styles.optionsGrid}>
                    <Pressable
                      style={[styles.filterOption, !tempFilters.sport && styles.activeFilterOption]}
                      onPress={() => setTempFilters({ ...tempFilters, sport: undefined, team: undefined })}
                    >
                      <Feather name="grid" size={14} color={!tempFilters.sport ? "white" : colors.text} />
                      <Text style={[styles.filterOptionText, !tempFilters.sport && styles.activeFilterOptionText]}>
                        All Sports
                      </Text>
                    </Pressable>
                    {getUniqueSports().map((sport) => (
                      <Pressable
                        key={sport}
                        style={[styles.filterOption, tempFilters.sport === sport && styles.activeFilterOption]}
                        onPress={() => setTempFilters({ ...tempFilters, sport, team: undefined })}
                      >
                        <Feather name="target" size={14} color={tempFilters.sport === sport ? "white" : colors.text} />
                        <Text
                          style={[
                            styles.filterOptionText,
                            tempFilters.sport === sport && styles.activeFilterOptionText,
                          ]}
                        >
                          {sport}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                {/* Gender Filter */}
                <View style={styles.filterSection}>
                  <Text style={styles.sectionTitle}>Gender</Text>
                  <View style={styles.optionsGrid}>
                    {[
                      { value: undefined, label: "All", icon: "users" },
                      { value: "men" as const, label: "Men's", icon: "user" },
                      { value: "women" as const, label: "Women's", icon: "user" },
                    ].map((gender) => (
                      <Pressable
                        key={gender.label}
                        style={[styles.filterOption, tempFilters.gender === gender.value && styles.activeFilterOption]}
                        onPress={() => setTempFilters({ ...tempFilters, gender: gender.value })}
                      >
                        <Feather
                          name={gender.icon as any}
                          size={14}
                          color={tempFilters.gender === gender.value ? "white" : colors.text}
                        />
                        <Text
                          style={[
                            styles.filterOptionText,
                            tempFilters.gender === gender.value && styles.activeFilterOptionText,
                          ]}
                        >
                          {gender.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              </ScrollView>

              {/* Footer */}
              <View style={styles.drawerFooter}>
                <Pressable style={styles.clearButton} onPress={handleClearFilters}>
                  <Text style={styles.clearButtonText}>Clear All</Text>
                </Pressable>
                <Pressable style={styles.applyButton} onPress={handleApplyFilters}>
                  <Text style={styles.applyButtonText}>Apply</Text>
                </Pressable>
              </View>
            </SafeAreaView>
          </Animated.View>
        </View>
      </Modal>
    </>
  )
}

// Filter Chips Component for showing active filters
export const FilterChips: React.FC<{ filters: GameFilterOptions; onRemoveFilter: (key: string) => void }> = ({
  filters,
  onRemoveFilter,
}) => {
  const activeFilters = []

  if (filters.sport) activeFilters.push({ key: "sport", label: filters.sport, value: filters.sport })
  if (filters.gender)
    activeFilters.push({ key: "gender", label: filters.gender === "men" ? "Men's" : "Women's", value: filters.gender })
  if (filters.status && filters.status !== "all")
    activeFilters.push({ key: "status", label: filters.status, value: filters.status })
  if (filters.sortBy && filters.sortBy !== "date")
    activeFilters.push({ key: "sortBy", label: `Sort: ${filters.sortBy}`, value: filters.sortBy })

  if (activeFilters.length === 0) return null

  return (
    <View style={styles.filterChipsContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterChipsScroll}>
        {activeFilters.map((filter) => (
          <View key={filter.key} style={styles.filterChip}>
            <Text style={styles.filterChipText}>{filter.label}</Text>
            <Pressable onPress={() => onRemoveFilter(filter.key)} style={styles.filterChipRemove}>
              <Feather name="x" size={12} color={colors.primary} />
            </Pressable>
          </View>
        ))}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "rgba(59, 130, 246, 0.1)",
    borderRadius: 8,
    gap: 4,
    position: "relative",
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary,
  },
  filterBadge: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: "#EF4444",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  filterBadgeText: {
    color: "white",
    fontSize: 10,
    fontWeight: "700",
  },
  modalOverlay: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  drawer: {
    width: width * 0.75,
    backgroundColor: "#FFFFFF",
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  drawerContent: {
    flex: 1,
  },
  drawerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  drawerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
  },
  closeButton: {
    padding: 4,
  },
  drawerBody: {
    flex: 1,
    padding: 20,
  },
  filterSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 12,
  },
  sortContainer: {
    gap: 8,
  },
  sortOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    gap: 8,
  },
  activeSortOption: {
    backgroundColor: colors.primary,
  },
  sortOptionText: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.text,
  },
  activeSortOptionText: {
    color: "white",
  },
  sortOrderContainer: {
    flexDirection: "row",
    marginTop: 8,
    gap: 8,
  },
  sortOrderButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    backgroundColor: "#F9FAFB",
    borderRadius: 6,
    gap: 4,
  },
  activeSortOrder: {
    backgroundColor: colors.primary,
  },
  sortOrderText: {
    fontSize: 12,
    fontWeight: "500",
    color: colors.text,
  },
  activeSortOrderText: {
    color: "white",
  },
  optionsGrid: {
    gap: 8,
  },
  filterOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    gap: 8,
  },
  activeFilterOption: {
    backgroundColor: colors.primary,
  },
  filterOptionText: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.text,
  },
  activeFilterOptionText: {
    color: "white",
  },
  drawerFooter: {
    flexDirection: "row",
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    gap: 12,
  },
  clearButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
    alignItems: "center",
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
  },
  applyButton: {
    flex: 2,
    paddingVertical: 12,
    backgroundColor: colors.primary,
    borderRadius: 8,
    alignItems: "center",
  },
  applyButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "white",
  },
  // Filter Chips Styles
  filterChipsContainer: {
    marginHorizontal: 20,
    marginBottom: 12,
  },
  filterChipsScroll: {
    flexDirection: "row",
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(59, 130, 246, 0.1)",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    gap: 6,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: "500",
    color: colors.primary,
    textTransform: "capitalize",
  },
  filterChipRemove: {
    padding: 2,
  },
})
