'use client';

import { UserProfile } from '@clerk/nextjs';
import { Lock } from 'lucide-react';

/**
 * Change Password Component
 * Uses Clerk's built-in UserProfile for password management
 */
export function ChangePassword() {
  return (
    <div className="bg-white rounded-lg p-8 border border-neutral-200">
      <h2 className="text-2xl font-bold text-brand-dark mb-6 flex items-center gap-2">
        <Lock className="w-6 h-6" />
        Account Settings
      </h2>

      <p className="text-neutral-600 mb-6">
        Manage your password and other account security settings
      </p>

      {/* Clerk UserProfile component handles password changes */}
      <UserProfile
        appearance={{
          elements: {
            rootBox: 'w-full',
            card: 'bg-neutral-50 border border-neutral-200 rounded-lg',
          },
        }}
      />
    </div>
  );
}
