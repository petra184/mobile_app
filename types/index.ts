// Re-export Supabase types for easier imports
export type { Database } from './supabase';
export type { Tables, TablesInsert, TablesUpdate } from './supabase';

// Extract commonly used types
import type { Database } from './supabase';

export type User = Database['public']['Tables']['users']['Row'];
export type Team = Database['public']['Tables']['teams']['Row'];
export type ScanHistory = Database['public']['Tables']['scan_history']['Row'];
export type UserPreferencesDb = Database['public']['Tables']['user_preferences']['Row'];
export type Reward = Database['public']['Tables']['rewards']['Row'];

// Your app-specific types
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

// Transform types for your UI components
export interface TeamForUI {
  id: string;
  name: string;
  shortName: string;
  primaryColor: string;
  logo: string | null;
}

// Transform database team to UI team
export function transformTeamForUI(dbTeam: Team): TeamForUI {
  return {
    ...dbTeam,
    id: dbTeam.id,
    name: dbTeam.name,
    shortName: dbTeam.short_name,
    primaryColor: dbTeam.color || '#000000',
    logo: dbTeam.photo || null || "https://upload.wikimedia.org/wikipedia/commons/thumb/0/06/Manhattan_Jaspers_logo.svg/1200px-Manhattan_Jaspers_logo.svg.png",
  };
}