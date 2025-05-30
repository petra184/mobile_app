"use client"

import { useState } from "react"
import { View, Text, Pressable, StyleSheet, Modal, FlatList, Platform } from "react-native"
import { Feather } from "@expo/vector-icons"
import { colors } from "@/constants/colors"

interface DropdownOption {
  label: string
  value: string | null
  color?: string
}

interface DropdownProps {
  options: DropdownOption[]
  selectedValue: string | null
  onSelect: (value: string | null) => void
  placeholder: string
  style?: any
}

export function Dropdown({ options, selectedValue, onSelect, placeholder, style }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false)

  const selectedOption = options.find((option) => option.value === selectedValue)

  const handleSelect = (value: string | null) => {
    onSelect(value)
    setIsOpen(false)
  }

  return (
    <View style={[styles.container, style]}>
      <Pressable style={styles.trigger} onPress={() => setIsOpen(true)}>
        <View style={styles.triggerContent}>
          {selectedOption ? (
            <View style={styles.selectedOption}>
              {selectedOption.color && <View style={[styles.colorDot, { backgroundColor: selectedOption.color }]} />}
              <Text style={styles.selectedText}>{selectedOption.label}</Text>
            </View>
          ) : (
            <Text style={styles.placeholder}>{placeholder}</Text>
          )}
        </View>
        <Feather name={isOpen ? "chevron-up" : "chevron-down"} size={20} color={colors.textSecondary} />
      </Pressable>

      <Modal visible={isOpen} transparent animationType="fade" onRequestClose={() => setIsOpen(false)}>
        <Pressable style={styles.overlay} onPress={() => setIsOpen(false)}>
          <View style={styles.dropdown}>
            <FlatList
              data={options}
              keyExtractor={(item) => item.value || "null"}
              renderItem={({ item }) => (
                <Pressable
                  style={[styles.option, selectedValue === item.value && styles.selectedOptionItem]}
                  onPress={() => handleSelect(item.value)}
                >
                  <View style={styles.optionContent}>
                    {item.color && <View style={[styles.colorDot, { backgroundColor: item.color }]} />}
                    <Text style={[styles.optionText, selectedValue === item.value && styles.selectedOptionText]}>
                      {item.label}
                    </Text>
                  </View>
                  {selectedValue === item.value && <Feather name="check" size={16} color={colors.primary} />}
                </Pressable>
              )}
              showsVerticalScrollIndicator={false}
            />
          </View>
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 9,
    minHeight: 50,
  },
  triggerContent: {
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
    marginRight: 4,
  },
  selectedText: {
    fontSize: 16,
    fontWeight: "500",
    color: colors.text,
  },
  placeholder: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  dropdown: {
    backgroundColor: colors.card,
    borderRadius: 16,
    maxHeight: 300,
    minWidth: 250,
    maxWidth: "90%",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  selectedOptionItem: {
    backgroundColor: `${colors.primary}10`,
  },
  optionContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  optionText: {
    fontSize: 16,
    color: colors.text,
  },
  selectedOptionText: {
    fontWeight: "600",
    color: colors.primary,
  },
})
