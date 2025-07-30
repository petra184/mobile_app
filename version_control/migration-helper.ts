/**
 * Migration helper to convert existing action files to use version control
 */
import { dataAccess } from "./data-access-layer"

// Example: Updated birthday packages actions using version control
export async function getBirthdayPackagesVC(filters?: any) {
  try {
    let packages = await dataAccess.getBirthdayPackages()

    // Apply filters
    if (filters?.team_id) {
      packages = packages.filter((pkg) => pkg.team_id === filters.team_id)
    }
    if (filters?.is_featured !== undefined) {
      packages = packages.filter((pkg) => pkg.is_featured === filters.is_featured)
    }
    if (filters?.is_limited_time !== undefined) {
      packages = packages.filter((pkg) => pkg.is_limited_time === filters.is_limited_time)
    }

    return {
      data: packages,
      error: null,
    }
  } catch (error) {
    console.error("Error fetching birthday packages from cache:", error)
    return {
      data: [],
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}

// Example: Updated games actions using version control
export async function getUpcomingGamesVC(limit = 1000, teamId?: string) {
  try {
    const games = await dataAccess.getUpcomingGames(limit, teamId)
    return games
  } catch (error) {
    console.error("Failed to fetch upcoming games from cache:", error)
    return []
  }
}

// Example: Updated teams actions using version control
export async function getTeamsVC() {
  try {
    const teams = await dataAccess.getTeams()
    return teams
  } catch (error) {
    console.error("Failed to fetch teams from cache:", error)
    return []
  }
}

// Example: Updated news actions using version control
export async function getAllNewsVC(limit = 20) {
  try {
    const news = await dataAccess.getAllNews(limit)
    return news
  } catch (error) {
    console.error("Error in getAllNews from cache:", error)
    throw error
  }
}

// Helper function to migrate existing data to version control
export async function migrateExistingData(userId: string) {
  try {
    console.log("🔄 Starting data migration to version control...")

    // Initialize version control with existing user
    const { initializeVersionControl } = await import("./index")
    const result = await initializeVersionControl(userId)

    console.log("✅ Data migration completed:", result)
    return result
  } catch (error) {
    console.error("❌ Data migration failed:", error)
    throw error
  }
}
