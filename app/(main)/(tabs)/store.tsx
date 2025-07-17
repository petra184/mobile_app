"use client"
import type React from "react"
import { useState, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  TextInput,
  Platform,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Dimensions,
} from "react-native"
import { Feather } from "@expo/vector-icons"
import { SafeAreaView } from "react-native-safe-area-context"
import BirthdayBanner from "@/components/rewards/BirthdayBanner"
import SpecialOfferCard from "@/components/rewards/SpecialOfferCard"
import { RewardCard, RewardDetailModal } from "@/components/rewards/rewards"
import { colors } from "@/constants/colors"
import { useRouter } from "expo-router"
import { useUserStore } from "@/hooks/userStore"
import { useNotifications } from "@/context/notification-context"
import { useCart } from "@/context/cart-context"
import {
  fetchRewards,
  fetchSpecialOffers,
  fetchUserAchievements,
  fetchUserStatus
} from "@/app/actions/points"
import type { Reward, SpecialOffer, UserAchievement, UserStatusWithLevel, RewardCardData } from "@/types/updated_types"
const { width } = Dimensions.get("window")

type SortOption = "none" | "points_low_high" | "points_high_low" | "newest" | "popular"

const RewardsStoreScreen: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [sortOption, setSortOption] = useState<SortOption>("none")
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState<string>("")
  const [refreshing, setRefreshing] = useState(false)
  const [selectedReward, setSelectedReward] = useState<RewardCardData | null>(null)
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

  const handleRewardPress = (reward: RewardCardData) => {
    setSelectedReward(reward)
    setModalVisible(true)
  }

  const handleAddToCart = (reward: RewardCardData) => {
    if (!userId) {
      Alert.alert("Login Required", "Please log in to add rewards to cart.")
      return
    }
    if (points < reward.points_required) {
      Alert.alert("Insufficient Points", `You need ${reward.points_required - points} more points to get this reward.`)
      return
    }

    addToCart({
      id: reward.id,
      title: reward.title,
      description: reward.description || "",
      points_required: reward.points_required,
      category: reward.category || undefined,
      image_url: reward.image_url || undefined,
    })

    showSuccess("Added to Cart!", `${reward.title} has been added to your cart.`)
    setTimeout(() => {
      router.push("../store/Checkout")
    }, 1000)
  }

  const handleRemoveFromCart = (reward: RewardCardData) => {
    removeOneFromCart(reward.id)
    showInfo("Removed from Cart", `One ${reward.title} has been removed from your cart.`)
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

    showSuccess("Offer Redeemed!", `${offer.title} has been redeemed successfully!`)
    fetchData()
  }

  const resetFilters = () => {
    setSortOption("none")
    setSearchQuery("")
  }

  const handleCheckoutPress = () => {
    router.push({
      pathname: "../store/Checkout",
      params: {
        totalItems: totalItems.toString(),
        userPoints: points.toString(),
        timestamp: Date.now().toString(),
      },
    })
  }

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

  const activeSpecialOffers = specialOffers.filter((offer) => {
    const isExpired = new Date() > new Date(offer.end_date)
    return !isExpired && offer.is_active
  })

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar barStyle="dark-content" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <BirthdayBanner />

        {activeSpecialOffers.length > 0 && (
          <View style={styles.section}>
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
              {activeSpecialOffers.map((offer) => (
                <SpecialOfferCard
                  key={offer.id}
                  offer={offer}
                  userPoints={points}
                  onRedeem={handleSpecialOfferRedeem}
                />
              ))}
            </ScrollView>
          </View>
        )}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle2}>All Rewards</Text>
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

        {loading && rewards.length > 0 && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.loadingOverlayText}>Updating...</Text>
          </View>
        )}

        <View style={styles.rewardsGrid}>
          {filteredRewards.length > 0 ? (
           filteredRewards.map((reward) => {
        const normalizedReward = {
          ...reward,
          category: reward.category ?? undefined,
          image_url: reward.image_url ?? undefined,
          stock_quantity: reward.stock_quantity ?? 0,
          is_sold: reward.is_sold ?? false,
        };

        return (
          <RewardCard
            key={reward.id}
            reward={normalizedReward}
            userPoints={points}
            isInCart={isInCart(reward.id)}
            cartQuantity={getItemQuantity(reward.id)}
            onPress={handleRewardPress}
            onAddToCart={handleAddToCart}
            onRemoveFromCart={handleRemoveFromCart}
            size="medium"
            showActions={true}
          />
        );
      })
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

      <TouchableOpacity style={styles.cartButton} onPress={handleCheckoutPress}>
        <Feather name="shopping-cart" size={24} color="#FFFFFF" />
        {totalItems > 0 && (
          <View style={styles.cartBadge}>
            <Text style={styles.cartBadgeText}>{totalItems}</Text>
          </View>
        )}
      </TouchableOpacity>

      <RewardDetailModal
        reward={selectedReward}
        visible={modalVisible}
        userPoints={points}
        isInCart={selectedReward ? isInCart(selectedReward.id) : false}
        cartQuantity={selectedReward ? getItemQuantity(selectedReward.id) : 0}
        onClose={() => {
          setModalVisible(false)
          setSelectedReward(null)
        }}
        onAddToCart={handleAddToCart}
        onRemoveFromCart={handleRemoveFromCart}
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
})

export default RewardsStoreScreen
