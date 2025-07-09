"use client"

import { useEffect, useCallback } from "react"
import { useCompleteDataStore } from "./dataStore"
import { useEnhancedRealtime } from "@/hooks/realtime/new_realtime"
import * as Notifications from "expo-notifications"

// Configure notifications with all required properties
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
})

export const useRealtimeNotifications = (currentUserId?: string) => {
  const { refreshData } = useCompleteDataStore(currentUserId)

  // Send push notification
  const sendPushNotification = useCallback(async (title: string, body: string, data?: any) => {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: true,
        },
        trigger: null, // Show immediately
      })
    } catch (error) {
      console.error("❌ Error sending push notification:", error)
    }
  }, [])

  // Handle different types of real-time updates
  const handleGameUpdate = useCallback(
    async (event: "INSERT" | "UPDATE" | "DELETE", payload: any) => {
      console.log(`🏈 Real-time game ${event.toLowerCase()}:`, payload)

      let title = "Game Update"
      let body = ""

      switch (event) {
        case "INSERT":
          title = "New Game Scheduled"
          body = "A new game has been added to the schedule"
          break
        case "UPDATE":
          title = "Game Updated"
          body = "Game information has been updated"
          if (payload.new?.status === "live") {
            title = "Game Started!"
            body = "A game is now live"
          }
          break
        case "DELETE":
          title = "Game Cancelled"
          body = "A scheduled game has been cancelled"
          break
      }

      await sendPushNotification(title, body, { type: "game", data: payload })
      await refreshData()
    },
    [sendPushNotification, refreshData],
  )

  const handleRewardUpdate = useCallback(
    async (event: "INSERT" | "UPDATE" | "DELETE", payload: any) => {
      console.log(`🎁 Real-time reward ${event.toLowerCase()}:`, payload)

      if (event === "INSERT") {
        await sendPushNotification("New Reward Available!", `Check out: ${payload.new?.title}`, {
          type: "reward",
          data: payload,
        })
      }

      await refreshData()
    },
    [sendPushNotification, refreshData],
  )

  const handleSpecialOfferUpdate = useCallback(
    async (event: "INSERT" | "UPDATE" | "DELETE", payload: any) => {
      console.log(`🔥 Real-time special offer ${event.toLowerCase()}:`, payload)

      if (event === "INSERT") {
        await sendPushNotification("Limited Time Offer!", `${payload.new?.title}`, {
          type: "special_offer",
          data: payload,
        })
      }

      await refreshData()
    },
    [sendPushNotification, refreshData],
  )

  const handleStoryUpdate = useCallback(
    async (event: "INSERT" | "UPDATE" | "DELETE", payload: any) => {
      console.log(`📰 Real-time story ${event.toLowerCase()}:`, payload)

      if (event === "INSERT") {
        await sendPushNotification("Breaking News!", `${payload.new?.title}`, {
          type: "story",
          data: payload,
        })
      }

      await refreshData()
    },
    [sendPushNotification, refreshData],
  )

  const handlePromotionUpdate = useCallback(
    async (event: "INSERT" | "UPDATE" | "DELETE", payload: any) => {
      console.log(`🎉 Real-time promotion ${event.toLowerCase()}:`, payload)

      if (event === "INSERT") {
        await sendPushNotification("New Promotion!", `${payload.new?.title} - ${payload.new?.discount_value}% off`, {
          type: "promotion",
          data: payload,
        })
      }

      await refreshData()
    },
    [sendPushNotification, refreshData],
  )

  const handlePointsUpdate = useCallback(
    async (event: "INSERT" | "UPDATE" | "DELETE", payload: any) => {
      console.log(`💰 Real-time points ${event.toLowerCase()}:`, payload)

      if (event === "INSERT" && payload.new?.points_change > 0) {
        await sendPushNotification(
          "Points Earned!",
          `You earned ${payload.new.points_change} points: ${payload.new.description}`,
          { type: "points", data: payload },
        )
      }

      await refreshData()
    },
    [sendPushNotification, refreshData],
  )

  // Use the enhanced realtime hook with all callbacks
  const { setupRealtimeSubscriptions, cleanupSubscriptions, isConnected, connectionStatus } = useEnhancedRealtime(
    {
      onGameUpdate: handleGameUpdate,
      onStoryUpdate: handleStoryUpdate,
      onRewardUpdate: handleRewardUpdate,
      onSpecialOfferUpdate: handleSpecialOfferUpdate,
      onPromotionUpdate: handlePromotionUpdate,
      onPointsUpdate: handlePointsUpdate,
    },
    currentUserId,
  )

  // Setup subscriptions when component mounts
  useEffect(() => {
    if (!currentUserId) return

    console.log("🔌 Setting up enhanced realtime subscriptions...")
    setupRealtimeSubscriptions()

    return () => {
      console.log("🔌 Cleaning up enhanced realtime subscriptions...")
      cleanupSubscriptions()
    }
  }, [currentUserId, setupRealtimeSubscriptions, cleanupSubscriptions])

  return {
    sendPushNotification,
    isConnected,
    connectionStatus,
  }
}
