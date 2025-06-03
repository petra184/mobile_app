import React from 'react';
import { View, Text, StyleSheet, Switch, Pressable, Alert, ScrollView, Image, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/constants/colors';
import { useUserStore } from '@/hooks/userStore';
import { useRouter } from 'expo-router';
import Feather from '@expo/vector-icons/Feather'; 
import SimpleLineIcons from '@expo/vector-icons/SimpleLineIcons';

export default function AccountSettingsScreen() {
  const router = useRouter();
  const { 
    preferences, 
    setNotificationsEnabled,
    getUserName,
    userEmail,
    isLoading 
  } = useUserStore();
  
  // Get actual user data from store
  const userName = getUserName();
  const notificationsEnabled = preferences.notificationsEnabled;
  
  const handleTogglePushNotifications = async (value: boolean) => {
    try {
      await setNotificationsEnabled(value);
    } catch (error) {
      Alert.alert('Error', 'Failed to update notification settings. Please try again.');
    }
  };
  
  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      `Are you sure you want to delete your account (${userEmail})? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            Alert.alert('Account Deletion', 'This is a demo app. Account deletion is not implemented.');
          }
        }
      ]
    );
  };

  const navigateToChangePass = () => {
    router.push('/user_profile/change_password');
  };

  const showComingSoon = (feature: string) => {
    Alert.alert('Coming Soon', `${feature} will be available in a future update.`);
  };
  
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading settings...</Text>
        </View>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Image
        source={require('../../IMAGES/crowd.jpg')}
        style={styles.backgroundImage}
      />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* User Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.settingsContainer}>
            <View style={styles.userInfoItem}>
              <View style={styles.settingLeft}>
                <Feather name="user" size={20} color={colors.text} style={styles.settingIcon} />
                <View>
                  <Text style={styles.settingText}>{userName}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Notification Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notification Settings</Text>
          
          <View style={styles.settingsContainer}>
            <View style={styles.settingWithButton}>
              <View style={styles.settingLeft}>
                <Feather name="bell" size={20} color={colors.text} style={styles.settingIcon} />
                <Text style={styles.settingText}>Push Notifications</Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={handleTogglePushNotifications}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>
            
            <Pressable style={styles.settingWithButton} onPress={() => showComingSoon('Email Notifications')}>
              <View style={styles.settingLeft}>
                <Feather name="mail" size={20} color={colors.text} style={styles.settingIcon} />
                <Text style={styles.settingText}>Email Notifications</Text>
              </View>
              <Switch
                value={true}
                onValueChange={() => showComingSoon('Email Notifications')}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#FFFFFF"
              />
            </Pressable>
            
            <Pressable style={styles.settingWithButton} onPress={() => showComingSoon('Game Reminders')}>
              <View style={styles.settingLeft}>
                <SimpleLineIcons name="screen-smartphone" size={20} color={colors.text} style={styles.settingIcon} />
                <Text style={styles.settingText}>Game Reminders</Text>
              </View>
              <Switch
                value={true}
                onValueChange={() => showComingSoon('Game Reminders')}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#FFFFFF"
              />
            </Pressable>
            
            <Pressable style={styles.settingWithButton} onPress={() => showComingSoon('News Updates')}>
              <View style={styles.settingLeft}>
                <Feather name="globe" size={20} color={colors.text} style={styles.settingIcon} />
                <Text style={styles.settingText}>News Updates</Text>
              </View>
              <Switch
                value={true}
                onValueChange={() => showComingSoon('News Updates')}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#FFFFFF"
              />
            </Pressable>
            
            <View style={[styles.settingWithButton, styles.lastItem]}>
              <View style={styles.settingLeft}>
                <Feather name="tag" size={20} color={colors.text} style={styles.settingIcon} />
                <Text style={styles.settingText}>Special Offers</Text>
              </View>
              <Switch
                value={false}
                onValueChange={() => showComingSoon('Special Offers')}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>
        </View>
        
        {/* Security Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security</Text>
          
          <View style={styles.settingsContainer}>
            <Pressable style={styles.settingItem} onPress={navigateToChangePass}>
              <View style={styles.settingLeft}>
                <Feather name="lock" size={20} color={colors.text} style={styles.settingIcon} />
                <Text style={styles.settingText}>Change Password</Text>
              </View>
              <Feather name="chevron-right" size={20} color={colors.text} />
            </Pressable>
            
            <Pressable style={[styles.settingWithButton, styles.lastItem]} onPress={() => showComingSoon('Two-Factor Authentication')}>
              <View style={styles.settingLeft}>
                <Feather name="shield" size={20} color={colors.text} style={styles.settingIcon} />
                <Text style={styles.settingText}>Two-Factor Authentication</Text>
              </View>
              <Switch
                value={false}
                onValueChange={() => showComingSoon('Two-Factor Authentication')}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#FFFFFF"
              />
            </Pressable>
          </View>
        </View>
        
        {/* Support & Legal */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support & Legal</Text>
          
          <View style={styles.settingsContainer}>
            <Pressable style={styles.settingItem} onPress={() => showComingSoon('Help & Support')}>
              <View style={styles.settingLeft}>
                <Feather name="help-circle" size={20} color={colors.text} style={styles.settingIcon} />
                <Text style={styles.settingText}>Help & Support</Text>
              </View>
              <Feather name="chevron-right" size={20} color={colors.text} />
            </Pressable>
            
            <Pressable style={styles.settingItem} onPress={() => showComingSoon('Terms of Service')}>
              <View style={styles.settingLeft}>
                <Feather name="file-text" size={20} color={colors.text} style={styles.settingIcon} />
                <Text style={styles.settingText}>Terms of Service</Text>
              </View>
              <Feather name="chevron-right" size={20} color={colors.text} />
            </Pressable>
            
            <Pressable style={[styles.settingItem, styles.lastItem]} onPress={() => showComingSoon('Privacy Policy')}>
              <View style={styles.settingLeft}>
                <Feather name="shield" size={20} color={colors.text} style={styles.settingIcon} />
                <Text style={styles.settingText}>Privacy Policy</Text>
              </View>
              <Feather name="chevron-right" size={20} color={colors.text} />
            </Pressable>
          </View>
          <Pressable style={styles.deleteButton} onPress={handleDeleteAccount}>
          <Feather name="trash-2" size={20} color="white" style={styles.deleteIcon} />
          <Text style={styles.deleteText}>Delete Account</Text>
        </Pressable>
        </View>
        
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  bottomSpacing: {
    height: 40,
  },
  backgroundImage: {
    position: 'absolute',
    bottom: 0,
    resizeMode: 'cover',
    opacity: 0.1, 
    zIndex: 0, 
  },
  scrollContent: {
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: colors.text,
  },
  section: {
    marginTop: 24, // Consistent spacing between sections
    marginHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  settingsContainer: {
    backgroundColor: colors.card,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  userInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  settingWithButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...Platform.select({
      ios: {
        paddingVertical: 14,
      },
      android: {
        paddingVertical: 12,
      },
    }),
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  lastItem: {
    borderBottomWidth: 0, // Remove border from last item
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    marginRight: 12,
  },
  settingText: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
  },
  settingSubtext: {
    fontSize: 14,
    color: colors.text,
    opacity: 0.6,
    marginTop: 2,
  },
  bottomSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: colors.background,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    marginTop:24,
  },
  deleteIcon: {
    marginRight: 8,
  },
  deleteText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});