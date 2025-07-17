import { supabase } from "@/lib/supabase"
import type { BirthdayPackage, BirthdayPackageFilters } from "@/types/updated_types"

/**
 * Transform database row to BirthdayPackage type
 */
const transformPackage = (row: any): BirthdayPackage => ({
  ...row,
  image: row.image_url, // Map image_url to image for component compatibility
  features: Array.isArray(row.features) ? row.features : row.features ? Object.values(row.features) : [],
  price: Number.parseFloat(row.price) || 0,
  points: row.max_guests || row.points || 0, // Use max_guests as points for compatibility
  bookings_count: row.bookings_count || 0,
  is_featured: row.is_featured || false,
  is_limited_time: row.is_limited_time || false,
  is_active: row.is_active !== false, // Default to true if null
  is_scheduled: row.is_scheduled || false,
})

/**
 * Get all birthday packages with optional filters
 */
export async function getBirthdayPackages(filters?: BirthdayPackageFilters) {
  try {
    let query = supabase.from("birthday_packages").select("*").order("created_at", { ascending: false })

    // Apply filters
    if (filters?.team_id) {
      query = query.eq("team_id", filters.team_id)
    }

    if (filters?.is_active !== undefined) {
      query = query.eq("is_active", filters.is_active)
    }

    if (filters?.is_featured !== undefined) {
      query = query.eq("is_featured", filters.is_featured)
    }

    if (filters?.is_limited_time !== undefined) {
      query = query.eq("is_limited_time", filters.is_limited_time)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching birthday packages:", error)
      throw new Error(`Failed to fetch birthday packages: ${error.message}`)
    }

    return {
      data: data?.map(transformPackage) || [],
      error: null,
    }
  } catch (error) {
    console.error("Error in getBirthdayPackages:", error)
    return {
      data: [],
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}

/**
 * Get active birthday packages for a specific team
 */
export async function getActiveBirthdayPackages(teamId: string) {
  return getBirthdayPackages({
    team_id: teamId,
    is_active: true,
  })
}

/**
 * Get all active birthday packages (no team filter)
 */
export async function getAllActiveBirthdayPackages() {
  return getBirthdayPackages({
    is_active: true,
  })
}

/**
 * Get featured birthday packages for a specific team
 */
export async function getFeaturedBirthdayPackages(teamId: string) {
  return getBirthdayPackages({
    team_id: teamId,
    is_active: true,
    is_featured: true,
  })
}

/**
 * Get limited time birthday packages for a specific team
 */
export async function getLimitedTimeBirthdayPackages(teamId: string) {
  return getBirthdayPackages({
    team_id: teamId,
    is_active: true,
    is_limited_time: true,
  })
}

/**
 * Get a single birthday package by ID
 */
export async function getBirthdayPackageById(id: string) {
  try {
    const { data, error } = await supabase.from("birthday_packages").select("*").eq("id", id).single()

    if (error) {
      console.error("Error fetching birthday package:", error)
      throw new Error(`Failed to fetch birthday package: ${error.message}`)
    }

    return {
      data: data ? transformPackage(data) : null,
      error: null,
    }
  } catch (error) {
    console.error("Error in getBirthdayPackageById:", error)
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}

/**
 * Get published birthday packages (where published_at is not null and <= now)
 */
export async function getPublishedBirthdayPackages(teamId: string) {
  try {
    const now = new Date().toISOString()

    const { data, error } = await supabase
      .from("birthday_packages")
      .select("*")
      .eq("team_id", teamId)
      .eq("is_active", true)
      .not("published_at", "is", null)
      .lte("published_at", now)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching published birthday packages:", error)
      throw new Error(`Failed to fetch published birthday packages: ${error.message}`)
    }

    return {
      data: data?.map(transformPackage) || [],
      error: null,
    }
  } catch (error) {
    console.error("Error in getPublishedBirthdayPackages:", error)
    return {
      data: [],
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}

/**
 * Get scheduled birthday packages that should be published
 */
export async function getScheduledBirthdayPackages(teamId: string) {
  try {
    const now = new Date().toISOString()

    const { data, error } = await supabase
      .from("birthday_packages")
      .select("*")
      .eq("team_id", teamId)
      .eq("is_active", true)
      .eq("is_scheduled", true)
      .not("scheduled_publish_date", "is", null)
      .lte("scheduled_publish_date", now)
      .order("scheduled_publish_date", { ascending: true })

    if (error) {
      console.error("Error fetching scheduled birthday packages:", error)
      throw new Error(`Failed to fetch scheduled birthday packages: ${error.message}`)
    }

    return {
      data: data?.map(transformPackage) || [],
      error: null,
    }
  } catch (error) {
    console.error("Error in getScheduledBirthdayPackages:", error)
    return {
      data: [],
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}

/**
 * Increment booking count for a package
 */
export async function incrementPackageBookingCount(packageId: string) {
  try {
    // Fetch current bookings_count
    const { data: currentPackage, error: fetchError } = await supabase
      .from("birthday_packages")
      .select("bookings_count")
      .eq("id", packageId)
      .single()

    if (fetchError) {
      console.error("Error fetching current booking count:", fetchError)
      throw new Error(`Failed to fetch booking count: ${fetchError.message}`)
    }

    const newCount = (currentPackage?.bookings_count || 0) + 1

    // Update with incremented count
    const { data, error: updateError } = await supabase
      .from("birthday_packages")
      .update({
        bookings_count: newCount,
        updated_at: new Date().toISOString(),
      })
      .eq("id", packageId)
      .select("bookings_count")
      .single()

    if (updateError) {
      console.error("Error incrementing booking count:", updateError)
      throw new Error(`Failed to increment booking count: ${updateError.message}`)
    }

    return {
      data: data?.bookings_count || 0,
      error: null,
    }
  } catch (error) {
    console.error("Error in incrementPackageBookingCount:", error)
    return {
      data: 0,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}

export interface BirthdayRequestData {
  package: {
    id: string
    name: string
    price: number
  }
  customerInfo: {
    name: string
    email: string
    phone: string
  }
  eventDetails: {
    date: string
    time: string
    numberOfGuests: number
    specialRequests?: string
  }
  submittedAt: string
}

export async function submitBirthdayRequestClient(requestData: BirthdayRequestData) {
  try {
    // Prepare the data for insertion (no team_id as requested)
    const insertData = {
      package_id: requestData.package.id,
      package_name: requestData.package.name,
      package_price: requestData.package.price,
      customer_name: requestData.customerInfo.name,
      customer_email: requestData.customerInfo.email,
      customer_phone: requestData.customerInfo.phone,
      event_date: requestData.eventDetails.date,
      event_time: requestData.eventDetails.time,
      number_of_guests: requestData.eventDetails.numberOfGuests,
      special_requests: requestData.eventDetails.specialRequests || null,
      status: "pending",
      submitted_at: requestData.submittedAt,
      // Note: school_id is nullable, so we don't include it
    }

    // Insert the birthday request
    const { data, error } = await supabase.from("birthday_requests").insert([insertData]).select().single()

    if (error) {
      console.error("Supabase error:", error)
      throw error
    }

    // Increment the booking count for the package
    try {
      await incrementPackageBookingCount(requestData.package.id)
    } catch (bookingError) {
      console.warn("Failed to increment booking count:", bookingError)
      // Don't fail the entire request if booking count update fails
    }

    return { success: true, data }
  } catch (error) {
    console.error("Error submitting birthday request:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to submit birthday request",
    }
  }
}

export async function getBirthdayPackagesClient() {
  try {
    const { data, error } = await supabase.from("birthday_packages").select("*").eq("is_active", true).order("price")

    if (error) throw error

    return { success: true, data: data?.map(transformPackage) || [] }
  } catch (error) {
    console.error("Error fetching birthday packages:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch birthday packages",
      data: [],
    }
  }
}

export async function getAllBirthdayRequests() {
  try {
    const { data, error } = await supabase
      .from("birthday_requests")
      .select("*")
      .order("submitted_at", { ascending: false })

    if (error) throw error

    return { success: true, data: data || [] }
  } catch (error) {
    console.error("Error fetching birthday requests:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch birthday requests",
      data: [],
    }
  }
}

export async function updateBirthdayRequestStatus(requestId: string, status: string, adminNotes?: string) {
  try {
    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    }

    if (adminNotes !== undefined) {
      updateData.admin_notes = adminNotes
    }

    const { data, error } = await supabase
      .from("birthday_requests")
      .update(updateData)
      .eq("id", requestId)
      .select()
      .single()

    if (error) throw error

    return { success: true, data }
  } catch (error) {
    console.error("Error updating birthday request status:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update birthday request status",
    }
  }
}

export async function deleteBirthdayRequest(requestId: string) {
  try {
    const { error } = await supabase.from("birthday_requests").delete().eq("id", requestId)

    if (error) throw error

    return { success: true }
  } catch (error) {
    console.error("Error deleting birthday request:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete birthday request",
    }
  }
}


export interface FAQ {
  id: string
  faq_title: string
  faq_response: string
  created_at: string
  updated_at: string
}

/**
 * Get all FAQs for mobile app
 */
export async function getFAQsForMobile(): Promise<{ data: FAQ[]; error: string | null }> {
  try {
    console.log("📱 Fetching FAQs for mobile app...")

    const { data, error } = await supabase
      .from("birthday_faqs")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("❌ Error fetching FAQs:", error)
      return {
        data: [],
        error: `Failed to fetch FAQs: ${error.message}`,
      }
    }

    console.log(`✅ Fetched ${data?.length || 0} FAQs for mobile`)

    // Log each FAQ for debugging
    data?.forEach((faq, index) => {
      console.log(`❓ FAQ ${index + 1}: ${faq.faq_title}`)
    })

    return {
      data: data || [],
      error: null,
    }
  } catch (error) {
    console.error("❌ Error in getFAQsForMobile:", error)
    return {
      data: [],
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}

/**
 * Get a specific FAQ by ID
 */
export async function getFAQById(id: string): Promise<{ data: FAQ | null; error: string | null }> {
  try {
    console.log("🔍 Fetching FAQ by ID:", id)

    const { data, error } = await supabase
      .from("birthday_faqs")
      .select("*")
      .eq("id", id)
      .single()

    if (error) {
      console.error("❌ Error fetching FAQ:", error)
      return {
        data: null,
        error: `Failed to fetch FAQ: ${error.message}`,
      }
    }

    console.log("✅ Fetched FAQ:", data?.faq_title)
    return {
      data: data,
      error: null,
    }
  } catch (error) {
    console.error("❌ Error in getFAQById:", error)
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}

/**
 * Search FAQs by title or content
 */
export async function searchFAQs(searchTerm: string): Promise<{ data: FAQ[]; error: string | null }> {
  try {
    console.log("🔍 Searching FAQs with term:", searchTerm)

    if (!searchTerm.trim()) {
      // If no search term, return all FAQs
      return getFAQsForMobile()
    }

    const { data, error } = await supabase
      .from("birthday_faqs")
      .select("*")
      .or(`faq_title.ilike.%${searchTerm}%,faq_response.ilike.%${searchTerm}%`)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("❌ Error searching FAQs:", error)
      return {
        data: [],
        error: `Failed to search FAQs: ${error.message}`,
      }
    }

    console.log(`✅ Found ${data?.length || 0} FAQs matching "${searchTerm}"`)
    return {
      data: data || [],
      error: null,
    }
  } catch (error) {
    console.error("❌ Error in searchFAQs:", error)
    return {
      data: [],
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}

/**
 * Get recently updated FAQs (within last 30 days)
 */
export async function getRecentFAQs(): Promise<{ data: FAQ[]; error: string | null }> {
  try {
    console.log("📅 Fetching recently updated FAQs...")

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data, error } = await supabase
      .from("birthday_faqs")
      .select("*")
      .gte("updated_at", thirtyDaysAgo.toISOString())
      .order("updated_at", { ascending: false })

    if (error) {
      console.error("❌ Error fetching recent FAQs:", error)
      return {
        data: [],
        error: `Failed to fetch recent FAQs: ${error.message}`,
      }
    }

    console.log(`✅ Fetched ${data?.length || 0} recently updated FAQs`)
    return {
      data: data || [],
      error: null,
    }
  } catch (error) {
    console.error("❌ Error in getRecentFAQs:", error)
    return {
      data: [],
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}

/**
 * Get FAQ statistics
 */
export async function getFAQStats(): Promise<{ 
  data: { 
    total: number; 
    recent: number; 
    lastUpdated: string | null 
  } | null; 
  error: string | null 
}> {
  try {

    const { data, error } = await supabase
      .from("birthday_faqs")
      .select("created_at, updated_at")
      .order("updated_at", { ascending: false })

    if (error) {
      console.error("❌ Error fetching FAQ stats:", error)
      return {
        data: null,
        error: `Failed to fetch FAQ stats: ${error.message}`,
      }
    }

    const total = data?.length || 0
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const recent = data?.filter(faq => 
      new Date(faq.updated_at) >= thirtyDaysAgo
    ).length || 0

    const lastUpdated = data && data.length > 0 ? data[0].updated_at : null

    const stats = {
      total,
      recent,
      lastUpdated,
    }

    return {
      data: stats,
      error: null,
    }
  } catch (error) {
    console.error("❌ Error in getFAQStats:", error)
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}
