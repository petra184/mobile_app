"use client"

import React from "react"
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
  Pressable,
  Platform,
} from "react-native"
import { colors } from "@/constants/colors"

const { height, width } = Dimensions.get("window")

export type SortOption = "newest" | "price_low_high" | "price_high_low" | "none"
export type GenderFilter = "all" | "men" | "women" | "coed"

interface FilterDrawerProps {
  isVisible: boolean
  onClose: () => void
  sortOption: SortOption
  setSortOption: (option: SortOption) => void
  genderFilter: GenderFilter
  setGenderFilter: (filter: GenderFilter) => void
  priceRange: [number, number]
  setPriceRange: (range: [number, number]) => void
  maxPrice: number
  applyFilters: () => void
  resetFilters: () => void
}

const FilterDrawer: React.FC<FilterDrawerProps> = ({
  isVisible,
  onClose,
  sortOption,
  setSortOption,
  genderFilter,
  setGenderFilter,
  priceRange,
  setPriceRange,
  maxPrice,
  applyFilters,
  resetFilters,
}) => {
  const translateX = React.useRef(new Animated.Value(width)).current

  React.useEffect(() => {
    if (isVisible) {
      Animated.timing(translateX, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start()
    } else {
      Animated.timing(translateX, {
        toValue: width,
        duration: 300,
        useNativeDriver: true,
      }).start()
    }
  }, [isVisible, translateX])

  if (!isVisible) return null

  const handlePriceRangeChange = (min: number, max: number) => {
    setPriceRange([min, max])
  }

  // Helper function to check if a price range is selected
  const isPriceRangeSelected = (min: number, max: number) => {
    return priceRange[0] === min && priceRange[1] === max
  }

  // Define price range options
  const priceRangeOptions = [
    { min: 0, max: maxPrice, label: "All Prices" },
    { min: 0, max: 25, label: "Under $25" },
    { min: 25, max: 50, label: "$25-$50" },
    { min: 50, max: 100, label: "$50-$100" },
    { min: 100, max: maxPrice, label: "$100+" },
  ]

  return (
    <View style={styles.container}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <Animated.View style={[styles.drawer, { transform: [{ translateX }] }]}>
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Sort By Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Sort By</Text>
            <TouchableOpacity
              style={[styles.option, sortOption === "newest" && styles.selectedOption]}
              onPress={() => setSortOption(sortOption === "newest" ? "none" : "newest")}
            >
              <Text style={[styles.optionText, sortOption === "newest" && styles.selectedOptionText]}>
                Newest First
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.option, sortOption === "price_low_high" && styles.selectedOption]}
              onPress={() => setSortOption(sortOption === "price_low_high" ? "none" : "price_low_high")}
            >
              <Text style={[styles.optionText, sortOption === "price_low_high" && styles.selectedOptionText]}>
                Price: Low to High
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.option, sortOption === "price_high_low" && styles.selectedOption]}
              onPress={() => setSortOption(sortOption === "price_high_low" ? "none" : "price_high_low")}
            >
              <Text style={[styles.optionText, sortOption === "price_high_low" && styles.selectedOptionText]}>
                Price: High to Low
              </Text>
            </TouchableOpacity>
          </View>

          {/* Gender Filter Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Gender</Text>
            <TouchableOpacity
              style={[styles.option, genderFilter === "all" && styles.selectedOption]}
              onPress={() => setGenderFilter(genderFilter === "all" ? "all" : "all")} // Keep "all" as default
            >
              <Text style={[styles.optionText, genderFilter === "all" && styles.selectedOptionText]}>All</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.option, genderFilter === "men" && styles.selectedOption]}
              onPress={() => setGenderFilter(genderFilter === "men" ? "all" : "men")}
            >
              <Text style={[styles.optionText, genderFilter === "men" && styles.selectedOptionText]}>Men's</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.option, genderFilter === "women" && styles.selectedOption]}
              onPress={() => setGenderFilter(genderFilter === "women" ? "all" : "women")}
            >
              <Text style={[styles.optionText, genderFilter === "women" && styles.selectedOptionText]}>Women's</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.option, genderFilter === "coed" && styles.selectedOption]}
              onPress={() => setGenderFilter(genderFilter === "coed" ? "all" : "coed")}
            >
              <Text style={[styles.optionText, genderFilter === "coed" && styles.selectedOptionText]}>Co-ed</Text>
            </TouchableOpacity>
          </View>

          {/* Price Range Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Price Range</Text>
            <View style={styles.priceRangeContainer}>
              <Text style={styles.priceRangeText}>
                ${priceRange[0]} - ${priceRange[1]}
              </Text>
            </View>
            <View style={styles.priceButtonsContainer}>
              {priceRangeOptions.map((option, index) => {
                const isSelected = isPriceRangeSelected(option.min, option.max)
                return (
                  <TouchableOpacity
                    key={index}
                    style={[styles.priceButton, isSelected && styles.selectedPriceButton]}
                    onPress={() => {
                      if (isPriceRangeSelected(option.min, option.max)) {
                        // If already selected, reset to full range
                        handlePriceRangeChange(0, maxPrice)
                      } else {
                        handlePriceRangeChange(option.min, option.max)
                      }
                    }}
                  >
                    <Text style={[styles.priceButtonText, isSelected && styles.selectedPriceButtonText]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                )
              })}
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.resetButton} onPress={resetFilters}>
            <Text style={styles.resetButtonText}>Reset</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.applyButton} onPress={applyFilters}>
            <Text style={styles.applyButtonText}>Apply Filters</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    ...Platform.select({
      ios: {
        marginTop: 80,
      },
      android: {
        marginTop: 100,
      },
    }),
  },
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  drawer: {
    position: "absolute",
    top: 20,
    right: 0,
    width: width * 0.8,
    height: "100%",
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#222",
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#222",
    marginBottom: 12,
  },
  option: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: "#F5F5F5",
  },
  selectedOption: {
    backgroundColor: "rgba(59, 130, 246, 0.1)",
    borderWidth: 1,
    borderColor: colors.primary,
  },
  optionText: {
    fontSize: 16,
    color: "#555",
  },
  selectedOptionText: {
    color: colors.primary,
    fontWeight: "600",
  },
  priceRangeContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  priceRangeText: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.primary,
  },
  priceButtonsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  priceButton: {
    width: "48%",
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    marginBottom: 8,
    alignItems: "center",
  },
  selectedPriceButton: {
    backgroundColor: "rgba(59, 130, 246, 0.1)",
    borderWidth: 1,
    borderColor: colors.primary,
  },
  priceButtonText: {
    fontSize: 14,
    color: "#555",
  },
  selectedPriceButtonText: {
    color: colors.primary,
    fontWeight: "600",
  },
  footer: {
    flexDirection: "row",
    padding: 16,
    marginBottom: 20,
    borderTopWidth: 1,
    borderTopColor: "#EEEEEE",
  },
  resetButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#DDDDDD",
    borderRadius: 8,
    marginRight: 8,
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#555",
  },
  applyButton: {
    flex: 2,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
})

export default FilterDrawer
