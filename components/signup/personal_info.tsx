"use client"

import { useState } from "react"
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, Platform } from "react-native"
import DateTimePicker from "@react-native-community/datetimepicker"
import { Ionicons } from "@expo/vector-icons"
import { colors } from "@/constants/Colors"
import type { FormData } from "@/app/(auth)/signup"

interface PersonalInfoStepProps {
  formData: FormData
  updateFormData: (updates: Partial<FormData>) => void
  onNext: () => void
}

export default function PersonalInfoStep({ formData, updateFormData, onNext }: PersonalInfoStepProps) {
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())

  // Modified canContinue: Birthday is now optional
  const canContinue = () => {
    return formData.firstName.trim() !== "" && formData.lastName.trim() !== ""
  }

  const formatDateForDisplay = (date: Date) => {
    const month = (date.getMonth() + 1).toString().padStart(2, "0")
    const day = date.getDate().toString().padStart(2, "0")
    const year = date.getFullYear()
    return `${month}/${day}/${year}`
  }

  const handleDateChange = (event: any, date?: Date) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false)
    }

    if (date) {
      setSelectedDate(date)
      const formattedDate = formatDateForDisplay(date)
      updateFormData({ birthday: formattedDate })
    }
    // If date is undefined (e.g., user cancels on Android),
    // we don't update the birthday, leaving it as is (potentially empty).
  }

  const openDatePicker = () => {
    // If there's already a birthday, parse it to set the initial date
    if (formData.birthday) {
      const parts = formData.birthday.split("/")
      if (parts.length === 3) {
        const month = Number.parseInt(parts[0]) - 1 // Month is 0-indexed
        const day = Number.parseInt(parts[1])
        const year = Number.parseInt(parts[2])
        if (!isNaN(month) && !isNaN(day) && !isNaN(year)) {
          setSelectedDate(new Date(year, month, day))
        }
      }
    } else {
      // If no birthday is set, default to today's date for the picker
      setSelectedDate(new Date());
    }
    setShowDatePicker(true)
  }

  const closeDatePicker = () => {
    setShowDatePicker(false)
  }

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
      <View style={styles.formContainer}>
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeSubtext}>
            We're excited to have you join our app! Let's start with some basic information about you.
          </Text>
        </View>

        <View style={styles.rowContainer}>
          <TextInput
            style={[styles.input, styles.halfInput]}
            placeholder="First Name"
            value={formData.firstName}
            onChangeText={(value) => updateFormData({ firstName: value })}
            placeholderTextColor="#A0A0A0"
          />
          <TextInput
            style={[styles.input, styles.halfInput]}
            placeholder="Last Name"
            value={formData.lastName}
            onChangeText={(value) => updateFormData({ lastName: value })}
            placeholderTextColor="#A0A0A0"
          />
        </View>

        {/* Birthday Picker */}
        <TouchableOpacity style={styles.datePickerButton} onPress={openDatePicker}>
          <View style={styles.datePickerContent}>
            <Text style={[styles.datePickerText, !formData.birthday && styles.placeholderText]}>
              {formData.birthday || "Select Birthday (Optional)"}
            </Text>
            <Ionicons name="calendar-outline" size={20} color="#A0A0A0" />
          </View>
        </TouchableOpacity>

        {showDatePicker && (
          <View style={styles.datePickerContainer}>
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={handleDateChange}
              maximumDate={new Date()} // Can't select future dates
              minimumDate={new Date(1900, 0, 1)} // Reasonable minimum date
            />
            {Platform.OS === "ios" && (
              <View style={styles.datePickerButtons}>
                <TouchableOpacity style={styles.datePickerCancelButton} onPress={closeDatePicker}>
                  <Text style={styles.datePickerCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.datePickerConfirmButton} onPress={closeDatePicker}>
                  <Text style={styles.datePickerConfirmText}>Done</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
        
        <TouchableOpacity
          style={[styles.continueButton, !canContinue() && styles.continueButtonDisabled]}
          onPress={onNext}
          disabled={!canContinue()}
        >
          <Text style={styles.continueButtonText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
  },
  formContainer: {
    padding: 24,
    flex: 1,
  },
  welcomeSection: {
    marginBottom: 32,
    alignItems: "center",
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
  },
  welcomeSubtext: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 22,
  },
  rowContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  input: {
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: "black",
    marginBottom: 16,
    shadowColor: "gray",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
  },
  halfInput: {
    width: "48%",
  },
  fullInput: {
    width: "100%",
  },
  datePickerButton: {
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "gray",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
  },
  datePickerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  datePickerText: {
    fontSize: 16,
    color: "black",
  },
  placeholderText: {
    color: "#A0A0A0",
  },
  datePickerContainer: {
    backgroundColor: colors.success,
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  datePickerButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E5E5",
  },
  datePickerCancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  datePickerConfirmButton: {
    backgroundColor: colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  datePickerCancelText: {
    color: "#666",
    fontSize: 16,
  },
  datePickerConfirmText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  birthdayNote: {
    backgroundColor: "#F0F9FF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: "#E0F2FE",
  },
  noteText: {
    fontSize: 14,
    color: "#0369A1",
    textAlign: "center",
  },
  continueButton: {
    backgroundColor: colors.primary,
    borderRadius: 32,
    padding: 16,
    alignItems: "center",
    marginTop: "auto",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  continueButtonDisabled: {
    backgroundColor: "#A0A0A0",
    shadowOpacity: 0,
    elevation: 0,
  },
  continueButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
})
