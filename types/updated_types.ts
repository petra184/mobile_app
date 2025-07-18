export type { Database } from './database';
export type { Tables, TablesInsert, TablesUpdate } from './database';
import type { Database } from './database';


export type User = Database['public']['Tables']['users']['Row'];

//GAME TYPES
//export type Game = Database['public']['Tables']['game_schedule']['Row'];
export type GameScheduleRow = Database["public"]["Tables"]["game_schedule"]["Row"]
export type OpposingTeamRow = Database["public"]["Tables"]["opposing_teams"]["Row"]

export type GameStatus = string // Will accept any string from database
export interface GameScore {
  home: number
  away: number
}

export interface GameFilterOptions {
  status?: "upcoming" | "past" | "live" | "all"
  location?: "home" | "away" | "neutral"
  teamId?: string
  sport?: string // <-- ADDED
}

export interface GameLocation {
  name: string | null
  type: string | null
}

export interface Game {
  id: string
  date: string // text in DB
  time: string | null // corresponds to game_time
  status: GameStatus // Now just a simple string
  photo_url?: string | null
  location: string
  game_type: string
  homeTeam: Team // assumes resolved via school_id
  awayTeam: Team // assumes resolved via opponent_id
  score?: GameScore
  sport?: {
    name: string
    display_name?: string
  }
  attendance?: number | null
  special_events?: string | null
  halftime_activity?: string | null // corresponds to game_halftime_activities
  seasonType?: string | null
  points?: number | null
  type?: string | null // corresponds to game_type
  game_notes?: string | null // corresponds to game_notes
  lastUpdated?: string // timestamp with timezone
}

//TEAM TYPES
export type TeamsRow = Database["public"]["Tables"]["teams"]["Row"]
export type PlayersRow = Database["public"]["Tables"]["players"]["Row"]
export type CoachesRow = Database["public"]["Tables"]["coaches"]["Row"]

export interface Team {
  id: string
  name: string
  shortName: string
  primaryColor: string
  logo: string,
  sport: string
  gender: string
  about_team?: string;
  socialMedia?: {
    website?: string
    facebook?: string
    instagram?: string
    twitter?: string
  }
}

// Player interface for UI
export interface Player {
  id: string
  first_name: string | null
  last_name: string | null
  middle_name: string | null
  jersey_number: string | null
  position: string | null
  height: string | null
  school_year: string | null
  home_country: string | null
  photo: string | null
  bio: string | null
  birthday: string | null
  age: string | null
  previous_school: string | null
  twitter: string | null
  instagram: string | null
  facebook: string | null
  team_id: string
}


// Coach interface for UI
export interface Coach {
  id: string
  first_name: string | null
  last_name: string | null
  middle_name: string | null
  title: string | null
  bio: string | null
  image: string | null
  age: number | null
  birthdate: string | null
  origin: string | null
  education: string | null
  achievements: string | null
  coaching_experience: string | null
  coaching_year: string | null
  twitter: string | null
  instagram: string | null
  facebook: string | null
  team_id: string
}



//NEWS TYPES
export type StoriesRow = Database["public"]["Tables"]["stories"]["Row"]

// App-specific interfaces
export interface NewsArticle {
  id: string
  title: string
  headline: string
  content: string
  author: string
  imageUrl: string | null
  createdAt: string
  publishDate: string | null
  status: string
  tag: string | null
  teamId: string | null
  team?: {
    id: string
    name: string
    sport: string
    gender: string
    photo: string | null
  }
}



//POINTS TYPES
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
  expirty_date?: string | null
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

export interface RewardCardData {
  id: string
  title: string
  description?: string
  points_required: number
  category?: string
  image_url?: string
  stock_quantity?: number
  is_sold?: boolean
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
  category?: string | null | undefined
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


//QR CODE
export interface QRCodeData {
  id: string
  user_id: string
  game_id: string
  qr_code_data: string
  created_at: string
  is_used: boolean
  scanned_at?: string | null
  points_awarded?: number | null
}

export interface QRCodeScan {
  id: string
  points: number
  description: string
  scannedAt: string
}

export interface ScannedUser {
  user_id: string
  first_name: string
  last_name: string | null
  email: string
  points: number | null
}

export interface QRCodeScanData {
  id: string
  user_id: string
  game_id: string
  qr_code_data: string
  is_used: boolean
  users: ScannedUser
}

export interface ScanHistoryItem {
  id: string
  user_id: string
  game_id: string
  points_awarded: number
  scanned_at: string
  users: {
    first_name: string
    last_name: string | null
    email: string
  }
}

//USER TYPES
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

export interface LeaderboardEntry {
  user_id: string
  email: string
  points: number
  total_scans: number
  rank: number
}


//BIRTHDAY TYPES

export interface BirthdayPackage {
  id: string
  name: string
  description: string | null
  price: number
  points: number // This will map to max_guests for compatibility
  features: any[] // Will be parsed from jsonb
  is_featured: boolean
  is_limited_time: boolean
  is_active: boolean
  is_scheduled: boolean
  scheduled_publish_date: string | null
  published_at: string | null
  image: string | null // mapped from image_url
  image_url: string | null
  team_id: string
  bookings_count: number
  created_at: string
  updated_at: string
  image_filename: string | null
  image_size: number | null
  image_type: string | null
  max_guests: number | null
}

export interface BirthdayPackageFilters {
  team_id?: string
  is_active?: boolean
  is_featured?: boolean
  is_limited_time?: boolean
}

//SCHOOL TYPES
export interface SchoolInfo {
  id: string
  name: string
  shortName: string | null
  logo: string | null
  primaryColor: string | null
  contactEmail: string | null
  contactPhone: string | null
}
export type School = Database["public"]["Tables"]["SCHOOLS"]["Row"]
export type SchoolInsert = Database["public"]["Tables"]["SCHOOLS"]["Insert"]
export type SchoolUpdate = Database["public"]["Tables"]["SCHOOLS"]["Update"]
