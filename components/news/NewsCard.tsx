import { View, Text, StyleSheet, Pressable, Image } from "react-native"
import { colors } from "@/constants/colors"
import { Feather } from "@expo/vector-icons"
import type { NewsArticle } from "@/app/actions/news"

interface NewsCardProps {
  article: NewsArticle
  onPress: (article: NewsArticle) => void
}

export function NewsCard({ article, onPress }: NewsCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
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

  return (
    <View style={styles.shadowWrapper}>
     <Pressable style={styles.container} onPress={() => onPress(article)}>
      {/* Article Image */}
      {article.imageUrl ? (
        <Image source={{ uri: article.imageUrl }} style={styles.image} resizeMode="cover" />
      ) : (
        <View style={styles.placeholderImage}>
          <Feather name="image" size={32} color={colors.textSecondary} />
        </View>
      )}

      {/* Article Content */}
      <View style={styles.content}>
        {/* Tag and Team */}
        <View style={styles.metaRow}>
          
          {article.team && (
            <Text style={styles.teamText}>
              {article.team.name}
            </Text>
          )}
        </View>

        {/* Title */}
        <Text style={styles.title} numberOfLines={2}>
          {article.title}
        </Text>

        {/* Headline */}
        {article.headline && (
          <Text style={styles.headline} numberOfLines={2}>
            {article.headline}
          </Text>
        )}

        {/* Author and Date */}
        <View style={styles.footer}>
          <View style={styles.authorRow}>
            <Feather name="user" size={14} color={colors.textSecondary} />
            <Text style={styles.author}>{article.author}</Text>
          </View>
          <View style={styles.dateRow}>
            <Feather name="clock" size={14} color={colors.textSecondary} />
            <Text style={styles.date}>
              {formatDate(article.createdAt)} • {formatTime(article.createdAt)}
            </Text>
          </View>
        </View>
      </View>

      {/* Read More Arrow */}
      <View style={styles.arrow}>
        <Feather name="chevron-right" size={20} color={colors.textSecondary} />
      </View>
    </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  shadowWrapper: {
    borderRadius: 16,
    marginBottom: 16,
    backgroundColor: colors.card, // required for iOS shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3, // Android
  },
  container: {
    borderRadius: 16,
    overflow: 'hidden', // this is fine here now
  },
  image: {
    width: "100%",
    height: 200,
  },
  placeholderImage: {
    width: "100%",
    height: 200,
    backgroundColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    padding: 16,
    flex: 1,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    flexWrap: "wrap",
  },
  tag: {
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 12,
    fontWeight: "600",
    color: "white",
  },
  teamText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 8,
    lineHeight: 24,
  },
  headline: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
    lineHeight: 20,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  authorRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  author: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 4,
    fontWeight: "500",
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  date: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  arrow: {
    position: "absolute",
    top: 16,
    right: 16,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 20,
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
})
