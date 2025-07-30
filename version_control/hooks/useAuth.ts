"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { initializeVersionControl, StorageManager } from "../index"
import { type User } from "@supabase/supabase-js"

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

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
      setUser(session?.user ?? null)

      if (event === "SIGNED_IN" && session?.user) {
        // Initialize version control for new user
        try {
          await initializeVersionControl(session.user.id)
        } catch (error) {
          console.error("Failed to initialize version control:", error)
        }
      } else if (event === "SIGNED_OUT") {
        // Clear cached data when user signs out
        try {
          const storage = StorageManager.getInstance()
          await storage.clearAllData()
        } catch (error) {
          console.error("Failed to clear cached data:", error)
        }
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  return { user, loading }
}
