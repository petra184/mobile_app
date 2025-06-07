// import React from "react";
// import { TouchableOpacity, Text, StyleSheet, Dimensions, View } from "react-native";
// import { Image } from "expo-image";
// import { LinearGradient } from "expo-linear-gradient";
// import { SportCategory } from "@/types/";
// import {colors} from "@/constants/colors";

// interface CategoryCardProps {
//   category: SportCategory;
//   onPress: (categoryId: string) => void;
//   isSelected: boolean;
// }

// const { width } = Dimensions.get("window");
// const cardWidth = (width - 48) / 2; // 2 cards per row with margins

// export default function CategoryCard({ category, onPress, isSelected }: CategoryCardProps) {
//   return (
//     <TouchableOpacity
//       style={[styles.card, isSelected && styles.selectedCard]}
//       onPress={() => onPress(category.id)}
//       activeOpacity={0.8}
//     >
//       <Image source={{ uri: category.image }} style={styles.image} contentFit="cover" />
//       <LinearGradient
//         colors={["transparent", "rgba(0,0,0,0.7)"]}
//         style={styles.gradient}
//       />
//       <Text style={styles.name}>{category.name}</Text>
//       {isSelected && <View style={styles.selectedIndicator} />}
//     </TouchableOpacity>
//   );
// }

// const styles = StyleSheet.create({
//   card: {
//     width: cardWidth,
//     height: 120,
//     borderRadius: 12,
//     overflow: "hidden",
//     marginBottom: 16,
//     position: "relative",
//   },
//   selectedCard: {
//     borderWidth: 2,
//     borderColor: colors.error
//   },
//   image: {
//     width: "100%",
//     height: "100%",
//   },
//   gradient: {
//     position: "absolute",
//     left: 0,
//     right: 0,
//     bottom: 0,
//     height: "50%",
//   },
//   name: {
//     position: "absolute",
//     bottom: 12,
//     left: 12,
//     color: "#FFFFFF",
//     fontSize: 16,
//     fontWeight: "700",
//     textShadowColor: "rgba(0, 0, 0, 0.75)",
//     textShadowOffset: { width: 0, height: 1 },
//     textShadowRadius: 2,
//   },
//   selectedIndicator: {
//     position: "absolute",
//     top: 8,
//     right: 8,
//     width: 16,
//     height: 16,
//     borderRadius: 8,
//     backgroundColor: colors.error,
//   },
// });