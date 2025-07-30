"use client"

import { useEffect, useState } from "react"
import { AppState } from "react-native"
import { supabase } from "@/lib/supabase"
import { initializeVersionControl, useSyncStatus, useSync } from "../index"

export function useVersionControl() {
  const [isInitialized, setIsInitialized] = useState(false)
  const [initError, setInitError] = useState<string | null>(null)
  const syncStatus = useSyncStatus()
  const { triggerSync, isLoading: isSyncing, error: syncError } = useSync()

  // Initialize version control when user is authenticated
  useEffect(() => {
    const initializeVC = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (session?.user) {
          console.log("🚀 Initializing version control for user:", session.user.id)

          const result = await initializeVersionControl(session.user.id)

          // Consider it successful if we synced at least some data
          if (result.itemsAdded > 0) {
            setIsInitialized(true)
            console.log("✅ Version control initialized successfully")

            if (result.errors.length > 0) {
              console.warn("⚠️ Some tables failed to sync:", result.errors)
            }
          } else {
            setInitError("Failed to sync any data from server")
            console.error("❌ Version control initialization failed:", result.errors)
          }
        }
      } catch (error) {
        setInitError(error instanceof Error ? error.message : "Unknown error")
        console.error("❌ Version control initialization error:", error)
      }
    }

    initializeVC()
  }, [])

  // Auto-sync when app becomes active
  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === "active" && isInitialized) {
        console.log("📱 App became active, checking for sync...")
        triggerSync()
      }
    }

    const subscription = AppState.addEventListener("change", handleAppStateChange)
    return () => subscription?.remove()
  }, [isInitialized, triggerSync])

  return {
    isInitialized,
    initError,
    syncStatus,
    triggerSync,
    isSyncing,
    syncError,
  }
}
