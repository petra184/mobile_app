import { View, Text, StyleSheet } from "react-native"
import { colors } from "@/constants/colors"

type GameHeaderProps = {
  status: string
  homeTeamColor: string
  title?: string
  subtitle?: string
}

export default function GameHeader({ status, homeTeamColor, title = "Game Details", subtitle }: GameHeaderProps) {
  // Format status text - if "out-of-season", break into separate words
  const formatStatus = (status: string) => {
    if (status === "out-of-season") {
      return "Out of Season"
    }
    
    // Capitalize first letter of each word
    return status.charAt(0).toUpperCase() + status.slice(1)
  }

  // Get status color based on game status
  const getStatusColor = () => {
    switch (status) {
      case "live":
        return "#EF4444" // Red
      case "completed":
        return "#10B981" // Green
      case "postponed":
      case "canceled":
        return "#F59E0B" // Amber
      case "out-of-season":
        return "#6B7280" // Gray
      default:
        return colors.primary // Default blue
    }
  }

  return (
    <View style={styles.headerContainer}>
      <View style={[styles.headerBar, { backgroundColor: homeTeamColor }]}>
        <Text style={styles.statusText}>{formatStatus(status)}</Text>
      </View>
      <View style={styles.titleContainer}>
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  headerContainer: {
    width: "100%",
    marginBottom: 16,
  },
  headerBar: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  statusText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  titleContainer: {
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },
  subtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 4,
  }
})