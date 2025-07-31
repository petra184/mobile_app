import { colors } from '@/constants/Colors';
import { SpecialOffer } from '@/types/updated_types';
import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Dimensions, Image, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

interface SpecialOfferCardProps {
  offer: SpecialOffer;
  userPoints: number;
  onRedeem: (offer: SpecialOffer) => void;
  cardWidth?: number | `${number}%`;
}

export default function SpecialOfferCard({
  offer,
  userPoints,
  onRedeem,
  cardWidth = screenWidth * 0.7,
}: SpecialOfferCardProps) {
  const isExpired = new Date() > new Date(offer.end_date);
  const isAvailable = offer.is_active && !isExpired;
  const canRedeem = userPoints >= offer.points_required;

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handlePress = () => {
    onRedeem(offer); // Opens the modal
  };

  return (
    <Pressable
      style={[
        styles.card,
        { width: cardWidth },
        (!canRedeem || !isAvailable) && styles.unavailableCard,
      ]}
      onPress={handlePress}
      android_ripple={{ color: 'rgba(0,0,0,0.1)' }}
    >
      <Image
        source={
          offer.image_url
            ? { uri: offer.image_url }
            : require('../../IMAGES/MAIN_LOGO.png')
        }
        style={styles.image}
      />
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.title} numberOfLines={1}>
            {offer.title}
          </Text>
          {offer.end_date && (
            <View style={styles.dateContainer}>
              <Feather name="clock" size={14} color={colors.error} />
              <Text style={styles.dateText}>
                {isExpired ? 'Expired' : `Expires ${formatDate(offer.end_date)}`}
              </Text>
            </View>
          )}
        </View>

        <Text style={styles.description} numberOfLines={2}>
          {offer.description}
        </Text>

        <View style={styles.footer}>
          <View style={styles.pointsContainer}>
            <Text style={styles.points}>{offer.points_required}</Text>
            <Text style={styles.pointsLabel}>POINTS</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    marginRight: 16,
    overflow: Platform.OS === 'android' ? 'hidden' : 'visible',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  unavailableCard: {
    opacity: 0.6,
  },
  image: {
    width: '100%',
    height: 140,
    resizeMode: 'cover',
  },
  content: {
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    flexShrink: 1,
  },
  description: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginTop: 4,
  },
  pointsContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  points: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
  },
  pointsLabel: {
    fontSize: 12,
    color: colors.text,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 8,
  },
  dateText: {
    fontSize: 12,
    color: colors.error, // red/orange
    fontWeight: '500',
  },
});
