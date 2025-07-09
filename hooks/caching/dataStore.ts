"use client"

import { useState, useEffect, useCallback } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { supabase } from "@/lib/supabase"
import { useNotifications } from "@/context/notification-context"
import type { CompleteDataStore, DataStoreActions } from "@/types/database"

// Storage keys for all data types
const STORAGE_KEYS = {
  // Core entities
  GAMES: "cached_games",
  TEAMS: "cached_teams",
  PLAYERS: "cached_players",
  COACHES: "cached_coaches",
  STORIES: "cached_stories",
  SCHOOLS: "cached_schools",
  OPPOSING_TEAMS: "cached_opposing_teams",

  // Rewards & Store
  REWARDS: "cached_rewards",
  SPECIAL_OFFERS: "cached_special_offers",
  STORE_PRODUCTS: "cached_store_products",
  BIRTHDAY_PACKAGES: "cached_birthday_packages",
  PROMOTIONS: "cached_promotions",

  // User data
  USER_PROFILE: "cached_user_profile",
  USER_STATUS: "cached_user_status",
  USER_PREFERENCES: "cached_user_preferences",
  USER_ACHIEVEMENTS: "cached_user_achievements",
  SCAN_HISTORY: "cached_scan_history",
  POINTS_TRANSACTIONS: "cached_points_transactions",

  // Activities
  HALFTIME_ACTIVITIES: "cached_halftime_activities",
  ACTIVITY_HISTORY: "cached_activity_history",

  // Photos & Other
  TEAM_PHOTOS: "cached_team_photos",
  QR_CODES: "cached_qr_codes",
  BIRTHDAY_FAQS: "cached_birthday_faqs",

  // Metadata
  LAST_SYNC: "last_complete_sync",
  USER_INITIALIZED: "complete_data_initialized",
}

// Cache expiry time (12 hours)
const CACHE_EXPIRY_TIME = 12 * 60 * 60 * 1000

export const useCompleteDataStore = (currentUserId?: string): CompleteDataStore & DataStoreActions => {
  const [dataStore, setDataStore] = useState<CompleteDataStore>({
    // Core entities
    games: [],
    teams: [],
    players: [],
    coaches: [],
    stories: [],
    schools: [],
    opposingTeams: [],

    // Rewards & Store
    rewards: [],
    specialOffers: [],
    storeProducts: [],
    birthdayPackages: [],
    promotions: [],

    // User data
    userProfile: null,
    userStatus: null,
    userPreferences: null,
    userAchievements: [],
    scanHistory: [],
    pointsTransactions: [],

    // Activities
    halftimeActivities: [],
    activityHistory: [],

    // Photos & Other
    teamPhotos: [],
    qrCodes: [],
    birthdayFAQs: [],

    // Metadata
    lastSync: null,
    loading: true,
    initialized: false,
  })

  const { showInfo, showSuccess } = useNotifications()

  // Check if data is stale
  const isDataStale = useCallback(() => {
    if (!dataStore.lastSync) return true
    return Date.now() - dataStore.lastSync.getTime() > CACHE_EXPIRY_TIME
  }, [dataStore.lastSync])

  // Load all data from cache
  const loadFromCache = useCallback(async () => {
    try {
      console.log("📱 Loading complete data from cache...")

      const cacheKeys = Object.values(STORAGE_KEYS)
      const cachedData = await AsyncStorage.multiGet(cacheKeys)

      const cacheMap = new Map(cachedData)
      const userInitialized = cacheMap.get(STORAGE_KEYS.USER_INITIALIZED)

      if (userInitialized !== "true") {
        console.log("❌ User not initialized in cache")
        return false
      }

      const parseData = (key: string, fallback: any = []) => {
        const data = cacheMap.get(key)
        return data ? JSON.parse(data) : fallback
      }

      const lastSyncStr = cacheMap.get(STORAGE_KEYS.LAST_SYNC)
      const lastSync = lastSyncStr ? new Date(lastSyncStr) : null

      setDataStore((prev) => ({
        ...prev,
        // Core entities
        games: parseData(STORAGE_KEYS.GAMES),
        teams: parseData(STORAGE_KEYS.TEAMS),
        players: parseData(STORAGE_KEYS.PLAYERS),
        coaches: parseData(STORAGE_KEYS.COACHES),
        stories: parseData(STORAGE_KEYS.STORIES),
        schools: parseData(STORAGE_KEYS.SCHOOLS),
        opposingTeams: parseData(STORAGE_KEYS.OPPOSING_TEAMS),

        // Rewards & Store
        rewards: parseData(STORAGE_KEYS.REWARDS),
        specialOffers: parseData(STORAGE_KEYS.SPECIAL_OFFERS),
        storeProducts: parseData(STORAGE_KEYS.STORE_PRODUCTS),
        birthdayPackages: parseData(STORAGE_KEYS.BIRTHDAY_PACKAGES),
        promotions: parseData(STORAGE_KEYS.PROMOTIONS),

        // User data
        userProfile: parseData(STORAGE_KEYS.USER_PROFILE, null),
        userStatus: parseData(STORAGE_KEYS.USER_STATUS, null),
        userPreferences: parseData(STORAGE_KEYS.USER_PREFERENCES, null),
        userAchievements: parseData(STORAGE_KEYS.USER_ACHIEVEMENTS),
        scanHistory: parseData(STORAGE_KEYS.SCAN_HISTORY),
        pointsTransactions: parseData(STORAGE_KEYS.POINTS_TRANSACTIONS),

        // Activities
        halftimeActivities: parseData(STORAGE_KEYS.HALFTIME_ACTIVITIES),
        activityHistory: parseData(STORAGE_KEYS.ACTIVITY_HISTORY),

        // Photos & Other
        teamPhotos: parseData(STORAGE_KEYS.TEAM_PHOTOS),
        qrCodes: parseData(STORAGE_KEYS.QR_CODES),
        birthdayFAQs: parseData(STORAGE_KEYS.BIRTHDAY_FAQS),

        // Metadata
        lastSync,
        initialized: true,
      }))

      console.log("✅ Complete data loaded from cache")
      return true
    } catch (error) {
      console.error("❌ Error loading from cache:", error)
      return false
    }
  }, [])

  // Save all data to cache
  const saveToCache = useCallback(async (newDataStore: Partial<CompleteDataStore>) => {
    try {
      console.log("💾 Saving complete data to cache...")

      const timestamp = new Date().toISOString()

      const dataToSave: [string, string][] = [
        // Core entities
        [STORAGE_KEYS.GAMES, JSON.stringify(newDataStore.games || [])],
        [STORAGE_KEYS.TEAMS, JSON.stringify(newDataStore.teams || [])],
        [STORAGE_KEYS.PLAYERS, JSON.stringify(newDataStore.players || [])],
        [STORAGE_KEYS.COACHES, JSON.stringify(newDataStore.coaches || [])],
        [STORAGE_KEYS.STORIES, JSON.stringify(newDataStore.stories || [])],
        [STORAGE_KEYS.SCHOOLS, JSON.stringify(newDataStore.schools || [])],
        [STORAGE_KEYS.OPPOSING_TEAMS, JSON.stringify(newDataStore.opposingTeams || [])],

        // Rewards & Store
        [STORAGE_KEYS.REWARDS, JSON.stringify(newDataStore.rewards || [])],
        [STORAGE_KEYS.SPECIAL_OFFERS, JSON.stringify(newDataStore.specialOffers || [])],
        [STORAGE_KEYS.STORE_PRODUCTS, JSON.stringify(newDataStore.storeProducts || [])],
        [STORAGE_KEYS.BIRTHDAY_PACKAGES, JSON.stringify(newDataStore.birthdayPackages || [])],
        [STORAGE_KEYS.PROMOTIONS, JSON.stringify(newDataStore.promotions || [])],

        // User data
        [STORAGE_KEYS.USER_PROFILE, JSON.stringify(newDataStore.userProfile)],
        [STORAGE_KEYS.USER_STATUS, JSON.stringify(newDataStore.userStatus)],
        [STORAGE_KEYS.USER_PREFERENCES, JSON.stringify(newDataStore.userPreferences)],
        [STORAGE_KEYS.USER_ACHIEVEMENTS, JSON.stringify(newDataStore.userAchievements || [])],
        [STORAGE_KEYS.SCAN_HISTORY, JSON.stringify(newDataStore.scanHistory || [])],
        [STORAGE_KEYS.POINTS_TRANSACTIONS, JSON.stringify(newDataStore.pointsTransactions || [])],

        // Activities
        [STORAGE_KEYS.HALFTIME_ACTIVITIES, JSON.stringify(newDataStore.halftimeActivities || [])],
        [STORAGE_KEYS.ACTIVITY_HISTORY, JSON.stringify(newDataStore.activityHistory || [])],

        // Photos & Other
        [STORAGE_KEYS.TEAM_PHOTOS, JSON.stringify(newDataStore.teamPhotos || [])],
        [STORAGE_KEYS.QR_CODES, JSON.stringify(newDataStore.qrCodes || [])],
        [STORAGE_KEYS.BIRTHDAY_FAQS, JSON.stringify(newDataStore.birthdayFAQs || [])],

        // Metadata
        [STORAGE_KEYS.LAST_SYNC, timestamp],
        [STORAGE_KEYS.USER_INITIALIZED, "true"],
      ]

      await AsyncStorage.multiSet(dataToSave)

      setDataStore((prev) => ({
        ...prev,
        ...newDataStore,
        lastSync: new Date(timestamp),
      }))

      console.log("✅ Complete data saved to cache")
    } catch (error) {
      console.error("❌ Error saving to cache:", error)
    }
  }, [])

  // Fetch all fresh data from Supabase
  const fetchFreshData = useCallback(async () => {
    try {
      console.log("🔄 Fetching complete fresh data from Supabase...")

      // Fetch all core data in parallel
      const [
        gamesData,
        teamsData,
        playersData,
        coachesData,
        storiesData,
        schoolsData,
        opposingTeamsData,
        rewardsData,
        specialOffersData,
        storeProductsData,
        birthdayPackagesData,
        promotionsData,
        halftimeActivitiesData,
        teamPhotosData,
        qrCodesData,
        birthdayFAQsData,
      ] = await Promise.all([
        // Core entities
        supabase
          .from("game_schedule")
          .select("*")
          .order("date", { ascending: true }),
        supabase.from("teams").select("*").order("name", { ascending: true }),
        supabase.from("players").select("*").order("last_name", { ascending: true }),
        supabase.from("coaches").select("*").order("last_name", { ascending: true }),
        supabase.from("stories").select("*").order("created_at", { ascending: false }),
        supabase.from("SCHOOLS").select("*").order("school_name", { ascending: true }),
        supabase.from("opposing_teams").select("*").order("name", { ascending: true }),

        // Rewards & Store
        supabase
          .from("rewards")
          .select("*")
          .eq("is_active", true)
          .order("points_required", { ascending: true }),
        supabase.from("special_offers").select("*").eq("is_active", true).order("points_required", { ascending: true }),
        supabase.from("store_products").select("*").eq("is_active", true).order("name", { ascending: true }),
        supabase.from("birthday_packages").select("*").eq("is_active", true).order("price", { ascending: true }),
        supabase.from("promotions").select("*").eq("is_active", true).order("created_at", { ascending: false }),

        // Activities
        supabase
          .from("halftime_activities")
          .select("*")
          .eq("is_active", true)
          .order("name", { ascending: true }),

        // Photos & Other
        supabase
          .from("team_photos")
          .select("*")
          .order("display_order", { ascending: true }),
        supabase.from("QR_CODES").select("*").order("date", { ascending: false }),
        supabase.from("birthday_faqs").select("*").order("created_at", { ascending: true }),
      ])

      // Check for errors
      const errors = [
        gamesData.error,
        teamsData.error,
        playersData.error,
        coachesData.error,
        storiesData.error,
        schoolsData.error,
        opposingTeamsData.error,
        rewardsData.error,
        specialOffersData.error,
        storeProductsData.error,
        birthdayPackagesData.error,
        promotionsData.error,
        halftimeActivitiesData.error,
        teamPhotosData.error,
        qrCodesData.error,
        birthdayFAQsData.error,
      ].filter(Boolean)

      if (errors.length > 0) {
        console.error("❌ Errors fetching data:", errors)
        throw new Error(`Failed to fetch data: ${errors.map((e) => e?.message).join(", ")}`)
      }

      const newDataStore: Partial<CompleteDataStore> = {
        // Core entities
        games: gamesData.data || [],
        teams: teamsData.data || [],
        players: playersData.data || [],
        coaches: coachesData.data || [],
        stories: storiesData.data || [],
        schools: schoolsData.data || [],
        opposingTeams: opposingTeamsData.data || [],

        // Rewards & Store
        rewards: rewardsData.data || [],
        specialOffers: specialOffersData.data || [],
        storeProducts: storeProductsData.data || [],
        birthdayPackages: birthdayPackagesData.data || [],
        promotions: promotionsData.data || [],

        // Activities
        halftimeActivities: halftimeActivitiesData.data || [],

        // Photos & Other
        teamPhotos: teamPhotosData.data || [],
        qrCodes: qrCodesData.data || [],
        birthdayFAQs: birthdayFAQsData.data || [],

        // Initialize user data as empty (will be fetched separately)
        userProfile: null,
        userStatus: null,
        userPreferences: null,
        userAchievements: [],
        scanHistory: [],
        pointsTransactions: [],
        activityHistory: [],

        initialized: true,
      }

      // Fetch user-specific data if userId is provided
      if (currentUserId) {
        await getUserData(currentUserId, newDataStore)
      }

      // Save to cache
      await saveToCache(newDataStore)

      console.log("✅ Complete fresh data fetched and cached")
      return newDataStore
    } catch (error) {
      console.error("❌ Error fetching fresh data:", error)
      showInfo("Sync Error", "Failed to sync data. Using cached version.")
      throw error
    }
  }, [currentUserId, saveToCache, showInfo])

  // Fetch user-specific data
  const getUserData = useCallback(async (userId: string, targetStore?: Partial<CompleteDataStore>) => {
    try {
      console.log("👤 Fetching user-specific data for:", userId)

      const [
        userProfileData,
        userStatusData,
        userPreferencesData,
        userAchievementsData,
        scanHistoryData,
        pointsTransactionsData,
        activityHistoryData,
      ] = await Promise.all([
        supabase.from("user_profiles_with_stats").select("*").eq("user_id", userId).single(),
        supabase.from("user_status").select("*").eq("user_id", userId).single(),
        supabase.from("user_preferences").select("*").eq("user_id", userId).single(),
        supabase.from("user_achievements").select("*").eq("user_id", userId).order("earned_at", { ascending: false }),
        supabase
          .from("scan_history")
          .select("*")
          .eq("user_id", userId)
          .order("scanned_at", { ascending: false })
          .limit(100),
        supabase
          .from("points_transactions")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(100),
        supabase
          .from("activity_history")
          .select("*")
          .eq("user_id", userId)
          .order("attendance_id", { ascending: false })
          .limit(50),
      ])

      const userData = {
        userProfile: userProfileData.data,
        userStatus: userStatusData.data,
        userPreferences: userPreferencesData.data,
        userAchievements: userAchievementsData.data || [],
        scanHistory: scanHistoryData.data || [],
        pointsTransactions: pointsTransactionsData.data || [],
        activityHistory: activityHistoryData.data || [],
      }

      if (targetStore) {
        Object.assign(targetStore, userData)
      } else {
        setDataStore((prev) => ({
          ...prev,
          ...userData,
        }))
      }

      console.log("✅ User data fetched")
    } catch (error) {
      console.error("❌ Error fetching user data:", error)
    }
  }, [])

  // Refresh all data
  const refreshData = useCallback(async () => {
    setDataStore((prev) => ({ ...prev, loading: true }))
    try {
      await fetchFreshData()
      showSuccess("Data Synced", "All data has been updated successfully")
    } catch (error) {
      await loadFromCache()
    } finally {
      setDataStore((prev) => ({ ...prev, loading: false }))
    }
  }, [fetchFreshData, loadFromCache, showSuccess])

  // Clear all cache
  const clearCache = useCallback(async () => {
    try {
      const allKeys = Object.values(STORAGE_KEYS)
      await AsyncStorage.multiRemove(allKeys)

      setDataStore({
        games: [],
        teams: [],
        players: [],
        coaches: [],
        stories: [],
        schools: [],
        opposingTeams: [],
        rewards: [],
        specialOffers: [],
        storeProducts: [],
        birthdayPackages: [],
        promotions: [],
        userProfile: null,
        userStatus: null,
        userPreferences: null,
        userAchievements: [],
        scanHistory: [],
        pointsTransactions: [],
        halftimeActivities: [],
        activityHistory: [],
        teamPhotos: [],
        qrCodes: [],
        birthdayFAQs: [],
        lastSync: null,
        loading: false,
        initialized: false,
      })

      console.log("🗑️ Complete cache cleared")
    } catch (error) {
      console.error("❌ Error clearing cache:", error)
    }
  }, [])

  // Initialize data on first load
  useEffect(() => {
    const initializeData = async () => {
      setDataStore((prev) => ({ ...prev, loading: true }))

      try {
        const cacheLoaded = await loadFromCache()

        if (cacheLoaded && !isDataStale()) {
          console.log("📱 Using fresh cached data")
          setDataStore((prev) => ({ ...prev, loading: false }))
        } else {
          console.log("🔄 Cache is stale or missing, fetching fresh data")
          await fetchFreshData()
          setDataStore((prev) => ({ ...prev, loading: false }))
        }
      } catch (error) {
        console.log("⚠️ Fresh fetch failed, trying cache fallback")
        const cacheLoaded = await loadFromCache()
        if (!cacheLoaded) {
          showInfo("Connection Error", "Unable to load data. Please check your connection.")
        }
        setDataStore((prev) => ({ ...prev, loading: false }))
      }
    }

    initializeData()
  }, [loadFromCache, fetchFreshData, isDataStale, showInfo])

  // Fetch user data when userId changes
  useEffect(() => {
    if (currentUserId && dataStore.initialized) {
      getUserData(currentUserId)
    }
  }, [currentUserId, dataStore.initialized, getUserData])

  return {
    ...dataStore,
    refreshData,
    clearCache,
    isDataStale,
    getUserData,
  }
}
