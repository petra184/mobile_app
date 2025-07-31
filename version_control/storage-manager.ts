import AsyncStorage from "@react-native-async-storage/async-storage"
import type { VersionControlConfig, VersionedEntity, CacheMetadata, DataType } from "./types"

export class StorageManager {
  private static instance: StorageManager
  private readonly CONFIG_KEY = "current_sync_config"
  private readonly CACHE_PREFIX = "cs_cache_"
  private readonly METADATA_PREFIX = "cs_meta_"
  private readonly USER_INIT_KEY = "cs_user_initialized_"

  static getInstance(): StorageManager {
    if (!StorageManager.instance) {
      StorageManager.instance = new StorageManager()
    }
    return StorageManager.instance
  }

  // Check if user has been initialized before
  async isUserInitialized(userId: string): Promise<boolean> {
    try {
      const key = `${this.USER_INIT_KEY}${userId}`
      const initialized = await AsyncStorage.getItem(key)
      return initialized === "true"
    } catch (error) {
      console.error("Error checking user initialization:", error)
      return false
    }
  }

  // Mark user as initialized
  async markUserAsInitialized(userId: string): Promise<void> {
    try {
      const key = `${this.USER_INIT_KEY}${userId}`
      await AsyncStorage.setItem(key, "true")
      console.log("✅ User marked as initialized:", userId)
    } catch (error) {
      console.error("Error marking user as initialized:", error)
      throw error
    }
  }

  // Get the current user ID from config
  async getCurrentUserId(): Promise<string | null> {
    try {
      const config = await this.getConfig()
      return config.currentUserId || null
    } catch (error) {
      console.error("Error getting current user ID:", error)
      return null
    }
  }

  // Set the current user ID
  async setCurrentUserId(userId: string): Promise<void> {
    try {
      await this.updateConfig({ currentUserId: userId })
    } catch (error) {
      console.error("Error setting current user ID:", error)
      throw error
    }
  }

  // Configuration management
  async getConfig(): Promise<VersionControlConfig> {
    try {
      const configStr = await AsyncStorage.getItem(this.CONFIG_KEY)
      if (!configStr) {
        return this.getDefaultConfig()
      }
      return JSON.parse(configStr)
    } catch (error) {
      console.error("Error getting config:", error)
      return this.getDefaultConfig()
    }
  }

  async updateConfig(config: Partial<VersionControlConfig>): Promise<void> {
    try {
      const currentConfig = await this.getConfig()
      const newConfig = { ...currentConfig, ...config }
      await AsyncStorage.setItem(this.CONFIG_KEY, JSON.stringify(newConfig))
    } catch (error) {
      console.error("Error updating config:", error)
      throw error
    }
  }

  private getDefaultConfig(): VersionControlConfig {
    return {
      lastSyncTimestamp: new Date(0).toISOString(),
      dataVersion: 1,
      syncInProgress: false,
      lastFullSync: new Date(0).toISOString(),
      conflictResolutionStrategy: "server-wins",
      currentUserId: null,
      isInitialized: false,
    }
  }

  // Check if we have any cached data
  async hasCachedData(): Promise<boolean> {
    try {
      const keys = await AsyncStorage.getAllKeys()
      const cacheKeys = keys.filter((key) => key.startsWith(this.CACHE_PREFIX))

      if (cacheKeys.length === 0) return false

      // Check if any cache has data
      for (const key of cacheKeys.slice(0, 3)) {
        // Check first 3 for performance
        const data = await AsyncStorage.getItem(key)
        if (data) {
          const parsed = JSON.parse(data)
          if (Array.isArray(parsed) && parsed.length > 0) {
            return true
          }
        }
      }
      return false
    } catch (error) {
      console.error("Error checking cached data:", error)
      return false
    }
  }

  // Entity storage
  async storeEntities(entityType: DataType, entities: VersionedEntity[]): Promise<void> {
    try {
      const key = `${this.CACHE_PREFIX}${entityType}`
      const existingData = await this.getEntities(entityType)

      // Merge with existing data
      const entityMap = new Map(existingData.map((e) => [e.id, e]))

      entities.forEach((entity) => {
        entityMap.set(entity.id, {
          ...entity,
          lastModified: new Date().toISOString(),
          version: (entityMap.get(entity.id)?.version || 0) + 1,
        })
      })

      const allEntities = Array.from(entityMap.values())
      await AsyncStorage.setItem(key, JSON.stringify(allEntities))

      // Update metadata
      await this.updateMetadata(entityType, {
        tableName: entityType,
        lastUpdated: new Date().toISOString(),
        recordCount: allEntities.length,
        version: Math.max(...allEntities.map((e) => e.version)),
      })
    } catch (error) {
      console.error(`Error storing entities for ${entityType}:`, error)
      throw error
    }
  }

  async getEntities(entityType: DataType): Promise<VersionedEntity[]> {
    try {
      const key = `${this.CACHE_PREFIX}${entityType}`
      const dataStr = await AsyncStorage.getItem(key)
      if (!dataStr) return []

      const entities = JSON.parse(dataStr) as VersionedEntity[]
      return entities.filter((e) => !e.isDeleted)
    } catch (error) {
      console.error(`Error getting entities for ${entityType}:`, error)
      return []
    }
  }

  async getEntity(entityType: DataType, id: string): Promise<VersionedEntity | null> {
    try {
      const entities = await this.getEntities(entityType)
      return entities.find((e) => e.id === id) || null
    } catch (error) {
      console.error(`Error getting entity ${id} for ${entityType}:`, error)
      return null
    }
  }

  async deleteEntity(entityType: DataType, id: string): Promise<void> {
    try {
      const entities = await this.getEntities(entityType)
      const entityIndex = entities.findIndex((e) => e.id === id)

      if (entityIndex !== -1) {
        entities[entityIndex] = {
          ...entities[entityIndex],
          isDeleted: true,
          lastModified: new Date().toISOString(),
          syncStatus: "pending",
        }

        const key = `${this.CACHE_PREFIX}${entityType}`
        await AsyncStorage.setItem(key, JSON.stringify(entities))
      }
    } catch (error) {
      console.error(`Error deleting entity ${id} for ${entityType}:`, error)
      throw error
    }
  }

  // Metadata management
  async updateMetadata(entityType: DataType, metadata: CacheMetadata): Promise<void> {
    try {
      const key = `${this.METADATA_PREFIX}${entityType}`
      await AsyncStorage.setItem(key, JSON.stringify(metadata))
    } catch (error) {
      console.error(`Error updating metadata for ${entityType}:`, error)
      throw error
    }
  }

  async getMetadata(entityType: DataType): Promise<CacheMetadata | null> {
    try {
      const key = `${this.METADATA_PREFIX}${entityType}`
      const metaStr = await AsyncStorage.getItem(key)
      return metaStr ? JSON.parse(metaStr) : null
    } catch (error) {
      console.error(`Error getting metadata for ${entityType}:`, error)
      return null
    }
  }

  // Pending changes tracking
  async getPendingChanges(): Promise<{ [key in DataType]?: VersionedEntity[] }> {
    const pendingChanges: { [key in DataType]?: VersionedEntity[] } = {}

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
      "user_preferences",
      "schools",
    ]

    for (const entityType of dataTypes) {
      try {
        const entities = await this.getEntities(entityType)
        const pending = entities.filter((e) => e.syncStatus === "pending")
        if (pending.length > 0) {
          pendingChanges[entityType] = pending
        }
      } catch (error) {
        console.error(`Error getting pending changes for ${entityType}:`, error)
      }
    }

    return pendingChanges
  }

  // Clear data for specific user (when switching users)
  async clearUserData(userId: string): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys()
      const userKeys = keys.filter(
        (key) =>
          key.startsWith(this.CACHE_PREFIX) ||
          key.startsWith(this.METADATA_PREFIX) ||
          key === `${this.USER_INIT_KEY}${userId}`,
      )
      await AsyncStorage.multiRemove(userKeys)
      console.log("✅ Cleared user data for:", userId)
    } catch (error) {
      console.error("Error clearing user data:", error)
      throw error
    }
  }

  // Clear all data
  async clearAllData(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys()
      const vcKeys = keys.filter(
        (key) =>
          key.startsWith(this.CACHE_PREFIX) ||
          key.startsWith(this.METADATA_PREFIX) ||
          key.startsWith(this.USER_INIT_KEY) ||
          key === this.CONFIG_KEY,
      )
      await AsyncStorage.multiRemove(vcKeys)
      console.log("✅ Cleared all current sync data")
    } catch (error) {
      console.error("Error clearing all data:", error)
      throw error
    }
  }

  // Get storage statistics
  async getStorageStats(): Promise<{
    totalEntities: number
    pendingSync: number
    lastSync: string
    cacheSize: string
    isInitialized: boolean
  }> {
    try {
      const config = await this.getConfig()
      let totalEntities = 0
      let pendingSync = 0

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
        "user_preferences",
        "schools",
      ]

      for (const entityType of dataTypes) {
        const entities = await this.getEntities(entityType)
        totalEntities += entities.length
        pendingSync += entities.filter((e) => e.syncStatus === "pending").length
      }

      // Estimate cache size
      const keys = await AsyncStorage.getAllKeys()
      const vcKeys = keys.filter((key) => key.startsWith(this.CACHE_PREFIX) || key.startsWith(this.METADATA_PREFIX))

      let totalSize = 0
      for (const key of vcKeys) {
        const data = await AsyncStorage.getItem(key)
        if (data) {
          totalSize += new Blob([data]).size
        }
      }

      return {
        totalEntities,
        pendingSync,
        lastSync: config.lastSyncTimestamp,
        cacheSize: `${(totalSize / 1024).toFixed(2)} KB`,
        isInitialized: config.isInitialized || false,
      }
    } catch (error) {
      console.error("Error getting storage stats:", error)
      return {
        totalEntities: 0,
        pendingSync: 0,
        lastSync: "Never",
        cacheSize: "0 KB",
        isInitialized: false,
      }
    }
  }
}
