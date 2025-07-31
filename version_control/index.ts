"use client"

// Main export file for the current sync system
export { StorageManager } from "./storage-manager"
export { SyncManager } from "./sync-manager"
export { DataAccessLayer, dataAccess } from "./data-access-layer"
export * from "./types"

// Convenience hooks and utilities
import { useEffect, useState } from "react"
import { SyncManager } from "./sync-manager"
import { DataAccessLayer } from "./data-access-layer"

// Hook for sync status
export function useSyncStatus() {
  const [syncStatus, setSyncStatus] = useState({
    isInProgress: false,
    lastSync: "Never",
    pendingChanges: 0,
    conflicts: 0,
  })

  const syncManager = SyncManager.getInstance()

  useEffect(() => {
    const updateStatus = async () => {
      const status = await syncManager.getSyncStatus()
      setSyncStatus(status)
    }

    updateStatus()
    const interval = setInterval(updateStatus, 30000) // Update every 30 seconds

    return () => clearInterval(interval)
  }, [syncManager])

  return syncStatus
}

// Hook for triggering sync
export function useSync() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const dataAccess = DataAccessLayer.getInstance()

  const triggerSync = async () => {
    setIsLoading(true)
    setError(null)

    try {
      await dataAccess.triggerSync()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sync failed")
    } finally {
      setIsLoading(false)
    }
  }

  return { triggerSync, isLoading, error }
}

// Initialize current sync system for signup
export async function initializeCurrentSync(userId: string) {
  try {
    const syncManager = SyncManager.getInstance()
    console.log("🚀 Initializing current sync system for signup...")

    // Perform initial sync (only for new users)
    const result = await syncManager.performInitialSync(userId)

    if (result.success) {
      console.log("✅ Current sync system initialized successfully")
      console.log(`📊 Synced ${result.itemsAdded} items`)
    } else {
      console.warn("⚠️ Current sync initialization completed with errors:", result.errors)
    }

    return result
  } catch (error) {
    console.error("❌ Failed to initialize current sync:", error)
    throw error
  }
}

// Load cached data for login
export async function loadCurrentSyncData(userId: string) {
  try {
    const syncManager = SyncManager.getInstance()
    console.log("📱 Loading current sync data for login...")

    // Check if there are server updates
    const hasUpdates = await syncManager.hasServerUpdates(userId)

    if (hasUpdates) {
      console.log("🔄 Server updates detected, performing sync...")
      const result = await syncManager.performIncrementalSync()
      return {
        success: result.success,
        hasData: true,
        message: `Synced ${result.itemsUpdated + result.itemsAdded} updates`,
        hadUpdates: true,
      }
    } else {
      console.log("📱 No server updates, loading cached data...")
      const result = await syncManager.loadCachedData(userId)
      return {
        ...result,
        hadUpdates: false,
      }
    }
  } catch (error) {
    console.error("❌ Failed to load current sync data:", error)
    throw error
  }
}
