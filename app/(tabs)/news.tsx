"use client"

import { useState, useEffect } from "react"
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Platform, ActivityIndicator } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useRouter } from "expo-router"
import { colors } from "@/constants/colors"
import { getAllNews, getNewsByTeam, searchNews, type NewsArticle } from "@/app/actions/news"
import type { Team } from "@/app/actions/teams"
import { TeamSelector } from "@/components/teams/TeamSelector"
import { NewsCard } from "@/components/news/NewsCard"
import { Feather } from "@expo/vector-icons"

export default function NewsScreen() {
  const router = useRouter()
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [newsArticles, setNewsArticles] = useState<NewsArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [searchLoading, setSearchLoading] = useState(false)

  // Load initial news articles
  useEffect(() => {
    loadNews()
  }, [selectedTeam])

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

  const handleTeamSelect = (team: Team) => {
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
            <TeamSelector
              onSelectTeam={handleTeamSelect}
              onTeamPress={handleTeamSelect}
              showFavorites={true}
              horizontal={true}
              showSearch={false}
              showFilters={false}
            />
          </View>

          {/* Show All Button */}
          {selectedTeam && (
            <View style={styles.controlsRow}>
              <Text style={styles.selectedTeamText}>Showing news for: {selectedTeam.name}</Text>
              <Pressable style={styles.clearButton} onPress={clearTeamSelection}>
                <Text style={styles.clearButtonText}>Show All</Text>
              </Pressable>
            </View>
          )}
        </View>

        {/* Loading State */}
        {(loading || searchLoading) && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>{searchLoading ? "Searching..." : "Loading news..."}</Text>
          </View>
        )}

        {/* News Articles */}
        {!loading && !searchLoading && (
          <>
            {filteredArticles.length > 0 ? (
              <View style={styles.newsContainer}>
                {filteredArticles.map((article) => (
                  <NewsCard key={article.id} article={article} onPress={handleNewsPress} />
                ))}
              </View>
            ) : (
              <View style={styles.emptyStateContainer}>
                <Feather name="file-text" size={48} color={colors.textSecondary} />
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
    padding: 4,
  },
  teamSelectorContainer: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 12,
  },
  teamSelectorRow: {
    paddingHorizontal: 16,
  },
  controlsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  selectedTeamText: {
    fontSize: 14,
    color: colors.textSecondary,
    flex: 1,
  },
  clearButton: {
    backgroundColor: "rgba(59, 130, 246, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary,
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
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
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
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20,
  },
  resetButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
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
