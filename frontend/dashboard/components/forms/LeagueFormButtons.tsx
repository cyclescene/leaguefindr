'use client'

import { Button } from '@/components/ui/button'
import { useState } from 'react'

interface LeagueFormButtonsProps {
  mode: 'new' | 'edit-draft' | 'edit-template' | 'view'
  isSubmitting: boolean
  isSavingDraft: boolean
  draftName: string
  onDraftNameChange: (name: string) => void
  onSaveDraft: () => void
  onSaveAsTemplate?: () => void
  onSubmit: () => void
  onUpdateTemplate: () => void
  onClose?: () => void
}

export function LeagueFormButtons({
  mode,
  isSubmitting,
  isSavingDraft,
  draftName,
  onDraftNameChange,
  onSaveDraft,
  onSaveAsTemplate,
  onSubmit,
  onUpdateTemplate,
  onClose,
}: LeagueFormButtonsProps) {
  const isViewingLeague = mode === 'view'
  const isEditingDraft = mode === 'edit-draft'
  const isEditingTemplate = mode === 'edit-template'

  if (isViewingLeague) {
    return (
      <div className="flex gap-3">
        <Button
          type="button"
          onClick={onClose}
          className="flex-1"
        >
          Close
        </Button>
      </div>
    )
  }

  return (
    <>
      {/* Draft Name Input (only show when saving new draft) */}
      {!isEditingDraft && !isEditingTemplate && !isViewingLeague && (
        <div className="space-y-2">
          <label htmlFor="draft_name" className="text-sm font-medium text-gray-700">
            Draft Name (Optional)
          </label>
          <input
            id="draft_name"
            type="text"
            placeholder="e.g., Summer Basketball League"
            value={draftName}
            onChange={(e) => onDraftNameChange(e.target.value)}
            maxLength={255}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-400"
          />
          <p className="text-xs text-gray-500">
            If left blank, the draft will be auto-named based on the league name.
          </p>
        </div>
      )}

      {/* Button Group */}
      <div className="flex gap-3">
        {!isEditingDraft && !isEditingTemplate && (
          <Button
            type="button"
            onClick={onSaveDraft}
            disabled={isSavingDraft || isSubmitting}
            variant="outline"
            className="flex-1"
          >
            {isSavingDraft ? 'Saving Draft...' : 'Save Draft'}
          </Button>
        )}
        {!isEditingDraft && !isEditingTemplate && onSaveAsTemplate && (
          <Button
            type="button"
            onClick={onSaveAsTemplate}
            disabled={isSubmitting || isSavingDraft}
            variant="outline"
            className="flex-1"
          >
            Continue to Save as Template
          </Button>
        )}
        {!isEditingTemplate && (
          <Button
            type="submit"
            disabled={isSubmitting || isSavingDraft}
            className="flex-1"
          >
            {isSubmitting ? 'Submitting...' : 'Submit League'}
          </Button>
        )}
        {isEditingTemplate && (
          <Button
            type="button"
            onClick={onUpdateTemplate}
            disabled={isSubmitting}
            className="flex-1"
          >
            {isSubmitting ? 'Updating...' : 'Update Template'}
          </Button>
        )}
      </div>

      {!isEditingTemplate && !isViewingLeague && (
        <p className="text-xs text-gray-500">
          Your league submission will be reviewed by an admin before appearing on the map.
        </p>
      )}
    </>
  )
}
