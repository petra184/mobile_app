"use client"
import type { FormData } from "@/app/(auth)/signup"
import { colors } from "@/constants/Colors"
import { checkEmailAvailability, checkUsernameAvailability } from "@/lib/actions/users"
import { Ionicons } from "@expo/vector-icons"
import { useCallback, useEffect, useRef, useState } from "react"
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native"

interface AccountCreationStepProps {
  formData: FormData
  updateFormData: (updates: Partial<FormData>) => void
  onNext: () => void
}

interface PasswordValidation {
  minLength: boolean
  hasNumber: boolean
  hasLetter: boolean
  hasSpecialChar: boolean
}

interface AvailabilityStatus {
  checking: boolean
  available: boolean | null
  message: string
}

// Debounce utility function
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

export default function AccountCreationStep({ formData, updateFormData, onNext }: AccountCreationStepProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Add refs to track the actual input values
  const passwordInputRef = useRef<TextInput>(null)
  const confirmPasswordInputRef = useRef<TextInput>(null)

  // Track if user has interacted with password field
  const [passwordTouched, setPasswordTouched] = useState(false)
  const [confirmPasswordTouched, setConfirmPasswordTouched] = useState(false)

  // Password validation state
  const [validation, setValidation] = useState<PasswordValidation>({
    minLength: false,
    hasNumber: false,
    hasLetter: false,
    hasSpecialChar: false,
  })

  // Availability checking states
  const [emailStatus, setEmailStatus] = useState<AvailabilityStatus>({
    checking: false,
    available: null,
    message: "",
  })

  const [usernameStatus, setUsernameStatus] = useState<AvailabilityStatus>({
    checking: false,
    available: null,
    message: "",
  })

  // Enhanced password validation that checks for actual content
  const validatePassword = useCallback(
    (password: string) => {
      // Only validate if password is not empty and user has interacted
      if (!password || !passwordTouched) {
        return {
          minLength: false,
          hasNumber: false,
          hasLetter: false,
          hasSpecialChar: false,
        }
      }
      return {
        minLength: password.length >= 8,
        hasNumber: /\d/.test(password),
        hasLetter: /[a-zA-Z]/.test(password),
        hasSpecialChar: /[^a-zA-Z0-9]/.test(password),
      }
    },
    [passwordTouched],
  )

  // Real-time password validation
  useEffect(() => {
    setValidation(validatePassword(formData.password))
  }, [formData.password, validatePassword])

  const isPasswordValid = Object.values(validation).every(Boolean) && passwordTouched
  const passwordsMatch =
    passwordTouched &&
    confirmPasswordTouched &&
    formData.password.length > 0 &&
    formData.confirmPassword.length > 0 &&
    formData.password === formData.confirmPassword

  // Enhanced password change handler
  const handlePasswordChange = useCallback(
    (value: string) => {
      setPasswordTouched(true)
      updateFormData({ password: value })

      // Clear confirm password if it doesn't match anymore
      if (formData.confirmPassword && value !== formData.confirmPassword) {
        // Don't auto-clear, but let validation handle it
      }
    },
    [updateFormData, formData.confirmPassword],
  )

  // Enhanced confirm password change handler
  const handleConfirmPasswordChange = useCallback(
    (value: string) => {
      setConfirmPasswordTouched(true)
      updateFormData({ confirmPassword: value })
    },
    [updateFormData],
  )

  // Handle password input focus
  const handlePasswordFocus = useCallback(() => {
    setPasswordTouched(true)

    // Check if there's a discrepancy between displayed and actual value
    setTimeout(() => {
      if (passwordInputRef.current) {
        // Force a re-render to sync state
        const currentValue = formData.password
        updateFormData({ password: currentValue })
      }
    }, 100)
  }, [formData.password, updateFormData])

  // Handle confirm password input focus
  const handleConfirmPasswordFocus = useCallback(() => {
    setConfirmPasswordTouched(true)
  }, [])

  // Handle password input blur - validate actual content
  const handlePasswordBlur = useCallback(() => {
    // Double-check the actual input value on blur
    setTimeout(() => {
      if (passwordInputRef.current) {
        // Get the actual text from the input
        passwordInputRef.current.measure((x, y, width, height, pageX, pageY) => {
          // This is a workaround to ensure we have the correct value
          const currentPassword = formData.password
          if (!currentPassword || currentPassword.trim() === "") {
            setPasswordTouched(false)
            updateFormData({ password: "" })
          }
        })
      }
    }, 50)
  }, [formData.password, updateFormData])

  // Debounced email checking
  const checkEmailDebounced = useCallback(
    debounce(async (email: string) => {
      if (!email || email.length < 3) {
        setEmailStatus({ checking: false, available: null, message: "" })
        return
      }
      setEmailStatus({ checking: true, available: null, message: "Checking..." })
      const result = await checkEmailAvailability(email)
      setEmailStatus({
        checking: false,
        available: result.available,
        message: result.message,
      })
    }, 500),
    [],
  )

  // Debounced username checking
  const checkUsernameDebounced = useCallback(
    debounce(async (username: string) => {
      if (!username || username.length < 3) {
        setUsernameStatus({ checking: false, available: null, message: "" })
        return
      }
      setUsernameStatus({ checking: true, available: null, message: "Checking..." })
      const result = await checkUsernameAvailability(username)
      setUsernameStatus({
        checking: false,
        available: result.available,
        message: result.message,
      })
    }, 500),
    [],
  )

  // Check email availability when email changes
  useEffect(() => {
    if (formData.email) {
      checkEmailDebounced(formData.email)
    } else {
      setEmailStatus({ checking: false, available: null, message: "" })
    }
  }, [formData.email, checkEmailDebounced])

  // Check username availability when username changes
  useEffect(() => {
    if (formData.username) {
      checkUsernameDebounced(formData.username)
    } else {
      setUsernameStatus({ checking: false, available: null, message: "" })
    }
  }, [formData.username, checkUsernameDebounced])

  const getPasswordStrength = () => {
    if (!passwordTouched || !formData.password) {
      return { text: "", color: "" }
    }
    const validCount = Object.values(validation).filter(Boolean).length
    if (validCount === 0) return { text: "", color: "" }
    if (validCount <= 2) return { text: "Weak", color: "#ef4444" }
    if (validCount === 3) return { text: "Medium", color: "#f59e0b" }
    return { text: "Strong", color: "#10b981" }
  }

  const canContinue = () => {
    const requiredFields = ["username", "email", "password", "confirmPassword"]
    const allFieldsFilled = requiredFields.every((field) => {
      const value = formData[field as keyof FormData]
      return typeof value === "string" && value.trim() !== ""
    })

    return (
      allFieldsFilled &&
      isPasswordValid &&
      passwordsMatch &&
      emailStatus.available === true &&
      usernameStatus.available === true &&
      passwordTouched &&
      confirmPasswordTouched
    )
  }

  const renderAvailabilityIndicator = (status: AvailabilityStatus) => {
    if (status.checking) {
      return <ActivityIndicator size="small" color={colors.primary} />
    }
    if (status.available === true) {
      return <Ionicons name="checkmark-circle" size={20} color="#10b981" />
    }
    if (status.available === false) {
      return <Ionicons name="close-circle" size={20} color="#ef4444" />
    }
    return null
  }

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
      <View style={styles.formContainer}>
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeSubtext}>Now let's help you set up your account.</Text>
        </View>

        {/* Username with availability check */}
        <View style={styles.inputWithIndicator}>
          <TextInput
            style={[styles.input, styles.inputWithIcon, usernameStatus.available === false && styles.inputError]}
            placeholder="Username"
            value={formData.username}
            onChangeText={(value) => updateFormData({ username: value })}
            autoCapitalize="none"
            placeholderTextColor="#A0A0A0"
          />
          <View style={styles.availabilityIndicator}>{renderAvailabilityIndicator(usernameStatus)}</View>
        </View>
        {usernameStatus.message && (
          <Text style={[styles.availabilityText, { color: usernameStatus.available ? "#10b981" : "#ef4444" }]}>
            {usernameStatus.message}
          </Text>
        )}

        {/* Email with availability check */}
        <View style={styles.inputWithIndicator}>
          <TextInput
            style={[styles.input, styles.inputWithIcon, emailStatus.available === false && styles.inputError]}
            placeholder="Email"
            value={formData.email}
            onChangeText={(value) => updateFormData({ email: value })}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholderTextColor="#A0A0A0"
          />
          <View style={styles.availabilityIndicator}>{renderAvailabilityIndicator(emailStatus)}</View>
        </View>
        {emailStatus.message && (
          <Text style={[styles.availabilityText, { color: emailStatus.available ? "#10b981" : "#ef4444" }]}>
            {emailStatus.message}
          </Text>
        )}

        {/* Phone Number */}
        <TextInput
          style={[styles.input, styles.fullInput]}
          placeholder="Phone Number (optional)"
          value={formData.phone_number}
          onChangeText={(value) => updateFormData({ phone_number: value })}
          keyboardType="phone-pad"
          placeholderTextColor="#A0A0A0"
        />

        {/* Password */}
        <View style={styles.passwordContainer}>
          <TextInput
            ref={passwordInputRef}
            style={[styles.input, styles.passwordInput]}
            placeholder="Password"
            value={formData.password}
            onChangeText={handlePasswordChange}
            onFocus={handlePasswordFocus}
            onBlur={handlePasswordBlur}
            secureTextEntry={!showPassword}
            placeholderTextColor="#A0A0A0"
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="newPassword" // This helps with iOS autofill
            passwordRules="minlength: 8; required: lower; required: upper; required: digit; required: special;" // iOS password rules
          />
          <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowPassword(!showPassword)}>
            <Ionicons name={showPassword ? "eye-off" : "eye"} size={24} color="#A0A0A0" />
          </TouchableOpacity>
        </View>

        {/* Password Strength Indicator */}
        {passwordTouched && formData.password.length > 0 && (
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

        {/* Password Requirements */}
        {passwordTouched && formData.password.length > 0 && (
          <View style={styles.requirementsContainer}>
            <Text style={styles.requirementsTitle}>Password Requirements:</Text>
            <View style={styles.requirement}>
              <Ionicons
                name={validation.minLength ? "checkmark-circle" : "close-circle"}
                size={16}
                color={validation.minLength ? "#10b981" : "#ef4444"}
              />
              <Text style={[styles.requirementText, { color: validation.minLength ? "#10b981" : "#666" }]}>
                At least 8 characters
              </Text>
            </View>
            <View style={styles.requirement}>
              <Ionicons
                name={validation.hasLetter ? "checkmark-circle" : "close-circle"}
                size={16}
                color={validation.hasLetter ? "#10b981" : "#ef4444"}
              />
              <Text style={[styles.requirementText, { color: validation.hasLetter ? "#10b981" : "#666" }]}>
                Contains letters
              </Text>
            </View>
            <View style={styles.requirement}>
              <Ionicons
                name={validation.hasNumber ? "checkmark-circle" : "close-circle"}
                size={16}
                color={validation.hasNumber ? "#10b981" : "#ef4444"}
              />
              <Text style={[styles.requirementText, { color: validation.hasNumber ? "#10b981" : "#666" }]}>
                Contains numbers
              </Text>
            </View>
            <View style={styles.requirement}>
              <Ionicons
                name={validation.hasSpecialChar ? "checkmark-circle" : "close-circle"}
                size={16}
                color={validation.hasSpecialChar ? "#10b981" : "#ef4444"}
              />
              <Text style={[styles.requirementText, { color: validation.hasSpecialChar ? "#10b981" : "#666" }]}>
                Contains special characters (!@#$%^&*)
              </Text>
            </View>
          </View>
        )}

        {/* Confirm Password */}
        <View
          style={[
            styles.passwordContainer,
            confirmPasswordTouched &&
              formData.confirmPassword.length > 0 &&
              !passwordsMatch &&
              styles.confirmPasswordError,
          ]}
        >
          <TextInput
            ref={confirmPasswordInputRef}
            style={[styles.input, styles.passwordInput, styles.confirmPasswordInput]}
            placeholder="Confirm Password"
            value={formData.confirmPassword}
            onChangeText={handleConfirmPasswordChange}
            onFocus={handleConfirmPasswordFocus}
            secureTextEntry={!showConfirmPassword}
            placeholderTextColor="#A0A0A0"
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="newPassword"
          />
          <TouchableOpacity style={styles.eyeIcon2} onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
            <Ionicons name={showConfirmPassword ? "eye-off" : "eye"} size={24} color="#A0A0A0" />
          </TouchableOpacity>
        </View>

        {/* Password Match Feedback */}
        {confirmPasswordTouched &&
          formData.confirmPassword.length > 0 &&
          formData.password.length > 0 &&
          !passwordsMatch && <Text style={styles.errorText}>Passwords do not match</Text>}
        {passwordsMatch && (
          <View style={styles.matchContainer}>
            <Ionicons name="checkmark-circle" size={16} color="#10b981" />
            <Text style={styles.matchText}>Passwords match</Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.continueButton, !canContinue() && styles.continueButtonDisabled]}
          onPress={onNext}
          disabled={!canContinue()}
        >
          <Text style={styles.continueButtonText}>Continue</Text>
        </TouchableOpacity>
      </View>
      <View style={{ marginBottom: 40 }}></View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
  },
  formContainer: {
    padding: 24,
    flex: 1,
  },
  welcomeSection: {
    marginBottom: 32,
    alignItems: "center",
  },
  welcomeSubtext: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 22,
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
  inputError: {
    borderColor: "#ef4444",
    borderWidth: 2,
  },
  fullInput: {
    width: "100%",
  },
  inputWithIndicator: {
    position: "relative",
    width: "100%",
  },
  inputWithIcon: {
    paddingRight: 50,
  },
  availabilityIndicator: {
    position: "absolute",
    right: 16,
    top: 16,
    height: 24,
    width: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  availabilityText: {
    fontSize: 12,
    marginTop: -12,
    marginBottom: 8,
    marginLeft: 4,
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    position: "relative",
    marginBottom: 0,
  },
  confirmPasswordError: {
    backgroundColor: "#F5F5F5",
    borderColor: "#ef4444",
    borderWidth: 2,
    borderRadius: 12,
    marginBottom: 16,
  },
  confirmPasswordInput: {
    marginBottom: 0,
    backgroundColor: "#F5F5F5",
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
  eyeIcon2: {
    position: "absolute",
    right: 16,
    height: "100%",
    justifyContent: "center",
    paddingBottom: 15,
    paddingTop: 15,
  },
  strengthContainer: {
    marginTop: -8,
    marginBottom: 12,
  },
  strengthText: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 4,
  },
  strengthBar: {
    height: 4,
    backgroundColor: "#E5E5E5",
    borderRadius: 2,
    overflow: "hidden",
  },
  strengthFill: {
    height: "100%",
    borderRadius: 2,
  },
  requirementsContainer: {
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    padding: 16,
    marginTop: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
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
    marginTop: -12,
    marginBottom: 8,
    marginLeft: 4,
  },
  matchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
    marginLeft: 4,
  },
  matchText: {
    fontSize: 12,
    color: "#10b981",
    marginLeft: 4,
  },
  continueButton: {
    marginTop: 50,
    backgroundColor: colors.primary,
    borderRadius: 32,
    padding: 16,
    alignItems: "center",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  continueButtonDisabled: {
    backgroundColor: "#A0A0A0",
    shadowOpacity: 0,
    elevation: 0,
  },
  continueButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
})
