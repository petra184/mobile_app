import { supabase } from "@/lib/supabase"
import type { Database } from "@/types/supabase"

export type Coach = Database["public"]["Tables"]["coaches"]["Row"]

"use server"

export type Team = {
  id: string
  name: string
  photo: string | null
  sport: string
  gender: string
}

/**
 * Get team data including roster photo
 * @param teamId The team ID to fetch
 * @returns Team object with roster photo or null if not found
 */
export async function getTeamData(teamId: string): Promise<{
  id: string
  name: string
  photo: string | null
  sport: string
  gender: string
  primaryColor?: string
} | null> {
  try {
    const { data, error } = await supabase
      .from("teams")
      .select("id, name, photo, sport, gender, color")
      .eq("id", teamId)
      .single()

    if (error) {
      console.error("Error fetching team data:", error)
      throw new Error(`Failed to fetch team data: ${error.message}`)
    }

    return {
      ...data,
      primaryColor: data.color || "#007BFF",
    }
  } catch (error) {
    console.error("Failed to fetch team data:", error)
    return null
  }
}

export async function getTeamRosterData(teamId: string) {

  // Get team data including roster photo
  const { data: teamData, error: teamError } = await supabase
    .from("teams")
    .select("id, name, photo, sport, gender")
    .eq("id", teamId)
    .single()

  if (teamError) {
    console.error("Error fetching team data:", teamError)
    return { team: null, players: [], coaches: [] }
  }

  // Get players for the team
  const { data: players, error: playersError } = await supabase
    .from("players")
    .select("id, first_name, last_name, jersey_number, position, height, school_year, home_country, photo")
    .eq("team_id", teamId)
    .order("jersey_number", { ascending: true })

  if (playersError) {
    console.error("Error fetching players:", playersError)
    return { team: teamData, players: [], coaches: [] }
  }

  // Get coaches for the team
  const { data: coaches, error: coachesError } = await supabase
    .from("coaches")
    .select("id, first_name, last_name, title, coaching_experience, image")
    .eq("team_id", teamId)

  if (coachesError) {
    console.error("Error fetching coaches:", coachesError)
    return { team: teamData, players, coaches: [] }
  }

  return {
    team: teamData as Team,
    players: players as Player[],
    coaches: coaches as Coach[],
  }
}


/**
 * Get all coaches for a specific team
 * @param teamId The team ID to fetch coaches for
 * @returns Array of coaches for the team
 */
export async function getCoachesByTeam(teamId: string): Promise<Coach[]> {
  try {
    const { data, error } = await supabase
      .from("coaches")
      .select("*")
      .eq("team_id", teamId)
      .order("title", { ascending: true })

    if (error) {
      console.error("Error fetching coaches:", error)
      throw new Error(`Failed to fetch coaches: ${error.message}`)
    }

    return data || []
  } catch (error) {
    console.error("Failed to fetch coaches:", error)
    return []
  }
}

/**
 * Get a specific coach by ID
 * @param coachId The coach ID to fetch
 * @returns Coach object or null if not found
 */
export async function getCoachById(coachId: string): Promise<Coach | null> {
  try {
    const { data, error } = await supabase.from("coaches").select("*").eq("id", coachId).single()

    if (error) {
      console.error("Error fetching coach:", error)
      throw new Error(`Failed to fetch coach: ${error.message}`)
    }

    return data
  } catch (error) {
    console.error("Failed to fetch coach:", error)
    return null
  }
}

/**
 * Get head coach for a team
 * @param teamId The team ID
 * @returns Head coach or null if not found
 */
export async function getHeadCoach(teamId: string): Promise<Coach | null> {
  try {
    const { data, error } = await supabase
      .from("coaches")
      .select("*")
      .eq("team_id", teamId)
      .ilike("title", "%head%")
      .single()

    if (error) {
      console.error("Error fetching head coach:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Failed to fetch head coach:", error)
    return null
  }
}

export type Player = Database["public"]["Tables"]["players"]["Row"]

/**
 * Get all players for a specific team
 * @param teamId The team ID to fetch players for
 * @returns Array of players for the team
 */
export async function getPlayersByTeam(teamId: string): Promise<Player[]> {
  try {
    const { data, error } = await supabase
      .from("players")
      .select("*")
      .eq("team_id", teamId)
      .order("jersey_number", { ascending: true })

    if (error) {
      console.error("Error fetching players:", error)
      throw new Error(`Failed to fetch players: ${error.message}`)
    }

    return data || []
  } catch (error) {
    console.error("Failed to fetch players:", error)
    return []
  }
}

/**
 * Get a specific player by ID
 * @param playerId The player ID to fetch
 * @returns Player object or null if not found
 */
export async function getPlayerById(playerId: string): Promise<Player | null> {
  try {
    const { data, error } = await supabase.from("players").select("*").eq("id", playerId).single()

    if (error) {
      console.error("Error fetching player:", error)
      throw new Error(`Failed to fetch player: ${error.message}`)
    }

    return data
  } catch (error) {
    console.error("Failed to fetch player:", error)
    return null
  }
}

/**
 * Get players by position for a team
 * @param teamId The team ID
 * @param position The position to filter by
 * @returns Array of players in that position
 */
export async function getPlayersByPosition(teamId: string, position: string): Promise<Player[]> {
  try {
    const { data, error } = await supabase
      .from("players")
      .select("*")
      .eq("team_id", teamId)
      .eq("position", position)
      .order("jersey_number", { ascending: true })

    if (error) {
      console.error("Error fetching players by position:", error)
      throw new Error(`Failed to fetch players by position: ${error.message}`)
    }

    return data || []
  } catch (error) {
    console.error("Failed to fetch players by position:", error)
    return []
  }
}

export type Story = Database["public"]["Tables"]["stories"]["Row"]

/**
 * Get social media stories/posts for a specific team
 * @param teamId The team ID to fetch stories for
 * @param limit Maximum number of stories to return
 * @returns Array of stories for the team
 */
export async function getStoriesByTeam(teamId: string, limit = 20): Promise<Story[]> {
  try {
    const { data, error } = await supabase
      .from("stories")
      .select("*")
      .eq("team_id", teamId)
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error) {
      console.error("Error fetching stories:", error)
      throw new Error(`Failed to fetch stories: ${error.message}`)
    }

    return data || []
  } catch (error) {
    console.error("Failed to fetch stories:", error)
    return []
  }
}

/**
 * Get a specific story by ID
 * @param storyId The story ID to fetch
 * @returns Story object or null if not found
 */
export async function getStoryById(storyId: string): Promise<Story | null> {
  try {
    const { data, error } = await supabase.from("stories").select("*").eq("id", storyId).single()

    if (error) {
      console.error("Error fetching story:", error)
      throw new Error(`Failed to fetch story: ${error.message}`)
    }

    return data
  } catch (error) {
    console.error("Failed to fetch story:", error)
    return null
  }
}

/**
 * Get recent stories across all teams
 * @param limit Maximum number of stories to return
 * @returns Array of recent stories
 */
export async function getRecentStories(limit = 10): Promise<Story[]> {
  try {
    const { data, error } = await supabase
      .from("stories")
      .select("*")
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error) {
      console.error("Error fetching recent stories:", error)
      throw new Error(`Failed to fetch recent stories: ${error.message}`)
    }

    return data || []
  } catch (error) {
    console.error("Failed to fetch recent stories:", error)
    return []
  }
}

/**
 * Get stories by tag for a team
 * @param teamId The team ID
 * @param tag The tag to filter by
 * @param limit Maximum number of stories to return
 * @returns Array of stories with the specified tag
 */
export async function getStoriesByTag(teamId: string, tag: string, limit = 10): Promise<Story[]> {
  try {
    const { data, error } = await supabase
      .from("stories")
      .select("*")
      .eq("team_id", teamId)
      .eq("tag", tag)
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error) {
      console.error("Error fetching stories by tag:", error)
      throw new Error(`Failed to fetch stories by tag: ${error.message}`)
    }

    return data || []
  } catch (error) {
    console.error("Failed to fetch stories by tag:", error)
    return []
  }
}


/**
 * Get detailed player information by ID
 * @param playerId The player ID to fetch
 * @returns Detailed player object or null if not found
 */
export async function getPlayerDetails(playerId: string): Promise<{
  id: string
  first_name: string | null
  last_name: string | null
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
} | null> {

  try {
    const { data, error } = await supabase.from("players").select("*").eq("id", playerId).single()

    if (error) {
      console.error("Error fetching player details:", error)
      throw new Error(`Failed to fetch player details: ${error.message}`)
    }

    return data
  } catch (error) {
    console.error("Failed to fetch player details:", error)
    return null
  }
}


/**
 * Get detailed coach information by ID
 * @param coachId The coach ID to fetch
 * @returns Detailed coach object or null if not found
 */
export async function getCoachDetails(coachId: string): Promise<{
  id: string
  first_name: string | null
  last_name: string | null
  title: string | null
  coaching_experience: string | null
  image: string | null
  bio: string | null
  birthdate: string | null
  age: number | null
  origin: string | null
  education: string | null
  achievements: string | null
  coaching_year: string | null
  twitter: string | null
  instagram: string | null
  facebook: string | null
  team_id: string
} | null> {

  try {
    const { data, error } = await supabase.from("coaches").select("*").eq("id", coachId).single()

    if (error) {
      console.error("Error fetching coach details:", error)
      throw new Error(`Failed to fetch coach details: ${error.message}`)
    }

    return data
  } catch (error) {
    console.error("Failed to fetch coach details:", error)
    return null
  }
}