"use client"

import { useState, useEffect } from "react"
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from "react-native"
import { colors } from "@/constants/colors"
import type { Game } from "@/types/game"
import { Team } from "@/types/index"
import { getGamesByMonth } from "@/app/actions/games"
import { Feather } from "@expo/vector-icons"

interface CalendarViewProps {
  selectedTeam?: Team
  locationType?: string
  onDateSelect?: (date: Date, games: Game[]) => void
}

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
]

const isPastDate = (date: Date): boolean => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return date < today
}

export function CalendarView({ selectedTeam, locationType, onDateSelect }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [calendarDays, setCalendarDays] = useState<Array<{ date: Date | null; hasGame: boolean; gameCount: number }>>(
    [],
  )
  const [loading, setLoading] = useState(false)
  const [allGames, setAllGames] = useState<Game[]>([])

  const currentMonth = currentDate.getMonth()
  const currentYear = currentDate.getFullYear()

  // Load games for the current month
  useEffect(() => {
    loadGamesForMonth()
  }, [currentMonth, currentYear, selectedTeam])

  const loadGamesForMonth = async () => {
    try {
      setLoading(true)
      const games = await getGamesByMonth(currentYear, currentMonth, selectedTeam?.id)
      setAllGames(games)
    } catch (error) {
      console.error("Error loading games for month:", error)
      setAllGames([])
    } finally {
      setLoading(false)
    }
  }

  // Generate calendar days
  useEffect(() => {
    const days: Array<{ date: Date | null; hasGame: boolean; gameCount: number }> = []

    // Filter games by location type
    const filteredGames = allGames.filter((game) => {
      if (!locationType) return true

      if (locationType === "home") {
        return selectedTeam ? game.homeTeam.id === selectedTeam.id : game.locationType === "home"
      } else if (locationType === "away") {
        return selectedTeam ? game.awayTeam.id === selectedTeam.id : game.locationType === "away"
      } else {
        return game.locationType === locationType
      }
    })

    // Get first day of the month
    const firstDay = new Date(currentYear, currentMonth, 1)
    const firstDayOfWeek = firstDay.getDay()

    // Add empty days for the start of the month
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push({ date: null, hasGame: false, gameCount: 0 })
    }

    // Get last day of the month
    const lastDay = new Date(currentYear, currentMonth + 1, 0)
    const daysInMonth = lastDay.getDate()

    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(currentYear, currentMonth, i)

      // Count games on this day
      const gamesOnDay = filteredGames.filter((game) => {
        const gameDate = new Date(game.date)
        return (
          gameDate.getDate() === i && gameDate.getMonth() === currentMonth && gameDate.getFullYear() === currentYear
        )
      })

      days.push({
        date,
        hasGame: gamesOnDay.length > 0,
        gameCount: gamesOnDay.length,
      })
    }

    setCalendarDays(days)
    setSelectedDate(null)
  }, [allGames, locationType, selectedTeam, currentMonth, currentYear])

  const handleDateSelect = (date: Date | null) => {
    if (!date) return

    setSelectedDate(date)

    // Find games on the selected date
    const gamesOnDate = allGames.filter((game) => {
      const gameDate = new Date(game.date)
      const sameDate =
        gameDate.getDate() === date.getDate() &&
        gameDate.getMonth() === date.getMonth() &&
        gameDate.getFullYear() === date.getFullYear()

      if (!sameDate) return false

      // Apply location filter
      if (locationType) {
        if (locationType === "home") {
          return selectedTeam ? game.homeTeam.id === selectedTeam.id : game.locationType === "home"
        } else if (locationType === "away") {
          return selectedTeam ? game.awayTeam.id === selectedTeam.id : game.locationType === "away"
        } else {
          return game.locationType === locationType
        }
      }

      return true
    })

    if (onDateSelect) {
      onDateSelect(date, gamesOnDate)
    }
  }

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1))
  }

  const isToday = (date: Date): boolean => {
    const today = new Date()
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    )
  }

  const isSelected = (date: Date): boolean => {
    if (!selectedDate) return false
    return (
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
    )
  }

  return (
    <View style={styles.container}>
      {/* Modern Calendar Header */}
      <View style={styles.header}>
        <Pressable onPress={goToPreviousMonth} style={styles.navButton}>
          <Feather name="chevron-left" size={24} color="white" />
        </Pressable>

        <View style={styles.monthYearContainer}>
          <Text style={styles.monthText}>{MONTHS[currentMonth]}</Text>
          <Text style={styles.yearText}>{currentYear}</Text>
        </View>

        <Pressable onPress={goToNextMonth} style={styles.navButton}>
          <Feather name="chevron-right" size={24} color="white" />
        </Pressable>
      </View>

      {/* Days of Week Header */}
      <View style={styles.daysOfWeek}>
        {DAYS_OF_WEEK.map((day, index) => (
          <View key={index} style={styles.dayOfWeekContainer}>
            <Text style={styles.dayOfWeek}>{day}</Text>
          </View>
        ))}
      </View>

      {/* Loading State */}
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading games...</Text>
        </View>
      )}

      {/* Calendar Grid */}
      {!loading && (
        <View style={styles.calendarGrid}>
          {calendarDays.map((day, index) => (
            <Pressable
              key={index}
              style={[
                styles.dayCell,
                day.date && isToday(day.date) && styles.todayCell,
                day.date && isSelected(day.date) && styles.selectedCell,
                day.date && isPastDate(day.date) && !isSelected(day.date) && styles.pastDateCell,
              ]}
              onPress={() => day.date && handleDateSelect(day.date)}
              disabled={!day.date}
            >
              {day.date && (
                <View style={styles.dayContent}>
                  <Text
                    style={[
                      styles.dayText,
                      isToday(day.date) && styles.todayText,
                      isSelected(day.date) && styles.selectedText,
                      isPastDate(day.date) && !isSelected(day.date) && styles.pastDateText,
                    ]}
                  >
                    {day.date.getDate()}
                  </Text>
                  {day.hasGame && (
                    <View style={styles.gameIndicatorContainer}>
                      {day.gameCount === 1 ? (
                        <View
                          style={[
                            styles.gameIndicator,
                            isSelected(day.date) && styles.selectedGameIndicator,
                            selectedTeam && { backgroundColor: selectedTeam.color || colors.primary },
                          ]}
                        />
                      ) : (
                        <View
                          style={[
                            styles.multipleGamesContainer,
                            selectedTeam && { backgroundColor: selectedTeam.color || colors.primary },
                          ]}
                        >
                          <Text style={[styles.gameCountText, isSelected(day.date) && styles.selectedGameCountText]}>
                            {day.gameCount}
                          </Text>
                        </View>
                      )}
                    </View>
                  )}
                </View>
              )}
            </Pressable>
          ))}
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "white",
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 20,
    //`linear-gradient(135deg, ${colors.primary} 0%, #4F46E5 100%)`,
    backgroundColor: colors.primary,
  },
  navButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  monthYearContainer: {
    alignItems: "center",
  },
  monthText: {
    fontSize: 24,
    fontWeight: "800",
    color: "white",
    marginBottom: 2,
  },
  yearText: {
    fontSize: 14,
    fontWeight: "500",
    color: "rgba(255, 255, 255, 0.8)",
  },
  daysOfWeek: {
    flexDirection: "row",
    backgroundColor: "#F8FAFC",
    paddingVertical: 16,
  },
  dayOfWeekContainer: {
    flex: 1,
    alignItems: "center",
  },
  dayOfWeek: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748B",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 12,
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    backgroundColor: "white",
  },
  dayCell: {
    width: "14.28%",
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 4,
  },
  todayCell: {
    backgroundColor: "rgba(59, 130, 246, 0.1)",
  },
  selectedCell: {
    backgroundColor: colors.primary,
  },
  pastDateCell: {
    opacity: 0.4,
  },
  dayContent: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    height: "100%",
    borderRadius: 12,
  },
  dayText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 2,
  },
  todayText: {
    color: colors.primary,
    fontWeight: "800",
  },
  selectedText: {
    color: "white",
    fontWeight: "700",
  },
  pastDateText: {
    color: "#9CA3AF",
  },
  gameIndicatorContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  gameIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  selectedGameIndicator: {
    backgroundColor: "white",
  },
  multipleGamesContainer: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: "center",
  },
  gameCountText: {
    fontSize: 10,
    fontWeight: "700",
    color: "white",
  },
  selectedGameCountText: {
    color: colors.primary,
  },
})

export default CalendarView
