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
  firstName?: string
  lastName?: string
  middleName?: string
  jerseyNumber?: string
  position?: string
  height?: string
  age?: string
  photo?: string
  bio?: string
  schoolYear?: string
  homeCountry?: string
  previousSchool?: string
  socialMedia?: {
    facebook?: string
    instagram?: string
    twitter?: string
  }
}

// Coach interface for UI
export interface Coach {
  id: string
  firstName?: string
  lastName?: string
  middleName?: string
  title?: string
  bio?: string
  image?: string
  age?: number
  birthdate?: string
  origin?: string
  education?: string
  coachingExperience?: string
  coachingYear?: string
  achievements?: string
  socialMedia?: {
    facebook?: string
    instagram?: string
    twitter?: string
  }
}

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