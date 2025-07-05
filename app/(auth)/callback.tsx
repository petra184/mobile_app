// "use client"
// import { useEffect } from "react"
// import { useRouter } from "expo-router"
// import { View, Text, ActivityIndicator, StyleSheet } from "react-native"
// import { supabase } from "@/lib/supabase"
// import { useNotifications } from "@/context/notification-context"
// import { colors } from "@/constants/colors"
// import { createCompleteUserRecord } from "@/app/actions/users"

// export default function AuthCallback() {
//   const router = useRouter()
//   const { showSuccess, showError } = useNotifications()

//   useEffect(() => {
//     handleAuthCallback()
//   }, [])

//   const handleAuthCallback = async () => {
//     console.log("🔄 Auth callback started")

//     try {
//       // Get the current session
//       console.log("🔍 Getting current session...")
//       const {
//         data: { session },
//         error: sessionError,
//       } = await supabase.auth.getSession()

//       if (sessionError) {
//         console.error("❌ Session error:", sessionError)
//         showError("Authentication Error", "Failed to authenticate. Please try again.")
//         router.push("./signup")
//         return
//       }

//       if (!session) {
//         console.error("❌ No session found")
//         showError("Authentication Error", "No valid session found. Please try again.")
//         router.push("./signup")
//         return
//       }

//       console.log("✅ Session found for user:", session.user.id)
//       console.log("📧 User email:", session.user.email)
//       console.log("📝 User metadata:", session.user.user_metadata)

//       // Get user metadata from the magic link
//       const userData = session.user.user_metadata
//       console.log("👤 Processing user data:", userData)

//       // Create user profile using the action
//       const profileResult = await createUserProfile(session.user.id, {
//         ...userData,
//         email: session.user.email,
//       })

//       if (!profileResult.success) {
//         console.error("❌ Profile creation failed:", profileResult.error)
//         showError("Profile Error", "Failed to create profile. Please contact support.")
//         return
//       }

//       console.log("✅ User profile and preferences created successfully!")
//       showSuccess("Welcome!", "Your account has been created successfully!")

//       // Navigate to main app
//       console.log("🏠 Navigating to main app...")
//       router.push("/")
//     } catch (error) {
//       console.error("💥 Auth callback error:", error)
//       showError("Authentication Error", "Something went wrong. Please try again.")
//       router.push("./signup")
//     }
//   }

//   return (
//     <View style={styles.container}>
//       <ActivityIndicator size="large" color={colors.primary} />
//       <Text style={styles.text}>Setting up your account...</Text>
//     </View>
//   )
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//     backgroundColor: "white",
//   },
//   text: {
//     marginTop: 16,
//     fontSize: 16,
//     color: "#666",
//   },
// })
