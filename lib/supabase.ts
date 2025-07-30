import { AppState, Platform } from "react-native"
import { createClient } from "@supabase/supabase-js"
import * as SecureStore from "expo-secure-store"

const ExpoSecureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
}
const supabaseUrl = "https://xptyaqqaagptqppjdiyn.supabase.co"
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhwdHlhcXFhYWdwdHFwcGpkaXluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA0MDg2NTAsImV4cCI6MjA1NTk4NDY1MH0.sldn7AS2cCKSLdHRGOXe-P68IY9IGcjoxnzAMyqiTr8"

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: Platform.OS === "web" ? undefined : ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})

// Refresh auth session when app is in foreground
AppState.addEventListener("change", (state) => {
  if (state === "active") {
    supabase.auth.startAutoRefresh()
  } else {
    supabase.auth.stopAutoRefresh()
  }
})