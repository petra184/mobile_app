import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/constants/colors';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import Animated, { useAnimatedStyle, withTiming, useSharedValue, withSpring } from "react-native-reanimated"
import { router } from 'expo-router';


interface PointsCardProps {
  points: number;
  rank: string;
  gamesAttended: number;
  streakDays: number;
}

export default function PointsCard({ 
  points, 
  rank, 
  gamesAttended, 
  streakDays, 
}: PointsCardProps) {

  const scale = useSharedValue(1)
  const opacity = useSharedValue(1)
    
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }))
  
  const handlePressIn = () => {
    scale.value = withSpring(0.96, { damping: 15 })
    opacity.value = withTiming(0.8, { duration: 100 })
  }
    
  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15 })
    opacity.value = withTiming(1, { duration: 150 })
  }

  const handlePress = () => {
    router.push("../all_cards/points")
  }


  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        android_ripple={{ color: "rgba(0, 0, 0, 0.1)", borderless: false }}>
      <LinearGradient
        colors={[colors.primary, colors.accent]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.container}
      >
        <View style={styles.content}>
          <View style={styles.header}>
          <FontAwesome6 name="ranking-star" color="white" size={24} />
            <Text style={styles.rankText}>{rank}</Text>
          </View>
          
          <View style={styles.pointsContainer}>
            <Text style={styles.pointsValue}>{points}</Text>
            <Text style={styles.pointsLabel}>POINTS</Text>
          </View>
          
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{gamesAttended}</Text>
              <Text style={styles.statLabel}>Games</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{streakDays}</Text>
              <Text style={styles.statLabel}>Day Streak</Text>
            </View>
          </View>
        </View>
      </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: 'hidden',
    marginHorizontal: 16,
    elevation: 4,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  rankText: {
    color: "white",
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  pointsContainer: {
    alignItems: 'center',
    marginVertical: 8,
  },
  pointsValue: {
    color: "white",
    fontSize: 42,
    fontWeight: 'bold',
  },
  pointsLabel: {
    color: "white",
    fontSize: 14,
    opacity: 0.8,
    letterSpacing: 1,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    padding: 12,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    color: "white",
    fontSize: 18,
    fontWeight: 'bold',
  },
  statLabel: {
    color: "white",
    fontSize: 12,
    opacity: 0.8,
  },
  divider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 8,
  },
});