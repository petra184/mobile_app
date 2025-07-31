"use client"

import { getBirthdayPackages } from "@/lib/actions/birthdays"
import type { BirthdayPackage, BirthdayPackageFilters } from "@/types/updated_types"
import { useEffect, useState } from "react"

export function useBirthdayPackages(filters?: BirthdayPackageFilters) {
  const [packages, setPackages] = useState<BirthdayPackage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPackages = async () => {
    setLoading(true)
    setError(null)

    const result = await getBirthdayPackages(filters)

    if (result.error) {
      setError(result.error)
    } else {
      setPackages(result.data)
    }

    setLoading(false)
  }

  useEffect(() => {
    fetchPackages()
  }, [JSON.stringify(filters)])

  return {
    packages,
    loading,
    error,
    refetch: fetchPackages,
  }
}
