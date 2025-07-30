import { Text, TouchableOpacity, StyleSheet } from "react-native"
import { useSync } from "./index"

interface SyncStatusBarProps {
  syncStatus: {
    isInProgress: boolean
    lastSync: string
    pendingChanges: number
    conflicts: number
  }
}

export default function SyncStatusBar({ syncStatus }: SyncStatusBarProps) {
  const { triggerSync, isLoading } = useSync()

  if (syncStatus.pendingChanges === 0 && !syncStatus.isInProgress) {
    return null // Hide when everything is synced
  }

  const getStatusText = () => {
    if (syncStatus.isInProgress || isLoading) {
      return "Syncing..."
    }
    if (syncStatus.conflicts > 0) {
      return `${syncStatus.conflicts} conflicts need resolution`
    }
    if (syncStatus.pendingChanges > 0) {
      return `${syncStatus.pendingChanges} changes pending sync`
    }
    return "All synced"
  }

  const getStatusColor = () => {
    if (syncStatus.isInProgress || isLoading) return "#007AFF"
    if (syncStatus.conflicts > 0) return "#FF3B30"
    if (syncStatus.pendingChanges > 0) return "#FF9500"
    return "#34C759"
  }

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: getStatusColor() }]}
      onPress={triggerSync}
      disabled={isLoading || syncStatus.isInProgress}
    >
      <Text style={styles.text}>{getStatusText()}</Text>
      {(syncStatus.pendingChanges > 0 || syncStatus.conflicts > 0) && (
        <Text style={styles.actionText}>Tap to sync</Text>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  text: {
    color: "white",
    fontSize: 14,
    fontWeight: "500",
  },
  actionText: {
    color: "white",
    fontSize: 12,
    opacity: 0.8,
  },
})
