"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  TextInput,
  Platform,
  ActivityIndicator,
} from "react-native"
import { Feather } from "@expo/vector-icons"
import { SafeAreaView } from "react-native-safe-area-context"
import BirthdayBanner from "@/components/rewards/BirthdayBanner"
import { colors } from "@/constants/colors"
import { useRouter } from "expo-router"
import { useCart } from "@/context/cart-context"
import { useNotifications } from "@/context/notification-context"
import FilterDrawer, { type SortOption, type GenderFilter } from "@/components/rewards/Filter"
import type { Database } from "@/types/supabase"
// Import the new actions and hooks
import { useStoreProducts, useFeaturedProducts, useProductCategories, usePriceRange } from "@/hooks/buyData"
import type { ProductFilters, SortOptions } from "@/app/actions/store"

const { width } = Dimensions.get("window")

type StoreProduct = Database["public"]["Tables"]["store_products"]["Row"]

export interface Product {
  id: string
  name: string
  price: number
  points?: number | null
  category: string | null
  image: string | null
  isFavorite: boolean
  description?: string | null
  sizes?: string[]
  material?: string
  color?: string
  inStock?: boolean
  created_at?: string | null
  gender?: string
  inventory: number
  is_active?: boolean | null
  is_new?: boolean | null
  discount_percentage?: number | null
}

type TeamCategory = "all" | "men" | "women" | "coed"

const TeamStoreScreen: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<string>("all")
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [isFilterDrawerVisible, setIsFilterDrawerVisible] = useState(false)
  const [sortOption, setSortOption] = useState<SortOption>("none")
  const [genderFilter, setGenderFilter] = useState<GenderFilter>("all")
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100])
  const [selectedTeam, setSelectedTeam] = useState<TeamCategory>("all")
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState<string>("")

  const router = useRouter()
  const { addToCart } = useCart()
  const { showNotification } = useNotifications()

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
    }, 500) // 500ms delay

    return () => clearTimeout(timer)
  }, [searchQuery])

  // Create filters object for the hook
  const filters: ProductFilters = {
    category: activeCategory === "all" ? undefined : activeCategory,
    minPrice: priceRange[0],
    maxPrice: priceRange[1],
    searchQuery: debouncedSearchQuery.trim() || undefined,
    inStock: true, // Only show in-stock items
    // Add team filtering logic here if your backend supports it
    // team: selectedTeam === "all" ? undefined : selectedTeam,
  }

  // Create sort options for the hook
  const sortOptions: SortOptions | undefined =
    sortOption === "newest"
      ? { field: "created_at", ascending: false }
      : sortOption === "price_low_high"
        ? { field: "price", ascending: true }
        : sortOption === "price_high_low"
          ? { field: "price", ascending: false }
          : undefined

  // Use the custom hooks to fetch data
  const { products: rawProducts, loading, error, refetch } = useStoreProducts(filters, sortOptions)
  const { products: featuredProducts, loading: featuredLoading } = useFeaturedProducts(2)
  const { categories } = useProductCategories()
  const { priceRange: dbPriceRange, loading: priceLoading } = usePriceRange()

  // Transform database products to our Product interface and filter by team
  const products: Product[] = rawProducts
    .map((product: StoreProduct) => ({
      id: product.id,
      name: product.name,
      price: product.price,
      points: product.points,
      category: product.category,
      image: product.image_url,
      isFavorite: favorites.has(product.id),
      description: product.description,
      created_at: product.created_at,
      inventory: product.inventory,
      is_active: product.is_active,
      is_new: product.is_new,
      discount_percentage: product.discount_percentage,
      inStock: product.inventory > 0,
      gender: "unisex", // Use actual gender from product
    }))
    .filter((product) => {
      if (selectedTeam === "all") return true
      if (selectedTeam === "coed") return product.gender === "unisex" || product.gender === "coed"
      return product.gender === selectedTeam
    })

  const transformedFeaturedProducts: Product[] = featuredProducts.map((product: StoreProduct) => ({
    id: product.id,
    name: product.name,
    price: product.price,
    points: product.points,
    category: product.category,
    image: product.image_url,
    isFavorite: favorites.has(product.id),
    description: product.description,
    created_at: product.created_at,
    inventory: product.inventory,
    is_active: product.is_active,
    is_new: product.is_new,
    discount_percentage: product.discount_percentage,
    inStock: product.inventory > 0,
    gender: "unisex",
  }))

  // Update price range when database price range loads
  useEffect(() => {
    if (!priceLoading && dbPriceRange) {
      setPriceRange([dbPriceRange.min, dbPriceRange.max])
    }
  }, [dbPriceRange, priceLoading])

  const maxPrice = dbPriceRange?.max || 100

  const toggleFavorite = async (productId: string) => {
    // In a real app, you'd save this to user preferences in the database
    setFavorites((prev) => {
      const newFavorites = new Set(prev)
      if (newFavorites.has(productId)) {
        newFavorites.delete(productId)
      } else {
        newFavorites.add(productId)
      }
      return newFavorites
    })
  }

  const handleProductPress = (product: Product) => {
    router.push({
      pathname: "../all_cards/product_details",
      params: { id: product.id },
    })
  }

  const handleAddToCart = (product: Product) => {
    if (!product.inStock) {
      showNotification("Product is out of stock")
      return
    }

    addToCart(product)
    showNotification(`${product.name} added to cart`)
  }

  const toggleFilterDrawer = () => {
    setIsFilterDrawerVisible(!isFilterDrawerVisible)
  }

  const applyFilters = () => {
    setIsFilterDrawerVisible(false)
  }

  const resetFilters = () => {
    setSortOption("none")
    setGenderFilter("all")
    setPriceRange([0, maxPrice])
    setActiveCategory("all")
    setSelectedTeam("all")
    setSearchQuery("")
  }

  const renderProductCard = (product: Product, index: number) => {
    const isFavorite = favorites.has(product.id)
    const discountedPrice = product.discount_percentage
      ? product.price * (1 - product.discount_percentage / 100)
      : product.price

    return (
      <TouchableOpacity
        key={product.id}
        style={[styles.productCard, { marginHorizontal: 8 }]}
        onPress={() => handleProductPress(product)}
        activeOpacity={0.7}
      >
        <View style={styles.productImageContainer}>
          <Image
            source={{ uri: product.image || "/placeholder.svg?height=150&width=150" }}
            style={styles.productImage}
            resizeMode="cover"
          />
          {product.discount_percentage && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>{product.discount_percentage}% OFF</Text>
            </View>
          )}
          {product.is_new && (
            <View style={styles.newBadge}>
              <Text style={styles.newText}>NEW</Text>
            </View>
          )}
          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={(e) => {
              e.stopPropagation()
              toggleFavorite(product.id)
            }}
          >
            <Feather
              name="heart"
              size={20}
              color={isFavorite ? "#FF3B30" : "#FFFFFF"}
              style={{ opacity: isFavorite ? 1 : 0.8 }}
            />
          </TouchableOpacity>
          {!product.inStock && (
            <View style={styles.outOfStockOverlay}>
              <Text style={styles.outOfStockText}>Out of Stock</Text>
            </View>
          )}
        </View>

        <View style={styles.productInfo}>
          <Text style={styles.productCategory}>{product.category || "General"}</Text>
          <Text style={styles.productName} numberOfLines={1} ellipsizeMode="tail">
            {product.name}
          </Text>
          <View style={styles.priceContainer}>
            {product.discount_percentage ? (
              <View style={styles.priceRow}>
                <Text style={styles.originalPrice}>${product.price.toFixed(2)}</Text>
                <Text style={styles.productPrice}>${discountedPrice.toFixed(2)}</Text>
              </View>
            ) : (
              <Text style={styles.productPrice}>${product.price.toFixed(2)}</Text>
            )}
            {product.points && (
              <Text style={styles.productPoints} numberOfLines={1}>
                or {product.points} pts
              </Text>
            )}
          </View>
        </View>

        <TouchableOpacity
          style={[styles.addToCartButton, !product.inStock && styles.disabledButton]}
          onPress={(e) => {
            e.stopPropagation()
            handleAddToCart(product)
          }}
          disabled={!product.inStock}
        >
          <Feather name="plus" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </TouchableOpacity>
    )
  }

  if (loading && products.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading products...</Text>
        </View>
      </SafeAreaView>
    )
  }

  if (error && products.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.errorContainer}>
          <Feather name="alert-circle" size={48} color="#FF3B30" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={refetch}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar barStyle="dark-content" />
      <ScrollView showsVerticalScrollIndicator={false} style={styles.c2}>
        {/* Promo Banner */}
        <BirthdayBanner />

        {/* Team Selector */}
        <View style={styles.teamSelector}>
          <Text style={styles.selectorTitle}>Select Team</Text>
          <View style={styles.teamButtons}>
            {(["all", "men", "women", "coed"] as TeamCategory[]).map((team) => (
              <TouchableOpacity
                key={team}
                style={[styles.teamButton, selectedTeam === team && styles.activeTeamButton]}
                onPress={() => setSelectedTeam(team)}
              >
                <Text style={[styles.teamButtonText, selectedTeam === team && styles.activeTeamButtonText]}>
                  {team === "all"
                    ? "All Teams"
                    : team === "coed"
                      ? "Co-ed"
                      : team.charAt(0).toUpperCase() + team.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Categories Filter */}
        {/* {categories.length > 0 && (
          <View style={styles.categoryFilter}>
            <TouchableOpacity
              style={[styles.categoryButton, activeCategory === "all" && styles.activeCategoryButton]}
              onPress={() => setActiveCategory("all")}
            >
              <Text style={[styles.categoryButtonText, activeCategory === "all" && styles.activeCategoryButtonText]}>
                All
              </Text>
            </TouchableOpacity>
            {categories.slice(0, 3).map((category) => (
              <TouchableOpacity
                key={category}
                style={[styles.categoryButton, activeCategory === category && styles.activeCategoryButton]}
                onPress={() => setActiveCategory(category)}
              >
                <Text
                  style={[styles.categoryButtonText, activeCategory === category && styles.activeCategoryButtonText]}
                >
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )} */}

        {/* Featured Items */}
        {!featuredLoading && transformedFeaturedProducts.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Featured Items</Text>
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
              {transformedFeaturedProducts.map((product) => (
                <TouchableOpacity
                  key={product.id}
                  style={styles.featuredProductCard}
                  onPress={() => handleProductPress(product)}
                  activeOpacity={0.7}
                >
                  <View style={styles.featuredImageContainer}>
                    <Image
                      source={{ uri: product.image || "/placeholder.svg?height=180&width=300" }}
                      style={styles.featuredProductImage}
                      resizeMode="cover"
                    />
                  </View>
                  <View style={styles.featuredProductInfo}>
                    <Text style={styles.productCategory}>{product.category || "General"}</Text>
                    <Text style={styles.featuredProductName}>{product.name}</Text>
                    <View style={styles.featuredPriceContainer}>
                      <Text style={styles.featuredProductPrice}>${product.price.toFixed(2)}</Text>
                      {product.points && <Text style={styles.productPoints}>or {product.points} pts</Text>}
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.featuredCartButton}
                    onPress={(e) => {
                      e.stopPropagation()
                      handleAddToCart(product)
                    }}
                  >
                    <Feather name="shopping-cart" size={20} color="#FFFFFF" />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </>
        )}

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Feather name="search" size={20} color="#777" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products or sports..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* All Products */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle2}>All Products</Text>
          <TouchableOpacity style={styles.filterButton} onPress={toggleFilterDrawer}>
            <Feather name="sliders" size={18} color="#555" />
            <Text style={styles.filterText}>Filter</Text>
          </TouchableOpacity>
        </View>

        {/* Active Filters Display */}
        {(sortOption !== "none" ||
          genderFilter !== "all" ||
          priceRange[0] > 0 ||
          priceRange[1] < maxPrice ||
          activeCategory !== "all" ||
          selectedTeam !== "all") && (
          <View style={styles.activeFiltersContainer}>
            <Text style={styles.activeFiltersTitle}>Active Filters:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.activeFiltersScroll}>
              {sortOption !== "none" && (
                <View style={styles.activeFilterBadge}>
                  <Text style={styles.activeFilterText}>
                    {sortOption === "newest"
                      ? "Newest"
                      : sortOption === "price_low_high"
                        ? "Price: Low-High"
                        : "Price: High-Low"}
                  </Text>
                </View>
              )}

              {activeCategory !== "all" && (
                <View style={styles.activeFilterBadge}>
                  <Text style={styles.activeFilterText}>{activeCategory}</Text>
                </View>
              )}

              {genderFilter !== "all" && (
                <View style={styles.activeFilterBadge}>
                  <Text style={styles.activeFilterText}>
                    {genderFilter === "men" ? "Men's" : genderFilter === "women" ? "Women's" : "Co-ed"}
                  </Text>
                </View>
              )}

              {(priceRange[0] > 0 || priceRange[1] < maxPrice) && (
                <View style={styles.activeFilterBadge}>
                  <Text style={styles.activeFilterText}>
                    ${priceRange[0]} - ${priceRange[1]}
                  </Text>
                </View>
              )}

              {selectedTeam !== "all" && (
                <View style={styles.activeFilterBadge}>
                  <Text style={styles.activeFilterText}>
                    {selectedTeam === "coed" ? "Co-ed" : selectedTeam.charAt(0).toUpperCase() + selectedTeam.slice(1)}{" "}
                    Team
                  </Text>
                </View>
              )}

              <TouchableOpacity style={styles.clearFiltersButton} onPress={resetFilters}>
                <Text style={styles.clearFiltersText}>Clear All</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        )}

        {/* Loading indicator for products */}
        {loading && products.length > 0 && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.loadingOverlayText}>Updating...</Text>
          </View>
        )}

        <View style={styles.productsGrid}>
          {products.length > 0 ? (
            products.map((product, index) => renderProductCard(product, index))
          ) : (
            <View style={styles.noResultsContainer}>
              <Feather name="search" size={48} color="#999" />
              <Text style={styles.noResultsText}>No products match your filters</Text>
              <TouchableOpacity style={styles.resetFiltersButton} onPress={resetFilters}>
                <Text style={styles.resetFiltersButtonText}>Reset Filters</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Cart Button */}
      <TouchableOpacity style={styles.cartButton} onPress={() => router.push("../checkout/checkout")}>
        <Feather name="shopping-cart" size={24} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Filter Drawer */}
      <FilterDrawer
        isVisible={isFilterDrawerVisible}
        onClose={() => setIsFilterDrawerVisible(false)}
        sortOption={sortOption}
        setSortOption={setSortOption}
        genderFilter={genderFilter}
        setGenderFilter={setGenderFilter}
        priceRange={priceRange}
        setPriceRange={setPriceRange}
        maxPrice={maxPrice}
        applyFilters={applyFilters}
        resetFilters={resetFilters}
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
  c2: {
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
  categoryFilter: {
    flexDirection: "row",
    marginHorizontal: 10,
    marginBottom: 5,
    borderRadius: 12,
    backgroundColor: colors.card,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 8,
  },
  activeCategoryButton: {
    backgroundColor: "rgba(59, 130, 246, 0.1)",
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.text,
  },
  activeCategoryButtonText: {
    color: colors.primary,
    fontWeight: "600",
  },
  storeTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#222",
    marginTop: 4,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginHorizontal: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    ...Platform.select({
      ios: {
        paddingVertical: 12,
      },
      android: {
        paddingVertical: 2,
      },
    }),
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: "#333",
  },
  searchText: {
    marginLeft: 8,
    fontSize: 16,
    color: "#999",
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
    marginBottom: 24,
  },
  featuredContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  featuredProductCard: {
    width: width * 0.75,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginRight: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  featuredImageContainer: {
    width: "100%",
    height: 180,
  },
  featuredProductImage: {
    width: "100%",
    height: "100%",
  },
  featuredProductInfo: {
    padding: 16,
    height: 100,
  },
  featuredProductName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#222",
    marginTop: 4,
  },
  featuredPriceContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  featuredProductPrice: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#222",
  },
  featuredCartButton: {
    position: "absolute",
    bottom: 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
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
  productsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 8,
    paddingBottom: 24,
    justifyContent: "space-between",
  },
  productCard: {
    width: width * 0.43,
    marginBottom: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    position: "relative",
    height: 280,
  },
  productImageContainer: {
    width: "100%",
    height: 150,
    position: "relative",
  },
  productImage: {
    width: "100%",
    height: "100%",
  },
  discountBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "#FF3B30",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  discountText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "bold",
  },
  newBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "#34C759",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  newText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "bold",
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
  outOfStockOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  outOfStockText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
  },
  productInfo: {
    padding: 12,
    height: 100,
  },
  productCategory: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#673AB7",
    marginBottom: 4,
  },
  productName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#222",
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: "column",
    alignItems: "flex-start",
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  originalPrice: {
    fontSize: 14,
    color: "#999",
    textDecorationLine: "line-through",
    marginRight: 8,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#222",
    marginBottom: 4,
  },
  productPoints: {
    fontSize: 12,
    color: "#777",
  },
  addToCartButton: {
    position: "absolute",
    bottom: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  disabledButton: {
    backgroundColor: "#999",
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
  teamSelector: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  selectorTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#222",
    marginBottom: 12,
  },
  teamButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  teamButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F5F5F5",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  activeTeamButton: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  teamButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#666",
  },
  activeTeamButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
})

export default TeamStoreScreen
