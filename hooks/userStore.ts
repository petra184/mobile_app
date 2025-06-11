import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserPreferences, QRCodeScan } from '@/types/index';

// Import your database actions
import { 
  getUserProfile, 
  updateUserPoints, 
  getUserScanHistory, 
  addUserScan,
  updateUserPreferences,
  getUserPreferences 
} from '@/app/actions/users';

import { getCurrentUser } from '@/app/actions/main_actions';

interface UserState {
  // Data
  userId: string | null;
  userEmail: string | null;
  first_name: string | null;
  last_name: string | null;
  points: number;
  scanHistory: QRCodeScan[];
  preferences: UserPreferences;
  
  // NEW: Remember Me functionality
  rememberMe: boolean;
  
  // Loading states
  isLoading: boolean;
  isPointsLoading: boolean;
  isScanHistoryLoading: boolean;
  
  // Actions
  setUser: (userId: string, email?: string, remember?: boolean) => Promise<void>;
  initializeUser: (userId: string, email?: string) => Promise<void>;
  refreshUserData: () => Promise<void>;
  addPoints: (points: number, description: string) => Promise<void>;
  redeemPoints: (points: number) => Promise<boolean>;
  addScan: (scan: Omit<QRCodeScan, 'id' | 'scannedAt'>) => Promise<void>;
  toggleFavoriteTeam: (teamId: string) => Promise<void>;
  setNotificationsEnabled: (enabled: boolean) => Promise<void>;
  clearUserData: () => void;
  isUserLoggedIn: () => boolean;
  getUserName: () => string;
  getUserFirstName: () => string;
  
  // NEW: Check if user should be auto-logged in
  shouldAutoLogin: () => boolean;
}

function capitalize(name: string) {
  return name
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      // Initial state
      userId: null,
      userEmail: null,
      first_name: null,
      last_name: null,
      points: 0,
      scanHistory: [],
      preferences: {
        favoriteTeams: [],
        notificationsEnabled: true,
      },
      rememberMe: false, // NEW: Default to false
      isLoading: false,
      isPointsLoading: false,
      isScanHistoryLoading: false,

      getUserFirstName: () => {
        const { first_name } = get();
        
        if (first_name) {
          return capitalize(first_name);
        }
        
        return 'User';
      },
      
      getUserName: () => {
        const { first_name, last_name } = get();
        
        if (first_name && last_name) {
          return `${capitalize(first_name)} ${capitalize(last_name)}`;
        } else if (first_name) {
          return capitalize(first_name);
        } else if (last_name) {
          return capitalize(last_name);
        }
        
        return 'User';
      },
      
      // UPDATED: Set user with remember preference
      setUser: async (userId: string, email?: string, remember: boolean = false) => {
        set({ 
          userId, 
          userEmail: email, 
          rememberMe: remember 
        });
        await get().initializeUser(userId, email);
      },
      
      // Initialize user data from database
      initializeUser: async (userId: string, email?: string) => {
        set({ isLoading: true, userId, userEmail: email });
        
        try {
          const [userProfile, scanHistory, userPreferences, authUserData] = await Promise.all([
            getUserProfile(userId),
            getUserScanHistory(userId),
            getUserPreferences(userId),
            getCurrentUser()
          ]);
          
          console.log('=== DEBUG USER DATA ===');
          console.log('User profile from getUserProfile:', userProfile);
          console.log('Auth user metadata from getCurrentUser:', authUserData);
          console.log('User preferences:', userPreferences);
          console.log('========================');
          
          const firstName = userProfile?.first_name || authUserData?.first_name || null;
          const lastName = userProfile?.last_name || authUserData?.last_name || null;
          
          console.log('Final names - firstName:', firstName, 'lastName:', lastName);
          
          set({
            first_name: firstName,
            last_name: lastName,
            points: userProfile?.points || 0,
            scanHistory: scanHistory || [],
            preferences: userPreferences || {
              favoriteTeams: [],
              notificationsEnabled: true,
            },
            isLoading: false,
          });
          
        } catch (error) {
          console.error('Failed to initialize user data:', error);
          set({ isLoading: false });
        }
      },
      
      // NEW: Check if user should be auto-logged in
      shouldAutoLogin: () => {
        const { userId, rememberMe } = get();
        return !!(userId && rememberMe);
      },
      
      // UPDATED: Check if user is logged in
      isUserLoggedIn: () => {
        return get().shouldAutoLogin();
      },
      
      // ... all your other existing methods (addPoints, redeemPoints, etc.) ...
      
      refreshUserData: async () => {
        const { userId } = get();
        if (!userId) return;
        
        try {
          const [userProfile, authUserData] = await Promise.all([
            getUserProfile(userId),
            getCurrentUser()
          ]);
          
          const firstName = userProfile?.first_name || authUserData?.first_name || null;
          const lastName = userProfile?.last_name || authUserData?.last_name || null;
          
          set({ 
            first_name: firstName,
            last_name: lastName,
            points: userProfile?.points || 0 
          });
        } catch (error) {
          console.error('Failed to refresh user data:', error);
        }
      },

      addPoints: async (points: number, description: string) => {
        const { userId } = get();
        if (!userId) return;
        
        set({ isPointsLoading: true });
        
        try {
          set(state => ({
            points: state.points + points,
          }));
          
          await updateUserPoints(userId, points, 'add');
          await get().addScan({ points, description });
          
        } catch (error) {
          console.error('Failed to add points:', error);
          set(state => ({
            points: state.points - points,
          }));
        } finally {
          set({ isPointsLoading: false });
        }
      },

      redeemPoints: async (points: number) => {
        const { userId, points: currentPoints } = get();
        if (!userId) return false;
        
        if (currentPoints < points) {
          return false;
        }
        
        set({ isPointsLoading: true });
        
        try {
          set(state => ({
            points: state.points - points,
          }));
          
          await updateUserPoints(userId, points, 'subtract');
          return true;
          
        } catch (error) {
          console.error('Failed to redeem points:', error);
          set(state => ({
            points: state.points + points,
          }));
          return false;
        } finally {
          set({ isPointsLoading: false });
        }
      },

      addScan: async (scan: Omit<QRCodeScan, 'id' | 'scannedAt'>) => {
        const { userId } = get();
        if (!userId) return;
        
        try {
          const newScan: QRCodeScan = {
            id: Date.now().toString(),
            ...scan,
            scannedAt: new Date().toISOString(),
          };
          
          set(state => ({
            scanHistory: [newScan, ...state.scanHistory],
          }));
          
          await addUserScan(userId, newScan);
          
        } catch (error) {
          console.error('Failed to add scan:', error);
          set(state => ({
            scanHistory: state.scanHistory.slice(1),
          }));
        }
      },

      toggleFavoriteTeam: async (teamId: string) => {
        const { userId, preferences } = get();
        if (!userId) return;
        
        try {
          const isFavorite = preferences.favoriteTeams.includes(teamId);
          const favoriteTeams = isFavorite
            ? preferences.favoriteTeams.filter(id => id !== teamId)
            : [...preferences.favoriteTeams, teamId];
          
          const newPreferences = {
            ...preferences,
            favoriteTeams,
          };
          
          set({ preferences: newPreferences });
          await updateUserPreferences(userId, newPreferences);
          
        } catch (error) {
          console.error('Failed to toggle favorite team:', error);
          try {
            const userPreferences = await getUserPreferences(userId);
            set({ 
              preferences: userPreferences || {
                favoriteTeams: [],
                notificationsEnabled: true,
              }
            });
          } catch (refreshError) {
            console.error('Failed to refresh preferences after error:', refreshError);
          }
          throw error;
        }
      },

      setNotificationsEnabled: async (enabled: boolean) => {
        const { userId, preferences } = get();
        if (!userId) return;
        
        try {
          const newPreferences = {
            ...preferences,
            notificationsEnabled: enabled,
          };
          
          set({ preferences: newPreferences });
          await updateUserPreferences(userId, newPreferences);
          
        } catch (error) {
          console.error('Failed to update notification settings:', error);
          set(state => ({
            preferences: {
              ...state.preferences,
              notificationsEnabled: !enabled,
            },
          }));
          throw error;
        }
      },
      
      // UPDATED: Clear user data and remember preference
      clearUserData: () => {
        set({
          userId: null,
          userEmail: null,
          first_name: null,
          last_name: null,
          points: 0,
          scanHistory: [],
          preferences: {
            favoriteTeams: [],
            notificationsEnabled: true,
          },
          rememberMe: false, // Reset remember preference
          isLoading: false,
          isPointsLoading: false,
          isScanHistoryLoading: false,
        });
      },
    }),
    {
      name: 'user-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // UPDATED: Conditionally persist userId based on rememberMe
      partialize: (state) => {
        const baseData = {
          userEmail: state.userEmail,
          first_name: state.first_name,
          last_name: state.last_name,
          points: state.points,
          scanHistory: state.scanHistory,
          preferences: state.preferences,
          rememberMe: state.rememberMe,
        };

        // Only persist userId if rememberMe is true
        if (state.rememberMe) {
          return {
            ...baseData,
            userId: state.userId,
          };
        }

        return baseData;
      },
    }
  )
);