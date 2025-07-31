"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { StorageManager } from "../index"
import { useCurrentSync } from "./useCurrentS"
import { useUserStore } from "@/hooks/userStore"
import { User } from "@supabase/supabase-js"

export function useAuthWithSync() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true)
  const { initializeForSignup, loadForLogin } = useCurrentSync()
  const { setUser: setUserStore, clearUserData } = useUserStore()

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("🔐 Auth state changed:", event)
      setUser(session?.user ?? null)

      if (event === "SIGNED_IN" && session?.user) {
        try {
          const userId = session.user.id
          const userEmail = session.user.email

          // Set user in store first
          await setUserStore(userId, userEmail, true)

          // Check if this is a new signup or returning login
          const { StorageManager } = await import("../index")
          const storage = StorageManager.getInstance()
          const isInitialized = await storage.isUserInitialized(userId)

          if (!isInitialized) {
            console.log("🆕 New user signup - initializing current sync...")
            await initializeForSignup(userId)
          } else {
            console.log("👋 Returning user login - loading current sync data...")
            await loadForLogin(userId)
          }
        } catch (error) {
          console.error("Failed to handle auth state change:", error)
        }
      } else if (event === "SIGNED_OUT") {
        // Clear cached data when user signs out
        try {
          const storage = StorageManager.getInstance()
          await storage.clearAllData()
          clearUserData()
          console.log("✅ Cleared all cached data on sign out")
        } catch (error) {
          console.error("Failed to clear cached data:", error)
        }
      }
    })

    return () => subscription.unsubscribe()
  }, [initializeForSignup, loadForLogin, setUserStore, clearUserData])

  return { user, loading }
}
