import AsyncStorage from "@react-native-async-storage/async-storage"
import { supabase } from "@/lib/supabase"

export type CacheableTable = "game_schedule" | "teams" | "stories" | "rewards"

export interface CacheMetadata {
  version: string
  lastUpdated: string
  recordCount: number
}

export interface CacheEntry<T = any> {
  data: T[]
  metadata: CacheMetadata
  cachedAt: string
}

export interface VersionInfo {
  table_name: string
  last_updated: string
  record_count: number
}

class CacheManager {
  private readonly CACHE_PREFIX = "app_cache_"
  private readonly VERSION_KEY = "cache_versions"

  /**
   * Get cache key for a specific table
   */
  private getCacheKey(table: CacheableTable): string {
    return `${this.CACHE_PREFIX}${table}`
  }

  /**
   * Get stored cache versions from local storage
   */
  private async getStoredVersions(): Promise<Record<string, CacheMetadata>> {
    try {
      const versions = await AsyncStorage.getItem(this.VERSION_KEY)
      return versions ? JSON.parse(versions) : {}
    } catch (error) {
      console.error("Error getting stored versions:", error)
      return {}
    }
  }

  /**
   * Update stored cache versions
   */
  private async updateStoredVersions(versions: Record<string, CacheMetadata>): Promise<void> {
    try {
      await AsyncStorage.setItem(this.VERSION_KEY, JSON.stringify(versions))
    } catch (error) {
      console.error("Error updating stored versions:", error)
    }
  }

  /**
   * Get latest version information from Supabase
   */
  private async getLatestVersions(tables: CacheableTable[]): Promise<VersionInfo[]> {
    try {
      const { data, error } = await supabase.rpc("get_latest_updates", {
        data_types: tables.map((table) => table),
      })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error("Error fetching latest versions:", error)
      return []
    }
  }

  /**
   * Check if cache is stale for specific tables
   */
  async isCacheStale(tables: CacheableTable[]): Promise<Record<string, boolean>> {
    const storedVersions = await this.getStoredVersions()
    const latestVersions = await this.getLatestVersions(tables)

    const staleStatus: Record<string, boolean> = {}

    for (const table of tables) {
      const stored = storedVersions[table]
      const latest = latestVersions.find((v) => v.table_name === table)

      if (!stored || !latest) {
        staleStatus[table] = true
        continue
      }

      // Compare timestamps and record counts
      const storedTime = new Date(stored.lastUpdated).getTime()
      const latestTime = new Date(latest.last_updated).getTime()

      staleStatus[table] = latestTime > storedTime || stored.recordCount !== latest.record_count
    }

    return staleStatus
  }

  /**
   * Get cached data for a table
   */
  async getCachedData<T>(table: CacheableTable): Promise<CacheEntry<T> | null> {
    try {
      const cacheKey = this.getCacheKey(table)
      const cached = await AsyncStorage.getItem(cacheKey)
      return cached ? JSON.parse(cached) : null
    } catch (error) {
      console.error(`Error getting cached data for ${table}:`, error)
      return null
    }
  }

  /**
   * Store data in cache
   */
  async setCachedData<T>(table: CacheableTable, data: T[], metadata: CacheMetadata): Promise<void> {
    try {
      const cacheKey = this.getCacheKey(table)
      const cacheEntry: CacheEntry<T> = {
        data,
        metadata,
        cachedAt: new Date().toISOString(),
      }

      await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheEntry))

      // Update version tracking
      const versions = await this.getStoredVersions()
      versions[table] = metadata
      await this.updateStoredVersions(versions)
    } catch (error) {
      console.error(`Error caching data for ${table}:`, error)
    }
  }

  /**
   * Fetch fresh data from Supabase
   */
  private async fetchFreshData(table: CacheableTable): Promise<any[]> {
    let query = supabase.from(table).select("*")

    // Add specific filters based on table
    switch (table) {
      case "game_schedule":
        query = query.order("date", { ascending: true })
        break
      case "teams":
        query = query.order("name", { ascending: true })
        break
      case "stories":
        query = query.eq("status", "published").order("created_at", { ascending: false })
        break
      case "rewards":
        query = query.eq("is_active", true).order("points_required", { ascending: true })
        break
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  }

  /**
   * Get data with automatic cache management
   */
  async getData<T>(table: CacheableTable, forceRefresh = false): Promise<T[]> {
    try {
      // Check if we need to refresh
      if (!forceRefresh) {
        const staleStatus = await this.isCacheStale([table])
        const isStale = staleStatus[table]

        if (!isStale) {
          const cached = await this.getCachedData<T>(table)
          if (cached) {
            console.log(`Using cached data for ${table}`)
            return cached.data
          }
        }
      }

      console.log(`Fetching fresh data for ${table}`)

      // Fetch fresh data
      const freshData = await this.fetchFreshData(table)

      // Create metadata
      const metadata: CacheMetadata = {
        version: Date.now().toString(),
        lastUpdated: new Date().toISOString(),
        recordCount: freshData.length,
      }

      // Cache the fresh data
      await this.setCachedData(table, freshData, metadata)

      return freshData as T[]
    } catch (error) {
      console.error(`Error getting data for ${table}:`, error)

      // Fallback to cached data if available
      const cached = await this.getCachedData<T>(table)
      return cached?.data || []
    }
  }

  /**
   * Refresh multiple tables efficiently
   */
  async refreshMultipleTables(tables: CacheableTable[]): Promise<Record<string, any[]>> {
    const staleStatus = await this.isCacheStale(tables)
    const results: Record<string, any[]> = {}

    // Process each table
    for (const table of tables) {
      const isStale = staleStatus[table]

      if (isStale) {
        console.log(`Refreshing stale data for ${table}`)
        results[table] = await this.getData(table, true)
      } else {
        console.log(`Using cached data for ${table}`)
        const cached = await this.getCachedData(table)
        results[table] = cached?.data || []
      }
    }

    return results
  }

  /**
   * Clear cache for specific table
   */
  async clearCache(table: CacheableTable): Promise<void> {
    try {
      const cacheKey = this.getCacheKey(table)
      await AsyncStorage.removeItem(cacheKey)

      // Update version tracking
      const versions = await this.getStoredVersions()
      delete versions[table]
      await this.updateStoredVersions(versions)
    } catch (error) {
      console.error(`Error clearing cache for ${table}:`, error)
    }
  }

  /**
   * Clear all cache
   */
  async clearAllCache(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys()
      const cacheKeys = keys.filter((key) => key.startsWith(this.CACHE_PREFIX))

      await AsyncStorage.multiRemove([...cacheKeys, this.VERSION_KEY])
    } catch (error) {
      console.error("Error clearing all cache:", error)
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<Record<string, CacheEntry | null>> {
    const tables: CacheableTable[] = ["game_schedule", "teams", "stories", "rewards"]
    const stats: Record<string, CacheEntry | null> = {}

    for (const table of tables) {
      stats[table] = await this.getCachedData(table)
    }

    return stats
  }

  /**
   * Get teams data with caching
   */
  async getTeamsData(): Promise<any[]> {
    return this.getData("teams")
  }

  /**
   * Get games data with caching
   */
  async getGamesData(): Promise<any[]> {
    return this.getData("game_schedule")
  }

  /**
   * Refresh teams and games data together
   */
  async refreshTeamsAndGames(): Promise<{ teams: any[]; games: any[] }> {
    const results = await this.refreshMultipleTables(["teams", "game_schedule"])
    return {
      teams: results.teams || [],
      games: results.game_schedule || [],
    }
  }
}

export const cacheManager = new CacheManager()
