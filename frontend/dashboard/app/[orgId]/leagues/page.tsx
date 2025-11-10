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
      dateCreated: new Date(d.created_at).toLocaleDateString(),
    }));

  // Convert API templates to display format
  const displayTemplates = apiTemplates
    .filter(d => d.type === 'template')
    .map(d => ({
      id: d.id,
      name: d.name || `Template #${d.id}`,
      sport: d.draft_data?.sport_name || 'Unknown',
      gender: d.draft_data?.gender || 'N/A',
      dateCreated: new Date(d.created_at).toLocaleDateString(),
    }));

  // Convert API leagues to display format
  const submittedLeagues: League[] = apiLeagues.map(league => ({
    id: league.id,
    name: league.league_name,
    organizationName: "", // Will be populated from org context
    sport: "", // Sport name would need to be fetched separately if needed
    gender: league.gender || 'N/A',
    startDate: league.season_start_date,
    venue: "", // Venue name would need to be fetched separately if needed
    dateSubmitted: new Date(league.created_at).toLocaleDateString(),
    status: league.status === 'approved' ? 'approved' : league.status === 'pending' ? 'pending_review' : 'rejected',
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
  };

  const handleViewLeague = (leagueId: number) => {
    const league = apiLeagues.find((l) => l.id === leagueId);
    if (!league) return;

    // Build form data from draft_data if available, otherwise from league fields
    const draftData = league.draft_data || {};
    const formData: AddLeagueFormData = {
      sport_id: draftData.sport_id,
      sport_name: draftData.sport_name || league.sport || '',
      venue_id: draftData.venue_id,
      venue_name: draftData.venue_name || league.venue || '',
      venue_address: draftData.venue_address || '',
      venue_lat: draftData.venue_lat,
      venue_lng: draftData.venue_lng,
      league_name: draftData.league_name || league.name || '',
      division: draftData.division || '',
      gender: draftData.gender || league.gender || '',
      registration_deadline: draftData.registration_deadline || '',
      season_start_date: draftData.season_start_date || league.startDate || '',
      season_end_date: draftData.season_end_date || '',
      season_details: draftData.season_details || '',
      game_occurrences: draftData.game_occurrences || [],
      pricing_strategy: draftData.pricing_strategy || 'per_person',
      pricing_amount: draftData.pricing_amount,
      per_game_fee: draftData.per_game_fee,
      minimum_team_players: draftData.minimum_team_players,
      registration_url: draftData.registration_url || '',
      duration: draftData.duration,
      org_id: orgId,
      organization_name: draftData.organization_name || '',
    };

    setPrePopulatedFormData(formData);
    setIsViewingLeague(true);
    setViewingLeagueId(leagueId);
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
    if (draft && draft.draft_data) {
      // Load draft data and open form
      setPrePopulatedFormData(draft.draft_data as AddLeagueFormData);
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
    if (template && template.draft_data) {
      // Load template data and open form
      setPrePopulatedFormData(template.draft_data as AddLeagueFormData);
      setIsEditingTemplate(true);
      setEditingTemplateId(templateId);
      setOpenDialog("league");
    }
  };

  const handleUseTemplate = (templateId: number) => {
    const template = apiTemplates.find((t) => t.id === templateId);
    if (template && template.draft_data) {
      // Load template data and open form
      setPrePopulatedFormData(template.draft_data as AddLeagueFormData);
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
