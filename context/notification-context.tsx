"use client"

import type React from "react"
import { createContext, useContext, useState, useCallback, useEffect, useRef } from "react"
import { View, Text, StyleSheet, Animated, Pressable, Dimensions } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { colors } from "@/constants/colors"
import { CheckCircle, AlertCircle, Info, X, Bell, AlertTriangle } from "lucide-react-native"

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

// Toast Component
const ToastItem: React.FC<{
  notification: ToastNotification
  onDismiss: (id: string) => void
}> = ({ notification, onDismiss }) => {
  const translateY = useRef(new Animated.Value(-100)).current
  const opacity = useRef(new Animated.Value(0)).current
  const scale = useRef(new Animated.Value(0.9)).current

  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
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
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 0.9,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss(notification.id)
    })
  }, [notification.id, onDismiss])

  const getIcon = () => {
    switch (notification.type) {
      case "success":
        return <CheckCircle size={20} color={colors.success || "#10B981"} />
      case "error":
        return <AlertCircle size={20} color={colors.error || "#EF4444"} />
      case "warning":
        return <AlertTriangle size={20} color={colors.warning || "#F59E0B"} />
      case "info":
        return <Info size={20} color={colors.info || "#3B82F6"} />
      default:
        return <Bell size={20} color={colors.primary} />
    }
  }

  const getBackgroundColor = () => {
    switch (notification.type) {
      case "success":
        return colors.success || "#ECFDF5"
      case "error":
        return colors.error || "#FEF2F2"
      case "warning":
        return colors.warning || "#FFFBEB"
      case "info":
        return colors.info || "#EFF6FF"
      default:
        return colors.card
    }
  }

  const getBorderColor = () => {
    switch (notification.type) {
      case "success":
        return colors.success || "#10B981"
      case "error":
        return colors.error || "#EF4444"
      case "warning":
        return colors.warning || "#F59E0B"
      case "info":
        return colors.info || "#3B82F6"
      default:
        return colors.primary
    }
  }

  return (
    <Animated.View
      style={[
        styles.toastContainer,
        {
          transform: [{ translateY }, { scale }],
          opacity,
          backgroundColor: getBackgroundColor(),
          borderLeftColor: getBorderColor(),
        },
      ]}
    >
      <View style={styles.toastContent}>
        <View style={styles.toastIcon}>{getIcon()}</View>

        <View style={styles.toastText}>
          <Text style={[styles.toastTitle, { color: colors.text }]}>{notification.title}</Text>
          {notification.message && (
            <Text style={[styles.toastMessage, { color: colors.textSecondary }]}>{notification.message}</Text>
          )}
        </View>

        <Pressable
          style={styles.dismissButton}
          onPress={handleDismiss}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <X size={18} color={colors.textSecondary} />
        </Pressable>
      </View>

      {notification.action && (
        <Pressable style={styles.toastAction} onPress={notification.action.onPress}>
          <Text style={[styles.toastActionText, { color: getBorderColor() }]}>{notification.action.label}</Text>
        </Pressable>
      )}
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
    <View style={[styles.toastWrapper, { top: insets.top + 10 }]} pointerEvents="box-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} notification={toast} onDismiss={onDismiss} />
      ))}
    </View>
  )
}

// Notification Badge Component
export const NotificationBadge: React.FC<{
  count: number
  size?: number
}> = ({ count, size = 18 }) => {
  if (count === 0) return null

  return (
    <View style={[styles.badge, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.badgeText, { fontSize: size * 0.6 }]}>{count > 99 ? "99+" : count}</Text>
    </View>
  )
}

// Provider Component
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

const { width } = Dimensions.get("window")

const styles = StyleSheet.create({
  toastWrapper: {
    position: "absolute",
    left: 16,
    right: 16,
    zIndex: 9999,
    pointerEvents: "box-none",
  },
  toastContainer: {
    backgroundColor: colors.card,
    borderRadius: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    overflow: "hidden",
  },
  toastContent: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 16,
  },
  toastIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  toastText: {
    flex: 1,
  },
  toastTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  toastMessage: {
    fontSize: 14,
    lineHeight: 20,
  },
  dismissButton: {
    padding: 4,
    marginLeft: 8,
  },
  toastAction: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 0,
  },
  toastActionText: {
    fontSize: 14,
    fontWeight: "600",
  },
  badge: {
    backgroundColor: colors.error || "#EF4444",
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    top: -6,
    right: -6,
    minWidth: 18,
  },
  badgeText: {
    color: "white",
    fontWeight: "600",
    textAlign: "center",
  },
})
