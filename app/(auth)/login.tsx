"use client"
import { colors } from "@/constants/Colors"
import { useNotifications } from "@/context/notification-context"
import { useUserStore } from "@/hooks/userStore"
import { signInWithEmailOrUsername } from "@/lib/actions/main_actions"
import { Ionicons } from "@expo/vector-icons"
import Entypo from "@expo/vector-icons/Entypo"
import { useRouter } from "expo-router"
import { useState } from "react"
import {
  ActivityIndicator,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native"

export default function LoginScreen() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [identifier, setIdentifier] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false)

  const { showSuccess, showError, showWarning } = useNotifications()
  const { setUser, clearUserData } = useUserStore()

  const goHome = () => {
    router.push("/")
  }

  // Enhanced input validation
  const validateInputs = () => {
    if (!identifier.trim()) {
      showWarning("Missing Email/Username", "Please enter your email address or username")
      return false
    }

    if (!password.trim()) {
      showWarning("Missing Password", "Please enter your password")
      return false
    }

    if (password.length < 6) {
      showWarning("Invalid Password", "Password must be at least 6 characters long")
      return false
    }

    // Basic email validation if it looks like an email
    if (identifier.includes("@")) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(identifier)) {
        showWarning("Invalid Email", "Please enter a valid email address")
        return false
      }
    } else {
      // Username validation
      if (identifier.length < 3) {
        showWarning("Invalid Username", "Username must be at least 3 characters long")
        return false
      }

      // Check for invalid characters in username
      const usernameRegex = /^[a-zA-Z0-9_.-]+$/
      if (!usernameRegex.test(identifier)) {
        showWarning("Invalid Username", "Username can only contain letters, numbers, dots, hyphens, and underscores")
        return false
      }
    }

    return true
  }

  async function handleLogin() {
    // Clear any previous user data
    clearUserData()

    // Validate inputs first
    if (!validateInputs()) {
      return
    }

    setLoading(true)

    try {
      const result = await signInWithEmailOrUsername(identifier.trim(), password)

      if (result.success && result.user) {
        showSuccess("Welcome back!", "You have successfully logged in")
        // Pass the rememberMe preference to setUser
        await setUser(result.user.id, result.user.email, rememberMe)
        router.push("../(main)/(tabs)/home")
      } else {
        // Handle specific error cases
        handleLoginError(result.message, result.message)
      }
    } catch (error) {
      console.error("Unexpected login error:", error)
      showError(
        "Connection Error",
        "Unable to connect to the server. Please check your internet connection and try again.",
      )
    } finally {
      setLoading(false)
    }
  }

  // Enhanced error handling function
  const handleLoginError = (errorType?: string, message?: string) => {
    switch (errorType) {
      case "USERNAME_NOT_FOUND":
        showError(
          "Username Not Found",
          "The username you entered doesn't exist. Please check your username or sign up for a new account.",
        )
        break

      case "EMAIL_NOT_FOUND":
        showError(
          "Email Not Found",
          "No account found with this email address. Please check your email or sign up for a new account.",
        )
        break

      case "INVALID_PASSWORD":
        showError(
          "Incorrect Password",
          "The password you entered is incorrect. Please try again or reset your password.",
        )
        break

      case "ACCOUNT_DISABLED":
        showError("Account Disabled", "Your account has been disabled. Please contact support for assistance.")
        break

      case "TOO_MANY_ATTEMPTS":
        showError("Too Many Attempts", "Too many failed login attempts. Please wait a few minutes before trying again.")
        break

      case "EMAIL_NOT_VERIFIED":
        showWarning(
          "Email Not Verified",
          "Please verify your email address before logging in. Check your inbox for a verification link.",
        )
        break

      case "NETWORK_ERROR":
        showError(
          "Network Error",
          "Unable to connect to the server. Please check your internet connection and try again.",
        )
        break

      case "DATABASE_ERROR":
        showError("Server Error", "A server error occurred. Please try again in a few moments.")
        break

      default:
        showError(
          "Login Failed",
          message || "Invalid credentials. Please check your email/username and password and try again.",
        )
        break
    }
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={styles.container}>
        <Image source={require("../../IMAGES/crowd.jpg")} style={styles.backgroundImage} />
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardAvoid}>
          <View style={styles.header}>
            <TouchableOpacity onPress={goHome} style={styles.backButton}>
              <Entypo name="chevron-left" size={24} color="black" />
            </TouchableOpacity>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Log in to your account</Text>
          </View>

          <View style={styles.formContainer}>
            {/* Email or Username */}
            <TextInput
              style={styles.input}
              placeholder="Email or Username"
              value={identifier}
              onChangeText={setIdentifier}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="username"
              placeholderTextColor="#A0A0A0"
              editable={!loading}
            />

            {/* Password */}
            <View style={styles.passwordContainer}>
              <TextInput
                style={[styles.input, styles.passwordInput]}
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="password"
                placeholderTextColor="#A0A0A0"
                editable={!loading}
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowPassword(!showPassword)}
                disabled={loading}
              >
                <Ionicons name={showPassword ? "eye-off" : "eye"} size={24} color="#A0A0A0" />
              </TouchableOpacity>
            </View>

            <View style={styles.row}>
              <View style={styles.rememberMeContainer}>
                <TouchableOpacity
                  style={styles.checkboxContainer}
                  onPress={() => setRememberMe(!rememberMe)}
                  disabled={loading}
                >
                  <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                    {rememberMe && <Ionicons name="checkmark" size={16} color="white" />}
                  </View>
                  <Text style={styles.rememberMeText}>Keep me signed in</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={styles.forgotPassword}
                onPress={() => router.push("./forgot_password")}
                disabled={loading}
              >
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.loginButton, loading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator color="white" size="small" />
                  <Text style={styles.loadingText}>Signing in...</Text>
                </View>
              ) : (
                <Text style={styles.loginButtonText}>Log In</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => router.push("./signup")} disabled={loading}>
              <Text style={[styles.signupText, loading && styles.disabledText]}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingTop: Platform.OS === "ios" ? 0 : 74,
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
    ...Platform.select({
      ios: {
        top: -10,
      },
      android: {
        top: -35,
      },
    }),
  },
  keyboardAvoid: {
    flex: 1,
  },
  title: {
    marginTop: 50,
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
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    position: "relative",
  },
  passwordInput: {
    flex: 1,
    paddingRight: 50,
  },
  eyeIcon: {
    position: "absolute",
    right: 16,
    height: "100%",
    justifyContent: "center",
    paddingBottom: 15,
  },
  row: {
    flexDirection: "row",
  },
  rememberMeContainer: {
    flex: 1,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    marginLeft: 4,
    borderColor: "#A0A0A0",
    backgroundColor: "transparent",
    marginRight: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  rememberMeText: {
    fontSize: 14,
    color: "#333",
  },
  forgotPassword: {
    alignSelf: "flex-end",
    marginBottom: 24,
  },
  forgotPasswordText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "600",
  },
  loginButton: {
    backgroundColor: colors.primary,
    borderRadius: 32,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
    bottom: -70,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  loginButtonDisabled: {
    backgroundColor: "#A0A0A0",
    shadowOpacity: 0,
    elevation: 0,
  },
  loginButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  loadingText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
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
  signupText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: "600",
  },
  disabledText: {
    color: "#A0A0A0",
  },
})
