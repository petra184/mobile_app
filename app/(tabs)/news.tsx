"use client"

import { useState, useEffect, useMemo } from "react"
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Platform, ActivityIndicator } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useRouter } from "expo-router"
import { colors } from "@/constants/colors"
import { getAllNews, getNewsByTeam, searchNews, type NewsArticle } from "@/app/actions/news"
import { getTeams, type Team } from "@/app/actions/teams"
import { EnhancedDropdown } from "@/components/ui/new_dropdown"
import { NewsCard } from "@/components/news/NewsCard"
import { Feather } from "@expo/vector-icons"

export default function NewsScreen() {
  const router = useRouter()
  const [teams, setTeams] = useState<Team[]>([])
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [newsArticles, setNewsArticles] = useState<NewsArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [searchLoading, setSearchLoading] = useState(false)
  const [teamsLoading, setTeamsLoading] = useState(true)

  // Load teams on component mount
  useEffect(() => {
    loadTeams()
  }, [])

  // Load initial news articles
  useEffect(() => {
    if (!teamsLoading) {
      loadNews()
    }
  }, [selectedTeam, teamsLoading])

  // Handle search with debouncing
  useEffect(() => {
    if (searchQuery.trim()) {
      const timeoutId = setTimeout(() => {
        handleSearch()
      }, 500) // 500ms debounce

      return () => clearTimeout(timeoutId)
    } else {
      loadNews()
    }
  }, [searchQuery])

  const loadTeams = async () => {
    try {
      setTeamsLoading(true)
      const teamsData = await getTeams()
      setTeams(teamsData)
    } catch (error) {
      console.error("Error loading teams:", error)
      setTeams([])
    } finally {
      setTeamsLoading(false)
    }
  }

  const loadNews = async () => {
    try {
      setLoading(true)
      let articles: NewsArticle[]

      if (selectedTeam) {
        articles = await getNewsByTeam(selectedTeam.id, 50)
      } else {
        articles = await getAllNews(50)
      }

      setNewsArticles(articles)
    } catch (error) {
      console.error("Error loading news:", error)
      setNewsArticles([])
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadNews()
      return
    }

    try {
      setSearchLoading(true)
      const articles = await searchNews(searchQuery.trim(), 50)
      setNewsArticles(articles)
    } catch (error) {
      console.error("Error searching news:", error)
      setNewsArticles([])
    } finally {
      setSearchLoading(false)
    }
  }

  const handleTeamSelect = (teamId: string | null) => {
    const team = teams.find((t) => t.id === teamId) || null
    setSelectedTeam(team)
    setSearchQuery("") // Clear search when selecting team
  }

  const handleNewsPress = (article: NewsArticle) => {
    router.push({
      pathname: "../all_cards/news_details",
      params: { id: article.id },
    })
  }

  const clearTeamSelection = () => {
    setSelectedTeam(null)
    setSearchQuery("")
  }

  const clearSearch = () => {
    setSearchQuery("")
  }

  // Enhanced dropdown options with better UX (same as calendar screen)
  const teamOptions = useMemo(
    () => [
      {
        label: "All Teams",
        value: null,
        icon: "users",
      },
      ...teams.map((team) => ({
        label: team.name,
        value: team.id,
        color: team.primaryColor,
        subtitle: `${team.sport} • ${team.gender}`,
      })),
    ],
    [teams],
  )

  // Filter articles based on search query (client-side filtering for better UX)
  const filteredArticles = searchQuery.trim()
    ? newsArticles.filter((article) => article.title.toLowerCase().includes(searchQuery.toLowerCase()))
    : newsArticles

  return (
    <SafeAreaView style={styles.container} edges={["left"]}>
      <ScrollView style={styles.scrollC} showsVerticalScrollIndicator={false}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Feather name="search" size={20} color={colors.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search news..."
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={clearSearch} style={styles.clearSearchButton}>
                <Feather name="x" size={20} color={colors.textSecondary} />
              </Pressable>
            )}
          </View>
        </View>

        {/* Team Selector and Controls */}
        <View style={styles.teamSelectorContainer}>
          <View style={styles.teamSelectorRow}>
            <Text style={styles.filterLabel}>Filter by Team</Text>
            <EnhancedDropdown
              options={teamOptions}
              selectedValue={selectedTeam?.id || null}
              onSelect={handleTeamSelect}
              placeholder="Select a team"
              variant="team"
            />
          </View>

          {/* Show All Button */}
          {selectedTeam && (
            <View style={styles.controlsRow}>
              <View style={styles.selectedTeamContainer}>
                <Feather name="filter" size={16} color={colors.primary} />
                <Text style={styles.selectedTeamText}>Showing news for: {selectedTeam.name}</Text>
              </View>
              <Pressable style={styles.clearButton} onPress={clearTeamSelection}>
                <Text style={styles.clearButtonText}>Show All</Text>
              </Pressable>
            </View>
          )}
        </View>

        {/* Loading State */}
        {(loading || searchLoading || teamsLoading) && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>
              {searchLoading ? "Searching..." : teamsLoading ? "Loading teams..." : "Loading news..."}
            </Text>
          </View>
        )}

        {/* News Articles */}
        {!loading && !searchLoading && !teamsLoading && (
          <>
            {filteredArticles.length > 0 ? (
              <View style={styles.newsContainer}>
                {filteredArticles.map((article) => (
                  <NewsCard key={article.id} article={article} onPress={handleNewsPress} />
                ))}
              </View>
            ) : (
              <View style={styles.emptyStateContainer}>
                <Feather name="search" size={48} color={colors.primary + '40'} />
                <Text style={styles.emptyStateTitle}>No news articles found</Text>
                <Text style={styles.emptyStateText}>
                  {searchQuery.trim()
                    ? "Try adjusting your search terms"
                    : selectedTeam
                      ? `No news available for ${selectedTeam.name}`
                      : "No news articles are currently available"}
                </Text>
                {(searchQuery.trim() || selectedTeam) && (
                  <Pressable
                    style={styles.resetButton}
                    onPress={() => {
                      clearSearch()
                      clearTeamSelection()
                    }}
                  >
                    <Text style={styles.resetButtonText}>Show All News</Text>
                  </Pressable>
                )}
              </View>
            )}
          </>
        )}

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollC: {
    ...Platform.select({
      ios: {
        marginTop: 100,
      },
      android: {
        marginTop: 110,
      },
    }),
    paddingTop: 10,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.border,
    ...Platform.select({
      ios: {
        paddingVertical: 12,
      },
      android: {
        paddingVertical: 2,
      },
    }),
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    marginLeft: 12,
    marginRight: 8,
  },
  clearSearchButton: {
  },
  teamSelectorContainer: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 12,
    paddingHorizontal: 16,
  },
  teamSelectorRow: {
    gap: 8,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.text,
    marginLeft: 4,
  },
  controlsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 12,
  },
  selectedTeamContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  selectedTeamText: {
    fontSize: 14,
    color: colors.text,
    marginLeft: 8,
    fontWeight: "500",
  },
  clearButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  clearButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "white",
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 12,
  },
  newsContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  emptyStateContainer: {
    alignItems: "center",
    padding: 40,
    marginHorizontal: 16,
    marginTop: 20,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 15,
    color: colors.text + '80',
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 18,
  },
  resetButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 18,
  },
  resetButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 14,
  },
  bottomSpacing: {
    height: 40,
  },
})