'use client'

import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { AlertCircle } from 'lucide-react'

interface LeagueFormButtonsProps {
  mode: 'new' | 'edit-draft' | 'edit-template' | 'view' | 'admin-review'
  isSubmitting: boolean
  isSavingDraft: boolean
  draftName: string
  onDraftNameChange: (name: string) => void
  onSaveDraft: () => void
  onSaveAsTemplate?: () => void
  onSubmit: () => void
  onUpdateTemplate: () => void
  onClose?: () => void
  // Admin review props
  rejectionReason?: string
  onRejectionReasonChange?: (reason: string) => void
  onApproveLeague?: () => Promise<void>
  onRejectLeague?: () => Promise<void>
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
  rejectionReason,
  onRejectionReasonChange,
  onApproveLeague,
  onRejectLeague,
}: LeagueFormButtonsProps) {
  const isViewingLeague = mode === 'view'
  const isEditingDraft = mode === 'edit-draft'
  const isEditingTemplate = mode === 'edit-template'
  const isAdminReview = mode === 'admin-review'
  const [isApproving, setIsApproving] = useState(false)
  const [isRejecting, setIsRejecting] = useState(false)
  const [showDraftNameField, setShowDraftNameField] = useState(false)

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

  if (isAdminReview) {
    const canApprove = isApproving || isRejecting ? false : true
    const canReject = !rejectionReason || isApproving || isRejecting ? false : true

    return (
      <>
        {/* Rejection Reason Input */}
        <div className="space-y-2">
          <label htmlFor="rejection_reason" className="text-sm font-medium text-gray-700">
            Rejection Reason (if rejecting)
          </label>
          <textarea
            id="rejection_reason"
            placeholder="Explain why this league submission is being rejected..."
            value={rejectionReason || ''}
            onChange={(e) => onRejectionReasonChange?.(e.target.value)}
            maxLength={500}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-400"
          />
          <p className="text-xs text-gray-500">
            {rejectionReason?.length || 0}/500 characters
          </p>
        </div>

        {/* Admin Action Buttons */}
        <div className="flex gap-3">
          <Button
            type="button"
            onClick={async () => {
              setIsApproving(true)
              try {
                await onApproveLeague?.()
              } finally {
                setIsApproving(false)
              }
            }}
            disabled={!canApprove || isApproving}
            className="flex-1 bg-green-600 hover:bg-green-700"
          >
            {isApproving ? 'Approving...' : 'Approve League'}
          </Button>
          <Button
            type="button"
            onClick={async () => {
              setIsRejecting(true)
              try {
                await onRejectLeague?.()
              } finally {
                setIsRejecting(false)
              }
            }}
            disabled={!canReject || isRejecting}
            variant="destructive"
            className="flex-1"
          >
            {isRejecting ? 'Rejecting...' : 'Reject League'}
          </Button>
          <Button
            type="button"
            onClick={onClose}
            variant="outline"
            className="flex-1"
          >
            Close
          </Button>
        </div>

        {/* Validation Message */}
        {!rejectionReason && (
          <div className="flex gap-2 p-3 bg-amber-50 border border-amber-200 rounded-md">
            <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-700">
              Please provide a rejection reason before rejecting this league.
            </p>
          </div>
        )}
      </>
    )
  }

  return (
    <>
      {/* Draft Name Input (only show after user clicks "Save Draft") */}
      {showDraftNameField && !isEditingDraft && !isEditingTemplate && !isViewingLeague && (
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
            autoFocus
          />
          <p className="text-xs text-gray-500">
            If left blank, the draft will be auto-named based on the league name.
          </p>
        </div>
      )}

      {/* Button Group */}
      <div className="flex gap-3">
        {/* Save Draft button - shown for new drafts, when editing existing draft, or when editing template */}
        {(isEditingDraft || isEditingTemplate || (!isEditingDraft && !isEditingTemplate)) && (
          <Button
            type="button"
            onClick={() => {
              if (!showDraftNameField && !isEditingDraft && !isEditingTemplate) {
                setShowDraftNameField(true)
              } else {
                onSaveDraft()
              }
            }}
            disabled={isSavingDraft || isSubmitting}
            variant="outline"
            className="flex-1"
          >
            {isSavingDraft ? 'Saving Draft...' : isEditingDraft ? 'Save Changes' : isEditingTemplate ? 'Save as Draft' : showDraftNameField ? 'Confirm Draft' : 'Save Draft'}
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
        {isEditingTemplate && (
          <Button
            type="button"
            onClick={onUpdateTemplate}
            disabled={isSubmitting || isSavingDraft}
            variant="outline"
            className="flex-1"
          >
            {isSubmitting ? 'Updating...' : 'Update Template'}
          </Button>
        )}
        {!isEditingTemplate && (
          <Button
            type="submit"
            onClick={onSubmit}
            disabled={isSubmitting || isSavingDraft}
            className="flex-1"
          >
            {isSubmitting ? 'Submitting...' : isEditingDraft ? 'Submit Draft' : 'Submit League'}
          </Button>
        )}
        {isEditingTemplate && (
          <Button
            type="submit"
            onClick={onSubmit}
            disabled={isSubmitting || isSavingDraft}
            className="flex-1"
          >
            {isSubmitting ? 'Submitting...' : 'Submit League'}
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
