'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

interface SaveLeagueModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaveAsDraft: (name: string) => Promise<void>
  onSaveAsTemplate: (name: string) => Promise<void>
}

export function SaveLeagueModal({
  open,
  onOpenChange,
  onSaveAsDraft,
  onSaveAsTemplate,
}: SaveLeagueModalProps) {
  const [saveType, setSaveType] = useState<'draft' | 'template' | null>(null)
  const [name, setName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSave = async () => {
    setError(null)

    if (!name.trim()) {
      setError(`Please enter a ${saveType} name`)
      return
    }

    if (name.length > 255) {
      setError(`${saveType === 'draft' ? 'Draft' : 'Template'} name must be at most 255 characters`)
      return
    }

    setIsLoading(true)

    try {
      if (saveType === 'draft') {
        await onSaveAsDraft(name)
      } else {
        await onSaveAsTemplate(name)
      }

      // Reset and close modal on success
      setName('')
      setSaveType(null)
      onOpenChange(false)
    } catch (err) {
      const message = err instanceof Error ? err.message : `Failed to save as ${saveType}`
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setName('')
    setSaveType(null)
    setError(null)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {saveType ? `Save as ${saveType === 'draft' ? 'Draft' : 'Template'}` : 'Save League Configuration'}
          </DialogTitle>
          <DialogDescription>
            {!saveType
              ? 'Choose how you want to save this league configuration'
              : `Enter a name for your ${saveType}`}
          </DialogDescription>
        </DialogHeader>

        {!saveType ? (
          // Step 1: Choose save type
          <div className="flex gap-3 py-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setSaveType('draft')}
              className="flex-1 flex flex-col items-center gap-2 h-auto py-4"
            >
              <div className="font-semibold">Save as Draft</div>
              <div className="text-xs text-gray-600">Save for later and continue editing</div>
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setSaveType('template')}
              className="flex-1 flex flex-col items-center gap-2 h-auto py-4"
            >
              <div className="font-semibold">Save as Template</div>
              <div className="text-xs text-gray-600">Reuse this configuration for future leagues</div>
            </Button>
          </div>
        ) : (
          // Step 2: Enter name
          <div className="space-y-4 py-4">
            {error && (
              <div className="rounded-md bg-red-50 p-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="save_name">
                {saveType === 'draft' ? 'Draft' : 'Template'} Name
              </Label>
              <Input
                id="save_name"
                placeholder={`e.g., ${saveType === 'draft' ? 'Winter Basketball 2025' : 'Standard Basketball League'}`}
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
                maxLength={255}
              />
              <p className="text-xs text-gray-500">
                {name.length}/255 characters
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setSaveType(null)
                  setName('')
                  setError(null)
                }}
                disabled={isLoading}
                className="flex-1"
              >
                Back
              </Button>
              <Button
                type="button"
                onClick={handleSave}
                disabled={isLoading || !name.trim()}
                className="flex-1"
              >
                {isLoading ? `Saving ${saveType}...` : `Save ${saveType === 'draft' ? 'Draft' : 'Template'}`}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
