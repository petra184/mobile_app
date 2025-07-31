import { colors } from '@/constants/Colors';
import { SpecialOffer } from '@/types/updated_types';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { Dimensions, Image, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

interface SpecialOfferCardProps {
  offer: SpecialOffer;
  userPoints: number;
  onPress: (offer: SpecialOffer) => void;
  cardWidth?: number | `${number}%`;
}

export default function SpecialOfferCard({
  offer,
  userPoints,
  onPress,
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
  return (
    <Pressable
      style={[
        styles.card,
        { width: cardWidth },
        (!canRedeem || !isAvailable) && styles.unavailableCard,
      ]}
      onPress={() => onPress(offer)}
      android_ripple={{ color: 'rgba(0,0,0,0.1)' }}
    >
      <View style={styles.imageContainer}>
        <Image
            source={
            offer.image_url
                ? { uri: offer.image_url }
                : require('../../IMAGES/MAIN_LOGO.png')
            }
            style={styles.image}
        />

        {offer.end_date && (
            <View style={styles.expiryBadge}>
            <Feather name="clock" size={12} color={colors.error} />
            <Text style={styles.expiryBadgeText}>
                {isExpired ? 'Expired' : `Expires ${formatDate(offer.end_date)}`}
            </Text>
            </View>
        )}
        </View>
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.title} numberOfLines={1}>
            {offer.title}
          </Text>
        </View>

        <Text style={styles.description} numberOfLines={2}>
          {offer.description}
        </Text>

        <View style={styles.footer}>
          <View style={styles.pointsContainer}>
            <MaterialCommunityIcons name="star-circle" size={16} color={colors.accent} />
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
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 6,
      },
    }),
  },
    unavailableCard: {
        opacity: 0.6,
    },
    imageContainer: {
    position: 'relative',
    width: '100%',
    height: 140,
    },

    image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    },

    expiryBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FFF5F0', // light background
    borderColor: colors.error, // red/orange border
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    },

    expiryBadgeText: {
    fontSize: 11,
    color: colors.error,
    fontWeight: '500',
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
    fontWeight: '800',
    color: "#8B5CF6",
  },
  pointsLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.accent,
    marginLeft: 4,
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
