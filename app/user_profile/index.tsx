// import React, { useState } from 'react';
// import { View, Text, StyleSheet, ScrollView, Pressable, Switch, Image, Platform } from 'react-native';
// import { Stack, useRouter } from 'expo-router';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import { colors } from '@/constants/colors';
// import { useUserStore } from '@/store/userStore';
// import { teams } from '@/mocks/teams';
// import { scanHistory } from '@/mocks/qrCodes';
// import { 
//   User, 
//   Award, 
//   Bell, 
//   Heart, 
//   Clock, 
//   Settings, 
//   LogOut,
//   ChevronRight,
//   Edit2,
//   ArrowLeft
// } from 'lucide-react-native';
// import { getCurrentUser, signOut } from '@/lib/actions';

// function capitalize(name:string) {
//   return name
//     .toLowerCase() // Ensure the rest of the letters are lowercase
//     .replace(/\b\w/g, (char) => char.toUpperCase()); // Capitalize first letter of each word
// }

// export default function ProfileScreen() {
//   const router = useRouter();
//   const { preferences, setNotificationsEnabled } = useUserStore();
//   const [isEditing, setIsEditing] = useState(false);
//   const [first_name, setFirstName] = useState("");
//   const [last_name, setLastName] = useState("");
//   const [email, setEmail] = useState(true);
//   const [points, setPoints] = useState(0);

//   async function getUserData() {
//     const data = await getCurrentUser();
//     if (!data) return;
    
//     setFirstName(data.first_name);
//     setLastName(data.last_name);
//     setEmail(data.email);
//     setPoints(data.points.toString()); // Ensure points is stored as a string
//   }
  
//   getUserData()

//   // Get favorite teams
//   const favoriteTeams = teams.filter(team => 
//     preferences.favoriteTeams.includes(team.id)
//   );
  
//   const handleToggleNotifications = (value: boolean) => {
//     setNotificationsEnabled(value);
//   };


//   const navigateToEditProfile = () => {
//     router.push('/user_profile/edit_profile');
//   };


//   const navigateToManageFavoriteTeams = () => {
//     router.push('/user_profile/manage_fav_teams');
//   };


//   const navigateToActivityHistory = () => {
//     router.push('/user_profile/activity_history');
//   };


//   const navigateToAccountSettings = () => {
//     router.push('/user_profile/account_settings');
//   };
  
//   return (
//     <>
//       <SafeAreaView style={styles.container} edges={['left']}>
//         <Image
//           source={require('../../IMAGES/crowd.jpg')} // Replace with your actual background image
//           style={styles.backgroundImage}
//         />
//           {/* Profile Header */}
//           <View style={styles.profileHeader}>
//             <Pressable 
//                 onPress={() => router.back()} 
//                 style={{ marginRight: 16 }}>
//                 <ArrowLeft size={24} color={colors.primary} style={styles.arrow} />
//               </Pressable>
//             <View style={styles.profileImageContainer}>
//               <User size={60} color={colors.primary} />
//             </View>
//             <View style={styles.profileInfo}>
//               <Text style={styles.profileName}>{capitalize(first_name)} {capitalize(last_name)}</Text>
//               <Text style={styles.profileEmail}>{email}</Text>
//               <View style={styles.pointsContainer}>
//                 <Award size={16} color={colors.primary} />
//                 <Text style={styles.pointsText}>{points} Points</Text>
//               </View>
//             </View>
//             <View style={styles.editProfileButtonBck}>
//             <Pressable style={styles.editProfileButton} onPress={navigateToEditProfile}>
//               <Edit2 size={20} color={colors.primary}/>
//             </Pressable>
//             </View>
//           </View>
//           <ScrollView showsVerticalScrollIndicator={false}>
//           {/* Favorite Teams */}
//           <View style={styles.section}>
//             <View style={styles.sectionHeader}>
//               <Text style={styles.sectionTitle}>Favorite Teams</Text>
//               <Pressable onPress={() => setIsEditing(!isEditing)}>
//                 <Text style={styles.editButton}>{isEditing ? 'Done' : 'Edit'}</Text>
//               </Pressable>
//             </View>
            
//             {favoriteTeams.length > 0 ? (
//               <View style={styles.favoriteTeamsContainer}>
//                 {favoriteTeams.map(team => (
//                   <View key={team.id} style={styles.teamItem}>
//                     <Image source={{ uri: team.logo }} style={styles.teamLogo} />
//                     <Text style={styles.teamName}>{team.name}</Text>
//                     {isEditing && (
//                       <Pressable style={styles.removeButton}>
//                         <Text style={styles.removeButtonText}>Remove</Text>
//                       </Pressable>
//                     )}
//                   </View>
//                 ))}
//               </View>
//             ) : (
//               <Text style={styles.emptyText}>No favorite teams selected</Text>
//             )}
//           </View>
          
//             {/* Recent Activity */}
//           <View style={styles.section}>
//             <Text style={styles.sectionTitle}>Recent Activity</Text>
            
//             {scanHistory.length > 0 ? (
//               <View style={styles.activityContainer}>
//                 {scanHistory.map(scan => (
//                   <View key={scan.id} style={styles.activityItem}>
//                     <View style={styles.activityPoints}>
//                       <Text style={styles.activityPointsText}>+{scan.points}</Text>
//                     </View>
//                     <View style={styles.activityInfo}>
//                       <Text style={styles.activityDescription}>{scan.description}</Text>
//                       <Text style={styles.activityDate}>
//                         {new Date(scan.scannedAt).toLocaleDateString()}
//                       </Text>
//                     </View>
//                   </View>
//                 ))}
//               </View>
//             ) : (
//               <Text style={styles.emptyText}>No recent activity</Text>
//             )}
//           </View>
          
//           {/* Settings */}
//           <View style={styles.section}>
//             <Text style={styles.sectionTitle}>Settings</Text>
            
//             <View style={styles.settingsContainer}>
//               <View style={styles.settingwithbutton}>
//                 <View style={styles.settingLeft}>
//                   <Bell size={20} color={colors.text} style={styles.settingIcon} />
//                   <Text style={styles.settingText}>Notifications</Text>
//                 </View>
//                 <Switch
//                   value={preferences.notificationsEnabled}
//                   onValueChange={handleToggleNotifications}
//                   trackColor={{ false: colors.border, true: colors.primary }}
//                   thumbColor="#FFFFFF"
//                 />
//               </View>
              
//               <Pressable style={styles.settingItem} onPress={navigateToManageFavoriteTeams}>
//                 <View style={styles.settingLeft}>
//                   <Heart size={20} color={colors.text} style={styles.settingIcon} />
//                   <Text style={styles.settingText}>Manage Favorite Teams</Text>
//                 </View>
//                 <ChevronRight size={20} color={colors.textSecondary} />
//               </Pressable>
              
//               <Pressable style={styles.settingItem} onPress={navigateToActivityHistory}>
//                 <View style={styles.settingLeft}>
//                   <Clock size={20} color={colors.text} style={styles.settingIcon} />
//                   <Text style={styles.settingText}>Activity History</Text>
//                 </View>
//                 <ChevronRight size={20} color={colors.textSecondary} />
//               </Pressable>
              
//               <Pressable style={styles.settingItem} onPress={navigateToAccountSettings}>
//                 <View style={styles.settingLeft}>
//                   <Settings size={20} color={colors.text} style={styles.settingIcon} />
//                   <Text style={styles.settingText}>Account Settings</Text>
//                 </View>
//                 <ChevronRight size={20} color={colors.textSecondary} />
//               </Pressable>
//             </View>

//             {/* Logout Button */}
//             <Pressable 
//               style={styles.logoutButton} 
//               onPress={async () => {
//                 try {
//                   const result = await signOut();
                  
//                   if (result.success) {
//                     router.push('/');
//                   } else {
//                     console.error("Sign out failed:", result.message);
//                   }
//                 } catch (error) {
//                   console.error("Error during sign out:", error);
//                 }
//               }}
//             >
//               <LogOut size={20} color={colors.error} style={styles.logoutIcon} />
//               <Text style={styles.logoutText}>Log Out</Text>
//             </Pressable>
//           </View>
          
//         </ScrollView>
//       </SafeAreaView>
//     </>
//   );
// }


// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor:colors.background,
//     top:0,
//   },
//   arrow:{
//     position: 'absolute',
//     top: "-55%",
//   },
//   backgroundImage: {
//     position: 'absolute',
//     bottom: 0,
//     resizeMode: 'cover',
//     opacity: 0.1, 
//     zIndex: 0, 
//   },
//   profileHeader: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     padding: 16,
//     ...Platform.select({
//       ios: {
//         paddingTop: 65,
//         }}),
//     backgroundColor: colors.card,
//     borderBottomWidth: 1,
//     borderBottomColor: colors.border,
//     position: "relative"
//   },
//   editProfileButton:{
//     width: 40,
//     height: 40,
//     borderRadius: 20,
//     backgroundColor: 'rgba(59, 130, 246, 0.1)',
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   editProfileButtonBck:{
//     paddingTop: 20,
//   },
//   profileImageContainer: {
//     width: 80,
//     height: 80,
//     borderRadius: 40,
//     backgroundColor: 'rgba(59, 130, 246, 0.1)',
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginRight: 16,
//     marginTop: 30,
//   },
//     profileInfo: {
//       flex: 1,
//       paddingTop: 20,
//     },
//     profileName: {
//       fontSize: 20,
//       fontWeight: '700',
//       color: colors.text,
//       marginBottom: 4,
//     },
//     profileEmail: {
//       fontSize: 14,
//       color: colors.textSecondary,
//       marginBottom: 8,
//     },
//     pointsContainer: {
//         flexDirection: 'row',
//         alignItems: 'center',
//       },
//       pointsText: {
//         fontSize: 14,
//         fontWeight: '600',
//         color: colors.primary,
//         marginLeft: 4,
//       },
//       section: {
//         marginTop: 16,
//         padding: 16,
//         borderRadius: 12,
//         marginHorizontal: 16,
//       },
//       sectionHeader: {
//         flexDirection: 'row',
//         justifyContent: 'space-between',
//         alignItems: 'center',
//         marginBottom: 16,
//       },
//       sectionTitle: {
//         fontSize: 18,
//         fontWeight: '700',
//         color: colors.text,
//         marginBottom: 16,
//       },
//       editButton: {
//         fontSize: 14,
//         fontWeight: '600',
//         color: colors.primary,
//         marginBottom: 16,
//       },
//       favoriteTeamsContainer: {
//         gap: 12,
//       },
//       teamItem: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         backgroundColor: colors.background,
//         borderRadius: 8,
//         padding: 12,
//         borderWidth: 1,
//         borderColor: colors.border,
//       },
//       teamLogo: {
//         width: 40,
//         height: 32,
//         marginRight: 12,
//       },
//       teamName: {
//         fontSize: 16,
//         fontWeight: '500',
//         color: colors.text,
//         flex: 1,
//       },
//       removeButton: {
//         backgroundColor: 'rgba(239, 68, 68, 0.1)',
//         paddingVertical: 4,
//         paddingHorizontal: 8,
//         borderRadius: 4,
//       },
//       removeButtonText: {
//         fontSize: 12,
//         fontWeight: '600',
//         color: colors.error,
//       },
//       emptyText: {
//         fontSize: 14,
//         color: colors.textSecondary,
//         textAlign: 'center',
//         marginVertical: 16,
//       },
//       activityContainer: {
//         gap: 12,
//       },
//       activityItem: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         backgroundColor: colors.background,
//         borderRadius: 8,
//         padding: 12,
//         borderWidth: 1,
//         borderColor: colors.border,
//       },
//       activityPoints: {
//         backgroundColor: 'rgba(16, 185, 129, 0.1)',
//         borderRadius: 4,
//         paddingVertical: 4,
//         paddingHorizontal: 8,
//         marginRight:12,
//       },
//       activityPointsText: {
//         fontSize: 14,
//         fontWeight: '700',
//         color: colors.success,
//       },
//       activityInfo: {
//         flex: 1,
//       },
//       activityDescription: {
//         fontSize: 14,
//         fontWeight: '500',
//         color: colors.text,
//         marginBottom: 4,
//       },
//       activityDate: {
//         fontSize: 12,
//         color: colors.textSecondary,
//       },
//       settingsContainer: {
//         backgroundColor: colors.background,
//         borderRadius: 8,
//         overflow: 'hidden',
//         borderWidth: 1,
//         borderColor: colors.border,
//       },
//       settingwithbutton:{
//         ...Platform.select({
//           ios: {
//             paddingVertical: 14,
//             },
//           android: {
//               paddingVertical: 4,
//             },}),
//         flexDirection: 'row',
//         alignItems: 'center',
//         justifyContent: 'space-between',
//         paddingHorizontal: 16,
//         borderBottomWidth: 1,
//         borderBottomColor: colors.border,
//       },
//       settingItem: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         justifyContent: 'space-between',
//         paddingVertical: 14,
//         paddingHorizontal: 16,
//         borderBottomWidth: 1,
//         borderBottomColor: colors.border,
//       },
//       settingLeft: {
//         flexDirection: 'row',
//         alignItems: 'center',
//       },
//       settingIcon: {
//         marginRight: 12,
//       },
//       settingText: {
//         fontSize: 16,
//         color: colors.text,
//       },
//       logoutButton: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         justifyContent: 'center',
//         backgroundColor: 'rgba(239, 68, 68, 0.1)',
//         marginHorizontal: 16,
//         marginVertical: 24,
//         paddingVertical: 12,
//         borderRadius: 8,
//       },
//       logoutIcon: {
//         marginRight: 8,
//       },
//       logoutText: {
//         fontSize: 16,
//         fontWeight: '600',
//         color: colors.error,
//       },
// });
