"use client"

import { useState } from "react"
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
} from "react-native"
import { Calendar, Clock, Users, MessageSquare } from "lucide-react-native"
import { colors } from "@/constants/colors"
import type { BirthdayPackage } from "@/types"
import { LinearGradient } from "expo-linear-gradient"

interface ReservationFormProps {
  selectedPackage: BirthdayPackage
  onClose: () => void
}

const timeSlots = ["10:00 AM", "11:00 AM", "12:00 PM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM", "6:00 PM"]

export default function ReservationForm({ selectedPackage, onClose }: ReservationFormProps) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [date, setDate] = useState("")
  const [time, setTime] = useState("")
  const [guests, setGuests] = useState("")
  const [requests, setRequests] = useState("")

  const handleSubmit = () => {
    // Basic validation
    if (!name || !email || !phone || !date || !time || !guests) {
      Alert.alert("Missing Information", "Please fill in all required fields.")
      return
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      Alert.alert("Invalid Email", "Please enter a valid email address.")
      return
    }

    // Guest count validation
    const guestCount = Number.parseInt(guests)
    if (isNaN(guestCount) || guestCount <= 0 || guestCount > selectedPackage.maxGuests) {
      Alert.alert("Invalid Guest Count", `Please enter a number between 1 and ${selectedPackage.maxGuests}.`)
      return
    }

    // Success - in a real app, this would send the data to a server
    Alert.alert(
      "Reservation Submitted",
      "Your birthday package reservation has been submitted. We'll contact you shortly to confirm the details.",
      [{ text: "OK", onPress: onClose }],
    )
  }

  return (
    <View style={styles.modalContainer}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

        <View style={styles.header}>
          <Text style={styles.title}>Reserve Your Birthday Package</Text>
          <Text style={styles.packageName}>
            {selectedPackage.name} - ${selectedPackage.price.toFixed(2)}
          </Text>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Full Name *</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Enter your full name"
            placeholderTextColor={colors.textSecondary}
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
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Date *</Text>
          <View style={styles.inputWithIcon}>
            <Calendar size={20} color={colors.primary} />
            <TextInput
              style={styles.iconInput}
              value={date}
              onChangeText={setDate}
              placeholder="MM/DD/YYYY"
              keyboardType={Platform.OS === "ios" ? "default" : "numeric"}
              placeholderTextColor={colors.textSecondary}
            />
          </View>
          <Text style={styles.helperText}>Available days: {selectedPackage.availableDays.join(", ")}</Text>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Time *</Text>
          <View style={styles.inputWithIcon}>
            <Clock size={20} color={colors.primary} />
            <TextInput
              style={styles.iconInput}
              value={time}
              onChangeText={setTime}
              placeholder="Select a time"
              placeholderTextColor={colors.textSecondary}
              editable={false}
            />
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
              onPress={() => setTime(slot)}
            >
              <Text style={[styles.timeSlotText, time === slot && styles.selectedTimeSlotText]}>{slot}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Number of Guests *</Text>
          <View style={styles.inputWithIcon}>
            <Users size={20} color={colors.primary} />
            <TextInput
              style={styles.iconInput}
              value={guests}
              onChangeText={setGuests}
              placeholder={`Max ${selectedPackage.maxGuests} guests`}
              keyboardType="numeric"
              placeholderTextColor={colors.textSecondary}
            />
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Special Requests</Text>
          <View style={styles.inputWithIcon}>
            <MessageSquare size={20} color={colors.primary} style={styles.textAreaIcon} />
            <TextInput
              style={[styles.iconInput, styles.textArea]}
              value={requests}
              onChangeText={setRequests}
              placeholder="Any special requests or dietary requirements?"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              placeholderTextColor={colors.textSecondary}
            />
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity activeOpacity={0.8} onPress={handleSubmit} style={styles.reserveButtonContainer}>
            <LinearGradient
              colors={[colors.primary, colors.accent]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.reserveButton}
            >
              <Text style={styles.reserveButtonText}>Reserve Now</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
    padding: 24,
    elevation: 10,
  },
  closeButton: {
    position: "absolute",
    right: -20,
    top: -20,
    zIndex: 100,
  },
  header: {
    marginBottom: 24,
    marginTop: 8,
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
  },
  helperText: {
    fontSize: 12,
    color: colors.primary,
    marginTop: 6,
    fontStyle: "italic",
  },
  timeSlotsContainer: {
    marginBottom: 20,
  },
  timeSlots: {
    paddingVertical: 8,
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
})
