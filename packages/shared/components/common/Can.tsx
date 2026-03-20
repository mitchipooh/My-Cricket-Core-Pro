
import React from 'react';
import { UserProfile } from '@shared/types';

interface CanProps {
  role: UserProfile['role'];
  perform: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const PERMISSIONS = {
  Administrator: ['org:create', 'org:delete', 'team:add', 'team:remove', 'tournament:add', 'fixture:generate'],
  Scorer: ['match:score'],
  'Match Official': ['match:view', 'match:umpire'],
};

export const Can: React.FC<CanProps> = ({ role, perform, children, fallback = null }) => {
  const userPermissions = PERMISSIONS[role] || [];
  const canPerform = userPermissions.includes(perform);

  return canPerform ? <>{children}</> : <>{fallback}</>;
};

