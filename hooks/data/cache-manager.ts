import AsyncStorage from "@react-native-async-storage/async-storage"
import type { Database } from "@/types/database"

type Tables = Database["public"]["Tables"]
type Team = Tables["teams"]["Row"]
type Player = Tables["players"]["Row"]
type Coach = Tables["coaches"]["Row"]
type GameSchedule = Tables["game_schedule"]["Row"]

interface CacheMetadata {
  lastUpdated: string
  version: number
  recordCount: number
}

interface CachedData<T> {
  data: T[]
  metadata: CacheMetadata
}

export class CacheManager {
  private static readonly CACHE_KEYS = {
    TEAMS: "cached_teams",
    PLAYERS: "cached_players",
    COACHES: "cached_coaches",
    GAME_SCHEDULE: "cached_game_schedule",
    METADATA: "cache_metadata",
  } as const

  // Cache teams data
  static async cacheTeams(teams: Team[], metadata: CacheMetadata): Promise<void> {
    const cachedData: CachedData<Team> = { data: teams, metadata }
    await AsyncStorage.setItem(this.CACHE_KEYS.TEAMS, JSON.stringify(cachedData))
  }

  // Cache players (roster) data
  static async cachePlayers(players: Player[], metadata: CacheMetadata): Promise<void> {
    const cachedData: CachedData<Player> = { data: players, metadata }
    await AsyncStorage.setItem(this.CACHE_KEYS.PLAYERS, JSON.stringify(cachedData))
  }

  // Cache coaches data
  static async cacheCoaches(coaches: Coach[], metadata: CacheMetadata): Promise<void> {
    const cachedData: CachedData<Coach> = { data: coaches, metadata }
    await AsyncStorage.setItem(this.CACHE_KEYS.COACHES, JSON.stringify(cachedData))
  }

  // Cache game schedule data
  static async cacheGameSchedule(schedule: GameSchedule[], metadata: CacheMetadata): Promise<void> {
    const cachedData: CachedData<GameSchedule> = { data: schedule, metadata }
    await AsyncStorage.setItem(this.CACHE_KEYS.GAME_SCHEDULE, JSON.stringify(cachedData))
  }

  // Get cached teams
  static async getCachedTeams(): Promise<CachedData<Team> | null> {
    try {
      const cached = await AsyncStorage.getItem(this.CACHE_KEYS.TEAMS)
      return cached ? JSON.parse(cached) : null
    } catch (error) {
      console.error("Error getting cached teams:", error)
      return null
    }
  }

  // Get cached players
  static async getCachedPlayers(): Promise<CachedData<Player> | null> {
    try {
      const cached = await AsyncStorage.getItem(this.CACHE_KEYS.PLAYERS)
      return cached ? JSON.parse(cached) : null
    } catch (error) {
      console.error("Error getting cached players:", error)
      return null
    }
  }

  // Get cached coaches
  static async getCachedCoaches(): Promise<CachedData<Coach> | null> {
    try {
      const cached = await AsyncStorage.getItem(this.CACHE_KEYS.COACHES)
      return cached ? JSON.parse(cached) : null
    } catch (error) {
      console.error("Error getting cached coaches:", error)
      return null
    }
  }

  // Get cached game schedule
  static async getCachedGameSchedule(): Promise<CachedData<GameSchedule> | null> {
    try {
      const cached = await AsyncStorage.getItem(this.CACHE_KEYS.GAME_SCHEDULE)
      return cached ? JSON.parse(cached) : null
    } catch (error) {
      console.error("Error getting cached game schedule:", error)
      return null
    }
  }

  // Check if cache is stale by comparing with server metadata
  static isCacheStale(cachedMetadata: CacheMetadata, serverMetadata: CacheMetadata): boolean {
    return (
      cachedMetadata.version < serverMetadata.version ||
      new Date(cachedMetadata.lastUpdated) < new Date(serverMetadata.lastUpdated) ||
      cachedMetadata.recordCount !== serverMetadata.recordCount
    )
  }

  // Clear all cached data
  static async clearAllCache(): Promise<void> {
    const keys = Object.values(this.CACHE_KEYS)
    await AsyncStorage.multiRemove(keys)
  }

  // Clear specific cache
  static async clearCache(cacheKey: keyof typeof CacheManager.CACHE_KEYS): Promise<void> {
    await AsyncStorage.removeItem(this.CACHE_KEYS[cacheKey])
  }

  // Get cache size info
  static async getCacheInfo(): Promise<{ [key: string]: number }> {
    const info: { [key: string]: number } = {}

    for (const [name, key] of Object.entries(this.CACHE_KEYS)) {
      try {
        const data = await AsyncStorage.getItem(key)
        info[name] = data ? JSON.stringify(data).length : 0
      } catch (error) {
        info[name] = 0
      }
    }

    return info
  }
}
