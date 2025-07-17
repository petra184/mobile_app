import { supabase } from "@/lib/supabase"
import { formatTimeString } from "@/utils/dateUtils"
import { colors } from "@/constants/colors"
import type {GameScheduleRow, OpposingTeamRow, TeamsRow, Game, Team} from "@/types/updated_types"


// Query result type with relationships
type GameScheduleWithRelations = GameScheduleRow & {
  sport_id: TeamsRow | null
  opponent_id: OpposingTeamRow | null
}

/**
 * Get upcoming games with optional filtering
 * @param limit Maximum number of games to return (default: 1000)
 * @param teamId Optional team ID to filter games
 * @returns Array of upcoming games
 */
export async function getUpcomingGames(limit = 1000, teamId?: string): Promise<Game[]> {
  try {
    // Build query with proper field selection
    let query = supabase
      .from("game_schedule")
      .select(`
        game_id,
        sport_id,
        date,
        location,
        game_time,
        points,
        opponent_id,
        school_id,
        season_type,
        final_home_score,
        final_guest_score,
        special_events,
        halftime_activity,
        status,
        photo_url,
        game_type,
        game_notes,
        last_updated,
        sport_id:teams!game_schedule_sport_id_fkey(*),
        opponent_id:opposing_teams!game_schedule_opponent_id_fkey(*)
      `)
      .gte("date", new Date().toISOString().split("T")[0])
      .order("date", { ascending: true })
      .limit(limit)

    // Add team filter if provided
    if (teamId) {
      query = query.eq("sport_id", teamId)
    }

    // Execute query
    const { data: gameSchedules, error } = await query

    if (error) {
      console.error("Error fetching upcoming games:", error)
      throw new Error(`Failed to fetch upcoming games: ${error.message}`)
    }

    // Transform data
    const games = await transformGameSchedules(gameSchedules || [])
    return games
  } catch (error) {
    console.error("Failed to fetch upcoming games:", error)
    return []
  }
}

/**
 * Get past games with optional filtering
 * @param limit Maximum number of games to return (default: 1000)
 * @param teamId Optional team ID to filter games
 * @returns Array of past games
 */
export async function getPastGames(limit = 1000, teamId?: string): Promise<Game[]> {
  try {
    let query = supabase
      .from("game_schedule")
      .select(`
        game_id,
        sport_id,
        date,
        location,
        game_time,
        points,
        opponent_id,
        school_id,
        season_type,
        final_home_score,
        final_guest_score,
        special_events,
        halftime_activity,
        status,
        photo_url,
        game_type,
        game_notes,
        last_updated,
        sport_id:teams!game_schedule_sport_id_fkey(*),
        opponent_id:opposing_teams!game_schedule_opponent_id_fkey(*)
      `)
      .lt("date", new Date().toISOString().split("T")[0])
      .order("date", { ascending: false })
      .limit(limit)

    if (teamId) {
      query = query.eq("sport_id", teamId)
    }

    const { data: gameSchedules, error } = await query

    if (error) {
      console.error("Error fetching past games:", error)
      throw new Error(`Failed to fetch past games: ${error.message}`)
    }

    const games = await transformGameSchedules(gameSchedules || [])
    return games
  } catch (error) {
    console.error("Failed to fetch past games:", error)
    return []
  }
}

/**
 * Get games for a specific month and year
 * @param year The year to fetch games for
 * @param month The month to fetch games for (0-11)
 * @param teamId Optional team ID to filter games
 * @returns Array of games for the specified month
 */
export async function getGamesByMonth(year: number, month: number, teamId?: string): Promise<Game[]> {
  try {
    const startDate = new Date(year, month, 1).toISOString().split("T")[0]
    const endDate = new Date(year, month + 1, 0).toISOString().split("T")[0]

    let query = supabase
      .from("game_schedule")
      .select(`
        game_id,
        sport_id,
        date,
        location,
        game_time,
        points,
        opponent_id,
        school_id,
        season_type,
        final_home_score,
        final_guest_score,
        special_events,
        halftime_activity,
        status,
        photo_url,
        game_type,
        game_notes,
        last_updated,
        sport_id:teams!game_schedule_sport_id_fkey(*),
        opponent_id:opposing_teams!game_schedule_opponent_id_fkey(*)
      `)
      .gte("date", startDate)
      .lte("date", endDate)
      .order("date", { ascending: true })

    if (teamId) {
      query = query.eq("sport_id", teamId)
    }

    const { data: gameSchedules, error } = await query

    if (error) {
      console.error("Error fetching games by month:", error)
      throw new Error(`Failed to fetch games by month: ${error.message}`)
    }

    const games = await transformGameSchedules(gameSchedules || [])
    return games
  } catch (error) {
    console.error("Failed to fetch games by month:", error)
    return []
  }
}

/**
 * Get a specific game by ID
 * @param gameId The game ID to fetch
 * @returns Game object or null if not found
 */
export async function getGameById(gameId: string): Promise<Game | null> {
  try {
    const { data: gameSchedule, error } = await supabase
      .from("game_schedule")
      .select(`
        game_id,
        sport_id,
        date,
        location,
        game_time,
        points,
        opponent_id,
        school_id,
        season_type,
        final_home_score,
        final_guest_score,
        special_events,
        halftime_activity,
        status,
        photo_url,
        game_type,
        game_notes,
        last_updated,
        sport_id:teams!game_schedule_sport_id_fkey(*),
        opponent_id:opposing_teams!game_schedule_opponent_id_fkey(*)
      `)
      .eq("game_id", gameId)
      .single()

    if (error) {
      console.error("Error fetching game by id:", error)
      throw new Error(`Failed to fetch game by id: ${error.message}`)
    }

    if (!gameSchedule) {
      return null
    }

    const games = await transformGameSchedules([gameSchedule])
    return games[0] || null
  } catch (error) {
    console.error("Failed to fetch game by id:", error)
    return null
  }
}

/**
 * Get live games that are happening now
 * @param limit Maximum number of games to return (default: 100)
 * @returns Array of live games
 */
export async function getLiveGames(limit = 100): Promise<Game[]> {
  try {
    const today = new Date().toISOString().split("T")[0]
    const { data: gameSchedules, error } = await supabase
      .from("game_schedule")
      .select(`
        game_id,
        sport_id,
        date,
        location,
        game_time,
        points,
        opponent_id,
        school_id,
        season_type,
        final_home_score,
        final_guest_score,
        special_events,
        halftime_activity,
        status,
        photo_url,
        game_type,
        game_notes,
        last_updated,
        sport_id:teams!game_schedule_sport_id_fkey(*),
        opponent_id:opposing_teams!game_schedule_opponent_id_fkey(*)
      `)
      .eq("date", today)
      .order("game_time", { ascending: true })
      .limit(limit)

    if (error) {
      console.error("Error fetching live games:", error)
      throw new Error(`Failed to fetch live games: ${error.message}`)
    }

    const now = new Date()
    const currentHour = now.getHours()
    const potentiallyLiveGames =
      gameSchedules?.filter((game) => {
        if (!game.game_time) return false
        const [hourStr] = game.game_time.split(":")
        const gameHour = Number.parseInt(hourStr, 10)
        return gameHour <= currentHour && gameHour >= currentHour - 3
      }) || []

    const games = await transformGameSchedules(potentiallyLiveGames)
    return games
  } catch (error) {
    console.error("Failed to fetch live games:", error)
    return []
  }
}

/**
 * Get games for a specific team
 * @param teamId The team ID to fetch games for
 * @param limit Maximum number of games to return (default: 1000)
 * @returns Array of games for the specified team
 */
export async function getTeamGames(teamId: string, limit = 1000): Promise<Game[]> {
  try {
    const { data: gameSchedules, error } = await supabase
      .from("game_schedule")
      .select(`
        game_id,
        sport_id,
        date,
        location,
        game_time,
        points,
        opponent_id,
        school_id,
        season_type,
        final_home_score,
        final_guest_score,
        special_events,
        halftime_activity,
        status,
        photo_url,
        game_type,
        game_notes,
        last_updated,
        sport_id:teams!game_schedule_sport_id_fkey(*),
        opponent_id:opposing_teams!game_schedule_opponent_id_fkey(*)
      `)
      .eq("sport_id", teamId)
      .order("date", { ascending: true })
      .limit(limit)

    if (error) {
      console.error("Error fetching team games:", error)
      throw new Error(`Failed to fetch team games: ${error.message}`)
    }

    const games = await transformGameSchedules(gameSchedules || [])
    return games
  } catch (error) {
    console.error("Failed to fetch team games:", error)
    return []
  }
}

/**
 * Convert database team to the Team type expected by Game interface
 * @param dbTeam Team from database
 * @returns Team object compatible with Game interface
 */
function convertDbTeamToTeam(dbTeam: TeamsRow): Team {
  return {
    id: dbTeam.id,
    name: dbTeam.name,
    shortName: dbTeam.short_name,
    primaryColor: dbTeam.color || colors.primary,
    logo:
      dbTeam.photo ||
      "https://upload.wikimedia.org/wikipedia/commons/thumb/0/06/Manhattan_Jaspers_logo.svg/1200px-Manhattan_Jaspers_logo.svg.png",
    sport: dbTeam.sport,
    gender: dbTeam.gender,
  }
}

export function convertUiTeamToDbTeam(uiTeam: Team): any {
  return {
    id: uiTeam.id,
    name: uiTeam.name,
    short_name: uiTeam.shortName,
    color: uiTeam.primaryColor,
    photo: uiTeam.logo,
    sport: uiTeam.sport,
    gender: uiTeam.gender,
    about_team: null,
    facebook: null,
    instagram: null,
    twitter: null,
    website: null,
    image_fit: null,
    image_position: null,
    image_scale: null,
    last_updated: new Date().toISOString(),
  }
}

/**
 * Transform game schedule data from Supabase into Game objects
 * @param gameSchedules Array of game schedule rows from Supabase
 * @returns Array of transformed Game objects
 */
async function transformGameSchedules(gameSchedules: GameScheduleWithRelations[]): Promise<Game[]> {
  const gamePromises = gameSchedules.map(async (schedule) => {
    try {
      // Handle home team (sport_id relationship)
      if (!schedule.sport_id) {
        console.warn(`No sport_id found for game ${schedule.game_id}`)
        return null
      }
      const homeTeam = convertDbTeamToTeam(schedule.sport_id)

      // Create away team from opponent data
      const awayTeam: Team = schedule.opponent_id
        ? {
            id: schedule.opponent_id.id,
            name: schedule.opponent_id.name,
            shortName: schedule.opponent_id.name.split(" ").pop() || schedule.opponent_id.name,
            primaryColor: "#666666",
            logo: schedule.opponent_id.logo || "",
            sport: homeTeam.sport,
            gender: homeTeam.gender,
          }
        : {
            id: "unknown",
            name: "Unknown Opponent",
            shortName: "Unknown",
            primaryColor: "#666666",
            logo: "",
            sport: homeTeam.sport,
            gender: homeTeam.gender,
          }

      const status = schedule.status || "scheduled"

      // Create game object
      const game: Game = {
        id: schedule.game_id,
        date: schedule.date,
        time: formatTimeString(schedule.game_time),
        status: status as any, // Cast to your GameStatus type
        location: schedule.location || "TBD",
        game_type: schedule.game_type || "TBD",
        homeTeam,
        awayTeam,
        sport: {
          name: homeTeam.sport,
          display_name: homeTeam.sport.charAt(0).toUpperCase() + homeTeam.sport.slice(1),
        },
        seasonType: schedule.season_type || "Regular",
        points: schedule.points || 0,
        photo_url: schedule.photo_url,
        special_events: schedule.special_events,
        halftime_activity: schedule.halftime_activity || null,
      }

      // Add score if available
      if (schedule.final_home_score !== null && schedule.final_guest_score !== null) {
        game.score = {
          home: schedule.final_home_score,
          away: Number.parseInt(schedule.final_guest_score, 10),
        }
      }

      return game
    } catch (error) {
      console.error(`Error transforming game ${schedule.game_id}:`, error)
      return null
    }
  })

  const games = (await Promise.all(gamePromises)).filter(Boolean) as Game[]
  return games
}