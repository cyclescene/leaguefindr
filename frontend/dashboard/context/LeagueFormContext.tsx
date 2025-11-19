'use client';

import { createContext, useContext, ReactNode } from 'react';
import type { AddLeagueFormData } from '@/lib/schemas/leagues';

export type FormMode = 'new' | 'edit-draft' | 'edit-template' | 'view' | 'admin-review';

export interface LeagueFormContextType {
  // Mode
  mode: FormMode;

  // IDs
  draftId?: number;
  templateId?: number;
  leagueId?: number;

  // League status and rejection
  leagueStatus?: string;
  leagueRejectionReason?: string | null;

  // Form data
  prePopulatedFormData?: AddLeagueFormData;
  organizationId?: string;
  organizationName?: string;

  // Callbacks
  onSuccess?: () => void;
  onClose?: () => void;
  onLeagueSubmitted?: () => void;

  // Refetch functions
  refetchDrafts?: () => Promise<any>;
  refetchTemplates?: () => Promise<any>;
  refetchLeagues?: () => Promise<any>;

  // Admin review mode
  pendingLeagueId?: number;
  rejectionReason?: string;
  onRejectionReasonChange?: (reason: string) => void;
  onApproveLeague?: () => Promise<void>;
  onRejectLeague?: () => Promise<void>;
}

const LeagueFormContext = createContext<LeagueFormContextType | undefined>(undefined);

export function LeagueFormProvider({
  children,
  value,
}: {
  children: ReactNode;
  value: LeagueFormContextType;
}) {
  return (
    <LeagueFormContext.Provider value={value}>
      {children}
    </LeagueFormContext.Provider>
  );
}

export function useLeagueFormContext() {
  const context = useContext(LeagueFormContext);
  if (!context) {
    throw new Error('useLeagueFormContext must be used within LeagueFormProvider');
  }
  return context;
}
