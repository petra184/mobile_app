"use client"

import { useState, useEffect } from "react"
import { View, Text, StyleSheet, ScrollView, Image, Pressable, Platform, ActivityIndicator } from "react-native"
import { useLocalSearchParams, useRouter } from "expo-router"
import { SafeAreaView } from "react-native-safe-area-context"
import { colors } from "@/constants/colors"
import { getNewsById, type NewsArticle } from "@/app/actions/news"
import { Feather } from "@expo/vector-icons"

export default function NewsDetailsScreen() {
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()
  const [article, setArticle] = useState<NewsArticle | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (id) {
      loadArticle()
    }
  }, [id])

  const loadArticle = async () => {
    try {
      setLoading(true)
      setError(null)
      const articleData = await getNewsById(id as string)
      setArticle(articleData)
    } catch (err) {
      console.error("Error loading article:", err)
      setError("Failed to load article")
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
  }

  // Loading state
  if (loading) {
    return (
      <>
        <SafeAreaView style={styles.container} edges={["left"]}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading article...</Text>
          </View>
        </SafeAreaView>
      </>
    )
  }

  // Error state
  if (error || !article) {
    return (
      <>
        <SafeAreaView style={styles.container} edges={["left"]}>
          <View style={styles.notFoundContainer}>
            <Feather name="alert-circle" size={48} color={colors.textSecondary} />
            <Text style={styles.notFoundText}>{error || "Article not found"}</Text>
            <Pressable style={styles.backButton} onPress={() => router.back()}>
              <Text style={styles.backButtonText}>Go Back</Text>
            </Pressable>
            {error && (
              <Pressable style={styles.retryButton} onPress={loadArticle}>
                <Text style={styles.retryButtonText}>Try Again</Text>
              </Pressable>
            )}
          </View>
        </SafeAreaView>
      </>
    )
  }

  return (
    <>
      <SafeAreaView style={styles.container} edges={["left"]}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Article Image */}
          {article.imageUrl ? (
            <Image source={{ uri: article.imageUrl }} style={styles.image} resizeMode="cover" />
          ) : (
            <View style={styles.placeholderImage}>
              <Feather name="image" size={48} color={colors.textSecondary} />
            </View>
          )}

          <View style={styles.content}>

            {/* Article Title */}
            <Text style={styles.title}>{article.title}</Text>

            {/* Article Headline */}
            {article.headline && <Text style={styles.headline}>{article.headline}</Text>}

            {/* Meta Information */}
            <View style={styles.metaContainer}>
              <View style={styles.metaItem}>
                <Feather name="user" size={16} color={colors.textSecondary} style={styles.metaIcon} />
                <Text style={styles.metaText}>{article.author}</Text>
              </View>

              <View style={styles.metaItem}>
                <Feather name="calendar" size={16} color={colors.textSecondary} style={styles.metaIcon} />
                <Text style={styles.metaText}>
                  {formatDate(article.createdAt)} • {formatTime(article.createdAt)}
                </Text>
              </View>
            </View>

            {/* Team Information */}
            {article.team && (
              <View style={styles.teamContainer}>
                <View style={styles.teamInfo}>
                  <Feather name="users" size={16} color={colors.primary} />
                  <Text style={styles.teamText}>
                    {article.team.name}
                  </Text>
                </View>
              </View>
            )}

            <View style={styles.divider} />

            {/* Article Content */}
            <View style={styles.articleContent}>
              {article.content ? (
                <Text style={styles.contentText}>{article.content}</Text>
              ) : (
                <Text style={styles.noContentText}>No content available for this article.</Text>
              )}
            </View>

              <View style={styles.footerDivider} />
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    ...Platform.select({ ios: { paddingBottom: 0 }, android: { paddingBottom: 50 } }),
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 12,
  },
  notFoundContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  notFoundText: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.textSecondary,
    marginBottom: 24,
    marginTop: 16,
    textAlign: "center",
  },
  backButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 12,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  retryButton: {
    backgroundColor: "transparent",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.primary,
  },
  image: {
    width: "100%",
    height: 240,
  },
  placeholderImage: {
    width: "100%",
    height: 240,
    backgroundColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    padding: 20,
  },
  tagContainer: {
    marginBottom: 16,
  },
  tag: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: "flex-start",
  },
  tagText: {
    fontSize: 12,
    fontWeight: "600",
    color: "white",
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.text,
    marginBottom: 12,
    lineHeight: 36,
  },
  headline: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.textSecondary,
    marginBottom: 16,
    lineHeight: 26,
    fontStyle: "italic",
  },
  metaContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 16,
    gap: 16,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  metaIcon: {
    marginRight: 6,
  },
  metaText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  teamContainer: {
    backgroundColor: "rgba(59, 130, 246, 0.1)",
    padding: 12,
    borderRadius: 22,
    width: "60%",
  },
  teamInfo: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
  },
  teamText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: "600",
    marginLeft: 8,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 20,
  },
  articleContent: {
    marginBottom: 32,
  },
  contentText: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 26,
    textAlign: "justify",
  },
  noContentText: {
    fontSize: 16,
    color: colors.textSecondary,
    fontStyle: "italic",
    textAlign: "center",
    padding: 20,
  },
  footer: {
    marginTop: 20,
  },
  footerDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginBottom: 16,
  },
  footerContent: {
    alignItems: "center",
    paddingBottom: 20,
  },
  footerText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: "500",
    marginBottom: 4,
  },
  footerDate: {
    fontSize: 12,
    color: colors.textSecondary,
  },
})
