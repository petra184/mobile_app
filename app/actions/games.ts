import { supabase } from "@/lib/supabase";
import { getTeamById } from "@/app/actions/teams";
import type { Game, GameStatus, GameScheduleRow, OpposingTeamRow } from "@/types/game";
import { formatTimeString } from "@/utils/dateUtils";

/**
 * Get upcoming games with optional filtering
 * @param limit Maximum number of games to return (default: 10)
 * @param teamId Optional team ID to filter games
 * @returns Array of upcoming games
 */
export async function getUpcomingGames(limit: number = 10, teamId?: string): Promise<Game[]> {
  try {
    // Build query
    let query = supabase
      .from("game_schedule")
      .select(`
        *,
        sport_id (*),
        opponent_id (*)
      `)
      .gte('date', new Date().toISOString().split('T')[0])
      .order('date', { ascending: true })
      .limit(limit);

    // Add team filter if provided
    if (teamId) {
      query = query.eq('sport_id', teamId);
    }

    // Execute query
    const { data: gameSchedules, error } = await query;

    if (error) {
      console.error("Error fetching upcoming games:", error);
      throw new Error(`Failed to fetch upcoming games: ${error.message}`);
    }

    // Transform data
    const games = await transformGameSchedules(gameSchedules || []);
    return games;
  } catch (error) {
    console.error("Failed to fetch upcoming games:", error);
    return [];
  }
}

/**
 * Get past games with optional filtering
 * @param limit Maximum number of games to return (default: 10)
 * @param teamId Optional team ID to filter games
 * @returns Array of past games
 */
export async function getPastGames(limit: number = 10, teamId?: string): Promise<Game[]> {
  try {
    // Build query
    let query = supabase
      .from("game_schedule")
      .select(`
        *,
        sport_id (*),
        opponent_id (*)
      `)
      .lt('date', new Date().toISOString().split('T')[0])
      .order('date', { ascending: false })
      .limit(limit);

    // Add team filter if provided
    if (teamId) {
      query = query.eq('sport_id', teamId);
    }

    // Execute query
    const { data: gameSchedules, error } = await query;

    if (error) {
      console.error("Error fetching past games:", error);
      throw new Error(`Failed to fetch past games: ${error.message}`);
    }

    // Transform data
    const games = await transformGameSchedules(gameSchedules || [], 'completed');
    return games;
  } catch (error) {
    console.error("Failed to fetch past games:", error);
    return [];
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
        *,
        sport_id (*),
        opponent_id (*)
      `)
      .eq('game_id', gameId)
      .single();

    if (error) {
      console.error("Error fetching game by id:", error);
      throw new Error(`Failed to fetch game by id: ${error.message}`);
    }

    if (!gameSchedule) {
      return null;
    }

    // Transform data
    const games = await transformGameSchedules([gameSchedule]);
    return games[0] || null;
  } catch (error) {
    console.error("Failed to fetch game by id:", error);
    return null;
  }
}

/**
 * Get live games that are happening now
 * @param limit Maximum number of games to return (default: 5)
 * @returns Array of live games
 */
export async function getLiveGames(limit: number = 5): Promise<Game[]> {
  try {
    // Get today's date
    const today = new Date().toISOString().split('T')[0];
    
    // Get games scheduled for today
    const { data: gameSchedules, error } = await supabase
      .from("game_schedule")
      .select(`
        *,
        sport_id (*),
        opponent_id (*)
      `)
      .eq('date', today)
      .order('game_time', { ascending: true })
      .limit(limit);

    if (error) {
      console.error("Error fetching live games:", error);
      throw new Error(`Failed to fetch live games: ${error.message}`);
    }

    // Filter for games that are likely live based on time
    const now = new Date();
    const currentHour = now.getHours();
    
    const potentiallyLiveGames = gameSchedules?.filter(game => {
      if (!game.game_time) return false;
      
      const [hourStr] = game.game_time.split(':');
      const gameHour = parseInt(hourStr, 10);
      
      // Consider games live if they started in the last 3 hours
      return gameHour <= currentHour && gameHour >= currentHour - 3;
    }) || [];

    // Transform data
    const games = await transformGameSchedules(potentiallyLiveGames, 'live');
    return games;
  } catch (error) {
    console.error("Failed to fetch live games:", error);
    return [];
  }
}

/**
 * Get games for a specific team
 * @param teamId The team ID to fetch games for
 * @param limit Maximum number of games to return (default: 20)
 * @returns Array of games for the specified team
 */
export async function getTeamGames(teamId: string, limit: number = 20): Promise<Game[]> {
  try {
    const { data: gameSchedules, error } = await supabase
      .from("game_schedule")
      .select(`
        *,
        sport_id (*),
        opponent_id (*)
      `)
      .eq('sport_id', teamId)
      .order('date', { ascending: true })
      .limit(limit);

    if (error) {
      console.error("Error fetching team games:", error);
      throw new Error(`Failed to fetch team games: ${error.message}`);
    }

    // Transform data
    const games = await transformGameSchedules(gameSchedules || []);
    return games;
  } catch (error) {
    console.error("Failed to fetch team games:", error);
    return [];
  }
}

/**
 * Transform game schedule data from Supabase into Game objects
 * @param gameSchedules Array of game schedule rows from Supabase
 * @param defaultStatus Optional default status to assign to games
 * @returns Array of transformed Game objects
 */
async function transformGameSchedules(
  gameSchedules: (GameScheduleRow & { 
    sport_id: any; 
    opponent_id: OpposingTeamRow | null;
  })[],
  defaultStatus?: GameStatus
): Promise<Game[]> {
  // Process games in parallel
  const gamePromises = gameSchedules.map(async (schedule) => {
    try {
      // Get home team (our team)
      const homeTeam = await getTeamById(schedule.sport_id?.id || '');
      
      if (!homeTeam) {
        throw new Error(`Home team not found for game ${schedule.game_id}`);
      }

      // Create away team from opponent data
      const awayTeam = schedule.opponent_id ? {
        id: schedule.opponent_id.id,
        name: schedule.opponent_id.name,
        shortName: schedule.opponent_id.name.split(' ').pop() || schedule.opponent_id.name,
        primaryColor: '#666666', // Default color for opponents
        logo: schedule.opponent_id.logo || `/placeholder.svg?height=64&width=64&text=${schedule.opponent_id.name.charAt(0)}`,
        sport: homeTeam.sport,
        gender: homeTeam.gender,
      } : {
        id: 'unknown',
        name: 'Unknown Opponent',
        shortName: 'Unknown',
        primaryColor: '#666666',
        logo: `/placeholder.svg?height=64&width=64&text=?`,
        sport: homeTeam.sport,
        gender: homeTeam.gender,
      };

      // Determine game status
      let status: GameStatus = defaultStatus || 'scheduled';
      
      // If we have scores, it's completed
      if (schedule.final_home_score !== null && schedule.final_guest_score !== null) {
        status = 'completed';
      }
      
      // Create game object
      const game: Game = {
        id: schedule.game_id,
        date: schedule.date,
        time: formatTimeString(schedule.game_time),
        status,
        location: schedule.location || 'TBD',
        locationType: 'Home', // Default to home, could be enhanced with actual data
        homeTeam,
        awayTeam,
        sport: {
          name: homeTeam.sport,
          display_name: homeTeam.sport.charAt(0).toUpperCase() + homeTeam.sport.slice(1)
        },
        seasonType: schedule.season_type || 'Regular',
        points: schedule.points || 0
      };

      // Add score if available
      if (schedule.final_home_score !== null && schedule.final_guest_score !== null) {
        game.score = {
          home: schedule.final_home_score,
          away: parseInt(schedule.final_guest_score || '0', 10)
        };
      }

      return game;
    } catch (error) {
      console.error(`Error transforming game ${schedule.game_id}:`, error);
      return null;
    }
  });

  // Wait for all promises to resolve and filter out nulls
  const games = (await Promise.all(gamePromises)).filter(Boolean) as Game[];
  return games;
}