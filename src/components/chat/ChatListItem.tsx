import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from 'react-native-paper';
import { tokens } from '@theme/tokens';
import { AppAvatar } from '@components/global/Avatar/AppAvatar';

export interface ChatListItemProps {
  chat: {
    id: string;
    contactName: string;
    contactAvatar?: string;
    lastMessage: string;
    timestamp: string;
    unreadCount?: number;
    channel?: 'whatsapp' | 'email' | 'web';
    escalated?: boolean;
    latestSentiment?: 'POSITIVE' | 'NEUTRAL' | 'FRUSTRATED' | 'URGENT';
  };
  onPress?: () => void;
  style?: any;
}

export const ChatListItem: React.FC<ChatListItemProps> = ({ chat, onPress, style }) => {
  const theme = useTheme();
  const isUnread = Boolean(chat.unreadCount && chat.unreadCount > 0);

  return (
    <TouchableOpacity 
      onPress={onPress} 
      disabled={!onPress} 
      style={[
        styles.container, 
        { 
          backgroundColor: chat.escalated ? '#FEF2F2' : isUnread ? (theme.colors.primaryContainer || '#E0F2F1') : theme.colors.surface,
          borderColor: chat.escalated ? '#EF4444' : isUnread ? theme.colors.primary : tokens.colors.borderLight,
          shadowColor: tokens.colors.shadow,
        },
        style
      ]}
      activeOpacity={0.7}
    >
      {isUnread && <View style={[styles.unreadIndicator, { backgroundColor: theme.colors.primary }]} />}
      
      <View style={styles.avatarContainer}>
        <AppAvatar name={chat.contactName} imageUrl={chat.contactAvatar} size="medium" />
        <View style={styles.onlineBadge} />
      </View>
      
      <View style={styles.content}>
        <View style={styles.header}>
          <Text 
            style={[
              styles.name, 
              { color: theme.colors.onSurface },
              Boolean(isUnread) && { fontWeight: '700' }
            ]} 
            numberOfLines={1}
          >
            {chat.contactName}
          </Text>
          <Text style={[styles.time, { color: isUnread ? theme.colors.primary : tokens.colors.textSecondary }]}>
            {chat.timestamp}
          </Text>
        </View>
        <View style={styles.messageRow}>
          <Text 
            style={[
              styles.message, 
              { color: isUnread ? theme.colors.onSurface : tokens.colors.textSecondary },
              Boolean(isUnread) && { fontWeight: '600' }
            ]} 
            numberOfLines={1}
          >
            {chat.lastMessage}
          </Text>
          {isUnread ? (
            <View style={[styles.badge, { backgroundColor: theme.colors.primary }]}>
              <Text style={[styles.badgeText, { color: theme.colors.onPrimary || '#FFF' }]}>
                {(chat.unreadCount || 0) > 99 ? '99+' : chat.unreadCount}
              </Text>
            </View>
          ) : null}
        </View>
        
        {chat.escalated && (
          <View style={styles.escalationChip}>
            <Text style={styles.escalationText}>🚨 Escalated - Human Agent Required</Text>
          </View>
        )}

        {/* Tags / Channel Badge */}
        {chat.channel && !chat.escalated && (
           <View style={[styles.channelBadge, { backgroundColor: tokens.colors.backgroundDark }]}>
             <Text style={[styles.channelText, { color: tokens.colors.textSecondary }]}>
               {chat.channel.toUpperCase()}
             </Text>
           </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: tokens.spacing.md,
    paddingHorizontal: tokens.spacing.lg,
    marginHorizontal: tokens.spacing.md,
    marginBottom: tokens.spacing.sm,
    borderRadius: tokens.borderRadius.lg,
    borderWidth: 1,
    ...tokens.shadows.sm,
    overflow: 'hidden',
  },
  unreadIndicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: tokens.spacing.md,
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: tokens.colors.success,
    borderWidth: 2,
    borderColor: '#FFF',
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  name: {
    fontSize: tokens.typography.titleMedium.fontSize,
    fontWeight: tokens.typography.titleMedium.fontWeight as any,
    flex: 1,
    marginRight: tokens.spacing.sm,
  },
  time: {
    fontSize: tokens.typography.labelSmall.fontSize,
    fontWeight: '500',
  },
  messageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  message: {
    fontSize: tokens.typography.bodyMedium.fontSize,
    flex: 1,
    marginRight: tokens.spacing.sm,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: tokens.borderRadius.full,
    minWidth: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  channelBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: tokens.spacing.sm,
    paddingVertical: 2,
    borderRadius: tokens.borderRadius.md,
    marginTop: tokens.spacing.xs,
  },
  channelText: {
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  escalationChip: {
    backgroundColor: '#FEE2E2',
    borderColor: '#EF4444',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  escalationText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#DC2626',
  },
});
