"use client"

import { useState, useEffect } from "react"
import type { BirthdayPackage, BirthdayPackageFilters } from "@/app/actions/birthdays"
import { getBirthdayPackages } from "@/app/actions/birthdays"

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
