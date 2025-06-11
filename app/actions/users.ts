import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/supabase'; // Import your generated types
import * as FileSystem from 'expo-file-system';

// Extract types from the generated Database type
type Tables = Database['public']['Tables'];
type Views = Database['public']['Views'];
type Functions = Database['public']['Functions'];

// Database table types
type ScanHistoryRow = Tables['scan_history']['Row'];
type ScanHistoryInsert = Tables['scan_history']['Insert'];
type UserPreferencesRow = Tables['user_preferences']['Row'];
type UserPreferencesUpdate = Tables['user_preferences']['Update'];
type UsersRow = Tables['users']['Row'];

// Database view types
type UserProfilesWithStatsRow = Views['user_profiles_with_stats']['Row'];

// Database function types
type GetUserScanHistoryReturn = Functions['get_user_scan_history']['Returns'][0];
type GetUserLeaderboardReturn = Functions['get_user_leaderboard']['Returns'][0];

export interface QRCodeScan {
  id: string;
  points: number;
  description: string;
  scannedAt: string;
}

export interface UserPreferences {
  favoriteTeams: string[];
  notificationsEnabled: boolean;
}

export interface LeaderboardEntry {
  user_id: string;
  email: string;
  points: number;
  total_scans: number;
  rank: number;
}


// Your app-specific interfaces
export interface UserProfile {
  id: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  points: number;
  total_scans?: number;
  total_points_earned?: number;
  last_scan_date?: string;
  created_at: string;
  updated_at: string;
  current_streak?: number;
  level_number?: number;
  membership_tier?: string;
  achievements_count?: number;
  level_name?: string;
  badge_icon?: string;
  badge_color?: string;
  benefits?: string[];
}

// Get user profile with stats - now using the view
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  console.log("=== getUserProfile CALLED ===")
  console.log("Input userId:", userId)
  
  try {
    console.log("=== QUERYING user_profiles_with_stats VIEW ===")
    
    const { data, error } = await supabase
      .from('user_profiles_with_stats')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    console.log("=== QUERY RESULT ===")
    console.log("Error:", error)
    console.log("Data:", JSON.stringify(data, null, 2))
    
    if (error) {
      console.error('=== getUserProfile ERROR ===');
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      
      // If no user found in view, try to create the user record
      if (error.code === 'PGRST116') {
        console.log("=== USER NOT FOUND IN VIEW, ATTEMPTING CREATION ===")
        
        // Get the current authenticated user
        const { data: authUser, error: authError } = await supabase.auth.getUser();
        
        if (authError || !authUser.user) {
          console.error("No authenticated user found:", authError);
          throw new Error("User not authenticated");
        }
        
        console.log("=== CREATING MISSING USER RECORD ===")
        
        // Use your existing initialize_user_status function approach
        const createResult = await createCompleteUserRecord(
          userId,
          authUser.user.email || '',
          authUser.user.user_metadata?.first_name || 'User',
          authUser.user.user_metadata?.last_name || null,
          authUser.user.user_metadata?.username || authUser.user.email?.split('@')[0] || 'user'
        );
        
        if (!createResult.success) {
          throw new Error(`Failed to create user record: ${createResult.error}`);
        }
        
        console.log("=== USER RECORD CREATED, RETRYING QUERY ===")
        
        // Retry the query
        const { data: retryData, error: retryError } = await supabase
          .from('user_profiles_with_stats')
          .select('*')
          .eq('user_id', userId)
          .single();
          
        if (retryError) {
          console.error("Retry query failed:", retryError);
          throw new Error(`Failed to fetch user profile after creation: ${retryError.message}`);
        }
        
        return transformUserProfileData(retryData);
      } else {
        throw new Error(`Failed to fetch user profile: ${error.message}`);
      }
    }
    
    if (!data) {
      console.log("=== NO DATA RETURNED ===")
      return null;
    }
    
    return transformUserProfileData(data);
    
  } catch (error) {
    console.error('=== getUserProfile UNEXPECTED ERROR ===');
    console.error('Error:', error);
    throw error;
  }
}

// Helper function to transform database data to app interface
function transformUserProfileData(data: any): UserProfile {
  console.log("=== TRANSFORMING DATA ===")
  
  const transformedData: UserProfile = {
    id: data.user_id || '',
    email: data.email || undefined,
    first_name: data.first_name || undefined,
    last_name: data.last_name || undefined,
    points: data.points || 0,
    total_scans: data.total_scans || 0,
    total_points_earned: data.total_points_earned || 0,
    last_scan_date: data.last_scan_date || undefined,
    created_at: data.created_at || '',
    updated_at: data.updated_at || '',
    current_streak: data.current_streak || 0,
    level_number: data.level_number || 1,
    membership_tier: data.membership_tier || 'Bronze',
    achievements_count: data.achievements_count || 0,
    level_name: data.level_name || 'Rookie Fan',
    badge_icon: data.badge_icon || 'user',
    badge_color: data.badge_color || '#94A3B8',
    benefits: data.benefits || [],
  };
  
  console.log("=== TRANSFORMED DATA ===")
  console.log(JSON.stringify(transformedData, null, 2))
  
  return transformedData;
}



// Function to create a complete user record (fallback for when trigger doesn't work)
export async function createCompleteUserRecord(
  userId: string, 
  email: string, 
  firstName: string, 
  lastName?: string, 
  username?: string
) {
  try {
    console.log("=== CREATING COMPLETE USER RECORD ===");
    console.log("userId:", userId, "email:", email, "firstName:", firstName);
    
    // Create user record
    const { error: userError } = await supabase
      .from('users')
      .insert({
        user_id: userId,
        email: email,
        first_name: firstName,
        last_name: lastName,
        username: username || email.split('@')[0],
        points: 0,
      });
      
    if (userError) {
      console.error("Error creating user:", userError);
      throw new Error(`Failed to create user: ${userError.message}`);
    }
    
    // Create user preferences
    const { error: prefsError } = await supabase
      .from('user_preferences')
      .insert({
        user_id: userId,
        favorite_teams: [],
        notifications_enabled: true,
      });
      
    if (prefsError) {
      console.error("Error creating user preferences:", prefsError);
      // Don't throw here, preferences are not critical
    }
    
    // Use your existing initialize_user_status function
    const { error: statusError } = await supabase
      .rpc('initialize_user_status');
      
    if (statusError) {
      console.error("Error initializing user status:", statusError);
      // Create user status manually as fallback
      const { error: manualStatusError } = await supabase
        .from('user_status')
        .insert({
          user_id: userId,
          current_streak: 0,
          level_number: 1,
          membership_tier: 'Bronze',
          total_lifetime_points: 0,
          total_scans: 0,
          achievements: [],
          last_activity_date: new Date().toISOString(),
        });
        
      if (manualStatusError) {
        console.error("Manual status creation also failed:", manualStatusError);
      }
    }
    
    console.log("=== USER RECORD CREATED SUCCESSFULLY ===");
    return { success: true };
    
  } catch (error) {
    console.error("Failed to create complete user record:", error);
    return { success: false, error: error };
  }
}

// Function to manually trigger user initialization for existing users
export async function initializeExistingUsers() {
  try {
    console.log("=== INITIALIZING EXISTING USERS ===");
    
    const { data, error } = await supabase
      .rpc('initialize_user_status');
      
    if (error) {
      console.error("Error initializing users:", error);
      throw new Error(`Failed to initialize users: ${error.message}`);
    }
    
    console.log("=== INITIALIZED", data, "USERS ===");
    return { success: true, count: data };
    
  } catch (error) {
    console.error("Failed to initialize existing users:", error);
    return { success: false, error: error };
  }
}



// Update user points using the database function - now fully typed
export async function updateUserPoints(
  userId: string, 
  points: number, 
  operation: 'add' | 'subtract'
): Promise<void> {
  const pointsChange = operation === 'add' ? points : -points;
  
  const { error } = await supabase.rpc('update_user_points', {
    p_user_id: userId,
    points_change: pointsChange
  });
  
  if (error) {
    console.error('Error updating user points:', error);
    throw new Error(`Failed to update points: ${error.message}`);
  }
}

// Get user scan history with pagination - now fully typed
export async function getUserScanHistory(
  userId: string, 
  limit: number = 20, 
  offset: number = 0
): Promise<QRCodeScan[]> {
  const { data, error } = await supabase.rpc('get_user_scan_history', {
    p_user_id: userId,
    p_limit: limit,
    p_offset: offset
  });
    
  if (error) {
    console.error('Error fetching scan history:', error);
    throw new Error(`Failed to fetch scan history: ${error.message}`);
  }
  
  // Now TypeScript knows the exact structure of the returned data
  return (data || []).map((scan: GetUserScanHistoryReturn) => ({
    id: scan.id,
    points: scan.points,
    description: scan.description,
    scannedAt: scan.scanned_at
  }));
}

// Alternative: Direct table query with full type safety
export async function getUserScanHistoryDirect(
  userId: string, 
  limit: number = 20, 
  offset: number = 0
): Promise<QRCodeScan[]> {
  const { data, error } = await supabase
    .from('scan_history')
    .select('id, points, description, scanned_at')
    .eq('user_id', userId)
    .order('scanned_at', { ascending: false })
    .range(offset, offset + limit - 1);
    
  if (error) {
    console.error('Error fetching scan history:', error);
    throw new Error(`Failed to fetch scan history: ${error.message}`);
  }
  
  // TypeScript now knows the exact structure from the generated types
  return (data || []).map((scan) => ({
    id: scan.id,
    points: scan.points,
    description: scan.description,
    scannedAt: scan.scanned_at || new Date().toISOString()
  }));
}

// Add a new scan - now fully typed
export async function addUserScan(userId: string, scan: QRCodeScan): Promise<void> {
  const scanData: ScanHistoryInsert = {
    id: scan.id,
    user_id: userId,
    points: scan.points,
    description: scan.description,
    scanned_at: scan.scannedAt
  };

  const { error } = await supabase
    .from('scan_history')
    .insert(scanData);
    
  if (error) {
    console.error('Error adding scan:', error);
    throw new Error(`Failed to add scan: ${error.message}`);
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
  
      return {
        favoriteTeams: data.favorite_teams || [],
        notificationsEnabled: data.notifications_enabled ?? true,
      }
    } catch (error) {
      console.error("Error getting user preferences:", error)
      return null
    }
  }

// Update user preferences - now fully typed
export async function updateUserPreferences(userId: string, preferences: UserPreferences): Promise<void> {
    const updateData: UserPreferences = {
      favoriteTeams: preferences.favoriteTeams,
      notificationsEnabled: preferences.notificationsEnabled,
    }
  
    const { error } = await supabase.from("user_preferences").upsert(
      {
        user_id: userId,
        favorite_teams: preferences.favoriteTeams,
        notifications_enabled: preferences.notificationsEnabled,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "user_id", // Add this line to specify which column to check for conflicts
      },
    )
  
    if (error) {
      console.error("Error updating user preferences:", error)
      throw new Error(`Failed to update preferences: ${error.message}`)
    }
  }

// Get leaderboard - now fully typed
export async function getUserLeaderboard(limit: number = 10): Promise<LeaderboardEntry[]> {
  const { data, error } = await supabase.rpc('get_user_leaderboard', {
    limit_count: limit
  });
    
  if (error) {
    console.error('Error fetching leaderboard:', error);
    throw new Error(`Failed to fetch leaderboard: ${error.message}`);
  }
  
  // TypeScript now knows the exact structure from the generated types
  return (data || []).map((entry: GetUserLeaderboardReturn) => ({
    user_id: entry.user_id,
    email: entry.email,
    points: entry.points,
    total_scans: entry.total_scans,
    rank: entry.rank
  }));
}

// Additional helper functions using your generated types

// Get user by ID with full type safety
export async function getUserById(userId: string): Promise<UsersRow | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('user_id', userId)
    .single();
    
  if (error) {
    console.error('Error fetching user:', error);
    return null;
  }
  
  return data;
}

// Create a new user with full type safety
export async function createUser(userData: {
  email: string;
  first_name: string;
  last_name?: string;
  username: string;
  phone_number?: string;
  user_id: string;
}): Promise<void> {
  const { error } = await supabase
    .from('users')
    .insert({
      email: userData.email,
      first_name: userData.first_name,
      last_name: userData.last_name,
      username: userData.username,
      phone_number: userData.phone_number,
      user_id: userData.user_id,
      points: 0, // Default starting points
    });
    
  if (error) {
    console.error('Error creating user:', error);
    throw new Error(`Failed to create user: ${error.message}`);
  }
}

// Get teams with full type safety (using your existing teams table)
export async function getTeams(): Promise<Tables['teams']['Row'][]> {
  const { data, error } = await supabase
    .from('teams')
    .select('*')
    .order('name');
    
  if (error) {
    console.error('Error fetching teams:', error);
    throw new Error(`Failed to fetch teams: ${error.message}`);
  }
  
  return data || [];
}

// Get rewards with full type safety
export async function getRewards(teamId?: string): Promise<Tables['rewards']['Row'][]> {
  let query = supabase
    .from('rewards')
    .select('*')
    .eq('is_active', true);
    
  if (teamId) {
    query = query.eq('team_id', teamId);
  }
  
  const { data, error } = await query.order('points_required');
    
  if (error) {
    console.error('Error fetching rewards:', error);
    throw new Error(`Failed to fetch rewards: ${error.message}`);
  }
  
  return data || [];
}

export async function uploadProfileImage(userId: string, imageUri: string): Promise<string | undefined> {
    try {
      // Get file info
      const fileInfo = await FileSystem.getInfoAsync(imageUri);
      if (!fileInfo.exists) {
        throw new Error('File does not exist');
      }
  
      // Create a unique filename
      const fileExt = imageUri.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const filePath = `profile-images/${fileName}`;
  
      // Read the file as base64
      const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
  
      // Convert base64 to blob
      const byteCharacters = atob(base64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: `image/${fileExt}` });
  
      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('profile-images')
        .upload(filePath, blob, {
          cacheControl: '3600',
          upsert: true,
        });
  
      if (error) {
        console.error('Error uploading image:', error);
        throw new Error(`Failed to upload image: ${error.message}`);
      }
  
      // Get the public URL
      const { data: urlData } = supabase.storage
        .from('profile-images')
        .getPublicUrl(filePath);
  
      return urlData.publicUrl;
    } catch (error) {
      console.error('Error in uploadProfileImage:', error);
      return undefined;
    }
  }
  
  /**
   * Update user profile with new data including profile image
   */
  export async function updateUserProfile(
    userId: string,
    updates: {
      first_name?: string;
      last_name?: string;
      username?: string;
      phone_number?: string;
      profile_image_url?: string;
    }
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('users')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);
  
      if (error) {
        console.error('Error updating user profile:', error);
        throw new Error(`Failed to update profile: ${error.message}`);
      }
  
      return true;
    } catch (error) {
      console.error('Unexpected error updating user profile:', error);
      return false;
    }
  }
  
  /**
   * Delete old profile image from storage
   */
  export async function deleteProfileImage(imageUrl: string): Promise<boolean> {
    try {
      // Extract the file path from the URL
      const urlParts = imageUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];
      const filePath = `profile-images/${fileName}`;
  
      const { error } = await supabase.storage
        .from('profile-images')
        .remove([filePath]);
  
      if (error) {
        console.error('Error deleting image:', error);
        return false;
      }
  
      return true;
    } catch (error) {
      console.error('Error in deleteProfileImage:', error);
      return false;
    }
  }
  
  /**
   * Update profile with image upload
   */
  export async function updateProfileWithImage(
    userId: string,
    profileData: {
      first_name?: string;
      last_name?: string;
      username?: string;
      phone_number?: string;
    },
    imageUri?: string,
    oldImageUrl?: string
  ): Promise<boolean> {
    try {
      let profileImageUrl: string | undefined = oldImageUrl;
  
      // Upload new image if provided
      if (imageUri) {
        // Delete old image if it exists
        if (oldImageUrl) {
          await deleteProfileImage(oldImageUrl);
        }
  
        // Upload new image
        profileImageUrl = await uploadProfileImage(userId, imageUri);
        if (!profileImageUrl) {
          throw new Error('Failed to upload profile image');
        }
      }
  
      // Update user profile
      const success = await updateUserProfile(userId, {
        ...profileData,
        profile_image_url: profileImageUrl,
      });
  
      return success;
    } catch (error) {
      console.error('Error updating profile with image:', error);
      return false;
    }
  }

  export async function updateUserPassword(currentPassword: string, newPassword: string) {
    try {
      // First, verify the current password by attempting to sign in
      const { data: user } = await supabase.auth.getUser();
      
      if (!user.user?.email) {
        throw new Error('No authenticated user found');
      }
  
      // Verify current password by attempting to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.user.email,
        password: currentPassword,
      });
  
      if (signInError) {
        throw new Error('Current password is incorrect');
      }
  
      // Update the password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });
  
      if (updateError) {
        throw updateError;
      }
  
      return { success: true };
    } catch (error) {
      console.error('Password update error:', error);
      throw error;
    }
  }

/**
 * Check if an email is already taken
 * @param email The email to check
 * @returns Object with availability status
 */
export async function checkEmailAvailability(email: string) {
  try {
    if (!email || email.trim() === '') {
      return { available: false, message: 'Email is required' };
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { available: false, message: 'Invalid email format' };
    }

    const { data, error } = await supabase
      .from('users')
      .select('email')
      .eq('email', email.toLowerCase())
      .single();

    if (error && error.code === 'PGRST116') {
      // No rows returned - email is available
      return { available: true, message: 'Email is available' };
    }

    if (error) {
      console.error('Error checking email availability:', error);
      return { available: false, message: 'Error checking email availability' };
    }

    // Email exists
    return { available: false, message: 'Email is already taken' };
  } catch (error) {
    console.error('Unexpected error checking email:', error);
    return { available: false, message: 'Error checking email availability' };
  }
}

/**
 * Check if a username is already taken
 * @param username The username to check
 * @returns Object with availability status
 */
export async function checkUsernameAvailability(username: string) {
  try {
    if (!username || username.trim() === '') {
      return { available: false, message: 'Username is required' };
    }

    // Username validation rules
    if (username.length < 3) {
      return { available: false, message: 'Username must be at least 3 characters' };
    }

    if (username.length > 20) {
      return { available: false, message: 'Username must be less than 20 characters' };
    }

    // Only allow alphanumeric characters and underscores
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(username)) {
      return { available: false, message: 'Username can only contain letters, numbers, and underscores' };
    }

    const { data, error } = await supabase
      .from('users')
      .select('username')
      .eq('username', username.toLowerCase())
      .single();

    if (error && error.code === 'PGRST116') {
      // No rows returned - username is available
      return { available: true, message: 'Username is available' };
    }

    if (error) {
      console.error('Error checking username availability:', error);
      return { available: false, message: 'Error checking username availability' };
    }

    // Username exists
    return { available: false, message: 'Username is already taken' };
  } catch (error) {
    console.error('Unexpected error checking username:', error);
    return { available: false, message: 'Error checking username availability' };
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
      checkUsernameAvailability(username)
    ]);

    return {
      email: emailResult,
      username: usernameResult,
      bothAvailable: emailResult.available && usernameResult.available
    };
  } catch (error) {
    console.error('Error checking availability:', error);
    return {
      email: { available: false, message: 'Error checking email' },
      username: { available: false, message: 'Error checking username' },
      bothAvailable: false
    };
  }
}
