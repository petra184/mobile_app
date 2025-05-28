// import React, { useState } from 'react';
// import { View, Text, StyleSheet, FlatList, Pressable, Image } from 'react-native';
// import { useRouter } from 'expo-router';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import { colors } from '@/constants/colors';
// import { useUserStore } from '@/store/userStore';
// import { teams } from '@/mocks/teams';
// import { Heart, Search } from 'lucide-react-native';


// export default function ManageFavoriteTeamsScreen() {
//   const router = useRouter();
//   const { preferences, toggleFavoriteTeam } = useUserStore();
//   const [searchQuery, setSearchQuery] = useState('');
  
//   const handleToggleFavorite = (teamId: string) => {
//     toggleFavoriteTeam(teamId);
//   };
  
//   const renderTeamItem = ({ item }: { item: any }) => {
//     const isFavorite = preferences.favoriteTeams.includes(item.id);
    
//     return (
//       <View style={styles.teamItem}>
//         <Image source={{ uri: item.logo }} style={styles.teamLogo} />
//         <View style={styles.teamInfo}>
//           <Text style={styles.teamName}>{item.name}</Text>
//         </View>
//         <Pressable
//           style={[
//             styles.favoriteButton,
//             isFavorite && styles.favoriteButtonActive
//           ]}
//           onPress={() => handleToggleFavorite(item.id)}
//         >
//           <Heart
//             size={20}
//             color={isFavorite ? '#FFFFFF' : colors.primary}
//             fill={isFavorite ? '#FFFFFF' : 'none'}
//           />
//         </Pressable>
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
//         {/* Search Bar (non-functional in this example) */}
//         <View style={styles.searchContainer}>
//           <View style={styles.searchBar}>
//             <Search size={20} color={colors.textSecondary} />
//             <Text style={styles.searchPlaceholder}>Search teams...</Text>
//           </View>
//         </View>
        
//         <Text style={styles.instructions}>
//           Tap the heart icon to add or remove teams from your favorites
//         </Text>
        
//         <FlatList
//           data={teams}
//           renderItem={renderTeamItem}
//           keyExtractor={(item) => item.id}
//           contentContainerStyle={styles.listContent}
//         />
//       </SafeAreaView>
//       </>
//   );
// }


// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: colors.background,
//     top:0,
//   },
//   backgroundImage: {
//     position: 'absolute',
//     bottom: 0,
//     resizeMode: 'cover',
//     opacity: 0.1, 
//     zIndex: 0, 
//   },
//   searchContainer: {
//     padding: 16,
//     borderBottomWidth: 1,
//     borderBottomColor: colors.border,
//   },
//   searchBar: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: colors.card,
//     borderRadius: 12,
//     paddingHorizontal: 16,
//     paddingVertical: 12,
//     borderWidth: 1,
//     borderColor: colors.border,
//   },
//   searchPlaceholder: {
//     fontSize: 16,
//     color: colors.textSecondary,
//     marginLeft: 12,
//   },
//   instructions: {
//     fontSize: 14,
//     color: colors.textSecondary,
//     textAlign: 'center',
//     paddingVertical: 12,
//     paddingHorizontal: 16,
//   },
//   listContent: {
//     padding: 16,
//   },
//   teamItem: {
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
//   teamLogo: {
//     width: 58,
//     height: 48,
//     marginRight: 16,
//   },
//   teamInfo: {
//     flex: 1,
//   },
//   teamName: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: colors.text,
//     marginBottom: 4,
//   },
//   teamSport: {
//     fontSize: 14,
//     color: colors.textSecondary,
//   },
//   favoriteButton: {
//     width: 40,
//     height: 40,
//     borderRadius: 20,
//     backgroundColor: 'rgba(59, 130, 246, 0.1)',
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   favoriteButtonActive: {
//     backgroundColor: colors.primary,
//   },
// });