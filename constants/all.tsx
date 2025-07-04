import type { Database } from "../types/supabase"

// Extract commonly used database table types
export type DbTables = Database["public"]["Tables"]
export type DbViews = Database["public"]["Views"]
export type DbFunctions = Database["public"]["Functions"]

// School related types
export type School = DbTables["SCHOOLS"]["Row"]
export type SchoolInsert = DbTables["SCHOOLS"]["Insert"]
export type SchoolUpdate = DbTables["SCHOOLS"]["Update"]

export interface SchoolInfo {
  id: string
  name: string
  shortName: string | null
  logo: string | null
  primaryColor: string | null
  contactEmail: string | null
  contactPhone: string | null
}