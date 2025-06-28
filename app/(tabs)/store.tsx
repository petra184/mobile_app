"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  TextInput,
  Platform,
  ActivityIndicator,
  RefreshControl,
  Image,
  Modal,
  Alert,
} from "react-native"
import { Feather } from "@expo/vector-icons"
import { SafeAreaView } from "react-native-safe-area-context"
import BirthdayBanner from "@/components/rewards/BirthdayBanner"
import { colors } from "@/constants/colors"
import { useRouter } from "expo-router"
import { useUserStore } from "@/hooks/userStore"
import { useNotifications } from "@/context/notification-context"
import { useCart } from "@/context/cart-context"
import Animated, { FadeInUp, FadeInDown } from "react-native-reanimated"
import {
  fetchRewards,
  fetchSpecialOffers,
  fetchUserAchievements,
  fetchUserStatus,
  type Reward,
  type SpecialOffer,
  type UserAchievement,
  type UserStatusWithLevel,
} from "@/app/actions/points"

const { width } = Dimensions.get("window")

type SortOption = "none" | "points_low_high" | "points_high_low" | "newest" | "popular"

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
        <Feather name="gift" size={42} color={colors.primary} />
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
        onLoadStart={() => setImageLoading(true)}
        resizeMode="cover"
      />
    </View>
  )
}

type OfferImageProps = {
  imageUrl?: string
  containerStyle?: any
}

const OfferImage: React.FC<OfferImageProps> = ({ imageUrl, containerStyle }) => {
  const [imageError, setImageError] = useState(false)
  const [imageLoading, setImageLoading] = useState(true)

  if (!imageUrl || imageError) {
    return (
      <View style={[styles.fallbackIconContainer, containerStyle]}>
        <Feather name="zap" size={28} color="#EF4444" />
      </View>
    )
  }

  return (
    <View style={[styles.fullImageContainer, containerStyle]}>
      {imageLoading && (
        <View style={styles.imageLoadingOverlay}>
          <ActivityIndicator size="small" color="#EF4444" />
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
        onLoadStart={() => setImageLoading(true)}
        resizeMode="cover"
      />
    </View>
  )
}

// Reward Detail Modal Component
const RewardDetailModal: React.FC<{
  reward: Reward | null
  visible: boolean
  onClose: () => void
  onAddToCart: (reward: Reward) => void
  onRemoveFromCart: (reward: Reward) => void
  isInCart: boolean
  quantity: number
  canAfford: boolean
}> = ({ reward, visible, onClose, onAddToCart, onRemoveFromCart, isInCart, quantity, canAfford }) => {
  if (!reward) return null

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Feather name="x" size={24} color="#666" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Reward Details</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.modalContent}>
          <View style={styles.modalImageContainer}>
            <RewardImage imageUrl={reward.image_url ?? undefined} containerStyle={styles.modalImage} />
            {(reward.stock_quantity ?? 0) <= 5 && (reward.stock_quantity ?? 0) > 0 && (
              <View style={styles.modalLowStockBadge}>
                <Text style={styles.lowStockText}>Only {reward.stock_quantity} left!</Text>
              </View>
            )}
          </View>

          <View style={styles.modalInfo}>
            <Text style={styles.modalRewardTitle}>{reward.title}</Text>
            <Text style={styles.modalRewardDescription}>
              {reward.description || "Add this amazing reward to your cart!"}
            </Text>

            <View style={styles.modalPointsContainer}>
              <View style={styles.modalPointsRow}>
                <Feather name="star" size={20} color="#FFD700" />
                <Text style={styles.modalRewardPoints}>{reward.points_required} points</Text>
              </View>
              {reward.category && (
                <View style={styles.modalCategoryBadge}>
                  <Text style={styles.modalCategoryText}>{reward.category}</Text>
                </View>
              )}
            </View>

            {!canAfford && (
              <View style={styles.modalWarningContainer}>
                <Feather name="alert-triangle" size={20} color="#F59E0B" />
                <Text style={styles.modalWarningText}>You don't have enough points for this reward</Text>
              </View>
            )}
          </View>
        </ScrollView>

        <View style={styles.modalActions}>
          {isInCart ? (
            <View style={styles.modalCartActions}>
              <TouchableOpacity
                style={styles.modalRemoveButton}
                onPress={() => onRemoveFromCart(reward)}
                disabled={!canAfford}
              >
                <Feather name="minus" size={20} color="#EF4444" />
                <Text style={styles.modalRemoveButtonText}>Remove</Text>
              </TouchableOpacity>
              <View style={styles.modalQuantityDisplay}>
                <Text style={styles.modalQuantityText}>In Cart: {quantity}</Text>
              </View>
              <TouchableOpacity
                style={[styles.modalAddButton, !canAfford && styles.modalButtonDisabled]}
                onPress={() => onAddToCart(reward)}
                disabled={!canAfford}
              >
                <Feather name="plus" size={20} color="#FFFFFF" />
                <Text style={styles.modalAddButtonText}>Add More</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.modalAddToCartButton, !canAfford && styles.modalButtonDisabled]}
              onPress={() => onAddToCart(reward)}
              disabled={!canAfford}
            >
              <Feather name="shopping-cart" size={20} color="#FFFFFF" />
              <Text style={styles.modalAddToCartButtonText}>Add to Cart</Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  )
}

const RewardsStoreScreen: React.FC = () => {
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [sortOption, setSortOption] = useState<SortOption>("none")
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState<string>("")
  const [refreshing, setRefreshing] = useState(false)
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null)
  const [modalVisible, setModalVisible] = useState(false)

  const router = useRouter()
  const { points, userId } = useUserStore()
  const { showSuccess, showInfo } = useNotifications()
  const { addToCart, removeOneFromCart, totalItems, isInCart, getItemQuantity } = useCart()

  // State for data
  const [rewards, setRewards] = useState<Reward[]>([])
  const [specialOffers, setSpecialOffers] = useState<SpecialOffer[]>([])
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([])
  const [userStatus, setUserStatus] = useState<UserStatusWithLevel | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
    }, 500)
    return () => clearTimeout(timer)
  }, [searchQuery])

  useEffect(() => {
    if (userId) {
      fetchData()
    }
  }, [userId])

  const fetchData = async () => {
    if (!userId) return

    setLoading(true)
    setError(null)
    try {
      const [rewardsData, offersData, achievementsData, statusData] = await Promise.all([
        fetchRewards(),
        fetchSpecialOffers(),
        fetchUserAchievements(userId),
        fetchUserStatus(userId),
      ])

      // Filter out sold rewards
      const availableRewards = rewardsData.filter((reward) => !reward.is_sold && (reward.stock_quantity ?? 0) > 0)

      setRewards(availableRewards)
      setSpecialOffers(offersData)
      setUserAchievements(achievementsData)
      setUserStatus(statusData)
    } catch (err) {
      console.error("Error fetching data:", err)
      setError("Failed to load rewards. Please try again.")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const onRefresh = () => {
    setRefreshing(true)
    fetchData()
  }

  // Filter and sort rewards
  const filteredRewards = rewards
    .filter((reward) => {
      // Search filter only
      if (debouncedSearchQuery.trim()) {
        const query = debouncedSearchQuery.toLowerCase()
        return (
          reward.title.toLowerCase().includes(query) ||
          reward.description?.toLowerCase().includes(query) ||
          reward.category?.toLowerCase().includes(query)
        )
      }
      return true
    })
    .sort((a, b) => {
      switch (sortOption) {
        case "points_low_high":
          return a.points_required - b.points_required
        case "points_high_low":
          return b.points_required - a.points_required
        case "newest":
          return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
        case "popular":
          return (b.popularity_score || 0) - (a.popularity_score || 0)
        default:
          return 0
      }
    })

  const toggleFavorite = (rewardId: string) => {
    setFavorites((prev) => {
      const newFavorites = new Set(prev)
      if (newFavorites.has(rewardId)) {
        newFavorites.delete(rewardId)
      } else {
        newFavorites.add(rewardId)
      }
      return newFavorites
    })
  }

  const handleRewardPress = (reward: Reward) => {
    setSelectedReward(reward)
    setModalVisible(true)
  }

  const handleAddToCart = (reward: Reward) => {
    if (!userId) {
      Alert.alert("Login Required", "Please log in to add rewards to cart.")
      return
    }

    if (points < reward.points_required) {
      Alert.alert("Insufficient Points", `You need ${reward.points_required - points} more points to get this reward.`)
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

    // Navigate to cart after a short delay (like the points screen does)
    setTimeout(() => {
      router.push("../store/Checkout")
    }, 1000)
  }

  const handleRemoveFromCart = (reward: Reward) => {
    removeOneFromCart(reward.id)
    showInfo("Removed from Cart", `One ${reward.title} has been removed from your cart.`)
  }

  const resetFilters = () => {
    setSortOption("none")
    setSearchQuery("")
  }

  const handleCheckoutPress = () => {
    // Pass current rewards data as parameters
    router.push({
      pathname: "../store/Checkout",
      params: {
        totalItems: totalItems.toString(),
        userPoints: points.toString(),
        timestamp: Date.now().toString(), // Force refresh
      },
    })
  }

  const renderRewardCard = (reward: Reward, index: number) => {
    const isFavorite = favorites.has(reward.id)
    const inCart = isInCart(reward.id)
    const quantity = getItemQuantity(reward.id)
    const canAfford = points >= reward.points_required
    const isDisabled = !canAfford

    return (
      <Animated.View
        key={reward.id}
        entering={FadeInUp.duration(400).delay(index * 100)}
        style={[styles.rewardCard, { marginHorizontal: 8 }, isDisabled && styles.rewardCardDisabled]}
      >
        <TouchableOpacity
          style={[styles.rewardCardContent, isDisabled && styles.rewardCardContentDisabled]}
          onPress={() => handleRewardPress(reward)}
          activeOpacity={isDisabled ? 1 : 0.7}
          disabled={isDisabled}
        >
          <View style={styles.rewardImageContainer}>
            <RewardImage imageUrl={reward.image_url ?? undefined} containerStyle={styles.rewardImageWrapper} />
            <TouchableOpacity
              style={styles.favoriteButton}
              onPress={(e) => {
                e.stopPropagation()
                toggleFavorite(reward.id)
              }}
              disabled={isDisabled}
            >
              <Feather
                name="heart"
                size={20}
                color={isFavorite ? "#FF3B30" : "#FFFFFF"}
                style={{ opacity: isFavorite ? 1 : 0.8 }}
              />
            </TouchableOpacity>
            {inCart && (
              <View style={styles.inCartBadge}>
                <Text style={styles.inCartText}>{quantity}</Text>
              </View>
            )}
            {(reward.stock_quantity ?? 0) <= 5 && (reward.stock_quantity ?? 0) > 0 && (
              <View style={styles.lowStockBadge}>
                <Text style={styles.lowStockText}>Only {reward.stock_quantity} left!</Text>
              </View>
            )}
            {isDisabled && (
              <View style={styles.disabledOverlay}>
                <Feather name="lock" size={24} color="#999" />
                <Text style={styles.disabledText}>Not enough points</Text>
              </View>
            )}
          </View>

          <View style={styles.rewardInfo}>
            <Text
              style={[styles.rewardName, isDisabled && styles.rewardNameDisabled]}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {reward.title}
            </Text>
            <Text
              style={[styles.rewardDescription, isDisabled && styles.rewardDescriptionDisabled]}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {reward.description || "Add this amazing reward to your cart!"}
            </Text>
            <View style={styles.pointsContainer}>
              <View style={styles.pointsRow}>
                <Feather name="star" size={16} color={isDisabled ? "#999" : "#FFD700"} />
                <Text style={[styles.rewardPoints, isDisabled && styles.rewardPointsDisabled]}>
                  {reward.points_required} points
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.actionButtons}>
            {inCart && !isDisabled ? (
              <View style={styles.cartActions}>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={(e) => {
                    e.stopPropagation()
                    handleRemoveFromCart(reward)
                  }}
                >
                  <Feather name="minus" size={16} color="#EF4444" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={(e) => {
                    e.stopPropagation()
                    handleAddToCart(reward)
                  }}
                >
                  <Feather name="plus" size={16} color="#10B981" />
                </TouchableOpacity>
              </View>
            ) : !isDisabled ? (
              <TouchableOpacity
                style={styles.addToCartButton}
                onPress={(e) => {
                  e.stopPropagation()
                  handleAddToCart(reward)
                }}
              >
                <Feather name="plus" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            ) : null}
          </View>
        </TouchableOpacity>
      </Animated.View>
    )
  }

  const renderSpecialOfferCard = (offer: SpecialOffer) => (
    <TouchableOpacity key={offer.id} style={styles.featuredOfferCard} activeOpacity={0.7}>
      <View style={styles.offerBadge}>
        <Feather name="zap" size={12} color="white" />
        <Text style={styles.offerBadgeText}>LIMITED</Text>
      </View>
      <View style={styles.featuredImageContainer}>
        <OfferImage imageUrl={offer.image_url ?? undefined} containerStyle={styles.offerImageWrapper} />
      </View>
      <View style={styles.featuredOfferInfo}>
        <Text style={styles.offerCategory}>SPECIAL OFFER</Text>
        <Text style={styles.featuredOfferName}>{offer.title}</Text>
        <View style={styles.featuredPriceContainer}>
          {offer.original_points && <Text style={styles.originalPrice}>{offer.original_points} pts</Text>}
          <Text style={styles.featuredOfferPrice}>{offer.points_required} pts</Text>
        </View>
      </View>
    </TouchableOpacity>
  )

  if (loading && rewards.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading rewards...</Text>
        </View>
      </SafeAreaView>
    )
  }

  if (error && rewards.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.errorContainer}>
          <Feather name="alert-circle" size={48} color="#FF3B30" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchData}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
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

    Alert.alert("Add to Cart", `Add "${reward.title}" to your cart for ${reward.points_required} points?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Add to Cart",
        onPress: () => handleAddToCart(reward),
      },
    ])
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar barStyle="dark-content" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Birthday Banner */}
        <BirthdayBanner />

        {/* Points Status */}
        <Animated.View entering={FadeInDown.duration(500).delay(100)} style={styles.pointsStatus}>
          <View style={styles.pointsCard}>
            <View style={styles.pointsHeader}>
              <View style={styles.pointsIconContainer}>
                <Feather name="star" size={20} color="#FFD700" />
              </View>
              <View style={styles.pointsTextContainer}>
                <Text style={styles.pointsLabel}>Available Points</Text>
                <Text style={styles.pointsValue}>{points.toLocaleString()}</Text>
              </View>
            </View>
            {userStatus && (
              <View style={styles.levelContainer}>
                <View style={styles.levelBadge}>
                  <Feather name="award" size={14} color={colors.primary} />
                  <Text style={styles.levelText}>Level {userStatus.level_name}</Text>
                </View>
                <Text style={styles.levelName}>{userStatus.level_name}</Text>
              </View>
            )}
          </View>
        </Animated.View>

        {/* Special Offers */}
        {specialOffers.length > 0 && (
          <Animated.View entering={FadeInUp.duration(600).delay(300)} style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Special Offers</Text>
              <TouchableOpacity>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.featuredScrollView}
              contentContainerStyle={styles.featuredContainer}
            >
              {specialOffers.map((offer) => renderSpecialOfferCard(offer))}
            </ScrollView>
          </Animated.View>
        )}

        
        {/* All Rewards */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle2}>All Rewards</Text>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => {
              // Toggle sort options
              const sortOptions: SortOption[] = ["none", "points_low_high", "points_high_low", "newest", "popular"]
              const currentIndex = sortOptions.indexOf(sortOption)
              const nextIndex = (currentIndex + 1) % sortOptions.length
              setSortOption(sortOptions[nextIndex])
            }}
          >
            <Feather name="sliders" size={18} color="#555" />
            <Text style={styles.filterText}>
              {sortOption === "none"
                ? "Sort"
                : sortOption === "points_low_high"
                  ? "Price ↑"
                  : sortOption === "points_high_low"
                    ? "Price ↓"
                    : sortOption === "newest"
                      ? "Newest"
                      : "Popular"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <Animated.View entering={FadeInDown.duration(500).delay(400)} style={styles.searchBar}>
          <Feather name="search" size={20} color="#777" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search rewards..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </Animated.View>


        {(sortOption !== "none" || searchQuery.trim()) && (
          <Animated.View entering={FadeInDown.duration(300)} style={styles.activeFiltersContainer}>
            <Text style={styles.activeFiltersTitle}>Active Filters:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.activeFiltersScroll}>
              {sortOption !== "none" && (
                <View style={styles.activeFilterBadge}>
                  <Text style={styles.activeFilterText}>
                    {sortOption === "points_low_high"
                      ? "Price: Low-High"
                      : sortOption === "points_high_low"
                        ? "Price: High-Low"
                        : sortOption === "newest"
                          ? "Newest"
                          : "Popular"}
                  </Text>
                </View>
              )}
              {searchQuery.trim() && (
                <View style={styles.activeFilterBadge}>
                  <Text style={styles.activeFilterText}>"{searchQuery}"</Text>
                </View>
              )}
              <TouchableOpacity style={styles.clearFiltersButton} onPress={resetFilters}>
                <Text style={styles.clearFiltersText}>Clear All</Text>
              </TouchableOpacity>
            </ScrollView>
          </Animated.View>
        )}

        {/* Loading indicator for rewards */}
        {loading && rewards.length > 0 && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.loadingOverlayText}>Updating...</Text>
          </View>
        )}

        <View style={styles.rewardsGrid}>
          {filteredRewards.length > 0 ? (
            filteredRewards.map((reward, index) => renderRewardCard(reward, index))
          ) : (
            <View style={styles.noResultsContainer}>
              <Feather name="search" size={48} color="#999" />
              <Text style={styles.noResultsText}>No rewards match your filters</Text>
              <TouchableOpacity style={styles.resetFiltersButton} onPress={resetFilters}>
                <Text style={styles.resetFiltersButtonText}>Reset Filters</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Cart Button */}
      <TouchableOpacity style={styles.cartButton} onPress={handleCheckoutPress}>
        <Feather name="shopping-cart" size={24} color="#FFFFFF" />
        {totalItems > 0 && (
          <View style={styles.cartBadge}>
            <Text style={styles.cartBadgeText}>{totalItems}</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Reward Detail Modal */}
      <RewardDetailModal
        reward={selectedReward}
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false)
          setSelectedReward(null)
        }}
        onAddToCart={handleAddToCart}
        onRemoveFromCart={handleRemoveFromCart}
        isInCart={selectedReward ? isInCart(selectedReward.id) : false}
        quantity={selectedReward ? getItemQuantity(selectedReward.id) : 0}
        canAfford={selectedReward ? points >= selectedReward.points_required : false}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
    paddingBottom: 0,
    paddingTop: 0,
    ...Platform.select({
      android: { paddingTop: 20 },
    }),
  },
  scrollView: {
    paddingTop: 60,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  pointsStatus: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  pointsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  pointsHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  pointsIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFF9E6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  pointsTextContainer: {
    flex: 1,
  },
  pointsLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6B7280",
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  pointsValue: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111827",
    letterSpacing: -0.5,
  },
  levelContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  levelBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary + "15",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  levelText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.primary,
    marginLeft: 6,
    letterSpacing: 0.3,
  },
  levelName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6B7280",
    letterSpacing: 0.2,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
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
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: "#333",
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#222",
  },
  sectionTitle2: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#222",
    marginTop: 16,
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
  featuredOfferCard: {
    width: width * 0.7,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginRight: 16,
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
    top: 12,
    right: 12,
    backgroundColor: "#EF4444",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 1,
  },
  offerBadgeText: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
    marginLeft: 4,
  },
  featuredImageContainer: {
    width: "100%",
    height: 120,
    backgroundColor: "#F8F9FA",
    position: "relative",
  },
  offerImageWrapper: {
    width: "100%",
    height: "100%",
  },
  featuredOfferInfo: {
    padding: 16,
  },
  offerCategory: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#EF4444",
    marginBottom: 4,
  },
  featuredOfferName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#222",
    marginBottom: 8,
  },
  featuredPriceContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  originalPrice: {
    fontSize: 14,
    color: "#999",
    textDecorationLine: "line-through",
    marginRight: 8,
  },
  featuredOfferPrice: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#EF4444",
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginTop: 10,
    backgroundColor: "#F5F5F5",
  },
  filterText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#555",
    marginLeft: 4,
  },
  activeFiltersContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  activeFiltersTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#555",
    marginBottom: 8,
  },
  activeFiltersScroll: {
    flexDirection: "row",
  },
  activeFilterBadge: {
    backgroundColor: "rgba(59, 130, 246, 0.1)",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  activeFilterText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: "600",
  },
  clearFiltersButton: {
    backgroundColor: "#F5F5F5",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
  },
  clearFiltersText: {
    fontSize: 12,
    color: "#555",
    fontWeight: "600",
  },
  loadingOverlay: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    marginHorizontal: 16,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 8,
    marginBottom: 16,
  },
  loadingOverlayText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#666",
  },
  rewardsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 8,
    paddingBottom: 100,
    justifyContent: "space-between",
  },
  rewardCard: {
    width: width * 0.43,
    marginBottom: 16,
    borderRadius: 22,
    backgroundColor: "#fff",
    shadowColor: "gray",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  rewardCardDisabled: {
    opacity: 0.6,
  },
  rewardCardContent: {
    height: 280,
  },
  rewardCardContentDisabled: {
    backgroundColor: "#F5F5F5",
  },
  rewardImageContainer: {
    width: "100%",
    height: 140,
    position: "relative",
    backgroundColor: "#F8F9FA",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    overflow: "hidden",
  },
  rewardImageWrapper: {
    width: "100%",
    height: "100%",
  },
  // Updated image-related styles
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
  },
  favoriteButton: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  inCartBadge: {
    position: "absolute",
    top: 8,
    right: 48,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#10B981",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  inCartText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
  },
  lowStockBadge: {
    position: "absolute",
    bottom: 8,
    left: 8,
    right: 8,
    backgroundColor: "#F59E0B",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  lowStockText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "bold",
    textAlign: "center",
  },
  disabledOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 5,
  },
  disabledText: {
    fontSize: 10,
    color: "#999",
    fontWeight: "600",
    marginTop: 4,
    textAlign: "center",
  },
  rewardInfo: {
    padding: 12,
    flex: 1,
  },
  rewardName: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#222",
    marginBottom: 4,
  },
  rewardNameDisabled: {
    color: "#999",
  },
  rewardDescription: {
    fontSize: 12,
    color: "#777",
    lineHeight: 16,
  },
  rewardDescriptionDisabled: {
    color: "#BBB",
  },
  pointsContainer: {
    marginTop: "auto",
  },
  pointsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  rewardPoints: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#222",
    marginLeft: 4,
  },
  rewardPointsDisabled: {
    color: "#999",
  },
  actionButtons: {
    position: "absolute",
    bottom: 12,
    right: 12,
    zIndex: 10,
  },
  addToCartButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  cartActions: {
    flexDirection: "row",
    gap: 8,
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FEE2E2",
    justifyContent: "center",
    alignItems: "center",
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#DCFCE7",
    justifyContent: "center",
    alignItems: "center",
  },
  noResultsContainer: {
    width: "100%",
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  noResultsText: {
    fontSize: 16,
    color: "#555",
    marginBottom: 16,
    marginTop: 16,
  },
  resetFiltersButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  resetFiltersButtonText: {
    fontSize: 14,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  cartButton: {
    position: "absolute",
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 100,
  },
  cartBadge: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: "#EF4444",
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  cartBadgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  closeButton: {
    padding: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  modalContent: {
    flex: 1,
  },
  modalImageContainer: {
    width: "100%",
    height: 250,
    backgroundColor: "#FFFFFF",
    position: "relative",
  },
  modalImage: {
    width: "100%",
    height: "100%",
  },
  modalLowStockBadge: {
    position: "absolute",
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: "#F59E0B",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  modalInfo: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    marginTop: 1,
  },
  modalRewardTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
  },
  modalRewardDescription: {
    fontSize: 16,
    color: "#6B7280",
    lineHeight: 24,
    marginBottom: 20,
  },
  modalPointsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  modalPointsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  modalRewardPoints: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginLeft: 8,
  },
  modalCategoryBadge: {
    backgroundColor: colors.primary + "20",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  modalCategoryText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.primary,
  },
  modalWarningContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF3C7",
    borderRadius: 8,
    padding: 16,
    marginTop: 16,
  },
  modalWarningText: {
    fontSize: 14,
    color: "#92400E",
    marginLeft: 12,
    flex: 1,
  },
  modalActions: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  modalCartActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  modalRemoveButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    justifyContent: "center",
  },
  modalRemoveButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#EF4444",
    marginLeft: 8,
  },
  modalQuantityDisplay: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  modalQuantityText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  modalAddButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    justifyContent: "center",
  },
  modalAddButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    marginLeft: 8,
  },
  modalAddToCartButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    justifyContent: "center",
  },
  modalAddToCartButtonText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    marginLeft: 12,
  },
  modalButtonDisabled: {
    backgroundColor: "#D1D5DB",
  },
})

export default RewardsStoreScreen
