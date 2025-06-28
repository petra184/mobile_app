import { createClient } from "@supabase/supabase-js"
import { CacheManager } from "./cache-manager"
import type { Database } from "@/types/supabase"

type Tables = Database["public"]["Tables"]
type Team = Tables["teams"]["Row"]
type Player = Tables["players"]["Row"]
type Coach = Tables["coaches"]["Row"]
type GameSchedule = Tables["game_schedule"]["Row"]

export class DataService {
  private supabase = createClient<Database>(
    process.env.EXPO_PUBLIC_SUPABASE_URL!,
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  )

  // Get server metadata for cache validation
  private async getServerMetadata(tableName: string): Promise<{
    lastUpdated: string
    version: number
    recordCount: number
  }> {
    // This assumes you have a function or view that returns metadata
    // You might need to adapt this based on your actual backend implementation
    const { data, error } = await this.supabase
      .rpc("get_latest_updates", {
        data_types: [tableName],
      })
      .single()

    if (error) throw error

    return {
      lastUpdated: data.latest_update,
      version: 1, // You might want to implement versioning in your backend
      recordCount: data.record_count,
    }
  }

  // Get teams with caching
  async getTeams(forceRefresh = false): Promise<Team[]> {
    if (!forceRefresh) {
      const cached = await CacheManager.getCachedTeams()
      if (cached) {
        try {
          const serverMetadata = await this.getServerMetadata("teams")
          if (!CacheManager.isCacheStale(cached.metadata, serverMetadata)) {
            console.log("Using cached teams data")
            return cached.data
          }
        } catch (error) {
          console.warn("Could not check server metadata, using cached data:", error)
          return cached.data
        }
      }
    }

    console.log("Fetching fresh teams data from server")
    const { data, error } = await this.supabase.from("teams").select("*").order("name")

    if (error) throw error

    const metadata = await this.getServerMetadata("teams")
    await CacheManager.cacheTeams(data, metadata)

    return data
  }

  // Get players (roster) with caching
  async getPlayers(teamId?: string, forceRefresh = false): Promise<Player[]> {
    if (!forceRefresh) {
      const cached = await CacheManager.getCachedPlayers()
      if (cached) {
        try {
          const serverMetadata = await this.getServerMetadata("players")
          if (!CacheManager.isCacheStale(cached.metadata, serverMetadata)) {
            console.log("Using cached players data")
            return teamId ? cached.data.filter((player) => player.team_id === teamId) : cached.data
          }
        } catch (error) {
          console.warn("Could not check server metadata, using cached data:", error)
          return teamId ? cached.data.filter((player) => player.team_id === teamId) : cached.data
        }
      }
    }

    console.log("Fetching fresh players data from server")
    let query = this.supabase.from("players").select("*").order("jersey_number")

    if (teamId) {
      query = query.eq("team_id", teamId)
    }

    const { data, error } = await query

    if (error) throw error

    const metadata = await this.getServerMetadata("players")
    await CacheManager.cachePlayers(data, metadata)

    return data
  }

  // Get coaches with caching
  async getCoaches(teamId?: string, forceRefresh = false): Promise<Coach[]> {
    if (!forceRefresh) {
      const cached = await CacheManager.getCachedCoaches()
      if (cached) {
        try {
          const serverMetadata = await this.getServerMetadata("coaches")
          if (!CacheManager.isCacheStale(cached.metadata, serverMetadata)) {
            console.log("Using cached coaches data")
            return teamId ? cached.data.filter((coach) => coach.team_id === teamId) : cached.data
          }
        } catch (error) {
          console.warn("Could not check server metadata, using cached data:", error)
          return teamId ? cached.data.filter((coach) => coach.team_id === teamId) : cached.data
        }
      }
    }

    console.log("Fetching fresh coaches data from server")
    let query = this.supabase.from("coaches").select("*").order("title")

    if (teamId) {
      query = query.eq("team_id", teamId)
    }

    const { data, error } = await query

    if (error) throw error

    const metadata = await this.getServerMetadata("coaches")
    await CacheManager.cacheCoaches(data, metadata)

    return data
  }

  // Get game schedule with caching
  async getGameSchedule(teamId?: string, forceRefresh = false): Promise<GameSchedule[]> {
    if (!forceRefresh) {
      const cached = await CacheManager.getCachedGameSchedule()
      if (cached) {
        try {
          const serverMetadata = await this.getServerMetadata("game_schedule")
          if (!CacheManager.isCacheStale(cached.metadata, serverMetadata)) {
            console.log("Using cached game schedule data")
            return teamId ? cached.data.filter((game) => game.sport_id === teamId) : cached.data
          }
        } catch (error) {
          console.warn("Could not check server metadata, using cached data:", error)
          return teamId ? cached.data.filter((game) => game.sport_id === teamId) : cached.data
        }
      }
    }

    console.log("Fetching fresh game schedule data from server")
    let query = this.supabase
      .from("game_schedule")
      .select(`
        *,
        opposing_teams(name, logo),
        teams(name, short_name)
      `)
      .order("date")

    if (teamId) {
      query = query.eq("sport_id", teamId)
    }

    const { data, error } = await query

    if (error) throw error

    const metadata = await this.getServerMetadata("game_schedule")
    await CacheManager.cacheGameSchedule(data, metadata)

    return data
  }

  // Initialize cache on app launch
  async initializeCache(): Promise<void> {
    try {
      console.log("Initializing cache...")

      // Load all essential data
      await Promise.all([this.getTeams(), this.getPlayers(), this.getCoaches(), this.getGameSchedule()])

      console.log("Cache initialization complete")
    } catch (error) {
      console.error("Cache initialization failed:", error)
      // App can still work with cached data if available
    }
  }

  // Force refresh all cached data
  async refreshAllData(): Promise<void> {
    await Promise.all([
      this.getTeams(true),
      this.getPlayers(undefined, true),
      this.getCoaches(undefined, true),
      this.getGameSchedule(undefined, true),
    ])
  }
}
