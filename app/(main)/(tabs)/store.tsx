"use client"
import BirthdayBanner from "@/components/rewards/BirthdayBanner"
import { HorizontalRewardItem } from "@/components/rewards/HorizontalReward"
import OfferCard from "@/components/rewards/OfferCard"
import RedeemModal from "@/components/rewards/RedeemModal"
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
import { useFocusEffect, useRouter } from "expo-router"
import type React from "react"
import { useCallback, useEffect, useState } from "react"
import {
  ActivityIndicator,
  Image,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

type SortOption = "none" | "points_low_high" | "points_high_low" | "newest" | "popular"

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

const RewardsStoreScreen: React.FC = () => {
  // Cart and user hooks - destructure ALL cart functions like checkout screen
  const {
    addToCart,
    totalItems,
    isInCart,
    getItemQuantity,
    removeOneFromCart,
    removeFromCart,
    updateQuantity,
    refreshCart,
    refreshTrigger, // Add this to force re-renders
  } = useCart()

  const { showSuccess, showError, showInfo } = useNotifications()
  const { points, userId, getUserFirstName } = useUserStore()
  const router = useRouter()

  // State for data
  const [rewards, setRewards] = useState<Reward[]>([])
  const [specialOffers, setSpecialOffers] = useState<SpecialOffer[]>([])
  const [scanHistory, setScanHistory] = useState<ScanHistory[]>([])
  const [purchaseHistory, setPurchaseHistory] = useState<PurchaseHistory[]>([])
  const [userStatus, setUserStatus] = useState<UserStatusWithLevel | null>(null)
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [sortOption, setSortOption] = useState<SortOption>("none")
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState<string>("")

  // Modal states
  const [selectedItem, setSelectedItem] = useState<RewardOrSpecial | null>(null)
  const [modalVisible, setModalVisible] = useState(false)

  // Fetch purchase history
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

  // Main data fetching function
  const fetchData = useCallback(async () => {
    if (!userId) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

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
      setError("Failed to load data. Please try again.")
      showError("Error", "Failed to load data. Please try again.")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [userId, showSuccess, showError])

  // SAME CART HANDLERS AS CHECKOUT SCREEN
  // Handle quantity changes with better state management (same as checkout)
  const handleQuantityChange = useCallback(
    (id: string, change: number) => {
      console.log(`🔄 Store - Changing quantity for item ${id} by ${change}`)
      const currentQuantity = getItemQuantity(id)
      const newQuantity = Math.max(0, currentQuantity + change)

      if (newQuantity === 0) {
        removeFromCart(id)
        console.log(`🗑️ Store - Removed item ${id} from cart (quantity reached 0)`)
      } else {
        updateQuantity(id, newQuantity)
        console.log(`🔄 Store - Updated item ${id} quantity to ${newQuantity}`)
      }
    },
    [getItemQuantity, updateQuantity, removeFromCart],
  )

  // Handle removing one item with logging (same as checkout)
  const handleRemoveOne = useCallback(
    (id: string) => {
      console.log(`➖ Store - Removing one item: ${id}`)
      const currentQuantity = getItemQuantity(id)
      console.log(`Current quantity: ${currentQuantity}`)

      if (currentQuantity > 0) {
        removeOneFromCart(id)
        console.log(`✅ Store - Successfully removed one ${id}`)
      } else {
        console.warn(`⚠️ Store - Attempted to remove item not in cart: ${id}`)
      }
    },
    [removeOneFromCart, getItemQuantity],
  )

  // Handle removing entire item with logging (same as checkout)
  const handleRemoveItem = useCallback(
    (id: string) => {
      console.log(`🗑️ Store - Removing entire item: ${id}`)
      removeFromCart(id)
    },
    [removeFromCart],
  )

  // Refresh handler
  const onRefresh = useCallback(() => {
    setRefreshing(true)
    fetchData()
  }, [fetchData])

  // Modal handlers
  const handleCloseModal = useCallback(() => {
    setModalVisible(false)
    setSelectedItem(null)
  }, [])

  const handleItemPress = useCallback((item: RewardOrSpecial) => {
    setSelectedItem(item)
    setModalVisible(true)
  }, [])

  // Cart handlers - use useCallback to prevent stale closures
  const handleAddToCart = useCallback(
    (reward: Reward) => {
      console.log("🛒 Store - Adding reward to cart:", reward.title)
      if (!userId) {
        showError("Login Required", "Please log in to add rewards to cart.")
        return
      }

      if (points < reward.points_required) {
        showError("Insufficient Points", `You need ${reward.points_required - points} more points to get this reward.`)
        return
      }

      // Create cart item
      const cartItem = {
        id: reward.id,
        title: reward.title,
        description: reward.description || "",
        points_required: reward.points_required,
        category: reward.category || undefined,
        image_url: reward.image_url || undefined,
        item_type: "reward" as const,
      }

      // Add to cart
      addToCart(cartItem)

      // Show success notification
      showSuccess("Added to Cart!", `${reward.title} has been added to your cart.`)
      console.log("🛒 Store - Cart updated successfully")
    },
    [userId, points, addToCart, showError, showSuccess],
  )

  const handleRemoveFromCart = useCallback(
    (reward: Reward) => {
      try {
        console.log("🛒 Store - Removing reward from cart:", reward.id, reward.title)
        handleRemoveOne(reward.id) // Use the same logic as checkout
        showInfo("Removed from Cart", `One ${reward.title} has been removed from your cart.`)
      } catch (error) {
        console.error("Error removing reward from cart:", error)
        showError("Error", "Failed to remove item from cart. Please try again.")
      }
    },
    [handleRemoveOne, showInfo, showError],
  )

  // Unified redeem handler for modal
  const handleItemRedeem = useCallback(
    (item: RewardOrSpecial) => {
      console.log("🛒 Store - Redeeming item:", item.title)
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
        item_type: (isSpecialOffer(item) ? "special_offer" : "reward") as "special_offer" | "reward",
      }

      // Add to cart
      addToCart(cartItem)

      // Show success message
      const itemType = isSpecialOffer(item) ? "Special Offer" : "Reward"
      showSuccess("Added to Cart!", `${itemType} "${item.title}" has been added to your cart.`)

      // Close modal
      setModalVisible(false)
      console.log("🛒 Store - Item redeemed and added to cart successfully")
    },
    [userId, points, addToCart, showError, showSuccess],
  )

  // Reset filters
  const resetFilters = useCallback(() => {
    setSortOption("none")
    setSearchQuery("")
  }, [])

  // ALL HOOKS MUST BE CALLED BEFORE ANY EARLY RETURNS
  // Focus effect to refresh when returning from checkout (SAME AS CHECKOUT)
  useFocusEffect(
    useCallback(() => {
      console.log("🔄 Store screen focused, refreshing cart and data")
      refreshCart() // Refresh cart state
      // Also refresh the store data to ensure everything is in sync
      if (userId) {
        fetchData()
      }
    }, [refreshCart, userId, fetchData]),
  )

  // Search debounce effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
    }, 500)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Initial data fetch
  useEffect(() => {
    if (userId) {
      fetchData()
    }
  }, [userId, fetchData])

  // Add effect to log cart changes for debugging (SAME AS CHECKOUT)
  useEffect(() => {
    console.log("🛒 Store - Cart state updated:", {
      totalItems,
      refreshTrigger,
    })
  }, [totalItems, refreshTrigger, isInCart, getItemQuantity])

  // Filter and sort rewards
  const filteredRewards = rewards
    .filter((reward) => {
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

  // Filter active special offers
  const activeSpecialOffers = specialOffers.filter((offer) => {
    const isExpired = new Date() > new Date(offer.end_date)
    return !isExpired && offer.is_active
  })

  // NOW SAFE TO HAVE EARLY RETURNS AFTER ALL HOOKS
  // Loading state
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

  // Error state
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
        <View style={{ marginBottom: 20 }} />

        {/* Special Offers Section */}
        {activeSpecialOffers.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Special Offers</Text>
              <TouchableOpacity
                onPress={() => router.push({ pathname: "../all_cards/points", params: { tab: "offers" } })}
              >
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.featuredScrollView}
              contentContainerStyle={styles.featuredContainer}
            >
              {activeSpecialOffers.map((offer) => (
                <OfferCard key={offer.id} offer={offer} userPoints={points} onPress={() => handleItemPress(offer)} />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Rewards Section Header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle2}>Rewards</Text>
          <View style={styles.actionsRow}>
            <TouchableOpacity
              onPress={() => router.push({ pathname: "../all_cards/points", params: { tab: "rewards" } })}
            >
              <Text style={styles.seeAllText2}>See All</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.filterButton}
              onPress={() => {
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
        </View>

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Feather name="search" size={20} color="#777" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search rewards..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Active Filters */}
        {(sortOption !== "none" || searchQuery.trim()) && (
          <View style={styles.activeFiltersContainer}>
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
          </View>
        )}

        {/* Rewards List */}
        <View style={styles.rewardsList}>
          {filteredRewards.length > 0 ? (
            filteredRewards.map((reward) => (
              <HorizontalRewardItem
                key={reward.id}
                reward={reward}
                userPoints={points}
                isInCart={isInCart(reward.id)}
                cartQuantity={getItemQuantity(reward.id)}
                onPress={() => handleItemPress(reward)}
                onAddToCart={() => handleAddToCart(reward)}
                onRemoveFromCart={() => handleRemoveFromCart(reward)}
              />
            ))
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

      {/* Floating Cart Button */}
      <TouchableOpacity style={styles.cartButton} onPress={() => router.push("../store/Checkout")}>
        <Feather name="shopping-cart" size={24} color="#FFFFFF" />
        {totalItems > 0 && (
          <View style={styles.cartBadge}>
            <Text style={styles.cartBadgeText}>{totalItems}</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Redeem Modal */}
      <RedeemModal visible={modalVisible} item={selectedItem} onClose={handleCloseModal} onRedeem={handleItemRedeem} userPoints={points}/>
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
      ios: { paddingTop: 40 },
    }),
  },
  scrollView: {
    paddingTop: 20,
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
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
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
  seeAllText2: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary,
    marginTop: 10,
  },
  featuredScrollView: {
    marginBottom: 8,
  },
  featuredContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
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
  rewardsList: {
    flexDirection: "column",
    paddingBottom: 100,
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
  // Additional styles for RewardImage component
  fallbackIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
  },
  fullImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 8,
    overflow: "hidden",
    position: "relative",
  },
  imageLoadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    zIndex: 1,
  },
  fullImage: {
    width: "100%",
    height: "100%",
  },
})

export default RewardsStoreScreen
