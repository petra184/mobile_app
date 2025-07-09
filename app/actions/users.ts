import { supabase } from "@/lib/supabase"
import type { Database } from "@/types/supabase"
import * as FileSystem from "expo-file-system"

// Extract types from the generated Database type
type Tables = Database["public"]["Tables"]
type Functions = Database["public"]["Functions"]

type ScanHistoryInsert = Tables["scan_history"]["Insert"]
type UsersRow = Tables["users"]["Row"]

// Database function types
type GetUserScanHistoryReturn = Functions["get_user_scan_history"]["Returns"][0]
type GetUserLeaderboardReturn = Functions["get_user_leaderboard"]["Returns"][0]

export interface QRCodeScan {
  id: string
  points: number
  description: string
  scannedAt: string
}

type UserPreferences = {
  favoriteTeams: string[]
  notificationsEnabled: boolean
  pushNotifications?: boolean
  emailNotifications?: boolean
  gameNotifications?: boolean
  newsNotifications?: boolean
  specialOffers?: boolean
}


export interface LeaderboardEntry {
  user_id: string
  email: string
  points: number
  total_scans: number
  rank: number
}

// Your app-specific interfaces
export interface UserProfile {
  id: string
  email?: string
  first_name?: string
  last_name?: string
  points: number
  total_scans?: number
  total_points_earned?: number
  last_scan_date?: string
  created_at: string
  updated_at: string
  current_streak?: number
  level_number?: number
  membership_tier?: string
  achievements_count?: number
  level_name?: string
  badge_icon?: string
  badge_color?: string
  benefits?: string[]
}

// Get user profile with stats - now using the view
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const { data, error } = await supabase.from("user_profiles_with_stats").select("*").eq("user_id", userId).single()

    if (error) {
      // If no user found in view, try to create the user record
      if (error.code === "PGRST116") {
        // Get the current authenticated user
        const { data: authUser, error: authError } = await supabase.auth.getUser()

        if (authError || !authUser.user) {
          console.error("No authenticated user found:", authError)
          throw new Error("User not authenticated")
        }

        // Use your existing initialize_user_status function approach
        const createResult = await createCompleteUserRecord(
          userId,
          authUser.user.email || "",
          authUser.user.user_metadata?.first_name || "User",
          authUser.user.user_metadata?.last_name || null,
          authUser.user.user_metadata?.username || authUser.user.email?.split("@")[0] || "user",
        )

        if (!createResult.success) {
          throw new Error(`Failed to create user record: ${createResult.error}`)
        }

        // Retry the query
        const { data: retryData, error: retryError } = await supabase
          .from("user_profiles_with_stats")
          .select("*")
          .eq("user_id", userId)
          .single()

        if (retryError) {
          console.error("Retry query failed:", retryError)
          throw new Error(`Failed to fetch user profile after creation: ${retryError.message}`)
        }

        return transformUserProfileData(retryData)
      } else {
        throw new Error(`Failed to fetch user profile: ${error.message}`)
      }
    }

    if (!data) {
      console.log("=== NO DATA RETURNED ===")
      return null
    }

    return transformUserProfileData(data)
  } catch (error) {
    console.error("=== getUserProfile UNEXPECTED ERROR ===")
    console.error("Error:", error)
    throw error
  }
}

// Helper function to transform database data to app interface
function transformUserProfileData(data: any): UserProfile {
  const transformedData: UserProfile = {
    id: data.user_id || "",
    email: data.email || undefined,
    first_name: data.first_name || undefined,
    last_name: data.last_name || undefined,
    points: data.points || 0,
    total_scans: data.total_scans || 0,
    total_points_earned: data.total_points_earned || 0,
    last_scan_date: data.last_scan_date || undefined,
    created_at: data.created_at || "",
    updated_at: data.updated_at || "",
    current_streak: data.current_streak || 0,
    level_number: data.level_number || 1,
    membership_tier: data.membership_tier || "Bronze",
    achievements_count: data.achievements_count || 0,
    level_name: data.level_name || "Rookie Fan",
    badge_icon: data.badge_icon || "user",
    badge_color: data.badge_color || "#94A3B8",
    benefits: data.benefits || [],
  }

  return transformedData
}

// Function to create a complete user record (fallback for when trigger doesn't work)
export async function createCompleteUserRecord(
  userId: string,
  email: string,
  firstName: string,
  lastName?: string,
  username?: string,
) {
  try {
    // Create user record
    const { error: userError } = await supabase.from("users").insert({
      user_id: userId,
      email: email,
      first_name: firstName,
      last_name: lastName,
      username: username || email.split("@")[0],
      points: 0,
    })

    if (userError) {
      console.error("Error creating user:", userError)
      throw new Error(`Failed to create user: ${userError.message}`)
    }

    // Create user preferences
    const { error: prefsError } = await supabase.from("user_preferences").insert({
      user_id: userId,
      favorite_teams: [],
      notifications_enabled: true,
    })

    if (prefsError) {
      console.error("Error creating user preferences:", prefsError)
      // Don't throw here, preferences are not critical
    }

    // Use your existing initialize_user_status function
    const { error: statusError } = await supabase.rpc("initialize_user_status")

    if (statusError) {
      console.error("Error initializing user status:", statusError)
      // Create user status manually as fallback
      const { error: manualStatusError } = await supabase.from("user_status").insert({
        user_id: userId,
        current_streak: 0,
        level_number: 1,
        membership_tier: "Bronze",
        total_lifetime_points: 0,
        total_scans: 0,
        achievements: [],
        last_activity_date: new Date().toISOString(),
      })

      if (manualStatusError) {
        console.error("Manual status creation also failed:", manualStatusError)
      }
    }

    return { success: true }
  } catch (error) {
    console.error("Failed to create complete user record:", error)
    return { success: false, error: error }
  }
}

// Function to manually trigger user initialization for existing users
export async function initializeExistingUsers() {
  try {
    const { data, error } = await supabase.rpc("initialize_user_status")

    if (error) {
      console.error("Error initializing users:", error)
      throw new Error(`Failed to initialize users: ${error.message}`)
    }

    return { success: true, count: data }
  } catch (error) {
    console.error("Failed to initialize existing users:", error)
    return { success: false, error: error }
  }
}

// Update user points using the database function - now fully typed
export async function updateUserPoints(userId: string, points: number, operation: "add" | "subtract"): Promise<void> {
  const pointsChange = operation === "add" ? points : -points

  const { error } = await supabase.rpc("update_user_points", {
    p_user_id: userId,
    points_change: pointsChange,
  })

  if (error) {
    console.error("Error updating user points:", error)
    throw new Error(`Failed to update points: ${error.message}`)
  }
}

// Get user scan history with pagination - now fully typed
export async function getUserScanHistory(userId: string, limit = 20, offset = 0): Promise<QRCodeScan[]> {
  const { data, error } = await supabase.rpc("get_user_scan_history", {
    p_user_id: userId,
    p_limit: limit,
    p_offset: offset,
  })

  if (error) {
    console.error("Error fetching scan history:", error)
    throw new Error(`Failed to fetch scan history: ${error.message}`)
  }

  // Now TypeScript knows the exact structure of the returned data
  return (data || []).map((scan: GetUserScanHistoryReturn) => ({
    id: scan.id,
    points: scan.points,
    description: scan.description,
    scannedAt: scan.scanned_at,
  }))
}

// Alternative: Direct table query with full type safety
export async function getUserScanHistoryDirect(userId: string, limit = 20, offset = 0): Promise<QRCodeScan[]> {
  const { data, error } = await supabase
    .from("scan_history")
    .select("id, points, description, scanned_at")
    .eq("user_id", userId)
    .order("scanned_at", { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    console.error("Error fetching scan history:", error)
    throw new Error(`Failed to fetch scan history: ${error.message}`)
  }

  // TypeScript now knows the exact structure from the generated types
  return (data || []).map((scan) => ({
    id: scan.id,
    points: scan.points,
    description: scan.description,
    scannedAt: scan.scanned_at || new Date().toISOString(),
  }))
}

// Add a new scan - now fully typed
export async function addUserScan(userId: string, scan: QRCodeScan): Promise<void> {
  const scanData: ScanHistoryInsert = {
    id: scan.id,
    user_id: userId,
    points: scan.points,
    description: scan.description,
    scanned_at: scan.scannedAt,
  }
  const { error } = await supabase.from("scan_history").insert(scanData)

  if (error) {
    console.error("Error adding scan:", error)
    throw new Error(`Failed to add scan: ${error.message}`)
  }
}

// Get user preferences - now fully typed
export async function getUserPreferences(userId: string): Promise<UserPreferences | null> {
  try {
    const { data, error } = await supabase.from("user_preferences").select("*").eq("user_id", userId).single()

    if (error) {
      if (error.code === "PGRST116") {
        // No rows returned
        console.log("No user preferences found for user:", userId)
        return null
      }
      throw error
    }

    const preferences: UserPreferences = {
      favoriteTeams: data.favorite_teams || [],
      notificationsEnabled: data.notifications_enabled ?? true,
      pushNotifications: data.push_notifications ?? true,
      emailNotifications: data.email_notifications ?? true,
      gameNotifications: data.game_notifications ?? true,
      newsNotifications: data.news_notifications ?? true,
      specialOffers: data.special_offers ?? false,
    }
    return preferences
  } catch (error) {
    console.error("Error getting user preferences:", error)
    return null
  }
}

// Update user preferences - now fully typed
export async function updateUserPreferences(userId: string, preferences: UserPreferences): Promise<void> {
  const { error } = await supabase.from("user_preferences").upsert(
    {
      user_id: userId,
      favorite_teams: preferences.favoriteTeams,
      notifications_enabled: preferences.notificationsEnabled,
      push_notifications: preferences.pushNotifications,
      email_notifications: preferences.emailNotifications,
      game_notifications: preferences.gameNotifications,
      news_notifications: preferences.newsNotifications,
      special_offers: preferences.specialOffers,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: "user_id", // conflict key
    },
  )

  if (error) {
    console.error("Error updating user preferences:", error)
    throw new Error(`Failed to update preferences: ${error.message}`)
  }
}


// Get leaderboard - now fully typed
export async function getUserLeaderboard(limit = 10): Promise<LeaderboardEntry[]> {
  const { data, error } = await supabase.rpc("get_user_leaderboard", {
    limit_count: limit,
  })

  if (error) {
    console.error("Error fetching leaderboard:", error)
    throw new Error(`Failed to fetch leaderboard: ${error.message}`)
  }

  // TypeScript now knows the exact structure from the generated types
  return (data || []).map((entry: GetUserLeaderboardReturn) => ({
    user_id: entry.user_id,
    email: entry.email,
    points: entry.points,
    total_scans: entry.total_scans,
    rank: entry.rank,
  }))
}

// Additional helper functions using your generated types

// Get user by ID with full type safety
export async function getUserById(userId: string): Promise<UsersRow | null> {
  try {
    const { data, error } = await supabase.from("users").select("*").eq("user_id", userId).maybeSingle()

    if (error) {
      console.error("Error fetching user:", error)
      return null
    }

    if (!data) {
      console.log("User not found in users table:", userId)
      return null
    }

    return data
  } catch (error) {
    console.error("Unexpected error in getUserById:", error)
    return null
  }
}

// Create a new user with full type safety
export async function createUser(userData: {
  email: string
  first_name: string
  last_name?: string
  username: string
  phone_number?: string
  user_id: string
}): Promise<void> {
  const { error } = await supabase.from("users").insert({
    email: userData.email,
    first_name: userData.first_name,
    last_name: userData.last_name,
    username: userData.username,
    phone_number: userData.phone_number,
    user_id: userData.user_id,
    points: 0, // Default starting points
  })

  if (error) {
    console.error("Error creating user:", error)
    throw new Error(`Failed to create user: ${error.message}`)
  }
}

// ===== IMAGE FUNCTIONS =====

/**
 * Upload profile image with robust error handling and multiple fallback methods
 */
export async function uploadProfileImage(userId: string, imageUri: string): Promise<string | undefined> {
  try {
    console.log("=== STARTING PROFILE IMAGE UPLOAD ===")
    console.log("User ID:", userId)
    console.log("Image URI:", imageUri)

    // Validate inputs
    if (!userId || !imageUri) {
      throw new Error("Missing required parameters: userId and imageUri are required")
    }

    // Get file info to verify it exists and get size
    const fileInfo = await FileSystem.getInfoAsync(imageUri)
    if (!fileInfo.exists) {
      throw new Error("File does not exist at the provided URI")
    }

    console.log("File exists, size:", fileInfo.size)

    if (fileInfo.size === 0) {
      throw new Error("File is empty (0 bytes)")
    }

    // Check if file is too large (10MB limit)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (fileInfo.size && fileInfo.size > maxSize) {
      throw new Error("File is too large (max 10MB)")
    }

    // Create a unique filename
    const fileExt = imageUri.split(".").pop()?.toLowerCase() || "jpg"
    const fileName = `${userId}-${Date.now()}.${fileExt}`

    console.log("Generated filename:", fileName)

    // Method 1: Try with FileSystem.readAsStringAsync and base64 conversion
    try {
      console.log("Attempting base64 method...")

      const base64String = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      })

      if (!base64String || base64String.length === 0) {
        throw new Error("Base64 conversion resulted in empty string")
      }

      console.log("Base64 length:", base64String.length)

      // Convert base64 to Uint8Array
      const binaryString = atob(base64String)
      const uint8Array = new Uint8Array(binaryString.length)

      for (let i = 0; i < binaryString.length; i++) {
        uint8Array[i] = binaryString.charCodeAt(i)
      }

      console.log("Converted to Uint8Array, size:", uint8Array.byteLength)

      if (uint8Array.byteLength === 0) {
        throw new Error("Converted data is empty")
      }

      // Upload to Supabase
      const { data, error } = await supabase.storage.from("profile-images").upload(fileName, uint8Array, {
        cacheControl: "3600",
        upsert: true,
        contentType: `image/${fileExt}`,
      })

      if (error) {
        console.error("Supabase upload error:", error)
        throw error
      }

      console.log("Upload successful via base64 method:", data)

      // Get the public URL
      const { data: urlData } = supabase.storage.from("profile-images").getPublicUrl(fileName)

      console.log("Generated public URL:", urlData.publicUrl)
      return urlData.publicUrl
    } catch (base64Error) {
      console.error("Base64 method failed:", base64Error)

      // Method 2: Fallback to fetch method
      console.log("Attempting fetch method as fallback...")

      const response = await fetch(imageUri)
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status}`)
      }

      const arrayBuffer = await response.arrayBuffer()
      console.log("Fetched ArrayBuffer size:", arrayBuffer.byteLength)

      if (arrayBuffer.byteLength === 0) {
        throw new Error("Fetched data is empty")
      }

      // Upload to Supabase
      const { data, error } = await supabase.storage.from("profile-images").upload(fileName, arrayBuffer, {
        cacheControl: "3600",
        upsert: true,
        contentType: `image/${fileExt}`,
      })

      if (error) {
        console.error("Supabase upload error (fetch method):", error)
        throw error
      }

      console.log("Upload successful via fetch method:", data)

      // Get the public URL
      const { data: urlData } = supabase.storage.from("profile-images").getPublicUrl(fileName)

      console.log("Generated public URL:", urlData.publicUrl)
      return urlData.publicUrl
    }
  } catch (error) {
    console.error("=== IMAGE UPLOAD FAILED ===")
    console.error("Error:", error)
    throw error
  }
}

/**
 * Download profile image and convert to data URL for display
 */
export async function getProfileImageDataUrl(userId: string, fileName: string): Promise<string | null> {
  try {
    const { data, error } = await supabase.storage.from("profile-images").download(fileName)

    if (error) {
      console.error("Error downloading profile image:", error)
      return null
    }

    // Use FileReader to convert blob to data URL
    return new Promise((resolve) => {
      const fr = new FileReader()
      fr.readAsDataURL(data!)
      fr.onload = () => {
        resolve(fr.result as string)
      }
      fr.onerror = () => {
        resolve(null)
      }
    })
  } catch (error) {
    console.error("Error in getProfileImageDataUrl:", error)
    return null
  }
}

/**
 * Delete old profile image from storage
 */
export async function deleteProfileImageFromStorage(imageUrl: string): Promise<boolean> {
  try {
    if (!imageUrl || !imageUrl.includes("profile-images")) {
      return true // Nothing to delete
    }

    // Extract the file path from the URL
    const urlParts = imageUrl.split("/")
    const fileName = urlParts[urlParts.length - 1]
    console.log("Deleting image:", fileName)

    const { error } = await supabase.storage.from("profile-images").remove([fileName])

    if (error) {
      console.error("Error deleting image:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Error in deleteProfileImageFromStorage:", error)
    return false
  }
}

/**
 * Update user profile with new data
 */
export async function updateUserProfileData(
  userId: string,
  updates: {
    first_name?: string
    last_name?: string
    username?: string
    phone_number?: string
    birthday?: string
    profile_image_url?: string
  },
): Promise<boolean> {
  try {
    console.log("Updating user profile:", userId, updates)
    const { error } = await supabase
      .from("users")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)

    if (error) {
      console.error("Error updating user profile:", error)
      throw new Error(`Failed to update profile: ${error.message}`)
    }

    console.log("Profile updated successfully")
    return true
  } catch (error) {
    console.error("Unexpected error updating user profile:", error)
    return false
  }
}

/**
 * Update profile with image upload - main function for profile updates with images
 */
export async function updateProfileWithImage(
  userId: string,
  profileData: {
    first_name?: string
    last_name?: string
    username?: string
    phone_number?: string
    birthday?: string
  },
  imageUri?: string,
  oldImageUrl?: string,
): Promise<boolean> {
  try {
    console.log("Starting profile update with image...")
    let profileImageUrl: string | undefined = oldImageUrl

    // Upload new image if provided
    if (imageUri) {
      console.log("Uploading new image...")
      try {
        profileImageUrl = await uploadProfileImage(userId, imageUri)

        if (!profileImageUrl) {
          throw new Error("Failed to upload profile image")
        }

        console.log("Image uploaded successfully:", profileImageUrl)

        // Delete old image after successful upload
        if (oldImageUrl && oldImageUrl !== profileImageUrl) {
          console.log("Deleting old image...")
          await deleteProfileImageFromStorage(oldImageUrl)
        }
      } catch (uploadError) {
        console.error("Error uploading image:", uploadError)
        throw new Error(`Failed to upload profile image: ${uploadError}`)
      }
    }

    // Update user profile
    console.log("Updating profile data...")
    const success = await updateUserProfileData(userId, {
      ...profileData,
      profile_image_url: profileImageUrl,
    })

    if (!success) {
      throw new Error("Failed to update profile data")
    }

    console.log("Profile update completed successfully")
    return true
  } catch (error) {
    console.error("Error updating profile with image:", error)
    throw error
  }
}

// Enhanced password update function with better error handling

// Enhanced password update function with better error handling
export async function updateUserPassword(currentPassword: string, newPassword: string) {
  try {
    // Get current user
    const { data: userData, error: userError } = await supabase.auth.getUser()

    if (userError) {
      throw new Error("AUTHENTICATION_ERROR")
    }

    if (!userData.user?.email) {
      throw new Error("NO_USER_FOUND")
    }

    // Verify current password by attempting to sign in
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: userData.user.email,
      password: currentPassword,
    })

    if (signInError) {
      // Handle specific Supabase auth errors
      if (signInError.message.includes("Invalid login credentials")) {
        throw new Error("INVALID_CREDENTIALS")
      } else if (signInError.message.includes("Email not confirmed")) {
        throw new Error("EMAIL_NOT_CONFIRMED")
      } else if (signInError.message.includes("Too many requests")) {
        throw new Error("RATE_LIMITED")
      } else {
        throw new Error("VERIFICATION_FAILED")
      }
    }

    // Update the password
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (updateError) {
      // Handle specific update errors
      if (updateError.message.includes("New password should be different")) {
        throw new Error("PASSWORD_SAME_AS_CURRENT")
      } else if (updateError.message.includes("Password should be at least")) {
        throw new Error("PASSWORD_TOO_WEAK")
      } else if (updateError.message.includes("network")) {
        throw new Error("NETWORK_ERROR")
      } else {
        throw new Error("UPDATE_FAILED")
      }
    }

    return { success: true }
  } catch (error: any) {
    // Re-throw with original error type if it's already categorized
    if (typeof error.message === "string" && error.message.includes("_")) {
      throw error
    }

    // Handle uncategorized errors
    throw new Error("UNKNOWN_ERROR")
  }
}

/**
 * Check if an email is already taken
 * @param email The email to check
 * @returns Object with availability status
 */
export async function checkEmailAvailability(email: string) {
  try {
    if (!email || email.trim() === "") {
      return { available: false, message: "Email is required" }
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return { available: false, message: "Invalid email format" }
    }

    const { data, error } = await supabase.from("users").select("email").eq("email", email.toLowerCase()).single()

    if (error && error.code === "PGRST116") {
      // No rows returned - email is available
      return { available: true, message: "Email is available" }
    }

    if (error) {
      console.error("Error checking email availability:", error)
      return { available: false, message: "Error checking email availability" }
    }

    // Email exists
    return { available: false, message: "Email is already taken" }
  } catch (error) {
    console.error("Unexpected error checking email:", error)
    return { available: false, message: "Error checking email availability" }
  }
}

/**
 * Check if a username is already taken
 * @param username The username to check
 * @returns Object with availability status
 */
export async function checkUsernameAvailability(username: string) {
  try {
    if (!username || username.trim() === "") {
      return { available: false, message: "Username is required" }
    }

    // Username validation rules
    if (username.length < 3) {
      return { available: false, message: "Username must be at least 3 characters" }
    }

    if (username.length > 20) {
      return { available: false, message: "Username must be less than 20 characters" }
    }

    // Only allow alphanumeric characters and underscores
    const usernameRegex = /^[a-zA-Z0-9_]+$/
    if (!usernameRegex.test(username)) {
      return { available: false, message: "Username can only contain letters, numbers, and underscores" }
    }

    const { data, error } = await supabase
      .from("users")
      .select("username")
      .eq("username", username.toLowerCase())
      .single()

    if (error && error.code === "PGRST116") {
      // No rows returned - username is available
      return { available: true, message: "Username is available" }
    }

    if (error) {
      console.error("Error checking username availability:", error)
      return { available: false, message: "Error checking username availability" }
    }

    // Username exists
    return { available: false, message: "Username is already taken" }
  } catch (error) {
    console.error("Unexpected error checking username:", error)
    return { available: false, message: "Error checking username availability" }
  }
}

/**
 * Check both email and username availability at once
 * @param email The email to check
 * @param username The username to check
 * @returns Object with both availability statuses
 */
export async function checkBothAvailability(email: string, username: string) {
  try {
    const [emailResult, usernameResult] = await Promise.all([
      checkEmailAvailability(email),
      checkUsernameAvailability(username),
    ])

    return {
      email: emailResult,
      username: usernameResult,
      bothAvailable: emailResult.available && usernameResult.available,
    }
  } catch (error) {
    console.error("Error checking availability:", error)
    return {
      email: { available: false, message: "Error checking email" },
      username: { available: false, message: "Error checking username" },
      bothAvailable: false,
    }
  }
}
