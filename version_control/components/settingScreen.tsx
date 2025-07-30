"use client"

import { useEffect, useState } from "react"
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native"
import { StorageManager, useSyncStatus, useSync } from "../index"

export default function SyncSettingsScreen() {
  const [storageStats, setStorageStats] = useState({
    totalEntities: 0,
    pendingSync: 0,
    lastSync: "Never",
    cacheSize: "0 KB",
  })

  const syncStatus = useSyncStatus()
  const { triggerSync, isLoading, error } = useSync()

  useEffect(() => {
    loadStorageStats()
  }, [])

  const loadStorageStats = async () => {
    try {
      const storage = StorageManager.getInstance()
      const stats = await storage.getStorageStats()
      setStorageStats(stats)
    } catch (error) {
      console.error("Error loading storage stats:", error)
    }
  }

  const handleForceSync = async () => {
    try {
      await triggerSync()
      await loadStorageStats()
      Alert.alert("Success", "Sync completed successfully")
    } catch (error) {
      Alert.alert("Error", "Sync failed: " + error)
    }
  }

  const handleClearCache = () => {
    Alert.alert("Clear Cache", "This will remove all offline data. You will need to sync again when online.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear",
        style: "destructive",
        onPress: async () => {
          try {
            const storage = StorageManager.getInstance()
            await storage.clearAllData()
            await loadStorageStats()
            Alert.alert("Success", "Cache cleared successfully")
          } catch (error) {
            Alert.alert("Error", "Failed to clear cache")
          }
        },
      },
    ])
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sync Settings</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Storage Statistics</Text>
        <Text>Total Items: {storageStats.totalEntities}</Text>
        <Text>Pending Sync: {storageStats.pendingSync}</Text>
        <Text>Cache Size: {storageStats.cacheSize}</Text>
        <Text>Last Sync: {new Date(syncStatus.lastSync).toLocaleString()}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sync Status</Text>
        <Text>Status: {syncStatus.isInProgress ? "Syncing..." : "Idle"}</Text>
        <Text>Pending Changes: {syncStatus.pendingChanges}</Text>
        <Text>Conflicts: {syncStatus.conflicts}</Text>
      </View>

      <TouchableOpacity
        style={[styles.button, styles.primaryButton]}
        onPress={handleForceSync}
        disabled={isLoading || syncStatus.isInProgress}
      >
        <Text style={styles.buttonText}>{isLoading ? "Syncing..." : "Force Sync"}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={loadStorageStats}>
        <Text style={styles.buttonText}>Refresh Stats</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.button, styles.dangerButton]} onPress={handleClearCache}>
        <Text style={styles.buttonText}>Clear Cache</Text>
      </TouchableOpacity>

      {error && <Text style={styles.error}>Error: {error}</Text>}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  section: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 10,
  },
  button: {
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: "center",
  },
  primaryButton: {
    backgroundColor: "#007AFF",
  },
  secondaryButton: {
    backgroundColor: "#8E8E93",
  },
  dangerButton: {
    backgroundColor: "#FF3B30",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  error: {
    color: "#FF3B30",
    marginTop: 10,
    textAlign: "center",
  },
})
