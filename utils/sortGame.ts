import type { Game } from "@/types/updated_types"

export const sortGamesByPriority = (games: Game[]): Game[] => {
  return games.sort((a, b) => {
    // Helper function to check if game is live
    const isLive = (game: Game) => game.status === "live"
    
    // Helper function to check if game is today
    const isToday = (game: Game) => {
      const gameDate = new Date(game.date)
      const today = new Date()
      return gameDate.toDateString() === today.toDateString()
    }
    
    // Helper function to get game priority (lower number = higher priority)
    const getGamePriority = (game: Game) => {
      if (isLive(game)) return 1 // Live games first
      if (isToday(game)) return 2 // Today's games second
      return 3 // All other upcoming games last
    }
    
    const priorityA = getGamePriority(a)
    const priorityB = getGamePriority(b)
    
    // If priorities are different, sort by priority
    if (priorityA !== priorityB) {
      return priorityA - priorityB
    }
    
    // If same priority, sort by date/time
    const dateA = new Date(a.date)
    const dateB = new Date(b.date)
    
    // If dates are the same, sort by time
    if (dateA.toDateString() === dateB.toDateString()) {
      if (a.time && b.time) {
        // Parse time for comparison
        const parseTime = (timeString: string) => {
          if (timeString.includes(":")) {
            const [hours, minutes] = timeString.split(":")
            return parseInt(hours) * 60 + parseInt(minutes)
          }
          return 0
        }
        
        return parseTime(a.time) - parseTime(b.time)
      }
    }
    
    // Sort by date
    return dateA.getTime() - dateB.getTime()
  })
}

// Alternative more detailed sorting function with additional criteria
export const sortGamesDetailed = (games: Game[]): Game[] => {
  return games.sort((a, b) => {
    const now = new Date()
    
    // Helper functions
    const isLive = (game: Game) => game.status === "live"
    const isCompleted = (game: Game) => game.status === "completed"
    const isToday = (game: Game) => {
      const gameDate = new Date(game.date)
      return gameDate.toDateString() === now.toDateString()
    }
    
    const getGameDateTime = (game: Game) => {
      const gameDate = new Date(game.date)
      if (game.time && game.time.includes(":")) {
        const [hours, minutes] = game.time.split(":")
        gameDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0)
      }
      return gameDate
    }
    
    // Priority levels (lower = higher priority)
    const getPriority = (game: Game) => {
      if (isLive(game)) return 1
      if (isCompleted(game)) return 5 // Completed games at the end
      if (isToday(game)) return 2
      
      const gameDateTime = getGameDateTime(game)
      const timeDiff = gameDateTime.getTime() - now.getTime()
      const oneHour = 60 * 60 * 1000
      
      if (timeDiff <= oneHour && timeDiff >= 0) return 2.5 // Within 1 hour
      if (timeDiff > 0) return 3 // Future games
      
      return 4 // Past games (but not completed)
    }
    
    const priorityA = getPriority(a)
    const priorityB = getPriority(b)
    
    if (priorityA !== priorityB) {
      return priorityA - priorityB
    }
    
    // Same priority, sort by date/time
    const dateTimeA = getGameDateTime(a)
    const dateTimeB = getGameDateTime(b)
    
    return dateTimeA.getTime() - dateTimeB.getTime()
  })
}