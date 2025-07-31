import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { colors } from '@/constants/Colors';

export default function ConfirmSignupScreen() {
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('Verifying your email...');
  const router = useRouter();

  useEffect(() => {
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          setLoading(false);
          setMessage('Email verified successfully!');
          
          // Redirect to main app after a short delay
          setTimeout(() => {
            router.replace('../(main)');
          }, 2000);
        } else if (event === 'SIGNED_OUT') {
          setLoading(false);
          setMessage('Verification failed. Please try again.');
          
          setTimeout(() => {
            router.replace('/(auth)/login');
          }, 2000);
        }
      }
    );

    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setLoading(false);
        setMessage('Email verified successfully!');
        setTimeout(() => {
          router.replace('../(main)');
        }, 2000);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {loading && <ActivityIndicator size="large" color={colors.primary} />}
        <Text style={styles.message}>{message}</Text>
        {!loading && (
          <Text style={styles.subMessage}>
            Redirecting you to the app...
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    alignItems: 'center',
  },
  message: {
    fontSize: 18,
    textAlign: 'center',
    marginTop: 20,
    color: colors.text,
    fontWeight: '600',
  },
  subMessage: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 10,
    color: colors.textSecondary,
  },
});