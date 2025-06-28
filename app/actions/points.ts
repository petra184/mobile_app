import { supabase } from '@/lib/supabase';

export type UserStatus = {
  id: string
  user_id: string | null
  level_number: number | null
  membership_tier: string | null
  current_streak: number | null
  total_scans: number | null
  total_lifetime_points: number | null
  last_activity_date: string | null
  achievements: string[] | null
  created_at: string | null
  updated_at: string | null
}

export type UserStatusWithLevel = UserStatus & {
  current_points: number
  first_name: string
  email: string
  level_name: string
  badge_icon: string
  badge_color: string
  benefits: string[]
  level_threshold: number
  points_required_for_next: number | null
  points_to_next_level: number
  level_progress_percentage: number
}

export type Reward = {
  id: string
  title: string
  description: string
  points_required: number
  category?: string | null
  is_sold?: boolean | null
  stock_quantity?: number | null | undefined
  created_at: string
  updated_at: string
  popularity_score?: number | null
  image_url?: string | null
}

export type SpecialOffer = {
  id: string
  title: string
  description: string
  points_required: number
  original_points?: number | null
  start_date: string
  end_date: string
  is_active: boolean
  limited_quantity?: number | null
  claimed_count?: number | null
  category?: string | null
  image_url?: string | null
}

export type ScanHistory = {
  id: string
  user_id: string
  points: number
  description: string
  scanned_at: string
  created_at: string
}

export type Achievement = {
  id: string
  name: string
  description: string
  icon: string | null
  category: string | null
  points_reward: number | null
  requirement_type: string
  requirement_value: number | null
}

export type UserAchievement = {
  id: string
  user_id: string | null
  achievement_name: string
  achievement_description: string | null
  points_earned: number | null
  earned_at: string | null
  created_at: string | null
}

export type PointsLevel = {
  id: number
  level_number: number
  level_name: string
  points_threshold: number
  points_required_for_next: number | null
  badge_icon: string | null
  badge_color: string | null
  benefits: string[] | null
}

export type LeaderboardUser = {
  user_id: string
  first_name: string
  email: string
  points: number
  total_scans: number
  current_streak: number
  level_number: number
  level_name: string
  badge_icon: string
  badge_color: string
  rank: number
}

// Fetch user status with level information
export async function fetchUserStatus(userId: string): Promise<UserStatusWithLevel | null> {
  

  const { data, error } = await supabase.from("user_status_with_levels").select("*").eq("user_id", userId).single()

  if (error) {
    console.error("Error fetching user status:", error)
    return null
  }

  return data as UserStatusWithLevel
}

// Fetch rewards
export async function fetchRewards(): Promise<Reward[]> {
  

  const { data, error } = await supabase
    .from("rewards")
    .select("*")
    .eq("is_active", true)
    .order("points_required", { ascending: true })

  if (error) {
    console.error("Error fetching rewards:", error)
    return []
  }

  return data as Reward[]
}

// Fetch special offers
export async function fetchSpecialOffers(): Promise<SpecialOffer[]> {
  
  const now = new Date().toISOString()

  const { data, error } = await supabase
    .from("special_offers")
    .select("*")
    .eq("is_active", true)
    .order("points_required", { ascending: true })

  if (error) {
    return []
  }
  return data as SpecialOffer[]
}

// Fetch scan history
export async function fetchScanHistory(userId: string, limit = 10, offset = 0): Promise<ScanHistory[]> {
  

  const { data, error } = await supabase.rpc("get_user_scan_history", {
    p_user_id: userId,
    p_limit: limit,
    p_offset: offset,
  })

  if (error) {
    console.error("Error fetching scan history:", error)
    return []
  }

  return data as ScanHistory[]
}

// Redeem a reward
export async function redeemReward(userId: string, rewardId: string, pointsRequired: number): Promise<boolean> {
  

  // Get the reward details
  const { data: reward, error: rewardError } = await supabase
    .from("rewards")
    .select("title")
    .eq("id", rewardId)
    .single()

  if (rewardError || !reward) {
    console.error("Error fetching reward:", rewardError)
    return false
  }

  // Start a transaction to update points and create redemption record
  const { data, error } = await supabase.rpc("add_user_points", {
    p_user_id: userId,
    p_points: -pointsRequired,
    p_transaction_type: "redeemed",
    p_source_type: "reward_redemption",
    p_source_id: rewardId,
    p_description: `Redeemed: ${reward.title}`,
  })

  if (error) {
    console.error("Error redeeming reward:", error)
    return false
  }

  // Create redemption record
  const { error: redemptionError } = await supabase.from("user_redemptions").insert({
    user_id: userId,
    reward_id: rewardId,
    reward_title: reward.title,
    points_used: pointsRequired,
    redeemed_at: new Date().toISOString(),
    status: "completed",
  })

  if (redemptionError) {
    console.error("Error creating redemption record:", redemptionError)
    // Points were already deducted, so we still return true
  }

  return true
}

// Fetch user achievements
export async function fetchUserAchievements(userId: string): Promise<UserAchievement[]> {
  

  const { data, error } = await supabase
    .from("user_achievements")
    .select("*")
    .eq("user_id", userId)
    .order("earned_at", { ascending: false })

  if (error) {
    console.error("Error fetching user achievements:", error)
    return []
  }

  return data as UserAchievement[]
}

// Fetch all achievement definitions
export async function fetchAchievementDefinitions(): Promise<Achievement[]> {
  

  const { data, error } = await supabase.from("achievement_definitions").select("*").eq("is_active", true)

  if (error) {
    console.error("Error fetching achievement definitions:", error)
    return []
  }

  return data as Achievement[]
}

// Fetch points levels
export async function fetchPointsLevels(): Promise<PointsLevel[]> {
  

  const { data, error } = await supabase.from("points_levels").select("*").order("level_number", { ascending: true })

  if (error) {
    console.error("Error fetching points levels:", error)
    return []
  }

  return data as PointsLevel[]
}

// Get user level progress
export async function getUserLevelProgress(points: number): Promise<any> {
  

  const { data, error } = await supabase.rpc("get_level_progress", { user_points: points })

  if (error) {
    console.error("Error getting level progress:", error)
    return null
  }

  return data[0]
}

// Fetch leaderboard
export async function fetchLeaderboard(limit = 50): Promise<LeaderboardUser[]> {
  

  const { data, error } = await supabase.rpc("get_enhanced_user_leaderboard", { limit_count: limit })

  if (error) {
    console.error("Error fetching leaderboard:", error)
    return []
  }

  return data as LeaderboardUser[]
}

// Check for new achievements
export async function checkUserAchievements(userId: string): Promise<any[]> {
  

  const { data, error } = await supabase.rpc("check_user_achievements", { p_user_id: userId })

  if (error) {
    console.error("Error checking achievements:", error)
    return []
  }

  return data || []
}
