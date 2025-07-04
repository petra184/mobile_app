import { useEffect } from "react"
import { Alert } from "react-native"
import * as Linking from "expo-linking"
import { supabase } from "@/lib/supabase"

export default function AuthCallback() {
  useEffect(() => {
    const handleUrl = async () => {
      const url = Linking.useLinkingURL()
      if (url) {
        const { error } = await supabase.auth.exchangeCodeForSession(url)
        if (error) Alert.alert("Error", error.message)
        else Alert.alert("Success", "You're signed in!")
      }
    }

    handleUrl()
  }, [])

  return null // Optionally add loading screen
}
