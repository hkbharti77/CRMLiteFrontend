import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from 'react-native-paper';
import { Phone, Mail } from 'lucide-react-native';
import { tokens } from '@theme/tokens';
import { AppCard } from '@components/global/Card/AppCard';
import { StatusBadge } from '@components/global/Badge/StatusBadge';

export interface LeadCardProps {
  lead: {
    id: string;
    name: string;
    status: string;
    value?: number;
    lastContact?: string;
    phone?: string;
    email?: string;
    ownerName?: string;
  };
  onPress?: () => void;
  onCall?: () => void;
  onEmail?: () => void;
  style?: any;
}

export const LeadCard: React.FC<LeadCardProps> = ({
  lead,
  onPress,
  onCall,
  onEmail,
  style,
}) => {
  const theme = useTheme();

  return (
    <TouchableOpacity onPress={onPress} disabled={!onPress} activeOpacity={0.7}>
      <AppCard style={[styles.container, style]} elevation="sm">
        <View style={styles.header}>
          <Text style={[styles.name, { color: theme.colors.onSurface }]}>{lead.name}</Text>
          <StatusBadge status={lead.status} size="small" />
        </View>

        <View style={styles.details}>
          {typeof lead.value === 'number' && (
            <Text style={[styles.value, { color: tokens.colors.textSecondary }]}>
              Value: ${lead.value.toLocaleString()}
            </Text>
          )}
          {lead.lastContact && (
            <Text style={[styles.lastContact, { color: tokens.colors.textTertiary }]}>
              Last Contact: {lead.lastContact}
            </Text>
          )}
          {lead.ownerName && (
            <View style={styles.ownerBadge}>
              <Text style={styles.ownerText}>Assigned: {lead.ownerName}</Text>
            </View>
          )}
        </View>

        {(onCall || onEmail) && (
          <View style={styles.actions}>
            {onCall && lead.phone && (
              <TouchableOpacity onPress={onCall} style={styles.actionButton}>
                <Phone size={18} color={theme.colors.primary} />
                <Text style={[styles.actionText, { color: theme.colors.primary }]}>Call</Text>
              </TouchableOpacity>
            )}
            {onEmail && lead.email && (
              <TouchableOpacity onPress={onEmail} style={styles.actionButton}>
                <Mail size={18} color={theme.colors.primary} />
                <Text style={[styles.actionText, { color: theme.colors.primary }]}>Email</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </AppCard>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: tokens.spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacing.sm,
  },
  name: {
    fontSize: tokens.typography.titleMedium.fontSize,
    fontWeight: tokens.typography.titleMedium.fontWeight as any,
    flex: 1,
    marginRight: tokens.spacing.sm,
  },
  details: {
    marginBottom: tokens.spacing.md,
  },
  value: {
    fontSize: tokens.typography.bodyMedium.fontSize,
    marginBottom: 2,
  },
  lastContact: {
    fontSize: tokens.typography.bodySmall.fontSize,
  },
  actions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: tokens.colors.borderLight,
    paddingTop: tokens.spacing.md,
    marginTop: tokens.spacing.xs,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: tokens.spacing.lg,
  },
  actionText: {
    marginLeft: tokens.spacing.xs,
    fontSize: tokens.typography.labelMedium.fontSize,
    fontWeight: tokens.typography.labelMedium.fontWeight as any,
  },
  ownerBadge: {
    marginTop: tokens.spacing.xs,
    backgroundColor: tokens.colors.surfaceHover,
    paddingHorizontal: tokens.spacing.sm,
    paddingVertical: 2,
    borderRadius: tokens.borderRadius.sm,
    alignSelf: 'flex-start',
  },
  ownerText: {
    fontSize: tokens.typography.labelSmall.fontSize,
    color: tokens.colors.textSecondary,
    fontWeight: '500',
  },
});
