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

interface UserState {
  // Data
  userId: string | null;
  userEmail: string | null;
  points: number;
  scanHistory: QRCodeScan[];
  preferences: UserPreferences;
  
  // Loading states
  isLoading: boolean;
  isPointsLoading: boolean;
  isScanHistoryLoading: boolean;
  
  // Actions
  setUser: (userId: string, email?: string) => Promise<void>;
  initializeUser: (userId: string, email?: string) => Promise<void>;
  refreshUserData: () => Promise<void>;
  addPoints: (points: number, description: string) => Promise<void>;
  redeemPoints: (points: number) => Promise<boolean>;
  addScan: (scan: Omit<QRCodeScan, 'id' | 'scannedAt'>) => Promise<void>;
  toggleFavoriteTeam: (teamId: string) => Promise<void>;
  setNotificationsEnabled: (enabled: boolean) => Promise<void>;
  clearUserData: () => void;
  isUserLoggedIn: () => boolean;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      // Initial state
      userId: null,
      userEmail: null,
      points: 0,
      scanHistory: [],
      preferences: {
        favoriteTeams: [],
        notificationsEnabled: true,
      },
      isLoading: false,
      isPointsLoading: false,
      isScanHistoryLoading: false,
      
      // Set user and initialize data
      setUser: async (userId: string, email?: string) => {
        set({ userId, userEmail: email });
        await get().initializeUser(userId, email);
      },
      
      // Initialize user data from database
      initializeUser: async (userId: string, email?: string) => {
        set({ isLoading: true, userId, userEmail: email });
        
        try {
          // Fetch user data from database
          const [userProfile, scanHistory, userPreferences] = await Promise.all([
            getUserProfile(userId),
            getUserScanHistory(userId),
            getUserPreferences(userId)
          ]);
          
          set({
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
      
      // Check if user is logged in
      isUserLoggedIn: () => {
        const { userId } = get();
        return !!userId;
      },
      
      // Refresh user data
      refreshUserData: async () => {
        const { userId } = get();
        if (!userId) return;
        
        try {
          const userProfile = await getUserProfile(userId);
          set({ points: userProfile?.points || 0 });
        } catch (error) {
          console.error('Failed to refresh user data:', error);
        }
      },
      
      // Add points with database sync
      addPoints: async (points: number, description: string) => {
        const { userId } = get();
        if (!userId) return;
        
        set({ isPointsLoading: true });
        
        try {
          // Optimistically update UI
          set(state => ({
            points: state.points + points,
          }));
          
          // Update database
          await updateUserPoints(userId, points, 'add');
          
          // Add to scan history
          await get().addScan({ points, description });
          
        } catch (error) {
          console.error('Failed to add points:', error);
          
          // Revert optimistic update
          set(state => ({
            points: state.points - points,
          }));
        } finally {
          set({ isPointsLoading: false });
        }
      },
      
      // Redeem points with database sync
      redeemPoints: async (points: number) => {
        const { userId, points: currentPoints } = get();
        if (!userId) return false;
        
        if (currentPoints < points) {
          return false;
        }
        
        set({ isPointsLoading: true });
        
        try {
          // Optimistically update UI
          set(state => ({
            points: state.points - points,
          }));
          
          // Update database
          await updateUserPoints(userId, points, 'subtract');
          
          return true;
          
        } catch (error) {
          console.error('Failed to redeem points:', error);
          
          // Revert optimistic update
          set(state => ({
            points: state.points + points,
          }));
          
          return false;
        } finally {
          set({ isPointsLoading: false });
        }
      },
      
      // Add scan with database sync
      addScan: async (scan: Omit<QRCodeScan, 'id' | 'scannedAt'>) => {
        const { userId } = get();
        if (!userId) return;
        
        try {
          const newScan: QRCodeScan = {
            id: Date.now().toString(),
            ...scan,
            scannedAt: new Date().toISOString(),
          };
          
          // Optimistically update UI
          set(state => ({
            scanHistory: [newScan, ...state.scanHistory],
          }));
          
          // Save to database
          await addUserScan(userId, newScan);
          
        } catch (error) {
          console.error('Failed to add scan:', error);
          
          // Revert optimistic update
          set(state => ({
            scanHistory: state.scanHistory.slice(1),
          }));
        }
      },
      
      // Toggle favorite team with database sync
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
          
          // Optimistically update UI
          set({ preferences: newPreferences });
          
          // Update database
          await updateUserPreferences(userId, newPreferences);
          
        } catch (error) {
          console.error('Failed to toggle favorite team:', error);
          
          // Revert optimistic update
          await get().refreshUserData();
        }
      },
      
      // Set notifications enabled with database sync
      setNotificationsEnabled: async (enabled: boolean) => {
        const { userId, preferences } = get();
        if (!userId) return;
        
        try {
          const newPreferences = {
            ...preferences,
            notificationsEnabled: enabled,
          };
          
          // Optimistically update UI
          set({ preferences: newPreferences });
          
          // Update database
          await updateUserPreferences(userId, newPreferences);
          
        } catch (error) {
          console.error('Failed to update notification settings:', error);
          
          // Revert optimistic update
          set(state => ({
            preferences: {
              ...state.preferences,
              notificationsEnabled: !enabled,
            },
          }));
        }
      },
      
      // Clear user data (for logout)
      clearUserData: () => {
        set({
          userId: null,
          userEmail: null,
          points: 0,
          scanHistory: [],
          preferences: {
            favoriteTeams: [],
            notificationsEnabled: true,
          },
          isLoading: false,
          isPointsLoading: false,
          isScanHistoryLoading: false,
        });
      },
    }),
    {
      name: 'user-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist essential data, not loading states
      partialize: (state) => ({
        userId: state.userId,
        userEmail: state.userEmail,
        points: state.points,
        scanHistory: state.scanHistory,
        preferences: state.preferences,
      }),
    }
  )
);