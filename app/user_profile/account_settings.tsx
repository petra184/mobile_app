// import React, { useState } from 'react';
// import { View, Text, StyleSheet, Switch, Pressable, Alert, ScrollView, Image, Platform } from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import { colors } from '@/constants/colors';
// import { useUserStore } from '@/hooks/userStore';
// import { 
//   Bell, 
//   Lock, 
//   Mail, 
//   Smartphone, 
//   Globe, 
//   HelpCircle, 
//   FileText, 
//   Shield, 
//   Trash2 
// } from 'lucide-react-native';
// import { useRouter } from 'expo-router';


// export default function AccountSettingsScreen() {
//   const router = useRouter();
//   const { preferences, setNotificationsEnabled } = useUserStore();
  
//   // Additional settings states
//   const [emailNotifications, setEmailNotifications] = useState(true);
//   const [pushNotifications, setPushNotifications] = useState(preferences.notificationsEnabled);
//   const [gameReminders, setGameReminders] = useState(true);
//   const [newsUpdates, setNewsUpdates] = useState(true);
//   const [specialOffers, setSpecialOffers] = useState(false);
//   const [duoauth, setDuoauth] = useState(false);
  
//   const handleTogglePushNotifications = (value: boolean) => {
//     setPushNotifications(value);
//     setNotificationsEnabled(value);
//   };
  
//   const handleDeleteAccount = () => {
//     Alert.alert(
//       'Delete Account',
//       'Are you sure you want to delete your account? This action cannot be undone.',
//       [
//         { text: 'Cancel', style: 'cancel' },
//         { 
//           text: 'Delete', 
//           style: 'destructive',
//           onPress: () => {
//             Alert.alert('Account Deletion', 'This is a demo app. Account deletion is not implemented.');
//           }
//         }
//       ]
//     );
//   };

//   const navigateToChangePass = () => {
//     router.push('/user_profile/change_password');
//   };
  
//   return (
//     <>
//       <SafeAreaView style={styles.container} edges={['bottom']}>
//         <Image
//             source={require('../../IMAGES/crowd.jpg')} // Replace with your actual background image
//             style={styles.backgroundImage}
//         />
//         <ScrollView showsVerticalScrollIndicator={false}>
//           {/* Notification Settings */}
//           <View style={styles.section}>
//             <Text style={styles.sectionTitle}>Notification Settings</Text>
            
//             <View style={styles.settingsContainer}>
//               <View style={styles.settinwithbutton}>
//                 <View style={styles.settingLeft}>
//                   <Bell size={20} color={colors.text} style={styles.settingIcon} />
//                   <Text style={styles.settingText}>Push Notifications</Text>
//                 </View>
//                 <Switch
//                   value={pushNotifications}
//                   onValueChange={handleTogglePushNotifications}
//                   trackColor={{ false: colors.border, true: colors.primary }}
//                   thumbColor="#FFFFFF"
//                 />
//               </View>
              
//               <View style={styles.settinwithbutton}>
//                 <View style={styles.settingLeft}>
//                   <Mail size={20} color={colors.text} style={styles.settingIcon} />
//                   <Text style={styles.settingText}>Email Notifications</Text>
//                 </View>
//                 <Switch
//                   value={emailNotifications}
//                   onValueChange={setEmailNotifications}
//                   trackColor={{ false: colors.border, true: colors.primary }}
//                   thumbColor="#FFFFFF"
//                 />
//               </View>
              
//               <View style={styles.settinwithbutton}>
//                 <View style={styles.settingLeft}>
//                   <Smartphone size={20} color={colors.text} style={styles.settingIcon} />
//                   <Text style={styles.settingText}>Game Reminders</Text>
//                 </View>
//                 <Switch
//                   value={gameReminders}
//                   onValueChange={setGameReminders}
//                   trackColor={{ false: colors.border, true: colors.primary }}
//                   thumbColor="#FFFFFF"
//                 />
//               </View>
              
//               <View style={styles.settinwithbutton}>
//                 <View style={styles.settingLeft}>
//                   <Globe size={20} color={colors.text} style={styles.settingIcon} />
//                   <Text style={styles.settingText}>News Updates</Text>
//                 </View>
//                 <Switch
//                   value={newsUpdates}
//                   onValueChange={setNewsUpdates}
//                   trackColor={{ false: colors.border, true: colors.primary }}
//                   thumbColor="#FFFFFF"
//                 />
//               </View>
              
//               <View style={styles.settinwithbutton}>
//                 <View style={styles.settingLeft}>
//                   <Mail size={20} color={colors.text} style={styles.settingIcon} />
//                   <Text style={styles.settingText}>Special Offers</Text>
//                 </View>
//                 <Switch
//                   value={specialOffers}
//                   onValueChange={setSpecialOffers}
//                   trackColor={{ false: colors.border, true: colors.primary }}
//                   thumbColor="#FFFFFF"
//                 />
//               </View>
//             </View>
//           </View>
          
//            {/* Security Settings */}
//            <View style={styles.section}>
//             <Text style={styles.sectionTitle}>Security</Text>
            
//             <View style={styles.settingsContainer}>
//               <Pressable style={styles.settingItem} onPress={navigateToChangePass}>
//                 <View style={styles.settingLeft}>
//                   <Lock size={20} color={colors.text} style={styles.settingIcon} />
//                   <Text style={styles.settingText}>Change Password</Text>
//                 </View>
//               </Pressable>
              
//               <Pressable style={styles.settinwithbutton}>
//                 <View style={styles.settingLeft}>
//                   <Shield size={20} color={colors.text} style={styles.settingIcon} />
//                   <Text style={styles.settingText}>Two-Factor Authentication</Text>
//                 </View>
//                 <Switch
//                   value={duoauth}
//                   onValueChange={setDuoauth}
//                   trackColor={{ false: colors.border, true: colors.primary }}
//                   thumbColor="#FFFFFF"
//                 />
//               </Pressable>
//             </View>
//           </View>
          
//           {/* Support & Legal */}
//           <View style={styles.section}>
//             <Text style={styles.sectionTitle}>Support & Legal</Text>
            
//             <View style={styles.settingsContainer}>
//               <Pressable style={styles.settingItem}>
//                 <View style={styles.settingLeft}>
//                   <HelpCircle size={20} color={colors.text} style={styles.settingIcon} />
//                   <Text style={styles.settingText}>Help & Support</Text>
//                 </View>
//               </Pressable>
              
//               <Pressable style={styles.settingItem}>
//                 <View style={styles.settingLeft}>
//                   <FileText size={20} color={colors.text} style={styles.settingIcon} />
//                   <Text style={styles.settingText}>Terms of Service</Text>
//                 </View>
//               </Pressable>
              
//               <Pressable style={styles.settingItem}>
//                 <View style={styles.settingLeft}>
//                   <Shield size={20} color={colors.text} style={styles.settingIcon} />
//                   <Text style={styles.settingText}>Privacy Policy</Text>
//                 </View>
//               </Pressable>
//             </View>
//           </View>
          
//           {/* Delete Account */}
//           <Pressable style={styles.deleteButton} onPress={handleDeleteAccount}>
//             <Text style={styles.deleteText}>Delete Account</Text>
//           </Pressable>
//         </ScrollView>
//       </SafeAreaView>
//     </>
//   );
// }


// const styles = StyleSheet.create({
//     container: {
//       flex: 1,
//       backgroundColor: colors.background,
//       top: 0,
//     },
//     backgroundImage: {
//         position: 'absolute',
//         bottom: 0,
//         resizeMode: 'cover',
//         opacity: 0.1, 
//         zIndex: 0, 
//       },
//     section: {
//       marginTop: 16,
//       marginHorizontal: 16,
//     },
//     sectionTitle: {
//       fontSize: 18,
//       fontWeight: '700',
//       color: colors.text,
//       marginBottom: 12,
//     },
//     settingsContainer: {
//       backgroundColor: colors.card,
//       borderRadius: 12,
//       overflow: 'hidden',
//       borderWidth: 1,
//       borderColor: colors.border,
//     },
//     settinwithbutton:{
//       flexDirection: 'row',
//       alignItems: 'center',
//       justifyContent: 'space-between',
//       ...Platform.select({
//             ios: {
//               paddingVertical: 14,
//             },
//             android: {
//               paddingVertical: 4,
//             },}),
//       paddingHorizontal: 16,
//       borderBottomWidth: 1,
//       borderBottomColor: colors.border,
//     },
//     settingItem: {
//       flexDirection: 'row',
//       alignItems: 'center',
//       justifyContent: 'space-between',
//       paddingVertical: 14,
//       paddingHorizontal: 16,
//       borderBottomWidth: 1,
//       borderBottomColor: colors.border,
//     },
//     settingLeft: {
//       flexDirection: 'row',
//       alignItems: 'center',
//     },
//     settingIcon: {
//       marginRight: 12,
//     },
//     settingText: {
//       fontSize: 16,
//       color: colors.text,
//     },
//     deleteButton: {
//       flexDirection: 'row',
//       alignItems: 'center',
//       justifyContent: 'center',
//       backgroundColor: 'rgba(239, 68, 68, 0.7)',
//       marginHorizontal: 16,
//       marginVertical: 24,
//       paddingVertical: 14,
//       borderRadius: 8,
//     },
//     deleteIcon: {
//       marginRight: 8,
//     },
//     deleteText: {
//       fontSize: 16,
//       fontWeight: '600',
//       color: "white",
//     },
// });