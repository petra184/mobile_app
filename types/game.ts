import type { Database } from './supabase';
import type { Team } from '@/app/actions/teams';

export type GameStatus = 'scheduled' | 'live' | 'completed' | 'postponed' | 'canceled';

export interface GameScore {
  home: number;
  away: number;
}

export interface GameLocation {
  name: string;
  type: string;
}

export interface Game {
  id: string;
  date: string;
  time: string;
  status: GameStatus;
  photo_url?: string | null;
  location: string;
  location_type: string;
  homeTeam: Team;
  awayTeam: Team;
  score?: GameScore;
  sport?: {
    name: string;
    display_name?: string;
  };
  attendance?: number;
  special_events?: string | null
  seasonType?: string | null;
  points?: number;
}

export type GameScheduleRow = Database['public']['Tables']['game_schedule']['Row'];
export type OpposingTeamRow = Database['public']['Tables']['opposing_teams']['Row'];