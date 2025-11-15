"use client";

import { useAuth, useUser } from "@clerk/nextjs";
import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import type { ClerkUser } from "@/types/clerk";
import type { League } from "@/types/leagues";
import type { AddLeagueFormData } from "@/lib/schemas/leagues";
import { Header } from "@/components/common/Header";
import { Footer } from "@/components/common/Footer";
import { LeaguesHeader } from "@/components/leagues/LeaguesHeader";
import { LeaguesActionBar } from "@/components/leagues/LeaguesActionBar";
import { SubmitLeagueDialog } from "@/components/leagues/SubmitLeagueDialog";
import { CreateTemplateDialog } from "@/components/leagues/CreateTemplateDialog";
import { useDrafts, useTemplates, useLeagues } from "@/hooks/useDrafts";

function LeaguesContent() {
  const { user, isLoaded } = useUser() as {
    user: ClerkUser | null;
    isLoaded: boolean;
  };
  const params = useParams();
  const orgId = params.orgId as string;


  const { getToken } = useAuth();

  const [openDialog, setOpenDialog] = useState<
    "league" | "template" | "sport" | "venue" | null
  >(null);
  const [prePopulatedFormData, setPrePopulatedFormData] = useState<AddLeagueFormData | undefined>();
  const [isEditingDraft, setIsEditingDraft] = useState(false);
  const [editingDraftId, setEditingDraftId] = useState<number | undefined>();
  const [isEditingTemplate, setIsEditingTemplate] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState<number | undefined>();
  const [isViewingLeague, setIsViewingLeague] = useState(false);
  const [viewingLeagueId, setViewingLeagueId] = useState<number | undefined>();
  const [viewingLeagueStatus, setViewingLeagueStatus] = useState<string | undefined>();
  const [viewingLeagueRejectionReason, setViewingLeagueRejectionReason] = useState<string | null | undefined>();

  // Fetch real leagues, drafts and templates from API
  const { leagues: apiLeagues, isLoading: leaguesLoading, mutate: mutateLeagues } = useLeagues(orgId);
  const { drafts: apiDrafts, isLoading: draftsLoading, mutate: mutateDrafts } = useDrafts(orgId);
  const { templates: apiTemplates, isLoading: templatesLoading, mutate: mutateTemplates } = useTemplates(orgId);

  // Convert API drafts to display format
  const displayDrafts = apiDrafts
    .filter(d => d.type === 'draft')
    .map(d => ({
      id: d.id,
      name: d.name || `Draft #${d.id}`,
      sport: d.form_data?.sport_name || 'Unknown',
      gender: d.form_data?.gender || 'N/A',
      startDate: d.form_data?.season_start_date ? new Date(d.form_data.season_start_date).toLocaleDateString() : 'N/A',
      venue: d.form_data?.venue_name || 'N/A',
      dateSubmitted: new Date(d.created_at).toLocaleDateString(),
      status: 'draft',
    }));

  // Convert API templates to display format
  const displayTemplates = apiTemplates
    .filter(d => d.type === 'template')
    .map(d => ({
      id: d.id,
      name: d.name || `Template #${d.id}`,
      sport: d.form_data?.sport_name || 'Unknown',
      gender: d.form_data?.gender || 'N/A',
      dateCreated: new Date(d.created_at).toLocaleDateString(),
    }));

  // Convert API leagues to display format
  const submittedLeagues: League[] = apiLeagues.map(league => ({
    id: league.id,
    name: league.league_name,
    organizationName: league.form_data?.organization_name || "", // Will be populated from org context
    sport: league.form_data?.sport_name || "Unknown",
    gender: league.gender || 'N/A',
    startDate: new Date(league.season_start_date).toLocaleDateString(),
    venue: league.form_data?.venue_name || "Unknown",
    dateSubmitted: new Date(league.created_at).toLocaleDateString(),
    status: league.status === 'approved' ? 'approved' : league.status === 'pending' ? 'pending' : 'rejected',
    rejection_reason: league.rejection_reason,
  }));

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

  const handleViewLeague = (leagueId: number) => {
    const league = apiLeagues.find((l) => l.id === leagueId);
    if (!league) return;

    // Use form_data if available, otherwise build from league fields
    if (league.form_data) {
      setPrePopulatedFormData(league.form_data as AddLeagueFormData);
    } else {
      // Fallback: Build form data from league fields (shouldn't normally happen)
      const formData: AddLeagueFormData = {
        sport_id: league.sport_id,
        sport_name: '',
        venue_id: league.venue_id,
        venue_name: '',
        venue_address: '',
        venue_lat: undefined,
        venue_lng: undefined,
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
        per_game_fee: league.per_game_fee || undefined,
        minimum_team_players: league.minimum_team_players,
        registration_url: league.registration_url,
        duration: league.duration,
        org_id: orgId,
        organization_name: '',
      };
      setPrePopulatedFormData(formData);
    }

    setIsViewingLeague(true);
    setViewingLeagueId(leagueId);
    setViewingLeagueStatus(league.status);
    setViewingLeagueRejectionReason(league.rejection_reason);
    setOpenDialog("league");
  };

  const handleDeleteDraft = async (draftId: number) => {
    try {
      const token = await getToken();
      if (!token) return;

      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/leagues/drafts/org/${orgId}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            draft_id: draftId,
          }),
        }
      );

      mutateDrafts();
    } catch (error) {
      console.error("Failed to delete draft:", error);
    }
  };

  const handleEditDraft = (draftId: number) => {
    const draft = apiDrafts.find((d) => d.id === draftId);
    if (draft && draft.form_data) {
      // Load draft data and open form
      setPrePopulatedFormData(draft.form_data as AddLeagueFormData);
      setIsEditingDraft(true);
      setEditingDraftId(draftId);
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

      mutateTemplates();
    } catch (error) {
      console.error("Failed to delete template:", error);
    }
  };

  const handleEditTemplate = (templateId: number) => {
    const template = apiTemplates.find((t) => t.id === templateId);
    if (template && template.form_data) {
      // Load template data and open form
      setPrePopulatedFormData(template.form_data as AddLeagueFormData);
      setIsEditingTemplate(true);
      setEditingTemplateId(templateId);
      setOpenDialog("league");
    }
  };

  const handleUseTemplate = (templateId: number) => {
    const template = apiTemplates.find((t) => t.id === templateId);
    if (template && template.form_data) {
      // Load template data and open form
      setPrePopulatedFormData(template.form_data as AddLeagueFormData);
      setOpenDialog("league");
    }
  };

  const handleTemplateCreated = () => {
    mutateTemplates();
    setOpenDialog(null);
  };

  const handleLeagueSubmitted = () => {
    mutateLeagues();
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

  return (
    <div className="flex flex-col min-h-screen bg-neutral-light">
      <Header />

      <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-12">
        <LeaguesHeader orgId={orgId} />

        <LeaguesActionBar
          onCreateTemplate={() => setOpenDialog("template")}
          onSubmitLeague={() => setOpenDialog("league")}
          submittedLeagues={submittedLeagues}
          displayDrafts={displayDrafts}
          displayTemplates={displayTemplates}
          submittedLeaguesLoading={leaguesLoading}
          draftsLoading={draftsLoading}
          templatesLoading={templatesLoading}
          onViewLeague={handleViewLeague}
          onEditTemplate={handleEditTemplate}
          onUseTemplate={handleUseTemplate}
          onDeleteTemplate={handleDeleteTemplate}
          onEditDraft={handleEditDraft}
          onDeleteDraft={handleDeleteDraft}
        />
      </main>

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
        mutateDrafts={mutateDrafts}
        mutateTemplates={mutateTemplates}
        mutateLeagues={mutateLeagues}
      />

      <CreateTemplateDialog
        open={openDialog === "template"}
        onOpenChange={(open) => !open && handleCloseDialog()}
        organizationId={orgId}
        onSuccess={handleTemplateCreated}
        mutateTemplates={mutateTemplates}
      />

      <Footer />
    </div>
  );
}

export default function LeaguesPage() {
  return <LeaguesContent />;
}
