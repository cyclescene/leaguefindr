"use client";

import { useUser } from "@clerk/nextjs";
import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import type { ClerkUser } from "@/types/clerk";
import type { League, Template, Draft } from "@/types/leagues";
import { Header } from "@/components/common/Header";
import { Footer } from "@/components/common/Footer";
import { LeaguesHeader } from "@/components/leagues/LeaguesHeader";
import { LeaguesActionBar } from "@/components/leagues/LeaguesActionBar";
import { SubmitLeagueDialog } from "@/components/leagues/SubmitLeagueDialog";
import { CreateTemplateDialog } from "@/components/leagues/CreateTemplateDialog";
import { useDrafts, useTemplates } from "@/hooks/useDrafts";

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

  // Fetch real drafts and templates from API
  const { drafts: apiDrafts, isLoading: draftsLoading } = useDrafts(orgId);
  const { templates: apiTemplates, isLoading: templatesLoading } = useTemplates(orgId);

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
      sport: d.draft_data?.sport_id || 'Unknown',
      ageGroup: d.draft_data?.age_group || 'N/A',
      gender: d.draft_data?.gender || 'N/A',
      dateCreated: new Date(d.created_at).toLocaleDateString(),
    }));

  // Mock data for submitted leagues (will be replaced with API call later)
  const [submittedLeagues] = useState<League[]>([
    {
      id: 1,
      name: "Summer Basketball League",
      organizationName: "Test Org",
      sport: "Basketball",
      ageGroup: "18+",
      gender: "Co-ed",
      startDate: "2024-06-01",
      venue: "Central Court",
      dateSubmitted: "2024-01-15",
      status: "approved",
    },
    {
      id: 2,
      name: "Winter Volleyball",
      organizationName: "Test Org",
      sport: "Volleyball",
      ageGroup: "16+",
      gender: "Female",
      startDate: "2024-12-01",
      venue: "Sports Hall",
      dateSubmitted: "2024-02-10",
      status: "pending_review",
    },
  ]);

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
      />

      <Footer />
    </div>
  );
}

export default function LeaguesPage() {
  return <LeaguesContent />;
}
