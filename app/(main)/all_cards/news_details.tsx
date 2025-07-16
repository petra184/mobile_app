"use client"

import { useState, useEffect } from "react"
import { View, Text, StyleSheet, ScrollView, Image, Pressable, Platform, ActivityIndicator } from "react-native"
import { useLocalSearchParams, useRouter } from "expo-router"
import { SafeAreaView } from "react-native-safe-area-context"
import { colors } from "@/constants/colors"
import { getNewsById, type NewsArticle } from "@/app/actions/news"
import { Feather } from "@expo/vector-icons"
import { StatusBar } from "expo-status-bar"
import { GestureDetector, Gesture, GestureHandlerRootView } from "react-native-gesture-handler"
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS,
  interpolate,
  Extrapolation,
} from "react-native-reanimated"

export default function NewsDetailsScreen() {
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()
  const [article, setArticle] = useState<NewsArticle | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Zoom functionality with smoother values
  const scale = useSharedValue(1)
  const savedScale = useSharedValue(1)
  const translateX = useSharedValue(0)
  const translateY = useSharedValue(0)
  const savedTranslateX = useSharedValue(0)
  const savedTranslateY = useSharedValue(0)
  const [isZoomed, setIsZoomed] = useState(false)

  // Smooth spring configuration
  const springConfig = {
    damping: 20,
    stiffness: 90,
    mass: 0.8,
    restDisplacementThreshold: 0.01,
    restSpeedThreshold: 0.01,
  }

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

  // Smooth reset zoom function
  const resetZoom = () => {
    scale.value = withSpring(1, springConfig)
    savedScale.value = 1
    translateX.value = withSpring(0, springConfig)
    translateY.value = withSpring(0, springConfig)
    savedTranslateX.value = 0
    savedTranslateY.value = 0
    setIsZoomed(false)
  }

  // Enhanced pinch gesture with smoother scaling
  const pinchGesture = Gesture.Pinch()
    .onUpdate((event) => {
      // Smoother scaling with interpolation
      const newScale = savedScale.value * event.scale
      // More granular zoom limits with smooth interpolation
      scale.value = interpolate(newScale, [0.5, 1, 4], [1, 1, 3], Extrapolation.CLAMP)

      // Update zoom state with smoother threshold
      if (scale.value > 1.05) {
        runOnJS(setIsZoomed)(true)
      }
    })
    .onEnd(() => {
      savedScale.value = scale.value

      // Smoother snap back with lower threshold
      if (scale.value < 1.05) {
        scale.value = withSpring(1, springConfig)
        savedScale.value = 1
        translateX.value = withSpring(0, springConfig)
        translateY.value = withSpring(0, springConfig)
        savedTranslateX.value = 0
        savedTranslateY.value = 0
        runOnJS(setIsZoomed)(false)
      }
    })

  // Enhanced pan gesture with smoother movement
  const panGesture = Gesture.Pan()
    .enabled(isZoomed)
    .onUpdate((event) => {
      // Smoother panning with velocity consideration
      translateX.value = savedTranslateX.value + event.translationX * 0.8
      translateY.value = savedTranslateY.value + event.translationY * 0.8
    })
    .onEnd((event) => {
      // Smooth deceleration based on velocity
      const velocityFactor = 0.2
      translateX.value = withSpring(
        savedTranslateX.value + event.translationX + event.velocityX * velocityFactor,
        springConfig,
      )
      translateY.value = withSpring(
        savedTranslateY.value + event.translationY + event.velocityY * velocityFactor,
        springConfig,
      )

      savedTranslateX.value = translateX.value
      savedTranslateY.value = translateY.value
    })

  // Smoother double tap gesture
  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      if (scale.value > 1.05) {
        // Smooth zoom out
        runOnJS(resetZoom)()
      } else {
        // Smooth zoom in to 2x
        scale.value = withSpring(2, springConfig)
        savedScale.value = 2
        runOnJS(setIsZoomed)(true)
      }
    })

  // Combine gestures
  const composedGesture = Gesture.Simultaneous(Gesture.Race(doubleTapGesture, pinchGesture), panGesture)

  // Enhanced animated style with smoother transforms
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }, { translateY: translateY.value }, { scale: scale.value }],
    }
  })

  // Loading state
  if (loading) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaView style={styles.container} edges={["left"]}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading article...</Text>
          </View>
        </SafeAreaView>
      </GestureHandlerRootView>
    )
  }

  // Error state
  if (error || !article) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
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
      </GestureHandlerRootView>
    )
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <GestureDetector gesture={composedGesture}>
      <SafeAreaView style={styles.container} edges={["left"]}>
        <StatusBar style="dark" />
        
          
        <ScrollView
          showsVerticalScrollIndicator={false}
          scrollEnabled={!isZoomed} // Disable scroll when zoomed
          bounces={!isZoomed}
        >
          {/* Article Image */}
          {article.imageUrl ? (
            <Image source={{ uri: article.imageUrl }} style={styles.image} resizeMode="cover" />
          ) : (
            <View style={styles.placeholderImage}>
              <Feather name="image" size={48} color={colors.textSecondary} />
            </View>
          )}

            <Animated.View style={[styles.content, animatedStyle]}>
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
            </Animated.View>
          
        </ScrollView>
        
      </SafeAreaView>
      </GestureDetector>
    </GestureHandlerRootView>
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

  // Subtle zoom hint - made smaller and less intrusive
  zoomHint: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary + "08",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 16,
    alignSelf: "center",
    opacity: 0.7,
  },
  zoomHintText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: "500",
    marginLeft: 4,
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
