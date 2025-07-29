"use client"

import { useState, useEffect, useCallback } from "react"
import { cacheManager } from "./manager"
import type { Team, Game } from "@/types/updated_types"

export interface HomeDataState {
  teams: Team[]
  games: Game[]
  loading: boolean
  error: string | null
  lastUpdated: string | null
}

export function useHomeData() {
  const [state, setState] = useState<HomeDataState>({
    teams: [],
    games: [],
    loading: true,
    error: null,
    lastUpdated: null,
  })

  const loadData = useCallback(async (forceRefresh = false) => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }))

      // Use cache manager to get teams and games efficiently
      const results = await cacheManager.refreshMultipleTables(["teams", "game_schedule"])

      setState({
        teams: results.teams || [],
        games: results.game_schedule || [],
        loading: false,
        error: null,
        lastUpdated: new Date().toISOString(),
      })
    } catch (error) {
      console.error("Error loading home data:", error)
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : "Failed to load data",
      }))
    }
  }, [])

  const refresh = useCallback(() => {
    return loadData(true)
  }, [loadData])

  // Load data on mount
  useEffect(() => {
    loadData()
  }, [loadData])

  return {
    ...state,
    refresh,
    loadData,
  }
}

// Hook specifically for teams data
export function useTeamsData() {
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadTeams = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true)
      setError(null)
      const teamsData = await cacheManager.getData<Team>("teams", forceRefresh)
      setTeams(teamsData)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load teams")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadTeams()
  }, [loadTeams])

  return {
    teams,
    loading,
    error,
    refresh: () => loadTeams(true),
  }
}

// Hook specifically for games data
export function useGamesData() {
  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadGames = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true)
      setError(null)
      const gamesData = await cacheManager.getData<Game>("game_schedule", forceRefresh)
      setGames(gamesData)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load games")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadGames()
  }, [loadGames])

  return {
    games,
    loading,
    error,
    refresh: () => loadGames(true),
  }
}
