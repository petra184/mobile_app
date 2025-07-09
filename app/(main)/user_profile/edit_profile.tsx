"use client"

import { useState, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Alert,
  Image,
  ScrollView,
  Platform,
  ActivityIndicator,
} from "react-native"
import { useRouter } from "expo-router"
import { SafeAreaView } from "react-native-safe-area-context"
import { colors } from "@/constants/colors"
import * as ImagePicker from "expo-image-picker"
import Feather from "@expo/vector-icons/Feather"
import { useUserStore } from "@/hooks/userStore"
import { getCurrentUser } from "@/app/actions/main_actions"
import { updateProfileWithImage, updateUserProfileData, checkUsernameAvailability, getUserById } from "@/app/actions/users"

function capitalize(name: string) {
  return name.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase())
}

export default function EditProfileScreen() {
  const router = useRouter()
  const { userId, first_name: storeFirstName, last_name: storeLastName, userEmail, refreshUserData } = useUserStore()

  const [first_name, setFirstName] = useState("")
  const [last_name, setLastName] = useState("")
  const [username, setUsername] = useState("")
  const [profileImage, setProfileImage] = useState<string | null>(null)
  const [originalProfileImage, setOriginalProfileImage] = useState<string | null>(null)
  const [phone, setPhone] = useState("")
  const [birthday, setBirthday] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isImageUploading, setIsImageUploading] = useState(false)
  const [usernameError, setUsernameError] = useState("")
  const [originalUsername, setOriginalUsername] = useState("")

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true)

        if (!userId) {
          Alert.alert("Error", "User not found")
          router.back()
          return
        }

        // Get data from both auth metadata and database
        const [authData, userData] = await Promise.all([getCurrentUser(), getUserById(userId)])

        // Use database data as primary source, fallback to auth data, then store data
        setFirstName(userData?.first_name || storeFirstName || authData?.first_name || "")
        setLastName(userData?.last_name || storeLastName || authData?.last_name || "")
        setUsername(userData?.username || authData?.username || "")
        setOriginalUsername(userData?.username || authData?.username || "")
        setPhone(userData?.phone_number || authData?.phone_number || "")
        setBirthday(userData?.birthday || authData?.birthday || "")
        setProfileImage(userData?.profile_image_url || null)
        setOriginalProfileImage(userData?.profile_image_url || null)

        console.log("Edit Profile - User data loaded:", {
          firstName: userData?.first_name,
          lastName: userData?.last_name,
          username: userData?.username,
          profileImage: userData?.profile_image_url,
        })
      } catch (error) {
        console.error("Error fetching user data:", error)
        Alert.alert("Error", "Failed to load profile data")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [userId, storeFirstName, storeLastName])

  // Validate username as user types
  useEffect(() => {
    const validateUsername = async () => {
      if (!username.trim() || username === originalUsername) {
        setUsernameError("")
        return
      }

      try {
        const result = await checkUsernameAvailability(username)
        setUsernameError(result.available ? "" : result.message)
      } catch (error) {
        console.error("Error checking username:", error)
      }
    }

    const timeoutId = setTimeout(validateUsername, 500) // Debounce
    return () => clearTimeout(timeoutId)
  }, [username, originalUsername])

  // Function to handle image selection
  const pickImage = async () => {
    try {
      // Request permission
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync()

      if (permissionResult.granted === false) {
        Alert.alert("Permission Required", "Please allow access to your photo library to update your profile picture.")
        return
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8, // Reduce quality for faster upload
        aspect: [1, 1], // Square crop
      })

      if (!result.canceled && result.assets[0]) {
        setProfileImage(result.assets[0].uri)
      }
    } catch (error) {
      console.error("Error picking image:", error)
      Alert.alert("Error", "Failed to select image. Please try again.")
    }
  }

  const handleSave = async () => {
    // Validate inputs
    if (!first_name.trim() || !last_name.trim()) {
      Alert.alert("Error", "First and Last name cannot be empty")
      return
    }

    if (!username.trim()) {
      Alert.alert("Error", "Username cannot be empty")
      return
    }

    if (usernameError) {
      Alert.alert("Error", "Please fix the username error before saving")
      return
    }

    if (!userId) {
      Alert.alert("Error", "User ID not found")
      return
    }

    try {
      setIsSaving(true)
      setIsImageUploading(true)

      const profileData = {
        first_name: first_name.trim(),
        last_name: last_name.trim(),
        username: username.trim(),
        phone_number: phone.trim() || undefined,
        birthday: birthday.trim() || undefined,
      }

      // Check if image changed
      const imageChanged = profileImage !== originalProfileImage
      const newImageUri = imageChanged && profileImage && !profileImage.startsWith("http") ? profileImage : undefined

      let success = false

      if (newImageUri) {
        // Update profile with new image
        success = await updateProfileWithImage(userId, profileData, newImageUri, originalProfileImage || undefined)
      } else {
        // Update profile without changing image
        success = await updateUserProfileData(userId, profileData)
      }

      if (success) {
        // Refresh user data in store
        await refreshUserData()

        Alert.alert("Success", "Profile updated successfully", [{ text: "OK", onPress: () => router.back() }])
      } else {
        throw new Error("Profile update failed")
      }
    } catch (error) {
      console.error("Error saving profile:", error)
      Alert.alert("Error", "Failed to update profile. Please try again.")
    } finally {
      setIsSaving(false)
      setIsImageUploading(false)
    }
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={["bottom"]}>
        <Image source={require("../../../IMAGES/crowd.jpg")} style={styles.backgroundImage} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <>
      <SafeAreaView style={styles.container} edges={["right"]}>
        {/* Back Button */}
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Feather name="chevron-left" size={24} color={colors.primary} />
        </Pressable>

        <Image source={require("../../../IMAGES/crowd.jpg")} style={styles.backgroundImage} />

       
          {/* Profile Image Section */}
          <View style={styles.profileImageSection}>
            <View style={styles.profileImageContainer}>
              {profileImage ? (
                <Image source={{ uri: profileImage }} style={styles.profileImage} />
              ) : (
                <Feather name="user" size={60} color={colors.primary} />
              )}

              {/* Circular Edit (Pencil) Button */}
              <Pressable
                style={[styles.editPhotoButton, isImageUploading && styles.editPhotoButtonDisabled]}
                onPress={pickImage}
                disabled={isImageUploading}
              >
                {isImageUploading ? (
                  <ActivityIndicator size={12} color="white" />
                ) : (
                  <Feather name="edit-2" size={16} color="white" />
                )}
              </Pressable>
            </View>

            {profileImage && (
              <Text style={styles.imageHint}>
                {profileImage.startsWith("http") ? "Current profile photo" : "New photo selected"}
              </Text>
            )}
          </View>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Form */}
          <View style={styles.formContainer}>
            {/* First & Last Name in One Row */}
            <View style={styles.row}>
              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.label}>First Name</Text>
                <TextInput
                  style={styles.input}
                  value={first_name}
                  onChangeText={(text) => setFirstName(capitalize(text))}
                  placeholder="Enter first name"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>

              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.label}>Last Name</Text>
                <TextInput
                  style={styles.input}
                  value={last_name}
                  onChangeText={(text) => setLastName(capitalize(text))}
                  placeholder="Enter last name"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Username</Text>
              <TextInput
                style={[styles.input, usernameError ? styles.inputError : null]}
                value={username}
                onChangeText={(text) => setUsername(text.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                placeholder="Enter username"
                placeholderTextColor={colors.textSecondary}
                autoCapitalize="none"
              />
              {usernameError ? <Text style={styles.errorText}>{usernameError}</Text> : null}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={[styles.input, styles.disabledInput]}
                value={userEmail || ""}
                placeholder="Email address"
                placeholderTextColor={colors.textSecondary}
                editable={false}
              />
              <Text style={styles.helperText}>Email cannot be changed</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number</Text>
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={(text) => setPhone(text)}
                placeholder="Enter phone number"
                placeholderTextColor={colors.textSecondary}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Birthday</Text>
              <TextInput
                style={styles.input}
                value={birthday}
                onChangeText={(text) => setBirthday(text)}
                placeholder="MM/DD/YYYY"
                placeholderTextColor={colors.textSecondary}
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Save Button */}
          <Pressable
            style={[styles.saveButton, (isSaving || usernameError) && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={isSaving || !!usernameError}
          >
            {isSaving ? (
              <View style={styles.savingContainer}>
                <ActivityIndicator size="small" color="#FFFFFF" />
                <Text style={styles.saveButtonText}>{isImageUploading ? "Uploading image..." : "Saving..."}</Text>
              </View>
            ) : (
              <Text style={styles.saveButtonText}>Save Changes</Text>
            )}
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    top: 0,
  },
  backButton: {
    position: "absolute",
    left: 16,
    ...Platform.select({
      ios: {
        marginTop: 30,
      },
      android: {
        marginTop: 20,
      },
    }),
    top: "5%",
    transform: [{ translateY: -12 }],
    zIndex: 10,
  },
  backgroundImage: {
    position: "absolute",
    bottom: 0,
    resizeMode: "cover",
    opacity: 0.1,
    zIndex: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.textSecondary,
  },
  profileImageSection: {
    alignItems: "center",
    padding: 24,
    ...Platform.select({
      ios: {
        paddingTop: 75,
      },
      android: {
        paddingTop: 65,
      },
    }),
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  profileImageContainer: {
    width: 110,
    height: 110,
    borderRadius: 60,
    backgroundColor: "rgba(59, 130, 246, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  profileImage: {
    width: "100%",
    height: "100%",
    borderRadius: 55,
  },
  editPhotoButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  editPhotoButtonDisabled: {
    opacity: 0.6,
  },
  imageHint: {
    marginTop: 8,
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: "center",
  },
  formContainer: {
    padding: 16,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  halfWidth: {
    width: "48%",
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
  },
  inputError: {
    borderColor: "#ef4444",
  },
  disabledInput: {
    backgroundColor: colors.border,
    color: colors.textSecondary,
  },
  helperText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  errorText: {
    fontSize: 12,
    color: "#ef4444",
    marginTop: 4,
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    marginHorizontal: 16,
    marginVertical: 24,
    paddingVertical: 14,
    borderRadius: 50,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  savingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
})
