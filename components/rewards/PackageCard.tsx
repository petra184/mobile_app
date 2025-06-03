// import React from "react";
// import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
// import { Image } from "expo-image";
// import { Feather } from "@expo/vector-icons";
// import { BirthdayPackage } from "@/types";
// import {colors} from "@/constants/colors";
// import { LinearGradient } from "expo-linear-gradient";

// interface PackageCardProps {
//   package: BirthdayPackage;
//   onSelect: (packageId: string) => void;
// }

// export default function PackageCard({ package: pkg, onSelect }: PackageCardProps) {
//   return (
//     <View style={styles.card}>
//       <Image source={{ uri: pkg.image }} style={styles.image} contentFit="cover" />
      
//       <View style={styles.content}>
//         <View style={styles.header}>
//           <Text style={styles.name}>{pkg.name}</Text>
//           <Text style={styles.price}>${pkg.price.toFixed(2)}</Text>
//         </View>
        
//         <Text style={styles.description}>{pkg.description}</Text>
        
//         <Text style={styles.featuresTitle}>Package Includes:</Text>
//         <View style={styles.featuresList}>
//           {pkg.features.map((feature, index) => (
//             <View key={index} style={styles.featureItem}>
//               <Feather name="check" size={16} color={colors.primary} />
//               <Text style={styles.featureText}>{feature}</Text>
//             </View>
//           ))}
//         </View>
        
//         <TouchableOpacity 
//             activeOpacity={0.8}
//             onPress={() => onSelect(pkg.id)}
//             style={styles.reserveButton}
//             >
//             <LinearGradient
//                 colors={[colors.primary, colors.accent]}
//                 start={{ x: 0, y: 0 }}
//                 end={{ x: 1, y: 1 }}
//                 style={styles.reserveButton}
//             >
//                 <Text style={styles.reserveButtonText}>Reserve Now</Text>
//             </LinearGradient>
//         </TouchableOpacity>
//       </View>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   card: {
//     backgroundColor: "rgba(59, 130, 246, 0.1)",
//     overflow: "hidden",
//     shadowColor: 'black',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//   },
//   image: {
//     width: "100%",
//     height: 200,
//   },
//   content: {
//     padding: 16,
//   },
//   header: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     marginBottom: 8,
//   },
//   name: {
//     fontSize: 20,
//     fontWeight: "700",
//     color: colors.text,
//     flex: 1,
//   },
//   price: {
//     fontSize: 20,
//     fontWeight: "700",
//     color: "black",
//   },
//   description: {
//     fontSize: 14,
//     color: "gray",
//     marginBottom: 16,
//     lineHeight: 20,
//   },
//   detailsContainer: {
//     backgroundColor: "red",
//     borderRadius: 8,
//     padding: 12,
//     marginBottom: 16,
//   },
//   detailItem: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     marginBottom: 8,
//   },
//   detailLabel: {
//     fontSize: 14,
//     fontWeight: "600",
//     color: colors.text,
//   },
//   detailValue: {
//     fontSize: 14,
//     color: colors.error,
//   },
//   featuresTitle: {
//     fontSize: 16,
//     fontWeight: "600",
//     marginBottom: 12,
//     color: colors.text,
//   },
//   featuresList: {
//     marginBottom: 20,
//   },
//   featureItem: {
//     flexDirection: "row",
//     alignItems: "flex-start",
//     marginBottom: 8,
//   },
//   featureText: {
//     fontSize: 14,
//     color: colors.primaryLight,
//     marginLeft: 8,
//     flex: 1,
//   },
//   reserveButton: {
//     paddingVertical: 14,
//     borderRadius: 38,
//     alignItems: "center",
//     width: "100%",
//   },
//   reserveButtonText: {
//     color: "#FFFFFF",
//     fontSize: 16,
//     fontWeight: "600",
//   },
// });