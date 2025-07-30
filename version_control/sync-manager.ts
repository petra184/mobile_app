import { supabase } from "@/lib/supabase"
import { StorageManager } from "./storage-manager"
import type { VersionedEntity, SyncResult, DataType } from "./types"

export class SyncManager {
  private static instance: SyncManager
  private storageManager: StorageManager
  private syncInProgress = false

  constructor() {
    this.storageManager = StorageManager.getInstance()
  }

  static getInstance(): SyncManager {
    if (!SyncManager.instance) {
      SyncManager.instance = new SyncManager()
    }
    return SyncManager.instance
  }

  // Table configuration based on your actual database schema
  private getTableConfig(dataType: DataType) {
    const configs = {
      teams: {
        tableName: "teams",
        orderBy: "last_updated",
        selectFields: "*",
      },
      players: {
        tableName: "players",
        orderBy: "last_updated",
        selectFields: "*",
      },
      coaches: {
        tableName: "coaches",
        orderBy: "last_updated",
        selectFields: "*",
      },
      games: {
        tableName: "game_schedule",
        orderBy: "last_updated",
        selectFields: `
          game_id,
          sport_id,
          date,
          location,
          game_time,
          points,
          opponent_id,
          school_id,
          season_type,
          final_home_score,
          final_guest_score,
          special_events,
          halftime_activity,
          status,
          photo_url,
          game_type,
          game_notes,
          last_updated,
          sport_id:teams!game_schedule_sport_id_fkey(*),
          opponent_id:opposing_teams!game_schedule_opponent_id_fkey(*)
        `,
      },
      stories: {
        tableName: "stories",
        orderBy: "created_at",
        selectFields: `
          *,
          teams (
            id,
            name,
            sport,
            gender,
            photo
          )
        `,
      },
      rewards: {
        tableName: "rewards",
        orderBy: "created_at",
        selectFields: "*",
      },
      special_offers: {
        tableName: "special_offers",
        orderBy: "created_at",
        selectFields: "*",
      },
      birthday_packages: {
        tableName: "birthday_packages",
        orderBy: "created_at",
        selectFields: "*",
      },
      birthday_faqs: {
        tableName: "birthday_faqs",
        orderBy: "created_at",
        selectFields: "*",
      },
      promotions: {
        tableName: "promotions",
        orderBy: "created_at",
        selectFields: "*",
      },
      halftime_activities: {
        tableName: "halftime_activities",
        orderBy: "created_at",
        selectFields: "*",
      },
      schools: {
        tableName: "SCHOOLS",
        orderBy: "last_updated",
        selectFields: "*",
      },
      user_preferences: {
        tableName: "user_preferences",
        orderBy: "created_at",
        selectFields: "*",
      },
    }

    return configs[dataType]
  }

  // Initial data fetch on user signup
  async performInitialSync(userId: string): Promise<SyncResult> {
    console.log("🔄 Starting initial sync for user:", userId)

    if (this.syncInProgress) {
      throw new Error("Sync already in progress")
    }

    this.syncInProgress = true
    await this.storageManager.updateConfig({ syncInProgress: true })

    try {
      const result: SyncResult = {
        success: true,
        itemsUpdated: 0,
        itemsAdded: 0,
        itemsDeleted: 0,
        conflicts: [],
        errors: [],
      }

      // Fetch all data types
      const dataTypes: DataType[] = [
        "teams",
        "players",
        "coaches",
        "games",
        "stories",
        "rewards",
        "special_offers",
        "birthday_packages",
        "birthday_faqs",
        "promotions",
        "halftime_activities",
        "schools",
      ]

      for (const dataType of dataTypes) {
        try {
          const data = await this.fetchDataFromSupabase(dataType)
          const entities = this.transformToVersionedEntities(data, dataType)

          await this.storageManager.storeEntities(dataType, entities)
          result.itemsAdded += entities.length

          console.log(`✅ Synced ${entities.length} ${dataType}`)
        } catch (error) {
          console.error(`❌ Error syncing ${dataType}:`, error)
          result.errors.push(`Failed to sync ${dataType}: ${error}`)
          // Don't mark as failed for individual table errors
        }
      }

      // Fetch user preferences
      try {
        const userPrefs = await this.fetchUserPreferences(userId)
        if (userPrefs) {
          const prefEntity = this.transformToVersionedEntities([userPrefs], "user_preferences")
          await this.storageManager.storeEntities("user_preferences", prefEntity)
          result.itemsAdded += 1
        }
      } catch (error) {
        console.error("❌ Error syncing user preferences:", error)
        result.errors.push(`Failed to sync user preferences: ${error}`)
      }

      // Update sync timestamp
      await this.storageManager.updateConfig({
        lastSyncTimestamp: new Date().toISOString(),
        lastFullSync: new Date().toISOString(),
        syncInProgress: false,
      })

      // Only mark as failed if ALL syncs failed
      result.success = result.itemsAdded > 0 || result.errors.length === 0

      console.log("✅ Initial sync completed:", result)
      return result
    } catch (error) {
      console.error("❌ Initial sync failed:", error)
      await this.storageManager.updateConfig({ syncInProgress: false })
      throw error
    } finally {
      this.syncInProgress = false
    }
  }

  // Incremental sync - only fetch changes
  async performIncrementalSync(): Promise<SyncResult> {
    console.log("🔄 Starting incremental sync")

    if (this.syncInProgress) {
      throw new Error("Sync already in progress")
    }

    this.syncInProgress = true
    await this.storageManager.updateConfig({ syncInProgress: true })

    try {
      const config = await this.storageManager.getConfig()
      const lastSync = config.lastSyncTimestamp

      const result: SyncResult = {
        success: true,
        itemsUpdated: 0,
        itemsAdded: 0,
        itemsDeleted: 0,
        conflicts: [],
        errors: [],
      }

      // Check for server changes since last sync
      const serverChanges = await this.getServerChangesSince(lastSync)

      if (serverChanges.length === 0) {
        console.log("✅ No server changes detected")
        await this.storageManager.updateConfig({ syncInProgress: false })
        this.syncInProgress = false
        return result
      }

      // Process server changes
      for (const change of serverChanges) {
        try {
          await this.processServerChange(change, result)
        } catch (error) {
          console.error(`❌ Error processing change for ${change.data_type}:`, error)
          result.errors.push(`Failed to process ${change.data_type}: ${error}`)
        }
      }

      // Push local changes to server
      const pendingChanges = await this.storageManager.getPendingChanges()
      for (const [dataType, entities] of Object.entries(pendingChanges)) {
        try {
          await this.pushChangesToServer(dataType as DataType, entities)

          // Mark as synced
          for (const entity of entities) {
            entity.syncStatus = "synced"
          }
          await this.storageManager.storeEntities(dataType as DataType, entities)
        } catch (error) {
          console.error(`❌ Error pushing ${dataType} changes:`, error)
          result.errors.push(`Failed to push ${dataType}: ${error}`)
        }
      }

      // Update sync timestamp
      await this.storageManager.updateConfig({
        lastSyncTimestamp: new Date().toISOString(),
        syncInProgress: false,
      })

      result.success = result.errors.length === 0

      console.log("✅ Incremental sync completed:", result)
      return result
    } catch (error) {
      console.error("❌ Incremental sync failed:", error)
      await this.storageManager.updateConfig({ syncInProgress: false })
      throw error
    } finally {
      this.syncInProgress = false
    }
  }

  // Check if sync is needed
  async isSyncNeeded(): Promise<boolean> {
    try {
      const config = await this.storageManager.getConfig()
      const pendingChanges = await this.storageManager.getPendingChanges()

      // Check if there are local pending changes
      const hasPendingChanges = Object.keys(pendingChanges).length > 0

      // Check if it's been more than 1 hour since last sync
      const lastSync = new Date(config.lastSyncTimestamp)
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
      const isStale = lastSync < oneHourAgo

      // Check server for changes (lightweight check)
      const hasServerChanges = await this.hasServerChanges(config.lastSyncTimestamp)

      return hasPendingChanges || isStale || hasServerChanges
    } catch (error) {
      console.error("Error checking sync need:", error)
      return false
    }
  }

  // Private helper methods
  private async fetchDataFromSupabase(dataType: DataType): Promise<any[]> {
    const config = this.getTableConfig(dataType)
    if (!config) {
      throw new Error(`No configuration found for data type: ${dataType}`)
    }

    try {
      let query = supabase.from(config.tableName).select(config.selectFields)

      // Add ordering if the column exists
      if (config.orderBy) {
        query = query.order(config.orderBy, { ascending: false })
      }

      const { data, error } = await query

      if (error) {
        throw new Error(`Failed to fetch ${dataType}: ${error.message}`)
      }

      return data || []
    } catch (error) {
      console.error(`Error fetching ${dataType}:`, error)
      throw error
    }
  }

  private async fetchUserPreferences(userId: string): Promise<any | null> {
    const { data, error } = await supabase.from("user_preferences").select("*").eq("user_id", userId).single()

    if (error && error.code !== "PGRST116") {
      throw new Error(`Failed to fetch user preferences: ${error.message}`)
    }

    return data
  }

  private transformToVersionedEntities(data: any[], entityType: DataType): VersionedEntity[] {
    return data.map((item) => {
      // Determine the ID field based on the entity type
      let id: string
      switch (entityType) {
        case "games":
          id = item.game_id
          break
        case "schools":
          id = item.school_id
          break
        case "user_preferences":
          id = item.user_id
          break
        default:
          id = item.id
      }

      // Determine the last modified field
      let lastModified: string
      if (item.updated_at) {
        lastModified = item.updated_at
      } else if (item.last_updated) {
        lastModified = item.last_updated
      } else if (item.created_at) {
        lastModified = item.created_at
      } else {
        lastModified = new Date().toISOString()
      }

      return {
        id,
        lastModified,
        version: 1,
        syncStatus: "synced" as const,
        data: item,
        entityType,
      }
    })
  }

  private async getServerChangesSince(timestamp: string): Promise<any[]> {
    try {
      // Use the database function to check for changes
      const { data, error } = await supabase.rpc("get_latest_updates_for_cache", {
        data_types: [
          "teams",
          "players",
          "coaches",
          "game_schedule",
          "stories",
          "rewards",
          "special_offers",
          "birthday_packages",
          "birthday_faqs",
          "promotions",
          "halftime_activities",
          "SCHOOLS",
        ],
      })

      if (error) {
        console.error("Error checking server changes:", error)
        return []
      }

      // Filter changes that occurred after our last sync
      const lastSyncDate = new Date(timestamp)
      return (data || []).filter((change: any) => new Date(change.latest_update) > lastSyncDate)
    } catch (error) {
      console.error("Error getting server changes:", error)
      return []
    }
  }

  private async hasServerChanges(lastSyncTimestamp: string): Promise<boolean> {
    try {
      const changes = await this.getServerChangesSince(lastSyncTimestamp)
      return changes.length > 0
    } catch (error) {
      console.error("Error checking for server changes:", error)
      return false
    }
  }

  private async processServerChange(change: any, result: SyncResult): Promise<void> {
    const dataTypeMap: { [key: string]: DataType } = {
      teams: "teams",
      players: "players",
      coaches: "coaches",
      game_schedule: "games",
      stories: "stories",
      rewards: "rewards",
      special_offers: "special_offers",
      birthday_packages: "birthday_packages",
      birthday_faqs: "birthday_faqs",
      promotions: "promotions",
      halftime_activities: "halftime_activities",
      SCHOOLS: "schools",
    }

    const dataType = dataTypeMap[change.data_type]
    if (!dataType) return

    // Fetch updated data for this type
    const serverData = await this.fetchDataFromSupabase(dataType)
    const entities = this.transformToVersionedEntities(serverData, dataType)

    // Get existing local data
    const localEntities = await this.storageManager.getEntities(dataType)
    const localMap = new Map(localEntities.map((e) => [e.id, e]))

    // Process each server entity
    for (const serverEntity of entities) {
      const localEntity = localMap.get(serverEntity.id)

      if (!localEntity) {
        // New entity from server
        result.itemsAdded++
      } else if (localEntity.syncStatus === "pending") {
        // Conflict: both local and server have changes
        result.conflicts.push({
          id: serverEntity.id,
          type: dataType,
          localData: localEntity.data,
          serverData: serverEntity.data,
          conflictType: "update",
        })
        continue
      } else {
        // Update from server
        result.itemsUpdated++
      }
    }

    // Store updated entities
    await this.storageManager.storeEntities(dataType, entities)
  }

  private async pushChangesToServer(dataType: DataType, entities: VersionedEntity[]): Promise<void> {
    const config = this.getTableConfig(dataType)
    if (!config) {
      throw new Error(`No configuration found for data type: ${dataType}`)
    }

    for (const entity of entities) {
      try {
        if (entity.isDeleted) {
          // Delete from server
          const { error } = await supabase.from(config.tableName).delete().eq("id", entity.id)

          if (error) throw error
        } else {
          // Upsert to server
          const { error } = await supabase.from(config.tableName).upsert(entity.data)

          if (error) throw error
        }
      } catch (error) {
        console.error(`Error pushing ${dataType} entity ${entity.id}:`, error)
        throw error
      }
    }
  }

  // Public utility methods
  async forceSyncEntity(entityType: DataType, entityId: string): Promise<void> {
    try {
      const entity = await this.storageManager.getEntity(entityType, entityId)
      if (entity) {
        entity.syncStatus = "pending"
        await this.storageManager.storeEntities(entityType, [entity])
      }
    } catch (error) {
      console.error(`Error forcing sync for ${entityType}:${entityId}:`, error)
      throw error
    }
  }

  async getSyncStatus(): Promise<{
    isInProgress: boolean
    lastSync: string
    pendingChanges: number
    conflicts: number
  }> {
    try {
      const config = await this.storageManager.getConfig()
      const pendingChanges = await this.storageManager.getPendingChanges()

      const totalPending = Object.values(pendingChanges).reduce((sum, entities) => sum + entities.length, 0)

      return {
        isInProgress: config.syncInProgress,
        lastSync: config.lastSyncTimestamp,
        pendingChanges: totalPending,
        conflicts: 0, // TODO: Implement conflict tracking
      }
    } catch (error) {
      console.error("Error getting sync status:", error)
      return {
        isInProgress: false,
        lastSync: "Never",
        pendingChanges: 0,
        conflicts: 0,
      }
    }
  }
}
