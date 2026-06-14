import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from 'react-native-paper';
import { Check, CheckCheck } from 'lucide-react-native';
import { tokens } from '@theme/tokens';

export interface ChatBubbleProps {
  message: {
    id: string;
    text: string;
    timestamp: string;
    isSender: boolean;
    status?: 'sent' | 'delivered' | 'read';
    type?: 'text' | 'bot_card';
    botOptions?: string[];
  };
  style?: any;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({ message, style }) => {
  const theme = useTheme();

  // Mock bot card layout if message type is 'bot_card'
  if (message.type === 'bot_card') {
    return (
      <View style={[styles.container, styles.receiverContainer, style]}>
        <View style={[styles.botCard, { backgroundColor: theme.colors.surface, borderColor: tokens.colors.borderLight }]}>
          <Text style={[styles.botTitle, { color: theme.colors.onSurface }]}>👋 Support Bot</Text>
          <Text style={[styles.text, { color: tokens.colors.textSecondary, marginBottom: tokens.spacing.md }]}>
            {message.text}
          </Text>
          {message.botOptions?.map((opt, idx) => (
            <TouchableOpacity key={idx} style={[styles.botOption, { borderColor: theme.colors.primary }]}>
              <Text style={[styles.botOptionText, { color: theme.colors.primary }]}>{opt}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={[styles.timestamp, { color: tokens.colors.textTertiary }, styles.receiverTimestamp]}>
          {message.timestamp}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, message.isSender ? styles.senderContainer : styles.receiverContainer, style]}>
      <View
        style={[
          styles.bubble,
          message.isSender 
            ? { 
                backgroundColor: theme.colors.primary, 
                borderBottomRightRadius: 4,
                borderTopRightRadius: 18,
                borderTopLeftRadius: 18,
                borderBottomLeftRadius: 18,
              } 
            : { 
                backgroundColor: '#F1F5F9', // Soft gray
                borderBottomLeftRadius: 4,
                borderTopRightRadius: 18,
                borderTopLeftRadius: 18,
                borderBottomRightRadius: 18,
              }
        ]}
      >
        <Text style={[styles.text, { color: message.isSender ? '#FFFFFF' : tokens.colors.textPrimary }]}>
          {message.text}
        </Text>
      </View>
      <View style={[styles.metaContainer, message.isSender ? styles.senderMeta : styles.receiverMeta]}>
        <Text style={[styles.timestamp, { color: tokens.colors.textTertiary }]}>
          {message.timestamp}
        </Text>
        {message.isSender && message.status && (
          <View style={styles.statusIcon}>
            {message.status === 'sent' && <Check size={14} color={tokens.colors.textTertiary} />}
            {message.status === 'delivered' && <CheckCheck size={14} color={tokens.colors.textTertiary} />}
            {message.status === 'read' && <CheckCheck size={14} color={theme.colors.primary} />}
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: tokens.spacing.xs,
    maxWidth: '75%',
  },
  senderContainer: {
    alignSelf: 'flex-end',
  },
  receiverContainer: {
    alignSelf: 'flex-start',
  },
  bubble: {
    paddingHorizontal: tokens.spacing.lg,
    paddingVertical: tokens.spacing.md,
    ...tokens.shadows.sm,
  },
  text: {
    fontSize: tokens.typography.bodyMedium.fontSize,
    lineHeight: 20,
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  senderMeta: {
    alignSelf: 'flex-end',
  },
  receiverMeta: {
    alignSelf: 'flex-start',
  },
  timestamp: {
    fontSize: 11,
    fontWeight: '500',
  },
  statusIcon: {
    marginLeft: 4,
  },
  botCard: {
    padding: tokens.spacing.lg,
    borderRadius: 16,
    borderWidth: 1,
    ...tokens.shadows.md,
    minWidth: 240,
  },
  botTitle: {
    fontSize: tokens.typography.titleMedium.fontSize,
    fontWeight: '700',
    marginBottom: tokens.spacing.sm,
  },
  botOption: {
    borderWidth: 1,
    borderRadius: tokens.borderRadius.full,
    paddingVertical: tokens.spacing.sm,
    paddingHorizontal: tokens.spacing.md,
    alignItems: 'center',
    marginBottom: tokens.spacing.sm,
  },
  botOptionText: {
    fontWeight: '600',
    fontSize: tokens.typography.bodyMedium.fontSize,
  },
});
