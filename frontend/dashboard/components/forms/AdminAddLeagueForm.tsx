'use client'

import { useState } from 'react'
import { AddLeagueForm } from './AddLeagueForm'
import { LeagueFormProvider } from '@/context/LeagueFormContext'
import { OrganizationAutocomplete } from './OrganizationAutocomplete'
import { type AddLeagueFormData } from '@/lib/schemas/leagues'

interface Organization {
  id: string
  org_name: string
  org_email?: string
}

interface AdminAddLeagueFormProps {
  onSuccess?: () => void
  onClose?: () => void
}

export function AdminAddLeagueForm({ onSuccess, onClose }: AdminAddLeagueFormProps) {
  const [selectedOrganization, setSelectedOrganization] = useState<Organization | null>(null)
  const [organizationName, setOrganizationName] = useState('')

  const handleOrganizationSelect = (org: Organization) => {
    setSelectedOrganization(org)
  }

  const handleClearOrganization = () => {
    setSelectedOrganization(null)
    setOrganizationName('')
  }

  // Only render the league form if organization is selected
  if (!selectedOrganization) {
    return (
      <div className="space-y-4 px-6 py-4">
        <OrganizationAutocomplete
          value={organizationName}
          onChange={setOrganizationName}
          onOrganizationSelect={handleOrganizationSelect}
          selectedOrganization={selectedOrganization}
          onClear={handleClearOrganization}
        />
        <p className="text-sm text-gray-600">
          Please select an organization to create a league submission on their behalf.
        </p>
      </div>
    )
  }

  // Once organization is selected, render the league form with context
  return (
    <LeagueFormProvider
      value={{
        mode: 'new',
        organizationId: selectedOrganization.id,
        organizationName: selectedOrganization.org_name,
        onSuccess,
        onClose,
      }}
    >
      <div className="space-y-4">
        {/* Organization selection header */}
        <div className="px-6 pt-4 pb-2 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Selected Organization</p>
              <p className="text-sm font-semibold">{selectedOrganization.org_name}</p>
            </div>
            <button
              type="button"
              onClick={handleClearOrganization}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium"
            >
              Change
            </button>
          </div>
        </div>

        {/* League form */}
        <AddLeagueForm />
      </div>
    </LeagueFormProvider>
  )
}
