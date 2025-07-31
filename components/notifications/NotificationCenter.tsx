"use client"

import { colors } from "@/constants/Colors"
import { useNotifications, type InAppNotification } from "@/context/notification-context"
import Feather from '@expo/vector-icons/Feather'
import React from "react"
import { Animated, Dimensions, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

const NotificationItem: React.FC<{
  notification: InAppNotification
  onPress: () => void
  onRemove: () => void
}> = ({ notification, onPress, onRemove }) => {
  const getIcon = () => {
    switch (notification.type) {
      case "success":
        return <Feather name="check-circle" size={20} color={colors.success || "#10B981"} />
      case "error":
        return <Feather name="alert-circle" size={20} color={colors.error || "#EF4444"} />
      case "warning":
        return <Feather name="alert-triangle" size={20} color={colors.error || "#EF4444"} />
      case "info":
        return <Feather name="info" size={20} color={colors.info || "#3B82F6"} />
      default:
        return <Feather name="bell" size={20} color={colors.primary} />
    }
  }

  const formatTime = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return "Just now"
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
  }

  return (
    <Pressable style={[styles.notificationItem, !notification.read && styles.unreadNotification]} onPress={onPress}>
      <View style={styles.notificationContent}>
        <View style={styles.notificationHeader}>
          <View style={styles.notificationIcon}>{getIcon()}</View>
          <View style={styles.notificationMeta}>
            <Text style={[styles.notificationTitle, { color: colors.text }]}>{notification.title}</Text>
            <Text style={[styles.notificationTime, { color: colors.textSecondary }]}>
              {formatTime(notification.timestamp)}
            </Text>
          </View>
          <Pressable
            style={styles.removeButton}
            onPress={onRemove}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Feather name="trash-2" size={16} color= {colors.textSecondary} />
          </Pressable>
        </View>

        <Text style={[styles.notificationMessage, { color: colors.textSecondary }]}>{notification.message}</Text>

        {notification.action && (
          <Pressable style={styles.notificationAction} onPress={notification.action.onPress}>
            <Text style={[styles.notificationActionText, { color: colors.primary }]}>{notification.action.label}</Text>
          </Pressable>
        )}
      </View>

      {!notification.read && <View style={styles.unreadDot} />}
    </Pressable>
  )
}

export const NotificationCenter: React.FC<{
  visible: boolean
  onClose: () => void
}> = ({ visible, onClose }) => {
  const insets = useSafeAreaInsets()
  const { notifications, unreadCount, markAsRead, markAllAsRead, removeNotification, clearAllNotifications } =
    useNotifications()

  const slideAnim = React.useRef(new Animated.Value(Dimensions.get("window").height)).current

  React.useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start()
    } else {
      Animated.timing(slideAnim, {
        toValue: Dimensions.get("window").height,
        duration: 250,
        useNativeDriver: true,
      }).start()
    }
  }, [visible])

  const handleNotificationPress = (notification: InAppNotification) => {
    if (!notification.read) {
      markAsRead(notification.id)
    }
    if (notification.action) {
      notification.action.onPress()
    }
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        <Animated.View
          style={[
            styles.container,
            {
              paddingTop: insets.top,
              paddingBottom: insets.bottom,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={[styles.headerTitle, { color: colors.text }]}>Notifications</Text>
              {unreadCount > 0 && (
                <View style={styles.headerBadge}>
                  <Text style={styles.headerBadgeText}>{unreadCount}</Text>
                </View>
              )}
            </View>

            <View style={styles.headerActions}>
              {unreadCount > 0 && (
                <Pressable style={styles.headerButton} onPress={markAllAsRead}>
                  <Feather name="check-circle" size={20} color={colors.primary} />
                </Pressable>
              )}

              <Pressable style={styles.headerButton} onPress={onClose}>
                <Feather name="x" size={20} color={colors.textSecondary} />
              </Pressable>
            </View>
          </View>

          {/* Content */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {notifications.length === 0 ? (
              <View style={styles.emptyState}>
                <Feather name="bell" size={48} color={colors.textSecondary} />
                <Text style={[styles.emptyStateTitle, { color: colors.text }]}>No notifications</Text>
                <Text style={[styles.emptyStateMessage, { color: colors.textSecondary }]}>
                  You're all caught up! New notifications will appear here.
                </Text>
              </View>
            ) : (
              <>
                {notifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onPress={() => handleNotificationPress(notification)}
                    onRemove={() => removeNotification(notification.id)}
                  />
                ))}

                {notifications.length > 0 && (
                  <Pressable style={styles.clearAllButton} onPress={clearAllNotifications}>
                    <Text style={[styles.clearAllText, { color: colors.error }]}>Clear All Notifications</Text>
                  </Pressable>
                )}
              </>
            )}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  backdrop: {
    flex: 1,
  },
  container: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
    minHeight: "50%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginRight: 8,
  },
  headerBadge: {
    backgroundColor: colors.error || "#EF4444",
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: "center",
  },
  headerBadgeText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerButton: {
    padding: 8,
    marginLeft: 8,
  },
  content: {
    flex: 1,
  },
  notificationItem: {
    backgroundColor: colors.card,
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
  },
  unreadNotification: {
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  notificationContent: {
    padding: 16,
  },
  notificationHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  notificationIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  notificationMeta: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  notificationTime: {
    fontSize: 12,
  },
  removeButton: {
    padding: 4,
  },
  notificationMessage: {
    fontSize: 14,
    lineHeight: 20,
    marginLeft: 32,
  },
  notificationAction: {
    marginTop: 12,
    marginLeft: 32,
  },
  notificationActionText: {
    fontSize: 14,
    fontWeight: "600",
  },
  unreadDot: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateMessage: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  clearAllButton: {
    alignItems: "center",
    paddingVertical: 20,
    marginTop: 16,
  },
  clearAllText: {
    fontSize: 14,
    fontWeight: "600",
  },
})
