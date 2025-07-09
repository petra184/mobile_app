import type { Database } from "./supabase"
import type { Team } from "@/app/actions/teams"

// SIMPLIFIED: Just use string for status - no complex types needed
export type GameStatus = string // Will accept any string from database

export interface GameScore {
  home: number
  away: number
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
  seasonType?: string | null
  points?: number | null
  type?: string | null // corresponds to game_type
  notes?: string | null // corresponds to game_notes
  lastUpdated?: string // timestamp with timezone
}

export type GameScheduleRow = Database["public"]["Tables"]["game_schedule"]["Row"]
export type OpposingTeamRow = Database["public"]["Tables"]["opposing_teams"]["Row"]
