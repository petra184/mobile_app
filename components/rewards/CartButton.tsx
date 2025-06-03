// import React from "react";
// import { TouchableOpacity, Text, StyleSheet, View } from "react-native";
// import { Feather } from "lucide-react-native";
// import { useCartStore } from "@/store/cartStore";
// import {colors} from "@/constants/colors";

// interface CartButtonProps {
//   onPress: () => void;
// }

// export default function CartButton({ onPress }: CartButtonProps) {
//   const { totalItems } = useCartStore();
//   const itemCount = totalItems();
  
//   if (itemCount === 0) {
//     return null;
//   }
  
//   return (
//     <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.8}>
//       <Feather name="shopping-bag" size={20} color="#FFFFFF" />
//       <View style={styles.badge}>
//         <Text style={styles.badgeText}>{itemCount}</Text>
//       </View>
//     </TouchableOpacity>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     width: 44,
//     height: 44,
//     borderRadius: 22,
//     backgroundColor: colors.background,
//     justifyContent: "center",
//     alignItems: "center",
//     position: "relative",
//   },
//   badge: {
//     position: "absolute",
//     top: -5,
//     right: -5,
//     backgroundColor: colors.error,
//     borderRadius: 10,
//     minWidth: 20,
//     height: 20,
//     justifyContent: "center",
//     alignItems: "center",
//     paddingHorizontal: 4,
//   },
//   badgeText: {
//     color: "#FFFFFF",
//     fontSize: 12,
//     fontWeight: "700",
//   },
// });