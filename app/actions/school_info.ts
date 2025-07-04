// app/actions/school.ts

import { supabase } from "@/lib/supabase"
import type { SchoolInfo } from "@/constants/all"

export async function getSchoolById(school_id: string): Promise<SchoolInfo | null> {
  const { data, error } = await supabase
    .from("SCHOOLS")
    .select("*")
    .eq("school_id", school_id)
    .single()

  if (error || !data) {
    console.error("Error fetching school:", error)
    return null
  }

  return {
    id: data.school_id,
    name: data.school_name,
    shortName: data.school_short_name,
    logo: data.school_logo,
    primaryColor: data.primary_color,
    contactEmail: data.contact_email,
    contactPhone: data.contact_phone,
  }
}
