"use client";

import { useUser } from "@clerk/nextjs";
import { useParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import type { ClerkUser } from "@/types/clerk";
import type { League, Template, Draft } from "@/types/leagues";
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
  const router = useRouter();
  const orgId = params.orgId as string;

  const [openDialog, setOpenDialog] = useState<
    "league" | "template" | "sport" | "venue" | null
  >(null);

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

  const handleCloseDialog = () => setOpenDialog(null);

  const handleViewLeague = (leagueId: number) => {
    console.log("View league:", leagueId);
  };

  const handleEditTemplate = (templateId: number) => {
    console.log("Edit template:", templateId);
  };

  const handleUseTemplate = (templateId: number) => {
    console.log("Use template:", templateId);
  };

  const handleDeleteTemplate = (templateId: number) => {
    console.log("Delete template:", templateId);
  };

  const handleEditDraft = (draftId: number) => {
    console.log("Edit draft:", draftId);
  };

  const handleDeleteDraft = (draftId: number) => {
    console.log("Delete draft:", draftId);
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
