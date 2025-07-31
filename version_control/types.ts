export interface VersionControlConfig {
  lastSyncTimestamp: string
  dataVersion: number
  syncInProgress: boolean
  lastFullSync: string
  conflictResolutionStrategy: "server-wins" | "client-wins" | "merge"
  currentUserId: string | null
  isInitialized: boolean
}

export interface DataEntity {
  id: string
  lastModified: string
  version: number
  isDeleted?: boolean
  syncStatus: "synced" | "pending" | "conflict" | "error"
}

export interface SyncResult {
  success: boolean
  itemsUpdated: number
  itemsAdded: number
  itemsDeleted: number
  conflicts: ConflictItem[]
  errors: string[]
}

export interface ConflictItem {
  id: string
  type: string
  localData: any
  serverData: any
  conflictType: "update" | "delete" | "create"
}

export interface CacheMetadata {
  tableName: string
  lastUpdated: string
  recordCount: number
  version: number
}

// Data type definitions for all entities
export type DataType =
  | "teams"
  | "players"
  | "coaches"
  | "games"
  | "stories"
  | "rewards"
  | "special_offers"
  | "birthday_packages"
  | "birthday_faqs"
  | "promotions"
  | "halftime_activities"
  | "user_preferences"
  | "schools"

export interface VersionedEntity extends DataEntity {
  data: any
  entityType: DataType
}
