'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'

interface RejectLeagueDialogProps {
  isOpen: boolean
  leagueName?: string
  onClose: () => void
  onReject: (reason: string) => Promise<void>
}

export function RejectLeagueDialog({
  isOpen,
  leagueName,
  onClose,
  onReject,
}: RejectLeagueDialogProps) {
  const [rejectionReason, setRejectionReason] = useState('')
  const [isRejecting, setIsRejecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      setError('Rejection reason is required')
      return
    }

    try {
      setIsRejecting(true)
      setError(null)
      await onReject(rejectionReason)
      // Reset and close
      setRejectionReason('')
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject league')
    } finally {
      setIsRejecting(false)
    }
  }

  const handleClose = () => {
    if (!isRejecting) {
      setRejectionReason('')
      setError(null)
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="border-0 !max-w-2xl">
        <DialogHeader className="bg-red-600 text-white !-mx-6 !-mt-6 !-mb-4 px-6 py-4 rounded-t-lg border-b-2 border-red-600">
          <DialogTitle className="text-white">Reject League Submission</DialogTitle>
          <DialogDescription className="text-red-100">
            {leagueName ? `Rejecting "${leagueName}"` : 'Provide a reason for rejecting this league submission'}
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="rejection-reason">Rejection Reason *</Label>
            <Textarea
              id="rejection-reason"
              placeholder="Explain why this league submission is being rejected. This will be sent to the organization."
              value={rejectionReason}
              onChange={(e) => {
                setRejectionReason(e.target.value)
                setError(null)
              }}
              className="min-h-[120px]"
              maxLength={500}
              disabled={isRejecting}
            />
            <p className="text-xs text-gray-500">
              {rejectionReason.length}/500 characters
            </p>
          </div>

          {error && (
            <div className="rounded-md bg-red-100 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isRejecting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={isRejecting || !rejectionReason.trim()}
            >
              {isRejecting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Rejecting...
                </>
              ) : (
                'Reject League'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
