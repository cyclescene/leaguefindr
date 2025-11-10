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

  // Fetch real leagues, drafts and templates from API
  const { leagues: apiLeagues, isLoading: leaguesLoading } = useLeagues(orgId);
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
  };

  const handleViewLeague = (leagueId: number) => {
    console.log("View league:", leagueId);
  };

  const handleDeleteDraft = async (draftId: number) => {
    try {
      const token = await getToken();
      if (!token) return;

      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/leagues/drafts/${orgId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
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
    if (template) {
      // Open edit template dialog
      console.log("Edit template:", template);
      // TODO: Implement template edit dialog
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
      />

      <CreateTemplateDialog
        open={openDialog === "template"}
        onOpenChange={(open) => !open && handleCloseDialog()}
        organizationId={orgId}
        onSuccess={handleTemplateCreated}
      />

      <Footer />
    </div>
  );
}

export default function LeaguesPage() {
  return <LeaguesContent />;
}
