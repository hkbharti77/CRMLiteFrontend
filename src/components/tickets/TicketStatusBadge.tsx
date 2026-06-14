import React from 'react';
import { StatusBadge } from '@components/global/Badge/StatusBadge';

export interface TicketStatusBadgeProps {
  status: string;
  size?: 'small' | 'medium' | 'large';
}

export const TicketStatusBadge: React.FC<TicketStatusBadgeProps> = ({ status, size = 'small' }) => {
  // We can map specific ticket statuses if needed, 
  // or just rely on the global StatusBadge logic
  let normalizedStatus = status.toLowerCase();
  
  if (['new', 'unassigned'].includes(normalizedStatus)) {
    normalizedStatus = 'open'; // Maps to error/attention color in global badge usually
  } else if (['resolved', 'closed'].includes(normalizedStatus)) {
    normalizedStatus = 'completed';
  } else if (['waiting', 'blocked'].includes(normalizedStatus)) {
    normalizedStatus = 'pending';
  }

  return <StatusBadge status={normalizedStatus} size={size} />;
};
