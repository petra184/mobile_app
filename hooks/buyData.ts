"use client"

import { useState, useEffect } from "react"
import {
  getStoreProducts,
  getFeaturedProducts,
  getActivePromotions,
  getProductCategories,
  getProductPriceRange,
  type ProductFilters,
  type SortOptions,
} from "@/app/actions/store"
import type { Database } from "@/types/database"

type StoreProduct = Database["public"]["Tables"]["store_products"]["Row"]
type Promotion = Database["public"]["Tables"]["promotions"]["Row"]

export function useStoreProducts(filters?: ProductFilters, sort?: SortOptions, limit?: number) {
  const [products, setProducts] = useState<StoreProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProducts = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getStoreProducts(filters, sort, limit)
      setProducts(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch products")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [JSON.stringify(filters), JSON.stringify(sort), limit])

  return {
    products,
    loading,
    error,
    refetch: fetchProducts,
  }
}

export function useFeaturedProducts(limit = 6) {
  const [products, setProducts] = useState<StoreProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await getFeaturedProducts(limit)
        setProducts(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch featured products")
      } finally {
        setLoading(false)
      }
    }

    fetchFeatured()
  }, [limit])

  return { products, loading, error }
}

export function usePromotions(teamId?: string) {
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPromotions = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await getActivePromotions(teamId)
        setPromotions(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch promotions")
      } finally {
        setLoading(false)
      }
    }

    fetchPromotions()
  }, [teamId])

  return { promotions, loading, error }
}

export function useProductCategories() {
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await getProductCategories()
        setCategories(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch categories")
      } finally {
        setLoading(false)
      }
    }

    fetchCategories()
  }, [])

  return { categories, loading, error }
}

export function usePriceRange(teamId?: string) {
  const [priceRange, setPriceRange] = useState({ min: 0, max: 100 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPriceRange = async () => {
      try {
        setLoading(true)
        const range = await getProductPriceRange(teamId)
        setPriceRange(range)
      } catch (err) {
        console.error("Failed to fetch price range:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchPriceRange()
  }, [teamId])

  return { priceRange, loading }
}
