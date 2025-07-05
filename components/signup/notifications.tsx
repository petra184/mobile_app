"use client"
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Switch, ActivityIndicator } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { colors } from "@/constants/colors"
import type { FormData } from "@/app/(auth)/signup"

interface NotificationSettingsStepProps {
  formData: FormData
  updateFormData: (updates: Partial<FormData>) => void
  onSubmit: () => void
  loading: boolean
}

export default function NotificationSettingsStep({
  formData,
  updateFormData,
  onSubmit,
  loading,
}: NotificationSettingsStepProps) {
  const notificationOptions = [
    {
      id: "general",
      title: "General Notifications",
      description: "Master toggle for all notifications",
      value: formData.notificationsEnabled,
      onChange: (value: boolean) => updateFormData({ notificationsEnabled: value }),
      icon: "notifications-outline",
      category: "main",
    },
    {
      id: "push",
      title: "Push Notifications",
      description: "Receive notifications on your device",
      value: formData.pushNotifications,
      onChange: (value: boolean) => updateFormData({ pushNotifications: value }),
      icon: "phone-portrait-outline",
      category: "delivery",
      disabled: !formData.notificationsEnabled,
    },
    {
      id: "email",
      title: "Email Notifications",
      description: "Receive notifications via email",
      value: formData.emailNotifications,
      onChange: (value: boolean) => updateFormData({ emailNotifications: value }),
      icon: "mail-outline",
      category: "delivery",
      disabled: !formData.notificationsEnabled,
    },
    {
      id: "games",
      title: "Game Notifications",
      description: "Live scores, game updates, and match results",
      value: formData.gameNotifications,
      onChange: (value: boolean) => updateFormData({ gameNotifications: value }),
      icon: "football-outline",
      category: "content",
      disabled: !formData.notificationsEnabled,
    },
    {
      id: "news",
      title: "News & Updates",
      description: "Breaking news, player transfers, and team updates",
      value: formData.newsNotifications,
      onChange: (value: boolean) => updateFormData({ newsNotifications: value }),
      icon: "newspaper-outline",
      category: "content",
      disabled: !formData.notificationsEnabled,
    },
    {
      id: "teams",
      title: "Favorite Team Updates",
      description: "Special updates from your favorite teams",
      value: formData.teamNotificationsEnabled,
      onChange: (value: boolean) => updateFormData({ teamNotificationsEnabled: value }),
      icon: "people-outline",
      category: "content",
      disabled: !formData.notificationsEnabled || formData.favoriteTeams.length === 0,
    },
    {
      id: "offers",
      title: "Special Offers & Rewards",
      description: "Exclusive deals, promotions, and reward opportunities",
      value: formData.specialOffers,
      onChange: (value: boolean) => updateFormData({ specialOffers: value }),
      icon: "gift-outline",
      category: "content",
      disabled: !formData.notificationsEnabled,
    },
  ]

  const renderCategoryHeader = (title: string) => (
    <Text style={styles.categoryHeader}>{title}</Text>
  )

  const renderNotificationOption = (option: any) => (
    <View key={option.id} style={[styles.optionCard, option.disabled && styles.optionCardDisabled]}>
      <View style={styles.optionContent}>
        <View style={[styles.optionIcon, option.disabled && styles.optionIconDisabled]}>
          <Ionicons 
            name={option.icon as any} 
            size={24} 
            color={option.disabled ? "#A0A0A0" : colors.primary} 
          />
        </View>
        <View style={styles.optionText}>
          <Text style={[styles.optionTitle, option.disabled && styles.optionTitleDisabled]}>
            {option.title}
          </Text>
          <Text style={[styles.optionDescription, option.disabled && styles.optionDescriptionDisabled]}>
            {option.description}
            {option.id === "teams" && option.disabled && formData.favoriteTeams.length === 0 && " (Select favorite teams first)"}
          </Text>
        </View>
        <Switch
          value={option.value}
          onValueChange={option.onChange}
          trackColor={{ false: "#E5E5E5", true: colors.primary }}
          thumbColor={option.value ? "white" : "#f4f3f4"}
          disabled={option.disabled}
        />
      </View>
    </View>
  )

  const mainOptions = notificationOptions.filter(opt => opt.category === "main")
  const deliveryOptions = notificationOptions.filter(opt => opt.category === "delivery")
  const contentOptions = notificationOptions.filter(opt => opt.category === "content")

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerSection}>
          <View style={styles.iconContainer}>
            <Ionicons name="notifications" size={48} color={colors.primary} />
          </View>
          <Text style={styles.headerText}>Notification Preferences</Text>
          <Text style={styles.subHeaderText}>
            Customize how you'd like to stay updated. You can always change these settings later in your profile.
          </Text>
        </View>

        <View style={styles.optionsContainer}>
          {/* Main Toggle */}
          {mainOptions.map(renderNotificationOption)}

          {/* Delivery Methods */}
          {renderCategoryHeader("Delivery Methods")}
          {deliveryOptions.map(renderNotificationOption)}

          {/* Content Types */}
          {renderCategoryHeader("Content Types")}
          {contentOptions.map(renderNotificationOption)}
        </View>
      </ScrollView>

      {/* Fixed button container outside ScrollView */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.submitButton} onPress={onSubmit} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Ionicons name="person-add-outline" size={20} color="white" style={styles.buttonIcon} />
              <Text style={styles.submitButtonText}>Create Account</Text>
            </>
          )}
        </TouchableOpacity>
        <Text style={styles.termsText}>
          By creating an account, you agree to our <Text style={styles.termsLink}>Terms of Service</Text> and{" "}
          <Text style={styles.termsLink}>Privacy Policy</Text>
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContainer: {
    padding: 24,
    paddingBottom: 20,
  },
  headerSection: {
    alignItems: "center",
    marginBottom: 32,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${colors.primary}20`,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  headerText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
    textAlign: "center",
  },
  subHeaderText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 22,
  },
  optionsContainer: {
    marginBottom: 32,
  },
  categoryHeader: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginTop: 24,
    marginBottom: 12,
    marginLeft: 4,
  },
  optionCard: {
    backgroundColor: "white",
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  optionCardDisabled: {
    opacity: 0.6,
  },
  optionContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${colors.primary}15`,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  optionIconDisabled: {
    backgroundColor: "#F5F5F5",
  },
  optionText: {
    flex: 1,
    marginRight: 16,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  optionTitleDisabled: {
    color: "#A0A0A0",
  },
  optionDescription: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  optionDescriptionDisabled: {
    color: "#A0A0A0",
  },
  summarySection: {
    backgroundColor: "#F0F9FF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E0F2FE",
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#0369A1",
    marginBottom: 8,
    textAlign: "center",
  },
  summaryText: {
    fontSize: 14,
    color: "#0369A1",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 8,
  },
  warningText: {
    fontSize: 12,
    color: "#DC2626",
    textAlign: "center",
    lineHeight: 16,
    fontStyle: "italic",
  },
  buttonContainer: {
    padding: 24,
    paddingTop: 16,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#E5E5E5",
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    marginBottom: 16,
  },
  buttonIcon: {
    marginRight: 8,
  },
  submitButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
  termsText: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
    lineHeight: 18,
  },
  termsLink: {
    color: colors.primary,
    fontWeight: "600",
  },
})