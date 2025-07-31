"use client"

import { useEffect, useState } from "react"
import { AppState } from "react-native"
import { initializeCurrentSync, loadCurrentSyncData, useSyncStatus, useSync } from "../index"

export function useCurrentSync() {
  const [isInitialized, setIsInitialized] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [initError, setInitError] = useState<string | null>(null)
  const syncStatus = useSyncStatus()
  const { triggerSync, isLoading: isSyncing, error: syncError } = useSync()

  // Initialize current sync for signup
  const initializeForSignup = async (userId: string) => {
    try {
      setIsLoading(true)
      setInitError(null)
      console.log("🚀 Initializing current sync for signup:", userId)

      const result = await initializeCurrentSync(userId)

      if (result.itemsAdded > 0) {
        setIsInitialized(true)
        console.log("✅ Current sync initialized successfully for signup")

        if (result.errors.length > 0) {
          console.warn("⚠️ Some tables failed to sync:", result.errors)
        }
      } else {
        setInitError("Failed to sync any data from server")
        console.error("❌ Current sync initialization failed:", result.errors)
      }

      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      setInitError(errorMessage)
      console.error("❌ Current sync initialization error:", error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  // Load data for login
  const loadForLogin = async (userId: string) => {
    try {
      setIsLoading(true)
      setInitError(null)
      console.log("📱 Loading current sync data for login:", userId)

      const result = await loadCurrentSyncData(userId)

      if (result.success && result.hasData) {
        setIsInitialized(true)
        console.log("✅ Current sync data loaded successfully:", result.message)

        if (result.hadUpdates) {
          console.log("🔄 Data was updated from server")
        } else {
          console.log("📱 Using cached data")
        }
      } else {
        console.log("⚠️ No cached data found, need to initialize...")
        // Fallback to initialization if no cached data
        return await initializeForSignup(userId)
      }

      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      setInitError(errorMessage)
      console.error("❌ Current sync load error:", error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  // Auto-sync when app becomes active (but only if needed)
  useEffect(() => {
    const handleAppStateChange = async (nextAppState: string) => {
      if (nextAppState === "active" && isInitialized) {
        console.log("📱 App became active, checking for sync...")

        try {
          const { SyncManager } = await import("../index")
          const syncManager = SyncManager.getInstance()
          const needsSync = await syncManager.isSyncNeeded()

          if (needsSync) {
            console.log("🔄 Sync needed, triggering...")
            triggerSync()
          } else {
            console.log("✅ No sync needed")
          }
        } catch (error) {
          console.error("Error checking sync need:", error)
        }
      }
    }

    const subscription = AppState.addEventListener("change", handleAppStateChange)
    return () => subscription?.remove()
  }, [isInitialized, triggerSync])

  return {
    isInitialized,
    isLoading,
    initError,
    syncStatus,
    triggerSync,
    isSyncing,
    syncError,
    initializeForSignup,
    loadForLogin,
  }
}
