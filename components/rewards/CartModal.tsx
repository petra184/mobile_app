// import React from "react";
// import { 
//   View, 
//   Text, 
//   StyleSheet, 
//   TouchableOpacity, 
//   FlatList,
//   Alert,
//   Modal
// } from "react-native";
// import { Image } from "expo-image";
// import { Feather } from "lucide-react-native";
// import { useCartStore } from "@/store/cartStore";
// import { useUserStore } from "@/store/userStore";
// import {colors} from "@/constants/colors";

// interface CartModalProps {
//   visible: boolean;
//   onClose: () => void;
// }

// export default function CartModal({ visible, onClose }: CartModalProps) {
//   const { items, removeItem, clearCart, totalCash, totalPoints } = useCartStore();
//   const points = useUserStore(state => state.points);
  
//   const handleCheckout = () => {
//     const pointsNeeded = totalPoints();
    
//     if (pointsNeeded > points) {
//       Alert.alert(
//         "Insufficient Points",
//         `You need ${pointsNeeded} points for this purchase, but you only have ${points} points.`,
//         [{ text: "OK" }]
//       );
//       return;
//     }
    
//     // In a real app, this would process the payment and points
//     if (pointsNeeded > 0) {
//       points
//     }
    
//     Alert.alert(
//       "Order Placed",
//       "Your order has been placed successfully!",
//       [
//         { 
//           text: "OK", 
//           onPress: () => {
//             clearCart();
//             onClose();
//           }
//         }
//       ]
//     );
//   };
  
//   return (
//     <Modal
//       visible={visible}
//       animationType="slide"
//       transparent={true}
//       onRequestClose={onClose}
//     >
//       <View style={styles.modalContainer}>
//         <View style={styles.modalContent}>
//           <View style={styles.header}>
//             <Text style={styles.title}>Your Cart</Text>
//             <TouchableOpacity onPress={onClose}>
//               <Feather name="X" size={24} color={colors.text} />
//             </TouchableOpacity>
//           </View>
          
//           {items.length === 0 ? (
//             <View style={styles.emptyContainer}>
//               <Text style={styles.emptyText}>Your cart is empty</Text>
//             </View>
//           ) : (
//             <>
//               <FlatList
//                 data={items}
//                 keyExtractor={(item, index) => `${item.product.id}-${index}`}
//                 renderItem={({ item }) => (
//                   <View style={styles.cartItem}>
//                     <Image 
//                       source={{ uri: item.product.image }} 
//                       style={styles.itemImage}
//                       contentFit="cover"
//                     />
                    
//                     <View style={styles.itemDetails}>
//                       <Text style={styles.itemName}>{item.product.name}</Text>
//                       <Text style={styles.itemMeta}>
//                         {item.size && `Size: ${item.size}`}
//                         {item.size && item.color && " | "}
//                         {item.color && `colors: ${item.color}`}
//                       </Text>
//                       <Text style={styles.itemPrice}>
//                         {item.payWithPoints 
//                           ? `${item.product.pointsPrice} pts` 
//                           : `$${item.product.cashPrice.toFixed(2)}`
//                         } × {item.quantity}
//                       </Text>
//                     </View>
                    
//                     <TouchableOpacity 
//                       style={styles.removeButton}
//                       onPress={() => removeItem(item.product.id)}
//                     >
//                       <Feather name="trash-2" size={20} color={colors.error} />
//                     </TouchableOpacity>
//                   </View>
//                 )}
//                 style={styles.cartList}
//               />
              
//               <View style={styles.summaryContainer}>
//                 {totalPoints() > 0 && (
//                   <View style={styles.summaryRow}>
//                     <Text style={styles.summaryLabel}>Total Points:</Text>
//                     <Text style={styles.summaryValue}>{totalPoints()} pts</Text>
//                   </View>
//                 )}
                
//                 {totalCash() > 0 && (
//                   <View style={styles.summaryRow}>
//                     <Text style={styles.summaryLabel}>Total Cash:</Text>
//                     <Text style={styles.summaryValue}>${totalCash().toFixed(2)}</Text>
//                   </View>
//                 )}
                
//                 <View style={styles.pointsBalance}>
//                   <Text style={styles.pointsBalanceText}>Your Points Balance: {points} pts</Text>
//                 </View>
                
//                 <TouchableOpacity 
//                   style={styles.checkoutButton}
//                   onPress={handleCheckout}
//                 >
//                   <Text style={styles.checkoutButtonText}>Checkout</Text>
//                 </TouchableOpacity>
//               </View>
//             </>
//           )}
//         </View>
//       </View>
//     </Modal>
//   );
// }

// const styles = StyleSheet.create({
//   modalContainer: {
//     flex: 1,
//     backgroundColor: "rgba(0, 0, 0, 0.5)",
//     justifyContent: "flex-end",
//   },
//   modalContent: {
//     backgroundColor: colors.background,
//     borderTopLeftRadius: 20,
//     borderTopRightRadius: 20,
//     paddingTop: 20,
//     paddingHorizontal: 16,
//     maxHeight: "80%",
//   },
//   header: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     marginBottom: 20,
//     paddingBottom: 16,
//     borderBottomWidth: 1,
//     borderBottomColor: colors.border,
//   },
//   title: {
//     fontSize: 20,
//     fontWeight: "700",
//     color: colors.text,
//   },
//   emptyContainer: {
//     alignItems: "center",
//     justifyContent: "center",
//     paddingVertical: 60,
//   },
//   emptyText: {
//     fontSize: 16,
//     color: colors.error,
//   },
//   cartList: {
//     maxHeight: "60%",
//   },
//   cartItem: {
//     flexDirection: "row",
//     alignItems: "center",
//     paddingVertical: 12,
//     borderBottomWidth: 1,
//     borderBottomColor: colors.border,
//   },
//   itemImage: {
//     width: 60,
//     height: 60,
//     borderRadius: 8,
//   },
//   itemDetails: {
//     flex: 1,
//     marginLeft: 12,
//   },
//   itemName: {
//     fontSize: 16,
//     fontWeight: "600",
//     color: colors.text,
//     marginBottom: 4,
//   },
//   itemMeta: {
//     fontSize: 14,
//     color: colors.success,
//     marginBottom: 4,
//   },
//   itemPrice: {
//     fontSize: 14,
//     fontWeight: "500",
//     color: colors.error,
//   },
//   removeButton: {
//     padding: 8,
//   },
//   summaryContainer: {
//     paddingVertical: 20,
//     borderTopWidth: 1,
//     borderTopColor: colors.border,
//   },
//   summaryRow: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     marginBottom: 12,
//   },
//   summaryLabel: {
//     fontSize: 16,
//     fontWeight: "600",
//     color: colors.text,
//   },
//   summaryValue: {
//     fontSize: 16,
//     fontWeight: "700",
//     color: colors.success
//   },
//   pointsBalance: {
//     backgroundColor: colors.success,
//     padding: 12,
//     borderRadius: 8,
//     marginBottom: 16,
//   },
//   pointsBalanceText: {
//     fontSize: 14,
//     color: colors.success,
//     textAlign: "center",
//   },
//   checkoutButton: {
//     backgroundColor: colors.error,
//     paddingVertical: 16,
//     borderRadius: 8,
//     alignItems: "center",
//     marginBottom: 30,
//   },
//   checkoutButtonText: {
//     color: "#FFFFFF",
//     fontSize: 16,
//     fontWeight: "600",
//   },
// });