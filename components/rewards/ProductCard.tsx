// import React, { useState } from "react";
// import { View, Text, StyleSheet, TouchableOpacity, Alert, Dimensions } from "react-native";
// import { Image } from "expo-image";
// import { Feather } from "@expo/vector-icons";
// import { Product } from "@/types";
// import { useCartStore } from "@/store/cartStore";
// import { useUserStore } from "@/store/userStore";
// import {colors} from "@/constants/colors";

// interface ProductCardProps {
//   product: Product;
//   compact?: boolean;
// }

// const { width } = Dimensions.get("window");
// const cardWidth = (width - 32) / 2; // 2 cards per row with margins

// export default function ProductCard({ product, compact = true }: ProductCardProps) {
//   const [quantity, setQuantity] = useState(1);
//   const [payWithPoints, setPayWithPoints] = useState(false);
//   const [selectedSize, setSelectedSize] = useState(product.sizes ? product.sizes[0] : undefined);
//   const [selectedColor, setSelectedColor] = useState(product.colors ? product.colors[0] : undefined);
//   const [isFavorite, setIsFavorite] = useState(false);
  
//   const { addItem } = useCartStore();
//   const points = useUserStore(state => state.points);

//   const incrementQuantity = () => {
//     setQuantity(quantity + 1);
//   };

//   const decrementQuantity = () => {
//     if (quantity > 1) {
//       setQuantity(quantity - 1);
//     }
//   };

//   const togglePaymentMethod = () => {
//     setPayWithPoints(!payWithPoints);
//   };

//   const toggleFavorite = () => {
//     setIsFavorite(!isFavorite);
//   };

//   const handleAddToCart = () => {
//     if (payWithPoints) {
//       const totalPointsCost = product.pointsPrice * quantity;
//       if (points < totalPointsCost) {
//         Alert.alert(
//           "Insufficient Points",
//           `You need ${totalPointsCost} points for this purchase, but you only have ${points} points.`,
//           [{ text: "OK" }]
//         );
//         return;
//       }
//     }
    
//     addItem(product, quantity, payWithPoints, selectedSize, selectedColor);
    
//     Alert.alert(
//       "Added to Cart",
//       `${quantity} ${product.name} added to your cart.`,
//       [{ text: "OK" }]
//     );
//   };

//   if (compact) {
//     return (
//       <View style={styles.compactCard}>
//         <View style={styles.imageContainer}>
//           <Image source={{ uri: product.image }} style={styles.compactImage} contentFit="cover" />
//           <TouchableOpacity 
//             style={styles.favoriteButton} 
//             onPress={toggleFavorite}
//           >
//             <Feather name="heart" 
//               size={16} 
//               color={isFavorite ? colors.error : "#FFFFFF"} 
//               fill={isFavorite ? colors.error : "none"} 
//             />
//           </TouchableOpacity>
//         </View>
        
//         <View style={styles.compactContent}>
//           <Text style={styles.compactSport}>{product.sport.toUpperCase()}</Text>
//           <Text style={styles.compactName} numberOfLines={1}>{product.name}</Text>
          
//           <View style={styles.compactPriceRow}>
//             <Text style={styles.compactPrice}>${product.cashPrice.toFixed(2)}</Text>
//             <TouchableOpacity 
//               style={styles.compactAddButton}
//               onPress={() => addItem(product, 1, false)}
//             >
//               <Feather name="plus"  size={16} color="#FFFFFF" />
//             </TouchableOpacity>
//           </View>
//         </View>
//       </View>
//     );
//   }

//   return (
//     <View style={styles.card}>
//       <Image source={{ uri: product.image }} style={styles.image} contentFit="cover" />
      
//       <View style={styles.content}>
//         <Text style={styles.name}>{product.name}</Text>
//         <Text style={styles.description} numberOfLines={2}>{product.description}</Text>
        
//         <View style={styles.priceContainer}>
//           <Text style={[styles.price, payWithPoints && styles.inactivePrice]}>
//             ${product.cashPrice.toFixed(2)}
//           </Text>
//           <Text style={[styles.pointsPrice, !payWithPoints && styles.inactivePrice]}>
//             {product.pointsPrice} pts
//           </Text>
//         </View>
        
//         {product.sizes && (
//           <View style={styles.optionsContainer}>
//             <Text style={styles.optionLabel}>Size:</Text>
//             <View style={styles.optionsRow}>
//               {product.sizes.map((size) => (
//                 <TouchableOpacity
//                   key={size}
//                   style={[
//                     styles.optionButton,
//                     selectedSize === size && styles.selectedOption,
//                   ]}
//                   onPress={() => setSelectedSize(size)}
//                 >
//                   <Text style={[
//                     styles.optionText,
//                     selectedSize === size && styles.selectedOptionText,
//                   ]}>
//                     {size}
//                   </Text>
//                 </TouchableOpacity>
//               ))}
//             </View>
//           </View>
//         )}
        
//         {product.colors && (
//           <View style={styles.optionsContainer}>
//             <Text style={styles.optionLabel}>Color:</Text>
//             <View style={styles.optionsRow}>
//               {product.colors.map((color) => (
//                 <TouchableOpacity
//                   key={color}
//                   style={[
//                     styles.optionButton,
//                     selectedColor === color && styles.selectedOption,
//                   ]}
//                   onPress={() => setSelectedColor(color)}
//                 >
//                   <Text style={[
//                     styles.optionText,
//                     selectedColor === color && styles.selectedOptionText,
//                   ]}>
//                     {color}
//                   </Text>
//                 </TouchableOpacity>
//               ))}
//             </View>
//           </View>
//         )}
        
//         <View style={styles.actionsContainer}>
//           <View style={styles.quantityContainer}>
//             <TouchableOpacity 
//               style={styles.quantityButton} 
//               onPress={decrementQuantity}
//               disabled={quantity <= 1}
//             >
//               <Feather name="minus" size={16} color={quantity <= 1 ? colors.error : colors.text} />
//             </TouchableOpacity>
//             <Text style={styles.quantity}>{quantity}</Text>
//             <TouchableOpacity style={styles.quantityButton} onPress={incrementQuantity}>
//               <Feather name="plus" size={16} color={colors.text} />
//             </TouchableOpacity>
//           </View>
          
//           <TouchableOpacity 
//             style={styles.paymentToggle}
//             onPress={togglePaymentMethod}
//           >
//             <Text style={styles.paymentToggleText}>
//               Pay with {payWithPoints ? "Points" : "Cash"}
//             </Text>
//           </TouchableOpacity>
//         </View>
        
//         <TouchableOpacity 
//           style={styles.addButton}
//           onPress={handleAddToCart}
//         >
//           <Feather name="shopping-bag" size={16} color="#FFFFFF" />
//           <Text style={styles.addButtonText}>Add to Cart</Text>
//         </TouchableOpacity>
//       </View>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   // Compact card styles
//   compactCard: {
//     width: cardWidth,
//     borderRadius: 12,
//     backgroundColor: colors.card,
//     overflow: "hidden",
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 2,
//   },
//   imageContainer: {
//     position: "relative",
//   },
//   compactImage: {
//     width: "100%",
//     height: 150,
//   },
//   favoriteButton: {
//     position: "absolute",
//     top: 8,
//     right: 8,
//     width: 30,
//     height: 30,
//     borderRadius: 15,
//     backgroundColor: "rgba(0, 0, 0, 0.3)",
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   compactContent: {
//     padding: 12,
//   },
//   compactSport: {
//     fontSize: 10,
//     color: colors.success,
//     fontWeight: "600",
//     marginBottom: 4,
//     textTransform: "uppercase",
//   },
//   compactName: {
//     fontSize: 14,
//     fontWeight: "600",
//     color: colors.text,
//     marginBottom: 8,
//   },
//   compactPriceRow: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//   },
//   compactPrice: {
//     fontSize: 16,
//     fontWeight: "700",
//     color: colors.text,
//   },
//   compactAddButton: {
//     width: 28,
//     height: 28,
//     borderRadius: 14,
//     backgroundColor: colors.success,
//     justifyContent: "center",
//     alignItems: "center",
//   },
  
//   // Original card styles
//   card: {
//     backgroundColor: colors.card,
//     borderRadius: 12,
//     marginBottom: 16,
//     overflow: "hidden",
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 2,
//   },
//   image: {
//     width: "100%",
//     height: 200,
//   },
//   content: {
//     padding: 16,
//   },
//   name: {
//     fontSize: 18,
//     fontWeight: "600",
//     marginBottom: 4,
//     color: colors.text,
//   },
//   description: {
//     fontSize: 14,
//     color: colors.error,
//     marginBottom: 12,
//   },
//   priceContainer: {
//     flexDirection: "row",
//     alignItems: "center",
//     marginBottom: 16,
//   },
//   price: {
//     fontSize: 18,
//     fontWeight: "700",
//     color: colors.text,
//     marginRight: 12,
//   },
//   pointsPrice: {
//     fontSize: 18,
//     fontWeight: "700",
//     color: colors.success,
//   },
//   inactivePrice: {
//     opacity: 0.5,
//   },
//   optionsContainer: {
//     marginBottom: 12,
//   },
//   optionLabel: {
//     fontSize: 14,
//     fontWeight: "600",
//     marginBottom: 6,
//     color: colors.text,
//   },
//   optionsRow: {
//     flexDirection: "row",
//     flexWrap: "wrap",
//   },
//   optionButton: {
//     paddingHorizontal: 12,
//     paddingVertical: 6,
//     borderRadius: 4,
//     borderWidth: 1,
//     borderColor: colors.border,
//     marginRight: 8,
//     marginBottom: 8,
//   },
//   selectedOption: {
//     backgroundColor: colors.success,
//     borderColor: colors.success,
//   },
//   optionText: {
//     fontSize: 14,
//     color: colors.text,
//   },
//   selectedOptionText: {
//     color: "#FFFFFF",
//   },
//   actionsContainer: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     marginBottom: 16,
//   },
//   quantityContainer: {
//     flexDirection: "row",
//     alignItems: "center",
//     borderWidth: 1,
//     borderColor: colors.border,
//     borderRadius: 4,
//   },
//   quantityButton: {
//     padding: 8,
//   },
//   quantity: {
//     paddingHorizontal: 12,
//     fontSize: 16,
//     fontWeight: "600",
//   },
//   paymentToggle: {
//     backgroundColor: "red",
//     paddingHorizontal: 12,
//     paddingVertical: 8,
//     borderRadius: 4,
//   },
//   paymentToggleText: {
//     fontSize: 14,
//     fontWeight: "500",
//     color: colors.text,
//   },
//   addButton: {
//     backgroundColor: colors.success,
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "center",
//     paddingVertical: 12,
//     borderRadius: 8,
//     gap: 8,
//   },
//   addButtonText: {
//     color: "#FFFFFF",
//     fontSize: 16,
//     fontWeight: "600",
//   },
// });