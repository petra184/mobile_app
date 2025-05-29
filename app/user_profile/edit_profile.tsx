import { useState, useEffect } from "react"
import { View, Text, StyleSheet, TextInput, Pressable, Alert, Image, ScrollView, Platform, ActivityIndicator } from "react-native"
import { useRouter } from "expo-router"
import { SafeAreaView } from "react-native-safe-area-context"
import { colors } from "@/constants/colors"
//import * as ImagePicker from "expo-image-picker"
import Feather from '@expo/vector-icons/Feather'
import { useUserStore } from '@/hooks/userStore'
import { getCurrentUser } from '@/app/actions/main_actions'

function capitalize(name: string) {
  return name
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

export default function EditProfileScreen() {
  const router = useRouter()
  const { first_name: storeFirstName, last_name: storeLastName, userEmail, refreshUserData } = useUserStore()
  
  const [first_name, setFirstName] = useState("")
  const [last_name, setLastName] = useState("")
  const [username, setUsername] = useState("")
  const [profileImage, setProfileImage] = useState<string | null>(null)
  const [phone, setPhone] = useState("")
  const [birthday, setBirthday] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true)
        
        // Get data from auth metadata
        const authData = await getCurrentUser()
        
        // Use store data as primary source, fallback to auth data
        setFirstName(storeFirstName || authData?.first_name || "")
        setLastName(storeLastName || authData?.last_name || "")
        setUsername(authData?.username || "")
        setPhone(authData?.phone_number || "")
        setBirthday(authData?.birthday || "")
        
        console.log('Edit Profile - Store data:', { storeFirstName, storeLastName })
        console.log('Edit Profile - Auth data:', authData)
        
      } catch (error) {
        console.error('Error fetching user data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [storeFirstName, storeLastName])

  // Function to handle image selection
  // const pickImage = async () => {
  //   // const result = await ImagePicker.launchImageLibraryAsync({
  //   //   mediaTypes: ImagePicker.MediaTypeOptions.Images,
  //   //   allowsEditing: true,
  //   //   quality: 1,
  //   //   aspect: [1, 1], // Square crop
  //   // })

  //   if (!result.canceled) {
  //     setProfileImage(result.assets[0].uri)
  //   }
  // }

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

    try {
      setIsSaving(true)
      
      // Here you would typically call an API to update the user profile
      // For now, we'll just refresh the user data and show success
      await refreshUserData()
      
      Alert.alert("Success", "Profile updated successfully", [
        { text: "OK", onPress: () => router.back() }
      ])
    } catch (error) {
      console.error('Error saving profile:', error)
      Alert.alert("Error", "Failed to update profile. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={["bottom"]}>
        <Image source={require("../../IMAGES/crowd.jpg")} style={styles.backgroundImage} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <>
      <SafeAreaView style={styles.container} edges={["bottom"]}>
        {/* Back Button */}
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Feather name="chevron-left" size={24} color={colors.primary} />
        </Pressable>

        <Image source={require("../../IMAGES/crowd.jpg")} style={styles.backgroundImage} />

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Profile Image Section */}
          <View style={styles.profileImageSection}>
            <View style={styles.profileImageContainer}>
              {profileImage ? (
                <Image source={{ uri: profileImage }} style={styles.profileImage} />
              ) : (
                <Feather name="user" size={60} color={colors.primary} />
              )}

              {/* Circular Edit (Pencil) Button */}
              {/* <Pressable style={styles.editPhotoButton}> </View>onPress={pickImage}>
                <Feather name="edit-2" size={16} color="white" />
              </Pressable> */}
            </View>
          </View>

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
                style={styles.input}
                value={username}
                onChangeText={(text) => setUsername(text)}
                placeholder="Enter username"
                placeholderTextColor={colors.textSecondary}
                autoCapitalize="none"
              />
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
            style={[styles.saveButton, isSaving && styles.saveButtonDisabled]} 
            onPress={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
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
        marginTop: 18,
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
    justifyContent: 'center',
    alignItems: 'center',
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
        paddingTop: 55,
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
    borderRadius: 50,
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
  disabledInput: {
    backgroundColor: colors.border,
    color: colors.textSecondary,
  },
  helperText: {
    fontSize: 12,
    color: colors.textSecondary,
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
})