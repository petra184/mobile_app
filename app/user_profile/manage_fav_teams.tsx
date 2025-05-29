import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, Image, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/constants/colors';
import { useUserStore } from '@/hooks/userStore';
import { getTeams, type Team } from '@/app/actions/teams';
import { Feather } from "@expo/vector-icons";

export default function ManageFavoriteTeamsScreen() {
  const router = useRouter();
  const { preferences, toggleFavoriteTeam } = useUserStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [teams, setTeams] = useState<Team[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(true);
  const [updatingFavorites, setUpdatingFavorites] = useState<string[]>([]);
  
  // Load teams from database
  async function loadTeams() {
    try {
      setLoadingTeams(true);
      const fetchedTeams = await getTeams();
      setTeams(fetchedTeams);
    } catch (error) {
      console.error('Error loading teams:', error);
    } finally {
      setLoadingTeams(false);
    }
  }

  useEffect(() => {
    loadTeams();
  }, []);
  
  const handleToggleFavorite = async (teamId: string) => {
    try {
      setUpdatingFavorites(prev => [...prev, teamId]);
      await toggleFavoriteTeam(teamId);
    } catch (error) {
      console.error('Error toggling favorite team:', error);
    } finally {
      setUpdatingFavorites(prev => prev.filter(id => id !== teamId));
    }
  };
  
  const renderTeamItem = ({ item }: { item: Team }) => {
    const isFavorite = preferences.favoriteTeams.includes(item.id);
    const isUpdating = updatingFavorites.includes(item.id);
    
    return (
      <View style={styles.teamItem}>
        <Image 
          source={{ 
            uri: item.logo || "https://upload.wikimedia.org/wikipedia/commons/thumb/0/06/Manhattan_Jaspers_logo.svg/1200px-Manhattan_Jaspers_logo.svg.png" 
          }} 
          style={styles.teamLogo} 
        />
        <View style={styles.teamInfo}>
          <Text style={styles.teamName}>{item.name}</Text>
          <Text style={styles.teamSport}>{item.gender} {item.sport}</Text>
        </View>
        <Pressable
          style={[
            styles.favoriteButton,
            isFavorite && styles.favoriteButtonActive
          ]}
          onPress={() => handleToggleFavorite(item.id)}
          disabled={isUpdating}
        >
          {isUpdating ? (
            <ActivityIndicator size="small" color={isFavorite ? '#FFFFFF' : colors.primary} />
          ) : (
            <Feather 
              name={isFavorite ? 'heart' : 'heart'}
              size={20}
              color={isFavorite ? '#FFFFFF' : colors.primary}
              fill={isFavorite ? '#FFFFFF' : 'none'}
            />
          )}
        </Pressable>
      </View>
    );
  };
  
  if (loadingTeams) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <Image
          source={require('../../IMAGES/crowd.jpg')}
          style={styles.backgroundImage}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading teams...</Text>
        </View>
      </SafeAreaView>
    );
  }
  
  return (
    <>
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <Image
          source={require('../../IMAGES/crowd.jpg')}
          style={styles.backgroundImage}
        />
        
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Feather name="chevron-left" size={24} color={colors.primary} />
          </Pressable>
          <Text style={styles.headerTitle}>Manage Favorite Teams</Text>
          <View style={{ width: 24 }} />
        </View>
        
        {/* Search Bar (non-functional in this example) */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Feather name='search' size={20} color={colors.textSecondary} />
            <Text style={styles.searchPlaceholder}>Search teams...</Text>
          </View>
        </View>
        
        <Text style={styles.instructions}>
          Tap the heart icon to add or remove teams from your favorites
        </Text>
        
        <FlatList
          data={teams}
          renderItem={renderTeamItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    top: 0,
  },
  backgroundImage: {
    position: 'absolute',
    bottom: 0,
    resizeMode: 'cover',
    opacity: 0.1, 
    zIndex: 0, 
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.card,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.textSecondary,
  },
  searchContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchPlaceholder: {
    fontSize: 16,
    color: colors.textSecondary,
    marginLeft: 12,
  },
  instructions: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  listContent: {
    padding: 16,
  },
  teamItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  teamLogo: {
    width: 58,
    height: 48,
    marginRight: 16,
  },
  teamInfo: {
    flex: 1,
  },
  teamName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  teamSport: {
    fontSize: 14,
    color: colors.textSecondary,
    textTransform: 'capitalize',
  },
  favoriteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  favoriteButtonActive: {
    backgroundColor: colors.primary,
  },
});