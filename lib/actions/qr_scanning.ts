import { getGameById, getUpcomingGames } from "@/lib/actions/games"
import { supabase } from "@/lib/supabase"
import type { Game, QRCodeData, ScanHistoryItem, ScannedUser } from "@/types/updated_types"
import { Alert } from "react-native"

// Generate unique QR code data
const generateQRCodeData = (userId: string, gameId: string): string => {
  const timestamp = Date.now()
  const randomString = Math.random().toString(36).substring(2, 15)
  return `${userId}-${gameId}-${timestamp}-${randomString}`
}

// Load games with team information using your existing actions
export const loadGamesAction = async (gameIdFromParams?: string, isRefresh = false) => {
  try {
    let finalGamesList: Game[] = []

    if (gameIdFromParams && !isRefresh) {
      // Get specific game and upcoming games
      const [specificGame, upcomingGames] = await Promise.all([
        getGameById(gameIdFromParams),
        getUpcomingGames(10)
      ])

      // Create a map to avoid duplicates
      const gamesMap = new Map<string, Game>()
      
      if (specificGame) {
        gamesMap.set(specificGame.id, specificGame)
      }
      
      upcomingGames.forEach((game) => {
        if (!gamesMap.has(game.id)) {
          gamesMap.set(game.id, game)
        }
      })
      
      finalGamesList = Array.from(gamesMap.values())
    } else {
      // Get upcoming games
      finalGamesList = await getUpcomingGames(10)
    }

    return { success: true, data: finalGamesList }
  } catch (error) {
    console.error("Error loading games:", error)
    return { success: false, error: "Failed to load game schedule." }
  }
}

// Generate or get existing QR code for user and game
export const generateOrGetQRCodeAction = async (userId: string, gameId: string): Promise<QRCodeData | null> => {
  try {
    // First, check if QR code already exists for this user and game
    const { data: existingQR, error: fetchError } = await supabase
      .from("qr_codes_generated")
      .select("*")
      .eq("user_id", userId)
      .eq("game_id", gameId)
      .single()

    if (fetchError && fetchError.code !== "PGRST116") {
      throw fetchError
    }

    if (existingQR) {
      return existingQR as QRCodeData
    }

    // Generate new QR code
    const qrData = generateQRCodeData(userId, gameId)

    const { data: newQR, error: insertError } = await supabase
      .from("qr_codes_generated")
      .insert({
        user_id: userId,
        game_id: gameId,
        qr_code_data: qrData,
      })
      .select()
      .single()

    if (insertError) throw insertError

    return newQR as QRCodeData
  } catch (error) {
    console.error("Error generating QR code:", error)
    Alert.alert("Error", "Failed to generate QR code.")
    return null
  }
}

// Check if QR code is available based on game timing
export const checkQRAvailabilityAction = (game: Game) => {
  if (!game?.date || !game?.time) {
    return {
      isAvailable: false,
      timeUntilAvailable: "",
    }
  }

  const gameDateTime = new Date(`${game.date}T${game.time}`)
  const now = new Date()
  const oneHourBefore = new Date(gameDateTime.getTime() - 60 * 60 * 1000)

  if (now >= oneHourBefore) {
    return {
      isAvailable: true,
      timeUntilAvailable: "",
    }
  } else {
    const diff = oneHourBefore.getTime() - now.getTime()
    const days = Math.floor(diff / (24 * 60 * 60 * 1000))
    const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000))
    const minutes = Math.floor((diff % (60 * 60 * 1000)) / 60000)
    const timeString = days > 0 ? `in ${days}d ${hours}h ${minutes}m` : `in ${hours}h ${minutes}m`

    return {
      isAvailable: false,
      timeUntilAvailable: timeString,
    }
  }
}

// Check if user has already scanned for this game
export const checkIfAlreadyScannedAction = async (userId: string, gameId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from("qr_codes_generated")
      .select("is_used")
      .eq("user_id", userId)
      .eq("game_id", gameId)
      .single()

    if (error && error.code !== "PGRST116") {
      console.error("Error checking scan status:", error)
      return false
    }

    return data?.is_used || false
  } catch (error) {
    console.error("Error checking scan status:", error)
    return false
  }
}

// Check if current user is an admin
export const checkAdminStatusAction = async (): Promise<boolean> => {
  try {
    const { data: user } = await supabase.auth.getUser()
    if (!user.user?.email) return false

    const { data: adminData, error } = await supabase.from("ADMINS").select("*").eq("email", user.user.email).single()

    if (error && error.code !== "PGRST116") {
      console.error("Error checking admin status:", error)
      return false
    }

    return !!adminData
  } catch (error) {
    console.error("Error checking admin status:", error)
    return false
  }
}

// Load games available for scanning using your existing action
export const loadAdminGamesAction = async () => {
  try {
    const games = await getUpcomingGames(20)

    return {
      success: true,
      data: games,
    }
  } catch (error) {
    console.error("Error loading games:", error)
    return {
      success: false,
      error: "Failed to load games.",
      data: [],
    }
  }
}

// Load scan history for a specific game
export const loadScanHistoryAction = async (gameId: string) => {
  try {
    const { data, error } = await supabase
      .from("qr_codes_generated")
      .select(`
        *,
        users:user_id(first_name, last_name, email)
      `)
      .eq("game_id", gameId)
      .eq("is_used", true)
      .order("scanned_at", { ascending: false })
      .limit(50)

    if (error) throw error

    return {
      success: true,
      data: (data as ScanHistoryItem[]) || [],
    }
  } catch (error) {
    console.error("Error loading scan history:", error)
    return {
      success: false,
      error: "Failed to load scan history.",
      data: [],
    }
  }
}

// Process QR code scan and award points
export const processQRCodeScanAction = async (qrCodeData: string, selectedGame: Game, adminUserId: string) => {
  try {
    // Find the QR code in database
    const { data: qrCode, error: qrError } = await supabase
      .from("qr_codes_generated")
      .select(`
        *,
        users:user_id(user_id, first_name, last_name, email, points)
      `)
      .eq("qr_code_data", qrCodeData)
      .eq("game_id", selectedGame.id)
      .single()

    if (qrError || !qrCode) {
      return {
        success: false,
        message: "This QR code is not valid for the selected game.",
      }
    }

    if (qrCode.is_used) {
      return {
        success: false,
        message: "This QR code has already been used.",
      }
    }

    // Calculate points to award (use game points or default to 10)
    const pointsToAward = selectedGame.points || 10

    // Award points using the database function
    const { data: pointsResult, error: pointsError } = await supabase.rpc("add_user_points", {
      p_user_id: qrCode.user_id,
      p_points: pointsToAward,
      p_transaction_type: "earned",
      p_source_type: "game_attendance",
      p_source_id: selectedGame.id,
      p_description: `Game attendance: ${selectedGame.homeTeam?.name || "Home"} vs ${selectedGame.awayTeam?.name || "Away"}`,
    })

    if (pointsError) {
      console.error("Error awarding points:", pointsError)
      return {
        success: false,
        message: "Failed to award points. Please try again.",
      }
    }

    // Mark QR code as used
    const { error: updateError } = await supabase
      .from("qr_codes_generated")
      .update({
        is_used: true,
        scanned_at: new Date().toISOString(),
        scanned_by: adminUserId,
        points_awarded: pointsToAward,
      })
      .eq("id", qrCode.id)

    if (updateError) {
      console.error("Error updating QR code:", updateError)
    }

    // Add to scan history table
    const { error: historyError } = await supabase.from("scan_history").insert({
      id: selectedGame.id,
      user_id: qrCode.user_id,
      points: pointsToAward,
      description: `Game attendance: ${selectedGame.homeTeam?.name || "Home"} vs ${selectedGame.awayTeam?.name || "Away"}`,
      scanned_at: new Date().toISOString(),
    })

    if (historyError) {
      console.error("Error adding to scan history:", historyError)
    }

    const user = qrCode.users as ScannedUser
    return {
      success: true,
      message: `Awarded ${pointsToAward} points to ${user.first_name} ${user.last_name || ""}`,
      user,
      pointsAwarded: pointsToAward,
    }
  } catch (error) {
    console.error("Error processing scan:", error)
    return {
      success: false,
      message: "Failed to process QR code scan.",
    }
  }
}

// Validate QR code format (optional additional validation)
export const validateQRCodeFormatAction = (qrCodeData: string): boolean => {
  // Basic validation - should contain user ID, game ID, timestamp, and random string
  const parts = qrCodeData.split("-")
  return parts.length >= 4 && parts.every((part) => part.length > 0)
}


export async function check_if_admin(email: string): Promise<boolean> {

  try {
    const { data, error } = await supabase
      .from("ADMINS")
      .select("id") 
      .eq("email", email)
      .maybeSingle()

    if (error) {
      console.error("Error checking admin status:", error)
      return false
    }

    return !!data // true if found, false otherwise
  } catch (error) {
    console.error("Unexpected error checking admin status:", error)
    return false
  }
}


