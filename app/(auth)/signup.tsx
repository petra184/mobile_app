"use client"
import { useState } from "react"
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Image,
} from "react-native"
import { useRouter } from "expo-router"
import { SafeAreaView } from "react-native-safe-area-context"
import Entypo from "@expo/vector-icons/Entypo"
import { useNotifications } from "@/context/notification-context"
import { colors } from "@/constants/colors"
import { signUpWithEmail } from "@/app/actions/main_actions" // Your existing import
import { updateUserPreferences } from "@/app/actions/users"

import PersonalInfoStep from "@/components/signup/personal_info"
import AccountCreationStep from "@/components/signup/account_settings"
import TeamSelectionStep from "@/components/signup/team_select"
import NotificationSettingsStep from "@/components/signup/notifications"

// Define the form data type
export type FormData = {
  firstName: string
  lastName: string
  birthday: string
  username: string
  password: string
  confirmPassword: string
  email: string
  phone_number: string
  favoriteTeams: string[]
  notificationsEnabled: boolean
  teamNotificationsEnabled: boolean
  pushNotifications: boolean
  emailNotifications: boolean
  gameNotifications: boolean
  newsNotifications: boolean
  specialOffers: boolean
}

export default function SignupScreen() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const { showSuccess, showError, showWarning } = useNotifications()

  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    birthday: "",
    username: "",
    password: "",
    confirmPassword: "",
    email: "",
    phone_number: "",
    favoriteTeams: [],
    notificationsEnabled: true,
    teamNotificationsEnabled: true,
    pushNotifications: true,
    emailNotifications: true,
    gameNotifications: true,
    newsNotifications: true,
    specialOffers: true
  })

  const goHome = () => {
    router.push("/")
  }

  const goBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    } else {
      goHome()
    }
  }

  const goNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1)
    }
  }

  const updateFormData = (updates: Partial<FormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }))
  }

  const validateForm = (): boolean => {
    // Check required fields
    if (!formData.email.trim()) {
      showWarning("Form Incomplete", "Please enter your email address.")
      return false
    }

    if (!formData.password) {
      showWarning("Form Incomplete", "Please enter a password.")
      return false
    }

    if (!formData.confirmPassword) {
      showWarning("Form Incomplete", "Please confirm your password.")
      return false
    }

    if (formData.password !== formData.confirmPassword) {
      showWarning("Password Mismatch", "Please make sure your passwords match.")
      return false
    }

    if (!formData.username.trim()) {
      showWarning("Form Incomplete", "Please enter a username.")
      return false
    }

    if (!formData.firstName.trim()) {
      showWarning("Form Incomplete", "Please enter your first name.")
      return false
    }

    if (!formData.lastName.trim()) {
      showWarning("Form Incomplete", "Please enter your last name.")
      return false
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      showWarning("Invalid Email", "Please enter a valid email address.")
      return false
    }

    // Validate password strength (optional)
    if (formData.password.length < 6) {
      showWarning("Weak Password", "Password must be at least 6 characters long.")
      return false
    }

    // Validate username (no spaces, special characters)
    const usernameRegex = /^[a-zA-Z0-9_]+$/
    if (!usernameRegex.test(formData.username)) {
      showWarning("Invalid Username", "Username can only contain letters, numbers, and underscores.")
      return false
    }

    return true
  }

  const handleFinalSubmit = async () => {
      if (!validateForm()) return

      setLoading(true)

      try {
        const result = await signUpWithEmail(
          formData.email.trim(),
          formData.password,
          formData.firstName.trim(),
          formData.lastName.trim(),
          formData.username.trim(),
          formData.phone_number.trim(),
          formData.birthday.trim()
        )
        if (result.success && result.user) {
          await updateUserPreferences(result.user.id, {
            favoriteTeams: formData.favoriteTeams || [],
            notificationsEnabled: true,
            pushNotifications: true,
            emailNotifications: true,
            gameNotifications: true,
            newsNotifications: true,
            specialOffers: true,
          })

          showSuccess("Almost Done!", `We've sent a verification email to ${formData.email.trim()}, check your email to verify the account!`)
          setTimeout(() => {
            router.push("./login") 
          }, 6000) 
        } else {
          showError("Signup Failed", result.message || "Failed to create account")
        }
      } catch (error) {
        console.error("💥 Unexpected error in handleFinalSubmit:", error)
        showError("Connection Error", "Unable to connect to the server. Please check your internet connection and try again.")
      } finally {
        console.log("⏳ Setting loading state to false")
        setLoading(false)
      }
  }


  const getStepTitle = () => {
    switch (currentStep) {
      case 1:
        return "Welcome!"
      case 2:
        return "Create an Account"
      case 3:
        return "Choose Your Teams"
      case 4:
        return "Almost Done!"
      default:
        return "Sign Up"
    }
  }

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return <PersonalInfoStep formData={formData} updateFormData={updateFormData} onNext={goNext} />
      case 2:
        return <AccountCreationStep formData={formData} updateFormData={updateFormData} onNext={goNext} />
      case 3:
        return <TeamSelectionStep formData={formData} updateFormData={updateFormData} onNext={goNext} />
      case 4:
        return (
          <NotificationSettingsStep
            formData={formData}
            updateFormData={updateFormData}
            onSubmit={handleFinalSubmit}
            loading={loading}
          />
        )
      default:
        return null
    }
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={styles.container} edges={["top"]}>
        <Image source={require("../../IMAGES/crowd.jpg")} style={styles.backgroundImage} />
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardAvoid}>
          <View style={styles.header}>
            <TouchableOpacity onPress={goBack} style={styles.backButton}>
              <Entypo name="chevron-left" size={24} color="black" />
            </TouchableOpacity>
            <Text style={styles.title}>{getStepTitle()}</Text>
            {/* Progress indicator */}
            <View style={styles.progressContainer}>
              {[1, 2, 3, 4].map((step) => (
                <View key={step} style={[styles.progressDot, step <= currentStep && styles.progressDotActive]} />
              ))}
            </View>
          </View>

          {renderCurrentStep()}

          {/* Already have an account section - only show on first step */}
          {currentStep === 1 && (
            <View style={styles.loginPrompt}>
              <Text style={styles.loginPromptText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.push("./login")}>
                <Text style={styles.loginPromptLink}>Log in</Text>
              </TouchableOpacity>
            </View>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  backgroundImage: {
    position: "absolute",
    bottom: 0,
    resizeMode: "cover",
    opacity: 0.1,
    zIndex: 0,
  },
  header: {
    padding: 24,
    marginBottom: -20,
  },
  backButton: {
    top: -20,
  },
  keyboardAvoid: {
    flex: 1,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
    textAlign: "center",
  },
  progressContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#E5E5E5",
    marginHorizontal: 6,
  },
  progressDotActive: {
    backgroundColor: colors.primary,
  },
  loginPrompt: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
    marginBottom: 60,
  },
  loginPromptText: {
    color: "#666",
    fontSize: 16,
  },
  loginPromptLink: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: "600",
  },
})