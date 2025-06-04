"use client"

import { useState, useEffect } from "react"
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Alert, 
  TouchableOpacity, 
  Image, 
  ActivityIndicator, 
  RefreshControl,
  Pressable,
  Platform
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { colors } from "@/constants/colors"
import { useUserStore } from "@/hooks/userStore"
import { supabase } from "@/lib/supabase"
import { Feather } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated"
import { StatusBar } from "expo-status-bar"

// Define types based on your database schema
interface Reward {
  id: string
  title: string
  description: string
  points_required: number
  image_url: string | null
  is_active: boolean | null
  team_id: string | null
  category?: 'merchandise' | 'experiences' | 'discounts' | 'digital'
}

interface SpecialOffer {
  id: string
  title: string
  description: string
  points_required: number
  image_url: string | null
  start_date: string
  end_date: string
  is_active: boolean | null
  team_id: string | null
  category?: 'merchandise' | 'experiences' | 'discounts' | 'digital'
}

interface RecentRedemption {
  id: string
  reward_title: string
  points_used: number
  redeemed_at: string
  status: 'pending' | 'completed' | 'cancelled'
}

export default function RewardsScreen() {
  const { points, redeemPoints, userId } = useUserStore()
  const router = useRouter()
  
  const [rewards, setRewards] = useState<Reward[]>([])
  const [specialOffers, setSpecialOffers] = useState<SpecialOffer[]>([])
  const [recentRedemptions, setRecentRedemptions] = useState<RecentRedemption[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState<'rewards' | 'offers' | 'history'>('rewards')

  // Fetch rewards and special offers from Supabase
  const fetchRewardsData = async () => {
    try {
      setLoading(true)
      
      // Fetch active rewards
      const { data: rewardsData, error: rewardsError } = await supabase
        .from('rewards')
        .select('*')
        .eq('is_active', true)
        .order('points_required', { ascending: true })
      
      if (rewardsError) {
        console.error('Error fetching rewards:', rewardsError)
        Alert.alert('Error', 'Failed to load rewards. Please try again.')
        return
      }
      
      // Fetch active special offers that haven't expired
      const today = new Date().toISOString().split('T')[0]
      const { data: offersData, error: offersError } = await supabase
        .from('special_offers')
        .select('*')
        .eq('is_active', true)
        .gte('end_date', today)
        .order('points_required', { ascending: true })
      
      if (offersError) {
        console.error('Error fetching special offers:', offersError)
        Alert.alert('Error', 'Failed to load special offers. Please try again.')
        return
      }

      // Fetch recent redemptions for the user
      if (userId) {
        const { data: redemptionsData, error: redemptionsError } = await supabase
          .from('user_redemptions')
          .select('*')
          .eq('user_id', userId)
          .order('redeemed_at', { ascending: false })
          .limit(10)
        
        if (redemptionsError) {
          console.error('Error fetching redemptions:', redemptionsError)
        } else {
          setRecentRedemptions(redemptionsData || [])
        }
      }
      
      setRewards(rewardsData || [])
      setSpecialOffers(offersData || [])
    } catch (error) {
      console.error('Unexpected error:', error)
      Alert.alert('Error', 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }
  
  // Initial data fetch
  useEffect(() => {
    fetchRewardsData()
  }, [])
  
  // Pull to refresh
  const onRefresh = async () => {
    setRefreshing(true)
    await fetchRewardsData()
  }

  // Handle reward redemption
  const handleRedeemReward = (item: Reward | SpecialOffer) => {
    if (!userId) {
      Alert.alert(
        "Login Required", 
        "Please log in to redeem rewards.", 
        [{ text: "OK", onPress: () => router.push("/login") }]
      )
      return
    }
    
    if (points < item.points_required) {
      Alert.alert(
        "Insufficient Points", 
        `You need ${item.points_required - points} more points to redeem this reward.`,
        [{ text: "OK" }]
      )
      return
    }
    
    Alert.alert(
      "Redeem Reward", 
      `Are you sure you want to redeem "${item.title}" for ${item.points_required} points?`, 
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Redeem",
          onPress: async () => {
            try {
              const success = await redeemPoints(item.points_required)
              
              if (success) {
                // Record the redemption in your database
                await supabase
                  .from('user_redemptions')
                  .insert({
                    user_id: userId,
                    reward_id: item.id,
                    reward_title: item.title,
                    points_used: item.points_required,
                    status: 'pending'
                  })
                
                Alert.alert(
                  "Success!", 
                  `You have successfully redeemed "${item.title}". Check your email for details.`,
                  [{ text: "OK" }]
                )
                
                // Refresh data to show new redemption
                fetchRewardsData()
              } else {
                Alert.alert(
                  "Error", 
                  "Failed to redeem points. Please try again.",
                  [{ text: "OK" }]
                )
              }
            } catch (error) {
              console.error('Error redeeming points:', error)
              Alert.alert(
                "Error", 
                "Something went wrong. Please try again.",
                [{ text: "OK" }]
              )
            }
          }
        }
      ]
    )
  }

  // Calculate days remaining for special offers
  const getDaysRemaining = (endDate: string) => {
    const end = new Date(endDate)
    const today = new Date()
    const diffTime = end.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  // Format date for redemptions
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#10b981'
      case 'pending': return '#f59e0b'
      case 'cancelled': return '#ef4444'
      default: return colors.text
    }
  }

  // Render reward or special offer card
  const renderItem = (item: Reward | SpecialOffer, isOffer = false) => {
    const isSpecialOffer = 'start_date' in item
    const daysRemaining = isSpecialOffer ? getDaysRemaining(item.end_date) : null
    
    return (
      <TouchableOpacity
        key={item.id}
        style={styles.card}
        activeOpacity={0.8}
        onPress={() => handleRedeemReward(item)}
      >
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            {isSpecialOffer && (
              <View style={styles.limitedBadge}>
                <Feather name="clock" size={12} color="#fff" />
                <Text style={styles.limitedText}>
                  {daysRemaining === 1 ? 'Last day!' : `${daysRemaining} days left`}
                </Text>
              </View>
            )}
            
            <View style={styles.cardIconContainer}>
              {isOffer ? (
                <Feather name="tag" size={24} color={colors.primary} />
              ) : (
                <Feather name="gift" size={24} color={colors.primary} />
              )}
            </View>
            
            <Text style={styles.cardTitle} numberOfLines={2}>
              {item.title}
            </Text>
          </View>
          
          <Text style={styles.cardDescription} numberOfLines={3}>
            {item.description}
          </Text>
          
          <View style={styles.cardFooter}>
            <View style={styles.pointsContainer}>
              <Feather name="star" size={16} color="#FFD700" />
              <Text style={styles.pointsText}>{item.points_required} points</Text>
            </View>
            
            <View style={[
              styles.redeemButton, 
              points < item.points_required && styles.redeemButtonDisabled
            ]}>
              <Text style={[
                styles.redeemButtonText,
                points < item.points_required && styles.redeemButtonTextDisabled
              ]}>
                {points < item.points_required ? 'Not Enough Points' : 'Redeem'}
              </Text>
            </View>
          </View>
        </View>
        
        {item.image_url && (
          <Image
            source={{ uri: item.image_url }}
            style={styles.cardImage}
            resizeMode="cover"
          />
        )}
        
        {!item.image_url && (
          <View style={styles.placeholderImage}>
            <Feather name="gift" size={40} color={colors.primary + '40'} />
          </View>
        )}
      </TouchableOpacity>
    )
  }

  // Render redemption history item
  const renderRedemptionItem = (redemption: RecentRedemption) => (
    <View key={redemption.id} style={styles.redemptionCard}>
      <View style={styles.redemptionHeader}>
        <View style={styles.redemptionIconContainer}>
          <Feather name="check-circle" size={20} color={getStatusColor(redemption.status)} />
        </View>
        <View style={styles.redemptionInfo}>
          <Text style={styles.redemptionTitle} numberOfLines={1}>
            {redemption.reward_title}
          </Text>
          <Text style={styles.redemptionDate}>
            {formatDate(redemption.redeemed_at)}
          </Text>
        </View>
        <View style={styles.redemptionPoints}>
          <Text style={styles.redemptionPointsText}>-{redemption.points_used}</Text>
          <Text style={[styles.redemptionStatus, { color: getStatusColor(redemption.status) }]}>
            {redemption.status.charAt(0).toUpperCase() + redemption.status.slice(1)}
          </Text>
        </View>
      </View>
    </View>
  )

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Image source={require("@/IMAGES/crowd.jpg")} style={styles.backgroundImage} />
      <StatusBar style="dark" />
      
      {/* Header with points display */}
      <Animated.View entering={FadeIn.duration(400)} style={styles.header}>
        <View style={styles.pointsDisplayContainer}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Feather name="chevron-left" size={28} color="black" />
          </Pressable>
          <View style={styles.pointsDisplay}>
            <Feather name="star" size={24} color="#FFD700" style={{ marginRight: 8 }} />
            <Text style={styles.pointsDisplayText}>{points}</Text>
          </View>
          <Text style={styles.pointsLabel}>Available Points</Text>
        </View>
      </Animated.View>
      
      {/* Tab navigation */}
      <Animated.View entering={FadeInDown.duration(500).delay(100)} style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'rewards' && styles.activeTab]}
          onPress={() => setActiveTab('rewards')}
        >
          <Feather name="gift" 
            size={18} 
            color={activeTab === 'rewards' ? colors.primary : colors.text + '80'} 
            style={styles.tabIcon} 
          />
          <Text style={[
            styles.tabText, 
            activeTab === 'rewards' && styles.activeTabText
          ]}>
            Rewards
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'offers' && styles.activeTab]}
          onPress={() => setActiveTab('offers')}
        >
          <Feather name="zap" 
            size={18} 
            color={activeTab === 'offers' ? colors.primary : colors.text + '80'} 
            style={styles.tabIcon} 
          />
          <Text style={[
            styles.tabText, 
            activeTab === 'offers' && styles.activeTabText
          ]}>
            Limited Offers
          </Text>
          {specialOffers.length > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{specialOffers.length}</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'history' && styles.activeTab]}
          onPress={() => setActiveTab('history')}
        >
          <Feather name="clock" 
            size={18} 
            color={activeTab === 'history' ? colors.primary : colors.text + '80'} 
            style={styles.tabIcon} 
          />
          <Text style={[
            styles.tabText, 
            activeTab === 'history' && styles.activeTabText
          ]}>
            History
          </Text>
        </TouchableOpacity>
      </Animated.View>
      
      {/* Content area */}
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading rewards...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {activeTab === 'rewards' && (
            <>
              {rewards.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Feather name="award" size={60} color={colors.primary + '40'} />
                  <Text style={styles.emptyTitle}>No Rewards Available</Text>
                  <Text style={styles.emptyText}>
                    Check back soon for new rewards you can redeem with your points!
                  </Text>
                </View>
              ) : (
                rewards.map((reward) => renderItem(reward))
              )}
            </>
          )}
          
          {activeTab === 'offers' && (
            <>
              {specialOffers.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Feather name="tag" size={60} color={colors.primary + '40'} />
                  <Text style={styles.emptyTitle}>No Special Offers</Text>
                  <Text style={styles.emptyText}>
                    There are no limited-time offers available right now. Check back soon!
                  </Text>
                </View>
              ) : (
                specialOffers.map((offer) => renderItem(offer, true))
              )}
            </>
          )}

          {activeTab === 'history' && (
            <>
              {recentRedemptions.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Feather name="clock" size={60} color={colors.primary + '40'} />
                  <Text style={styles.emptyTitle}>No Redemption History</Text>
                  <Text style={styles.emptyText}>
                    Your recent point redemptions will appear here once you start redeeming rewards.
                  </Text>
                </View>
              ) : (
                <>
                  <Text style={styles.sectionTitle}>Recent Redemptions</Text>
                  {recentRedemptions.map((redemption) => renderRedemptionItem(redemption))}
                </>
              )}
            </>
          )}
          
          <View style={styles.bottomSpacer} />
        </ScrollView>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  backgroundImage: {
    position: "absolute",
    bottom: 0,
    resizeMode: "cover",
    opacity: 0.03,
    zIndex: 0,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  pointsDisplayContainer: {
    alignItems: 'center',
  },
  backButton: {
    position: "absolute",
    left: 0,
    transform: [{ translateY: -12 }],
    zIndex: 10,
    ...Platform.select({
      ios: {
        top: 10,
      },
      android: {
        top: 20,
      },
    }),
  },
  pointsDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pointsDisplayText: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text,
  },
  pointsLabel: {
    fontSize: 14,
    color: colors.text + '80',
    marginTop: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: colors.primary + '15',
  },
  tabIcon: {
    marginRight: 6,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.text + '80',
  },
  activeTabText: {
    color: colors.primary,
    fontWeight: '600',
  },
  badge: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 4,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.text + '80',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
    marginTop: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: colors.text + '80',
    textAlign: 'center',
    lineHeight: 20,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardContent: {
    flex: 1,
    padding: 16,
  },
  cardHeader: {
    marginBottom: 8,
  },
  cardIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    color: colors.text + '80',
    lineHeight: 20,
    marginBottom: 16,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pointsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pointsText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 4,
  },
  redeemButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.primary + '20',
    borderRadius: 6,
  },
  redeemButtonDisabled: {
    backgroundColor: colors.border,
  },
  redeemButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  redeemButtonTextDisabled: {
    color: colors.text + '60',
  },
  cardImage: {
    width: 100,
    height: '100%',
  },
  placeholderImage: {
    width: 100,
    backgroundColor: colors.card + '80',
    alignItems: 'center',
    justifyContent: 'center',
  },
  limitedBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#f97316',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  limitedText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 4,
  },
  redemptionCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    marginBottom: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  redemptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  redemptionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  redemptionInfo: {
    flex: 1,
  },
  redemptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  redemptionDate: {
    fontSize: 12,
    color: colors.text + '60',
  },
  redemptionPoints: {
    alignItems: 'flex-end',
  },
  redemptionPointsText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2,
  },
  redemptionStatus: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  bottomSpacer: {
    height: 40,
  },
})