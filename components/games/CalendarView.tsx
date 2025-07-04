"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { colors } from "@/constants/colors"
import type { Game } from "@/types/game"
import type { Team } from "@/types/index"
import { getGamesByMonth } from "@/app/actions/games"
import { Feather } from "@expo/vector-icons"

// Transform types for your UI components
export interface TeamForUI {
  id: string
  name: string
  shortName: string
  primaryColor: string
  logo: string | null
}

// Transform database team to UI team
export function transformTeamForUI(dbTeam: Team): TeamForUI {
  return {
    ...dbTeam,
    id: dbTeam.id,
    name: dbTeam.name,
    shortName: dbTeam.short_name,
    primaryColor: dbTeam.color || "red",
    logo:
      dbTeam.photo ||
      null ||
      "https://upload.wikimedia.org/wikipedia/commons/thumb/0/06/Manhattan_Jaspers_logo.svg/1200px-Manhattan_Jaspers_logo.svg.png",
  }
}

interface CalendarViewProps {
  selectedTeam?: Team
  locationType?: string
  onDateSelect?: (date: Date, games: Game[]) => void
}

interface CalendarDay {
  date: Date | null
  hasGame: boolean
  gameCount: number
  games: Game[]
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
  const [loading, setLoading] = useState(false)
  const [allGames, setAllGames] = useState<Game[]>([])

  const currentMonth = currentDate.getMonth()
  const currentYear = currentDate.getFullYear()

  // Memoize filtered games to prevent unnecessary recalculations
  const filteredGames = useMemo(() => {
    if (!allGames.length) return []

    return allGames.filter((game) => {
      // First filter by team if selected
      if (selectedTeam) {
        const isHomeTeam = game.homeTeam.id === selectedTeam.id
        const isAwayTeam = game.awayTeam.id === selectedTeam.id
        if (!isHomeTeam && !isAwayTeam) return false
      }

      // Then filter by location type
      if (!locationType) return true

      if (locationType === "home") {
        return selectedTeam ? game.homeTeam.id === selectedTeam.id : game.location_type === "home"
      } else if (locationType === "away") {
        return selectedTeam ? game.awayTeam.id === selectedTeam.id : game.location_type === "away"
      } else {
        return game.location_type === locationType
      }
    })
  }, [allGames, selectedTeam, locationType])

  // Memoize calendar days generation
  const calendarDays = useMemo(() => {
    const days: CalendarDay[] = []

    // Get first day of the month
    const firstDay = new Date(currentYear, currentMonth, 1)
    const firstDayOfWeek = firstDay.getDay()

    // Add empty days for the start of the month
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push({ date: null, hasGame: false, gameCount: 0, games: [] })
    }

    // Get last day of the month
    const lastDay = new Date(currentYear, currentMonth + 1, 0)
    const daysInMonth = lastDay.getDate()

    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(currentYear, currentMonth, i)

      // Get games on this day
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
        games: gamesOnDay,
      })
    }

    return days
  }, [filteredGames, currentMonth, currentYear])

  // Optimized data loading with debouncing
  const loadGamesForMonth = useCallback(async () => {
    try {
      setLoading(true)

      // Only load games for the current month to reduce data load
      const games = await getGamesByMonth(currentYear, currentMonth, selectedTeam?.id)

      // Limit the number of games to prevent UI overload
      const limitedGames = games.slice(0, 100) // Limit to 100 games max

      setAllGames(limitedGames)
    } catch (error) {
      console.error("Error loading games for month:", error)
      setAllGames([])
    } finally {
      setLoading(false)
    }
  }, [currentMonth, currentYear, selectedTeam?.id])

  // Debounced effect for loading games
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadGamesForMonth()
    }, 100) // Small delay to prevent rapid API calls

    return () => clearTimeout(timeoutId)
  }, [loadGamesForMonth])

  // Reset selected date when month changes
  useEffect(() => {
    setSelectedDate(null)
  }, [currentMonth, currentYear])

  const handleDateSelect = useCallback(
    (date: Date | null) => {
      if (!date) return

      setSelectedDate(date)

      // Find games on the selected date
      const dayData = calendarDays.find(
        (day) =>
          day.date &&
          day.date.getDate() === date.getDate() &&
          day.date.getMonth() === date.getMonth() &&
          day.date.getFullYear() === date.getFullYear(),
      )

      if (onDateSelect && dayData) {
        onDateSelect(date, dayData.games)
      }
    },
    [calendarDays, onDateSelect],
  )

  const goToPreviousMonth = useCallback(() => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1))
  }, [currentYear, currentMonth])

  const goToNextMonth = useCallback(() => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1))
  }, [currentYear, currentMonth])

  const isToday = useCallback((date: Date): boolean => {
    const today = new Date()
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    )
  }, [])

  const isSelected = useCallback(
    (date: Date): boolean => {
      if (!selectedDate) return false
      return (
        date.getDate() === selectedDate.getDate() &&
        date.getMonth() === selectedDate.getMonth() &&
        date.getFullYear() === selectedDate.getFullYear()
      )
    },
    [selectedDate],
  )

  const getTeamColors = useCallback(
    (games: Game[]): string[] => {
      const teamColors = new Set<string>()
      games.forEach((game) => {
        if (selectedTeam) {
          // If a team is selected, use that team's color
          teamColors.add(selectedTeam.color || "#3B82F6")
        } else {
          // Otherwise, use both teams' colors
          if (game.homeTeam?.primaryColor) teamColors.add(game.homeTeam.primaryColor)
          if (game.awayTeam?.primaryColor) teamColors.add(game.awayTeam.primaryColor)

        }
      })

      // Ensure we always have at least one color
      if (teamColors.size === 0) {
        teamColors.add(selectedTeam?.color || "#3B82F6")
      }

      return Array.from(teamColors)
    },
    [selectedTeam],
  )

  const renderGameIndicators = useCallback(
    (day: CalendarDay, isSelectedDay: boolean) => {
      if (!day.hasGame) return null

      const teamColors = getTeamColors(day.games)

      if (day.gameCount === 1) {
        const color = teamColors[0] || colors.primary
        return (
          <View
            style={[
              styles.singleGameIndicator,
              { backgroundColor: color },
              isSelectedDay && styles.selectedGameIndicator,
            ]}
          />
        )
      } else if (day.gameCount === 2 && teamColors.length === 2) {
        // Show split circle for two different teams
        return (
          <View style={styles.multiGameIndicator}>
            <View style={[styles.halfCircleLeft, { backgroundColor: teamColors[0] }]} />
            <View style={[styles.halfCircleRight, { backgroundColor: teamColors[1] }]} />
          </View>
        )
      } else {
        // Show count badge for multiple games
        const color = teamColors[0] || colors.primary
        return (
          <View
            style={[styles.gameCountBadge, { backgroundColor: color }, isSelectedDay && { backgroundColor: "white" }]}
          >
            <Text style={[styles.gameCountText, isSelectedDay && { color: color }]}>{day.gameCount}</Text>
          </View>
        )
      }
    },
    [getTeamColors],
  )

  return (
    <View style={styles.shadowWrapper}>
      <View style={styles.container}>
        {/* Elegant Header with Gradient */}
        <LinearGradient
          colors={[colors.primary, colors.accent]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <Pressable onPress={goToPreviousMonth} style={styles.navButton} disabled={loading}>
            <Feather name="chevron-left" size={24} color="white" />
          </Pressable>

          <View style={styles.monthYearContainer}>
            <Text style={styles.monthText}>{MONTHS[currentMonth]}</Text>
            <Text style={styles.yearText}>{currentYear}</Text>
          </View>

          <Pressable onPress={goToNextMonth} style={styles.navButton} disabled={loading}>
            <Feather name="chevron-right" size={24} color="white" />
          </Pressable>
        </LinearGradient>

        {/* Refined Days of Week Header */}
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

        {/* Enhanced Calendar Grid */}
        {!loading && (
          <View style={styles.calendarGrid}>
            {calendarDays.map((day, index) => {
              const isSelectedDay = day.date && isSelected(day.date)
              const isTodayDay = day.date && isToday(day.date)
              const isPastDay = day.date && isPastDate(day.date)

              return (
                <Pressable
                  key={`${currentMonth}-${currentYear}-${index}`} // Better key for performance
                  style={styles.dayCell}
                  onPress={() => day.date && handleDateSelect(day.date)}
                  disabled={!day.date || loading}
                >
                  {day.date && (
                    <View
                      style={[
                        styles.dayContent,
                        isTodayDay && styles.todayContent,
                        isSelectedDay && styles.selectedContent,
                        isPastDay && !isSelectedDay && styles.pastDateContent,
                      ]}
                    >
                      <Text
                        style={[
                          styles.dayText,
                          isTodayDay && styles.todayText,
                          isSelectedDay && styles.selectedText,
                          isPastDay && !isSelectedDay && styles.pastDateText,
                        ]}
                      >
                        {day.date.getDate()}
                      </Text>
                      <View style={styles.gameIndicatorContainer}>{renderGameIndicators(day, !!isSelectedDay)}</View>
                    </View>
                  )}
                </Pressable>
              )
            })}
          </View>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    backgroundColor: "white",
    overflow: "hidden",
  },
  shadowWrapper: {
    borderRadius: 16,
    backgroundColor: "#fff",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  navButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  monthYearContainer: {
    alignItems: "center",
  },
  monthText: {
    fontSize: 28,
    fontWeight: "900",
    color: "white",
    marginBottom: 2,
    letterSpacing: 0.5,
  },
  yearText: {
    fontSize: 16,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.9)",
    letterSpacing: 1,
  },
  daysOfWeek: {
    flexDirection: "row",
    backgroundColor: "#F8FAFC",
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  dayOfWeekContainer: {
    flex: 1,
    alignItems: "center",
  },
  dayOfWeek: {
    fontSize: 13,
    fontWeight: "800",
    color: "#64748B",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
  },
  loadingText: {
    fontSize: 16,
    color: "#64748B",
    marginTop: 16,
    fontWeight: "500",
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    backgroundColor: "white",
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  dayCell: {
    width: "14.28%",
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 2,
  },
  dayContent: {
    alignItems: "center",
    justifyContent: "center",
    width: 44,
    height: 44,
    borderRadius: 22,
    position: "relative",
  },
  todayContent: {
    backgroundColor: "rgba(102, 126, 234, 0.1)",
    borderWidth: 2,
    borderColor: "#667eea",
  },
  selectedContent: {
    backgroundColor: "#667eea",
    shadowColor: "#667eea",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  pastDateContent: {
    opacity: 0.4,
  },
  dayText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
  },
  todayText: {
    color: "#667eea",
    fontWeight: "900",
  },
  selectedText: {
    color: "white",
    fontWeight: "900",
  },
  pastDateText: {
    color: "#9CA3AF",
  },
  gameIndicatorContainer: {
    position: "absolute",
    bottom: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  singleGameIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  selectedGameIndicator: {
    backgroundColor: "white",
    shadowColor: "#fff",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  multiGameIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    flexDirection: "row",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  halfCircleLeft: {
    width: 6,
    height: 12,
    borderTopLeftRadius: 6,
    borderBottomLeftRadius: 6,
  },
  halfCircleRight: {
    width: 6,
    height: 12,
    borderTopRightRadius: 6,
    borderBottomRightRadius: 6,
  },
  gameCountBadge: {
    minWidth: 16,
    height: 16,
    top:2,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  gameCountText: {
    fontSize: 10,
    fontWeight: "900",
    color: "white",
  },
})

export default CalendarView
