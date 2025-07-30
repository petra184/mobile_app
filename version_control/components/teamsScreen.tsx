"use client"

import { useEffect, useState } from "react"
import { View, FlatList, Text, RefreshControl } from "react-native"
import { getTeams } from "../actions" // Updated import
import { useSync } from "../index"
import type { Team } from "@/types/updated_types"

export default function TeamsScreen() {
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const { triggerSync, isLoading: isSyncing } = useSync()

  const loadTeams = async () => {
    try {
      const teamsData = await getTeams() // Now uses cached data
      setTeams(teamsData)
    } catch (error) {
      console.error("Error loading teams:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTeams()
  }, [])

  const handleRefresh = async () => {
    await triggerSync() // Sync with server
    await loadTeams() // Reload from cache
  }

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Loading teams...</Text>
      </View>
    )
  }

  return (
    <FlatList
      data={teams}
      keyExtractor={(item) => item.id}
      refreshControl={<RefreshControl refreshing={isSyncing} onRefresh={handleRefresh} />}
      renderItem={({ item }) => (
        <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: "#eee" }}>
          <Text style={{ fontSize: 18, fontWeight: "bold" }}>{item.name}</Text>
          <Text style={{ color: "#666" }}>
            {item.sport} • {item.gender}
          </Text>
        </View>
      )}
    />
  )
}
