"use client"

import type React from "react"
import { createContext, useContext, useState, useCallback, useEffect, useRef } from "react"
import { View, Text, StyleSheet, Animated, Pressable, Platform } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import Feather from "@expo/vector-icons/Feather"
import { BlurView } from "expo-blur"

// Types
export type NotificationType = "success" | "error" | "warning" | "info" | "default"

export interface ToastNotification {
  id: string
  type: NotificationType
  title: string
  message?: string
  duration?: number
  action?: {
    label: string
    onPress: () => void
  }
  persistent?: boolean
}

export interface InAppNotification {
  id: string
  type: NotificationType
  title: string
  message: string
  timestamp: Date
  read: boolean
  action?: {
    label: string
    onPress: () => void
  }
  data?: any
}

interface NotificationContextType {
  // Toast notifications
  showToast: (notification: Omit<ToastNotification, "id">) => void
  hideToast: (id: string) => void
  clearAllToasts: () => void
  // Quick notification function (for compatibility)
  showNotification: (message: string, type?: NotificationType) => void

  // In-app notifications
  notifications: InAppNotification[]
  unreadCount: number
  addNotification: (notification: Omit<InAppNotification, "id" | "timestamp" | "read">) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  removeNotification: (id: string) => void
  clearAllNotifications: () => void

  // Quick actions
  showSuccess: (title: string, message?: string) => void
  showError: (title: string, message?: string) => void
  showWarning: (title: string, message?: string) => void
  showInfo: (title: string, message?: string) => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

// Modern Toast Component
const ToastItem: React.FC<{
  notification: ToastNotification
  onDismiss: (id: string) => void
}> = ({ notification, onDismiss }) => {
  const translateY = useRef(new Animated.Value(-100)).current
  const opacity = useRef(new Animated.Value(0)).current
  const scale = useRef(new Animated.Value(0.8)).current

  useEffect(() => {
    // Smooth entrance animation
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 120,
        friction: 7,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        tension: 120,
        friction: 7,
      }),
    ]).start()

    // Auto dismiss
    if (!notification.persistent) {
      const timer = setTimeout(() => {
        handleDismiss()
      }, notification.duration || 4000)

      return () => clearTimeout(timer)
    }
  }, [])

  const handleDismiss = useCallback(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 0.8,
        useNativeDriver: true,
        tension: 120,
        friction: 7,
      }),
    ]).start(() => {
      onDismiss(notification.id)
    })
  }, [notification.id, onDismiss])

  const getIcon = () => {
    const iconProps = { size: 22, strokeWidth: 2.5 }
    switch (notification.type) {
      case "success":
        return <Feather name="check-circle" {...iconProps} color="#10B981" />
      case "error":
        return <Feather name="x-circle" {...iconProps} color="#EF4444" />
      case "warning":
        return <Feather name="alert-triangle" {...iconProps} color="#F59E0B" />
      case "info":
        return <Feather name="info" {...iconProps} color="#3B82F6" />
      default:
        return <Feather name="bell" {...iconProps} color="#6B7280" />
    }
  }

  const getAccentColor = () => {
    switch (notification.type) {
      case "success":
        return "#10B981"
      case "error":
        return "#EF4444"
      case "warning":
        return "#F59E0B"
      case "info":
        return "#3B82F6"
      default:
        return "#6B7280"
    }
  }

  const getGradientColors = () => {
    switch (notification.type) {
      case "success":
        return ["rgba(16, 185, 129, 0.1)", "rgba(16, 185, 129, 0.05)"]
      case "error":
        return ["rgba(239, 68, 68, 0.1)", "rgba(239, 68, 68, 0.05)"]
      case "warning":
        return ["rgba(245, 158, 11, 0.1)", "rgba(245, 158, 11, 0.05)"]
      case "info":
        return ["rgba(59, 130, 246, 0.1)", "rgba(59, 130, 246, 0.05)"]
      default:
        return ["rgba(107, 114, 128, 0.1)", "rgba(107, 114, 128, 0.05)"]
    }
  }

  return (
    <Animated.View
      style={[
        styles.toastContainer,
        {
          transform: [{ translateY }, { scale }],
          opacity,
        },
      ]}
    >
      {/* Glassmorphism background */}
      <BlurView intensity={20} style={styles.blurBackground}>
        <View
          style={[
            styles.gradientOverlay,
            {
              backgroundColor: getGradientColors()[0],
            },
          ]}
        />

        {/* Accent border */}
        <View style={[styles.accentBorder, { backgroundColor: getAccentColor() }]} />

        <View style={styles.toastContent}>
          <View style={styles.iconContainer}>{getIcon()}</View>

          <View style={styles.textContainer}>
            <Text style={styles.toastTitle}>{notification.title}</Text>
            {notification.message && <Text style={styles.toastMessage}>{notification.message}</Text>}
          </View>

          <Pressable
            style={styles.dismissButton}
            onPress={handleDismiss}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Feather name="x" size={18} color="#6B7280" strokeWidth={2} />
          </Pressable>
        </View>

        {notification.action && (
          <View style={styles.actionContainer}>
            <Pressable
              style={[styles.actionButton, { borderColor: getAccentColor() }]}
              onPress={notification.action.onPress}
            >
              <Text style={[styles.actionText, { color: getAccentColor() }]}>{notification.action.label}</Text>
            </Pressable>
          </View>
        )}
      </BlurView>
    </Animated.View>
  )
}

// Toast Container Component
const ToastContainer: React.FC<{
  toasts: ToastNotification[]
  onDismiss: (id: string) => void
}> = ({ toasts, onDismiss }) => {
  const insets = useSafeAreaInsets()

  return (
    <View style={[styles.toastWrapper, { top: insets.top + 16 }]} pointerEvents="box-none">
      {toasts.map((toast, index) => (
        <Animated.View key={toast.id} style={[styles.toastItemWrapper, { zIndex: 1000 - index }]}>
          <ToastItem notification={toast} onDismiss={onDismiss} />
        </Animated.View>
      ))}
    </View>
  )
}

// Modern Notification Badge Component
export const NotificationBadge: React.FC<{
  count: number
  size?: number
}> = ({ count, size = 20 }) => {
  if (count === 0) return null

  return (
    <View
      style={[
        styles.badge,
        {
          width: Math.max(size, count > 9 ? size + 4 : size),
          height: size,
          borderRadius: size / 2,
        },
      ]}
    >
      <Text style={[styles.badgeText, { fontSize: size * 0.55 }]}>{count > 99 ? "99+" : count}</Text>
    </View>
  )
}

// Provider Component (unchanged)
export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastNotification[]>([])
  const [notifications, setNotifications] = useState<InAppNotification[]>([])

  // Toast functions
  const showToast = useCallback((notification: Omit<ToastNotification, "id">) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9)
    const newToast: ToastNotification = {
      ...notification,
      id,
    }

    setToasts((prev) => [newToast, ...prev.slice(0, 4)]) // Keep max 5 toasts
  }, [])

  const hideToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const clearAllToasts = useCallback(() => {
    setToasts([])
  }, [])

  // Quick notification function (for compatibility)
  const showNotification = useCallback(
    (message: string, type: NotificationType = "default") => {
      showToast({ type, title: message })
    },
    [showToast],
  )

  // In-app notification functions
  const addNotification = useCallback((notification: Omit<InAppNotification, "id" | "timestamp" | "read">) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9)
    const newNotification: InAppNotification = {
      ...notification,
      id,
      timestamp: new Date(),
      read: false,
    }

    setNotifications((prev) => [newNotification, ...prev])
  }, [])

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((notif) => (notif.id === id ? { ...notif, read: true } : notif)))
  }, [])

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((notif) => ({ ...notif, read: true })))
  }, [])

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((notif) => notif.id !== id))
  }, [])

  const clearAllNotifications = useCallback(() => {
    setNotifications([])
  }, [])

  // Quick action functions
  const showSuccess = useCallback(
    (title: string, message?: string) => {
      showToast({ type: "success", title, message })
    },
    [showToast],
  )

  const showError = useCallback(
    (title: string, message?: string) => {
      showToast({ type: "error", title, message })
    },
    [showToast],
  )

  const showWarning = useCallback(
    (title: string, message?: string) => {
      showToast({ type: "warning", title, message })
    },
    [showToast],
  )

  const showInfo = useCallback(
    (title: string, message?: string) => {
      showToast({ type: "info", title, message })
    },
    [showToast],
  )

  const unreadCount = notifications.filter((notif) => !notif.read).length

  const value: NotificationContextType = {
    showToast,
    hideToast,
    clearAllToasts,
    showNotification, // Add this line
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAllNotifications,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={hideToast} />
    </NotificationContext.Provider>
  )
}

// Hook
export const useNotifications = () => {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error("useNotifications must be used within a NotificationProvider")
  }
  return context
}

const styles = StyleSheet.create({
  toastWrapper: {
    position: "absolute",
    left: 20,
    right: 20,
    zIndex: 9999,
    pointerEvents: "box-none",
  },
  toastItemWrapper: {
    marginBottom: 12,
  },
  toastContainer: {
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 12,
  },
  blurBackground: {
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "rgba(255, 255, 255, 0.85)",
  },
  gradientOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  accentBorder: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
  },
  toastContent: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 20,
    paddingLeft: 24, // Account for accent border
  },
  iconContainer: {
    ...Platform.select({
      android: {
        // Adjust for Android alignment
      },
    }),
    marginRight: 16,
    marginTop: 2,
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  textContainer: {
    flex: 1,
    paddingRight: 8,
  },
  toastTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 4,
    lineHeight: 20,
  },
  toastMessage: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
    fontWeight: "400",
  },
  dismissButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: "rgba(107, 114, 128, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  actionContainer: {
    paddingHorizontal: 24,
    paddingBottom: 20,
    paddingTop: 0,
  },
  actionButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 16,
    borderWidth: 1.5,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    alignItems: "center",
  },
  actionText: {
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  badge: {
    backgroundColor: "#EF4444",
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    top: -8,
    right: -8,
    minWidth: 20,
    shadowColor: "#EF4444",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  badgeText: {
    color: "white",
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: 0.2,
  },
})
