import { supabase } from "@/lib/supabase"
import type { Database } from "@/types/supabase"

// Database table types
type StoriesRow = Database["public"]["Tables"]["stories"]["Row"]
type TeamsRow = Database["public"]["Tables"]["teams"]["Row"]

// App-specific interfaces
export interface NewsArticle {
  id: string
  title: string
  headline: string
  content: string
  author: string
  imageUrl: string | null
  createdAt: string
  publishDate: string | null
  status: string
  tag: string | null
  teamId: string | null
  team?: {
    id: string
    name: string
    sport: string
    gender: string
    photo: string | null
  }
}

// Transform database story to app interface
function transformStoryToArticle(story: StoriesRow, team?: TeamsRow): NewsArticle {
  return {
    id: story.id,
    title: story.title || "Untitled",
    headline: story.headline || "",
    content: story.content || "",
    author: story.author || "Unknown Author",
    imageUrl: story.image_url,
    createdAt: story.created_at,
    publishDate: story.scheduled_publish_date,
    status: story.status || "draft",
    tag: story.tag,
    teamId: story.team_id,
    team: team
      ? {
          id: team.id,
          name: team.name,
          sport: team.sport,
          gender: team.gender,
          photo: team.photo,
        }
      : undefined,
  }
}

// Get all published news articles with team information
export async function getAllNews(limit = 20): Promise<NewsArticle[]> {
  try {
    const { data, error } = await supabase
      .from("stories")
      .select(
        `
        *,
        teams (
          id,
          name,
          sport,
          gender,
          photo
        )
      `,
      )
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error) {
      console.error("Error fetching news:", error)
      throw new Error(`Failed to fetch news: ${error.message}`)
    }

    return (data || []).map((story) => transformStoryToArticle(story, story.teams))
  } catch (error) {
    console.error("Error in getAllNews:", error)
    throw error
  }
}

// Get news articles by team ID
export async function getNewsByTeam(teamId: string, limit = 20): Promise<NewsArticle[]> {
  try {
    const { data, error } = await supabase
      .from("stories")
      .select(
        `
        *,
        teams (
          id,
          name,
          sport,
          gender,
          photo
        )
      `,
      )
      .eq("team_id", teamId)
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error) {
      console.error("Error fetching team news:", error)
      throw new Error(`Failed to fetch team news: ${error.message}`)
    }

    return (data || []).map((story) => transformStoryToArticle(story, story.teams))
  } catch (error) {
    console.error("Error in getNewsByTeam:", error)
    throw error
  }
}

// Get a single news article by ID
export async function getNewsById(id: string): Promise<NewsArticle | null> {
  try {
    const { data, error } = await supabase
      .from("stories")
      .select(
        `
        *,
        teams (
          id,
          name,
          sport,
          gender,
          photo
        )
      `,
      )
      .eq("id", id)
      .eq("status", "published")
      .single()

    if (error) {
      if (error.code === "PGRST116") {
        // No rows returned
        return null
      }
      console.error("Error fetching news article:", error)
      throw new Error(`Failed to fetch news article: ${error.message}`)
    }

    return transformStoryToArticle(data, data.teams)
  } catch (error) {
    console.error("Error in getNewsById:", error)
    throw error
  }
}

// Get latest news articles (most recent)
export async function getLatestNews(limit = 10): Promise<NewsArticle[]> {
  try {
    const { data, error } = await supabase
      .from("stories")
      .select(
        `
        *,
        teams (
          id,
          name,
          sport,
          gender,
          photo
        )
      `,
      )
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error) {
      console.error("Error fetching latest news:", error)
      throw new Error(`Failed to fetch latest news: ${error.message}`)
    }

    return (data || []).map((story) => transformStoryToArticle(story, story.teams))
  } catch (error) {
    console.error("Error in getLatestNews:", error)
    throw error
  }
}

// Search news articles by title, headline, or content
export async function searchNews(query: string, limit = 20): Promise<NewsArticle[]> {
  try {
    const { data, error } = await supabase
      .from("stories")
      .select(
        `
        *,
        teams (
          id,
          name,
          sport,
          gender,
          photo
        )
      `,
      )
      .eq("status", "published")
      .or(`title.ilike.%${query}%,headline.ilike.%${query}%,content.ilike.%${query}%`)
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error) {
      console.error("Error searching news:", error)
      throw new Error(`Failed to search news: ${error.message}`)
    }

    return (data || []).map((story) => transformStoryToArticle(story, story.teams))
  } catch (error) {
    console.error("Error in searchNews:", error)
    throw error
  }
}

// Get news by tag
export async function getNewsByTag(tag: string, limit = 20): Promise<NewsArticle[]> {
  try {
    const { data, error } = await supabase
      .from("stories")
      .select(
        `
        *,
        teams (
          id,
          name,
          sport,
          gender,
          photo
        )
      `,
      )
      .eq("status", "published")
      .eq("tag", tag)
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error) {
      console.error("Error fetching news by tag:", error)
      throw new Error(`Failed to fetch news by tag: ${error.message}`)
    }

    return (data || []).map((story) => transformStoryToArticle(story, story.teams))
  } catch (error) {
    console.error("Error in getNewsByTag:", error)
    throw error
  }
}

// Get featured news (you can modify this based on your criteria)
export async function getFeaturedNews(limit = 5): Promise<NewsArticle[]> {
  try {
    // For now, we'll get the most recent news as "featured"
    // You can modify this to use a specific field or criteria
    const { data, error } = await supabase
      .from("stories")
      .select(
        `
        *,
        teams (
          id,
          name,
          sport,
          gender,
          photo
        )
      `,
      )
      .eq("status", "published")
      .not("image_url", "is", null) // Only articles with images
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error) {
      console.error("Error fetching featured news:", error)
      throw new Error(`Failed to fetch featured news: ${error.message}`)
    }

    return (data || []).map((story) => transformStoryToArticle(story, story.teams))
  } catch (error) {
    console.error("Error in getFeaturedNews:", error)
    throw error
  }
}

export async function getStoryByGameId(gameId: string) {

  try {
    const { data, error } = await supabase
      .from("stories")
      .select("id, title, headline")
      .eq("game_id", gameId)
      .eq("status", "published") // Only get published stories
      .single()

    if (error) {
      // If no story found, return null (not an error)
      if (error.code === "PGRST116") {
        return null
      }
      console.error("Error fetching story by game ID:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Unexpected error fetching story by game ID:", error)
    return null
  }
}

// Alternative function that returns boolean for simpler checking
export async function hasStoryForGame(gameId: string): Promise<boolean> {

  try {
    const { data, error } = await supabase
      .from("stories")
      .select("id")
      .eq("game_id", gameId)
      .eq("status", "published")
      .limit(1)

    if (error) {
      console.error("Error checking story for game:", error)
      return false
    }

    return data && data.length > 0
  } catch (error) {
    console.error("Unexpected error checking story for game:", error)
    return false
  }
}
