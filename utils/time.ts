export const parse12HourTime = (timeStr: string): string => {
  try {
    // Handle cases like "7:00 PM" or "10:30 AM"
    const [time, modifier] = timeStr.toUpperCase().split(" ")
    let [hours, minutes] = time.split(":").map(Number)

    if (modifier === "PM" && hours < 12) {
      hours += 12
    }
    if (modifier === "AM" && hours === 12) {
      hours = 0 // Midnight (12 AM) is 0 hours
    }

    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00`
  } catch (e) {
    console.error("Error parsing 12-hour time:", timeStr, e)
    // Fallback to a default or original string if parsing fails
    return "00:00:00"
  }
}

// Calculate game start and end times
export const getGameTimings = (gameData: any) => {
  const gameDate = new Date(gameData.date)
  let gameStartTime = new Date(gameDate) // Initialize with date part

  if (gameData.game_time) {
    const time24h = parse12HourTime(gameData.game_time)
    // Combine date and 24h time string
    gameStartTime = new Date(`${gameDate.toISOString().split("T")[0]}T${time24h}`)
  } else {
    // If no time is provided, assume midnight of the game date
    gameStartTime.setHours(0, 0, 0, 0)
  }

  const gameEndTime = new Date(gameStartTime.getTime() + 60 * 60 * 1000) // 1 hour after game start
  return { gameStartTime, gameEndTime }
}