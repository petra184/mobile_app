"use client"
import OfferCard from "@/components/rewards/OfferCard"
import { PointsStatusCard } from "@/components/rewards/ProgressPoints"
import RedeemModal from "@/components/rewards/RedeemModal"
import RewardCard from "@/components/rewards/RewardCard"
import { colors } from "@/constants/Colors"
import { useCart } from "@/context/cart-context"
import { useNotifications } from "@/context/notification-context"
import { useUserStore } from "@/hooks/userStore"
import {
  checkUserAchievements,
  fetchRewards,
  fetchScanHistory,
  fetchSpecialOffers,
  fetchUserAchievements,
  fetchUserStatus,
} from "@/lib/actions/points"
import { supabase } from "@/lib/supabase"
import type { Reward, ScanHistory, SpecialOffer, UserAchievement, UserStatusWithLevel } from "@/types/updated_types"
import { Feather } from "@expo/vector-icons"
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons"
import { useLocalSearchParams, useRouter } from "expo-router"
import { StatusBar } from "expo-status-bar"
import type React from "react"
import { useCallback, useEffect, useState } from "react"
import {
  ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native"
import Animated, { FadeIn, FadeInDown, FadeInUp } from "react-native-reanimated"
import { SafeAreaView } from "react-native-safe-area-context"

type PurchaseHistory = {
  id: string
  item_id: string
  item_title: string
  item_type: "reward" | "special_offer"
  points_used: number
  quantity: number
  purchase_date: string
  status: string
}

type RewardOrSpecial = Reward | SpecialOffer

// Helper function to check if an item is a SpecialOffer
const isSpecialOffer = (item: RewardOrSpecial): item is SpecialOffer => {
  return "end_date" in item && "start_date" in item
}

// Reward Image Component
type RewardImageProps = {
  imageUrl?: string
  containerStyle?: any
}

const RewardImage: React.FC<RewardImageProps> = ({ imageUrl, containerStyle }) => {
  const [imageError, setImageError] = useState(false)
  const [imageLoading, setImageLoading] = useState(true)

  if (!imageUrl || imageError) {
    return (
      <View style={[styles.fallbackIconContainer, containerStyle]}>
        <Feather name="gift" size={32} color={colors.primary} />
      </View>
    )
  }

  return (
    <View style={[styles.fullImageContainer, containerStyle]}>
      {imageLoading && (
        <View style={styles.imageLoadingOverlay}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      )}
      <Image
        source={{ uri: imageUrl }}
        style={styles.fullImage}
        onError={() => {
          setImageError(true)
          setImageLoading(false)
        }}
        onLoad={() => setImageLoading(false)}
        onLoadEnd={() => setImageLoading(false)}
        resizeMode="cover"
      />
    </View>
  )
}

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
  const { tab } = useLocalSearchParams<{ tab?: string }>()
  const [activeTab, setActiveTab] = useState<"overview" | "rewards" | "offers" | "history">(
    tab === "rewards" || tab === "offers" || tab === "history" ? tab : "overview",
  )
  const { points, userId, getUserFirstName } = useUserStore()
  const { addToCart, totalItems } = useCart()
  const { showSuccess, showError, showInfo } = useNotifications()
  const router = useRouter()

  const [rewards, setRewards] = useState<Reward[]>([])
  const [specialOffers, setSpecialOffers] = useState<SpecialOffer[]>([])
  const [scanHistory, setScanHistory] = useState<ScanHistory[]>([])
  const [purchaseHistory, setPurchaseHistory] = useState<PurchaseHistory[]>([])
  const [userStatus, setUserStatus] = useState<UserStatusWithLevel | null>(null)
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Unified modal states
  const [selectedItem, setSelectedItem] = useState<RewardOrSpecial | null>(null)
  const [modalVisible, setModalVisible] = useState(false)

  useEffect(() => {
    if (userId) {
      fetchData()
    }
  }, [userId])

  // Fetch user purchase history
  const fetchPurchaseHistory = async (userId: string): Promise<PurchaseHistory[]> => {
    try {
      const { data, error } = await supabase.rpc("get_user_purchase_history", {
        p_user_id: userId,
      })
      if (error) throw error
      return data || []
    } catch (error) {
      console.error("Error fetching purchase history:", error)
      return []
    }
  }

  const fetchData = async () => {
    if (!userId) return
    setLoading(true)
    try {
      const [rewardsData, offersData, historyData, purchaseHistoryData, statusData, achievementsData] =
        await Promise.all([
          fetchRewards(),
          fetchSpecialOffers(),
          fetchScanHistory(userId),
          fetchPurchaseHistory(userId),
          fetchUserStatus(userId),
          fetchUserAchievements(userId),
        ])

      // Filter out sold rewards and rewards with no stock
      const availableRewards = rewardsData.filter((reward) => {
        if (reward.is_sold) return false
        const stockQuantity = Number(reward.stock_quantity)
        return isNaN(stockQuantity) || stockQuantity > 0
      })

      // Filter out expired and inactive special offers
      const availableOffers = offersData.filter((offer) => {
        if (!offer.is_active) return false
        // Check if offer is expired
        const isExpired = new Date() > new Date(offer.end_date)
        if (isExpired) return false
        // Check if offer hasn't started yet
        const isNotStarted = new Date() < new Date(offer.start_date)
        if (isNotStarted) return false
        // Check limited quantity
        if (offer.limited_quantity) {
          const remainingQuantity = offer.limited_quantity - (offer.claimed_count || 0)
          return remainingQuantity > 0
        }
        return true
      })

      setRewards(availableRewards)
      setSpecialOffers(availableOffers)
      setScanHistory(historyData)
      setPurchaseHistory(purchaseHistoryData)
      setUserStatus(statusData)
      setUserAchievements(achievementsData)

      // Check for new achievements after loading data
      if (statusData) {
        const newAchievements = await checkUserAchievements(userId)
        if (newAchievements.length > 0) {
          // Show achievement notification using notification context
          showSuccess(
            "🎉 Achievement Unlocked!",
            `You earned: ${newAchievements.map((a) => a.achievement_name).join(", ")}`,
          )
          // Refresh achievements
          const updatedAchievements = await fetchUserAchievements(userId)
          setUserAchievements(updatedAchievements)
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error)
      showError("Error", "Failed to load data. Please try again.")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const onRefresh = () => {
    setRefreshing(true)
    fetchData()
  }

  // Unified handler for both rewards and special offers
  const handleItemPress = (item: RewardOrSpecial) => {
    setSelectedItem(item)
    setModalVisible(true)
  }

  // Unified redeem handler
  // Replace your existing handleItemRedeem function with this fixed version:

const handleItemRedeem = useCallback(
  (item: RewardOrSpecial) => {
    if (!userId) {
      showError("Login Required", "Please log in to redeem items.")
      return
    }

    if (points < item.points_required) {
      showError("Insufficient Points", `You need ${item.points_required - points} more points to redeem this item.`)
      return
    }

    // Create cart item object that works for both rewards and special offers
    const cartItem = {
      id: item.id,
      title: item.title,
      description: item.description || "",
      points_required: item.points_required,
      category: item.category || undefined,
      image_url: item.image_url || undefined,
      // Add item type to distinguish between rewards and special offers in cart
      item_type: (isSpecialOffer(item) ? 'special_offer' : 'reward') as "special_offer" | "reward"
    }

    // Add to cart (works for both rewards and special offers)
    addToCart(cartItem)
    
    // Show success message
    const itemType = isSpecialOffer(item) ? 'Special Offer' : 'Reward'
    showSuccess("Added to Cart!", `${itemType} "${item.title}" has been added to your cart.`)
    
    // Close modal
    setModalVisible(false)
    
    // Refresh data to update points and availability
    fetchData()
  },
  [userId, points, addToCart, showSuccess, showError, fetchData]
  )

  // Also update your handleAddToCart function to be consistent:
  const handleAddToCart = (reward: Reward) => {
    if (!userId) {
      showError("Login Required", "Please log in to add rewards to cart.")
      return
    }
    if (points < reward.points_required) {
      showError("Insufficient Points", `You need ${reward.points_required - points} more points to get this reward.`)
      return
    }

    // Create cart item with item_type
    const cartItem = {
      id: reward.id,
      title: reward.title,
      description: reward.description || "",
      points_required: reward.points_required,
      category: reward.category || undefined,
      image_url: reward.image_url || undefined,
      //item_type: "reward"
    }

    // Add to cart
    addToCart(cartItem)

    // Show success notification
    showSuccess("Added to Cart!", `${reward.title} has been added to your cart.`)
  }

  const handleCloseModal = () => {
    setModalVisible(false)
    setSelectedItem(null)
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

  const [showAllPurchases, setShowAllPurchases] = useState(false)
  const [showAllScans, setShowAllScans] = useState(false)
  const [showAllAchievements, setShowAllAchievements] = useState(false)

  const renderOverview = () => (
    <>
      <ScrollView showsVerticalScrollIndicator={false} style={styles.container}>
        <View style={{ paddingTop: 20 }}></View>
        {/* Status Card */}
        <PointsStatusCard
          userFirstName={getUserFirstName()}
          points={points}
          name={false}
          userStatus={userStatus}
          animationDelay={100}
        />

        {/* Quick Stats */}
        <Animated.View entering={FadeInUp.duration(600).delay(200)} style={styles.quickStats}>
          <View style={styles.statCard}>
            <MaterialCommunityIcons name="qrcode-scan" size={24} color="#4ECDC4" />
            <Text style={styles.statValue}>{scanHistory.length || 0}</Text>
            <Text style={styles.statLabel}>Games Scanned</Text>
          </View>
          <View style={styles.statCard}>
            <Feather name="zap" size={24} color="#FF6B35" />
            <Text style={styles.statValue}>{userStatus?.current_streak || 0}</Text>
            <Text style={styles.statLabel}>Game Streak</Text>
          </View>
          <View style={styles.statCard}>
            <Feather name="shopping-bag" size={24} color="#45B7D1" />
            <Text style={styles.statValue}>{purchaseHistory.length}</Text>
            <Text style={styles.statLabel}>Purchases</Text>
          </View>
        </Animated.View>

        {/* Special Offers */}
        {specialOffers.length > 0 && (
          <Animated.View entering={FadeInUp.duration(600).delay(300)} style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Special Offers</Text>
              <TouchableOpacity onPress={() => setActiveTab("offers")}>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.featuredScrollView}
              contentContainerStyle={styles.featuredContainer}
            >
              {specialOffers.map((offer, index) => (
                <Animated.View key={offer.id} entering={FadeInUp.duration(600).delay(300 + index * 100)}>
                  <OfferCard offer={offer} userPoints={points} onPress={() => handleItemPress(offer)} />
                </Animated.View>
              ))}
            </ScrollView>
          </Animated.View>
        )}

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
              {rewards.slice(0, 3).map((reward, index) => (
                <Animated.View
                  key={reward.id}
                  entering={FadeInUp.duration(400).delay(index * 50)}
                  style={styles.featuredRewardCardContainer}
                >
                  <RewardCard
                    reward={reward}
                    userPoints={points}
                    onPress={handleItemPress}
                    onAddToCart={handleAddToCart}
                    cardWidth={160}
                  />
                </Animated.View>
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

  const renderRewards = () => (
    <ScrollView showsVerticalScrollIndicator={false} style={styles.rewardsContainer}>
      {rewards.length > 0 ? (
        <View style={styles.rewardsGrid}>
          {rewards.map((reward, index) => (
            <Animated.View
              key={reward.id}
              entering={FadeInUp.duration(400).delay(index * 50)}
              style={[
                styles.rewardCardWrapper,
                // If it's an odd number and this is the last item, align it to the left
                rewards.length % 2 !== 0 && index === rewards.length - 1 && styles.lastItemLeft,
              ]}
            >
              <RewardCard
                reward={reward}
                userPoints={points}
                onPress={handleItemPress}
                onAddToCart={handleAddToCart}
                cardWidth="100%"
              />
            </Animated.View>
          ))}
        </View>
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
        <View style={styles.offersContainer}>
          {specialOffers.map((offer, index) => (
            <Animated.View
              key={offer.id}
              entering={FadeInUp.duration(600).delay(index * 100)}
              style={styles.offerCardWrapper}
            >
              <OfferCard
                cardWidth="85%"
                offer={offer}
                userPoints={points}
                onPress={() => handleItemPress(offer)}
              />
            </Animated.View>
          ))}
        </View>
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
      {/* Purchase History Section */}
      <Text style={styles.sectionTitle3}>Purchase History</Text>
      {purchaseHistory.length > 0 ? (
        <>
          {purchaseHistory.slice(0, showAllPurchases ? purchaseHistory.length : 4).map((purchase, index) => (
            <Animated.View key={purchase.id} entering={FadeInUp.duration(400).delay(index * 50)} style={styles.historyCard}>
              <View style={styles.historyIcon}>
                <Feather
                  name={purchase.item_type === "special_offer" ? "zap" : "gift"}
                  size={24}
                  color={purchase.item_type === "special_offer" ? "#EF4444" : "#10B981"}
                />
              </View>
              <View style={styles.historyInfo}>
                <Text style={styles.historyTitle}>{purchase.item_title}</Text>
                <Text style={styles.historySubtitle}>
                  {purchase.item_type === "special_offer" ? "Special Offer" : "Reward"} • Qty: {purchase.quantity}
                </Text>
                <Text style={styles.historyDate}>{formatDate(purchase.purchase_date)}</Text>
              </View>
              <View style={styles.historyPoints}>
                <Text style={styles.historyPointsValue}>-{purchase.points_used}</Text>
                <Text style={styles.historyPointsLabel}>points</Text>
              </View>
            </Animated.View>
          ))}
          {purchaseHistory.length > 4 && (
            <TouchableOpacity onPress={() => setShowAllPurchases(!showAllPurchases)} style={styles.seeAllButton}>
              <Text style={styles.seeAllButtonText}>
                {showAllPurchases ? "Show Less" : "See All Purchases"}
              </Text>
              <Feather
                name={showAllPurchases ? "chevron-up" : "chevron-down"}
                size={16}
                color={colors.primary}
              />
            </TouchableOpacity>
          )}
        </>
      ) : (
        <View style={styles.emptyState}>
          <Feather name="shopping-bag" size={64} color={colors.textSecondary} />
          <Text style={styles.emptyStateText}>No purchases yet</Text>
          <Text style={styles.emptyStateSubtext}>Start redeeming rewards to see your purchase history!</Text>
        </View>
      )}

      {/* Scan History Section */}
      <Text style={styles.sectionTitle3}>Scan History</Text>
      {scanHistory.length > 0 ? (
        <>
          {scanHistory.slice(0, showAllScans ? scanHistory.length : 4).map((scan, index) => (
            <Animated.View key={scan.id} entering={FadeInUp.duration(400).delay(index * 50)} style={styles.historyCard}>
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
          ))}
          {scanHistory.length > 4 && (
            <TouchableOpacity onPress={() => setShowAllScans(!showAllScans)} style={styles.seeAllButton}>
              <Text style={styles.seeAllButtonText}>
                {showAllScans ? "Show Less" : "See All Scans"}
              </Text>
              <Feather
                name={showAllScans ? "chevron-up" : "chevron-down"}
                size={16}
                color={colors.primary}
              />
            </TouchableOpacity>
          )}
        </>
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
          <>
            <View style={styles.achievementsContainer}>
              {userAchievements.slice(0, showAllAchievements ? userAchievements.length : 4).map((achievement, index) => {
                const iconName = getAchievementIcon(achievement);
                const iconColor = getAchievementColor(achievement);
                return (
                  <Animated.View
                    key={achievement.id}
                    entering={FadeInUp.duration(400).delay(100 * index)}
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
                );
              })}
            </View>
            {userAchievements.length > 4 && (
              <TouchableOpacity onPress={() => setShowAllAchievements(!showAllAchievements)} style={styles.seeAllButton}>
                <Text style={styles.seeAllButtonText}>
                  {showAllAchievements ? "Show Less" : "See All Achievements"}
                </Text>
                <Feather
                  name={showAllAchievements ? "chevron-up" : "chevron-down"}
                  size={16}
                  color={colors.primary}
                />
              </TouchableOpacity>
            )}
          </>
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
      <Image source={require("@/IMAGES/crowd.jpg")} style={styles.backgroundImage} />
      <StatusBar style="dark" />

      {/* Header with centered title */}
      <Animated.View entering={FadeIn.duration(400)} style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Feather name="chevron-left" size={28} color={colors.text} />
        </Pressable>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Rewards & Points</Text>
        </View>
        <TouchableOpacity style={styles.cartButton} onPress={() => router.push("../store/Checkout")}>
          <Feather name="shopping-cart" size={20} color={colors.text} />
          {totalItems > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{totalItems}</Text>
            </View>
          )}
        </TouchableOpacity>
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

      {/* Unified Modal for both rewards and special offers */}
      <RedeemModal visible={modalVisible} item={selectedItem} onClose={handleCloseModal} onRedeem={handleItemRedeem} userPoints={points}/>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  rewardsContainer: {
    paddingTop: 10,
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
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    borderRadius: 15,
    paddingVertical: 12,
    marginHorizontal:40,
    marginBottom: 10,
    shadowColor: colors.background,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  seeAllButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
    marginRight: 8,
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
  cartButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  cartBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    backgroundColor: "#EF4444",
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  cartBadgeText: {
    color: "white",
    fontSize: 10,
    fontWeight: "600",
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
    marginBottom: -40,
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
  sectionTitle3: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary,
  },
  featuredScrollView: {
    marginBottom: 8,
  },
  featuredContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  offersContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 10,
  },
  offerCardWrapper: {
    marginBottom: 16,
    width: "100%",
    alignItems: "center",
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
    paddingRight: 20,
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
    position: "relative",
  },
  featuredRewardCardDisabled: {
    opacity: 0.6,
  },
  rewardImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary + "20",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    alignSelf: "center",
    overflow: "hidden",
  },
  rewardImageWrapper: {
    width: "100%",
    height: "100%",
  },
  fullImageContainer: {
    width: "100%",
    height: "100%",
    position: "relative",
  },
  fullImage: {
    width: "100%",
    height: "100%",
  },
  fallbackIconContainer: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.05)",
  },
  imageLoadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    zIndex: 1,
    borderRadius: 30,
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
    borderRadius: 38,
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
  rewardOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(128, 128, 128, 0.5)",
    borderRadius: 16,
    zIndex: 1,
  },
  disabledText: {
    color: "#999",
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
  emptyAchievements: {
    alignItems: "center",
    padding: 20,
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
  historySubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 2,
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
    color: "#EF4444",
    marginBottom: 2,
  },
  historyPointsLabel: {
    fontSize: 10,
    color: colors.textSecondary,
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
  rewardsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  rewardCardWrapper: {
    width: "48%",
    marginBottom: 16,
  },
  lastItemLeft: {
    alignSelf: "flex-start",
  },
  featuredRewardCardContainer: {
    marginRight: 12,
    width: 160,
  },
})
