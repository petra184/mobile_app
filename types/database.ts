export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          operationName?: string
          query?: string
          variables?: Json
          extensions?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      achievement_definitions: {
        Row: {
          category: string | null
          created_at: string | null
          description: string
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          points_reward: number | null
          requirement_type: string
          requirement_value: number | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description: string
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          points_reward?: number | null
          requirement_type: string
          requirement_value?: number | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          points_reward?: number | null
          requirement_type?: string
          requirement_value?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      activity_games: {
        Row: {
          activity_id: string | null
          created_at: string | null
          game_id: string | null
          id: string
        }
        Insert: {
          activity_id?: string | null
          created_at?: string | null
          game_id?: string | null
          id?: string
        }
        Update: {
          activity_id?: string | null
          created_at?: string | null
          game_id?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_games_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "halftime_activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_games_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "game_schedule"
            referencedColumns: ["game_id"]
          },
        ]
      }
      activity_history: {
        Row: {
          attendance_id: string
          game_id: string | null
          points_earned: number | null
          user_id: string
        }
        Insert: {
          attendance_id?: string
          game_id?: string | null
          points_earned?: number | null
          user_id?: string
        }
        Update: {
          attendance_id?: string
          game_id?: string | null
          points_earned?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_history_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "game_schedule"
            referencedColumns: ["game_id"]
          },
          {
            foreignKeyName: "activity_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles_with_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "activity_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      admin_requests: {
        Row: {
          created_at: string | null
          email: string
          first_name: string
          id: string
          last_name: string
          notes: string | null
          processed_at: string | null
          processed_by: string | null
          requested_role: string | null
          school_name: string
          status: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          first_name: string
          id?: string
          last_name: string
          notes?: string | null
          processed_at?: string | null
          processed_by?: string | null
          requested_role?: string | null
          school_name: string
          status?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          notes?: string | null
          processed_at?: string | null
          processed_by?: string | null
          requested_role?: string | null
          school_name?: string
          status?: string | null
        }
        Relationships: []
      }
      ADMINS: {
        Row: {
          email: string | null
          first_name: string | null
          id: string
          last_name: string | null
          name: string
          role: string | null
          school: string | null
        }
        Insert: {
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          name: string
          role?: string | null
          school?: string | null
        }
        Update: {
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          name?: string
          role?: string | null
          school?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ADMINS_school_fkey"
            columns: ["school"]
            isOneToOne: false
            referencedRelation: "SCHOOLS"
            referencedColumns: ["school_id"]
          },
        ]
      }
      birthday_faqs: {
        Row: {
          created_at: string | null
          faq_response: string
          faq_title: string
          id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          faq_response: string
          faq_title: string
          id?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          faq_response?: string
          faq_title?: string
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      birthday_packages: {
        Row: {
          bookings_count: number | null
          created_at: string | null
          description: string | null
          features: Json | null
          id: string
          image_filename: string | null
          image_size: number | null
          image_type: string | null
          image_url: string | null
          is_active: boolean | null
          is_featured: boolean | null
          is_limited_time: boolean | null
          is_scheduled: boolean | null
          limited_time_end: string | null
          limited_time_start: string | null
          max_guests: number | null
          name: string
          points: number
          price: number
          published_at: string | null
          scheduled_publish_date: string | null
          team_id: string
          updated_at: string | null
        }
        Insert: {
          bookings_count?: number | null
          created_at?: string | null
          description?: string | null
          features?: Json | null
          id?: string
          image_filename?: string | null
          image_size?: number | null
          image_type?: string | null
          image_url?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          is_limited_time?: boolean | null
          is_scheduled?: boolean | null
          limited_time_end?: string | null
          limited_time_start?: string | null
          max_guests?: number | null
          name: string
          points: number
          price: number
          published_at?: string | null
          scheduled_publish_date?: string | null
          team_id: string
          updated_at?: string | null
        }
        Update: {
          bookings_count?: number | null
          created_at?: string | null
          description?: string | null
          features?: Json | null
          id?: string
          image_filename?: string | null
          image_size?: number | null
          image_type?: string | null
          image_url?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          is_limited_time?: boolean | null
          is_scheduled?: boolean | null
          limited_time_end?: string | null
          limited_time_start?: string | null
          max_guests?: number | null
          name?: string
          points?: number
          price?: number
          published_at?: string | null
          scheduled_publish_date?: string | null
          team_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "birthday_packages_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      birthday_requests: {
        Row: {
          admin_notes: string | null
          admin_responded: boolean | null
          customer_email: string
          customer_name: string
          customer_phone: string
          event_date: string
          event_time: string
          id: string
          number_of_guests: number
          package_id: string | null
          package_name: string
          package_price: number
          school_id: string | null
          special_requests: string | null
          status: string
          submitted_at: string
          updated_at: string | null
        }
        Insert: {
          admin_notes?: string | null
          admin_responded?: boolean | null
          customer_email: string
          customer_name: string
          customer_phone: string
          event_date: string
          event_time: string
          id?: string
          number_of_guests: number
          package_id?: string | null
          package_name: string
          package_price: number
          school_id?: string | null
          special_requests?: string | null
          status?: string
          submitted_at?: string
          updated_at?: string | null
        }
        Update: {
          admin_notes?: string | null
          admin_responded?: boolean | null
          customer_email?: string
          customer_name?: string
          customer_phone?: string
          event_date?: string
          event_time?: string
          id?: string
          number_of_guests?: number
          package_id?: string | null
          package_name?: string
          package_price?: number
          school_id?: string | null
          special_requests?: string | null
          status?: string
          submitted_at?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "birthday_requests_school_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "SCHOOLS"
            referencedColumns: ["school_id"]
          },
        ]
      }
      coaches: {
        Row: {
          achievements: string | null
          age: number | null
          bio: string | null
          birthdate: string | null
          coaching_experience: string | null
          coaching_year: string | null
          education: string | null
          facebook: string | null
          first_name: string | null
          id: string
          image: string | null
          image_fit: string | null
          image_position: string | null
          image_scale: number | null
          instagram: string | null
          last_name: string | null
          last_updated: string | null
          middle_name: string | null
          origin: string | null
          team_id: string
          title: string | null
          twitter: string | null
        }
        Insert: {
          achievements?: string | null
          age?: number | null
          bio?: string | null
          birthdate?: string | null
          coaching_experience?: string | null
          coaching_year?: string | null
          education?: string | null
          facebook?: string | null
          first_name?: string | null
          id?: string
          image?: string | null
          image_fit?: string | null
          image_position?: string | null
          image_scale?: number | null
          instagram?: string | null
          last_name?: string | null
          last_updated?: string | null
          middle_name?: string | null
          origin?: string | null
          team_id?: string
          title?: string | null
          twitter?: string | null
        }
        Update: {
          achievements?: string | null
          age?: number | null
          bio?: string | null
          birthdate?: string | null
          coaching_experience?: string | null
          coaching_year?: string | null
          education?: string | null
          facebook?: string | null
          first_name?: string | null
          id?: string
          image?: string | null
          image_fit?: string | null
          image_position?: string | null
          image_scale?: number | null
          instagram?: string | null
          last_name?: string | null
          last_updated?: string | null
          middle_name?: string | null
          origin?: string | null
          team_id?: string
          title?: string | null
          twitter?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coaches_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
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
        Relationships: [
          {
            foreignKeyName: "game_schedule_opponent_id_fkey"
            columns: ["opponent_id"]
            isOneToOne: false
            referencedRelation: "opposing_teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_schedule_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "SCHOOLS"
            referencedColumns: ["school_id"]
          },
          {
            foreignKeyName: "game_schedule_sport_id_fkey"
            columns: ["sport_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      halftime_activities: {
        Row: {
          created_at: string | null
          description: string
          id: string
          image_url: string | null
          is_active: boolean | null
          is_scheduled: boolean | null
          name: string
          participation_mode: string | null
          points_value: number
          published_at: string | null
          scheduled_publish_date: string | null
          team_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description: string
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_scheduled?: boolean | null
          name: string
          participation_mode?: string | null
          points_value: number
          published_at?: string | null
          scheduled_publish_date?: string | null
          team_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_scheduled?: boolean | null
          name?: string
          participation_mode?: string | null
          points_value?: number
          published_at?: string | null
          scheduled_publish_date?: string | null
          team_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "halftime_activities_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_requests: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          created_at: string | null
          description: string
          id: string
          notes: string | null
          priority: string
          request_type: string
          status: string
          submitted_by: string
          title: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string | null
          description: string
          id?: string
          notes?: string | null
          priority?: string
          request_type: string
          status?: string
          submitted_by: string
          title: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string | null
          description?: string
          id?: string
          notes?: string | null
          priority?: string
          request_type?: string
          status?: string
          submitted_by?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      opposing_teams: {
        Row: {
          id: string
          last_updated: string | null
          logo: string | null
          name: string
        }
        Insert: {
          id?: string
          last_updated?: string | null
          logo?: string | null
          name: string
        }
        Update: {
          id?: string
          last_updated?: string | null
          logo?: string | null
          name?: string
        }
        Relationships: []
      }
      players: {
        Row: {
          age: string | null
          bio: string | null
          birthday: string | null
          facebook: string | null
          first_name: string | null
          height: string | null
          home_country: string | null
          id: string
          image_fit: string | null
          image_position: string | null
          image_scale: number | null
          instagram: string | null
          jersey_number: string | null
          last_name: string | null
          last_updated: string | null
          middle_name: string | null
          photo: string | null
          position: string | null
          previous_school: string | null
          school_year: string | null
          team_id: string
          twitter: string | null
        }
        Insert: {
          age?: string | null
          bio?: string | null
          birthday?: string | null
          facebook?: string | null
          first_name?: string | null
          height?: string | null
          home_country?: string | null
          id?: string
          image_fit?: string | null
          image_position?: string | null
          image_scale?: number | null
          instagram?: string | null
          jersey_number?: string | null
          last_name?: string | null
          last_updated?: string | null
          middle_name?: string | null
          photo?: string | null
          position?: string | null
          previous_school?: string | null
          school_year?: string | null
          team_id?: string
          twitter?: string | null
        }
        Update: {
          age?: string | null
          bio?: string | null
          birthday?: string | null
          facebook?: string | null
          first_name?: string | null
          height?: string | null
          home_country?: string | null
          id?: string
          image_fit?: string | null
          image_position?: string | null
          image_scale?: number | null
          instagram?: string | null
          jersey_number?: string | null
          last_name?: string | null
          last_updated?: string | null
          middle_name?: string | null
          photo?: string | null
          position?: string | null
          previous_school?: string | null
          school_year?: string | null
          team_id?: string
          twitter?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "players_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      points_levels: {
        Row: {
          badge_color: string | null
          badge_icon: string | null
          benefits: string[] | null
          created_at: string | null
          id: number
          level_name: string
          level_number: number
          points_required_for_next: number | null
          points_threshold: number
          updated_at: string | null
        }
        Insert: {
          badge_color?: string | null
          badge_icon?: string | null
          benefits?: string[] | null
          created_at?: string | null
          id?: number
          level_name: string
          level_number: number
          points_required_for_next?: number | null
          points_threshold: number
          updated_at?: string | null
        }
        Update: {
          badge_color?: string | null
          badge_icon?: string | null
          benefits?: string[] | null
          created_at?: string | null
          id?: number
          level_name?: string
          level_number?: number
          points_required_for_next?: number | null
          points_threshold?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      points_transactions: {
        Row: {
          created_at: string | null
          description: string
          id: string
          points_change: number
          source_id: string | null
          source_type: string | null
          transaction_type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description: string
          id?: string
          points_change: number
          source_id?: string | null
          source_type?: string | null
          transaction_type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string
          id?: string
          points_change?: number
          source_id?: string | null
          source_type?: string | null
          transaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "points_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles_with_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "points_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      promotions: {
        Row: {
          created_at: string | null
          description: string | null
          discount_type: string
          discount_value: number
          display_on_homepage: boolean | null
          end_date: string
          id: string
          image_filename: string | null
          image_size: number | null
          image_type: string | null
          image_url: string | null
          is_active: boolean | null
          is_featured: boolean | null
          is_scheduled: boolean | null
          published_at: string | null
          scheduled_publish_date: string | null
          send_notification: boolean | null
          start_date: string
          team_id: string
          title: string
          updated_at: string | null
          usage_count: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          discount_type: string
          discount_value: number
          display_on_homepage?: boolean | null
          end_date: string
          id?: string
          image_filename?: string | null
          image_size?: number | null
          image_type?: string | null
          image_url?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          is_scheduled?: boolean | null
          published_at?: string | null
          scheduled_publish_date?: string | null
          send_notification?: boolean | null
          start_date: string
          team_id: string
          title: string
          updated_at?: string | null
          usage_count?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          discount_type?: string
          discount_value?: number
          display_on_homepage?: boolean | null
          end_date?: string
          id?: string
          image_filename?: string | null
          image_size?: number | null
          image_type?: string | null
          image_url?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          is_scheduled?: boolean | null
          published_at?: string | null
          scheduled_publish_date?: string | null
          send_notification?: boolean | null
          start_date?: string
          team_id?: string
          title?: string
          updated_at?: string | null
          usage_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "promotions_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_history: {
        Row: {
          id: string
          item_id: string
          item_title: string
          item_type: string
          points_used: number
          purchase_date: string | null
          quantity: number
          status: string
          transaction_id: string | null
          user_id: string
        }
        Insert: {
          id?: string
          item_id: string
          item_title: string
          item_type: string
          points_used: number
          purchase_date?: string | null
          quantity?: number
          status?: string
          transaction_id?: string | null
          user_id: string
        }
        Update: {
          id?: string
          item_id?: string
          item_title?: string
          item_type?: string
          points_used?: number
          purchase_date?: string | null
          quantity?: number
          status?: string
          transaction_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_history_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "reward_transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles_with_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "purchase_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      QR_CODES: {
        Row: {
          date: string | null
          game: string | null
          id: string
          team: string
        }
        Insert: {
          date?: string | null
          game?: string | null
          id?: string
          team: string
        }
        Update: {
          date?: string | null
          game?: string | null
          id?: string
          team?: string
        }
        Relationships: []
      }
      qr_codes_generated: {
        Row: {
          created_at: string | null
          game_id: string
          id: string
          is_used: boolean | null
          points_awarded: number | null
          qr_code_data: string
          scanned_at: string | null
          scanned_by: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          game_id: string
          id?: string
          is_used?: boolean | null
          points_awarded?: number | null
          qr_code_data: string
          scanned_at?: string | null
          scanned_by?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          game_id?: string
          id?: string
          is_used?: boolean | null
          points_awarded?: number | null
          qr_code_data?: string
          scanned_at?: string | null
          scanned_by?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "qr_codes_generated_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "game_schedule"
            referencedColumns: ["game_id"]
          },
          {
            foreignKeyName: "qr_codes_generated_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles_with_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "qr_codes_generated_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      reward_transactions: {
        Row: {
          confirmation_number: string | null
          created_at: string | null
          id: string
          items: Json
          pickup_status: string
          reward_ids: string[] | null
          status: string | null
          total_points_used: number
          transaction_subtype: string | null
          transaction_type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          confirmation_number?: string | null
          created_at?: string | null
          id?: string
          items: Json
          pickup_status?: string
          reward_ids?: string[] | null
          status?: string | null
          total_points_used: number
          transaction_subtype?: string | null
          transaction_type?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          confirmation_number?: string | null
          created_at?: string | null
          id?: string
          items?: Json
          pickup_status?: string
          reward_ids?: string[] | null
          status?: string | null
          total_points_used?: number
          transaction_subtype?: string | null
          transaction_type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_reward_transactions_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles_with_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "fk_reward_transactions_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      rewards: {
        Row: {
          category: string | null
          created_at: string | null
          description: string
          discount_percentage: number | null
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
          category?: string | null
          created_at?: string | null
          description: string
          discount_percentage?: number | null
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
          category?: string | null
          created_at?: string | null
          description?: string
          discount_percentage?: number | null
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
        Relationships: [
          {
            foreignKeyName: "rewards_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      scan_history: {
        Row: {
          created_at: string | null
          description: string
          id: string
          points: number
          scanned_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description: string
          id: string
          points: number
          scanned_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string
          id?: string
          points?: number
          scanned_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scan_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles_with_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "scan_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      SCHOOLS: {
        Row: {
          contact_email: string | null
          contact_phone: string | null
          last_updated: string | null
          primary_color: string | null
          school_id: string
          school_logo: string | null
          school_name: string
          school_short_name: string | null
        }
        Insert: {
          contact_email?: string | null
          contact_phone?: string | null
          last_updated?: string | null
          primary_color?: string | null
          school_id?: string
          school_logo?: string | null
          school_name: string
          school_short_name?: string | null
        }
        Update: {
          contact_email?: string | null
          contact_phone?: string | null
          last_updated?: string | null
          primary_color?: string | null
          school_id?: string
          school_logo?: string | null
          school_name?: string
          school_short_name?: string | null
        }
        Relationships: []
      }
      special_offers: {
        Row: {
          category: string | null
          claimed_count: number | null
          created_at: string | null
          description: string
          end_date: string
          id: string
          image_url: string | null
          is_active: boolean | null
          is_scheduled: boolean | null
          limited_quantity: number | null
          original_points: number | null
          points_required: number
          published_at: string | null
          scheduled_publish_date: string | null
          start_date: string
          team_id: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          claimed_count?: number | null
          created_at?: string | null
          description: string
          end_date: string
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_scheduled?: boolean | null
          limited_quantity?: number | null
          original_points?: number | null
          points_required: number
          published_at?: string | null
          scheduled_publish_date?: string | null
          start_date: string
          team_id?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          claimed_count?: number | null
          created_at?: string | null
          description?: string
          end_date?: string
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_scheduled?: boolean | null
          limited_quantity?: number | null
          original_points?: number | null
          points_required?: number
          published_at?: string | null
          scheduled_publish_date?: string | null
          start_date?: string
          team_id?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "special_offers_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      store_products: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          discount_percentage: number | null
          id: string
          image_filename: string | null
          image_size: number | null
          image_type: string | null
          image_url: string | null
          inventory: number
          is_active: boolean | null
          is_new: boolean | null
          is_scheduled: boolean | null
          name: string
          points: number | null
          price: number
          published_at: string | null
          sales_count: number | null
          scheduled_publish_date: string | null
          team_id: string
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          discount_percentage?: number | null
          id?: string
          image_filename?: string | null
          image_size?: number | null
          image_type?: string | null
          image_url?: string | null
          inventory?: number
          is_active?: boolean | null
          is_new?: boolean | null
          is_scheduled?: boolean | null
          name: string
          points?: number | null
          price: number
          published_at?: string | null
          sales_count?: number | null
          scheduled_publish_date?: string | null
          team_id: string
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          discount_percentage?: number | null
          id?: string
          image_filename?: string | null
          image_size?: number | null
          image_type?: string | null
          image_url?: string | null
          inventory?: number
          is_active?: boolean | null
          is_new?: boolean | null
          is_scheduled?: boolean | null
          name?: string
          points?: number | null
          price?: number
          published_at?: string | null
          sales_count?: number | null
          scheduled_publish_date?: string | null
          team_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "store_products_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "stories_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "game_schedule"
            referencedColumns: ["game_id"]
          },
          {
            foreignKeyName: "stories_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_photos: {
        Row: {
          caption: string | null
          created_at: string | null
          display_order: number | null
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          is_featured: boolean | null
          last_updated: string | null
          mime_type: string | null
          team_id: string
          updated_at: string | null
          uploaded_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          caption?: string | null
          created_at?: string | null
          display_order?: number | null
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          is_featured?: boolean | null
          last_updated?: string | null
          mime_type?: string | null
          team_id: string
          updated_at?: string | null
          uploaded_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          caption?: string | null
          created_at?: string | null
          display_order?: number | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          is_featured?: boolean | null
          last_updated?: string | null
          mime_type?: string | null
          team_id?: string
          updated_at?: string | null
          uploaded_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_photos_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_store: {
        Row: {
          id: string
          product_name: string
        }
        Insert: {
          id?: string
          product_name: string
        }
        Update: {
          id?: string
          product_name?: string
        }
        Relationships: []
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
        Relationships: []
      }
      transaction_items: {
        Row: {
          created_at: string | null
          id: string
          item_title: string
          item_type: string
          points_per_item: number
          quantity: number
          reward_id: string | null
          special_offer_id: string | null
          total_points: number
          transaction_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          item_title: string
          item_type: string
          points_per_item: number
          quantity?: number
          reward_id?: string | null
          special_offer_id?: string | null
          total_points: number
          transaction_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          item_title?: string
          item_type?: string
          points_per_item?: number
          quantity?: number
          reward_id?: string | null
          special_offer_id?: string | null
          total_points?: number
          transaction_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_transaction_items_reward_id"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "rewards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_transaction_items_special_offer_id"
            columns: ["special_offer_id"]
            isOneToOne: false
            referencedRelation: "special_offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_transaction_items_transaction_id"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "reward_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_achievements: {
        Row: {
          achievement_description: string | null
          achievement_name: string
          created_at: string | null
          earned_at: string | null
          id: string
          points_earned: number | null
          user_id: string | null
        }
        Insert: {
          achievement_description?: string | null
          achievement_name: string
          created_at?: string | null
          earned_at?: string | null
          id?: string
          points_earned?: number | null
          user_id?: string | null
        }
        Update: {
          achievement_description?: string | null
          achievement_name?: string
          created_at?: string | null
          earned_at?: string | null
          id?: string
          points_earned?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles_with_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_achievements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_level_history: {
        Row: {
          achieved_at: string | null
          id: string
          new_level: number
          old_level: number | null
          points_at_level_up: number
          user_id: string
        }
        Insert: {
          achieved_at?: string | null
          id?: string
          new_level: number
          old_level?: number | null
          points_at_level_up: number
          user_id: string
        }
        Update: {
          achieved_at?: string | null
          id?: string
          new_level?: number
          old_level?: number | null
          points_at_level_up?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_level_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles_with_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_level_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          created_at: string | null
          email_notifications: boolean | null
          favorite_teams: string[] | null
          game_notifications: boolean | null
          id: string
          news_notifications: boolean | null
          notifications_enabled: boolean | null
          push_notifications: boolean | null
          special_offers: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email_notifications?: boolean | null
          favorite_teams?: string[] | null
          game_notifications?: boolean | null
          id?: string
          news_notifications?: boolean | null
          notifications_enabled?: boolean | null
          push_notifications?: boolean | null
          special_offers?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email_notifications?: boolean | null
          favorite_teams?: string[] | null
          game_notifications?: boolean | null
          id?: string
          news_notifications?: boolean | null
          notifications_enabled?: boolean | null
          push_notifications?: boolean | null
          special_offers?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user_profiles_with_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_redemptions: {
        Row: {
          created_at: string | null
          id: string
          points_used: number
          redeemed_at: string | null
          reward_id: string | null
          reward_title: string
          status: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          points_used: number
          redeemed_at?: string | null
          reward_id?: string | null
          reward_title: string
          status?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          points_used?: number
          redeemed_at?: string | null
          reward_id?: string | null
          reward_title?: string
          status?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_redemptions_reward_id_fkey"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "rewards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_redemptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles_with_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_redemptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_redemptions_unified: {
        Row: {
          id: string
          item_title: string
          item_type: string
          points_used: number
          quantity: number
          redeemed_at: string | null
          reward_id: string | null
          special_offer_id: string | null
          status: string
          user_id: string
        }
        Insert: {
          id?: string
          item_title: string
          item_type: string
          points_used: number
          quantity?: number
          redeemed_at?: string | null
          reward_id?: string | null
          special_offer_id?: string | null
          status?: string
          user_id: string
        }
        Update: {
          id?: string
          item_title?: string
          item_type?: string
          points_used?: number
          quantity?: number
          redeemed_at?: string | null
          reward_id?: string | null
          special_offer_id?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_redemptions_unified_reward_id_fkey"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "rewards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_redemptions_unified_special_offer_id_fkey"
            columns: ["special_offer_id"]
            isOneToOne: false
            referencedRelation: "special_offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_redemptions_unified_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles_with_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_redemptions_unified_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_special_offer_redemptions: {
        Row: {
          id: string
          offer_title: string
          points_used: number
          quantity: number
          redeemed_at: string | null
          special_offer_id: string
          status: string
          user_id: string
        }
        Insert: {
          id?: string
          offer_title: string
          points_used: number
          quantity?: number
          redeemed_at?: string | null
          special_offer_id: string
          status?: string
          user_id: string
        }
        Update: {
          id?: string
          offer_title?: string
          points_used?: number
          quantity?: number
          redeemed_at?: string | null
          special_offer_id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_special_offer_redemptions_offer_id_fkey"
            columns: ["special_offer_id"]
            isOneToOne: false
            referencedRelation: "special_offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_special_offer_redemptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles_with_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_special_offer_redemptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_status: {
        Row: {
          achievements: string[] | null
          created_at: string | null
          current_streak: number | null
          id: string
          last_activity_date: string | null
          level_number: number | null
          membership_tier: string | null
          total_lifetime_points: number | null
          total_scans: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          achievements?: string[] | null
          created_at?: string | null
          current_streak?: number | null
          id?: string
          last_activity_date?: string | null
          level_number?: number | null
          membership_tier?: string | null
          total_lifetime_points?: number | null
          total_scans?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          achievements?: string[] | null
          created_at?: string | null
          current_streak?: number | null
          id?: string
          last_activity_date?: string | null
          level_number?: number | null
          membership_tier?: string | null
          total_lifetime_points?: number | null
          total_scans?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_status_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user_profiles_with_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_status_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      users: {
        Row: {
          birthday: string | null
          created_at: string | null
          email: string
          first_name: string
          last_name: string | null
          phone_number: string | null
          points: number | null
          profile_image_url: string | null
          school: string | null
          updated_at: string | null
          user_id: string
          username: string
        }
        Insert: {
          birthday?: string | null
          created_at?: string | null
          email: string
          first_name: string
          last_name?: string | null
          phone_number?: string | null
          points?: number | null
          profile_image_url?: string | null
          school?: string | null
          updated_at?: string | null
          user_id?: string
          username: string
        }
        Update: {
          birthday?: string | null
          created_at?: string | null
          email?: string
          first_name?: string
          last_name?: string | null
          phone_number?: string | null
          points?: number | null
          profile_image_url?: string | null
          school?: string | null
          updated_at?: string | null
          user_id?: string
          username?: string
        }
        Relationships: []
      }
    }
    Views: {
      mobile_cache_status: {
        Row: {
          last_updated: string | null
          record_count: number | null
          table_name: string | null
        }
        Relationships: []
      }
      user_profiles_with_stats: {
        Row: {
          achievements_count: number | null
          badge_color: string | null
          badge_icon: string | null
          benefits: string[] | null
          created_at: string | null
          current_streak: number | null
          email: string | null
          first_name: string | null
          last_name: string | null
          last_scan_date: string | null
          level_name: string | null
          level_number: number | null
          membership_tier: string | null
          points: number | null
          total_points_earned: number | null
          total_scans: number | null
          updated_at: string | null
          user_id: string | null
        }
        Relationships: []
      }
      user_status_with_levels: {
        Row: {
          achievements: string[] | null
          badge_color: string | null
          badge_icon: string | null
          benefits: string[] | null
          created_at: string | null
          current_points: number | null
          current_streak: number | null
          email: string | null
          first_name: string | null
          id: string | null
          last_activity_date: string | null
          level_name: string | null
          level_number: number | null
          level_progress_percentage: number | null
          level_threshold: number | null
          membership_tier: string | null
          points_required_for_next: number | null
          points_to_next_level: number | null
          total_lifetime_points: number | null
          total_scans: number | null
          updated_at: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_status_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user_profiles_with_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_status_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
    }
    Functions: {
      add_user_points: {
        Args: {
          p_user_id: string
          p_points: number
          p_transaction_type: string
          p_source_type: string
          p_source_id?: string
          p_description?: string
        }
        Returns: {
          new_total_points: number
          level_changed: boolean
          new_level: number
        }[]
      }
      check_user_achievements: {
        Args: { p_user_id: string }
        Returns: {
          achievement_id: string
          achievement_name: string
          points_awarded: number
        }[]
      }
      cleanup_orphaned_store_images: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      get_available_rewards: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          title: string
          description: string
          points_required: number
          category: string
          image_url: string
          stock_quantity: number
          is_sold: boolean
          created_at: string
        }[]
      }
      get_available_special_offers: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          title: string
          description: string
          points_required: number
          original_points: number
          category: string
          image_url: string
          limited_quantity: number
          claimed_count: number
          is_active: boolean
          expires_at: string
          created_at: string
        }[]
      }
      get_enhanced_user_leaderboard: {
        Args: { limit_count?: number }
        Returns: {
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
        }[]
      }
      get_latest_updates: {
        Args: { team_ids?: string[]; data_types?: string[] }
        Returns: {
          data_type: string
          latest_update: string
          record_count: number
        }[]
      }
      get_level_progress: {
        Args: { user_points: number }
        Returns: {
          current_level: number
          current_level_name: string
          next_level: number
          next_level_name: string
          points_in_current_level: number
          points_needed_for_next: number
          progress_percentage: number
        }[]
      }
      get_user_leaderboard: {
        Args: { limit_count?: number }
        Returns: {
          user_id: string
          email: string
          points: number
          total_scans: number
          rank: number
        }[]
      }
      get_user_level: {
        Args: { user_points: number }
        Returns: {
          level_number: number
          level_name: string
          points_threshold: number
          points_required_for_next: number
          badge_icon: string
          badge_color: string
          benefits: string[]
        }[]
      }
      get_user_purchase_history: {
        Args: { p_user_id: string }
        Returns: {
          id: string
          item_id: string
          item_title: string
          item_type: string
          points_used: number
          quantity: number
          purchase_date: string
          status: string
        }[]
      }
      get_user_scan_history: {
        Args: { p_user_id: string; p_limit?: number; p_offset?: number }
        Returns: {
          id: string
          points: number
          description: string
          scanned_at: string
        }[]
      }
      initialize_user_status: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      is_cache_stale: {
        Args: { last_sync_timestamp: string; team_ids?: string[] }
        Returns: boolean
      }
      mark_reward_as_purchased: {
        Args: { p_reward_id: string; p_quantity?: number }
        Returns: boolean
      }
      mark_special_offer_as_claimed: {
        Args: { p_offer_id: string; p_quantity?: number }
        Returns: boolean
      }
      record_purchase_history: {
        Args: {
          p_user_id: string
          p_item_id: string
          p_item_title: string
          p_item_type: string
          p_points_used: number
          p_quantity: number
          p_transaction_id: string
        }
        Returns: boolean
      }
      update_user_points: {
        Args: { p_user_id: string; points_change: number }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
