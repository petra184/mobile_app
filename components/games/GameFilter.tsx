"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { View, Text, StyleSheet, Pressable, Modal, ScrollView, SafeAreaView, Image, ActivityIndicator } from "react-native"
import { colors } from "@/constants/colors"
import Feather from "@expo/vector-icons/Feather"
import { LinearGradient } from "expo-linear-gradient"
import { supabase } from "@/lib/supabase"
import type { Tables } from "@/types/supabase"

export interface GameFilterOptions {
  sport?: string
  gender?: "men" | "women"
  status?: "upcoming" | "past" | "live" | "all"
  team?: string
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
  const [activeSection, setActiveSection] = useState<string | null>(null)

  // Fetch teams from database
  const fetchTeams = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('teams')
        .select('id, name, short_name, sport, gender, photo, color')
        .order('sport')
        .order('name')

      if (error) {
        console.error('Error fetching teams:', error)
        return
      }

      setTeams(data || [])
    } catch (error) {
      console.error('Unexpected error fetching teams:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isVisible) {
      fetchTeams()
    }
  }, [isVisible])

  // Get unique sports from teams
  const getUniqueSports = () => {
    const sportsSet = new Set(teams.map(team => team.sport))
    return Array.from(sportsSet).sort()
  }

  // Get teams filtered by current sport selection
  const getFilteredTeams = () => {
    if (!tempFilters.sport) return teams
    return teams.filter(team => team.sport === tempFilters.sport)
  }

  const genders = [
    { value: undefined, label: "All", icon: "users" },
    { value: "men" as const, label: "Men's", icon: "user" },
    { value: "women" as const, label: "Women's", icon: "user" },
  ]

  const statuses = [
    { value: "all" as const, label: "All Games", icon: "calendar", color: "#6B7280" },
    { value: "live" as const, label: "Live", icon: "radio", color: "#EF4444" },
    { value: "upcoming" as const, label: "Upcoming", icon: "clock", color: "#3B82F6" },
    { value: "past" as const, label: "Past", icon: "check-circle", color: "#10B981" },
  ]

  const handleApplyFilters = () => {
    onFilterChange(tempFilters)
    setIsVisible(false)
  }

  const handleClearFilters = () => {
    const clearedFilters = { sport: undefined, gender: undefined, status: "all" as const, team: undefined }
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
    return count
  }

  const toggleSection = (section: string) => {
    setActiveSection(activeSection === section ? null : section)
  }

  const renderSectionHeader = (title: string, sectionKey: string, icon: string) => (
    <Pressable 
      style={styles.sectionHeader} 
      onPress={() => toggleSection(sectionKey)}
    >
      <View style={styles.sectionHeaderLeft}>
        <Feather name={icon as any} size={20} color={colors.primary} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <Feather 
        name={activeSection === sectionKey ? "chevron-up" : "chevron-down"} 
        size={20} 
        color={colors.textSecondary} 
      />
    </Pressable>
  )

 
  const renderTeamOptions = () => {
    const filteredTeams = getFilteredTeams()
    
    return (
      <View style={[styles.filterSection, activeSection !== 'team' && styles.collapsedSection]}>
        {renderSectionHeader("Team", "team", "shield")}
        {activeSection === 'team' && (
          <View style={styles.sectionContent}>
            <Pressable
              style={[styles.filterOption, !tempFilters.team && styles.activeFilterOption]}
              onPress={() => setTempFilters({ ...tempFilters, team: undefined })}
            >
              <View style={styles.optionContent}>
                <Feather name="users" size={16} color={!tempFilters.team ? "white" : colors.text} />
                <Text style={[styles.filterOptionText, !tempFilters.team && styles.activeFilterOptionText]}>
                  All Teams
                </Text>
              </View>
            </Pressable>
            {filteredTeams.map((team) => (
              <Pressable
                key={team.id}
                style={[styles.filterOption, styles.teamOption, tempFilters.team === team.id && styles.activeFilterOption]}
                onPress={() => setTempFilters({ ...tempFilters, team: team.id })}
              >
                <View style={styles.teamOptionContent}>
                  {team.photo ? (
                    <Image source={{ uri: team.photo }} style={styles.teamLogo} />
                  ) : (
                    <View style={[styles.teamLogoPlaceholder, { backgroundColor: team.color || colors.primary + '20' }]}>
                      <Feather name="shield" size={16} color={team.color || colors.primary} />
                    </View>
                  )}
                  <View style={styles.teamInfo}>
                    <Text style={[styles.teamName, tempFilters.team === team.id && styles.activeFilterOptionText]}>
                      {team.name}
                    </Text>
                    <Text style={[styles.teamDetails, tempFilters.team === team.id && styles.activeTeamDetails]}>
                      {team.sport} • {team.gender === 'men' ? "Men's" : "Women's"}
                    </Text>
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
        )}
      </View>
    )
  }

  const renderGenderOptions = () => (
    <View style={[styles.filterSection, activeSection !== 'gender' && styles.collapsedSection]}>
      {renderSectionHeader("Gender", "gender", "user")}
      {activeSection === 'gender' && (
        <View style={styles.sectionContent}>
          {genders.map((gender) => (
            <Pressable
              key={gender.label}
              style={[styles.filterOption, tempFilters.gender === gender.value && styles.activeFilterOption]}
              onPress={() => setTempFilters({ ...tempFilters, gender: gender.value })}
            >
              <View style={styles.optionContent}>
                <Feather 
                  name={gender.icon as any} 
                  size={16} 
                  color={tempFilters.gender === gender.value ? "white" : colors.text} 
                />
                <Text style={[styles.filterOptionText, tempFilters.gender === gender.value && styles.activeFilterOptionText]}>
                  {gender.label}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  )

  const renderStatusOptions = () => (
    <View style={[styles.filterSection, activeSection !== 'status' && styles.collapsedSection]}>
      {renderSectionHeader("Game Status", "status", "calendar")}
      {activeSection === 'status' && (
        <View style={styles.sectionContent}>
          {statuses.map((status) => (
            <Pressable
              key={status.value}
              style={[styles.filterOption, (tempFilters.status || "all") === status.value && styles.activeFilterOption]}
              onPress={() => setTempFilters({ ...tempFilters, status: status.value })}
            >
              <View style={styles.optionContent}>
                <Feather 
                  name={status.icon as any} 
                  size={16} 
                  color={(tempFilters.status || "all") === status.value ? "white" : status.color} 
                />
                <Text style={[styles.filterOptionText, (tempFilters.status || "all") === status.value && styles.activeFilterOptionText]}>
                  {status.label}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  )

  return (
    <>
      <Pressable style={styles.filterButton} onPress={() => setIsVisible(true)}>
        <LinearGradient
          colors={['rgba(59, 130, 246, 0.1)', 'rgba(59, 130, 246, 0.05)']}
          style={styles.filterButtonGradient}
        >
          <Feather name="sliders" size={18} color={colors.primary} />
          <Text style={styles.filterButtonText}>Filters</Text>
          {getActiveFilterCount() > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{getActiveFilterCount()}</Text>
            </View>
          )}
        </LinearGradient>
      </Pressable>

      <Modal visible={isVisible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <LinearGradient 
            colors={["rgba(255,255,255,0.98)", "rgba(255,255,255,1)"]} 
            style={styles.modalHeader}
          >
            <View style={styles.modalHeaderContent}>
              <Pressable onPress={() => setIsVisible(false)} style={styles.headerButton}>
                <Feather name="x" size={24} color={colors.text} />
              </Pressable>
              <Text style={styles.modalTitle}>Filter Games</Text>
              <Pressable onPress={handleClearFilters} style={styles.headerButton}>
                <Text style={styles.clearButton}>Clear All</Text>
              </Pressable>
            </View>
          </LinearGradient>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Loading teams...</Text>
              </View>
            ) : (
              <>
                {renderTeamOptions()}
                {renderGenderOptions()}
                {renderStatusOptions()}
              </>
            )}
          </ScrollView>

          <View style={styles.modalFooter}>
            <LinearGradient
              colors={[colors.primary, colors.primary + 'DD']}
              style={styles.applyButton}
            >
              <Pressable onPress={handleApplyFilters} style={styles.applyButtonPressable}>
                <Feather name="check" size={20} color="white" />
                <Text style={styles.applyButtonText}>Apply Filters</Text>
              </Pressable>
            </LinearGradient>
          </View>
        </SafeAreaView>
      </Modal>
    </>
  )
}

const styles = StyleSheet.create({
  filterButton: {
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  filterButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    position: 'relative',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  filterBadge: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: "#EF4444",
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: 'white',
  },
  filterBadgeText: {
    color: "white",
    fontSize: 12,
    fontWeight: "700",
    paddingHorizontal: 4,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  modalHeaderContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  headerButton: {
    padding: 4,
  },
  modalTitle: {
    fontSize: 20,
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
    padding: 24,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
  },
  filterSection: {
    marginBottom: 24,
    backgroundColor: colors.card,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  collapsedSection: {
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: colors.card,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
  },
  sectionContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 12,
  },
  filterOption: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "transparent",
  },
  teamOption: {
    paddingVertical: 16,
  },
  activeFilterOption: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  teamOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  teamLogo: {
    width: 32,
    height: 32,
    borderRadius: 16,
    resizeMode: 'contain',
  },
  teamLogoPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  teamInfo: {
    flex: 1,
  },
  teamName: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 2,
  },
  teamDetails: {
    fontSize: 12,
    color: colors.textSecondary,
    textTransform: 'capitalize',
  },
  activeTeamDetails: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  filterOptionText: {
    fontSize: 16,
    fontWeight: "500",
    color: colors.text,
  },
  activeFilterOptionText: {
    color: "white",
    fontWeight: "600",
  },
  modalFooter: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  applyButton: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  applyButtonPressable: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 8,
  },
  applyButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "700",
  },
})