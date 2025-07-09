"use client"

import { useState, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import type { RealtimeChannel } from "@supabase/supabase-js"

// Define types for the callback functions
type RealtimeEvent = "INSERT" | "UPDATE" | "DELETE"
type GameUpdateCallback = (event: RealtimeEvent, payload: any) => void
type StoryUpdateCallback = (event: RealtimeEvent, payload: any) => void
type RewardUpdateCallback = (event: RealtimeEvent, payload: any) => void
type SpecialOfferUpdateCallback = (event: RealtimeEvent, payload: any) => void
type PromotionUpdateCallback = (event: RealtimeEvent, payload: any) => void
type PointsUpdateCallback = (event: RealtimeEvent, payload: any) => void

// Define the enhanced channel map type
interface EnhancedChannelMap {
  gameSchedule?: RealtimeChannel
  stories?: RealtimeChannel
  rewards?: RealtimeChannel
  specialOffers?: RealtimeChannel
  promotions?: RealtimeChannel
  pointsTransactions?: RealtimeChannel
}

interface EnhancedRealtimeCallbacks {
  onGameUpdate?: GameUpdateCallback
  onStoryUpdate?: StoryUpdateCallback
  onRewardUpdate?: RewardUpdateCallback
  onSpecialOfferUpdate?: SpecialOfferUpdateCallback
  onPromotionUpdate?: PromotionUpdateCallback
  onPointsUpdate?: PointsUpdateCallback
}

export const useEnhancedRealtime = (callbacks: EnhancedRealtimeCallbacks, currentUserId?: string) => {
  const [isConnected, setIsConnected] = useState(false)
  const [channels, setChannels] = useState<EnhancedChannelMap>({})
  const [connectionStatus, setConnectionStatus] = useState<Record<string, boolean>>({})

  const setupRealtimeSubscriptions = useCallback(async () => {
    try {
      // Set authentication for private channels
      await supabase.realtime.setAuth()

      const channelMap: EnhancedChannelMap = {}
      const statusMap: Record<string, boolean> = {}

      // Game Schedule Channel
      if (callbacks.onGameUpdate) {
        const gameScheduleChannel = supabase
          .channel("game_schedule_changes", {
            config: { private: true },
          })
          .on("broadcast", { event: "INSERT" }, (payload) => {
            console.log("🏈 New game scheduled:", payload)
            callbacks.onGameUpdate!("INSERT", payload)
          })
          .on("broadcast", { event: "UPDATE" }, (payload) => {
            console.log("🏈 Game updated:", payload)
            callbacks.onGameUpdate!("UPDATE", payload)
          })
          .on("broadcast", { event: "DELETE" }, (payload) => {
            console.log("🏈 Game deleted:", payload)
            callbacks.onGameUpdate!("DELETE", payload)
          })
          .subscribe((status) => {
            statusMap.gameSchedule = status === "SUBSCRIBED"
            if (status === "SUBSCRIBED") {
              console.log("✅ Game schedule realtime connected")
            } else if (status === "CHANNEL_ERROR") {
              console.error("❌ Game schedule realtime connection failed")
            }
            setConnectionStatus((prev) => ({ ...prev, ...statusMap }))
          })

        channelMap.gameSchedule = gameScheduleChannel
      }

      // Stories Channel
      if (callbacks.onStoryUpdate) {
        const storiesChannel = supabase
          .channel("stories_changes", {
            config: { private: true },
          })
          .on("broadcast", { event: "INSERT" }, (payload) => {
            console.log("📰 New story published:", payload)
            callbacks.onStoryUpdate!("INSERT", payload)
          })
          .on("broadcast", { event: "UPDATE" }, (payload) => {
            console.log("📰 Story updated:", payload)
            callbacks.onStoryUpdate!("UPDATE", payload)
          })
          .on("broadcast", { event: "DELETE" }, (payload) => {
            console.log("📰 Story deleted:", payload)
            callbacks.onStoryUpdate!("DELETE", payload)
          })
          .subscribe((status) => {
            statusMap.stories = status === "SUBSCRIBED"
            if (status === "SUBSCRIBED") {
              console.log("✅ Stories realtime connected")
            }
            setConnectionStatus((prev) => ({ ...prev, ...statusMap }))
          })

        channelMap.stories = storiesChannel
      }

      // Rewards Channel
      if (callbacks.onRewardUpdate) {
        const rewardsChannel = supabase
          .channel("rewards_changes", {
            config: { private: true },
          })
          .on("broadcast", { event: "INSERT" }, (payload) => {
            console.log("🎁 New reward available:", payload)
            callbacks.onRewardUpdate!("INSERT", payload)
          })
          .on("broadcast", { event: "UPDATE" }, (payload) => {
            console.log("🎁 Reward updated:", payload)
            callbacks.onRewardUpdate!("UPDATE", payload)
          })
          .on("broadcast", { event: "DELETE" }, (payload) => {
            console.log("🎁 Reward removed:", payload)
            callbacks.onRewardUpdate!("DELETE", payload)
          })
          .subscribe((status) => {
            statusMap.rewards = status === "SUBSCRIBED"
            if (status === "SUBSCRIBED") {
              console.log("✅ Rewards realtime connected")
            }
            setConnectionStatus((prev) => ({ ...prev, ...statusMap }))
          })

        channelMap.rewards = rewardsChannel
      }

      // Special Offers Channel
      if (callbacks.onSpecialOfferUpdate) {
        const specialOffersChannel = supabase
          .channel("special_offers_changes", {
            config: { private: true },
          })
          .on("broadcast", { event: "INSERT" }, (payload) => {
            console.log("🔥 New special offer:", payload)
            callbacks.onSpecialOfferUpdate!("INSERT", payload)
          })
          .on("broadcast", { event: "UPDATE" }, (payload) => {
            console.log("🔥 Special offer updated:", payload)
            callbacks.onSpecialOfferUpdate!("UPDATE", payload)
          })
          .on("broadcast", { event: "DELETE" }, (payload) => {
            console.log("🔥 Special offer removed:", payload)
            callbacks.onSpecialOfferUpdate!("DELETE", payload)
          })
          .subscribe((status) => {
            statusMap.specialOffers = status === "SUBSCRIBED"
            if (status === "SUBSCRIBED") {
              console.log("✅ Special offers realtime connected")
            }
            setConnectionStatus((prev) => ({ ...prev, ...statusMap }))
          })

        channelMap.specialOffers = specialOffersChannel
      }

      // Promotions Channel
      if (callbacks.onPromotionUpdate) {
        const promotionsChannel = supabase
          .channel("promotions_changes", {
            config: { private: true },
          })
          .on("broadcast", { event: "INSERT" }, (payload) => {
            console.log("🎉 New promotion:", payload)
            callbacks.onPromotionUpdate!("INSERT", payload)
          })
          .on("broadcast", { event: "UPDATE" }, (payload) => {
            console.log("🎉 Promotion updated:", payload)
            callbacks.onPromotionUpdate!("UPDATE", payload)
          })
          .on("broadcast", { event: "DELETE" }, (payload) => {
            console.log("🎉 Promotion removed:", payload)
            callbacks.onPromotionUpdate!("DELETE", payload)
          })
          .subscribe((status) => {
            statusMap.promotions = status === "SUBSCRIBED"
            if (status === "SUBSCRIBED") {
              console.log("✅ Promotions realtime connected")
            }
            setConnectionStatus((prev) => ({ ...prev, ...statusMap }))
          })

        channelMap.promotions = promotionsChannel
      }

      // Points Transactions Channel (user-specific)
      if (callbacks.onPointsUpdate && currentUserId) {
        const pointsChannel = supabase
          .channel(`points_changes_${currentUserId}`, {
            config: { private: true },
          })
          .on("broadcast", { event: "INSERT" }, (payload) => {
            // Only notify for current user's points
            if (payload.new?.user_id === currentUserId) {
              console.log("💰 Points updated:", payload)
              callbacks.onPointsUpdate!("INSERT", payload)
            }
          })
          .subscribe((status) => {
            statusMap.pointsTransactions = status === "SUBSCRIBED"
            if (status === "SUBSCRIBED") {
              console.log("✅ Points realtime connected")
            }
            setConnectionStatus((prev) => ({ ...prev, ...statusMap }))
          })

        channelMap.pointsTransactions = pointsChannel
      }

      setChannels(channelMap)

      // Set overall connection status
      const allConnected = Object.values(statusMap).every((status) => status)
      setIsConnected(allConnected)

      return channelMap
    } catch (error) {
      console.error("❌ Error setting up enhanced realtime:", error)
      setIsConnected(false)
    }
  }, [callbacks, currentUserId])

  const cleanupSubscriptions = useCallback(() => {
    console.log("🧹 Cleaning up enhanced realtime subscriptions...")
    Object.values(channels).forEach((channel) => {
      if (channel) {
        supabase.removeChannel(channel)
      }
    })
    setChannels({})
    setConnectionStatus({})
    setIsConnected(false)
  }, [channels])

  return {
    setupRealtimeSubscriptions,
    cleanupSubscriptions,
    isConnected,
    connectionStatus,
    channels,
  }
}
