"use client"

import type React from "react"
import { useState } from "react"
import { View, Text, StyleSheet, Pressable, Modal, ScrollView, SafeAreaView } from "react-native"
import { colors } from "@/constants/colors"
import Feather from "@expo/vector-icons/Feather"
import { LinearGradient } from "expo-linear-gradient"

export interface GameFilterOptions {
  sport?: string
  gender?: "men" | "women"
  status?: "upcoming" | "past" | "live" | "all"
}

interface GameFilterProps {
  onFilterChange: (filters: GameFilterOptions) => void
  currentFilters: GameFilterOptions
}

export const GameFilter: React.FC<GameFilterProps> = ({ onFilterChange, currentFilters }) => {
  const [isVisible, setIsVisible] = useState(false)
  const [tempFilters, setTempFilters] = useState<GameFilterOptions>(currentFilters)

  const sports = ["Basketball", "Football", "Soccer", "Baseball", "Tennis", "Volleyball"]
  const genders = [
    { value: undefined, label: "All" },
    { value: "men" as const, label: "Men's" },
    { value: "women" as const, label: "Women's" },
  ]
  const statuses = [
    { value: "all" as const, label: "All Games" },
    { value: "live" as const, label: "Live" },
    { value: "upcoming" as const, label: "Upcoming" },
    { value: "past" as const, label: "Past" },
  ]

  const handleApplyFilters = () => {
    onFilterChange(tempFilters)
    setIsVisible(false)
  }

  const handleClearFilters = () => {
    const clearedFilters = { sport: undefined, gender: undefined, status: "all" as const }
    setTempFilters(clearedFilters)
    onFilterChange(clearedFilters)
    setIsVisible(false)
  }

  const getActiveFilterCount = () => {
    let count = 0
    if (currentFilters.sport) count++
    if (currentFilters.gender) count++
    if (currentFilters.status && currentFilters.status !== "all") count++
    return count
  }

  const renderFilterOption = (
    title: string,
    options: Array<{ value: any; label: string }>,
    currentValue: any,
    onSelect: (value: any) => void,
  ) => (
    <View style={styles.filterSection}>
      <Text style={styles.filterSectionTitle}>{title}</Text>
      <View style={styles.filterOptions}>
        {options.map((option) => (
          <Pressable
            key={option.label}
            style={[styles.filterOption, currentValue === option.value && styles.activeFilterOption]}
            onPress={() => onSelect(option.value)}
          >
            <Text style={[styles.filterOptionText, currentValue === option.value && styles.activeFilterOptionText]}>
              {option.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  )

  return (
    <>
      <Pressable style={styles.filterButton} onPress={() => setIsVisible(true)}>
        <Feather name="filter" size={16} color={colors.primary} />
        {getActiveFilterCount() > 0 && (
          <View style={styles.filterBadge}>
            <Text style={styles.filterBadgeText}>{getActiveFilterCount()}</Text>
          </View>
        )}
      </Pressable>

      <Modal visible={isVisible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <LinearGradient colors={["rgba(255,255,255,0.95)", "rgba(255,255,255,1)"]} style={styles.modalHeader}>
            <View style={styles.modalHeaderContent}>
              <Pressable onPress={() => setIsVisible(false)}>
                <Feather name="x" size={24} color={colors.text} />
              </Pressable>
              <Text style={styles.modalTitle}>Filter Games</Text>
              <Pressable onPress={handleClearFilters}>
                <Text style={styles.clearButton}>Clear</Text>
              </Pressable>
            </View>
          </LinearGradient>

          <ScrollView style={styles.modalContent}>
            {/* Sport Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Sport</Text>
              <View style={styles.filterOptions}>
                <Pressable
                  style={[styles.filterOption, !tempFilters.sport && styles.activeFilterOption]}
                  onPress={() => setTempFilters({ ...tempFilters, sport: undefined })}
                >
                  <Text style={[styles.filterOptionText, !tempFilters.sport && styles.activeFilterOptionText]}>
                    All Sports
                  </Text>
                </Pressable>
                {sports.map((sport) => (
                  <Pressable
                    key={sport}
                    style={[styles.filterOption, tempFilters.sport === sport && styles.activeFilterOption]}
                    onPress={() => setTempFilters({ ...tempFilters, sport })}
                  >
                    <Text
                      style={[styles.filterOptionText, tempFilters.sport === sport && styles.activeFilterOptionText]}
                    >
                      {sport}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Gender Filter */}
            {renderFilterOption("Gender", genders, tempFilters.gender, (gender) =>
              setTempFilters({ ...tempFilters, gender }),
            )}

            {/* Status Filter */}
            {renderFilterOption("Game Status", statuses, tempFilters.status || "all", (status) =>
              setTempFilters({ ...tempFilters, status }),
            )}
          </ScrollView>

          <View style={styles.modalFooter}>
            <Pressable style={styles.applyButton} onPress={handleApplyFilters}>
              <Text style={styles.applyButtonText}>Apply Filters</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </Modal>
    </>
  )
}

const styles = StyleSheet.create({
  filterButton: {
    backgroundColor: "rgba(59, 130, 246, 0.1)",
    padding: 8,
    borderRadius: 8,
    position: "relative",
  },
  filterBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#EF4444",
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  filterBadgeText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  modalHeaderContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
  },
  clearButton: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.primary,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  filterSection: {
    marginBottom: 32,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 12,
  },
  filterOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  filterOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "rgba(107, 114, 128, 0.1)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "transparent",
  },
  activeFilterOption: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterOptionText: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.text,
  },
  activeFilterOptionText: {
    color: "white",
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  applyButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  applyButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
})
