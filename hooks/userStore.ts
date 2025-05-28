import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserPreferences, QRCodeScan } from '@/types';


interface UserState {
  points: number;
  scanHistory: QRCodeScan[];
  preferences: UserPreferences;
  
  // Actions
  addPoints: (points: number, description: string) => void;
  redeemPoints: (points: number) => boolean;
  addScan: (scan: Omit<QRCodeScan, 'id' | 'scannedAt'>) => void;
  toggleFavoriteTeam: (teamId: string) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
}


export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      points: 350, // Starting points
      scanHistory: [],
      preferences: {
        favoriteTeams: ['1'], // Default to Golden Eagles
        notificationsEnabled: true,
      },
      
      addPoints: (points, description) => {
        set(state => ({
          points: state.points + points,
        }));
        
        // Add to scan history
        get().addScan({ points, description });
      },
      
      redeemPoints: (points) => {
        const currentPoints = get().points;
        if (currentPoints >= points) {
          set(state => ({
            points: state.points - points,
          }));
          return true;
        }
        return false;
      },
      
      addScan: (scan) => {
        const newScan: QRCodeScan = {
          id: Date.now().toString(),
          ...scan,
          scannedAt: new Date().toISOString(),
        };
        
        set(state => ({
          scanHistory: [newScan, ...state.scanHistory],
        }));
      },
      
      toggleFavoriteTeam: (teamId) => {
        set(state => {
          const isFavorite = state.preferences.favoriteTeams.includes(teamId);
          const favoriteTeams = isFavorite
            ? state.preferences.favoriteTeams.filter(id => id !== teamId)
            : [...state.preferences.favoriteTeams, teamId];
          
          return {
            preferences: {
              ...state.preferences,
              favoriteTeams,
            },
          };
        });
      },
      
      setNotificationsEnabled: (enabled) => {
        set(state => ({
          preferences: {
            ...state.preferences,
            notificationsEnabled: enabled,
          },
        }));
      },
    }),
    {
      name: 'user-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);