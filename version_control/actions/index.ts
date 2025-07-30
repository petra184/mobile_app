// Replace your existing games actions
import { dataAccess } from "../index"
import type { Game } from "@/types/updated_types"
import type { NewsArticle } from "@/types/updated_types"
import type { Team } from "@/types/updated_types"


export async function getUpcomingGames(limit = 1000, teamId?: string): Promise<Game[]> {
  try {
    return await dataAccess.getUpcomingGames(limit, teamId)
  } catch (error) {
    console.error("Failed to fetch upcoming games from cache:", error)
    return []
  }
}

export async function getPastGames(limit = 1000, teamId?: string): Promise<Game[]> {
  try {
    return await dataAccess.getPastGames(limit, teamId)
  } catch (error) {
    console.error("Failed to fetch past games from cache:", error)
    return []
  }
}

export async function getGameById(gameId: string): Promise<Game | null> {
  try {
    return await dataAccess.getGameById(gameId)
  } catch (error) {
    console.error("Failed to fetch game by id from cache:", error)
    return null
  }
}

export async function getLiveGames(limit = 100): Promise<Game[]> {
  try {
    const today = new Date().toISOString().split("T")[0]
    const games = await dataAccess.getByFilter("games", (game: any) => {
      if (game.date !== today) return false
      if (game.status === "completed" || game.status === "postponed" || game.status === "canceled") {
        return false
      }
      // Add your live game logic here
      return true
    })
    return games.slice(0, limit)
  } catch (error) {
    console.error("Failed to fetch live games from cache:", error)
    return []
  }
}

export async function getAllNews(limit = 20): Promise<NewsArticle[]> {
  try {
    return await dataAccess.getAllNews(limit)
  } catch (error) {
    console.error("Error in getAllNews from cache:", error)
    throw error
  }
}

export async function getNewsByTeam(teamId: string, limit = 20): Promise<NewsArticle[]> {
  try {
    return await dataAccess.getNewsByTeam(teamId, limit)
  } catch (error) {
    console.error("Error in getNewsByTeam from cache:", error)
    throw error
  }
}

export async function getNewsById(id: string): Promise<NewsArticle | null> {
  try {
    return await dataAccess.getNewsById(id)
  } catch (error) {
    console.error("Error in getNewsById from cache:", error)
    throw error
  }
}

export async function searchNews(query: string, limit = 20): Promise<NewsArticle[]> {
  try {
    const allNews = await dataAccess.getAllNews(1000) // Get more for searching
    const filtered = allNews.filter(
      (article) =>
        article.title?.toLowerCase().includes(query.toLowerCase()) ||
        article.headline?.toLowerCase().includes(query.toLowerCase()) ||
        article.content?.toLowerCase().includes(query.toLowerCase()),
    )
    return filtered.slice(0, limit)
  } catch (error) {
    console.error("Error searching news from cache:", error)
    return []
  }
}



export async function getTeams(): Promise<Team[]> {
  try {
    return await dataAccess.getTeams()
  } catch (error) {
    console.error("Failed to fetch teams from cache:", error)
    return []
  }
}

export async function getTeamById(id: string): Promise<Team | null> {
  try {
    return await dataAccess.getTeamById(id)
  } catch (error) {
    console.error("Failed to fetch team by id from cache:", error)
    return null
  }
}

export async function getTeamsByGender(gender: "men" | "women"): Promise<Team[]> {
  try {
    return await dataAccess.getTeamsByGender(gender)
  } catch (error) {
    console.error("Failed to fetch teams by gender from cache:", error)
    return []
  }
}

export async function getTeamsBySport(sport: string): Promise<Team[]> {
  try {
    return await dataAccess.getTeamsBySport(sport)
  } catch (error) {
    console.error("Failed to fetch teams by sport from cache:", error)
    return []
  }
}

// For data that needs to be updated (like user preferences)
export async function updateTeam(teamId: string, updates: Partial<Team>): Promise<void> {
  try {
    await dataAccess.updateEntity("teams", teamId, updates)
    // This will mark the team for sync on next connection
  } catch (error) {
    console.error("Failed to update team:", error)
    throw error
  }
}
