"use client"

import { useState, useEffect, useMemo } from "react"
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Platform, ActivityIndicator } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useRouter } from "expo-router"
import { colors } from "@/constants/colors"
import { getAllNews, getNewsByTeam, searchNews } from "@/app/actions/news"
import { getTeams } from "@/app/actions/teams"
import type { Team, NewsArticle } from "@/types/updated_types"
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
  const [isSearchExpanded, setIsSearchExpanded] = useState(false)

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

  const handleSearchFocus = () => {
    setIsSearchExpanded(true)
  }

  const handleSearchClose = () => {
    setIsSearchExpanded(false)
    setSearchQuery("")
  }

  // Enhanced dropdown options with better UX
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
      })),
    ],
    [teams],
  )

  // Filter articles based on search query (client-side filtering for better UX)
  const filteredArticles = searchQuery.trim()
    ? newsArticles.filter((article) => article.title.toLowerCase().includes(searchQuery.toLowerCase()))
    : newsArticles

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>

        {/* Search and Team Selector Row */}
        <View style={styles.searchAndFilterRow}>
          {isSearchExpanded ? (
            // Expanded Search Bar
            <View style={styles.expandedSearchContainer}>
              <View style={styles.expandedSearchBar}>
                <Feather name="search" size={20} color={colors.textSecondary} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search news"
                  placeholderTextColor={colors.textSecondary}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  numberOfLines={1}
                  autoFocus={true}
                />
                {searchLoading && <ActivityIndicator size="small" color={colors.primary} style={styles.searchLoader} />}
                <Pressable onPress={handleSearchClose} style={styles.closeSearchButton}>
                  <Feather name="x" size={20} color={colors.textSecondary} />
                </Pressable>
              </View>
            </View>
          ) : (
            // Normal Row Layout
            <>
              {/* Search Bar */}
              <View style={styles.searchContainer}>
                <Pressable style={styles.searchBar} onPress={handleSearchFocus}>
                  <Feather name="search" size={20} color={colors.textSecondary} />
                  <Text style={[styles.searchPlaceholder, searchQuery && styles.searchText]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                  >
                    {searchQuery || "Search news"}
                  </Text>
                  {searchQuery.length > 0 && (
                    <Pressable onPress={clearSearch} style={styles.clearSearchButton}>
                      <Feather name="x" size={18} color={colors.textSecondary} />
                    </Pressable>
                  )}
                </Pressable>
              </View>

              <View style={styles.dropdownContainer}>
                <EnhancedDropdown
                  options={teamOptions}
                  selectedValue={selectedTeam?.id || null}
                  onSelect={handleTeamSelect}
                  placeholder="Select a team"
                />
              </View>
            </>
          )}
        </View>

      

        {/* Loading State */}
        {(loading || teamsLoading) && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>{teamsLoading ? "Loading teams..." : "Loading news..."}</Text>
          </View>
        )}

        <ScrollView style={styles.scrollC} showsVerticalScrollIndicator={false}>

        {/* News Articles */}
        {!loading && !teamsLoading && (
          <>
            {filteredArticles.length > 0 ? (
              <View style={styles.newsContainer}>
                {filteredArticles.map((article) => (
                  <NewsCard key={article.id} article={article} onPress={handleNewsPress} />
                ))}
              </View>
            ) : (
              <View style={styles.emptyStateContainer}>
                <Feather name="search" size={48} color={colors.primary + "40"} />
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
    paddingTop: 10,
    backgroundColor: colors.background,
  },
  scrollC: {
    ...Platform.select({
      ios: {
        marginTop: 0,
      },
      android: {
        marginTop: 110,
      },
    }),
  },

  // Header Section - No background
  headerSection: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 20 : 40,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
  },

  // Search and Filter Row - Same row layout
  searchAndFilterRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    marginTop:40,
    paddingVertical: 12,
    gap: 12,
  },
  searchContainer: {
    flex: 2, // Takes up more space than dropdown
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: 22,
    flexShrink: 1,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.border,
    ...Platform.select({
      ios: {
        paddingVertical: 12,
      },
      android: {
        paddingVertical: 8,
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
  searchPlaceholder: {
    flex: 1,
    fontSize: 16,
    color: colors.textSecondary,
    marginLeft: 12,
    marginRight: 8,
  },
  searchText: {
    color: colors.text,
  },
  searchLoader: {
    marginRight: 8,
  },
  clearSearchButton: {
  },

  // Expanded Search Styles
  expandedSearchContainer: {
    flex: 1,
  },
  expandedSearchBar: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginHorizontal: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  closeSearchButton: {
  },

  // Dropdown Container
  dropdownContainer: {
    flex: 1, // Takes up less space than search
    minWidth: 120, // Ensure minimum width for dropdown
  },

  // Content Sections
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
    color: colors.text + "80",
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