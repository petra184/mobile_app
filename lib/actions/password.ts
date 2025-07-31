// app/actions/auth_actions.ts
import { supabase } from '@/lib/supabase'

/**
 * Send password reset email if user exists in the database
 * @param email - The email address to send reset link to
 * @returns Object with success status and message
 */
export async function sendPasswordResetEmail(email: string) {
  try {
    // First, check if the email exists in the users table
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('email, user_id')
      .eq('email', email.toLowerCase().trim())
      .single()

    if (userError && userError.code === 'PGRST116') {
      // No user found with this email
      console.log('No user found with email:', email)
      // Return success anyway for security (don't reveal if email exists)
      return {
        success: true,
        message: 'If an account with that email exists, you will receive a password reset link shortly.'
      }
    }

    if (userError) {
      console.error('Error checking user email:', userError)
      return {
        success: false,
        message: 'An error occurred while processing your request. Please try again.'
      }
    }

    if (!user) {
      // No user found, but return success for security
      return {
        success: true,
        message: 'If an account with that email exists, you will receive a password reset link shortly.'
      }
    }

    // User exists, send password reset email via Supabase Auth
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.EXPO_PUBLIC_APP_URL || 'your-app://'}reset-password`,
    })

    if (resetError) {
      console.error('Supabase password reset error:', resetError)
      
      // Handle specific Supabase errors
      if (resetError.message.includes('rate limit')) {
        return {
          success: false,
          message: 'Too many reset attempts. Please wait a few minutes before trying again.'
        }
      }
      
      return {
        success: false,
        message: 'Unable to send reset email. Please try again later.'
      }
    }

    console.log('Password reset email sent successfully to:', email)
    return {
      success: true,
      message: 'Password reset instructions have been sent to your email address.'
    }

  } catch (error) {
    console.error('Unexpected error in sendPasswordResetEmail:', error)
    return {
      success: false,
      message: 'An unexpected error occurred. Please try again.'
    }
  }
}

/**
 * Verify if an email exists in the users table
 * @param email - The email to check
 * @returns Object with exists status
 */
export async function checkEmailExists(email: string) {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('email')
      .eq('email', email.toLowerCase().trim())
      .single()

    if (error && error.code === 'PGRST116') {
      // No user found
      return { exists: false }
    }

    if (error) {
      console.error('Error checking email existence:', error)
      throw error
    }

    return { exists: !!data }
  } catch (error) {
    console.error('Unexpected error checking email:', error)
    throw error
  }
}

/**
 * Handle password reset confirmation (called when user clicks reset link)
 * This is typically handled by Supabase automatically, but you can use this
 * for additional validation or logging
 * @param accessToken - Access token from reset link
 * @param refreshToken - Refresh token from reset link
 */
export async function confirmPasswordReset(accessToken: string, refreshToken: string) {
  try {
    const { data, error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    })

    if (error) {
      console.error('Error confirming password reset:', error)
      return {
        success: false,
        message: 'Invalid or expired reset link. Please request a new one.'
      }
    }

    return {
      success: true,
      message: 'Reset link verified. You can now set your new password.',
      user: data.user
    }
  } catch (error) {
    console.error('Unexpected error confirming reset:', error)
    return {
      success: false,
      message: 'An unexpected error occurred. Please try again.'
    }
  }
}

/**
 * Update user password (called after successful reset confirmation)
 * @param newPassword - The new password
 */
export async function updatePassword(newPassword: string) {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    })

    if (error) {
      console.error('Error updating password:', error)
      
      if (error.message.includes('Password should be at least')) {
        return {
          success: false,
          message: 'Password must be at least 6 characters long.'
        }
      }
      
      return {
        success: false,
        message: 'Failed to update password. Please try again.'
      }
    }

    return {
      success: true,
      message: 'Password updated successfully.'
    }
  } catch (error) {
    console.error('Unexpected error updating password:', error)
    return {
      success: false,
      message: 'An unexpected error occurred. Please try again.'
    }
  }
}

/**
 * Validate password strength
 * @param password - Password to validate
 */
export function validatePassword(password: string) {
  const minLength = 6
  const hasUpperCase = /[A-Z]/.test(password)
  const hasLowerCase = /[a-z]/.test(password)
  const hasNumbers = /\d/.test(password)
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password)

  const errors = []

  if (password.length < minLength) {
    errors.push(`Password must be at least ${minLength} characters long`)
  }

  if (!hasUpperCase) {
    errors.push('Password must contain at least one uppercase letter')
  }

  if (!hasLowerCase) {
    errors.push('Password must contain at least one lowercase letter')
  }

  if (!hasNumbers) {
    errors.push('Password must contain at least one number')
  }

  // Optional: Require special characters
  // if (!hasSpecialChar) {
  //   errors.push('Password must contain at least one special character')
  // }

  return {
    isValid: errors.length === 0,
    errors
  }
}