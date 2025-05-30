import React from 'react';
import { View, Text, StyleSheet, Pressable, Share, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/constants/colors';
import { useUserStore } from '@/hooks/userStore';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';


export default function QRCodeScreen() {
  const { points } = useUserStore();
  
  // Generate a unique code for the user
  const userCode = `USER-${Math.floor(1000 + Math.random() * 9000)}-POINTS-${points}`;
  
  const handleShare = async () => {
    try {
      await Share.share({
        message: `Scan my fan code: ${userCode}`,
        title: 'My Fan QR Code',
      });
    } catch (error) {
      console.error('Error sharing QR code:', error);
    }
  };
  
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>        
        <Text style={styles.instructions}>
          Show this QR code at games, events, and merchandise stores to earn points and unlock rewards!
        </Text>
        
        <LinearGradient
          colors={[colors.primary, colors.accent]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.qrContainer}
        >
          <View style={styles.qrBackground}>
            {/* This would be a real QR code in a production app */}
            <Ionicons name="qr-code-outline" size={200} color={colors.text} />
            <Text style={styles.qrText}>{userCode}</Text>
          </View>
        </LinearGradient>
        
        <View style={styles.pointsContainer}>
          <Text style={styles.pointsLabel}>Current Points</Text>
          <Text style={styles.pointsValue}>{points}</Text>
        </View>
        
        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>How It Works</Text>
          <Text style={styles.infoText}>
            1. Show your QR code at participating locations
          </Text>
          <Text style={styles.infoText}>
            2. Staff will scan your code to award points
          </Text>
          <Text style={styles.infoText}>
            3. Earn points for attending games, buying merchandise, and more
          </Text>
          <Text style={styles.infoText}>
            4. Redeem your points for exclusive rewards
          </Text>
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
    paddingBottom: 0,
    paddingTop:0,
  },
  bottomSpacing: {
    height: 40,
  },
  content: {
    alignItems: 'center',
    marginTop: 70,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  instructions: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 16,
    lineHeight: 24,
  },
  qrContainer: {
    padding: 16,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  qrBackground: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  qrText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  pointsContainer: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 24,
    width: '80%',
  },
  pointsLabel: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  pointsValue: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.success,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 32,
    width: '80%',
  },
  buttonIcon: {
    marginRight: 8,
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  infoContainer: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    width: '90%',
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  infoText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
});