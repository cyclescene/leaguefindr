'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AddLeagueForm } from "@/components/forms/AddLeagueForm";
import { LeagueFormProvider } from "@/context/LeagueFormContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAuth } from '@clerk/nextjs';
import { useOrganization } from "@/hooks/useOrganizations";
import type { AddLeagueFormData } from '@/lib/schemas/leagues';

interface CreateTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId?: string;
  onSuccess?: () => void;
  refetchTemplates?: () => Promise<any>;
}

export function CreateTemplateDialog({
  open,
  onOpenChange,
  organizationId,
  onSuccess,
  refetchTemplates,
}: CreateTemplateDialogProps) {
  const { getToken } = useAuth();
  const { organization } = useOrganization(organizationId || "");
  const organizationName = organization?.org_name;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<AddLeagueFormData | null>(null);
  const [showNameModal, setShowNameModal] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateNameError, setTemplateNameError] = useState<string | null>(null);

  const handleSaveAsTemplate = (data: AddLeagueFormData) => {
    setFormData(data);
    setShowNameModal(true);
  };

  const handleCreateTemplate = async () => {
    setTemplateNameError(null);
    setError(null);

    if (!templateName.trim()) {
      setTemplateNameError('Template name is required');
      return;
    }

    if (templateName.length > 255) {
      setTemplateNameError('Template name must be at most 255 characters');
      return;
    }

    if (!formData) {
      setError('Please fill out the league form before creating a template');
      return;
    }

    if (!organizationId) {
      setError('Organization ID is missing');
      return;
    }

    setIsSubmitting(true);

    try {
      const token = await getToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/leagues/templates?org_id=${organizationId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: templateName,
            form_data: formData,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to create template');
      }

      // Refresh templates list after creation
      if (refetchTemplates) {
        await refetchTemplates();
      }

      toast.success('Template created successfully!');
      setTemplateName('');
      setFormData(null);
      setShowNameModal(false);
      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => onOpenChange(false);

  return (
    <>
      {/* Main Create Template Dialog */}
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="border-0 !max-w-5xl w-[85vw] max-h-[95vh] overflow-y-auto">
          <DialogHeader className="bg-brand-dark text-white !-mx-6 !-mt-6 !-mb-4 px-6 py-4 rounded-t-lg border-b-2 border-brand-dark">
            <DialogTitle className="text-white">Create Template</DialogTitle>
            <DialogDescription className="text-gray-200">
              Save a league configuration as a reusable template for future submissions
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-6 px-6">
            {/* League Form Section */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">League Configuration</h3>
              <LeagueFormProvider
                value={{
                  mode: 'create-template',
                  organizationId,
                  organizationName,
                  onClose: handleClose,
                }}
              >
                <AddLeagueForm onSaveAsTemplate={handleSaveAsTemplate} />
              </LeagueFormProvider>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Template Name Modal */}
      <Dialog open={showNameModal} onOpenChange={setShowNameModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Save Template</DialogTitle>
            <DialogDescription>
              Give your template a name so you can easily identify it later
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="rounded-md bg-red-50 p-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="modal_template_name">Template Name *</Label>
              <Input
                id="modal_template_name"
                placeholder="e.g., Summer Basketball League"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                disabled={isSubmitting}
                autoFocus
              />
              {templateNameError && (
                <p className="text-sm text-red-600">{templateNameError}</p>
              )}
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowNameModal(false);
                setTemplateName('');
                setTemplateNameError(null);
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleCreateTemplate}
              disabled={isSubmitting || !templateName.trim()}
            >
              {isSubmitting ? 'Creating...' : 'Create Template'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
