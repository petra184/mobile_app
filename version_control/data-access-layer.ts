import { User } from "@supabase/supabase-js"
import { StorageManager } from "./storage-manager"
import { SyncManager } from "./sync-manager"
import type { DataType, VersionedEntity } from "./types"

/**
 * Data Access Layer - Provides a unified interface for accessing cached data
 * This replaces direct Supabase calls in your action files
 */
export class DataAccessLayer {
  private static instance: DataAccessLayer
  private storageManager: StorageManager
  private syncManager: SyncManager

  constructor() {
    this.storageManager = StorageManager.getInstance()
    this.syncManager = SyncManager.getInstance()
  }

  static getInstance(): DataAccessLayer {
    if (!DataAccessLayer.instance) {
      DataAccessLayer.instance = new DataAccessLayer()
    }
    return DataAccessLayer.instance
  }

  // Generic data access methods
  async getAll<T>(entityType: DataType): Promise<T[]> {
    try {
      const entities = await this.storageManager.getEntities(entityType)
      return entities.map((e) => e.data as T)
    } catch (error) {
      console.error(`Error getting all ${entityType}:`, error)
      return []
    }
  }

  async getById<T>(entityType: DataType, id: string): Promise<T | null> {
    try {
      const entity = await this.storageManager.getEntity(entityType, id)
      return entity ? (entity.data as T) : null
    } catch (error) {
      console.error(`Error getting ${entityType} by id ${id}:`, error)
      return null
    }
  }

  async getByFilter<T>(entityType: DataType, filterFn: (item: T) => boolean): Promise<T[]> {
    try {
      const allItems = await this.getAll<T>(entityType)
      return allItems.filter(filterFn)
    } catch (error) {
      console.error(`Error filtering ${entityType}:`, error)
      return []
    }
  }

  // Specific data access methods for your entities

  // Teams
  async getTeams(): Promise<any[]> {
    return this.getAll("teams")
  }

  async getTeamById(id: string): Promise<any | null> {
    return this.getById("teams", id)
  }

  async getTeamsByGender(gender: string): Promise<any[]> {
    const dbGender = gender === "men" ? "Men's" : "Women's"
    return this.getByFilter("teams", (team: any) => team.gender === dbGender)
  }

  async getTeamsBySport(sport: string): Promise<any[]> {
    return this.getByFilter("teams", (team: any) => team.sport === sport)
  }

  // Players
  async getPlayersByTeam(teamId: string): Promise<any[]> {
    return this.getByFilter("players", (player: any) => player.team_id === teamId)
  }

  async getPlayerById(id: string): Promise<any | null> {
    return this.getById("players", id)
  }

  // Coaches
  async getCoachesByTeam(teamId: string): Promise<any[]> {
    return this.getByFilter("coaches", (coach: any) => coach.team_id === teamId)
  }

  async getCoachById(id: string): Promise<any | null> {
    return this.getById("coaches", id)
  }

  // Games - Fixed to handle game_id properly
  async getGames(): Promise<any[]> {
    return this.getAll("games")
  }

  async getUpcomingGames(limit = 1000, teamId?: string): Promise<any[]> {
    const today = new Date().toISOString().split("T")[0]
    let games = await this.getByFilter("games", (game: any) => game.date >= today)

    if (teamId) {
      games = games.filter((game) => game.sport_id === teamId)
    }

    return games.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(0, limit)
  }

  async getPastGames(limit = 1000, teamId?: string): Promise<any[]> {
    const today = new Date().toISOString().split("T")[0]
    let games = await this.getByFilter("games", (game: any) => game.date < today)

    if (teamId) {
      games = games.filter((game) => game.sport_id === teamId)
    }

    return games.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, limit)
  }

  async getGameById(id: string): Promise<any | null> {
    return this.getById("games", id)
  }

  async getLiveGames(limit = 100): Promise<any[]> {
    const today = new Date().toISOString().split("T")[0]
    const now = new Date()

    const games = await this.getByFilter("games", (game: any) => {
      if (game.date !== today) return false
      if (game.status === "completed" || game.status === "postponed" || game.status === "canceled") {
        return false
      }

      // Simple live game logic - you can enhance this
      if (!game.game_time) return false

      try {
        const gameTime = new Date(`${game.date}T${game.game_time}`)
        const gameEndTime = new Date(gameTime.getTime() + 2 * 60 * 60 * 1000) // 2 hours duration

        return now >= gameTime && now <= gameEndTime
      } catch (error) {
        return false
      }
    })

    return games.slice(0, limit)
  }

  async getGamesByMonth(year: number, month: number, teamId?: string): Promise<any[]> {
    const startDate = new Date(year, month, 1).toISOString().split("T")[0]
    const endDate = new Date(year, month + 1, 0).toISOString().split("T")[0]

    let games = await this.getByFilter("games", (game: any) => game.date >= startDate && game.date <= endDate)

    if (teamId) {
      games = games.filter((game) => game.sport_id === teamId)
    }

    return games.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }

  // Stories/News
  async getAllNews(limit = 20): Promise<any[]> {
    const stories = await this.getByFilter("stories", (story: any) => story.status === "published")

    return stories.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, limit)
  }

  async getNewsByTeam(teamId: string, limit = 20): Promise<any[]> {
    const stories = await this.getByFilter(
      "stories",
      (story: any) => story.team_id === teamId && story.status === "published",
    )

    return stories.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, limit)
  }

  async getNewsById(id: string): Promise<any | null> {
    const story = await this.getById("stories", id)
    return story && story === "published" ? story : null
  }

  async searchNews(query: string, limit = 20): Promise<any[]> {
    const allNews = await this.getAllNews(1000)
    const filtered = allNews.filter(
      (article) =>
        article.title?.toLowerCase().includes(query.toLowerCase()) ||
        article.headline?.toLowerCase().includes(query.toLowerCase()) ||
        article.content?.toLowerCase().includes(query.toLowerCase()),
    )
    return filtered.slice(0, limit)
  }

  // Rewards
  async getActiveRewards(): Promise<any[]> {
    return this.getByFilter("rewards", (reward: any) => reward.is_active && !reward.is_sold)
  }

  async getRewardById(id: string): Promise<any | null> {
    return this.getById("rewards", id)
  }

  // Special Offers
  async getActiveSpecialOffers(): Promise<any[]> {
    const now = new Date().toISOString()
    return this.getByFilter(
      "special_offers",
      (offer: any) => offer.is_active && offer.start_date <= now && offer.end_date >= now,
    )
  }

  // Birthday Packages
  async getBirthdayPackages(): Promise<any[]> {
    return this.getByFilter("birthday_packages", (pkg: any) => pkg.is_active)
  }

  async getBirthdayPackageById(id: string): Promise<any | null> {
    return this.getById("birthday_packages", id)
  }

  async getActiveBirthdayPackages(teamId?: string): Promise<any[]> {
    let packages = await this.getByFilter("birthday_packages", (pkg: any) => pkg.is_active)

    if (teamId) {
      packages = packages.filter((pkg) => pkg.team_id === teamId)
    }

    return packages
  }

  async getFeaturedBirthdayPackages(teamId: string): Promise<any[]> {
    return this.getByFilter(
      "birthday_packages",
      (pkg: any) => pkg.team_id === teamId && pkg.is_active && pkg.is_featured,
    )
  }

  // Birthday FAQs
  async getBirthdayFAQs(): Promise<any[]> {
    return this.getAll("birthday_faqs")
  }

  async searchFAQs(searchTerm: string): Promise<any[]> {
    if (!searchTerm.trim()) {
      return this.getBirthdayFAQs()
    }

    return this.getByFilter(
      "birthday_faqs",
      (faq: any) =>
        faq.faq_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        faq.faq_response?.toLowerCase().includes(searchTerm.toLowerCase()),
    )
  }

  // Schools
  async getSchoolById(id: string): Promise<any | null> {
    return this.getById("schools", id)
  }

  // User Preferences
  async getUserPreferences(userId: string): Promise<any | null> {
    const prefs = await this.getAll("user_preferences") as { user_id: string }[];
    return prefs.find((p) => p.user_id === userId) || null;
  }

  // Team roster data
  async getTeamRosterData(teamId: string) {
    try {
      const [team, players, coaches] = await Promise.all([
        this.getTeamById(teamId),
        this.getPlayersByTeam(teamId),
        this.getCoachesByTeam(teamId),
      ])

      return {
        team,
        players: players.sort((a, b) => {
          const aNum = Number.parseInt(a.jersey_number || "999")
          const bNum = Number.parseInt(b.jersey_number || "999")
          return aNum - bNum
        }),
        coaches,
      }
    } catch (error) {
      console.error("Error getting team roster data:", error)
      return { team: null, players: [], coaches: [] }
    }
  }

  // Data modification methods (these will mark items for sync)
  async updateEntity(entityType: DataType, id: string, updates: any): Promise<void> {
    try {
      const entity = await this.storageManager.getEntity(entityType, id)
      if (entity) {
        entity.data = { ...entity.data, ...updates }
        entity.syncStatus = "pending"
        entity.lastModified = new Date().toISOString()

        await this.storageManager.storeEntities(entityType, [entity])
      }
    } catch (error) {
      console.error(`Error updating ${entityType}:${id}:`, error)
      throw error
    }
  }

  async createEntity(entityType: DataType, data: any): Promise<void> {
    try {
      const entity: VersionedEntity = {
        id: data.id || data.game_id || data.school_id || data.user_id || crypto.randomUUID(),
        lastModified: new Date().toISOString(),
        version: 1,
        syncStatus: "pending",
        data,
        entityType,
      }

      await this.storageManager.storeEntities(entityType, [entity])
    } catch (error) {
      console.error(`Error creating ${entityType}:`, error)
      throw error
    }
  }

  async deleteEntity(entityType: DataType, id: string): Promise<void> {
    try {
      await this.storageManager.deleteEntity(entityType, id)
    } catch (error) {
      console.error(`Error deleting ${entityType}:${id}:`, error)
      throw error
    }
  }

  // Sync management
  async triggerSync(): Promise<void> {
    try {
      const isNeeded = await this.syncManager.isSyncNeeded()
      if (isNeeded) {
        await this.syncManager.performIncrementalSync()
      }
    } catch (error) {
      console.error("Error triggering sync:", error)
      throw error
    }
  }

  async getSyncStatus() {
    return this.syncManager.getSyncStatus()
  }
}

// Export singleton instance
export const dataAccess = DataAccessLayer.getInstance()
