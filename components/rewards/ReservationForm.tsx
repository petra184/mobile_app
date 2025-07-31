"use client"

import { colors } from "@/constants/Colors"
import { useNotifications } from "@/context/notification-context"
import { useUserStore } from "@/hooks/userStore"
import { submitBirthdayRequestClient } from "@/lib/actions/birthdays"
import type { BirthdayPackage } from "@/types/updated_types"
import { Feather } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import { useState } from "react"
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native"

interface ReservationFormProps {
  selectedPackage: BirthdayPackage
  onClose: () => void
}

const timeSlots = ["10:00 AM", "11:00 AM", "12:00 PM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM", "6:00 PM"]

const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
]

const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

export default function ReservationForm({ selectedPackage, onClose }: ReservationFormProps) {
  const { showSuccess, showError } = useNotifications()
  const { userEmail, getUserName } = useUserStore()

  // Pre-fill form with user data
  const [name, setName] = useState(getUserName())
  const [email, setEmail] = useState(userEmail || "")
  const [phone, setPhone] = useState("")
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [time, setTime] = useState("")
  const [guests, setGuests] = useState("")
  const [requests, setRequests] = useState("")
  const [showCalendar, setShowCalendar] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth())
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
  const [isSubmitting, setIsSubmitting] = useState(false)

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay()
  }

  const isDateDisabled = (day: number) => {
    const date = new Date(currentYear, currentMonth, day)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return date < today
  }

  const isSameDate = (day: number) => {
    if (!selectedDate) return false
    return (
      selectedDate.getDate() === day &&
      selectedDate.getMonth() === currentMonth &&
      selectedDate.getFullYear() === currentYear
    )
  }

  const handleDateSelect = (day: number) => {
    if (isDateDisabled(day)) return
    const date = new Date(currentYear, currentMonth, day)
    setSelectedDate(date)
    setShowCalendar(false)
  }

  const navigateMonth = (direction: "prev" | "next") => {
    if (direction === "prev") {
      if (currentMonth === 0) {
        setCurrentMonth(11)
        setCurrentYear(currentYear - 1)
      } else {
        setCurrentMonth(currentMonth - 1)
      }
    } else {
      if (currentMonth === 11) {
        setCurrentMonth(0)
        setCurrentYear(currentYear + 1)
      } else {
        setCurrentMonth(currentMonth + 1)
      }
    }
  }

  const formatDisplayDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth, currentYear)
    const firstDay = getFirstDayOfMonth(currentMonth, currentYear)
    const days = []

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(
        <View key={`empty-${i}`} style={styles.calendarDay}>
          <Text></Text>
        </View>,
      )
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const disabled = isDateDisabled(day)
      const selected = isSameDate(day)

      days.push(
        <TouchableOpacity
          key={day}
          style={[styles.calendarDay, selected && styles.selectedDay, disabled && styles.disabledDay]}
          onPress={() => handleDateSelect(day)}
          disabled={disabled}
        >
          <Text
            style={[styles.calendarDayText, selected && styles.selectedDayText, disabled && styles.disabledDayText]}
          >
            {day}
          </Text>
        </TouchableOpacity>,
      )
    }

    return days
  }

  const handleSubmit = async () => {
    // Basic validation
    if (!name || !email || !phone || !selectedDate || !time || !guests) {
      Alert.alert("Missing Information", "Please fill in all required fields.")
      return
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      Alert.alert("Invalid Email", "Please enter a valid email address.")
      return
    }

    // Guest count validation - use max_guests or points
    const maxGuests = selectedPackage.max_guests || selectedPackage.points || 0
    const guestCount = Number.parseInt(guests)
    if (isNaN(guestCount) || guestCount <= 0 || guestCount > maxGuests) {
      Alert.alert("Invalid Guest Count", `Please enter a number between 1 and ${maxGuests}.`)
      return
    }

    setIsSubmitting(true)

    try {
      // Prepare reservation data
      const reservationData = {
        package: {
          id: selectedPackage.id,
          name: selectedPackage.name,
          price: selectedPackage.price,
        },
        customerInfo: {
          name,
          email,
          phone,
        },
        eventDetails: {
          date: selectedDate.toISOString().split("T")[0],
          time,
          numberOfGuests: guestCount,
          specialRequests: requests,
        },
        submittedAt: new Date().toISOString(),
      }

      // Submit to Supabase
      const result = await submitBirthdayRequestClient(reservationData)

      if (result.success) {
        // Show success notification
        showSuccess(
          "Reservation Confirmed!",
          `Your ${selectedPackage.name} reservation for ${formatDisplayDate(selectedDate)} at ${time} has been submitted successfully.`,
        )

        // Close the form
        onClose()
      } else {
        // Show error notification
        showError("Submission Failed", result.error || "Failed to submit your reservation. Please try again.")
      }
    } catch (error) {
      console.error("Error submitting reservation:", error)
      showError("Submission Failed", "An unexpected error occurred. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Get max guests for display
  const maxGuests = selectedPackage.max_guests || selectedPackage.points || 0

  return (
    <View style={styles.modalContainer}>
      <View style={styles.container}>
        {/* Close Button */}
        <TouchableOpacity style={styles.closeButton} onPress={onClose} activeOpacity={0.7}>
          <View style={styles.closeButtonBackground}>
            <Feather name="x" size={24} color={colors.text} />
          </View>
        </TouchableOpacity>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Reserve Your Birthday Package</Text>
            <Text style={styles.packageName}>
              {selectedPackage.name} - ${selectedPackage.price.toFixed(2)}
            </Text>
            <Text style={styles.packageInfo}>Max {maxGuests} guests</Text>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Full Name *</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Enter your full name"
              placeholderTextColor={colors.textSecondary}
              editable={!isSubmitting}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Email *</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor={colors.textSecondary}
              editable={!isSubmitting}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Phone Number *</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="Enter your phone number"
              keyboardType="phone-pad"
              placeholderTextColor={colors.textSecondary}
              editable={!isSubmitting}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Date *</Text>
            <TouchableOpacity
              style={styles.inputWithIcon}
              onPress={() => !isSubmitting && setShowCalendar(!showCalendar)}
              activeOpacity={0.7}
              disabled={isSubmitting}
            >
              <Feather name="calendar" size={20} color={colors.primary} />
              <Text style={[styles.iconInput, { color: selectedDate ? colors.text : colors.textSecondary }]}>
                {selectedDate ? formatDisplayDate(selectedDate) : "Select a date"}
              </Text>
              <Feather name={showCalendar ? "chevron-up" : "chevron-down"} size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {showCalendar && !isSubmitting && (
            <View style={styles.calendarContainer}>
              {/* Calendar Header */}
              <View style={styles.calendarHeader}>
                <TouchableOpacity onPress={() => navigateMonth("prev")} style={styles.calendarNavButton}>
                  <Feather name="chevron-left" size={20} color={colors.primary} />
                </TouchableOpacity>
                <Text style={styles.calendarHeaderText}>
                  {months[currentMonth]} {currentYear}
                </Text>
                <TouchableOpacity onPress={() => navigateMonth("next")} style={styles.calendarNavButton}>
                  <Feather name="chevron-right" size={20} color={colors.primary} />
                </TouchableOpacity>
              </View>

              {/* Days of Week Header */}
              <View style={styles.calendarWeekHeader}>
                {daysOfWeek.map((day) => (
                  <View key={day} style={styles.calendarWeekDay}>
                    <Text style={styles.calendarWeekDayText}>{day}</Text>
                  </View>
                ))}
              </View>

              {/* Calendar Grid */}
              <View style={styles.calendarGrid}>{renderCalendar()}</View>
            </View>
          )}

          <View style={styles.formGroup}>
            <Text style={styles.label}>Time *</Text>
            <View style={styles.inputWithIcon}>
              <Feather name="clock" size={20} color={colors.primary} />
              <Text style={[styles.iconInput, { color: time ? colors.text : colors.textSecondary }]}>
                {time || "Select a time"}
              </Text>
            </View>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.timeSlotsContainer}
            contentContainerStyle={styles.timeSlots}
          >
            {timeSlots.map((slot) => (
              <TouchableOpacity
                key={slot}
                style={[styles.timeSlot, time === slot && styles.selectedTimeSlot]}
                onPress={() => !isSubmitting && setTime(slot)}
                disabled={isSubmitting}
              >
                <Text style={[styles.timeSlotText, time === slot && styles.selectedTimeSlotText]}>{slot}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Number of Guests *</Text>
            <View style={styles.inputWithIcon}>
              <Feather name="users" size={20} color={colors.primary} />
              <TextInput
                style={styles.iconInput}
                value={guests}
                onChangeText={setGuests}
                placeholder={`Max ${maxGuests} guests`}
                keyboardType="numeric"
                placeholderTextColor={colors.textSecondary}
                editable={!isSubmitting}
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Special Requests</Text>
            <View style={styles.inputWithIcon}>
              <Feather name="message-square" size={20} color={colors.primary} style={styles.textAreaIcon} />
              <TextInput
                style={[styles.iconInput, styles.textArea]}
                value={requests}
                onChangeText={setRequests}
                placeholder="Any special requests or dietary requirements?"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                placeholderTextColor={colors.textSecondary}
                editable={!isSubmitting}
              />
            </View>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleSubmit}
              style={[styles.reserveButtonContainer, isSubmitting && styles.disabledButton]}
              disabled={isSubmitting}
            >
              <LinearGradient
                colors={isSubmitting ? [colors.textSecondary, colors.textSecondary] : [colors.primary, colors.accent]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.reserveButton}
              >
                <Text style={styles.reserveButtonText}>{isSubmitting ? "Submitting..." : "Reserve Now"}</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.cancelButton, isSubmitting && styles.disabledButton]}
              onPress={onClose}
              disabled={isSubmitting}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    backgroundColor: colors.background,
    borderRadius: 20,
    width: "100%",
    maxHeight: "90%",
    position: "relative",
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  scrollContent: {
    padding: 24,
    paddingTop: 40,
  },
  closeButton: {
    position: "absolute",
    right: 16,
    top: 16,
    zIndex: 100,
  },
  closeButtonBackground: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0, 0, 0, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 8,
    color: colors.text,
  },
  packageName: {
    fontSize: 16,
    color: colors.success,
    fontWeight: "600",
  },
  packageInfo: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    color: colors.text,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: "rgba(255,255,255,0.05)",
    color: colors.text,
  },
  inputWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  iconInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: colors.text,
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
    paddingTop: 0,
  },
  textAreaIcon: {
    alignSelf: "flex-start",
    marginTop: 4,
  },
  calendarContainer: {
    marginBottom: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "rgba(255,255,255,0.05)",
    padding: 16,
  },
  calendarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  calendarNavButton: {
    padding: 8,
  },
  calendarHeaderText: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
  },
  calendarWeekHeader: {
    flexDirection: "row",
    marginBottom: 8,
  },
  calendarWeekDay: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
  },
  calendarWeekDayText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  calendarDay: {
    width: "14.28%",
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  selectedDay: {
    backgroundColor: colors.primary,
    borderRadius: 20,
  },
  disabledDay: {
    opacity: 0.3,
  },
  calendarDayText: {
    fontSize: 16,
    color: colors.text,
  },
  selectedDayText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  disabledDayText: {
    color: colors.textSecondary,
  },
  timeSlotsContainer: {
    marginBottom: 20,
  },
  timeSlots: {
    paddingHorizontal: 4,
  },
  timeSlot: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 10,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  selectedTimeSlot: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  timeSlotText: {
    fontSize: 14,
    color: colors.text,
  },
  selectedTimeSlotText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  buttonContainer: {
    marginTop: 16,
    marginBottom: 20,
  },
  reserveButtonContainer: {
    width: "100%",
    marginBottom: 12,
    borderRadius: 38,
    overflow: "hidden",
  },
  reserveButton: {
    paddingVertical: 16,
    alignItems: "center",
    width: "100%",
  },
  reserveButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  cancelButton: {
    width: "100%",
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 38,
    alignItems: "center",
    backgroundColor: "transparent",
  },
  cancelButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "600",
  },
  disabledButton: {
    opacity: 0.6,
  },
})
