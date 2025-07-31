"use client"

import { colors } from "@/constants/Colors"
import { Feather } from "@expo/vector-icons"
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native"

interface FilterChip {
  id: string
  label: string
  value: string | null
  color?: string
  icon?: string
  isActive: boolean
}

interface FilterChipsProps {
  chips: FilterChip[]
  onChipPress: (chipId: string, value: string | null) => void
  onClearAll?: () => void
  style?: any
}

export function FilterChips({ chips, onChipPress, onClearAll, style }: FilterChipsProps) {
  const activeChips = chips.filter((chip) => chip.isActive)
  const hasActiveFilters = activeChips.length > 0

  return (
    <View style={[styles.container, style]}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {chips.map((chip) => (
          <Pressable
            key={chip.id}
            style={[
              styles.chip,
              chip.isActive && styles.activeChip,
              chip.color && chip.isActive && { backgroundColor: `${chip.color}20`, borderColor: chip.color },
            ]}
            onPress={() => onChipPress(chip.id, chip.value)}
          >
            <View style={styles.chipContent}>
              {chip.icon && (
                <Feather
                  name={chip.icon as any}
                  size={14}
                  color={chip.isActive ? chip.color || colors.primary : colors.textSecondary}
                  style={styles.chipIcon}
                />
              )}
              {chip.color && chip.isActive && <View style={[styles.chipColorDot, { backgroundColor: chip.color }]} />}
              <Text
                style={[
                  styles.chipText,
                  chip.isActive && styles.activeChipText,
                  chip.color && chip.isActive && { color: chip.color },
                ]}
              >
                {chip.label}
              </Text>
              {chip.isActive && (
                <Feather name="x" size={14} color={chip.color || colors.primary} style={styles.chipClose} />
              )}
            </View>
          </Pressable>
        ))}

        {hasActiveFilters && onClearAll && (
          <Pressable style={styles.clearAllChip} onPress={onClearAll}>
            <View style={styles.chipContent}>
              <Feather name="x-circle" size={14} color={colors.error} style={styles.chipIcon} />
              <Text style={styles.clearAllText}>Clear All</Text>
            </View>
          </Pressable>
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  scrollContent: {
    paddingHorizontal: 4,
    gap: 8,
  },
  chip: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 36,
    justifyContent: "center",
  },
  activeChip: {
    backgroundColor: `${colors.primary}15`,
    borderColor: colors.primary,
  },
  chipContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  chipIcon: {
    marginRight: 6,
  },
  chipColorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  chipText: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.textSecondary,
  },
  activeChipText: {
    color: colors.primary,
    fontWeight: "600",
  },
  chipClose: {
    marginLeft: 6,
  },
  clearAllChip: {
    backgroundColor: `${colors.error}10`,
    borderWidth: 1,
    borderColor: `${colors.error}30`,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 36,
    justifyContent: "center",
  },
  clearAllText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.error,
  },
})
