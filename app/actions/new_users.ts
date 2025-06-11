// app/actions/users.ts - Updated with better integration

import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/supabase';

// Extract types from the generated Database type
type Tables = Database['public']['Tables'];
type Views = Database['public']['Views'];

// Database view types
type UserProfilesWithStatsRow = Views['user_profiles_with_stats']['Row'];

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