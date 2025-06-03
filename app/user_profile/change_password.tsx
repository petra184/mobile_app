import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Image, Pressable, Alert, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors } from '@/constants/colors';
import { useUserStore } from '@/hooks/userStore';
import { updateUserPassword } from '@/app/actions/users';

interface PasswordValidation {
  minLength: boolean;
  hasNumber: boolean;
  hasLetter: boolean;
  hasSpecialChar: boolean;
}

export default function ChangePasswordScreen() {
  const router = useRouter();
  const { userEmail, isLoading } = useUserStore();
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [validation, setValidation] = useState<PasswordValidation>({
    minLength: false,
    hasNumber: false,
    hasLetter: false,
    hasSpecialChar: false,
  });

  // Real-time password validation
  useEffect(() => {
    setValidation({
      minLength: newPassword.length >= 8,
      hasNumber: /\d/.test(newPassword),
      hasLetter: /[a-zA-Z]/.test(newPassword),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword),
    });
  }, [newPassword]);

  const isPasswordValid = Object.values(validation).every(Boolean);
  const passwordsMatch = newPassword === confirmPassword && confirmPassword.length > 0;

  const getPasswordStrength = () => {
    const validCount = Object.values(validation).filter(Boolean).length;
    if (validCount === 0) return { text: '', color: '' };
    if (validCount <= 2) return { text: 'Weak', color: '#ef4444' };
    if (validCount === 3) return { text: 'Medium', color: '#f59e0b' };
    return { text: 'Strong', color: '#10b981' };
  };

  const handleChangePassword = async () => {
    if (!currentPassword.trim()) {
      Alert.alert('Error', 'Please enter your current password.');
      return;
    }

    if (!isPasswordValid) {
      Alert.alert('Error', 'Please ensure your new password meets all requirements.');
      return;
    }

    if (!passwordsMatch) {
      Alert.alert('Error', 'New passwords do not match.');
      return;
    }

    setIsUpdating(true);

    try {
      // Call your auth service to update password
      await updateUserPassword(currentPassword, newPassword);
      
      Alert.alert(
        'Success', 
        'Password updated successfully!', 
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error: any) {
      console.error('Password update error:', error);
      
      // Handle specific error cases
      let errorMessage = 'Failed to update password. Please try again.';
      
      if (error.message?.includes('Invalid login credentials')) {
        errorMessage = 'Current password is incorrect.';
      } else if (error.message?.includes('Password should be at least')) {
        errorMessage = 'Password does not meet security requirements.';
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Image
        source={require('../../IMAGES/crowd.jpg')}
        style={styles.backgroundImage}
      />
      
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Change Password</Text>
          <Text style={styles.subtitle}>
            Update your password for {userEmail}
          </Text>
        </View>

        {/* Current Password */}
        <View style={styles.inputSection}>
          <Text style={styles.label}>Current Password</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Enter current password"
              placeholderTextColor={colors.text + '60'}
              secureTextEntry={!showCurrentPassword}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Pressable 
              onPress={() => setShowCurrentPassword(!showCurrentPassword)} 
              style={styles.eyeIcon}
            >
              <Ionicons 
                name={showCurrentPassword ? "eye-outline" : "eye-off-outline"} 
                size={22} 
                color={colors.text + '80'} 
              />
            </Pressable>
          </View>
        </View>

        {/* New Password */}
        <View style={styles.inputSection}>
          <Text style={styles.label}>New Password</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Enter new password"
              placeholderTextColor={colors.text + '60'}
              secureTextEntry={!showNewPassword}
              value={newPassword}
              onChangeText={setNewPassword}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Pressable 
              onPress={() => setShowNewPassword(!showNewPassword)} 
              style={styles.eyeIcon}
            >
              <Ionicons 
                name={showNewPassword ? "eye-outline" : "eye-off-outline"} 
                size={22} 
                color={colors.text + '80'} 
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
                      backgroundColor: getPasswordStrength().color 
                    }
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
                color={validation.minLength ? '#10b981' : '#ef4444'} 
              />
              <Text style={[styles.requirementText, { color: validation.minLength ? '#10b981' : colors.text }]}>
                At least 8 characters
              </Text>
            </View>
            
            <View style={styles.requirement}>
              <Ionicons 
                name={validation.hasLetter ? "checkmark-circle" : "close-circle"} 
                size={16} 
                color={validation.hasLetter ? '#10b981' : '#ef4444'} 
              />
              <Text style={[styles.requirementText, { color: validation.hasLetter ? '#10b981' : colors.text }]}>
                Contains letters
              </Text>
            </View>
            
            <View style={styles.requirement}>
              <Ionicons 
                name={validation.hasNumber ? "checkmark-circle" : "close-circle"} 
                size={16} 
                color={validation.hasNumber ? '#10b981' : '#ef4444'} 
              />
              <Text style={[styles.requirementText, { color: validation.hasNumber ? '#10b981' : colors.text }]}>
                Contains numbers
              </Text>
            </View>
            
            <View style={styles.requirement}>
              <Ionicons 
                name={validation.hasSpecialChar ? "checkmark-circle" : "close-circle"} 
                size={16} 
                color={validation.hasSpecialChar ? '#10b981' : '#ef4444'} 
              />
              <Text style={[styles.requirementText, { color: validation.hasSpecialChar ? '#10b981' : colors.text }]}>
                Contains special characters (!@#$%^&*)
              </Text>
            </View>
          </View>
        )}

        {/* Confirm Password */}
        <View style={styles.inputSection}>
          <Text style={styles.label}>Confirm New Password</Text>
          <View style={[
            styles.inputContainer,
            confirmPassword.length > 0 && !passwordsMatch && styles.inputError
          ]}>
            <TextInput
              style={styles.input}
              placeholder="Confirm new password"
              placeholderTextColor={colors.text + '60'}
              secureTextEntry={!showConfirmPassword}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Pressable 
              onPress={() => setShowConfirmPassword(!showConfirmPassword)} 
              style={styles.eyeIcon}
            >
              <Ionicons 
                name={showConfirmPassword ? "eye-outline" : "eye-off-outline"} 
                size={22} 
                color={colors.text + '80'} 
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

        {/* Save Button */}
        <Pressable 
          style={[
            styles.saveButton,
            (!isPasswordValid || !passwordsMatch || !currentPassword.trim()) && styles.saveButtonDisabled
          ]} 
          onPress={handleChangePassword}
          disabled={!isPasswordValid || !passwordsMatch || !currentPassword.trim() || isUpdating}
        >
          {isUpdating ? (
            <Text style={styles.saveButtonText}>Updating...</Text>
          ) : (
            <>
              <Ionicons name="shield-checkmark" size={20} color="#FFFFFF" style={styles.buttonIcon} />
              <Text style={styles.saveButtonText}>Update Password</Text>
            </>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  backgroundImage: {
    position: 'absolute',
    bottom: 0,
    resizeMode: 'cover',
    opacity: 0.1,
    zIndex: 0,
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: colors.text + '80',
    textAlign: 'center',
  },
  inputSection: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.card,
    minHeight: 52,
  },
  inputError: {
    borderColor: '#ef4444',
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
    fontWeight: '600',
    marginBottom: 4,
  },
  strengthBar: {
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  strengthFill: {
    height: '100%',
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
    fontWeight: '600',
    color: colors.text,
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
    marginTop: 4,
    marginLeft: 4,
  },
  matchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    marginLeft: 4,
  },
  matchText: {
    fontSize: 12,
    color: '#10b981',
    marginLeft: 4,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  saveButtonDisabled: {
    backgroundColor: colors.border,
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonIcon: {
    marginRight: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});