"use client"

import { useState, useEffect, useCallback } from "react"
import { cacheManager, type CacheableTable } from "./manager"
import type { Database } from "./types"

type TableData<T extends CacheableTable> = T extends "game_schedule"
  ? Database["public"]["Tables"]["game_schedule"]["Row"][]
  : T extends "teams"
    ? Database["public"]["Tables"]["teams"]["Row"][]
    : T extends "stories"
      ? Database["public"]["Tables"]["stories"]["Row"][]
      : T extends "rewards"
        ? Database["public"]["Tables"]["rewards"]["Row"][]
        : never

export function useCachedData<T extends CacheableTable>(table: T, autoRefresh = true) {
  const [data, setData] = useState<TableData<T>>([] as unknown as TableData<T>)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)

  const loadData = useCallback(
    async (forceRefresh = false) => {
      try {
        setLoading(true)
        setError(null)

        const result = await cacheManager.getData<TableData<T>[0]>(table, forceRefresh)
        setData(result as TableData<T>)
        setLastUpdated(new Date().toISOString())
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load data")
      } finally {
        setLoading(false)
      }
    },
    [table],
  )

  const refresh = useCallback(() => {
    return loadData(true)
  }, [loadData])

  useEffect(() => {
    if (autoRefresh) {
      loadData()
    }
  }, [loadData, autoRefresh])

  return {
    data,
    loading,
    error,
    lastUpdated,
    refresh,
    loadData,
  }
}

export function useMultipleCachedData(tables: CacheableTable[]) {
  const [data, setData] = useState<Record<string, any[]>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const results = await cacheManager.refreshMultipleTables(tables)
      setData(results)
      setLastUpdated(new Date().toISOString())
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data")
    } finally {
      setLoading(false)
    }
  }, [tables])

  const refresh = useCallback(() => {
    return loadData()
  }, [loadData])

  useEffect(() => {
    loadData()
  }, [loadData])

  return {
    data,
    loading,
    error,
    lastUpdated,
    refresh,
  }
}
