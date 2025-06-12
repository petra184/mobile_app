import { supabase } from "@/lib/supabase"
import type { Database } from '@/types/supabase';

// Extract types from the generated Database type
type Tables = Database['public']['Tables'];
type TeamsRow = Tables['teams']['Row'];
type PlayersRow = Tables['players']['Row'];
type CoachesRow = Tables['coaches']['Row'];

// App-specific interface for UI components (transformed from database)
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

// Transform database team to UI team
function transformTeamForUI(dbTeam: TeamsRow): Team {
  return {
    id: dbTeam.id,
    name: dbTeam.name,
    shortName: dbTeam.short_name,
    primaryColor: dbTeam.color || '#000000',
    logo: dbTeam.photo || `/placeholder.svg?height=64&width=64&text=${dbTeam.short_name}`,
    sport: dbTeam.sport,
    gender: dbTeam.gender,
    about_team: typeof dbTeam?.about_team === "string"
      ? dbTeam.about_team
      : JSON.stringify(dbTeam?.about_team),
    socialMedia: {
      website: dbTeam.website || undefined,
      facebook: dbTeam.facebook || undefined,
      instagram: dbTeam.instagram || undefined,
      twitter: dbTeam.twitter || undefined,
    }
  }
}

// Transform database player to UI player
function transformPlayerForUI(dbPlayer: PlayersRow): Player {
  return {
    id: dbPlayer.id,
    firstName: dbPlayer.first_name || undefined,
    lastName: dbPlayer.last_name || undefined,
    middleName: dbPlayer.middle_name || undefined,
    jerseyNumber: dbPlayer.jersey_number || undefined,
    position: dbPlayer.position || undefined,
    height: dbPlayer.height || undefined,
    age: dbPlayer.age || undefined,
    photo: dbPlayer.photo || undefined,
    bio: dbPlayer.bio || undefined,
    schoolYear: dbPlayer.school_year || undefined,
    homeCountry: dbPlayer.home_country || undefined,
    previousSchool: dbPlayer.previous_school || undefined,
    socialMedia: {
      facebook: dbPlayer.facebook || undefined,
      instagram: dbPlayer.instagram || undefined,
      twitter: dbPlayer.twitter || undefined,
    }
  }
}

// Transform database coach to UI coach
function transformCoachForUI(dbCoach: CoachesRow): Coach {
  return {
    id: dbCoach.id,
    firstName: dbCoach.first_name || undefined,
    lastName: dbCoach.last_name || undefined,
    middleName: dbCoach.middle_name || undefined,
    title: dbCoach.title || undefined,
    bio: dbCoach.bio || undefined,
    image: dbCoach.image || undefined,
    age: dbCoach.age || undefined,
    birthdate: dbCoach.birthdate || undefined,
    origin: dbCoach.origin || undefined,
    education: dbCoach.education || undefined,
    coachingExperience: dbCoach.coaching_experience || undefined,
    coachingYear: dbCoach.coaching_year || undefined,
    achievements: dbCoach.achievements || undefined,
    socialMedia: {
      facebook: dbCoach.facebook || undefined,
      instagram: dbCoach.instagram || undefined,
      twitter: dbCoach.twitter || undefined,
    }
  }
}

// Check if user is authenticated
async function checkAuth(): Promise<boolean> {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession()
  
  if (error) {
    console.error("Auth error:", error)
    return false
  }
  
  return !!session
}

// Get all teams with full type safety
export async function getTeams(): Promise<Team[]> {
  try {
    // Check authentication first
    const isAuthenticated = await checkAuth()
    if (!isAuthenticated) {
      console.warn("User not authenticated, returning empty teams array")
      return []
    }

    const { data, error } = await supabase
      .from("teams")
      .select('*') // Select all columns for full team data
      .order("name")

    if (error) {
      console.error("Error fetching teams:", error)
      throw new Error(`Failed to fetch teams: ${error.message}`)
    }

    if (!data) {
      return []
    }
    // Transform database data to UI format
    return data.map(transformTeamForUI)
  } catch (error) {
    console.error("Failed to fetch teams:", error)
    return []
  }
}

// Get teams by gender with full type safety
export async function getTeamsByGender(gender: "men" | "women"): Promise<Team[]> {
  try {
    // Check authentication first
    const isAuthenticated = await checkAuth()
    if (!isAuthenticated) {
      console.warn("User not authenticated, returning empty teams array")
      return []
    }

    // Convert the input to match database format
    const dbGender = gender === "men" ? "Men's" : "Women's"

    const { data, error } = await supabase
      .from("teams")
      .select('*')
      .eq('gender', dbGender) // Use the converted format
      .order("name")

    if (error) {
      console.error("Error fetching teams by gender:", error)
      throw new Error(`Failed to fetch teams by gender: ${error.message}`)
    }

    if (!data) {
      return []
    }

    return data.map(transformTeamForUI)
  } catch (error) {
    console.error("Failed to fetch teams by gender:", error)
    return []
  }
}

// Get teams by sport with full type safety
export async function getTeamsBySport(sport: string): Promise<Team[]> {
  try {
    const isAuthenticated = await checkAuth()
    if (!isAuthenticated) {
      console.warn("User not authenticated, returning empty teams array")
      return []
    }

    const { data, error } = await supabase
      .from("teams")
      .select('*')
      .eq('sport', sport)
      .order("name")

    if (error) {
      console.error("Error fetching teams by sport:", error)
      throw new Error(`Failed to fetch teams by sport: ${error.message}`)
    }

    return (data || []).map(transformTeamForUI)
  } catch (error) {
    console.error("Failed to fetch teams by sport:", error)
    return []
  }
}

// Get team by ID with full type safety
export async function getTeamById(id: string): Promise<Team | null> {
  try {
    // Check authentication first
    const isAuthenticated = await checkAuth()
    if (!isAuthenticated) {
      console.warn("User not authenticated, cannot fetch team")
      return null
    }

    const { data, error } = await supabase
      .from("teams")
      .select('*')
      .eq("id", id)
      .single()

    if (error) {
      console.error("Error fetching team by id:", error)
      throw new Error(`Failed to fetch team by id: ${error.message}`)
    }

    if (!data) {
      return null
    }

    
    console.log("team data:", data)

    return transformTeamForUI(data)
  } catch (error) {
    console.error("Failed to fetch team by id:", error)
    return null
  }
}

// Get teams without authentication (for public access)
export async function getTeamsPublic(): Promise<Team[]> {
  try {
    // This will work if your teams table allows public read access
    const { data, error } = await supabase
      .from("teams")
      .select('*')
      .order("name")

    if (error) {
      console.error("Error fetching public teams:", error)
      // If this fails, it means RLS is blocking public access
      throw new Error("Teams data requires authentication")
    }

    if (!data) {
      return []
    }

    return data.map(transformTeamForUI)
  } catch (error) {
    console.error("Failed to fetch public teams:", error)
    return []
  }
}

// Get team players with full type safety
export async function getTeamPlayers(teamId: string): Promise<Player[]> {
  try {
    const { data, error } = await supabase
      .from("players")
      .select("*")
      .eq("team_id", teamId)
      .order("jersey_number")

    if (error) {
      console.error("Error fetching players:", error)
      throw new Error(`Failed to fetch players: ${error.message}`)
    }

    return (data || []).map(transformPlayerForUI)
  } catch (error) {
    console.error("Error in getTeamPlayers:", error)
    return []
  }
}

// Get team coaches with full type safety
export async function getTeamCoaches(teamId: string): Promise<Coach[]> {
  try {
    const { data, error } = await supabase
      .from("coaches")
      .select("*")
      .eq("team_id", teamId)

    if (error) {
      console.error("Error fetching coaches:", error)
      throw new Error(`Failed to fetch coaches: ${error.message}`)
    }

    return (data || []).map(transformCoachForUI)
  } catch (error) {
    console.error("Error in getTeamCoaches:", error)
    return []
  }
}

// Get team with players and coaches (full team data)
export async function getFullTeamData(teamId: string): Promise<{
  team: Team | null;
  players: Player[];
  coaches: Coach[];
}> {
  try {
    const [team, players, coaches] = await Promise.all([
      getTeamById(teamId),
      getTeamPlayers(teamId),
      getTeamCoaches(teamId)
    ]);

    return {
      team,
      players,
      coaches
    };
  } catch (error) {
    console.error("Error fetching full team data:", error)
    return {
      team: null,
      players: [],
      coaches: []
    };
  }
}

// Search teams by name
export async function searchTeams(searchTerm: string): Promise<Team[]> {
  try {
    const isAuthenticated = await checkAuth()
    if (!isAuthenticated) {
      console.warn("User not authenticated, returning empty teams array")
      return []
    }

    const { data, error } = await supabase
      .from("teams")
      .select('*')
      .or(`name.ilike.%${searchTerm}%,short_name.ilike.%${searchTerm}%`)
      .order("name")

    if (error) {
      console.error("Error searching teams:", error)
      throw new Error(`Failed to search teams: ${error.message}`)
    }

    return (data || []).map(transformTeamForUI)
  } catch (error) {
    console.error("Failed to search teams:", error)
    return []
  }
}

// Get teams with game schedule
export async function getTeamsWithUpcomingGames(): Promise<Team[]> {
  try {
    const isAuthenticated = await checkAuth()
    if (!isAuthenticated) {
      return []
    }

    // Get teams that have upcoming games
    const { data, error } = await supabase
      .from("teams")
      .select(`
        *,
        game_schedule!sport_id (
          game_id,
          date,
          game_time,
          location
        )
      `)
      .gte('game_schedule.date', new Date().toISOString().split('T')[0])
      .order("name")

    if (error) {
      console.error("Error fetching teams with games:", error)
      throw new Error(`Failed to fetch teams with games: ${error.message}`)
    }

    return (data || []).map(transformTeamForUI)
  } catch (error) {
    console.error("Failed to fetch teams with games:", error)
    return []
  }
}

/**
 * Get a random team photo for a specific team
 * @param teamId The team ID to fetch a random photo for
 * @returns URL of a random team photo or null if not found
 */
export async function getRandomTeamPhoto(teamId: string): Promise<string | null> {
  try {
    console.log("Fetching photos for team ID:", teamId)

    const { data, error } = await supabase
      .from("team_photos")
      .select("file_path, file_name, team_id")
      .eq("team_id", teamId)

    if (error) {
      console.error("Error fetching team photos:", error)
      return null
    }


    if (!data || data.length === 0) {
      console.log("No photos found for team:", teamId)
      return null
    }

    // Get a random photo from the available photos
    const randomIndex = Math.floor(Math.random() * data.length)
    const selectedPhoto = data[randomIndex]
    if (!selectedPhoto?.file_path) {
      return null
    }

    // Construct the full Supabase Storage URL
    const { data: urlData } = supabase.storage
      .from("team-photos") // Replace with your actual bucket name
      .getPublicUrl(selectedPhoto.file_path)

    return urlData.publicUrl
  } catch (error) {
    console.error("Failed to fetch random team photo:", error)
    return null
  }
}

/**
 * Get all photos for a specific team
 * @param teamId The team ID to fetch photos for
 * @returns Array of team photos
 */
export async function getTeamPhotos(teamId: string): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from("team_photos")
      .select("*")
      .eq("team_id", teamId)
      .order("display_order", { ascending: true })

    if (error) {
      console.error("Error fetching team photos:", error)
      return []
    }

    // Construct the full storage URLs for each photo
    const photosWithUrls = (data || []).map(photo => ({
      ...photo,
      photo_url: supabase.storage
        .from('team-photos') // Replace with your actual bucket name
        .getPublicUrl(photo.file_path).data.publicUrl
    }))

    return photosWithUrls
  } catch (error) {
    console.error("Failed to fetch team photos:", error)
    return []
  }
}

/**
 * Get team photo by ID
 * @param photoId The photo ID to fetch
 * @returns Team photo object or null if not found
 */
export async function getTeamPhotoById(photoId: string): Promise<any | null> {
  try {
    const { data, error } = await supabase.from("team_photos").select("*").eq("id", photoId).single()

    if (error) {
      console.error("Error fetching team photo by id:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Failed to fetch team photo by id:", error)
    return null
  }
}

/**
 * Cache for team photos to avoid repeated database queries
 */
const teamPhotoCache: Record<string, { url: string; timestamp: number }> = {}

/**
 * Get random team photo with caching
 * @param teamId The team ID to fetch a random photo for
 * @returns URL of a random team photo or null if not found
 */
export async function getRandomTeamPhotoWithCache(teamId: string): Promise<string | null> {
  // Check if we have a cached photo that's less than 5 minutes old
  const cachedPhoto = teamPhotoCache[teamId]
  const now = Date.now()

  if (cachedPhoto && now - cachedPhoto.timestamp < 5 * 60 * 1000) {
    return cachedPhoto.url
  }

  // Fetch a new random photo
  const photoUrl = await getRandomTeamPhoto(teamId)

  // Cache the result
  if (photoUrl) {
    teamPhotoCache[teamId] = {
      url: photoUrl,
      timestamp: now,
    }
  }

  return photoUrl
}
