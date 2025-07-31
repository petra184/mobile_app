"use client"

import { colors } from "@/constants/Colors"
import { useNotifications } from "@/context/notification-context"
import { sendPasswordResetEmail } from "@/lib/actions/password"; // Import the action
import { Ionicons } from "@expo/vector-icons"
import Entypo from '@expo/vector-icons/Entypo'
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

export default function ForgotPasswordScreen() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [email, setEmail] = useState("")
    const [emailSent, setEmailSent] = useState(false)
    
    const { showSuccess, showError, showWarning } = useNotifications()
  
    const goBack = () => {
      router.back()
    }
  
    async function handleResetPassword() {
      if (!email) {
        showWarning("Missing Email", "Please enter your email address")
        return
      }

      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        showWarning("Invalid Email", "Please enter a valid email address")
        return
      }
  
      setLoading(true)
      try {
        // Use the Supabase action
        const { success, message } = await sendPasswordResetEmail(email)
        
        if (success) {
          setEmailSent(true)
          showSuccess("Email Sent!", message)
        } else {
          showError("Reset Failed", message)
        }
      } catch (error) {
        console.error("Password reset error:", error)
        showError("Connection Error", "Unable to connect to the server. Please check your internet connection and try again.")
      } finally {
        setLoading(false)
      }
    }

    if (emailSent) {
      return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <SafeAreaView style={styles.container}>
            <Image
              source={require("../../IMAGES/crowd.jpg")}
              style={styles.backgroundImage}
            />
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardAvoid}>
              <View style={styles.header}>
                <TouchableOpacity onPress={goBack} style={styles.backButton}>
                    <Entypo name="chevron-left" size={24} color="black" />
                </TouchableOpacity>
                <Text style={styles.title}>Check Your Email</Text>
                <Text style={styles.subtitle}>We've sent password reset instructions to {email}</Text>
              </View>

              <View style={styles.formContainer}>
                <View style={styles.successContainer}>
                  <Ionicons name="mail-outline" size={80} color={colors.primary} />
                  <Text style={styles.successText}>
                    If an account with that email exists, you'll receive password reset instructions shortly.
                  </Text>
                  <Text style={styles.instructionText}>
                    Check your spam folder if you don't see the email in your inbox.
                  </Text>
                  <Text style={styles.instructionText}>
                    The reset link will expire in 1 hour for security.
                  </Text>
                </View>

                <TouchableOpacity style={styles.backToLoginButton} onPress={() => router.push("./login")}>
                  <Text style={styles.backToLoginButtonText}>Back to Login</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.resendButton} onPress={() => setEmailSent(false)}>
                  <Text style={styles.resendButtonText}>Try Different Email</Text>
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          </SafeAreaView>
        </TouchableWithoutFeedback>
      )
    }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={styles.container}>
        <Image
          source={require("../../IMAGES/crowd.jpg")}
          style={styles.backgroundImage}
        />
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardAvoid}>
          <View style={styles.header}>
            <TouchableOpacity onPress={goBack} style={styles.backButton}>
                <Entypo name="chevron-left" size={24} color="black" />
            </TouchableOpacity>
            <Text style={styles.title}>Forgot Password?</Text>
            <Text style={styles.subtitle}>Enter your email to reset your password</Text>
          </View>

          <View style={styles.formContainer}>
            {/* Email Input */}
            <TextInput
              style={styles.input}
              placeholder="Email Address"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholderTextColor="#A0A0A0"
            />

            <TouchableOpacity style={styles.resetButton} onPress={handleResetPassword} disabled={loading}>
              {loading ? <ActivityIndicator color="white" /> : <Text style={styles.resetButtonText}>Send Reset Email</Text>}
            </TouchableOpacity>

          </View>
          <View style={styles.footer}>
                      <Text style={styles.footerText}>Remember your password? </Text>
                      <TouchableOpacity onPress={() => router.push("./login")}>
                        <Text style={styles.backToLoginLinkText}>Log In</Text>
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
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    position: "absolute",
    bottom:40,
    left: 0,
    right: 0,
  },
  footerText: {
    color: "#666",
    fontSize: 16,
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
    paddingHorizontal: 20,
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
    marginBottom: 24,
    shadowColor: "gray",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
  },
  resetButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginBottom: 24,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    marginTop:20
  },
  resetButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
  backToLoginLink: {
    alignItems: "center",
  },
  backToLoginLinkText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: "600",
  },
  
  // Success screen styles
  successContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  successText: {
    fontSize: 16,
    color: "#333",
    textAlign: "center",
    marginTop: 24,
    marginBottom: 16,
    lineHeight: 24,
  },
  instructionText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 40,
    lineHeight: 20,
  },
  backToLoginButton: {
    backgroundColor: colors.primary,
    borderRadius: 32,
    padding: 16,
    alignItems: "center",
    marginBottom: 16,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  backToLoginButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
  resendButton: {
    alignItems: "center",
    padding: 12,
  },
  resendButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: "600",
  },
})