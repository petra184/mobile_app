"use client"

import type React from "react"
import { useState } from "react"
import { Pressable, StyleSheet } from "react-native"
import { Bell } from "lucide-react-native"
import { colors } from "@/constants/colors"
import { useNotifications, NotificationBadge } from "@/context/notification-context"
import { NotificationCenter } from "./NotificationCenter"

export const NotificationButton: React.FC<{
  size?: number
  color?: string
}> = ({ size = 24, color = colors.primary }) => {
  const [showCenter, setShowCenter] = useState(false)
  const { unreadCount } = useNotifications()

  return (
    <>
      <Pressable
        style={styles.container}
        onPress={() => setShowCenter(true)}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Bell size={size} color={color} />
        <NotificationBadge count={unreadCount} />
      </Pressable>

      <NotificationCenter visible={showCenter} onClose={() => setShowCenter(false)} />
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
  },
})
