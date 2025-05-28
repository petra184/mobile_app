"use client"

import { useState } from "react"
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  TouchableWithoutFeedback,
  Keyboard,
  Image,
  TextInput,
  ScrollView,
} from "react-native"
import { useRouter } from "expo-router"
import { Ionicons } from "@expo/vector-icons"
import { signUpWithEmail, upsertProfile } from "@/app/actions/main_actions"
import { SafeAreaView } from "react-native-safe-area-context"
import Entypo from '@expo/vector-icons/Entypo';
import { useNotifications } from "@/context/notification-context"
import { colors } from "@/constants/colors"

// Define the form data type
type FormData = {
  firstName: string
  lastName: string
  username: string
  password: string
  confirmPassword: string
  email: string
  phone_number: string
}

// Define the form field keys type
type FormField = keyof FormData

export default function SignupScreen() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Initialize notifications - include showToast for action buttons
  const { showSuccess, showError, showWarning, showInfo, showToast } = useNotifications()

  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    username: "",
    password: "",
    confirmPassword: "",
    email: "",
    phone_number: "",
  })

  const handleInputChange = (field: FormField, value: string) => {
    setFormData({
      ...formData,
      [field]: value,
    })
  }

  const goHome = () => {
    router.push("/")
  }

  async function handleSignup() {
    // Check if all required fields are filled
    const requiredFields: FormField[] = ["firstName", "lastName", "username", "password", "confirmPassword", "email"]
    const missingFields = requiredFields.filter((field) => !formData[field])

    if (missingFields.length > 0) {
      showWarning("Missing Required Fields", "Please fill in all required fields to continue")
      return
    }

    // Check if passwords match
    if (formData.password !== formData.confirmPassword) {
      showError("Password Mismatch", "The passwords you entered do not match. Please try again.")
      return
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      showError("Invalid Email", "Please enter a valid email address")
      return
    }

    // Basic password validation
    if (formData.password.length < 6) {
      showWarning("Weak Password", "Password must be at least 6 characters long for security")
      return
    }

    setLoading(true)
    try {
      const fullName = `${formData.firstName} ${formData.lastName}`
      const { success, message, user } = await signUpWithEmail(
        formData.email,
        formData.password,
        formData.firstName,
        formData.lastName,
        formData.username,
        formData.phone_number,
      )

      if (success && user) {
        // Save additional user data to profiles table
        await upsertProfile(user.id, {
          username: formData.username,
          first_name: formData.firstName,
          last_name: formData.lastName,
          full_name: fullName,
          phone_number: formData.phone_number || "",
        })

        if (message) {
          showSuccess("Account Created!", message)
          setTimeout(() => {
            router.push("../(tabs)")
          }, 2000)
        } else {
          showSuccess("Welcome!", "Your account has been created successfully")
          setTimeout(() => {
            router.push("./login")
          }, 1500)
        }
      } else if (success) {
        // Email confirmation is required - use showToast for action button
        showToast({
          type: "info",
          title: "Check Your Email",
          message: message || "We've sent a confirmation link to your email. Please verify your account before logging in.",
          duration: 6000,
          action: {
            label: "Go to Login",
            onPress: () => router.push("./login")
          }
        })
      } else {
        showError("Signup Failed", message || "Unable to create your account. Please try again.")
      }
    } catch (error) {
      console.error("Signup error:", error)
      showError("Connection Error", "Unable to connect to the server. Please check your internet connection and try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={styles.container} edges={["top"]}>
        <Image
          source={require("../../IMAGES/crowd.jpg")} // Update path as needed
          style={styles.backgroundImage}
        />
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardAvoid}>
          <View style={styles.header}>
            <TouchableOpacity onPress={goHome} style={styles.backButton}>
               <Entypo name="chevron-left" size={24} color="black" />
            </TouchableOpacity>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Sign up to start earning rewards at campus events</Text>
          </View>
          <ScrollView contentContainerStyle={styles.scrollContainer}>
            <View style={styles.formContainer}>
              {/* First Name and Last Name */}
              <View style={styles.rowContainer}>
                <TextInput
                  style={[styles.input, styles.halfInput]}
                  placeholder="First Name"
                  value={formData.firstName}
                  onChangeText={(value) => handleInputChange("firstName", value)}
                  placeholderTextColor="#A0A0A0"
                />
                <TextInput
                  style={[styles.input, styles.halfInput]}
                  placeholder="Last Name"
                  value={formData.lastName}
                  onChangeText={(value) => handleInputChange("lastName", value)}
                  placeholderTextColor="#A0A0A0"
                />
              </View>

              {/* Username */}
              <TextInput
                style={[styles.input, styles.fullInput]}
                placeholder="Username"
                value={formData.username}
                onChangeText={(value) => handleInputChange("username", value)}
                autoCapitalize="none"
                placeholderTextColor="#A0A0A0"
              />

              {/* Password */}
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  placeholder="Password"
                  value={formData.password}
                  onChangeText={(value) => handleInputChange("password", value)}
                  secureTextEntry={!showPassword}
                  placeholderTextColor="#A0A0A0"
                />
                <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons name={showPassword ? "eye-off" : "eye"} size={24} color="#A0A0A0" />
                </TouchableOpacity>
              </View>
              <Text style={styles.passwordHint}>Must be at least 6 characters</Text>

              {/* Confirm Password */}
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  placeholder="Confirm Password"
                  value={formData.confirmPassword}
                  onChangeText={(value) => handleInputChange("confirmPassword", value)}
                  secureTextEntry={!showConfirmPassword}
                  placeholderTextColor="#A0A0A0"
                />
                <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                  <Ionicons name={showConfirmPassword ? "eye-off" : "eye"} size={24} color="#A0A0A0" />
                </TouchableOpacity>
              </View>

              {/* Email */}
              <TextInput
                style={[styles.input, styles.fullInput]}
                placeholder="Email (school.edu)"
                value={formData.email}
                onChangeText={(value) => handleInputChange("email", value)}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#A0A0A0"
              />

              {/* Phone Number */}
              <TextInput
                style={[styles.input, styles.fullInput]}
                placeholder="Phone Number (optional)"
                value={formData.phone_number}
                onChangeText={(value) => handleInputChange("phone_number", value)}
                keyboardType="phone-pad"
                placeholderTextColor="#A0A0A0"
              />

              <TouchableOpacity style={styles.signupButton} onPress={handleSignup} disabled={loading}>
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.signupButtonText}>Create Account</Text>
                )}
              </TouchableOpacity>

              <Text style={styles.termsText}>
                By signing up, you agree to our <Text style={styles.termsLink}>Terms of Service</Text> and{" "}
                <Text style={styles.termsLink}>Privacy Policy</Text>
              </Text>
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.push("./login")}>
                <Text style={styles.loginText}>Log In</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
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
    height: "65%",
    opacity: 0.1,
    zIndex: 0,
  },
  header: {
    padding: 24,
  },
  backButton: {
    top: -20,
  },
  backButtonText: {
    fontSize: 24,
    fontWeight: "600",
    color: "#333",
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 80, // Extra padding at the bottom for the footer
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  formContainer: {
    padding: 24,
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
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    position: "relative",
    marginBottom: 0,
  },
  passwordInput: {
    flex: 1,
    paddingRight: 50, // Space for the eye icon
  },
  eyeIcon: {
    position: "absolute",
    right: 16,
    height: "100%",
    justifyContent: "center",
    paddingBottom: 15,
  },
  passwordHint: {
    fontSize: 12,
    color: "#666",
    marginTop: -12,
    marginBottom: 16,
    paddingLeft: 5,
  },
  signupButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  signupButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
  termsText: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
    marginTop: 16,
  },
  termsLink: {
    color: colors.primary,
    fontWeight: "600",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    position: "absolute",
    bottom: 40,
    left: 0,
    right: 0,
  },
  footerText: {
    color: "#666",
    fontSize: 16,
  },
  loginText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: "600",
  },
})