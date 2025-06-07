"use client"

import { useState, useEffect, useCallback } from "react"
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
import { checkEmailAvailability, checkUsernameAvailability } from "@/app/actions/users"
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

interface PasswordValidation {
  minLength: boolean;
  hasNumber: boolean;
  hasLetter: boolean;
  hasSpecialChar: boolean;
}

interface AvailabilityStatus {
  checking: boolean;
  available: boolean | null;
  message: string;
}

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

  // Password validation state
  const [validation, setValidation] = useState<PasswordValidation>({
    minLength: false,
    hasNumber: false,
    hasLetter: false,
    hasSpecialChar: false,
  });

  // Availability checking states
  const [emailStatus, setEmailStatus] = useState<AvailabilityStatus>({
    checking: false,
    available: null,
    message: ""
  });

  const [usernameStatus, setUsernameStatus] = useState<AvailabilityStatus>({
    checking: false,
    available: null,
    message: ""
  });

  // Real-time password validation
  useEffect(() => {
    setValidation({
      minLength: formData.password.length >= 8,
      hasNumber: /\d/.test(formData.password),
      hasLetter: /[a-zA-Z]/.test(formData.password),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(formData.password),
    });
  }, [formData.password]);

  const isPasswordValid = Object.values(validation).every(Boolean);
  const passwordsMatch = formData.password === formData.confirmPassword && formData.confirmPassword.length > 0;

  // Debounced email checking
  const checkEmailDebounced = useCallback(
    debounce(async (email: string) => {
      if (!email || email.length < 3) {
        setEmailStatus({ checking: false, available: null, message: "" });
        return;
      }

      setEmailStatus({ checking: true, available: null, message: "Checking..." });
      
      const result = await checkEmailAvailability(email);
      setEmailStatus({
        checking: false,
        available: result.available,
        message: result.message
      });
    }, 500),
    []
  );

  // Debounced username checking
  const checkUsernameDebounced = useCallback(
    debounce(async (username: string) => {
      if (!username || username.length < 3) {
        setUsernameStatus({ checking: false, available: null, message: "" });
        return;
      }

      setUsernameStatus({ checking: true, available: null, message: "Checking..." });
      
      const result = await checkUsernameAvailability(username);
      setUsernameStatus({
        checking: false,
        available: result.available,
        message: result.message
      });
    }, 500),
    []
  );

  // Check email availability when email changes
  useEffect(() => {
    if (formData.email) {
      checkEmailDebounced(formData.email);
    } else {
      setEmailStatus({ checking: false, available: null, message: "" });
    }
  }, [formData.email, checkEmailDebounced]);

  // Check username availability when username changes
  useEffect(() => {
    if (formData.username) {
      checkUsernameDebounced(formData.username);
    } else {
      setUsernameStatus({ checking: false, available: null, message: "" });
    }
  }, [formData.username, checkUsernameDebounced]);

  const getPasswordStrength = () => {
    const validCount = Object.values(validation).filter(Boolean).length;
    if (validCount === 0) return { text: '', color: '' };
    if (validCount <= 2) return { text: 'Weak', color: '#ef4444' };
    if (validCount === 3) return { text: 'Medium', color: '#f59e0b' };
    return { text: 'Strong', color: '#10b981' };
  };

  const handleInputChange = (field: FormField, value: string) => {
    setFormData({
      ...formData,
      [field]: value,
    })
  }

  const goHome = () => {
    router.push("/")
  }

  const canSubmit = () => {
    const requiredFields: FormField[] = ["firstName", "lastName", "username", "password", "confirmPassword", "email"];
    const allFieldsFilled = requiredFields.every(field => formData[field].trim() !== "");
    
    return allFieldsFilled && 
           isPasswordValid && 
           passwordsMatch && 
           emailStatus.available === true && 
           usernameStatus.available === true &&
           !loading;
  };

  async function handleSignup() {
    // Final validation before submission
    if (!canSubmit()) {
      showWarning("Form Incomplete", "Please complete all fields and ensure email/username are available");
      return;
    }

    setLoading(true);
    try {
      const { success, message, user } = await signUpWithEmail(
        formData.email,
        formData.password,
        formData.firstName,
        formData.lastName,
        formData.username,
        formData.phone_number,
      );

      if (success && user) {
        // Save additional user data to profiles table if needed
        await upsertProfile(user.id, {
          username: formData.username,
          first_name: formData.firstName,
          last_name: formData.lastName,
          full_name: `${formData.firstName} ${formData.lastName}`,
          phone_number: formData.phone_number || "",
        });

        if (message) {
          showSuccess("Account Created!", message);
          setTimeout(() => {
            router.push("../(tabs)");
          }, 2000);
        } else {
          showSuccess("Welcome!", "Your account has been created successfully");
          setTimeout(() => {
            router.push("./login");
          }, 1500);
        }
      } else if (success) {
        // Email confirmation is required
        showToast({
          type: "info",
          title: "Check Your Email",
          message: message || "We've sent a confirmation link to your email. Please verify your account before logging in.",
          duration: 6000,
          action: {
            label: "Go to Login",
            onPress: () => router.push("./login")
          }
        });
      } else {
        showError("Signup Failed", message || "Unable to create your account. Please try again.");
      }
    } catch (error) {
      console.error("Signup error:", error);
      showError("Connection Error", "Unable to connect to the server. Please check your internet connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  const renderAvailabilityIndicator = (status: AvailabilityStatus) => {
    if (status.checking) {
      return <ActivityIndicator size="small" color={colors.primary} />;
    }
    
    if (status.available === true) {
      return <Ionicons name="checkmark-circle" size={20} color="#10b981" />;
    }
    
    if (status.available === false) {
      return <Ionicons name="close-circle" size={20} color="#ef4444" />;
    }
    
    return null;
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={styles.container} edges={["top"]}>
        <Image
          source={require("../../IMAGES/crowd.jpg")}
          style={styles.backgroundImage}
        />
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardAvoid}>
          <View style={styles.header}>
            <TouchableOpacity onPress={goHome} style={styles.backButton}>
               <Entypo name="chevron-left" size={24} color="black" />
            </TouchableOpacity>
            <Text style={styles.title}>Create an Account</Text>
            <Text style={styles.subtitle}>Sign up to start earning rewards at campus events</Text>
          </View>
          <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
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

              {/* Username with availability check */}
              <View style={styles.inputWithIndicator}>
                <TextInput
                  style={[
                    styles.input, 
                    styles.inputWithIcon,
                    usernameStatus.available === false && styles.inputError
                  ]}
                  placeholder="Username"
                  value={formData.username}
                  onChangeText={(value) => handleInputChange("username", value)}
                  autoCapitalize="none"
                  placeholderTextColor="#A0A0A0"
                />
                <View style={styles.availabilityIndicator}>
                  {renderAvailabilityIndicator(usernameStatus)}
                </View>
              </View>
              {usernameStatus.message && (
                <Text style={[
                  styles.availabilityText,
                  { color: usernameStatus.available ? '#10b981' : '#ef4444' }
                ]}>
                  {usernameStatus.message}
                </Text>
              )}

              {/* Email with availability check */}
              <View style={styles.inputWithIndicator}>
                <TextInput
                  style={[
                    styles.input, 
                    styles.inputWithIcon,
                    emailStatus.available === false && styles.inputError
                  ]}
                  placeholder="Email (school.edu)"
                  value={formData.email}
                  onChangeText={(value) => handleInputChange("email", value)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholderTextColor="#A0A0A0"
                />
                <View style={styles.availabilityIndicator}>
                  {renderAvailabilityIndicator(emailStatus)}
                </View>
              </View>
              {emailStatus.message && (
                <Text style={[
                  styles.availabilityText,
                  { color: emailStatus.available ? '#10b981' : '#ef4444' }
                ]}>
                  {emailStatus.message}
                </Text>
              )}

              {/* Phone Number */}
              <TextInput
                style={[styles.input, styles.fullInput]}
                placeholder="Phone Number (optional)"
                value={formData.phone_number}
                onChangeText={(value) => handleInputChange("phone_number", value)}
                keyboardType="phone-pad"
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
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons name={showPassword ? "eye-off" : "eye"} size={24} color="#A0A0A0" />
                </TouchableOpacity>
              </View>

              {/* Password Strength Indicator */}
              {formData.password.length > 0 && (
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
                          backgroundColor: getPasswordStrength().color 
                        }
                      ]} 
                    />
                  </View>
                </View>
              )}

              {/* Password Requirements */}
              {formData.password.length > 0 && (
                <View style={styles.requirementsContainer}>
                  <Text style={styles.requirementsTitle}>Password Requirements:</Text>
                  
                  <View style={styles.requirement}>
                    <Ionicons 
                      name={validation.minLength ? "checkmark-circle" : "close-circle"} 
                      size={16} 
                      color={validation.minLength ? '#10b981' : '#ef4444'} 
                    />
                    <Text style={[styles.requirementText, { color: validation.minLength ? '#10b981' : '#666' }]}>
                      At least 8 characters
                    </Text>
                  </View>
                  
                  <View style={styles.requirement}>
                    <Ionicons 
                      name={validation.hasLetter ? "checkmark-circle" : "close-circle"} 
                      size={16} 
                      color={validation.hasLetter ? '#10b981' : '#ef4444'} 
                    />
                    <Text style={[styles.requirementText, { color: validation.hasLetter ? '#10b981' : '#666' }]}>
                      Contains letters
                    </Text>
                  </View>
                  
                  <View style={styles.requirement}>
                    <Ionicons 
                      name={validation.hasNumber ? "checkmark-circle" : "close-circle"} 
                      size={16} 
                      color={validation.hasNumber ? '#10b981' : '#ef4444'} 
                    />
                    <Text style={[styles.requirementText, { color: validation.hasNumber ? '#10b981' : '#666' }]}>
                      Contains numbers
                    </Text>
                  </View>
                  
                  <View style={styles.requirement}>
                    <Ionicons 
                      name={validation.hasSpecialChar ? "checkmark-circle" : "close-circle"} 
                      size={16} 
                      color={validation.hasSpecialChar ? '#10b981' : '#ef4444'} 
                    />
                    <Text style={[styles.requirementText, { color: validation.hasSpecialChar ? '#10b981' : '#666' }]}>
                      Contains special characters (!@#$%^&*)
                    </Text>
                  </View>
                </View>
              )}

              {/* Confirm Password - FIXED CONTAINER */}
              <View style={[
                styles.passwordContainer,
                formData.confirmPassword.length > 0 && !passwordsMatch && styles.confirmPasswordError
              ]}>
                <TextInput
                  style={[styles.input, styles.passwordInput, styles.confirmPasswordInput]}
                  placeholder="Confirm Password"
                  value={formData.confirmPassword}
                  onChangeText={(value) => handleInputChange("confirmPassword", value)}
                  secureTextEntry={!showConfirmPassword}
                  placeholderTextColor="#A0A0A0"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity style={styles.eyeIcon2} onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                  <Ionicons name={showConfirmPassword ? "eye-off" : "eye"} size={24} color="#A0A0A0" />
                </TouchableOpacity>
              </View>

              {/* Password Match Feedback */}
              {formData.confirmPassword.length > 0 && !passwordsMatch && (
                <Text style={styles.errorText}>Passwords do not match</Text>
              )}
              
              {passwordsMatch && (
                <View style={styles.matchContainer}>
                  <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                  <Text style={styles.matchText}>Passwords match</Text>
                </View>
              )}

              <View style={styles.xxx}>

              <TouchableOpacity 
                style={[
                  styles.signupButton,
                  !canSubmit() && styles.signupButtonDisabled
                ]} 
                onPress={handleSignup} 
                disabled={!canSubmit()}
              >
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

              {/* Already have an account section */}
              <View style={styles.loginPrompt}>
                <Text style={styles.loginPromptText}>Already have an account? </Text>
                <TouchableOpacity onPress={() => router.push("./login")}>
                  <Text style={styles.loginPromptLink}>Log in</Text>
                </TouchableOpacity>
              </View>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  )
}

// Debounce utility function
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: number;

  return (...args: Parameters<T>) => {
    clearTimeout(timeout);  // Clear any existing timeout
    timeout = setTimeout(() => func(...args), wait);  // Set a new timeout
  };
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
  xxx:{
    bottom: -80
  },
  header: {
    padding: 24,
  },
  backButton: {
    top: -20,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1, // Reduced since we removed the absolute footer
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
  inputError: {
    borderColor: '#ef4444',
    borderWidth: 2,
  },
  halfInput: {
    width: "48%",
  },
  fullInput: {
    width: "100%",
  },
  inputWithIndicator: {
    position: 'relative',
    width: "100%",
  },
  inputWithIcon: {
    paddingRight: 50,
  },
  availabilityIndicator: {
    position: 'absolute',
    right: 16,
    top: 16,
    height: 24,
    width: 24,
    justifyContent: 'center',
    alignItems: 'center',
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
  // FIXED: Separate style for confirm password error that applies to the container
  confirmPasswordError: {
    backgroundColor: "#F5F5F5", // Keep the background
    borderColor: '#ef4444',
    borderWidth: 2,
    borderRadius: 12,
    marginBottom: 16, // Proper margin
  },
  // FIXED: Separate style for confirm password input to remove its own margin and background
  confirmPasswordInput: {
    marginBottom: 0, // Remove margin from input when in error container
    backgroundColor: '#F5F5F5', // Make background transparent so container background shows
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
    fontWeight: '600',
    marginBottom: 4,
  },
  strengthBar: {
    height: 4,
    backgroundColor: '#E5E5E5',
    borderRadius: 2,
    overflow: 'hidden',
  },
  strengthFill: {
    height: '100%',
    borderRadius: 2,
  },
  requirementsContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginTop: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  requirement: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  requirementText: {
    fontSize: 13,
    marginLeft: 8,
    flex: 1,
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: -12,
    marginBottom: 8,
    marginLeft: 4,
  },
  matchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
    marginLeft: 4,
  },
  matchText: {
    fontSize: 12,
    color: '#10b981',
    marginLeft: 4,
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
  signupButtonDisabled: {
    backgroundColor: '#A0A0A0',
    shadowOpacity: 0,
    elevation: 0,
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
    marginBottom: 24,
  },
  termsLink: {
    color: colors.primary,
    fontWeight: "600",
  },
  // NEW: Login prompt section
  loginPrompt: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
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