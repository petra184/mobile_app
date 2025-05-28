import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/supabase'; // Import your generated types

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

// Your app-specific interfaces (can be different from DB types)
export interface UserProfile {
  id: string;
  email?: string;
  points: number;
  total_scans?: number;
  total_points_earned?: number;
  last_scan_date?: string;
  created_at: string;
  updated_at: string;
}

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

// Get user profile with stats - now fully typed
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('user_profiles_with_stats')
    .select('*')
    .eq('user_id', userId) // Fixed: using user_id instead of id
    .single();
    
  if (error) {
    console.error('Error fetching user profile:', error);
    throw new Error(`Failed to fetch user profile: ${error.message}`);
  }
  
  if (!data) return null;
  
  // Transform the database response to your app interface
  return {
    id: data.user_id || '',
    email: data.email || undefined,
    points: data.points || 0,
    total_scans: data.total_scans || 0,
    total_points_earned: data.total_points_earned || 0,
    last_scan_date: data.last_scan_date || undefined,
    created_at: data.created_at || '',
    updated_at: data.updated_at || '',
  };
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
  const { data, error } = await supabase
    .from('user_preferences')
    .select('favorite_teams, notifications_enabled')
    .eq('user_id', userId)
    .single();
    
  if (error && error.code !== 'PGRST116') { // Not found error
    console.error('Error fetching user preferences:', error);
    throw new Error(`Failed to fetch preferences: ${error.message}`);
  }
  
  if (!data) {
    // Return default preferences if none exist
    return {
      favoriteTeams: [],
      notificationsEnabled: true
    };
  }
  
  return {
    favoriteTeams: data.favorite_teams || [],
    notificationsEnabled: data.notifications_enabled ?? true
  };
}

// Update user preferences - now fully typed
export async function updateUserPreferences(
  userId: string, 
  preferences: UserPreferences
): Promise<void> {
  const updateData: UserPreferencesUpdate = {
    user_id: userId,
    favorite_teams: preferences.favoriteTeams,
    notifications_enabled: preferences.notificationsEnabled,
    updated_at: new Date().toISOString()
  };

  const { error } = await supabase
    .from('user_preferences')
    .upsert(updateData);
    
  if (error) {
    console.error('Error updating user preferences:', error);
    throw new Error(`Failed to update preferences: ${error.message}`);
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