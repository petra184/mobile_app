import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { colors } from '@/constants/colors';
import { Feather } from '@expo/vector-icons';
import type { Game } from '@/types/game';

interface GameCardProps {
  game: Game;
  onPress: () => void;
  onNotifyPress?: () => void;
}

export const GameCard: React.FC<GameCardProps> = ({ game, onPress, onNotifyPress }) => {
  // Format date properly
  const formatGameDate = (dateString: string) => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    };
    return date.toLocaleDateString('en-US', options);
  };

  // Format time properly
  const formatGameTime = (timeString?: string) => {
    if (!timeString) return 'TBD';
    
    try {
      // Handle different time formats
      let date: Date;
      
      if (timeString.includes(':')) {
        // If it's just time like "19:30"
        const [hours, minutes] = timeString.split(':');
        date = new Date();
        date.setHours(parseInt(hours), parseInt(minutes));
      } else {
        // If it's a full datetime string
        date = new Date(timeString);
      }
      
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
      return timeString;
    }
  };

  // Check if game is past, upcoming, or live
  const getGameStatus = () => {
    const gameDate = new Date(game.date);
    const now = new Date();
    
    if (game.status === 'live') {
      return 'LIVE';
    } else if (game.status === 'completed' || gameDate < now) {
      return 'PAST';
    } else {
      return 'UPCOMING';
    }
  };

  // Check if game is upcoming
  const isUpcoming = () => {
    const gameDate = new Date(game.date);
    const now = new Date();
    return gameDate >= now || game.status === 'scheduled' || game.status === 'live';
  };

  // Get team logo or placeholder
  const getTeamLogo = (team: any) => {
    return team?.photo || team?.logo || null;
  };

  // Get team primary color or default
  const getTeamColor = () => {
    const teamColor = game.homeTeam?.primaryColor || colors.primary;
    return teamColor;
  };

  // Add this utility function if you don't have it already
  const hexToRgba = (hex: string, alpha: number = 1): string => {
    if (!hex) return `rgba(0, 0, 0, ${alpha})`;
    
    // Remove # if present
    hex = hex.replace('#', '');
    
    // Convert 3-digit hex to 6-digit
    if (hex.length === 3) {
      hex = hex.split('').map(char => char + char).join('');
    }
    
    // Parse the hex values
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    // Return rgba
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const teamColor = getTeamColor();
  const gameStatus = getGameStatus();
  const isPastGame = gameStatus === 'PAST';
  const isLiveGame = gameStatus === 'LIVE';

  // Get status color
  const getStatusColor = () => {
    switch (gameStatus) {
      case 'LIVE':
        return '#ef4444';
      case 'PAST':
        return teamColor;
      case 'UPCOMING':
        return teamColor;
      default:
        return teamColor;
    }
  };

  const statusColor = getStatusColor();

  return (
    <TouchableOpacity 
      style={[
        styles.card, 
        { 
          borderLeftWidth: 4,
          borderLeftColor: isPastGame ? '#6b7280' : teamColor,
          backgroundColor: isPastGame ? '#f9fafb' : (hexToRgba(teamColor, 0.05) || colors.card)
        }
      ]} 
      onPress={onPress} 
      activeOpacity={0.8}
    >
      {/* Points and Status Badge - Larger */}
      <View style={[
        styles.pointsStatusBadge, 
        { backgroundColor: isPastGame ? '#6b7280' : statusColor }
      ]}>
        <View style={styles.pointsStatusContent}>
          {game.points && game.points > 0 && (
            <View style={styles.pointsSection}>
              <Feather name="award" size={18} color="#FFFFFF" />
              <Text style={styles.pointsText}>{game.points} POINTS</Text>
            </View>
          )}
          <View style={styles.statusSection}>
            <Text style={styles.statusText}>{gameStatus}</Text>
            {isLiveGame && <View style={styles.liveDot} />}
          </View>
        </View>
      </View>

      {/* Main Content */}
      <View style={styles.cardContent}>
        {/* Time Section - Only show for upcoming/live games */}
        {!isPastGame && (
          <View style={styles.timeSection}>
            <View style={styles.timeContainer}>
              <Feather name="clock" size={16} color={teamColor} style={styles.icon} />
              <Text style={styles.timeText}>{formatGameTime(game.time)}</Text>
            </View>
          </View>
        )}

        {/* Teams Section */}
        <View style={styles.teamsSection}>
          {/* Home Team */}
          <View style={styles.teamContainer}>
            <View style={styles.teamInfo}>
              {getTeamLogo(game.homeTeam) ? (
                <Image 
                  source={{ uri: getTeamLogo(game.homeTeam) }} 
                  style={[
                    styles.teamLogo, 
                    { borderColor: isPastGame ? '#6b7280' : teamColor }
                  ]} 
                />
              ) : (
                <View style={[
                  styles.teamLogoPlaceholder, 
                  { borderColor: isPastGame ? '#6b7280' : teamColor }
                ]}>
                  <Feather 
                    name="home" 
                    size={24} 
                    color={isPastGame ? '#6b7280' : teamColor} 
                  />
                </View>
              )}
              <Text style={[
                styles.teamName, 
                { color: isPastGame ? '#6b7280' : teamColor }
              ]} numberOfLines={2}>
                {game.homeTeam?.name || game.homeTeam?.shortName || 'Home'}
              </Text>
            </View>
            {game.score?.home !== null && game.score?.home !== undefined && (
              <Text style={[
                styles.score, 
                { color: isPastGame ? '#6b7280' : teamColor }
              ]}>
                {game.score.home}
              </Text>
            )}
          </View>

          {/* VS Divider */}
          <View style={styles.vsContainer}>
            <Text style={[
              styles.vsText, 
              { color: isPastGame ? '#6b7280AA' : teamColor + 'AA' }
            ]}>
              VS
            </Text>
          </View>

          {/* Away Team */}
          <View style={styles.teamContainer}>
            <View style={styles.teamInfo}>
              {getTeamLogo(game.awayTeam) ? (
                <Image 
                  source={{ uri: getTeamLogo(game.awayTeam) }} 
                  style={[
                    styles.teamLogo,
                    { borderColor: isPastGame ? '#6b7280' : colors.border }
                  ]} 
                />
              ) : (
                <View style={[
                  styles.teamLogoPlaceholder,
                  { borderColor: isPastGame ? '#6b7280' : colors.border }
                ]}>
                  <Feather 
                    name="users" 
                    size={24} 
                    color={isPastGame ? '#6b7280' : colors.textSecondary} 
                  />
                </View>
              )}
              <Text style={[
                styles.teamName,
                { color: isPastGame ? '#6b7280' : colors.text }
              ]} numberOfLines={2}>
                {game.awayTeam?.name || game.awayTeam?.shortName || 'Away'}
              </Text>
            </View>
            {game.score?.away !== null && game.score?.away !== undefined && (
              <Text style={[
                styles.score,
                { color: isPastGame ? '#6b7280' : colors.text }
              ]}>
                {game.score.away}
              </Text>
            )}
          </View>
        </View>

        {/* Bottom Section - Location and Date/Notification */}
        <View style={styles.bottomSection}>
          <View style={styles.locationDateContainer}>
            {game.location && (
              <View style={styles.locationContainer}>
                <Feather 
                  name="map-pin" 
                  size={14} 
                  color={isPastGame ? '#6b7280' : colors.textSecondary} 
                  style={styles.icon} 
                />
                <Text style={[
                  styles.locationText,
                  { color: isPastGame ? '#6b7280' : colors.textSecondary }
                ]} numberOfLines={1}>
                  {game.location}
                </Text>
              </View>
            )}
            
            {/* Show date for upcoming games only */}
            {!isPastGame && (
              <View style={styles.dateContainer}>
                <Feather 
                  name="calendar" 
                  size={14} 
                  color={teamColor} 
                  style={styles.icon} 
                />
                <Text style={[styles.dateText, { color: teamColor }]}>
                  {formatGameDate(game.date)}
                </Text>
              </View>
            )}
          </View>

          {/* Notification Button - Only for upcoming games */}
          {isUpcoming() && onNotifyPress && (
            <TouchableOpacity 
              style={[styles.notifyButton, { backgroundColor: teamColor + '20' }]} 
              onPress={onNotifyPress}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Feather name="bell" size={16} color={teamColor} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    marginHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 16,
  },
  pointsStatusBadge: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  pointsStatusContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pointsSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pointsText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  statusSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  cardContent: {
    padding: 9,
  },
  timeSection: {
    marginBottom: 16,
    alignItems: 'center',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 6,
  },
  timeText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  teamsSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  teamContainer: {
    flex: 1,
    alignItems: 'center',
  },
  teamInfo: {
    alignItems: 'center',
    marginBottom: 8,
  },
  teamLogo: {
    width: 80,
    height: 65,
    borderRadius: 8,
    marginBottom: 8,
  },
  teamLogoPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  teamName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    minHeight: 20,
  },
  score: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.primary,
  },
  vsContainer: {
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vsText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 1,
  },
  bottomSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locationDateContainer: {
    flex: 1,
    gap: 8,
    marginTop: 8,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 12,
    color: colors.textSecondary,
    flex: 1,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  notifyButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default GameCard;