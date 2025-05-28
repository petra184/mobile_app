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
  location: string;
  locationType: string;
  homeTeam: Team;
  awayTeam: Team;
  score?: GameScore;
  sport?: {
    name: string;
    display_name?: string;
  };
  attendance?: number;
  seasonType?: string;
  points?: number;
}

export type GameScheduleRow = Database['public']['Tables']['game_schedule']['Row'];
export type OpposingTeamRow = Database['public']['Tables']['opposing_teams']['Row'];