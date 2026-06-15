import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { tokens } from '@theme/tokens';
import { useTheme } from 'react-native-paper';
import { Calendar, Clock, MapPin, Video } from 'lucide-react-native';
import { AppCard } from '@components/global/Card/AppCard';

export interface AppointmentCardProps {
  appointment: {
    id: string;
    title: string;
    date: string;
    time: string;
    locationType: 'in-person' | 'video' | 'phone';
    locationDetails?: string;
    contactName: string;
    status: 'scheduled' | 'completed' | 'cancelled';
  };
  onPress?: () => void;
  style?: any;
}

export const AppointmentCard: React.FC<AppointmentCardProps> = ({ appointment, onPress, style }) => {
  const theme = useTheme();

  return (
    <TouchableOpacity onPress={onPress} disabled={!onPress} activeOpacity={0.7}>
      <AppCard style={[styles.container, style]} elevation="sm">
        <View style={styles.header}>
          <Text style={[styles.title, { color: tokens.colors.textPrimary }]} numberOfLines={1}>
            {appointment.title}
          </Text>
          <View style={[
            styles.statusBadge, 
            { backgroundColor: appointment.status === 'scheduled' ? theme.colors.primary + '20' : tokens.colors.backgroundDark }
          ]}>
            <Text style={[
              styles.statusText, 
              { color: appointment.status === 'scheduled' ? theme.colors.primary : tokens.colors.textSecondary }
            ]}>
              {appointment.status.toUpperCase()}
            </Text>
          </View>
        </View>
        
        <View style={styles.detailsRow}>
          <Calendar size={14} color={tokens.colors.textSecondary} />
          <Text style={[styles.detailsText, { color: tokens.colors.textSecondary }]}>{appointment.date}</Text>
        </View>
        
        <View style={styles.detailsRow}>
          <Clock size={14} color={tokens.colors.textSecondary} />
          <Text style={[styles.detailsText, { color: tokens.colors.textSecondary }]}>{appointment.time}</Text>
        </View>
        
        <View style={styles.detailsRow}>
          {appointment.locationType === 'video' ? (
            <Video size={14} color={tokens.colors.textSecondary} />
          ) : (
            <MapPin size={14} color={tokens.colors.textSecondary} />
          )}
          <Text style={[styles.detailsText, { color: tokens.colors.textSecondary }]} numberOfLines={1}>
            {appointment.locationDetails || appointment.locationType}
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={[styles.contactName, { color: tokens.colors.textPrimary }]}>With: {appointment.contactName}</Text>
        </View>
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
  title: {
    fontSize: tokens.typography.titleMedium.fontSize,
    fontWeight: 'bold',
    flex: 1,
    marginRight: tokens.spacing.sm,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: tokens.borderRadius.sm,
  },
  statusText: {
    fontSize: tokens.typography.labelSmall.fontSize,
    fontWeight: 'bold',
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailsText: {
    fontSize: tokens.typography.bodyMedium.fontSize,
    marginLeft: tokens.spacing.xs,
  },
  footer: {
    marginTop: tokens.spacing.sm,
    paddingTop: tokens.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: tokens.colors.borderLight,
  },
  contactName: {
    fontSize: tokens.typography.labelMedium.fontSize,
    fontWeight: '600',
  },
});
