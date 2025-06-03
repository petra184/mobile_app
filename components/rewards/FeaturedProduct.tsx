// import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from "react-native"
// import { Image } from "expo-image"
// import { Feather } from "@expo/vector-icons"
// import type { Product } from "@/types"
// import { useCart } from "@/context/cart-context"
// import { useNotification } from "@/context/notification-context"
// import { colors } from "@/constants/colors"

// interface FeaturedProductProps {
//   product: Product
//   onPress: () => void
// }

// const { width } = Dimensions.get("window")
// const cardWidth = width * 0.7

// export default function FeaturedProduct({ product, onPress }: FeaturedProductProps) {
//   const { addToCart } = useCart()
//   const { showNotification } = useNotification()

//   const handleAddToCart = () => {
//     // Convert the product to the format expected by addToCart
//     const cartProduct = {
//       ...product,
//       price: product.cashPrice, // Map cashPrice to price
//       category: product.sport || "Unknown", // Use sport as category or default to "Unknown"
//       isFavorite: false, // Default value for isFavorite
//     }

//     addToCart(cartProduct)
//     showNotification(`${product.name} added to cart`)
//   }

//   return (
//     <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.9}>
//       <Image source={{ uri: product.image }} style={styles.image} contentFit="cover" />

//       <View style={styles.content}>
//         <View style={styles.textContainer}>
//           <Text style={styles.sport}>{product.sport.toUpperCase()}</Text>
//           <Text style={styles.name}>{product.name}</Text>
//           <View style={styles.priceContainer}>
//             <Text style={styles.cashPrice}>${product.cashPrice.toFixed(2)}</Text>
//             <Text style={styles.pointsPrice}> or {product.pointsPrice} pts</Text>
//           </View>
//         </View>

//         <TouchableOpacity style={styles.addButton} onPress={handleAddToCart}>
//           <Feather name="shopping-bag" size={18} color="#FFFFFF" />
//         </TouchableOpacity>
//       </View>
//     </TouchableOpacity>
//   )
// }

// const styles = StyleSheet.create({
//   container: {
//     width: cardWidth,
//     height: 280,
//     borderRadius: 16,
//     backgroundColor: colors.card,
//     marginRight: 16,
//     overflow: "hidden",
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 8,
//     elevation: 4,
//   },
//   image: {
//     width: "100%",
//     height: 180,
//   },
//   content: {
//     flex: 1,
//     padding: 16,
//     flexDirection: "row",
//   },
//   textContainer: {
//     flex: 1,
//   },
//   sport: {
//     fontSize: 12,
//     color: colors.primary,
//     fontWeight: "600",
//     marginBottom: 4,
//   },
//   name: {
//     fontSize: 18,
//     fontWeight: "700",
//     color: colors.text,
//     marginBottom: 8,
//   },
//   priceContainer: {
//     flexDirection: "row",
//     alignItems: "center",
//   },
//   cashPrice: {
//     fontSize: 18,
//     fontWeight: "700",
//     color: colors.text,
//     marginRight: 8,
//   },
//   pointsPrice: {
//     fontSize: 14,
//     color: colors.error,
//   },
//   addButton: {
//     width: 40,
//     height: 40,
//     borderRadius: 20,
//     backgroundColor: colors.primary,
//     justifyContent: "center",
//     alignItems: "center",
//     alignSelf: "flex-end",
//   },
// })
