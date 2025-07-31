import { colors } from "@/constants/Colors"
import type { BirthdayPackage } from "@/types/updated_types"
import { Feather } from "@expo/vector-icons"
import { Image } from "expo-image"
import { LinearGradient } from "expo-linear-gradient"
import { StyleSheet, Text, TouchableOpacity, View } from "react-native"

interface PackageCardProps {
  package: BirthdayPackage
  onSelect: (packageId: string) => void
}

export default function PackageCard({ package: pkg, onSelect }: PackageCardProps) {
  return (
    <View style={styles.cardContainer}>
      <View style={styles.card}>
        <View style={styles.imagec}>
        {pkg.image ? (
          <Image source={{ uri: pkg.image }} style={styles.image} contentFit="cover" />
        ) : (
          <Image source={require("@/IMAGES/MAIN_LOGO.png")} style={styles.image} contentFit="cover" />
        )}
        </View>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.name}>{pkg.name}</Text>
            <Text style={styles.price}>${pkg.price.toFixed(2)}</Text>
          </View>

          <Text style={styles.description}>{pkg.description}</Text>

          <Text style={styles.featuresTitle}>Package Includes:</Text>
          <View style={styles.featuresList}>
            {pkg.features.map((feature, index) => (
              <View key={index} style={styles.featureItem}>
                <Feather name="check" size={16} color={colors.primary} />
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity activeOpacity={0.8} onPress={() => onSelect(pkg.id)} style={styles.reserveButtonContainer}>
            <LinearGradient
              colors={[colors.primary, colors.accent]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.reserveButton}
            >
              <Text style={styles.reserveButtonText}>Reserve Now</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  cardContainer: {
    marginHorizontal: 16,
    marginVertical: 8,
    backgroundColor:"transparent",
    // Shadow properties for the container
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    // Remove any background color from here
  },
  card: {
    backgroundColor: "rgba(59, 130, 246, 0.1)", // White background for the actual card
    borderRadius: 16,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: 200,
  },
  imagec:{
    borderBottomColor:"gray",
    borderBottomWidth:1,
    backgroundColor:"white"
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  name: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
    flex: 1,
  },
  price: {
    fontSize: 20,
    fontWeight: "700",
    color: "black",
  },
  description: {
    fontSize: 14,
    color: "gray",
    marginBottom: 16,
    lineHeight: 20,
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
    color: colors.text,
  },
  featuresList: {
    marginBottom: 20,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  featureText: {
    fontSize: 14,
    color: colors.primaryLight,
    marginLeft: 8,
    flex: 1,
  },
  reserveButtonContainer: {
    borderRadius: 38,
    overflow: "hidden", // This ensures the gradient respects the border radius
  },
  reserveButton: {
    paddingVertical: 14,
    alignItems: "center",
    width: "100%",
  },
  reserveButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
})
