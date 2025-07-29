"use client"

import { useState, useEffect } from "react"
import {
  View,
  Text,
  TextInput,
  Image,
  Pressable,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native"
import { useRouter, useLocalSearchParams } from "expo-router"
import { SafeAreaView } from "react-native-safe-area-context"
import Ionicons from "@expo/vector-icons/Ionicons"
import { colors } from "@/constants/colors"
import { supabase } from "@/lib/supabase"
import { useNotifications } from "@/context/notification-context"

interface PasswordValidation {
  minLength: boolean
  hasNumber: boolean
  hasLetter: boolean
  hasSpecialChar: boolean
}

export default function ResetPasswordScreen() {
  const router = useRouter()
  const params = useLocalSearchParams()
  const { showSuccess, showError, showWarning } = useNotifications()
  
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isValidSession, setIsValidSession] = useState(false)
  const [loading, setLoading] = useState(true)
  
  const [validation, setValidation] = useState<PasswordValidation>({
    minLength: false,
    hasNumber: false,
    hasLetter: false,
    hasSpecialChar: false,
  })

  // Check if user has a valid reset session
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Session error:', error)
          showError("Invalid Link", "This password reset link is invalid or has expired.")
          router.replace("/(auth)/forgot_password")
          return
        }

        if (session) {
          setIsValidSession(true)
        } else {
          showError("Expired Link", "This password reset link has expired. Please request a new one.")
          router.replace("/(auth)/forgot_password")
        }
      } catch (error) {
        console.error('Error checking session:', error)
        showError("Error", "Unable to verify reset link. Please try again.")
        router.replace("/(auth)/forgot_password")
      } finally {
        setLoading(false)
      }
    }

    checkSession()
  }, [])

  // Real-time password validation
  useEffect(() => {
    setValidation({
      minLength: newPassword.length >= 8,
      hasNumber: /\d/.test(newPassword),
      hasLetter: /[a-zA-Z]/.test(newPassword),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword),
    })
  }, [newPassword])

  const isPasswordValid = Object.values(validation).every(Boolean)
  const passwordsMatch = newPassword === confirmPassword && confirmPassword.length > 0

  const getPasswordStrength = () => {
    const validCount = Object.values(validation).filter(Boolean).length
    if (validCount === 0) return { text: "", color: "" }
    if (validCount <= 2) return { text: "Weak", color: "#ef4444" }
    if (validCount === 3) return { text: "Medium", color: "#f59e0b" }
    return { text: "Strong", color: "#10b981" }
  }

  const handleResetPassword = async () => {
    if (!isPasswordValid) {
      showError("Invalid Password", "Please ensure your password meets all security requirements.")
      return
    }

    if (!passwordsMatch) {
      showError("Password Mismatch", "Passwords do not match. Please check both fields.")
      return
    }

    setIsUpdating(true)
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) {
        throw error
      }

      showSuccess("Password Reset Successfully", "Your password has been updated. You can now sign in with your new password.")
      
      // Sign out the user so they can sign in with new password
      await supabase.auth.signOut()
      
      // Redirect to login
      setTimeout(() => {
        router.replace("/(auth)/login")
      }, 2000)

    } catch (error: any) {
      console.error('Password reset error:', error)
      showError("Reset Failed", error.message || "Failed to reset password. Please try again.")
    } finally {
      setIsUpdating(false)
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Verifying reset link...</Text>
        </View>
      </SafeAreaView>
    )
  }

  if (!isValidSession) {
    return null // Will redirect in useEffect
  }

  return (
    <SafeAreaView style={styles.container} edges={["right"]}>
      <Image source={require("../../IMAGES/crowd.jpg")} style={styles.backgroundImage} />
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          bounces={false}
        >
          <View style={styles.header}>
            <Ionicons name="key" size={48} color={colors.primary} />
            <Text style={styles.title}>Reset Your Password</Text>
            <Text style={styles.subtitle}>Enter your new password below</Text>
          </View>

          {/* New Password */}
          <View style={styles.inputSection}>
            <Text style={styles.label}>New Password</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Enter new password"
                placeholderTextColor={colors.text + "60"}
                secureTextEntry={!showNewPassword}
                value={newPassword}
                onChangeText={setNewPassword}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
                textContentType="newPassword"
                autoComplete="new-password"
              />
              <Pressable onPress={() => setShowNewPassword(!showNewPassword)} style={styles.eyeIcon}>
                <Ionicons
                  name={showNewPassword ? "eye-outline" : "eye-off-outline"}
                  size={22}
                  color={colors.text + "80"}
                />
              </Pressable>
            </View>
            {/* Password Strength Indicator */}
            {newPassword.length > 0 && (
              <View style={styles.strengthContainer}>
                <Text style={[styles.strengthText, { color: getPasswordStrength().color }]}>
                  Password Strength: {getPasswordStrength().text}
                </Text>
                <View style={styles.strengthBar}>
                  <View
                    style={[
                      styles.strengthFill,
                      {
                        width: `${(Object.values(validation).filter(Boolean).length / 4) * 100}%`,
                        backgroundColor: getPasswordStrength().color,
                      },
                    ]}
                  />
                </View>
              </View>
            )}
          </View>

          {/* Password Requirements */}
          {newPassword.length > 0 && (
            <View style={styles.requirementsContainer}>
              <Text style={styles.requirementsTitle}>Password Requirements:</Text>
              <View style={styles.requirement}>
                <Ionicons
                  name={validation.minLength ? "checkmark-circle" : "close-circle"}
                  size={16}
                  color={validation.minLength ? "#10b981" : "#ef4444"}
                />
                <Text style={[styles.requirementText, { color: validation.minLength ? "#10b981" : colors.text }]}>
                  At least 8 characters
                </Text>
              </View>
              <View style={styles.requirement}>
                <Ionicons
                  name={validation.hasLetter ? "checkmark-circle" : "close-circle"}
                  size={16}
                  color={validation.hasLetter ? "#10b981" : "#ef4444"}
                />
                <Text style={[styles.requirementText, { color: validation.hasLetter ? "#10b981" : colors.text }]}>
                  Contains letters
                </Text>
              </View>
              <View style={styles.requirement}>
                <Ionicons
                  name={validation.hasNumber ? "checkmark-circle" : "close-circle"}
                  size={16}
                  color={validation.hasNumber ? "#10b981" : "#ef4444"}
                />
                <Text style={[styles.requirementText, { color: validation.hasNumber ? "#10b981" : colors.text }]}>
                  Contains numbers
                </Text>
              </View>
              <View style={styles.requirement}>
                <Ionicons
                  name={validation.hasSpecialChar ? "checkmark-circle" : "close-circle"}
                  size={16}
                  color={validation.hasSpecialChar ? "#10b981" : "#ef4444"}
                />
                <Text style={[styles.requirementText, { color: validation.hasSpecialChar ? "#10b981" : colors.text }]}>
                  Contains special characters (!@#$%^&*)
                </Text>
              </View>
            </View>
          )}

          {/* Confirm Password */}
          <View style={styles.inputSection}>
            <Text style={styles.label}>Confirm New Password</Text>
            <View style={[styles.inputContainer, confirmPassword.length > 0 && !passwordsMatch && styles.inputError]}>
              <TextInput
                style={styles.input}
                placeholder="Confirm new password"
                placeholderTextColor={colors.text + "60"}
                secureTextEntry={!showConfirmPassword}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={handleResetPassword}
                textContentType="newPassword"
                autoComplete="new-password"
              />
              <Pressable onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeIcon}>
                <Ionicons
                  name={showConfirmPassword ? "eye-outline" : "eye-off-outline"}
                  size={22}
                  color={colors.text + "80"}
                />
              </Pressable>
            </View>
            {confirmPassword.length > 0 && !passwordsMatch && (
              <Text style={styles.errorText}>Passwords do not match</Text>
            )}
            {passwordsMatch && (
              <View style={styles.matchContainer}>
                <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                <Text style={styles.matchText}>Passwords match</Text>
              </View>
            )}
          </View>

          {/* Reset Button */}
          <Pressable
            style={[
              styles.resetButton,
              (!isPasswordValid || !passwordsMatch) && styles.resetButtonDisabled,
            ]}
            onPress={handleResetPassword}
            disabled={!isPasswordValid || !passwordsMatch || isUpdating}
          >
            {isUpdating ? (
              <Text style={styles.resetButtonText}>Resetting...</Text>
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" style={styles.buttonIcon} />
                <Text style={styles.resetButtonText}>Reset Password</Text>
              </>
            )}
          </Pressable>

          <View style={styles.bottomPadding} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: colors.text,
  },
  backgroundImage: {
    position: "absolute",
    bottom: 0,
    resizeMode: "cover",
    opacity: 0.1,
    zIndex: 0,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 25,
  },
  header: {
    alignItems: "center",
    marginTop: 32,
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 8,
    marginTop: 16,
  },
  subtitle: {
    fontSize: 14,
    color: colors.text + "80",
    textAlign: "center",
  },
  inputSection: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.card,
    minHeight: 52,
  },
  inputError: {
    borderColor: "#ef4444",
    borderWidth: 2,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    paddingVertical: 16,
  },
  eyeIcon: {
    padding: 8,
  },
  strengthContainer: {
    marginTop: 8,
  },
  strengthText: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 4,
  },
  strengthBar: {
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    overflow: "hidden",
  },
  strengthFill: {
    height: "100%",
    borderRadius: 2,
  },
  requirementsContainer: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 24,
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 12,
  },
  requirement: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  requirementText: {
    fontSize: 13,
    marginLeft: 8,
    flex: 1,
  },
  errorText: {
    fontSize: 12,
    color: "#ef4444",
    marginTop: 4,
    marginLeft: 4,
  },
  matchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    marginLeft: 4,
  },
  matchText: {
    fontSize: 12,
    color: "#10b981",
    marginLeft: 4,
  },
  resetButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 32,
    marginTop: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  resetButtonDisabled: {
    backgroundColor: colors.border,
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonIcon: {
    marginRight: 8,
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  bottomPadding: {
    height: 100,
  },
})