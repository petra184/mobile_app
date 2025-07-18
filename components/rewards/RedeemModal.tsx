import React from 'react';
import { StyleSheet, Text, View, Image, Pressable, Modal, ScrollView } from 'react-native';
import { Reward, SpecialOffer } from '@/types/updated_types';
import { colors } from '@/constants/colors';
import { Feather } from '@expo/vector-icons';

type RewardOrSpecial = Reward | SpecialOffer;

interface RewardModalProps {
  visible: boolean;
  item: RewardOrSpecial | null;
  onClose: () => void;
  onRedeem: (item: RewardOrSpecial) => void;
}

const isSpecialOffer = (i: RewardOrSpecial): i is SpecialOffer => 'end_date' in i;

export default function RewardModal({ visible, item, onClose, onRedeem }: RewardModalProps) {
  if (!item) return null;

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Pressable style={styles.closeButton} onPress={onClose}>
            <Feather name="x" size={24} color={colors.text} />
          </Pressable>
          
          <ScrollView showsVerticalScrollIndicator={false}>
            <Image
              source={
                item.image_url
                  ? { uri: item.image_url }
                  : require("../../IMAGES/MAIN_LOGO.png")
              }
              style={styles.image}
            />

            <View style={styles.contentPadding}>
              <Text style={styles.title}>{item.title}</Text>

              <View style={styles.pointsRow}>
                <View style={styles.pointsBadge}>
                  <Text style={styles.pointsText}>{item.points_required} POINTS</Text>
                </View>

                <Text style={styles.quantity}>
                  {isSpecialOffer(item)
                    ? (item.limited_quantity ?? 0) - (item.claimed_count ?? 0) + ' items left'
                    : (item.stock_quantity ?? 0) + ' items left'}
                </Text>
              </View>

              {isSpecialOffer(item) && (
                <View style={styles.timeContainer}>
                  <Feather name="clock" size={16} color={colors.error} />
                  <Text style={styles.timeText}>
                    Available until {formatDate(item.end_date)}
                  </Text>
                </View>
              )}

              <View style={styles.divider} />

              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.description}>{item.description}</Text>

              <View style={styles.divider} />

              <Text style={styles.sectionTitle}>Redemption Details</Text>
              <Text style={styles.description}>
                Redeem this {isSpecialOffer(item) ? 'offer' : 'reward'} using your accumulated points. Once you have enough points, it will be automatically saved to your account. You can then redeem it by attending the next game or picking it up in person at the venue.
               </Text>

              <Pressable 
                style={styles.redeemButton} 
                onPress={() => onRedeem(item)}
                android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
              >
                <Text style={styles.redeemButtonText}>Redeem Now</Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '90%',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 20,
    padding: 6,
  },
  image: {
    width: '100%',
    height: 250,
    resizeMode: 'cover',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  contentPadding: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  pointsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  pointsBadge: {
    backgroundColor: colors.primary + '15',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  pointsText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 14,
  },
  quantity: {
    fontSize: 14,
    color: colors.text,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  timeText: {
    fontSize: 14,
    color: colors.error,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: "#757575",
    lineHeight: 24,
  },
  redeemButton: {
    backgroundColor: colors.primary + '15',
    paddingVertical: 16,
    borderRadius: 32,
    alignItems: 'center',
    marginTop: 24,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  redeemButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
});
