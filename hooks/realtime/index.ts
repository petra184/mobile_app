// hooks/useGameRealtime.js
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase'; // Adjust path as needed
import { RealtimeChannel } from '@supabase/supabase-js';

export const useGameRealtime = (onGameUpdate:any) => {
  const [isConnected, setIsConnected] = useState(false);
  const [channels, setChannels] = useState<Record<string, RealtimeChannel>>({});

  const setupRealtimeSubscriptions = useCallback(async () => {
    try {
      // Set authentication for private channels
      await supabase.realtime.setAuth();
      
      // Game Schedule Channel
      const gameScheduleChannel = supabase
        .channel('game_schedule_changes', {
          config: { private: true }
        })
        .on('broadcast', { event: 'INSERT' }, (payload) => {
          console.log('New game scheduled:', payload);
          onGameUpdate?.('INSERT', payload);
        })
        .on('broadcast', { event: 'UPDATE' }, (payload) => {
          console.log('Game updated:', payload);
          onGameUpdate?.('UPDATE', payload);
        })
        .on('broadcast', { event: 'DELETE' }, (payload) => {
          console.log('Game deleted:', payload);
          onGameUpdate?.('DELETE', payload);
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('Game schedule realtime connected');
            setIsConnected(true);
          } else if (status === 'CHANNEL_ERROR') {
            console.error('Game schedule realtime connection failed');
            setIsConnected(false);
          }
        });

      // Stories Channel (for news updates)
      const storiesChannel = supabase
        .channel('stories_changes', {
          config: { private: true }
        })
        .on('broadcast', { event: 'INSERT' }, (payload) => {
          console.log('New story published:', payload);
          // You can handle story updates here if needed
        })
        .on('broadcast', { event: 'UPDATE' }, (payload) => {
          console.log('Story updated:', payload);
        })
        .on('broadcast', { event: 'DELETE' }, (payload) => {
          console.log('Story deleted:', payload);
        })
        .subscribe();

      const channelMap = {
        gameSchedule: gameScheduleChannel,
        stories: storiesChannel,
      };

      setChannels(channelMap);
      return channelMap;
    } catch (error) {
      console.error('Error setting up realtime:', error);
      setIsConnected(false);
    }
  }, [onGameUpdate]);

  const cleanupSubscriptions = useCallback(() => {
    Object.values(channels).forEach(channel => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    });
    setChannels({});
    setIsConnected(false);
  }, [channels]);

  return {
    setupRealtimeSubscriptions,
    cleanupSubscriptions,
    isConnected,
  };
};