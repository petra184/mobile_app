"use client"

import { useState, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Pressable,
  Dimensions,
  Image,
  Alert,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { colors } from "@/constants/colors"
import { useUserStore } from "@/hooks/userStore"
import { Feather } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import Animated, { FadeIn, FadeInDown, FadeInUp } from "react-native-reanimated"
import { StatusBar } from "expo-status-bar"
import { PointsStatusCard } from "@/components/rewards/ProgressPoints"
import {
  fetchRewards,
  fetchSpecialOffers,
  fetchScanHistory,
  fetchUserStatus,
  fetchUserAchievements,
  redeemReward,
  checkUserAchievements,
  type Reward,
  type SpecialOffer,
  type ScanHistory,
  type UserStatusWithLevel,
  type UserAchievement,
} from "@/app/actions/points"
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons"

const { width } = Dimensions.get("window")

// Achievement icon mapping
const achievementIconMap = {
  milestone: "award",
  streak: "flame",
  points: "star",
  social: "share-2",
  special: "gift",
  scan: "check-circle",
  default: "award",
}

// Achievement color mapping
const achievementColorMap = {
  milestone: "#3B82F6",
  streak: "#F97316",
  points: "#FBBF24",
  social: "#8B5CF6",
  special: "#EC4899",
  scan: "#10B981",
  default: colors.primary,
}

export default function PointsScreen() {
  const { points, redeemPoints, userId, getUserFirstName } = useUserStore()
  const router = useRouter()

  const [rewards, setRewards] = useState<Reward[]>([])
  const [specialOffers, setSpecialOffers] = useState<SpecialOffer[]>([])
  const [scanHistory, setScanHistory] = useState<ScanHistory[]>([])
  const [userStatus, setUserStatus] = useState<UserStatusWithLevel | null>(null)
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState<"overview" | "rewards" | "offers" | "history">("overview")

  useEffect(() => {
    if (userId) {
      fetchData()
    }
  }, [userId])

  const fetchData = async () => {
    if (!userId) return

    setLoading(true)
    try {
      const [rewardsData, offersData, historyData, statusData, achievementsData] = await Promise.all([
        fetchRewards(),
        fetchSpecialOffers(),
        fetchScanHistory(userId),
        fetchUserStatus(userId),
        fetchUserAchievements(userId),
      ])

      setRewards(rewardsData)
      setSpecialOffers(offersData)
      setScanHistory(historyData)
      setUserStatus(statusData)
      setUserAchievements(achievementsData)

      // Check for new achievements after loading data
      if (statusData) {
        const newAchievements = await checkUserAchievements(userId)
        if (newAchievements.length > 0) {
          // Show achievement notification
          Alert.alert(
            "🎉 Achievement Unlocked!",
            `You earned: ${newAchievements.map((a) => a.achievement_name).join(", ")}`,
            [{ text: "Awesome!", style: "default" }],
          )
          // Refresh achievements
          const updatedAchievements = await fetchUserAchievements(userId)
          setUserAchievements(updatedAchievements)
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error)
      Alert.alert("Error", "Failed to load data. Please try again.")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const onRefresh = () => {
    setRefreshing(true)
    fetchData()
  }

  const handleRedeemReward = async (reward: Reward) => {
    if (!userId) {
      Alert.alert("Login Required", "Please log in to redeem rewards.")
      return
    }

    if (points < reward.points_required) {
      Alert.alert(
        "Insufficient Points",
        `You need ${reward.points_required - points} more points to redeem this reward.`,
      )
      return
    }

    Alert.alert(
      "Redeem Reward",
      `Are you sure you want to redeem "${reward.title}" for ${reward.points_required} points?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Redeem",
          onPress: async () => {
            try {
              const success = await redeemReward(userId, reward.id, reward.points_required)
              if (success) {
                // Also update local points
                await redeemPoints(reward.points_required)
                Alert.alert("Success!", `You have successfully redeemed "${reward.title}".`)
                fetchData() // Refresh data
              } else {
                Alert.alert("Error", "Failed to redeem reward. Please try again.")
              }
            } catch (error) {
              console.error("Error redeeming reward:", error)
              Alert.alert("Error", "Something went wrong. Please try again.")
            }
          },
        },
      ],
    )
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getAchievementIcon = (achievement: UserAchievement) => {
    const category = achievement.achievement_name.toLowerCase().includes("scan")
      ? "scan"
      : achievement.achievement_name.toLowerCase().includes("streak")
        ? "streak"
        : achievement.achievement_name.toLowerCase().includes("point")
          ? "points"
          : achievement.achievement_name.toLowerCase().includes("share") ||
              achievement.achievement_name.toLowerCase().includes("refer")
            ? "social"
            : "default"

    return achievementIconMap[category] || "award"
  }

  const getAchievementColor = (achievement: UserAchievement) => {
    const category = achievement.achievement_name.toLowerCase().includes("scan")
      ? "scan"
      : achievement.achievement_name.toLowerCase().includes("streak")
        ? "streak"
        : achievement.achievement_name.toLowerCase().includes("point")
          ? "points"
          : achievement.achievement_name.toLowerCase().includes("share") ||
              achievement.achievement_name.toLowerCase().includes("refer")
            ? "social"
            : "default"

    return achievementColorMap[category] || colors.primary
  }

  const renderOverview = () => (
    <>
      <Image source={require("@/IMAGES/crowd.jpg")} style={styles.backgroundImage} />
    <ScrollView showsVerticalScrollIndicator={false} style={styles.container}>
        
      <View style={{ paddingTop: 20 }}></View>
      {/* Status Card */}
      <PointsStatusCard
        userFirstName={getUserFirstName()}
        points={points}
        name={true}
        userStatus={userStatus}
        animationDelay={100}
      />

      {/* Quick Stats */}
      <Animated.View entering={FadeInUp.duration(600).delay(200)} style={styles.quickStats}>
        <View style={styles.statCard}>
          <Feather name="zap" size={24} color="#FF6B35" />
          <Text style={styles.statValue}>{userStatus?.current_streak || 0}</Text>
          <Text style={styles.statLabel}>Day Streak</Text>
        </View>
        <View style={styles.statCard}>
          <MaterialCommunityIcons name="qrcode-scan" size={24} color="#4ECDC4" />
          <Text style={styles.statValue}>{userStatus?.total_scans || 0}</Text>
          <Text style={styles.statLabel}>Games Scanned</Text>
        </View>
        <View style={styles.statCard}>
          <Feather name="trending-up" size={24} color="#45B7D1" />
          <Text style={styles.statValue}>{userAchievements.length}</Text>
          {userAchievements.length < 2 ? (
            <Text style={styles.statLabel}>Achievement</Text>
            ) : (
            <Text style={styles.statLabel}>Achievements</Text>
            )}
        </View>
      </Animated.View>

     
      {/* Featured Rewards */}
      <Animated.View entering={FadeInUp.duration(600).delay(400)} style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Featured Rewards</Text>
          <TouchableOpacity onPress={() => setActiveTab("rewards")}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>
        {rewards.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
            {rewards.slice(0, 3).map((reward) => (
              <TouchableOpacity
                key={reward.id}
                style={styles.featuredRewardCard}
                onPress={() => handleRedeemReward(reward)}
              >
                <View style={styles.rewardImageContainer}>
                  <Feather name="gift" size={32} color={colors.primary} />
                </View>
                <Text style={styles.rewardTitle} numberOfLines={2}>
                  {reward.title}
                </Text>
                <View style={styles.rewardPoints}>
                  <Feather name="star" size={14} color="#FFD700" />
                  <Text style={styles.rewardPointsText}>{reward.points_required}</Text>
                </View>
                <TouchableOpacity
                  style={[styles.rewardButton, points < reward.points_required && styles.rewardButtonDisabled]}
                >
                  <Text
                    style={[
                      styles.rewardButtonText,
                      points < reward.points_required && styles.rewardButtonTextDisabled,
                    ]}
                  >
                    {points < reward.points_required ? "Need More" : "Redeem"}
                  </Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </ScrollView>
        ) : (
          <View style={styles.emptyState}>
            <Feather name="gift" size={48} color={colors.textSecondary} />
            <Text style={styles.emptyStateText}>No rewards available</Text>
            <Text style={styles.emptyStateSubtext}>Check back soon for new rewards!</Text>
          </View>
        )}
      </Animated.View>

       {/* Recent Activity */}
       <Animated.View entering={FadeInUp.duration(600).delay(300)} style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <TouchableOpacity onPress={() => setActiveTab("history")}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>
        {scanHistory.length > 0 ? (
          scanHistory.slice(0, 3).map((scan) => (
            <View key={scan.id} style={styles.activityCard}>
              <View style={styles.activityIcon}>
                <Feather name="check-circle" size={20} color="#10B981" />
              </View>
              <View style={styles.activityInfo}>
                <Text style={styles.activityTitle}>{scan.description}</Text>
                <Text style={styles.activityDate}>{formatDate(scan.scanned_at || scan.created_at)}</Text>
              </View>
              <View style={styles.activityPoints}>
                <Text style={styles.activityPointsValue}>+{scan.points}</Text>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Feather name="activity" size={48} color={colors.textSecondary} />
            <Text style={styles.emptyStateText}>No scan history yet</Text>
            <Text style={styles.emptyStateSubtext}>Start scanning QR codes at games to earn points!</Text>
          </View>
        )}
      </Animated.View>


      {/* Enhanced Achievements Section */}
      <Animated.View entering={FadeInUp.duration(600).delay(500)} style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Achievements</Text>
          <TouchableOpacity onPress={() => setActiveTab("history")}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>

        {userAchievements.length > 0 ? (
          <View style={styles.achievementsContainer}>
            {userAchievements.slice(0, 6).map((achievement) => {
              const iconName = getAchievementIcon(achievement)
              const iconColor = getAchievementColor(achievement)

              return (
                <Animated.View
                  key={achievement.id}
                  entering={FadeInUp.duration(400).delay(100 * userAchievements.indexOf(achievement))}
                  style={styles.achievementCard}
                >
                  <View style={[styles.achievementIconContainer, { backgroundColor: `${iconColor}20` }]}>
                    <Feather name={iconName as any} size={24} color={iconColor} />
                  </View>
                  <View style={styles.achievementContent}>
                    <Text style={styles.achievementTitle}>{achievement.achievement_name}</Text>
                    <Text style={styles.achievementDescription} numberOfLines={2}>
                      {achievement.achievement_description || "Complete special tasks to earn points"}
                    </Text>
                    <View style={styles.achievementMeta}>
                      <View style={styles.achievementPoints}>
                        <Feather name="star" size={12} color="#FFD700" />
                        <Text style={styles.achievementPointsText}>{achievement.points_earned || 0} points</Text>
                      </View>
                      <Text style={styles.achievementDate}>
                        {achievement.earned_at ? formatDate(achievement.earned_at) : "Recently earned"}
                      </Text>
                    </View>
                  </View>
                </Animated.View>
              )
            })}
          </View>
        ) : (
          <View style={styles.emptyAchievements}>
            <Feather name="award" size={48} color={colors.textSecondary} />
            <Text style={styles.emptyStateText}>No achievements yet</Text>
            <Text style={styles.emptyStateSubtext}>Keep scanning to unlock achievements!</Text>
          </View>
        )}
      </Animated.View>
    </ScrollView>
    </>
  )

  // ... rest of the render methods remain the same ...

  const renderRewards = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      {rewards.length > 0 ? (
        rewards.map((reward) => (
          <Animated.View key={reward.id} entering={FadeInUp.duration(400)} style={styles.rewardCard}>
            <View style={styles.rewardCardContent}>
              <View style={styles.rewardCardHeader}>
                <View style={styles.rewardIconContainer}>
                  <Feather name="gift" size={24} color={colors.primary} />
                </View>
                <View style={styles.rewardCardInfo}>
                  <Text style={styles.rewardCardTitle}>{reward.title}</Text>
                  <Text style={styles.rewardCardCategory}>{(reward.category || "REWARD").toUpperCase()}</Text>
                  {reward.popularity_score && (
                    <View style={styles.popularityBadge}>
                      <Feather name="trending-up" size={12} color="#10B981" />
                      <Text style={styles.popularityText}>{reward.popularity_score}% popular</Text>
                    </View>
                  )}
                </View>
              </View>
              <Text style={styles.rewardCardDescription}>{reward.description}</Text>
              <View style={styles.rewardCardFooter}>
                <View style={styles.rewardCardPoints}>
                  <Feather name="star" size={16} color="#FFD700" />
                  <Text style={styles.rewardCardPointsText}>{reward.points_required} points</Text>
                </View>
                <TouchableOpacity
                  style={[styles.rewardCardButton, points < reward.points_required && styles.rewardCardButtonDisabled]}
                  onPress={() => handleRedeemReward(reward)}
                >
                  <Text
                    style={[
                      styles.rewardCardButtonText,
                      points < reward.points_required && styles.rewardCardButtonTextDisabled,
                    ]}
                  >
                    {points < reward.points_required ? "Insufficient Points" : "Redeem Now"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
        ))
      ) : (
        <View style={styles.emptyState}>
          <Feather name="gift" size={64} color={colors.textSecondary} />
          <Text style={styles.emptyStateText}>No rewards available</Text>
          <Text style={styles.emptyStateSubtext}>Check back soon for new rewards to redeem with your points!</Text>
        </View>
      )}
    </ScrollView>
  )

  const renderOffers = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      {specialOffers.length > 0 ? (
        specialOffers.map((offer) => (
          <Animated.View key={offer.id} entering={FadeInUp.duration(400)} style={styles.offerCard}>
            <View style={styles.offerBadge}>
              <Feather name="zap" size={12} color="white" />
              <Text style={styles.offerBadgeText}>LIMITED TIME</Text>
            </View>
            <View style={styles.offerContent}>
              <View style={styles.offerHeader}>
                <Text style={styles.offerTitle}>{offer.title}</Text>
                <View style={styles.offerPricing}>
                  {offer.original_points && <Text style={styles.originalPrice}>{offer.original_points}</Text>}
                  <Text style={styles.offerPrice}>{offer.points_required} pts</Text>
                </View>
              </View>
              <Text style={styles.offerDescription}>{offer.description}</Text>
              {offer.limited_quantity && (
                <View style={styles.quantityInfo}>
                  <View style={styles.quantityBar}>
                    <View
                      style={[
                        styles.quantityFill,
                        { width: `${((offer.claimed_count || 0) / offer.limited_quantity) * 100}%` },
                      ]}
                    />
                  </View>
                  <Text style={styles.quantityText}>
                    {offer.limited_quantity - (offer.claimed_count || 0)} of {offer.limited_quantity} left
                  </Text>
                </View>
              )}
              <TouchableOpacity style={styles.offerButton}>
                <Text style={styles.offerButtonText}>Claim Offer</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        ))
      ) : (
        <View style={styles.emptyState}>
          <Feather name="zap" size={64} color={colors.textSecondary} />
          <Text style={styles.emptyStateText}>No special offers</Text>
          <Text style={styles.emptyStateSubtext}>Check back soon for limited-time offers!</Text>
        </View>
      )}
    </ScrollView>
  )

  const renderHistory = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      {/* Scan History Section */}
      <Text style={styles.sectionTitle3}>Scan History</Text>
      {scanHistory.length > 0 ? (
        scanHistory.map((scan) => (
          <Animated.View key={scan.id} entering={FadeInUp.duration(400)} style={styles.historyCard}>
            <View style={styles.historyIcon}>
              <Feather name="check-circle" size={24} color="#10B981" />
            </View>
            <View style={styles.historyInfo}>
              <Text style={styles.historyTitle}>{scan.description}</Text>
              <Text style={styles.historyDate}>{formatDate(scan.scanned_at || scan.created_at)}</Text>
            </View>
            <View style={styles.historyPoints}>
              <Text style={styles.historyPointsValue}>+{scan.points}</Text>
            </View>
          </Animated.View>
        ))
      ) : (
        <View style={styles.emptyState}>
          <Feather name="clock" size={64} color={colors.textSecondary} />
          <Text style={styles.emptyStateText}>No scan history</Text>
          <Text style={styles.emptyStateSubtext}>Start scanning QR codes at games to see your history here!</Text>
        </View>
      )}

      {/* Achievements Section */}
      <View style={styles.achievementsHistorySection}>
        <Text style={styles.sectionTitle3}>All Achievements</Text>
        {userAchievements.length > 0 ? (
          <View style={styles.achievementsContainer}>
            {userAchievements.map((achievement) => {
              const iconName = getAchievementIcon(achievement)
              const iconColor = getAchievementColor(achievement)

              return (
                <Animated.View
                  key={achievement.id}
                  entering={FadeInUp.duration(400).delay(100 * userAchievements.indexOf(achievement))}
                  style={styles.achievementCard}
                >
                  <View style={[styles.achievementIconContainer, { backgroundColor: `${iconColor}20` }]}>
                    <Feather name={iconName as any} size={24} color={iconColor} />
                  </View>
                  <View style={styles.achievementContent}>
                    <Text style={styles.achievementTitle}>{achievement.achievement_name}</Text>
                    <Text style={styles.achievementDescription} numberOfLines={2}>
                      {achievement.achievement_description || "Complete special tasks to earn points"}
                    </Text>
                    <View style={styles.achievementMeta}>
                      <View style={styles.achievementPoints}>
                        <Feather name="star" size={12} color="#FFD700" />
                        <Text style={styles.achievementPointsText}>{achievement.points_earned || 0} points</Text>
                      </View>
                      <Text style={styles.achievementDate}>
                        {achievement.earned_at ? formatDate(achievement.earned_at) : "Recently earned"}
                      </Text>
                    </View>
                  </View>
                </Animated.View>
              )
            })}
          </View>
        ) : (
          <View style={styles.emptyAchievements}>
            <Feather name="award" size={48} color={colors.textSecondary} />
            <Text style={styles.emptyStateText}>No achievements yet</Text>
            <Text style={styles.emptyStateSubtext}>Keep scanning to unlock achievements!</Text>
          </View>
        )}
      </View>
    </ScrollView>
  )

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading your rewards...</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      {/* Header with centered title */}
      <Animated.View entering={FadeIn.duration(400)} style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Feather name="chevron-left" size={28} color={colors.text} />
        </Pressable>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Rewards & Points</Text>
        </View>
        <View style={styles.headerRightPlaceholder} />
      </Animated.View>

      {/* Tab Navigation */}
      <Animated.View entering={FadeInDown.duration(500).delay(100)} style={styles.tabContainer}>
        {[
          { key: "overview", label: "Overview", icon: "home" },
          { key: "rewards", label: "Rewards", icon: "gift" },
          { key: "offers", label: "Offers", icon: "zap" },
          { key: "history", label: "History", icon: "clock" },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.activeTab]}
            onPress={() => setActiveTab(tab.key as any)}
          >
            <Feather
              name={tab.icon as any}
              size={18}
              color={activeTab === tab.key ? colors.primary : colors.textSecondary}
            />
            <Text style={[styles.tabText, activeTab === tab.key && styles.activeTabText]}>{tab.label}</Text>
            {tab.key === "offers" && specialOffers.length > 0 && (
              <View style={styles.tabBadge}>
                <Text style={styles.tabBadgeText}>{specialOffers.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </Animated.View>

      {/* Content */}
      <View style={styles.content}>
        <ScrollView
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          showsVerticalScrollIndicator={false}
        >
          {activeTab === "overview" && renderOverview()}
          {activeTab === "rewards" && renderRewards()}
          {activeTab === "offers" && renderOffers()}
          {activeTab === "history" && renderHistory()}
        </ScrollView>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    justifyContent: "space-between",
  },
  backgroundImage: {
    position: "absolute",
    bottom: 0,
    resizeMode: "cover",
    opacity: 0.1,
    zIndex: 0,
  },
  backButton: {
    padding: 4,
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
  },
  headerRightPlaceholder: {
    width: 36,
  },
  tabContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 8,
    position: "relative",
  },
  activeTab: {
    backgroundColor: colors.primary + "15",
  },
  tabText: {
    fontSize: 12,
    fontWeight: "500",
    color: colors.textSecondary,
    marginLeft: 4,
  },
  activeTabText: {
    color: colors.primary,
    fontWeight: "600",
  },
  tabBadge: {
    position: "absolute",
    top: 2,
    right: 8,
    backgroundColor: "#EF4444",
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  tabBadgeText: {
    color: "white",
    fontSize: 10,
    fontWeight: "600",
  },
  content: {
    flex: 1,
  },
  quickStats: {
    flexDirection: "row",
    marginBottom: 24,
    gap: 12,
    padding: 15,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.text,
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: "center",
  },
  levelProgressSection: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  levelProgressCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  levelProgressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  currentLevelBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  currentLevelText: {
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 6,
  },
  progressPercentage: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
  },
  progressBarContainer: {
    marginBottom: 8,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
  },
  sectionTitle2: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle3: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom:10
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary,
  },
  activityCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    marginHorizontal: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#10B981" + "20",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  activityInfo: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 2,
  },
  activityDate: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  activityPoints: {
    alignItems: "flex-end",
  },
  activityPointsValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#10B981",
    marginBottom: 4,
  },
  horizontalScroll: {
    paddingLeft: 20,
  },
  featuredRewardCard: {
    width: 160,
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginRight: 12,
    marginBottom: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  rewardImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary + "20",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    alignSelf: "center",
  },
  rewardTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 8,
    textAlign: "center",
    minHeight: 36,
  },
  rewardPoints: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  rewardPointsText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
    marginLeft: 4,
  },
  rewardButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: "center",
  },
  rewardButtonDisabled: {
    backgroundColor: colors.border,
  },
  rewardButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
  rewardButtonTextDisabled: {
    color: colors.textSecondary,
  },
  // Enhanced achievement styles
  achievementsContainer: {
    paddingHorizontal: 20,
  },
  achievementCard: {
    flexDirection: "row",
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  achievementIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  achievementContent: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 4,
  },
  achievementDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
    lineHeight: 18,
  },
  achievementMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  achievementPoints: {
    flexDirection: "row",
    alignItems: "center",
  },
  achievementPointsText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.text,
    marginLeft: 4,
  },
  achievementDate: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  achievementsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingHorizontal: 20,
  },
  achievementBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary + "15",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  achievementText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.primary,
    marginLeft: 4,
  },
  emptyAchievements: {
    alignItems: "center",
    padding: 20,
  },
  emptyAchievementsText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
    marginTop: 8,
    marginBottom: 4,
  },
  emptyAchievementsSubtext: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
  rewardCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    marginTop: 15,
    marginBottom: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginHorizontal: 20,
  },
  rewardCardContent: {
    padding: 20,
  },
  rewardCardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  rewardIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary + "20",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  rewardCardInfo: {
    flex: 1,
  },
  rewardCardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 4,
  },
  rewardCardCategory: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.primary,
    marginBottom: 4,
  },
  popularityBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#10B981" + "20",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  popularityText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#10B981",
    marginLeft: 4,
  },
  rewardCardDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 16,
  },
  rewardCardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rewardCardPoints: {
    flexDirection: "row",
    alignItems: "center",
  },
  rewardCardPointsText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    marginLeft: 4,
  },
  rewardCardButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  rewardCardButtonDisabled: {
    backgroundColor: colors.border,
  },
  rewardCardButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  rewardCardButtonTextDisabled: {
    color: colors.textSecondary,
  },
  offerCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    marginBottom: 16,
    marginHorizontal: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    position: "relative",
  },
  offerBadge: {
    position: "absolute",
    top: 16,
    right: 16,
    backgroundColor: "#EF4444",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    zIndex: 1,
  },
  offerBadgeText: {
    color: "white",
    fontSize: 10,
    fontWeight: "600",
    marginLeft: 4,
  },
  offerContent: {
    padding: 20,
  },
  offerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  offerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    flex: 1,
    marginRight: 12,
  },
  offerPricing: {
    alignItems: "flex-end",
  },
  originalPrice: {
    fontSize: 14,
    color: colors.textSecondary,
    textDecorationLine: "line-through",
    marginBottom: 2,
  },
  offerPrice: {
    fontSize: 18,
    fontWeight: "700",
    color: "#EF4444",
  },
  offerDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 16,
  },
  quantityInfo: {
    marginBottom: 16,
  },
  quantityBar: {
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    overflow: "hidden",
    marginBottom: 8,
  },
  quantityFill: {
    height: "100%",
    backgroundColor: "#EF4444",
  },
  quantityText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  offerButton: {
    backgroundColor: "#EF4444",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  offerButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  historyCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    marginHorizontal: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  historyIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#10B981" + "20",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  historyInfo: {
    flex: 1,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 4,
  },
  historyDate: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  historyPoints: {
    alignItems: "flex-end",
  },
  historyPointsValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#10B981",
    marginBottom: 4,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    marginHorizontal: 20,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
  achievementsHistorySection: {
    marginTop: 32,
    paddingBottom: 20,
  },
})
