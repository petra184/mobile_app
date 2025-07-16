import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import AsyncStorage from "@react-native-async-storage/async-storage"
import type { QRCodeScan } from "@/types/index"
import { v4 as uuidv4 } from "uuid"
// Import your database actions
import {
  getUserProfile,
  updateUserPoints,
  getUserScanHistory,
  addUserScan,
  updateUserPreferences,
  getUserPreferences,
  getUserById,
} from "@/app/actions/users"
import { getCurrentUser } from "@/app/actions/main_actions"

// Updated UserPreferences type
type UserPreferences = {
  favoriteTeams: string[]
  notificationsEnabled: boolean
  pushNotifications?: boolean
  emailNotifications?: boolean
  gameNotifications?: boolean
  newsNotifications?: boolean
  specialOffers?: boolean
}

interface UserState {
  // Data
  userId: string | null
  userEmail: string | null
  first_name: string | null
  last_name: string | null
  username: string | null
  profile_image_url: string | null
  points: number
  scanHistory: QRCodeScan[]
  preferences: UserPreferences

  // Remember Me functionality
  rememberMe: boolean

  // Loading states
  isLoading: boolean
  isPointsLoading: boolean
  isScanHistoryLoading: boolean

  // Actions
  setUser: (userId: string, email?: string, remember?: boolean) => Promise<void>
  initializeUser: (userId: string, email?: string) => Promise<void>
  refreshUserData: () => Promise<void>
  addPoints: (points: number, description: string) => Promise<void>
  redeemPoints: (points: number) => Promise<boolean>
  addScan: (scan: Omit<QRCodeScan, "id" | "scannedAt">) => Promise<void>
  toggleFavoriteTeam: (teamId: string) => Promise<void>

  // Updated notification methods
  setNotificationsEnabled: (enabled: boolean) => Promise<void>
  setPushNotifications: (enabled: boolean) => Promise<void>
  setEmailNotifications: (enabled: boolean) => Promise<void>
  setGameNotifications: (enabled: boolean) => Promise<void>
  setNewsNotifications: (enabled: boolean) => Promise<void>
  setSpecialOffers: (enabled: boolean) => Promise<void>
  updateNotificationPreference: (key: keyof UserPreferences, enabled: boolean) => Promise<void>

  clearUserData: () => void
  isUserLoggedIn: () => boolean
  getUserName: () => string
  getUserFirstName: () => string
  shouldAutoLogin: () => boolean
}

function capitalize(name: string) {
  return name.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase())
}

// Default preferences with all notification types
const defaultPreferences: UserPreferences = {
  favoriteTeams: [],
  notificationsEnabled: true,
  pushNotifications: true,
  emailNotifications: true,
  gameNotifications: true,
  newsNotifications: true,
  specialOffers: false,
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      // Initial state
      userId: null,
      userEmail: null,
      first_name: null,
      last_name: null,
      username: null,
      profile_image_url: null,
      points: 0,
      scanHistory: [],
      preferences: defaultPreferences,
      rememberMe: false,
      isLoading: false,
      isPointsLoading: false,
      isScanHistoryLoading: false,

      getUserFirstName: () => {
        const { first_name } = get()
        if (first_name) {
          return capitalize(first_name)
        }
        return "User"
      },

      getUserName: () => {
        const { first_name, last_name } = get()
        if (first_name && last_name) {
          return `${capitalize(first_name)} ${capitalize(last_name)}`
        } else if (first_name) {
          return capitalize(first_name)
        } else if (last_name) {
          return capitalize(last_name)
        }
        return "User"
      },

      setUser: async (userId: string, email?: string, remember = false) => {
        set({
          userId,
          userEmail: email,
          rememberMe: remember,
        })
        await get().initializeUser(userId, email)
      },

      initializeUser: async (userId: string, email?: string) => {
        set({ isLoading: true, userId, userEmail: email })
        try {
          const [userProfile, scanHistory, userPreferences, authUserData, userData] = await Promise.all([
            getUserProfile(userId),
            getUserScanHistory(userId),
            getUserPreferences(userId),
            getCurrentUser(),
            getUserById(userId),
          ])

          const firstName = userProfile?.first_name || userData?.first_name || authUserData?.first_name || null
          const lastName = userProfile?.last_name || userData?.last_name || authUserData?.last_name || null
          const username = userData?.username || authUserData?.username || null
          const profileImageUrl = userData?.profile_image_url || null

          // Merge user preferences with defaults to ensure all notification types are present
          const mergedPreferences: UserPreferences = {
            ...defaultPreferences,
            ...userPreferences,
          }

          set({
            first_name: firstName,
            last_name: lastName,
            username: username,
            profile_image_url: profileImageUrl,
            points: userProfile?.points || 0,
            scanHistory: scanHistory || [],
            preferences: mergedPreferences,
            isLoading: false,
          })
        } catch (error) {
          console.error("Failed to initialize user data:", error)
          set({ isLoading: false })
        }
      },

      shouldAutoLogin: () => {
        const { userId, rememberMe } = get()
        return !!(userId && rememberMe)
      },

      isUserLoggedIn: () => {
        return get().shouldAutoLogin()
      },

      refreshUserData: async () => {
        const { userId } = get()
        if (!userId) return

        try {
          const [userProfile, authUserData, userData, userPreferences] = await Promise.all([
            getUserProfile(userId),
            getCurrentUser(),
            getUserById(userId),
            getUserPreferences(userId), // Also refresh preferences
          ])

          const firstName = userProfile?.first_name || userData?.first_name || authUserData?.first_name || null
          const lastName = userProfile?.last_name || userData?.last_name || authUserData?.last_name || null
          const username = userData?.username || authUserData?.username || null
          const profileImageUrl = userData?.profile_image_url || null

          // Merge refreshed preferences
          const mergedPreferences: UserPreferences = {
            ...defaultPreferences,
            ...userPreferences,
          }

          set({
            first_name: firstName,
            last_name: lastName,
            username: username,
            profile_image_url: profileImageUrl,
            points: userProfile?.points || 0,
            preferences: mergedPreferences, // Update preferences too
          })
        } catch (error) {
          console.error("Failed to refresh user data:", error)
        }
      },

      addPoints: async (points: number, description: string) => {
        const { userId } = get()
        if (!userId) return

        set({ isPointsLoading: true })
        try {
          set((state) => ({
            points: state.points + points,
          }))
          await updateUserPoints(userId, points, "add")
          await get().addScan({ points, description })
        } catch (error) {
          console.error("Failed to add points:", error)
          set((state) => ({
            points: state.points - points,
          }))
        } finally {
          set({ isPointsLoading: false })
        }
      },

      redeemPoints: async (points: number) => {
        const { userId, points: currentPoints } = get()
        if (!userId) return false
        if (currentPoints < points) {
          return false
        }

        set({ isPointsLoading: true })
        try {
          set((state) => ({
            points: state.points - points,
          }))
          await updateUserPoints(userId, points, "subtract")
          return true
        } catch (error) {
          console.error("Failed to redeem points:", error)
          set((state) => ({
            points: state.points + points,
          }))
          return false
        } finally {
          set({ isPointsLoading: false })
        }
      },

      addScan: async (scan: Omit<QRCodeScan, "id" | "scannedAt">) => {
      const { userId } = get()
      if (!userId) return

      try {
        const newScan: QRCodeScan = {
          id: uuidv4(),
          ...scan,
          scannedAt: new Date().toISOString(),
        }

        set((state) => ({
          scanHistory: [
            newScan,
            ...state.scanHistory.filter((existing) => existing.id !== newScan.id), // 🧼 prevent duplicate
          ],
        }))

        await addUserScan(userId, newScan)
      } catch (error) {
        console.error("Failed to add scan:", error)
        set((state) => ({
          scanHistory: state.scanHistory.slice(1), // remove the failed scan
        }))
      }
    },

      toggleFavoriteTeam: async (teamId: string) => {
        const { userId, preferences } = get()
        if (!userId) return

        try {
          const isFavorite = preferences.favoriteTeams.includes(teamId)
          const favoriteTeams = isFavorite
            ? preferences.favoriteTeams.filter((id) => id !== teamId)
            : [...preferences.favoriteTeams, teamId]

          const newPreferences = {
            ...preferences,
            favoriteTeams,
          }

          set({ preferences: newPreferences })
          await updateUserPreferences(userId, newPreferences)
        } catch (error) {
          console.error("Failed to toggle favorite team:", error)
          try {
            const userPreferences = await getUserPreferences(userId)
            set({
              preferences: { ...defaultPreferences, ...userPreferences },
            })
          } catch (refreshError) {
            console.error("Failed to refresh preferences after error:", refreshError)
          }
          throw error
        }
      },

      // Generic function to update any notification preference
      updateNotificationPreference: async (key: keyof UserPreferences, enabled: boolean) => {
        const { userId, preferences } = get()
        if (!userId) {
          console.error("No userId found when trying to update notification preference")
          return
        }
        try {
          const newPreferences = {
            ...preferences,
            [key]: enabled,
          }

          // Update local state first
          set({ preferences: newPreferences })

          // Then save to database
          await updateUserPreferences(userId, newPreferences)
        } catch (error) {
          console.error(`Failed to update ${key}:`, error)
          // Revert the change
          set((state) => ({
            preferences: {
              ...state.preferences,
              [key]: !enabled,
            },
          }))
          throw error
        }
      },

      // Master notifications toggle
      setNotificationsEnabled: async (enabled: boolean) => {
        await get().updateNotificationPreference("notificationsEnabled", enabled)
      },

      // Individual notification type setters
      setPushNotifications: async (enabled: boolean) => {
        await get().updateNotificationPreference("pushNotifications", enabled)
      },

      setEmailNotifications: async (enabled: boolean) => {
        await get().updateNotificationPreference("emailNotifications", enabled)
      },

      setGameNotifications: async (enabled: boolean) => {
        await get().updateNotificationPreference("gameNotifications", enabled)
      },

      setNewsNotifications: async (enabled: boolean) => {
        await get().updateNotificationPreference("newsNotifications", enabled)
      },

      setSpecialOffers: async (enabled: boolean) => {
        await get().updateNotificationPreference("specialOffers", enabled)
      },

      clearUserData: () => {
        set({
          userId: null,
          userEmail: null,
          first_name: null,
          last_name: null,
          username: null,
          profile_image_url: null,
          points: 0,
          scanHistory: [],
          preferences: defaultPreferences,
          rememberMe: false,
          isLoading: false,
          isPointsLoading: false,
          isScanHistoryLoading: false,
        })
      },
    }),
    {
      name: "user-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => {
        const baseData = {
          userEmail: state.userEmail,
          first_name: state.first_name,
          last_name: state.last_name,
          username: state.username,
          profile_image_url: state.profile_image_url,
          points: state.points,
          scanHistory: state.scanHistory,
          preferences: state.preferences,
          rememberMe: state.rememberMe,
        }

        if (state.rememberMe) {
          return {
            ...baseData,
            userId: state.userId,
          }
        }
        return baseData
      },
    },
  ),
)