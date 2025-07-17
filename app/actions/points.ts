import { supabase } from '@/lib/supabase';
import type { UserStatusWithLevel, Reward, SpecialOffer, ScanHistory, Achievement, UserAchievement, PointsLevel, LeaderboardUser } from "@/types/updated_types";

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
