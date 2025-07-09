"use client"
import { View, Text, StyleSheet, Switch, Pressable, Alert, ScrollView, Image, Platform } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useState } from "react"
import { colors } from "@/constants/colors"
import { useUserStore } from "@/hooks/userStore" // Corrected import path
import { useRouter } from "expo-router"
import Feather from "@expo/vector-icons/Feather"
import SimpleLineIcons from "@expo/vector-icons/SimpleLineIcons"

export default function AccountSettingsScreen() {
  const router = useRouter()
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({})

  const {
    preferences,
    setNotificationsEnabled,
    setPushNotifications,
    setEmailNotifications,
    setGameNotifications,
    setNewsNotifications,
    setSpecialOffers,
    getUserName,
    userEmail,
    isLoading,
  } = useUserStore()

  // Get actual user data from store
  const userName = getUserName()

  // Helper function to handle notification toggles with proper loading states
  const handleNotificationToggle = async (
    setter: (enabled: boolean) => Promise<void>,
    currentValue: boolean | undefined,
    notificationType: string,
    loadingKey: string,
  ) => {
    // Prevent multiple rapid toggles
    if (loadingStates[loadingKey]) return

    setLoadingStates((prev) => ({ ...prev, [loadingKey]: true }))

    try {
      console.log(`Toggling ${notificationType} from ${currentValue} to ${!currentValue}`)
      await setter(!currentValue)
      console.log(`Successfully updated ${notificationType}`)
    } catch (error) {
      console.error(`Failed to update ${notificationType}:`, error)
      Alert.alert("Error", `Failed to update ${notificationType}. Please try again.`)
    } finally {
      setLoadingStates((prev) => ({ ...prev, [loadingKey]: false }))
    }
  }

  // Individual notification handlers with loading keys
  const handleToggleAllNotifications = async () => {
    await handleNotificationToggle(
      setNotificationsEnabled,
      preferences.notificationsEnabled,
      "all notifications",
      "allNotifications",
    )
  }

  const handleTogglePushNotifications = async () => {
    await handleNotificationToggle(
      setPushNotifications,
      preferences.pushNotifications,
      "push notifications",
      "pushNotifications",
    )
  }

  const handleToggleEmailNotifications = async () => {
    await handleNotificationToggle(
      setEmailNotifications,
      preferences.emailNotifications,
      "email notifications",
      "emailNotifications",
    )
  }

  const handleToggleGameNotifications = async () => {
    await handleNotificationToggle(
      setGameNotifications,
      preferences.gameNotifications,
      "game notifications",
      "gameNotifications",
    )
  }

  const handleToggleNewsNotifications = async () => {
    await handleNotificationToggle(
      setNewsNotifications,
      preferences.newsNotifications,
      "news notifications",
      "newsNotifications",
    )
  }

  const handleToggleSpecialOffers = async () => {
    await handleNotificationToggle(setSpecialOffers, preferences.specialOffers, "special offers", "specialOffers")
  }

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      `Are you sure you want to delete your account (${userEmail})? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            Alert.alert("Account Deletion", "This is a demo app. Account deletion is not implemented.")
          },
        },
      ],
    )
  }

  const navigateToChangePass = () => {
    router.push("/user_profile/change_password")
  }

  const getDoc = (vrsta: string) => {
    router.push({
      pathname: "/user_profile/documents",
      params: { type: vrsta },
    })
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading settings...</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={["left"]}>
      <Image source={require("../../../IMAGES/crowd.jpg")} style={styles.backgroundImage} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* Notification Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notification Settings</Text>

          <View style={styles.settingsContainer}>
            {/* Master Notifications Toggle */}
            <View style={styles.settingWithButton}>
              <View style={styles.settingLeft}>
                <Feather name="bell" size={20} color={colors.text} style={styles.settingIcon} />
                <View style={styles.settingTextContainer}>
                  <Text style={styles.settingText}>All Notifications</Text>
                  <Text style={styles.settingSubtext}>Master toggle for all notifications</Text>
                </View>
              </View>
              <View style={styles.switchContainer}>
                {loadingStates.allNotifications && <Text style={styles.loadingIndicator}>...</Text>}
                <Switch
                  value={preferences.notificationsEnabled}
                  onValueChange={handleToggleAllNotifications}
                  disabled={loadingStates.allNotifications}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </View>

            {/* Individual notification settings - only show if master toggle is on */}
            {preferences.notificationsEnabled && (
              <>
                <View style={styles.settingWithButton}>
                  <View style={styles.settingLeft}>
                    <Feather name="smartphone" size={20} color={colors.text} style={styles.settingIcon} />
                    <Text style={styles.settingText}>Push Notifications</Text>
                  </View>
                  <View style={styles.switchContainer}>
                    {loadingStates.pushNotifications && <Text style={styles.loadingIndicator}>...</Text>}
                    <Switch
                      value={preferences.pushNotifications ?? true}
                      onValueChange={handleTogglePushNotifications}
                      disabled={loadingStates.pushNotifications}
                      trackColor={{ false: colors.border, true: colors.primary }}
                      thumbColor="#FFFFFF"
                    />
                  </View>
                </View>

                <View style={styles.settingWithButton}>
                  <View style={styles.settingLeft}>
                    <Feather name="mail" size={20} color={colors.text} style={styles.settingIcon} />
                    <Text style={styles.settingText}>Email Notifications</Text>
                  </View>
                  <View style={styles.switchContainer}>
                    {loadingStates.emailNotifications && <Text style={styles.loadingIndicator}>...</Text>}
                    <Switch
                      value={preferences.emailNotifications ?? true}
                      onValueChange={handleToggleEmailNotifications}
                      disabled={loadingStates.emailNotifications}
                      trackColor={{ false: colors.border, true: colors.primary }}
                      thumbColor="#FFFFFF"
                    />
                  </View>
                </View>

                <View style={styles.settingWithButton}>
                  <View style={styles.settingLeft}>
                    <SimpleLineIcons
                      name="screen-smartphone"
                      size={20}
                      color={colors.text}
                      style={styles.settingIcon}
                    />
                    <Text style={styles.settingText}>Game Notifications</Text>
                  </View>
                  <View style={styles.switchContainer}>
                    {loadingStates.gameNotifications && <Text style={styles.loadingIndicator}>...</Text>}
                    <Switch
                      value={preferences.gameNotifications ?? true}
                      onValueChange={handleToggleGameNotifications}
                      disabled={loadingStates.gameNotifications}
                      trackColor={{ false: colors.border, true: colors.primary }}
                      thumbColor="#FFFFFF"
                    />
                  </View>
                </View>

                <View style={styles.settingWithButton}>
                  <View style={styles.settingLeft}>
                    <Feather name="globe" size={20} color={colors.text} style={styles.settingIcon} />
                    <Text style={styles.settingText}>News Updates</Text>
                  </View>
                  <View style={styles.switchContainer}>
                    {loadingStates.newsNotifications && <Text style={styles.loadingIndicator}>...</Text>}
                    <Switch
                      value={preferences.newsNotifications ?? true}
                      onValueChange={handleToggleNewsNotifications}
                      disabled={loadingStates.newsNotifications}
                      trackColor={{ false: colors.border, true: colors.primary }}
                      thumbColor="#FFFFFF"
                    />
                  </View>
                </View>

                <View style={[styles.settingWithButton, styles.lastItem]}>
                  <View style={styles.settingLeft}>
                    <Feather name="tag" size={20} color={colors.text} style={styles.settingIcon} />
                    <Text style={styles.settingText}>Special Offers</Text>
                  </View>
                  <View style={styles.switchContainer}>
                    {loadingStates.specialOffers && <Text style={styles.loadingIndicator}>...</Text>}
                    <Switch
                      value={preferences.specialOffers ?? false}
                      onValueChange={handleToggleSpecialOffers}
                      disabled={loadingStates.specialOffers}
                      trackColor={{ false: colors.border, true: colors.primary }}
                      thumbColor="#FFFFFF"
                    />
                  </View>
                </View>
              </>
            )}

            {/* Show disabled state when master toggle is off */}
            {!preferences.notificationsEnabled && (
              <View style={[styles.settingWithButton, styles.lastItem, styles.disabledSetting]}>
                <View style={styles.settingLeft}>
                  <Feather
                    name="bell-off"
                    size={20}
                    color={colors.text}
                    style={[styles.settingIcon, styles.disabledIcon]}
                  />
                  <Text style={[styles.settingText, styles.disabledText]}>All notifications are disabled</Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Security Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security</Text>

          <View style={styles.settingsContainer}>
            <Pressable style={[styles.settingItem, styles.lastItem]} onPress={navigateToChangePass}>
              <View style={styles.settingLeft}>
                <Feather name="lock" size={20} color={colors.text} style={styles.settingIcon} />
                <Text style={styles.settingText}>Change Password</Text>
              </View>
              <Feather name="chevron-right" size={20} color={colors.text} />
            </Pressable>
          </View>
        </View>

        {/* Support & Legal */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support & Legal</Text>

          <View style={styles.settingsContainer}>
            <Pressable style={styles.settingItem} onPress={() => getDoc("1")}>
              <View style={styles.settingLeft}>
                <Feather name="help-circle" size={20} color={colors.text} style={styles.settingIcon} />
                <Text style={styles.settingText}>Help & Support</Text>
              </View>
              <Feather name="chevron-right" size={20} color={colors.text} />
            </Pressable>

            <Pressable style={styles.settingItem} onPress={() => getDoc("2")}>
              <View style={styles.settingLeft}>
                <Feather name="file-text" size={20} color={colors.text} style={styles.settingIcon} />
                <Text style={styles.settingText}>Terms of Service</Text>
              </View>
              <Feather name="chevron-right" size={20} color={colors.text} />
            </Pressable>

            <Pressable style={[styles.settingItem, styles.lastItem]} onPress={() => getDoc("3")}>
              <View style={styles.settingLeft}>
                <Feather name="shield" size={20} color={colors.text} style={styles.settingIcon} />
                <Text style={styles.settingText}>Privacy Policy</Text>
              </View>
              <Feather name="chevron-right" size={20} color={colors.text} />
            </Pressable>
          </View>

          <Pressable style={styles.deleteButton} onPress={handleDeleteAccount}>
            <Feather name="trash-2" size={20} color={colors.error} style={styles.deleteIcon} />
            <Text style={styles.deleteText}>Delete Account</Text>
          </Pressable>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  bottomSpacing: {
    height: 40,
  },
  backgroundImage: {
    position: "absolute",
    bottom: 0,
    resizeMode: "cover",
    opacity: 0.1,
    zIndex: 0,
  },
  scrollContent: {
    paddingBottom: 20,
    padding: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: colors.text,
  },
  section: {
    marginTop: 24,
    marginHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 12,
  },
  settingsContainer: {
    backgroundColor: colors.card,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
  },
  userInfoItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  settingWithButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    ...Platform.select({
      ios: {
        paddingVertical: 14,
      },
      android: {
        paddingVertical: 12,
      },
    }),
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  settingIcon: {
    marginRight: 12,
  },
  settingText: {
    fontSize: 16,
    color: colors.text,
    fontWeight: "500",
  },
  settingTextContainer: {
    flex: 1,
  },
  settingSubtext: {
    fontSize: 14,
    color: colors.text,
    opacity: 0.6,
    marginTop: 2,
  },
  switchContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  loadingIndicator: {
    fontSize: 16,
    color: colors.primary,
    marginRight: 8,
    fontWeight: "bold",
  },
  // Disabled state styles
  disabledSetting: {
    opacity: 0.6,
  },
  disabledIcon: {
    opacity: 0.5,
  },
  disabledText: {
    opacity: 0.7,
    fontStyle: "italic",
  },
  bottomSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: colors.background,
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    marginVertical: 24,
    paddingVertical: 12,
    borderRadius: 8,
    height: 48,
  },
  deleteIcon: {
    marginRight: 8,
  },
  deleteText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.error,
  },
})
