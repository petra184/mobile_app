"use client"

import { useState, useRef } from "react"
import { View, Text, Pressable, StyleSheet, Modal, FlatList, Platform, Animated, Dimensions } from "react-native"
import { Feather } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import { colors } from "@/constants/colors"

interface DropdownOption {
  label: string
  value: string | null
  color?: string
  icon?: string
  subtitle?: string
}

interface EnhancedDropdownProps {
  options: DropdownOption[]
  selectedValue: string | null
  onSelect: (value: string | null) => void
  placeholder: string
  style?: any
  variant?: "default" | "team" | "location"
  disabled?: boolean
}

export function EnhancedDropdown({
  options,
  selectedValue,
  onSelect,
  placeholder,
  style,
  variant = "default",
  disabled = false,
}: EnhancedDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const scaleAnim = useRef(new Animated.Value(0)).current
  const fadeAnim = useRef(new Animated.Value(0)).current

  const selectedOption = options.find((option) => option.value === selectedValue)
  const filteredOptions = options.filter((option) => option.label.toLowerCase().includes(searchQuery.toLowerCase()))

  const handleSelect = (value: string | null) => {
    onSelect(value)
    closeDropdown()
  }

  const openDropdown = () => {
    if (disabled) return
    setIsOpen(true)
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start()
  }

  const closeDropdown = () => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsOpen(false)
      setSearchQuery("")
    })
  }

  const renderTrigger = () => {
    const triggerStyle = [
      styles.trigger,
      variant === "team" && styles.teamTrigger,
      variant === "location" && styles.locationTrigger,
      disabled && styles.disabledTrigger,
      selectedOption && styles.selectedTrigger,
    ]

    return (
      <Pressable style={triggerStyle} onPress={openDropdown} disabled={disabled}>
        {variant === "team" && selectedOption ? (
          <LinearGradient
            colors={[selectedOption.color || colors.primary, `${selectedOption.color || colors.primary}80`]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.teamGradient}
          >
            <View style={styles.teamContent}>
              <View style={styles.teamInfo}>
                <View style={[styles.teamColorDot, { backgroundColor: selectedOption.color }]} />
                <Text style={styles.teamSelectedText}>{selectedOption.label}</Text>
              </View>
              <Feather name="chevron-down" size={20} color="white" />
            </View>
          </LinearGradient>
        ) : (
          <View style={styles.triggerContent}>
            <View style={styles.triggerLeft}>
              {selectedOption ? (
                <View style={styles.selectedOption}>
                  {selectedOption.color && (
                    <View style={[styles.colorDot, { backgroundColor: selectedOption.color }]} />
                  )}
                  {selectedOption.icon && (
                    <Feather
                      name={selectedOption.icon as any}
                      size={16}
                      color={colors.text}
                      style={styles.optionIcon}
                    />
                  )}
                  <View>
                    <Text style={styles.selectedText}>{selectedOption.label}</Text>
                  </View>
                </View>
              ) : (
                <Text style={styles.placeholder}>{placeholder}</Text>
              )}
            </View>
            <Feather
              name={isOpen ? "chevron-up" : "chevron-down"}
              size={20}
              color={disabled ? colors.textSecondary : colors.text}
            />
          </View>
        )}
      </Pressable>
    )
  }

  const renderOption = ({ item }: { item: DropdownOption }) => {
    const isSelected = selectedValue === item.value

    return (
      <Pressable
        style={[styles.option, isSelected && styles.selectedOptionItem]}
        onPress={() => handleSelect(item.value)}
      >
        <View style={styles.optionContent}>
          {item.color && <View style={[styles.colorDot, { backgroundColor: item.color }]} />}
          {item.icon && <Feather name={item.icon as any} size={16} color={colors.text} style={styles.optionIcon} />}
          <View style={styles.optionTextContainer}>
            <Text style={[styles.optionText, isSelected && styles.selectedOptionText]}>{item.label}</Text>
       
          </View>
        </View>
        {isSelected && (
          <View style={styles.checkContainer}>
            <Feather name="check" size={16} color={colors.primary} />
          </View>
        )}
      </Pressable>
    )
  }

  return (
    <View style={[styles.container, style]}>
      {renderTrigger()}

      <Modal visible={isOpen} transparent animationType="none" onRequestClose={closeDropdown}>
        <Pressable style={styles.overlay} onPress={closeDropdown}>
          <Animated.View
            style={[
              styles.dropdown,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <Pressable onPress={(e) => e.stopPropagation()}>
              <View style={styles.dropdownHeader}>
                <Text style={styles.dropdownTitle}>{placeholder}</Text>
                <Pressable onPress={closeDropdown} style={styles.closeButton}>
                  <Feather name="x" size={20} color={colors.textSecondary} />
                </Pressable>
              </View>

              <FlatList
                data={filteredOptions}
                keyExtractor={(item) => item.value || "null"}
                renderItem={renderOption}
                showsVerticalScrollIndicator={false}
                style={styles.optionsList}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
              />
            </Pressable>
          </Animated.View>
        </Pressable>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
  },
  trigger: {
    backgroundColor: colors.card,
    borderRadius: 86,
    overflow: "hidden",
  },
  teamTrigger: {
    borderWidth: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  locationTrigger: {
    backgroundColor: `${colors.primary}08`,
    borderColor: `${colors.primary}20`,
  },
  disabledTrigger: {
    opacity: 0.6,
    backgroundColor: colors.border,
  },
  selectedTrigger: {
    borderColor: colors.border,
    borderWidth: 1,
  },
  teamGradient: {
    flex: 1,
    justifyContent: "center",
  },
  teamContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  teamInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  teamColorDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 12,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  teamSelectedText: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
    flex: 1,
  },
  triggerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  triggerLeft: {
    flex: 1,
  },
  selectedOption: {
    flexDirection: "row",
    alignItems: "center",
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  optionIcon: {
    marginRight: 12,
  },
  selectedText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
  },
  selectedSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  placeholder: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  dropdown: {
    backgroundColor: colors.card,
    borderRadius: 20,
    maxHeight: Dimensions.get("window").height * 0.6,
    minWidth: 280,
    maxWidth: "90%",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
      },
      android: {
        elevation: 15,
      },
    }),
  },
  dropdownHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  dropdownTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
  },
  closeButton: {
    padding: 4,
  },
  optionsList: {
    maxHeight: 300,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  selectedOptionItem: {
    backgroundColor: `${colors.primary}10`,
  },
  optionContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionText: {
    fontSize: 16,
    color: colors.text,
  },
  optionSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  selectedOptionText: {
    fontWeight: "600",
    color: colors.primary,
  },
  checkContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: `${colors.primary}20`,
    alignItems: "center",
    justifyContent: "center",
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: 20,
  },
})
