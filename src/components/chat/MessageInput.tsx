import React, { useState } from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity, ScrollView, Text } from 'react-native';
import { useTheme } from 'react-native-paper';
import { Send, Paperclip, Smile, Mic } from 'lucide-react-native';
import { tokens } from '@theme/tokens';

export interface MessageInputProps {
  onSend: (text: string) => void;
  placeholder?: string;
  style?: any;
}

const SUGGESTED_REPLIES = ['Hello', 'Pricing', 'Book Call', 'Human Support'];

export const MessageInput: React.FC<MessageInputProps> = ({ 
  onSend, 
  placeholder = 'Type a message...', 
  style 
}) => {
  const theme = useTheme();
  const [text, setText] = useState('');

  const handleSend = () => {
    if (text.trim()) {
      onSend(text.trim());
      setText('');
    }
  };

  const handleSuggestedReply = (reply: string) => {
    onSend(reply);
  };

  return (
    <View style={[styles.outerContainer, style]}>
      {/* Quick Actions (Suggested Replies) */}
      <View style={styles.quickActionsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickActionsScroll}>
          {SUGGESTED_REPLIES.map((reply, index) => (
            <TouchableOpacity 
              key={index} 
              style={[styles.quickActionChip, { borderColor: theme.colors.primary, backgroundColor: '#F0FDFA' }]}
              onPress={() => handleSuggestedReply(reply)}
            >
              <Text style={[styles.quickActionText, { color: theme.colors.primary }]}>{reply}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Floating Composer */}
      <View style={[styles.container, { backgroundColor: theme.colors.surface, shadowColor: tokens.colors.shadow }]}>
        <View style={styles.actionsLeft}>
          <TouchableOpacity style={styles.iconButton}>
            <Paperclip size={20} color={tokens.colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <TextInput
          style={[styles.input, { color: theme.colors.onSurface }]}
          placeholder={placeholder}
          placeholderTextColor={tokens.colors.textTertiary}
          value={text}
          onChangeText={setText}
          multiline
          maxLength={1000}
        />

        <View style={styles.actionsRight}>
          <TouchableOpacity style={styles.iconButton}>
            <Smile size={20} color={tokens.colors.textSecondary} />
          </TouchableOpacity>
          {!text.trim() ? (
            <TouchableOpacity style={styles.iconButton}>
              <Mic size={20} color={tokens.colors.textSecondary} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={[styles.sendButton, { backgroundColor: theme.colors.primary }]}
              onPress={handleSend}
            >
              <Send size={16} color="#FFF" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    paddingHorizontal: tokens.spacing.md,
    paddingBottom: tokens.spacing.xl, // elevate from bottom edge
  },
  quickActionsContainer: {
    marginBottom: tokens.spacing.sm,
  },
  quickActionsScroll: {
    paddingHorizontal: tokens.spacing.xs,
    paddingBottom: tokens.spacing.xs,
  },
  quickActionChip: {
    borderWidth: 1,
    borderRadius: tokens.borderRadius.full,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.xs + 2,
    marginRight: tokens.spacing.sm,
  },
  quickActionText: {
    fontSize: tokens.typography.labelMedium.fontSize,
    fontWeight: '600',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderRadius: 24,
    paddingHorizontal: tokens.spacing.sm,
    paddingVertical: tokens.spacing.xs,
    ...tokens.shadows.md,
  },
  actionsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 6,
  },
  actionsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 4,
  },
  input: {
    flex: 1,
    fontSize: tokens.typography.bodyLarge.fontSize,
    maxHeight: 120,
    minHeight: 36,
    paddingHorizontal: tokens.spacing.sm,
    paddingTop: 10,
    paddingBottom: 10,
  },
  iconButton: {
    padding: tokens.spacing.sm,
  },
  sendButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: tokens.spacing.xs,
  },
});
