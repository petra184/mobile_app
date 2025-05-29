import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Switch, Image, Platform, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/constants/colors';
import { useUserStore } from '@/hooks/userStore';
import { getTeams, type Team } from '@/app/actions/teams';
import { signOut } from '@/app/actions/main_actions';
import Feather from '@expo/vector-icons/Feather';

export default function ProfileScreen() {
  const router = useRouter();
  
  // Get user data from userStore instead of separate API calls
  const { 
    userEmail, 
    points, 
    preferences, 
    setNotificationsEnabled, 
    refreshUserData,
    isLoading,
    isPointsLoading,
    getUserName
  } = useUserStore();
  
  const [isEditing, setIsEditing] = useState(false);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(true);
  const [updatingPreferences, setUpdatingPreferences] = useState(false);

  async function loadTeams() {
    try {
      setLoadingTeams(true);
      const fetchedTeams = await getTeams();
      setTeams(fetchedTeams);
    } catch (error) {
      console.error('Error loading teams:', error);
    } finally {
      setLoadingTeams(false);
    }
  }

  useEffect(() => {
    // Refresh user data to ensure we have the latest points and name
    refreshUserData();
    loadTeams();
  }, []);

  // Get favorite teams
  const favoriteTeams = teams.filter(team => 
    preferences.favoriteTeams.includes(team.id)
  );
  
  const handleToggleNotifications = async (value: boolean) => {
    try {
      setUpdatingPreferences(true);
      await setNotificationsEnabled(value);
    } catch (error) {
      console.error('Error toggling notifications:', error);
    } finally {
      setUpdatingPreferences(false);
    }
  };

  const navigateToEditProfile = () => {
    router.push('/user_profile/edit_profile');
  };

  const navigateToManageFavoriteTeams = () => {
    router.push('/user_profile/manage_fav_teams');
  };

  const navigateToAccountSettings = () => {
    router.push('/user_profile/account_settings');
  };
  
  return (
    <>
      <SafeAreaView style={styles.container} edges={['top']}>
        <Image
          source={require('../../IMAGES/crowd.jpg')}
          style={styles.backgroundImage}
        />
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <Pressable 
              onPress={() => router.back()} 
              style={{ marginRight: 16 }}>
              <Feather name="chevron-left" size={24} color={colors.primary} style={styles.arrow}/>
            </Pressable>
          <View style={styles.profileImageContainer}>
            <Feather name="user" size={60} color={colors.primary} />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{getUserName()}</Text>
            <Text style={styles.profileEmail}>{userEmail || 'No email'}</Text>
            <View style={styles.pointsContainer}>
              <Feather name="award" size={16} color={colors.primary} />
              {isPointsLoading ? (
                <ActivityIndicator size="small" color={colors.primary} style={{ marginLeft: 4 }} />
              ) : (
                <Text style={styles.pointsText}>{points} Points</Text>
              )}
            </View>
          </View>
          <View style={styles.editProfileButtonBck}>
            <Pressable style={styles.editProfileButton} onPress={navigateToEditProfile}>
               <Feather name="edit-2" size={20} color={colors.primary}/>
            </Pressable>
          </View>
        </View>
        
        <View style={styles.contentContainer}>
          <ScrollView 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Favorite Teams */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Favorite Teams</Text>
                <Pressable onPress={() => setIsEditing(!isEditing)}>
                  <Text style={styles.editButton}>{isEditing ? 'Done' : 'Edit'}</Text>
                </Pressable>
              </View>
              
              {loadingTeams ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={styles.loadingText}>Loading teams...</Text>
                </View>
              ) : favoriteTeams.length > 0 ? (
                <View style={styles.favoriteTeamsContainer}>
                  {favoriteTeams.map(team => (
                    <View key={team.id} style={styles.teamItem}>
                      <Image 
                        source={require("@/IMAGES/MAIN_LOGO.png")} 
                        style={styles.teamLogo} 
                      />
                      <View style={styles.teamInfo}>
                        <Text style={styles.teamName}>{team.name}</Text>
                        <Text style={styles.teamSport}>{team.gender} {team.sport}</Text>
                      </View>
                      {isEditing && (
                        <Pressable style={styles.removeButton}>
                          <Text style={styles.removeButtonText}>Remove</Text>
                        </Pressable>
                      )}
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.emptyText}>No favorite teams selected</Text>
              )}
            </View>
          </ScrollView>
          
          {/* Settings - Fixed at bottom */}
          <View style={styles.bottomContainer}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Settings</Text>
              
              <View style={styles.settingsContainer}>
                <View style={styles.settingItem}>
                  <View style={styles.settingLeft}>
                     <Feather name="bell" size={20} color={colors.text} style={styles.settingIcon} />
                    <Text style={styles.settingText}>Notifications</Text>
                  </View>
                  {updatingPreferences ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <Switch
                      value={preferences.notificationsEnabled}
                      onValueChange={handleToggleNotifications}
                      trackColor={{ false: colors.border, true: colors.primary }}
                      thumbColor="#FFFFFF"
                    />
                  )}
                </View>
                
                <Pressable style={styles.settingItem} onPress={navigateToManageFavoriteTeams}>
                  <View style={styles.settingLeft}>
                      <Feather name="heart" size={20} color={colors.text} style={styles.settingIcon} />
                    <Text style={styles.settingText}>Manage Favorite Teams</Text>
                  </View>
                    <Feather name="chevron-right" size={20} color={colors.textSecondary} />
                </Pressable>
                
                <Pressable style={styles.settingItem} onPress={navigateToAccountSettings}>
                  <View style={styles.settingLeft}>
                    <Feather name="settings" size={20} color={colors.text} style={styles.settingIcon} />
                    <Text style={styles.settingText}>Account Settings</Text>
                  </View>
                  <Feather name="chevron-right" size={20} color={colors.textSecondary} />
                </Pressable>
              </View>

              {/* Logout Button */}
              <Pressable 
                style={styles.logoutButton} 
                onPress={async () => {
                  try {
                    const result = await signOut();
                    
                    if (result.success) {
                      router.push('/');
                    } else {
                      console.error("Sign out failed:", result.message);
                    }
                  } catch (error) {
                    console.error("Error during sign out:", error);
                  }
                }}
              >
                <Feather name="log-out" size={20} color={colors.error} style={styles.logoutIcon} />
                <Text style={styles.logoutText}>Log Out</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    top: 0,
  },
  contentContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  bottomContainer: {
    width: '100%',
    paddingBottom: Platform.OS === 'ios' ? 20 : 10,
  },
  arrow: {
    position: 'absolute',
    ...Platform.select({
        android:{
            top: -60,
        }
    }),
  },
  backgroundImage: {
    position: 'absolute',
    bottom: 0,
    resizeMode: 'cover',
    opacity: 0.1, 
    zIndex: 0, 
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    ...Platform.select({
      ios: {
        paddingTop: 65,
      },
    }),
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    position: "relative"
  },
  editProfileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editProfileButtonBck: {
    paddingTop: 20,
  },
  profileImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    marginTop: 30,
  },
  profileInfo: {
    flex: 1,
    paddingTop: 20,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  pointsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pointsText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    marginLeft: 4,
  },
  section: {
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  editButton: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 16,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: colors.textSecondary,
  },
  favoriteTeamsContainer: {
    gap: 12,
  },
  teamItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  teamLogo: {
    width: 40,
    height: 32,
    marginRight: 12,
  },
  teamInfo: {
    flex: 1,
  },
  teamName: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 2,
  },
  teamSport: {
    fontSize: 12,
    color: colors.textSecondary,
    textTransform: 'capitalize',
  },
  removeButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  removeButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.error,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginVertical: 16,
  },
  settingsContainer: {
    backgroundColor: colors.background,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 56,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingIcon: {
    marginRight: 12,
  },
  settingText: {
    fontSize: 16,
    color: colors.text,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    marginHorizontal: 16,
    marginVertical: 24,
    paddingVertical: 12,
    borderRadius: 8,
    height: 48,
  },
  logoutIcon: {
    marginRight: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.error,
  },
});