"use client"

import { useState, useEffect } from "react"
import { DataService } from "./data-service"
import type { Database } from "../../types/database"

type Tables = Database["public"]["Tables"]
type Team = Tables["teams"]["Row"]
type Player = Tables["players"]["Row"]
type Coach = Tables["coaches"]["Row"]
type GameSchedule = Tables["game_schedule"]["Row"]

const dataService = new DataService()

export function useTeams() {
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadTeams = async (forceRefresh = false) => {
    try {
      setLoading(true)
      setError(null)
      const data = await dataService.getTeams(forceRefresh)
      setTeams(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load teams")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTeams()
  }, [])

  return { teams, loading, error, refresh: () => loadTeams(true) }
}

export function usePlayers(teamId?: string) {
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadPlayers = async (forceRefresh = false) => {
    try {
      setLoading(true)
      setError(null)
      const data = await dataService.getPlayers(teamId, forceRefresh)
      setPlayers(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load players")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPlayers()
  }, [teamId])

  return { players, loading, error, refresh: () => loadPlayers(true) }
}

export function useGameSchedule(teamId?: string) {
  const [schedule, setSchedule] = useState<GameSchedule[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadSchedule = async (forceRefresh = false) => {
    try {
      setLoading(true)
      setError(null)
      const data = await dataService.getGameSchedule(teamId, forceRefresh)
      setSchedule(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load schedule")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSchedule()
  }, [teamId])

  return { schedule, loading, error, refresh: () => loadSchedule(true) }
}
