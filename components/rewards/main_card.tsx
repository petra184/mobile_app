// import React from 'react';
// import { View, Text, StyleSheet } from 'react-native';
// import { colors } from '@/constants/colors';
// import Feather from '@expo/vector-icons/Feather';
// import { LinearGradient } from 'expo-linear-gradient';


// interface PointsCardProps {
//   points: number;
// }


// export const PointsCard: React.FC<PointsCardProps> = ({ points }) => {
//   return (
//     <LinearGradient
//       colors={[colors.primary, colors.accent]}
//       start={{ x: 0, y: 0 }}
//       end={{ x: 1, y: 1 }}
//       style={styles.container}
//     >
//       <View style={styles.content}>
//         <View style={styles.iconContainer}>
//         <Feather name="award" size={28} color="#FFFFFF" />
//         </View>
//         <View style={styles.textContainer}>
//           <Text style={styles.label}>Fan Points</Text>
//           <Text style={styles.points}>{points}</Text>
//         </View>
//       </View>
//       <Text style={styles.description}>
//         Earn points by attending games, purchasing merchandise, and more!
//       </Text>
//     </LinearGradient>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     borderRadius: 16,
//     padding: 20,
//     marginHorizontal: 16,
//     marginVertical: 16,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.2,
//     shadowRadius: 8,
//     elevation: 4,
//   },
//   content: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 12,
//   },
//   iconContainer: {
//     backgroundColor: 'rgba(255, 255, 255, 0.2)',
//     borderRadius: 12,
//     padding: 10,
//     marginRight: 16,
//   },
//   textContainer: {
//     flex: 1,
//   },
//   label: {
//     fontSize: 14,
//     fontWeight: '600',
//     color: 'rgba(255, 255, 255, 0.8)',
//     marginBottom: 4,
//   },
//   points: {
//     fontSize: 32,
//     fontWeight: '700',
//     color: '#FFFFFF',
//   },
//   description: {
//     fontSize: 12,
//     color: 'rgba(255, 255, 255, 0.8)',
//     lineHeight: 18,
//   },
// });

// export default PointsCard;

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/constants/colors';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';

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
  return (
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