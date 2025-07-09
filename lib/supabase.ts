import { AppState } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient,RealtimeChannel } from '@supabase/supabase-js'

const supabaseUrl = "https://xptyaqqaagptqppjdiyn.supabase.co"
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhwdHlhcXFhYWdwdHFwcGpkaXluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA0MDg2NTAsImV4cCI6MjA1NTk4NDY1MH0.sldn7AS2cCKSLdHRGOXe-P68IY9IGcjoxnzAMyqiTr8"

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})

// Tells Supabase Auth to continuously refresh the session automatically
// if the app is in the foreground. When this is added, you will continue
// to receive `onAuthStateChange` events with the `TOKEN_REFRESHED` or
// `SIGNED_OUT` event if the user's session is terminated. This should
// only be registered once.
AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    supabase.auth.startAutoRefresh()
  } else {
    supabase.auth.stopAutoRefresh()
  }
})

// Set up realtime subscriptions
const setupRealtimeSubscriptions = async () => {
  // Make sure user is authenticated for private channels
  await supabase.realtime.setAuth();

  // Subscribe to game_schedule changes
  const gameScheduleChannel = supabase
    .channel('game_schedule_changes', {
      config: { private: true }
    })
    .on('broadcast', { event: 'INSERT' }, (payload) => {
      console.log('Game schedule inserted:', payload);
      // Handle new game schedule
    })
    .on('broadcast', { event: 'UPDATE' }, (payload) => {
      console.log('Game schedule updated:', payload);
      // Handle game schedule update
    })
    .on('broadcast', { event: 'DELETE' }, (payload) => {
      console.log('Game schedule deleted:', payload);
      // Handle game schedule deletion
    })
    .subscribe();

  // Subscribe to stories changes
  const storiesChannel = supabase
    .channel('stories_changes', {
      config: { private: true }
    })
    .on('broadcast', { event: 'INSERT' }, (payload) => {
      console.log('Story inserted:', payload);
    })
    .on('broadcast', { event: 'UPDATE' }, (payload) => {
      console.log('Story updated:', payload);
    })
    .on('broadcast', { event: 'DELETE' }, (payload) => {
      console.log('Story deleted:', payload);
    })
    .subscribe();

  // Subscribe to coaches changes
  const coachesChannel = supabase
    .channel('coaches_changes', {
      config: { private: true }
    })
    .on('broadcast', { event: 'INSERT' }, (payload) => {
      console.log('Coach inserted:', payload);
    })
    .on('broadcast', { event: 'UPDATE' }, (payload) => {
      console.log('Coach updated:', payload);
    })
    .on('broadcast', { event: 'DELETE' }, (payload) => {
      console.log('Coach deleted:', payload);
    })
    .subscribe();

  // Subscribe to players changes
  const playersChannel = supabase
    .channel('players_changes', {
      config: { private: true }
    })
    .on('broadcast', { event: 'INSERT' }, (payload) => {
      console.log('Player inserted:', payload);
    })
    .on('broadcast', { event: 'UPDATE' }, (payload) => {
      console.log('Player updated:', payload);
    })
    .on('broadcast', { event: 'DELETE' }, (payload) => {
      console.log('Player deleted:', payload);
    })
    .subscribe();

  return {
    gameScheduleChannel,
    storiesChannel,
    coachesChannel,
    playersChannel
  };
};

// Clean up subscriptions
const cleanupSubscriptions = (channels: Record<string, RealtimeChannel>) => {
  Object.values(channels).forEach(channel => {
    supabase.removeChannel(channel);
  });
};
