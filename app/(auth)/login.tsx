"use client"

import { useState } from "react"
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  TouchableWithoutFeedback,
  Keyboard,
  Image,
  TextInput,
} from "react-native"
import { useRouter } from "expo-router"
import { Ionicons } from "@expo/vector-icons"
import Entypo from '@expo/vector-icons/Entypo';
import { signInWithEmailOrUsername } from "@/app/actions/main_actions"
import { useNotifications } from "@/context/notification-context"
import { useUserStore } from "@/hooks/userStore"
import { colors } from "@/constants/colors"
// Define the main color from the logo

export default function LoginScreen() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [identifier, setIdentifier] = useState("")
    const [password, setPassword] = useState("")
    
    // Initialize notifications and user store
    const { showSuccess, showError, showWarning } = useNotifications()
    const { setUser } = useUserStore()
  
    const goHome = () => {
      router.push("/")
    }
  
    async function handleLogin() {
      if (!identifier || !password) {
        showWarning("Missing Fields", "Please enter both email/username and password")
        return
      }
  
      setLoading(true)
      try {
        const { success, message, user } = await signInWithEmailOrUsername(identifier, password)
  
        if (success && user) {
          showSuccess("Welcome back!", "You have successfully logged in")
          
          // Initialize user store with user data
          await setUser(user.id, user.email)
          
          // Small delay to show the success message before navigation
          setTimeout(() => {
            router.push("/(tabs)")
          }, 1000)
        } else {
          showError("Login Failed", message || "Invalid credentials. Please check your email/username and password.")
        }
      } catch (error) {
        console.error("Login error:", error)
        showError("Connection Error", "Unable to connect to the server. Please check your internet connection and try again.")
      } finally {
        setLoading(false)
      }
    }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={styles.container}>
        <Image
          source={require("../../IMAGES/crowd.jpg")} // Update path as needed
          style={styles.backgroundImage}
        />
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
              placeholderTextColor="#A0A0A0"
            />

            {/* Password */}
            <View style={styles.passwordContainer}>
              <TextInput
                style={[styles.input, styles.passwordInput]}
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                placeholderTextColor="#A0A0A0"
              />
              <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowPassword(!showPassword)}>
                <Ionicons name={showPassword ? "eye-off" : "eye"} size={24} color="#A0A0A0" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.forgotPassword} onPress={() => router.push("./forgot_password")}>
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.loginButton} onPress={handleLogin} disabled={loading}>
              {loading ? <ActivityIndicator color="white" /> : <Text style={styles.loginButtonText}>Log In</Text>}
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => router.push("./signup")}>
              <Text style={styles.signupText}>Sign Up</Text>
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
    paddingTop: Platform.OS === "ios" ? 0 : 74, // Adjust for Android status bar
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
  backButtonText: {
    fontSize: 24,
    fontWeight: "600",
    color: "#333",
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
    paddingRight: 50, // Space for the eye icon
  },
  eyeIcon: {
    position: "absolute",
    right: 16,
    height: "100%",
    justifyContent: "center",
    paddingBottom: 15,
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
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
    bottom:-70,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  loginButtonText: {
    color: "white",
    fontSize: 18,
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
  signupText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: "600",
  },
})