"use client"
import type React from "react"
import { useState, useEffect, useCallback } from "react"
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Pressable,
  Image,
  Modal,
  Alert,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { colors } from "@/constants/colors"
import { useUserStore } from "@/hooks/userStore"
import { Feather } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import { useCart } from "@/context/cart-context"
import { useNotifications } from "@/context/notification-context"
import Animated, { FadeIn, FadeInDown, FadeInUp } from "react-native-reanimated"
import { StatusBar } from "expo-status-bar"
import { PointsStatusCard } from "@/components/rewards/ProgressPoints"
import SpecialOfferCard from "@/components/rewards/SpecialOfferCard"
import {
  fetchRewards,
  fetchSpecialOffers,
  fetchScanHistory,
  fetchUserStatus,
  fetchUserAchievements,
  checkUserAchievements
} from "@/app/actions/points"
import { Reward, SpecialOffer, UserAchievement, UserStatusWithLevel, ScanHistory } from "@/types/updated_types"
import { supabase } from "@/lib/supabase"
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons"

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

// Full Screen Detail Modal Component
const DetailModal: React.FC<{
  visible: boolean
  onClose: () => void
  item: Reward | SpecialOffer | null
  type: "reward" | "offer"
  userPoints: number
  onClaim: (item: Reward | SpecialOffer) => void
}> = ({ visible, onClose, item, type, userPoints, onClaim }) => {
  if (!item) return null

  const canAfford = userPoints >= item.points_required
  const isOffer = type === "offer"
  const offer = isOffer ? (item as SpecialOffer) : null

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.modalContainer}>
        <StatusBar style="dark" />
        {/* Header */}
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Feather name="x" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.modalHeaderTitle}>{isOffer ? "Special Offer" : "Reward Details"}</Text>
          <View style={styles.closeButton} />
        </View>

        <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
          {/* Hero Image */}
          <View style={styles.modalImageContainer}>
            <RewardImage imageUrl={item.image_url ?? undefined} containerStyle={styles.modalImage} />
            {isOffer && (
              <View style={styles.modalOfferBadge}>
                <View style={styles.offerBadgeGradient}>
                  <Feather name="zap" size={16} color="white" />
                  <Text style={styles.modalOfferBadgeText}>LIMITED TIME</Text>
                </View>
              </View>
            )}
          </View>

          {/* Content */}
          <View style={styles.modalDetailsContainer}>
            <Text style={[styles.modalTitle, !canAfford && styles.disabledText]}>{item.title}</Text>
            <Text style={[styles.modalDescription, !canAfford && styles.disabledText]}>{item.description}</Text>

            {/* Points Section */}
            <View style={styles.modalPointsSection}>
              <View style={styles.modalPointsContainer}>
                {isOffer && offer?.original_points && (
                  <View style={styles.modalPricingRow}>
                    <View style={styles.modalCurrentPoints}>
                      <Feather name="star" size={20} color={canAfford ? "#FFD700" : "#999"} />
                      <Text style={[styles.modalPointsText, !canAfford && styles.disabledText]}>
                        Get it for {item.points_required} pts
                      </Text>
                    </View>
                    <Text style={styles.modalOriginalPoints}>{offer.original_points} pts</Text>
                    <View style={styles.modalSavingsBadge}>
                      <Text style={styles.modalSavingsText}>
                        Save {offer.original_points - item.points_required} PTS!
                      </Text>
                    </View>
                  </View>
                )}
                {(!isOffer || !offer?.original_points) && (
                  <View style={styles.modalCurrentPoints}>
                    <Feather name="star" size={20} color={canAfford ? "#FFD700" : "#999"} />
                    <Text style={[styles.modalPointsText, !canAfford && styles.disabledText]}>
                      {item.points_required} points
                    </Text>
                  </View>
                )}
              </View>
              {!canAfford && (
                <View style={styles.modalInsufficientBadge}>
                  <Feather name="lock" size={16} color="#EF4444" />
                  <Text style={styles.modalInsufficientText}>
                    Need {(item.points_required - userPoints).toLocaleString()} more points
                  </Text>
                </View>
              )}
            </View>
          </View>
        </ScrollView>

        {/* Action Button */}
        <View style={styles.modalFooter}>
          <TouchableOpacity
            style={[styles.modalActionButton, !canAfford && styles.modalActionButtonDisabled]}
            onPress={() => onClaim(item)}
            disabled={!canAfford}
          >
            <Text style={[styles.modalActionButtonText, !canAfford && styles.modalActionButtonTextDisabled]}>
              {!canAfford
                ? "Insufficient Points"
                : isOffer
                  ? `Claim Offer for ${item.points_required} PTS`
                  : "Add to Cart"}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
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
  const [activeTab, setActiveTab] = useState<"overview" | "rewards" | "offers" | "history">("overview")

  // Modal states
  const [detailModalVisible, setDetailModalVisible] = useState(false)
  const [selectedItem, setSelectedItem] = useState<Reward | SpecialOffer | null>(null)
  const [modalType, setModalType] = useState<"reward" | "offer">("reward")

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

  const handleItemPress = (item: Reward | SpecialOffer, type: "reward" | "offer") => {
    setSelectedItem(item)
    setModalType(type)
    setDetailModalVisible(true)
  }

  const handleClaimItem = useCallback(
    (item: Reward | SpecialOffer) => {
      if (!userId) {
        showError("Login Required", "Please log in to claim rewards.")
        return
      }

      if (points < item.points_required) {
        showError(
          "Insufficient Points",
          `You need ${item.points_required - points} more points to claim this ${modalType}.`,
        )
        return
      }

      // Add to cart
      addToCart({
        id: item.id,
        title: item.title,
        description: item.description || "",
        points_required: item.points_required,
        category: item.category || undefined,
        image_url: item.image_url || undefined,
      })

      // Show success notification
      showSuccess(
        `${modalType === "offer" ? "Offer Claimed!" : "Added to Cart!"}`,
        `${item.title} has been added to your cart.`,
      )

      // Close modal and navigate to cart
      setDetailModalVisible(false)
      setTimeout(() => {
        router.push("../store/Checkout")
      }, 1000)
    },
    [userId, points, modalType, addToCart, showSuccess, showError, router],
  )

  const handleAddToCart = (reward: Reward) => {
    if (!userId) {
      showError("Login Required", "Please log in to add rewards to cart.")
      return
    }

    if (points < reward.points_required) {
      showError("Insufficient Points", `You need ${reward.points_required - points} more points to get this reward.`)
      return
    }

    // Add to cart
    addToCart({
      id: reward.id,
      title: reward.title,
      description: reward.description || "",
      points_required: reward.points_required,
      category: reward.category || undefined,
      image_url: reward.image_url || undefined,
    })

    // Show success notification
    showSuccess("Added to Cart!", `${reward.title} has been added to your cart.`)

    // Navigate to cart after a short delay
    setTimeout(() => {
      router.push("../store/Checkout")
    }, 1000)
  }

  const handleRedeemReward = async (reward: Reward) => {
    handleItemPress(reward, "reward")
  }

  const handleSpecialOfferRedeem = (offer: SpecialOffer) => {
    if (!userId) {
      Alert.alert("Login Required", "Please log in to redeem special offers.")
      return
    }

    if (points < offer.points_required) {
      Alert.alert("Insufficient Points", `You need ${offer.points_required - points} more points to redeem this offer.`)
      return
    }

    // In a real app, you would call an API to redeem the special offer
    showSuccess("Offer Redeemed!", `${offer.title} has been redeemed successfully!`)
    // Refresh data to update claimed count
    fetchData()
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
            <Text style={styles.statLabel}>Day Streak</Text>
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
                  <SpecialOfferCard offer={offer} userPoints={points} onRedeem={handleSpecialOfferRedeem} />
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
              {rewards.slice(0, 3).map((reward) => {
                const canAfford = points >= reward.points_required
                return (
                  <TouchableOpacity
                    key={reward.id}
                    style={[styles.featuredRewardCard, !canAfford && styles.featuredRewardCardDisabled]}
                    onPress={() => handleRedeemReward(reward)}
                  >
                    {!canAfford && <View style={styles.rewardOverlay} />}
                    <View style={styles.rewardImageContainer}>
                      <RewardImage
                        imageUrl={reward.image_url ?? undefined}
                        containerStyle={styles.rewardImageWrapper}
                      />
                    </View>
                    <Text style={[styles.rewardTitle, !canAfford && styles.disabledText]} numberOfLines={2}>
                      {reward.title}
                    </Text>
                    <View style={styles.rewardPoints}>
                      <Feather name="star" size={14} color={canAfford ? "#FFD700" : "#999"} />
                      <Text style={[styles.rewardPointsText, !canAfford && styles.disabledText]}>
                        {reward.points_required}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={[styles.rewardButton, !canAfford && styles.rewardButtonDisabled]}
                      onPress={(e) => {
                        e.stopPropagation()
                        if (canAfford) {
                          handleAddToCart(reward)
                        }
                      }}
                      disabled={!canAfford}
                    >
                      <Text style={[styles.rewardButtonText, !canAfford && styles.rewardButtonTextDisabled]}>
                        {!canAfford ? "Not Enough PTS" : "Add to Cart"}
                      </Text>
                    </TouchableOpacity>
                  </TouchableOpacity>
                )
              })}
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
    <ScrollView showsVerticalScrollIndicator={false}>
      {rewards.length > 0 ? (
        rewards.map((reward) => {
          const canAfford = points >= reward.points_required
          return (
            <Animated.View key={reward.id} entering={FadeInUp.duration(400)} style={styles.rewardCard}>
              <TouchableOpacity style={styles.rewardCardContent} onPress={() => handleRedeemReward(reward)}>
                <View style={styles.rewardCardHeader}>
                  <View style={styles.rewardIconContainer}>
                    <RewardImage imageUrl={reward.image_url ?? undefined} containerStyle={styles.rewardImageWrapper} />
                  </View>
                  <View style={styles.rewardCardInfo}>
                    <Text style={[styles.rewardCardTitle, !canAfford && styles.disabledText]}>{reward.title}</Text>
                    {/* PRICE BELOW TITLE */}
                    <View style={styles.rewardCardPoints}>
                      <Feather name="star" size={16} color={canAfford ? "#FFD700" : "#999"} />
                      <Text style={[styles.rewardCardPointsText, !canAfford && styles.disabledText]}>
                        {reward.points_required} points
                      </Text>
                    </View>
                    {/* LOW STOCK WARNING */}
                    {reward.stock_quantity && reward.stock_quantity <= 5 && (
                      <View style={styles.stockWarning}>
                        <Feather name="alert-triangle" size={12} color="#F59E0B" />
                        <Text style={styles.stockWarningText}>Only {reward.stock_quantity} left!</Text>
                      </View>
                    )}
                  </View>
                </View>
                <Text style={[styles.rewardCardDescription, !canAfford && styles.disabledText]}>
                  {reward.description}
                </Text>

                {/* BUTTON */}
                <View style={styles.rewardCardFooter}>
                  <View style={{ flex: 1, alignContent:"center" }} />
                  <TouchableOpacity
                    style={[
                      styles.rewardCardButton,
                      !canAfford && styles.rewardCardButtonInsufficientPoints, // New style for insufficient points
                    ]}
                    onPress={(e) => {
                      e.stopPropagation()
                      if (canAfford) {
                        handleAddToCart(reward)
                      }
                    }}
                    disabled={!canAfford}
                  >
                    {canAfford ? (
                      <View style={{flex:1, flexDirection:"row", alignItems:"center", justifyContent:"center"}}>
                      <Feather name="shopping-cart" color="white" size={18}/>
                      <Text style={styles.rewardCardButtonText}>Add to Cart</Text>
                      </View>
                    ) : (
                      <>
                        <Feather name="lock" size={12} color="#EF4444" />
                        <Text style={styles.rewardCardButtonInsufficientText}>
                          Need {(reward.points_required - points).toLocaleString()} more points
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            </Animated.View>
          )
        })
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
              <SpecialOfferCard 
                  cardWidth="85%" 
                  offer={offer} userPoints={points} onRedeem={handleSpecialOfferRedeem} />
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
        purchaseHistory.map((purchase) => (
          <Animated.View key={purchase.id} entering={FadeInUp.duration(400)} style={styles.historyCard}>
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
        ))
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
              <Text style={styles.historyPointsLabel}>points</Text>
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

      {/* Detail Modal */}
      <DetailModal
        visible={detailModalVisible}
        onClose={() => setDetailModalVisible(false)}
        item={selectedItem}
        type={modalType}
        userPoints={points}
        onClaim={handleClaimItem}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  rewardCardButtonInsufficientPoints: {
    backgroundColor: "#FEE2E2", // Red background
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 15,
  },
  rewardCardButtonInsufficientText: {
    color: "#EF4444",
    fontSize: 12,
    fontWeight: "600",
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
    position: "relative",
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
    overflow: "hidden",
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
  stockWarning: {
    position: "absolute",
    top: -25,
    right: -20,
    backgroundColor: "#FEF3C7",
    borderRadius: 12,
    borderColor: "#D97706",
    paddingHorizontal: 8,
    borderWidth: 0.2,
    paddingVertical: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    zIndex: 10,
  },
  stockWarningText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#D97706",
    marginLeft: 4,
  },
  rewardCardDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 16,
  },
  rewardCardFooter: {
    width: "50%",
    alignSelf: "center",
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
    flex:1,
    alignItems: "flex-start",
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 22,
    alignContent:"center",
  },
  rewardCardButtonDisabled: {
    backgroundColor: colors.border,
  },
  rewardCardButtonText: {
    color: "white",
    fontSize: 14,
    marginLeft:10,
    fontWeight: "600",
  },
  rewardCardButtonTextDisabled: {
    color: colors.textSecondary,
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
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
  },
  modalHeaderTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
  },
  modalContent: {
    flex: 1,
  },
  modalImageContainer: {
    height: 250,
    backgroundColor: colors.primary + "10",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  modalImage: {
    width: "100%",
    height: "100%",
  },
  modalOfferBadge: {
    position: "absolute",
    top: 20,
    right: 20,
    borderRadius: 12,
    overflow: "hidden",
  },
  offerBadgeGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#EF4444",
  },
  modalOfferBadgeText: {
    color: "white",
    fontSize: 12,
    fontWeight: "700",
    marginLeft: 6,
  },
  modalDetailsContainer: {
    padding: 24,
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.text,
    marginBottom: 8,
    lineHeight: 34,
  },
  modalCategory: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary,
    marginBottom: 16,
    letterSpacing: 1,
  },
  modalDescription: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 24,
    marginBottom: 24,
  },
  modalPointsSection: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  modalPointsContainer: {
    alignItems: "flex-start",
  },
  modalPricingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
  modalOriginalPoints: {
    fontSize: 16,
    color: colors.textSecondary,
    textDecorationLine: "line-through",
  },
  modalCurrentPoints: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  modalPointsText: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.text,
    marginLeft: 8,
  },
  modalSavingsBadge: {
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  modalSavingsText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#D97706",
  },
  modalInsufficientBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  modalInsufficientText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#EF4444",
    marginLeft: 8,
  },
  modalUserPointsSection: {
    backgroundColor: "#F0F9FF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  modalUserPointsLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textSecondary,
    marginBottom: 8,
  },
  modalUserPointsContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  modalUserPointsText: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
    marginLeft: 8,
  },
  modalFooter: {
    padding: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  modalActionButton: {
    backgroundColor: colors.primary,
    borderRadius: 36,
    paddingVertical: 18,
    paddingHorizontal: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  modalActionButtonDisabled: {
    backgroundColor: colors.border,
    opacity: 0.6,
  },
  modalActionButtonText: {
    fontSize: 18,
    fontWeight: "700",
    color: "white",
    letterSpacing: 0.5,
  },
  modalActionButtonTextDisabled: {
    color: colors.textSecondary,
  },
})