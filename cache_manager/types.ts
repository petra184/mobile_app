export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      game_schedule: {
        Row: {
          date: string
          final_guest_score: string | null
          final_home_score: number | null
          game_id: string
          game_notes: string | null
          game_time: string | null
          game_type: string | null
          halftime_activity: string | null
          last_updated: string | null
          location: string | null
          opponent_id: string | null
          photo_url: string | null
          points: number | null
          school_id: string | null
          season_type: string | null
          special_events: string | null
          sport_id: string | null
          status: string | null
        }
        Insert: {
          date: string
          final_guest_score?: string | null
          final_home_score?: number | null
          game_id?: string
          game_notes?: string | null
          game_time?: string | null
          game_type?: string | null
          halftime_activity?: string | null
          last_updated?: string | null
          location?: string | null
          opponent_id?: string | null
          photo_url?: string | null
          points?: number | null
          school_id?: string | null
          season_type?: string | null
          special_events?: string | null
          sport_id?: string | null
          status?: string | null
        }
        Update: {
          date?: string
          final_guest_score?: string | null
          final_home_score?: number | null
          game_id?: string
          game_notes?: string | null
          game_time?: string | null
          game_type?: string | null
          halftime_activity?: string | null
          last_updated?: string | null
          location?: string | null
          opponent_id?: string | null
          photo_url?: string | null
          points?: number | null
          school_id?: string | null
          season_type?: string | null
          special_events?: string | null
          sport_id?: string | null
          status?: string | null
        }
      }
      teams: {
        Row: {
          about_team: Json | null
          color: string | null
          facebook: string | null
          gender: string
          id: string
          image_fit: string | null
          image_position: string | null
          image_scale: number | null
          instagram: string | null
          last_updated: string | null
          name: string
          photo: string | null
          short_name: string
          sport: string
          twitter: string | null
          website: string | null
        }
        Insert: {
          about_team?: Json | null
          color?: string | null
          facebook?: string | null
          gender: string
          id?: string
          image_fit?: string | null
          image_position?: string | null
          image_scale?: number | null
          instagram?: string | null
          last_updated?: string | null
          name: string
          photo?: string | null
          short_name: string
          sport: string
          twitter?: string | null
          website?: string | null
        }
        Update: {
          about_team?: Json | null
          color?: string | null
          facebook?: string | null
          gender?: string
          id?: string
          image_fit?: string | null
          image_position?: string | null
          image_scale?: number | null
          instagram?: string | null
          last_updated?: string | null
          name?: string
          photo?: string | null
          short_name?: string
          sport?: string
          twitter?: string | null
          website?: string | null
        }
      }
      stories: {
        Row: {
          author: string | null
          content: string | null
          created_at: string
          game_id: string | null
          headline: string | null
          id: string
          image_fit: string | null
          image_position: string | null
          image_scale: string | null
          image_url: string | null
          last_updated: string | null
          scheduled_publish_date: string | null
          status: string | null
          tag: string | null
          team_id: string | null
          title: string | null
        }
        Insert: {
          author?: string | null
          content?: string | null
          created_at?: string
          game_id?: string | null
          headline?: string | null
          id?: string
          image_fit?: string | null
          image_position?: string | null
          image_scale?: string | null
          image_url?: string | null
          last_updated?: string | null
          scheduled_publish_date?: string | null
          status?: string | null
          tag?: string | null
          team_id?: string | null
          title?: string | null
        }
        Update: {
          author?: string | null
          content?: string | null
          created_at?: string
          game_id?: string | null
          headline?: string | null
          id?: string
          image_fit?: string | null
          image_position?: string | null
          image_scale?: string | null
          image_url?: string | null
          last_updated?: string | null
          scheduled_publish_date?: string | null
          status?: string | null
          tag?: string | null
          team_id?: string | null
          title?: string | null
        }
      }
      rewards: {
        Row: {
          created_at: string | null
          description: string
          id: string
          image_url: string | null
          is_active: boolean | null
          is_scheduled: boolean | null
          is_sold: boolean | null
          points_required: number
          published_at: string | null
          scheduled_publish_date: string | null
          sold_at: string | null
          stock_quantity: number
          team_id: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description: string
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_scheduled?: boolean | null
          is_sold?: boolean | null
          points_required: number
          published_at?: string | null
          scheduled_publish_date?: string | null
          sold_at?: string | null
          stock_quantity?: number
          team_id?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_scheduled?: boolean | null
          is_sold?: boolean | null
          points_required?: number
          published_at?: string | null
          scheduled_publish_date?: string | null
          sold_at?: string | null
          stock_quantity?: number
          team_id?: string | null
          title?: string
          updated_at?: string | null
        }
      }
    }
    Views: {
      mobile_cache_status: {
        Row: {
          last_updated: string | null
          record_count: number | null
          table_name: string | null
        }
      }
    }
    Functions: {
      get_latest_updates: {
        Args: { data_types?: string[] }
        Returns: {
          data_type: string
          latest_update: string
          record_count: number
        }[]
      }
      is_cache_stale: {
        Args: {
          last_sync_timestamp: string
          team_ids?: string[]
        }
        Returns: boolean
      }
    }
  }
}
