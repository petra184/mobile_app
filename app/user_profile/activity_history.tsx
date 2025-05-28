// import React from 'react';
// import { View, Text, StyleSheet, FlatList, Image } from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import { colors } from '@/constants/colors';
// import { useUserStore } from '@/hooks/userStore';
// //import { scanHistory } from '@/types/index';
// import { Clock, Award } from 'lucide-react-native';


// export default function ActivityHistoryScreen() {
//   const { points } = useUserStore();
  
//   // Combine real scan history with mock data for a more complete example
//  // const allActivity = [...scanHistory];
  
//   // Sort by date (newest first)
//   // const sortedActivity = [...allActivity].sort((a, b) => {
//   //   return new Date(b.scannedAt).getTime() - new Date(a.scannedAt).getTime();
//   // });
  
//   const renderActivityItem = ({ item }: { item: any }) => {
//     return (
//       <View style={styles.activityItem}>
//         <View style={styles.activityPoints}>
//           <Text style={styles.activityPointsText}>+{item.points}</Text>
//         </View>
//         <View style={styles.activityInfo}>
//           <Text style={styles.activityDescription}>{item.description}</Text>
//           <Text style={styles.activityDate}>
//             {new Date(item.scannedAt).toLocaleDateString()} • {new Date(item.scannedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
//           </Text>
//         </View>
//       </View>
//     );
//   };
  
//   return (
//     <>      
//       <SafeAreaView style={styles.container} edges={['bottom']}>
//         <Image
//             source={require('../../IMAGES/crowd.jpg')} // Replace with your actual background image
//             style={styles.backgroundImage}
//         />
//         {/* Points Summary */}
//         <View style={styles.pointsSummary}>
//           <View style={styles.pointsIconContainer}>
//             <Award size={24} color={colors.primary} />
//           </View>
//           <View style={styles.pointsInfo}>
//             <Text style={styles.pointsLabel}>Total Points Earned</Text>
//             <Text style={styles.pointsValue}>{points}</Text>
//           </View>
//         </View>
        
//         {/* Activity List */}
//         <View style={styles.activityContainer}>
//           <View style={styles.activityHeader}>
//             <Clock size={20} color={colors.text} />
//             <Text style={styles.activityHeaderText}>Activity History</Text>
//           </View>
          
//           {/* {sortedActivity.length > 0 ? (
//             <FlatList
//               data={sortedActivity}
//               renderItem={renderActivityItem}
//               keyExtractor={(item) => item.id}
//               contentContainerStyle={styles.listContent}
//             />
//           ) : (
//             <Text style={styles.emptyText}>No activity history found</Text>
//           )} */}
//         </View>
//       </SafeAreaView>
//     </>
//   );
// }


// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: colors.background,
//     top: 0
//   },
//   backgroundImage: {
//     position: 'absolute',
//     bottom: 0,
//     resizeMode: 'cover',
//     opacity: 0.1, 
//     zIndex: 0, 
//   },
//   pointsSummary: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: colors.card,
//     padding: 16,
//     borderBottomWidth: 1,
//     borderBottomColor: colors.border,
//     marginTop:10,
//     marginBottom: 10,
//   },
//   pointsIconContainer: {
//     width: 48,
//     height: 48,
//     borderRadius: 24,
//     backgroundColor: 'rgba(59, 130, 246, 0.1)',
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginRight: 16,
//   },
//   pointsInfo: {
//     flex: 1,
//   },
//   pointsLabel: {
//     fontSize: 14,
//     color: colors.textSecondary,
//     marginBottom: 4,
//   },
//   pointsValue: {
//     fontSize: 24,
//     fontWeight: '700',
//     color: colors.text,
//   },
//   activityContainer: {
//     flex: 1,
//     padding: 16,
//   },
//   activityHeader: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 16,
//   },
//   activityHeaderText: {
//     fontSize: 18,
//     fontWeight: '700',
//     color: colors.text,
//     marginLeft: 8,
//   },
//   listContent: {
//     paddingBottom: 16,
//   },
//   activityItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: colors.card,
//     borderRadius: 12,
//     padding: 16,
//     marginBottom: 12,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.1,
//     shadowRadius: 2,
//     elevation: 2,
//   },
//   activityPoints: {
//     backgroundColor: 'rgba(16, 185, 129, 0.1)',
//     borderRadius: 8,
//     paddingVertical: 6,
//     paddingHorizontal: 10,
//     marginRight: 16,
//   },
//   activityPointsText: {
//     fontSize: 16,
//     fontWeight: '700',
//     color: colors.success,
//   },
//   activityInfo: {
//     flex: 1,
//   },
//   activityDescription: {
//     fontSize: 16,
//     fontWeight: '500',
//     color: colors.text,
//     marginBottom: 4,
//   },
//   activityDate: {
//     fontSize: 14,
//     color: colors.textSecondary,
//   },
//   emptyText: {
//     fontSize: 16,
//     color: colors.textSecondary,
//     marginTop: 40,
//     textAlign: 'center',
//   },
// });