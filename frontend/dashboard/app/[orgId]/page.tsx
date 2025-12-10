"use client"

import { useAuth, useUser } from "@clerk/nextjs";
import { useParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useEffect, useState, useCallback, useRef } from "react";
import type { ClerkUser } from "@/types/clerk";
import type { League } from "@/types/leagues";
import type { AddLeagueFormData } from "@/lib/schemas/leagues";
import { Header } from "@/components/common/Header";
import { Footer } from "@/components/common/Footer";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CreateOrganizationForm } from "@/components/organizations/CreateOrganizationForm";
import { DeleteOrganizationDialog } from "@/components/organizations/DeleteOrganizationDialog";
import { OrganizationHeader } from "@/components/organizations/OrganizationHeader";
import { OrganizationInfo } from "@/components/organizations/OrganizationInfo";
import { InviteMembersDialog } from "@/components/organizations/InviteMembersDialog";
import { LeaguesActionBar } from "@/components/leagues/LeaguesActionBar";
import { SubmitLeagueDialog } from "@/components/leagues/SubmitLeagueDialog";
import { CreateTemplateDialog } from "@/components/leagues/CreateTemplateDialog";
import { useOrganization } from "@/hooks/useOrganizations";
import { useDraftsAndTemplates, useLeagues } from "@/hooks/useDrafts";
import { useOrganizerLeagues } from "@/hooks/useOrganizerLeagues";
import { useOrganizerDraftsAndTemplates } from "@/hooks/useOrganizerDraftsAndTemplates";
import { OrganizerTableProvider, useOrganizerTable } from "@/context/OrganizerTableContext";

function LeaguesSection({
  orgId,
  debouncedLeaguesSearch,
  debouncedDraftsSearch,
  setLeaguesSearchInput,
  getToken,
  onCreateTemplate,
  onSubmitLeague,
  onViewLeague,
  onSaveAsDraft,
  onSaveAsTemplate,
  setPrePopulatedFormData,
  setIsEditingDraft,
  setEditingDraftId,
  setIsEditingTemplate,
  setEditingTemplateId,
  setOpenDialog,
  refetchLeaguesRef,
  refetchDraftsRef,
}: any) {
  // Get context for search state
  const { state: leaguesState } = useOrganizerTable('leagues');

  // Use the context-aware hooks for sorting, with context search for submitted leagues
  const { leagues: apiLeagues, isLoading: leaguesLoading, refetch: refetchLeagues } = useOrganizerLeagues(orgId, leaguesState.searchQuery);
  const { draftsAndTemplates, isLoading: draftsAndTemplatesLoading, refetch: refetchDraftsAndTemplates } = useOrganizerDraftsAndTemplates(orgId, debouncedDraftsSearch);

  // Expose refetch to parent via refs
  if (refetchLeaguesRef) {
    refetchLeaguesRef.current = refetchLeagues;
  }
  if (refetchDraftsRef) {
    refetchDraftsRef.current = refetchDraftsAndTemplates;
  }

  const submittedLeagues = apiLeagues;
  const displayDrafts = draftsAndTemplates.filter(d => d.type === 'draft');
  const displayTemplates = draftsAndTemplates.filter(d => d.type === 'template');

  // Handlers that need draftsAndTemplates access
  const handleEditDraft = (draftId: number) => {
    const draft = draftsAndTemplates.find((d) => d.id === draftId && d.type === 'draft');
    if (draft && draft.form_data) {
      setPrePopulatedFormData(draft.form_data as AddLeagueFormData);
      setIsEditingDraft(true);
      setEditingDraftId(draftId);
      setOpenDialog("league");
    }
  };

  const handleDeleteDraft = async (draftId: number) => {
    try {
      const token = await getToken();
      if (!token) return;

      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/leagues/drafts/${draftId}?org_id=${orgId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      refetchDraftsAndTemplates();
    } catch (error) {
      console.error("Failed to delete draft:", error);
    }
  };

  const handleEditTemplate = (templateId: number) => {
    const template = draftsAndTemplates.find((t) => t.id === templateId && t.type === 'template');
    if (template && template.form_data) {
      setPrePopulatedFormData(template.form_data as AddLeagueFormData);
      setIsEditingTemplate(true);
      setEditingTemplateId(templateId);
      setOpenDialog("league");
    }
  };

  const handleDeleteTemplate = async (templateId: number) => {
    try {
      const token = await getToken();
      if (!token) return;

      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/leagues/templates/${templateId}?org_id=${orgId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      refetchDraftsAndTemplates();
    } catch (error) {
      console.error("Failed to delete template:", error);
    }
  };

  const handleUseTemplate = (templateId: number) => {
    const template = draftsAndTemplates.find((t) => t.id === templateId && t.type === 'template');
    if (template && template.form_data) {
      setPrePopulatedFormData(template.form_data as AddLeagueFormData);
      setOpenDialog("league");
    }
  };

  return (
    <div>
      {/* Leagues Section */}
      <div className="mb-8">
        <p className="text-neutral-600">
          Manage your organization's leagues and templates
        </p>
      </div>

      <LeaguesActionBar
        onCreateTemplate={onCreateTemplate}
        onSubmitLeague={onSubmitLeague}
        submittedLeagues={submittedLeagues}
        displayDrafts={displayDrafts}
        displayTemplates={displayTemplates}
        submittedLeaguesLoading={leaguesLoading}
        draftsLoading={draftsAndTemplatesLoading}
        templatesLoading={draftsAndTemplatesLoading}
        onViewLeague={onViewLeague}
        onEditTemplate={handleEditTemplate}
        onUseTemplate={handleUseTemplate}
        onDeleteTemplate={handleDeleteTemplate}
        onEditDraft={handleEditDraft}
        onDeleteDraft={handleDeleteDraft}
        onSaveAsDraft={onSaveAsDraft}
        onSaveAsTemplate={onSaveAsTemplate}
      />
    </div>
  );
}

function OrganizationDashboardContent() {
  const { user, isLoaded } = useUser() as { user: ClerkUser | null; isLoaded: boolean };
  const params = useParams();
  const router = useRouter();
  const orgId = params.orgId as string;
  const { getToken } = useAuth();

  const refetchLeaguesRef = useRef<(() => void) | null>(null);
  const refetchDraftsRef = useRef<(() => void) | null>(null);

  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [openDialog, setOpenDialog] = useState<"league" | "template" | null>(null);
  const [prePopulatedFormData, setPrePopulatedFormData] = useState<AddLeagueFormData | undefined>();
  const [isEditingDraft, setIsEditingDraft] = useState(false);
  const [editingDraftId, setEditingDraftId] = useState<number | undefined>();
  const [isEditingTemplate, setIsEditingTemplate] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState<number | undefined>();
  const [isViewingLeague, setIsViewingLeague] = useState(false);
  const [viewingLeagueId, setViewingLeagueId] = useState<number | undefined>();
  const [viewingLeagueStatus, setViewingLeagueStatus] = useState<string | undefined>();
  const [viewingLeagueRejectionReason, setViewingLeagueRejectionReason] = useState<string | null | undefined>();
  const [leaguesSearchInput, setLeaguesSearchInput] = useState('');
  const [debouncedLeaguesSearch, setDebouncedLeaguesSearch] = useState('');
  const [draftsSearchInput, setDraftsSearchInput] = useState('');
  const [debouncedDraftsSearch, setDebouncedDraftsSearch] = useState('');


  const { organization, isLoading, error, refetch } = useOrganization(orgId);

  // Debounce leagues search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedLeaguesSearch(leaguesSearchInput);
    }, 300);
    return () => clearTimeout(timer);
  }, [leaguesSearchInput]);

  // Debounce drafts/templates search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedDraftsSearch(draftsSearchInput);
    }, 300);
    return () => clearTimeout(timer);
  }, [draftsSearchInput]);

  // Note: Drafts and templates fetching moved to LeaguesSection component

  // Redirect to home if user doesn't have access (403 error)
  useEffect(() => {
    if (error && error.message.includes("403")) {
      router.push("/");
    }
  }, [error, router]);

  const handleEditSuccess = async () => {
    await refetch();
  };

  const handleCloseDialog = () => {
    setOpenDialog(null);
    setPrePopulatedFormData(undefined);
    setIsEditingDraft(false);
    setEditingDraftId(undefined);
    setIsEditingTemplate(false);
    setEditingTemplateId(undefined);
    setIsViewingLeague(false);
    setViewingLeagueId(undefined);
    setViewingLeagueStatus(undefined);
    setViewingLeagueRejectionReason(undefined);
  };

  const handleViewLeague = (league: any) => {
    if (league.form_data) {
      setPrePopulatedFormData(league.form_data as AddLeagueFormData);
    } else {
      const formData: AddLeagueFormData = {
        sport_id: (league.sport_id ?? null) as any,
        sport_name: '',
        venue_id: (league.venue_id ?? null) as any,
        venue_name: '',
        venue_address: '',
        venue_lat: null as any,
        venue_lng: null as any,
        league_name: league.league_name,
        division: league.division,
        gender: league.gender as "male" | "female" | "co-ed",
        registration_deadline: league.registration_deadline,
        season_start_date: league.season_start_date,
        season_end_date: league.season_end_date || '',
        season_details: league.season_details || '',
        game_occurrences: league.game_occurrences,
        pricing_strategy: league.pricing_strategy as any,
        pricing_amount: league.pricing_amount,
        per_game_fee: league.per_game_fee || null,
        minimum_team_players: league.minimum_team_players,
        registration_url: league.registration_url,
        duration: league.duration,
        org_id: orgId,
        organization_name: '',
      };
      setPrePopulatedFormData(formData);
    }

    setIsViewingLeague(true);
    setViewingLeagueId(league.id);
    setViewingLeagueStatus(league.status);
    setViewingLeagueRejectionReason(league.rejection_reason);
    setOpenDialog("league");
  };

  const handleSaveAsDraft = async (leagueData: any, name?: string) => {
    try {
      const token = await getToken();
      if (!token) return;

      const generatedName = name || `${leagueData.league_name} Draft - ${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const requestBody: any = {
        name: generatedName,
        data: leagueData.form_data,
      };

      const createResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/leagues/drafts?org_id=${orgId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(requestBody),
        }
      );

      if (!createResponse.ok) {
        return;
      }

      refetchDraftsAndTemplates();
    } catch (error) {
      console.error('Error saving as draft:', error);
    }
  };

  const handleSaveAsTemplate = async (leagueData: any, name?: string) => {
    try {
      const token = await getToken();
      if (!token) return;

      const generatedName = name || `${leagueData.league_name} Template - ${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const requestBody = {
        name: generatedName,
        form_data: leagueData.form_data,
      };

      const createResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/leagues/templates?org_id=${orgId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(requestBody),
        }
      );

      if (!createResponse.ok) {
        return;
      }

      refetchDraftsAndTemplates();
    } catch (error) {
      console.error('Error saving as template:', error);
    }
  };

  const handleTemplateCreated = () => {
    refetchDraftsAndTemplates();
    setOpenDialog(null);
  };

  const handleLeagueSubmitted = () => {
    refetchLeaguesRef.current?.();
  };

  const refetchLeagues = async () => {
    refetchLeaguesRef.current?.();
  };

  const refetchDraftsAndTemplates = async () => {
    refetchDraftsRef.current?.();
  };


  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-neutral-light">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-brand-dark" size={40} />
          <p className="text-brand-dark font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-neutral-light">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-brand-dark" size={40} />
          <p className="text-brand-dark font-medium">Loading organization...</p>
        </div>
      </div>
    );
  }

  if (error || (isLoaded && !isLoading && !organization)) {
    return (
      <div className="flex flex-col min-h-screen bg-neutral-light">
        <Header email={user?.primaryEmailAddress?.emailAddress || user?.emailAddresses[0]?.emailAddress} />
        <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-12">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-brand-dark mb-4">Error Loading Organization</h1>
            <p className="text-neutral-600 mb-8">
              {error?.message || "Organization not found"}
            </p>
            <button
              onClick={() => router.push("/")}
              className="text-brand-dark hover:text-brand-dark/80 underline"
            >
              Go back to organizations
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (isLoading || !organization) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-neutral-light">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-brand-dark" size={40} />
          <p className="text-brand-dark font-medium">Loading organization...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-neutral-light">
      <Header email={user?.primaryEmailAddress?.emailAddress || user?.emailAddresses[0]?.emailAddress} />

      <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-12">
        <div className="mb-2">
          <OrganizationHeader
            orgId={orgId}
            orgName={organization.org_name}
            onEditClick={() => setShowEditDialog(true)}
            onInviteClick={() => setShowInviteDialog(true)}
          />

          <OrganizationInfo
            name={organization.org_name}
            email={organization.org_email}
            phone={organization.org_phone}
            url={organization.org_url}
          />
        </div>

        <OrganizerTableProvider>
          <LeaguesSection
            orgId={orgId}
            debouncedLeaguesSearch={debouncedLeaguesSearch}
            debouncedDraftsSearch={debouncedDraftsSearch}
            setLeaguesSearchInput={setLeaguesSearchInput}
            getToken={getToken}
            onCreateTemplate={() => setOpenDialog("template")}
            onSubmitLeague={() => setOpenDialog("league")}
            onViewLeague={handleViewLeague}
            onSaveAsDraft={handleSaveAsDraft}
            onSaveAsTemplate={handleSaveAsTemplate}
            setPrePopulatedFormData={setPrePopulatedFormData}
            setIsEditingDraft={setIsEditingDraft}
            setEditingDraftId={setEditingDraftId}
            setIsEditingTemplate={setIsEditingTemplate}
            setEditingTemplateId={setEditingTemplateId}
            setOpenDialog={setOpenDialog}
            refetchLeaguesRef={refetchLeaguesRef}
            refetchDraftsRef={refetchDraftsRef}
          />
        </OrganizerTableProvider>
      </main>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-brand-dark">Edit Organization</DialogTitle>
            <DialogDescription>
              Update your organization details
            </DialogDescription>
          </DialogHeader>
          {organization && (
            <div className="space-y-4">
              <CreateOrganizationForm
                organization={{
                  id: organization.id,
                  org_name: organization.org_name,
                  org_email: organization.org_email,
                  org_phone: organization.org_phone,
                  org_url: organization.org_url,
                  org_address: organization.org_address,
                }}
                onSuccess={() => {
                  handleEditSuccess();
                  setShowEditDialog(false);
                }}
                onClose={() => setShowEditDialog(false)}
              />
              <button
                onClick={() => {
                  setShowEditDialog(false);
                  setShowDeleteDialog(true);
                }}
                className="w-full text-red-600 hover:text-red-700 font-semibold text-sm border border-red-300 rounded-md py-2 hover:bg-red-50 transition-colors"
              >
                Delete Organization
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {organization && (
        <DeleteOrganizationDialog
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          organizationId={organization.id}
          organizationName={organization.org_name}
        />
      )}

      <InviteMembersDialog
        open={showInviteDialog}
        onOpenChange={setShowInviteDialog}
        orgId={orgId}
      />

      <SubmitLeagueDialog
        open={openDialog === "league"}
        onOpenChange={(open) => !open && handleCloseDialog()}
        organizationId={orgId}
        onSuccess={handleCloseDialog}
        prePopulatedFormData={prePopulatedFormData}
        isEditingDraft={isEditingDraft}
        editingDraftId={editingDraftId}
        isEditingTemplate={isEditingTemplate}
        editingTemplateId={editingTemplateId}
        isViewingLeague={isViewingLeague}
        viewingLeagueId={viewingLeagueId}
        viewingLeagueStatus={viewingLeagueStatus}
        viewingLeagueRejectionReason={viewingLeagueRejectionReason}
        onLeagueSubmitted={handleLeagueSubmitted}
        refetchDrafts={refetchDraftsAndTemplates}
        refetchTemplates={refetchDraftsAndTemplates}
        refetchLeagues={refetchLeagues}
      />

      <CreateTemplateDialog
        open={openDialog === "template"}
        onOpenChange={(open) => !open && handleCloseDialog()}
        organizationId={orgId}
        onSuccess={handleTemplateCreated}
        refetchTemplates={refetchDraftsAndTemplates}
      />

      <Footer />
    </div>
  );
}

export default function OrganizationDashboard() {
  return <OrganizationDashboardContent />;
}
