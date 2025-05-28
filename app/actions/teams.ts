import { supabase } from "@/lib/supabase"

export interface DatabaseTeam {
  id: string
  name: string
  short_name: string
  color: string
}

export interface Team {
  id: string
  name: string
  shortName: string
  primaryColor: string
  logo: string
}

// Check if user is authenticated
async function checkAuth() {
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

export async function getTeams(): Promise<Team[]> {
  try {
    // Check authentication first
    const isAuthenticated = await checkAuth()
    if (!isAuthenticated) {
      console.warn("User not authenticated, returning empty teams array")
      return []
    }

    const { data, error } = await supabase.from("teams").select("id, name, short_name, color").order("name")

    if (error) {
      console.error("Error fetching teams:", error)
      throw error
    }

    if (!data) {
      return []
    }

    // Transform database data to match your Team interface
    const teams: Team[] = data.map((dbTeam: DatabaseTeam) => ({
      id: dbTeam.id,
      name: dbTeam.name,
      shortName: dbTeam.short_name,
      primaryColor: dbTeam.color,
      logo: `/placeholder.svg?height=64&width=64&text=${dbTeam.short_name}`,
    }))

    return teams
  } catch (error) {
    console.error("Failed to fetch teams:", error)
    return []
  }
}

export async function getTeamsByGender(gender: "men" | "women"): Promise<Team[]> {
  try {
    // Check authentication first
    const isAuthenticated = await checkAuth()
    if (!isAuthenticated) {
      console.warn("User not authenticated, returning empty teams array")
      return []
    }

    const { data, error } = await supabase
      .from("teams")
      .select("id, name, short_name, color")
      .ilike("name", `%${gender}%`)
      .order("name")

    if (error) {
      console.error("Error fetching teams by gender:", error)
      throw error
    }

    if (!data) {
      return []
    }

    const teams: Team[] = data.map((dbTeam: DatabaseTeam) => ({
      id: dbTeam.id,
      name: dbTeam.name,
      shortName: dbTeam.short_name,
      primaryColor: dbTeam.color,
      logo: `/placeholder.svg?height=64&width=64&text=${dbTeam.short_name}`,
    }))

    return teams
  } catch (error) {
    console.error("Failed to fetch teams by gender:", error)
    return []
  }
}

export async function getTeamById(id: string): Promise<Team | null> {
  try {
    // Check authentication first
    const isAuthenticated = await checkAuth()
    if (!isAuthenticated) {
      console.warn("User not authenticated, cannot fetch team")
      return null
    }

    const { data, error } = await supabase.from("teams").select("id, name, short_name, color").eq("id", id).single()

    if (error) {
      console.error("Error fetching team by id:", error)
      throw error
    }

    if (!data) {
      return null
    }

    const team: Team = {
      id: data.id,
      name: data.name,
      shortName: data.short_name,
      primaryColor: data.color,
      logo: `/placeholder.svg?height=64&width=64&text=${data.short_name}`,
    }

    return team
  } catch (error) {
    console.error("Failed to fetch team by id:", error)
    return null
  }
}

// Alternative function to get teams without authentication (if teams should be public)
export async function getTeamsPublic(): Promise<Team[]> {
  try {
    // This will work if your teams table allows public read access
    const { data, error } = await supabase.from("teams").select("id, name, short_name, color").order("name")

    if (error) {
      console.error("Error fetching public teams:", error)
      // If this fails, it means RLS is blocking public access
      throw new Error("Teams data requires authentication")
    }

    if (!data) {
      return []
    }

    const teams: Team[] = data.map((dbTeam: DatabaseTeam) => ({
      id: dbTeam.id,
      name: dbTeam.name,
      shortName: dbTeam.short_name,
      primaryColor: dbTeam.color,
      logo: `/placeholder.svg?height=64&width=64&text=${dbTeam.short_name}`,
    }))

    return teams
  } catch (error) {
    console.error("Failed to fetch public teams:", error)
    return []
  }
}
  
  // Updated to work with your async createClient function
  export async function getTeamPlayers(teamId: string) {
    try {
  
      const { data, error } = await supabase.from("players").select("*").eq("team_id", teamId).order("jersey_number")
  
      if (error) {
        console.error("Error fetching players:", error)
        throw new Error(`Failed to fetch players: ${error.message}`)
      }
  
      return data || []
    } catch (error) {
      console.error("Error in getTeamPlayers:", error)
      return []
    }
  }
  
  // Updated to work with your async createClient function
  export async function getTeamCoaches(teamId: string) {
    try {
  
      const { data, error } = await supabase.from("coaches").select("*").eq("team_id", teamId)
  
      if (error) {
        console.error("Error fetching coaches:", error)
        throw new Error(`Failed to fetch coaches: ${error.message}`)
      }
  
      return data || []
    } catch (error) {
      console.error("Error in getTeamCoaches:", error)
      return []
    }
}

