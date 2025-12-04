'use client'

import { useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import type { AddLeagueFormData } from '@/lib/schemas/leagues'

interface UseLeagueDraftOperationsProps {
  organizationId?: string
  onSuccess?: () => void
}

type DraftType = 'draft' | 'template'

/**
 * Hook to handle all draft/template CRUD operations (Create, Read, Update, Delete)
 * Eliminates ~100 lines of draft handling code from AddLeagueForm
 * Handles both drafts and templates with different endpoints based on type
 */
export function useLeagueDraftOperations({
  organizationId,
  onSuccess,
}: UseLeagueDraftOperationsProps = {}) {
  const { getToken } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Save a draft or template (create new or update existing)
   * Automatically routes to correct endpoint based on draftType:
   * - draft: POST to /v1/leagues/drafts
   * - template: POST to /v1/leagues/templates (create) or PUT to /v1/leagues/templates/{id} (update)
   * @param data - Form data to save
   * @param name - Name of the draft/template
   * @param draftType - Type: 'draft' or 'template'
   * @param draftId - Optional draft/template ID if updating existing
   */
  const save = async (
    data: AddLeagueFormData,
    name: string,
    draftType: DraftType = 'draft',
    draftId?: number
  ) => {
    setError(null)
    setIsLoading(true)

    try {
      const token = await getToken()

      if (!token || !organizationId) {
        throw new Error('Authentication or organization required')
      }

      // Determine endpoint and method based on draft type
      let endpoint: string
      let method: 'POST' | 'PUT' = 'POST'
      let body: any

      if (draftType === 'template') {
        if (draftId) {
          // Update template: PUT /v1/leagues/templates/{templateId}
          endpoint = `${process.env.NEXT_PUBLIC_API_URL}/v1/leagues/templates/${draftId}?org_id=${organizationId}`
          method = 'PUT'
          body = data
        } else {
          // Create template: POST /v1/leagues/templates
          endpoint = `${process.env.NEXT_PUBLIC_API_URL}/v1/leagues/templates?org_id=${organizationId}`
          body = { name: name || null, form_data: data }
        }
      } else {
        // Create/Update draft: POST /v1/leagues/drafts
        endpoint = `${process.env.NEXT_PUBLIC_API_URL}/v1/leagues/drafts?org_id=${organizationId}`
        body = {
          draft_id: draftId || undefined,
          name: name || null,
          data,
        }
      }

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Failed to save ${draftType}`)
      }

      onSuccess?.()
      return await response.json()
    } catch (err) {
      const message =
        err instanceof Error ? err.message : `Failed to save ${draftType}`
      setError(message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Delete a draft or template
   * Automatically routes to correct endpoint based on draftType:
   * - draft: DELETE to /v1/leagues/drafts/org/{orgId} with body {draft_id}
   * - template: DELETE to /v1/leagues/templates/{templateId}
   * @param draftId - ID of draft/template to delete
   * @param draftType - Type: 'draft' or 'template'
   */
  const remove = async (draftId: number, draftType: DraftType = 'draft') => {
    setError(null)
    setIsLoading(true)

    try {
      const token = await getToken()

      if (!token || !organizationId) {
        throw new Error('Authentication or organization required')
      }

      // Determine endpoint and body based on draft type
      const endpoint =
        draftType === 'template'
          ? `${process.env.NEXT_PUBLIC_API_URL}/v1/leagues/templates/${draftId}`
          : `${process.env.NEXT_PUBLIC_API_URL}/v1/leagues/drafts/org/${organizationId}`

      const response = await fetch(endpoint, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body:
          draftType === 'draft'
            ? JSON.stringify({ draft_id: draftId })
            : undefined,
      })

      if (!response.ok) {
        throw new Error(`Failed to delete ${draftType}`)
      }

      onSuccess?.()
    } catch (err) {
      const message =
        err instanceof Error ? err.message : `Failed to delete ${draftType}`
      setError(message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  return {
    save,
    remove,
    isLoading,
    error,
    setError,
  }
}
