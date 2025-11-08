"use client";

import { useUser } from "@clerk/nextjs";
import { useAuth } from "@clerk/nextjs";
import { useParams, useRouter } from "next/navigation";
import { Loader2, ChevronLeft } from "lucide-react";
import { useState, useEffect } from "react";
import type { ClerkUser } from "@/types/clerk";
import { Header } from "@/components/common/Header";
import { Footer } from "@/components/common/Footer";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AddLeagueForm } from "@/components/forms/AddLeagueForm";
import { AddSportForm } from "@/components/forms/AddSportForm";
import { AddVenueForm } from "@/components/forms/AddVenueForm";
import { OrganizerLeagueTable } from "@/components/organizer/OrganizerLeagueTable";
import { OrganizerTemplateTable } from "@/components/organizer/OrganizerTemplateTable";
import { OrganizerDraftTable } from "@/components/organizer/OrganizerDraftTable";

interface League {
  id: number;
  name: string;
  organizationName: string;
  sport: string;
  ageGroup: string;
  gender: string;
  startDate: string;
  venue: string;
  dateSubmitted: string;
  status: string;
}

interface Template {
  id: number;
  name: string;
  sport: string;
  ageGroup: string;
  gender: string;
  dateCreated: string;
}

interface Draft {
  id: number;
  name: string;
  dateCreated: string;
}

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

  // Mock data - will be replaced with API calls
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

  const [drafts] = useState<Draft[]>([
    {
      id: 1,
      name: "Draft League",
      dateCreated: "2024-02-15",
    },
  ]);

  const [templates] = useState<Template[]>([
    {
      id: 1,
      name: "Standard Basketball Template",
      sport: "Basketball",
      ageGroup: "18+",
      gender: "Co-ed",
      dateCreated: "2024-01-10",
    },
    {
      id: 2,
      name: "Youth Soccer Template",
      sport: "Soccer",
      ageGroup: "U16",
      gender: "Co-ed",
      dateCreated: "2024-01-12",
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
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm mb-8">
          <button
            onClick={() => router.push(`/${orgId}`)}
            className="text-brand-dark hover:text-brand-dark/80 font-medium flex items-center gap-1"
          >
            <ChevronLeft size={16} />
            Back to Organization
          </button>
        </div>

        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-brand-dark mb-2">Leagues</h1>
          <p className="text-neutral-600">
            Manage your organization's leagues and templates
          </p>
        </div>

        {/* Tabs with Action Buttons */}
        <Tabs defaultValue="submitted">
          <div className="flex flex-row w-full justify-between items-center mb-6">
            <TabsList>
              <TabsTrigger value="submitted">Submitted Leagues</TabsTrigger>
              <TabsTrigger value="drafts">Drafts</TabsTrigger>
              <TabsTrigger value="templates">Templates</TabsTrigger>
            </TabsList>

            <ButtonGroup>
              <Button
                variant="brandDark"
                onClick={() => setOpenDialog("sport")}
              >
                Add Sport
              </Button>
              <Button
                variant="brandDark"
                onClick={() => setOpenDialog("venue")}
              >
                Add Venue
              </Button>
              <Button
                variant="brandDark"
                onClick={() => setOpenDialog("template")}
              >
                Create Template
              </Button>
              <Button
                variant="brandDark"
                onClick={() => setOpenDialog("league")}
              >
                Submit League
              </Button>
            </ButtonGroup>
          </div>

          {/* Submitted Leagues Tab */}
          <TabsContent value="submitted">
            {submittedLeagues.length > 0 ? (
              <OrganizerLeagueTable
                leagues={submittedLeagues}
                onView={handleViewLeague}
              />
            ) : (
              <div className="bg-white rounded-lg p-8 border border-neutral-200 text-center">
                <p className="text-neutral-600 mb-4">
                  You haven't submitted any leagues yet.
                </p>
                <Button
                  variant="brandDark"
                  onClick={() => setOpenDialog("league")}
                >
                  Submit Your First League
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Drafts Tab */}
          <TabsContent value="drafts">
            {drafts.length > 0 ? (
              <OrganizerDraftTable
                drafts={drafts}
                onEdit={handleEditDraft}
                onDelete={handleDeleteDraft}
              />
            ) : (
              <div className="bg-white rounded-lg p-8 border border-neutral-200 text-center">
                <p className="text-neutral-600 mb-4">
                  You don't have any drafts. Start a new league submission to save a draft.
                </p>
                <Button
                  variant="brandDark"
                  onClick={() => setOpenDialog("league")}
                >
                  Start New League
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Templates Tab */}
          <TabsContent value="templates">
            {templates.length > 0 ? (
              <OrganizerTemplateTable
                templates={templates}
                onEdit={handleEditTemplate}
                onUse={handleUseTemplate}
                onDelete={handleDeleteTemplate}
              />
            ) : (
              <div className="bg-white rounded-lg p-8 border border-neutral-200 text-center">
                <p className="text-neutral-600 mb-4">
                  You haven't created any templates yet.
                </p>
                <Button
                  variant="brandDark"
                  onClick={() => setOpenDialog("template")}
                >
                  Create Your First Template
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Submit League Dialog */}
      <Dialog
        open={openDialog === "league"}
        onOpenChange={(open) => !open && handleCloseDialog()}
      >
        <DialogContent className="border-0 !max-w-5xl w-[85vw] max-h-[95vh] overflow-y-auto">
          <DialogHeader className="bg-brand-dark text-white !-mx-6 !-mt-6 !-mb-4 px-6 py-4 rounded-t-lg border-b-2 border-brand-dark">
            <DialogTitle className="text-white">Submit League</DialogTitle>
            <DialogDescription className="text-gray-200">
              Create a new league submission. Include details about the sport,
              dates, schedule, and pricing.
            </DialogDescription>
          </DialogHeader>
          <AddLeagueForm
            organizationId={orgId}
            onSuccess={handleCloseDialog}
            onClose={handleCloseDialog}
          />
        </DialogContent>
      </Dialog>

      {/* Create Template Dialog */}
      <Dialog
        open={openDialog === "template"}
        onOpenChange={(open) => !open && handleCloseDialog()}
      >
        <DialogContent className="border-0 !max-w-5xl w-[85vw] max-h-[95vh] overflow-y-auto">
          <DialogHeader className="bg-brand-dark text-white !-mx-6 !-mt-6 !-mb-4 px-6 py-4 rounded-t-lg border-b-2 border-brand-dark">
            <DialogTitle className="text-white">Create Template</DialogTitle>
            <DialogDescription className="text-gray-200">
              Create a template for reusable league configurations. You can use
              this to quickly create similar leagues in the future.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 px-6">
            <p className="text-gray-600">
              Template creation form coming soon...
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Sport Dialog */}
      <Dialog
        open={openDialog === "sport"}
        onOpenChange={(open) => !open && handleCloseDialog()}
      >
        <DialogContent className="border-0 !max-w-2xl">
          <DialogHeader className="bg-brand-dark text-white !-mx-6 !-mt-6 !-mb-4 px-6 py-4 rounded-t-lg border-b-2 border-brand-dark">
            <DialogTitle className="text-white">Add Sport</DialogTitle>
            <DialogDescription className="text-gray-200">
              Add a new sport to your organization.
            </DialogDescription>
          </DialogHeader>
          <AddSportForm
            onSuccess={handleCloseDialog}
            onClose={handleCloseDialog}
          />
        </DialogContent>
      </Dialog>

      {/* Add Venue Dialog */}
      <Dialog
        open={openDialog === "venue"}
        onOpenChange={(open) => !open && handleCloseDialog()}
      >
        <DialogContent className="border-0 !max-w-2xl">
          <DialogHeader className="bg-brand-dark text-white !-mx-6 !-mt-6 !-mb-4 px-6 py-4 rounded-t-lg border-b-2 border-brand-dark">
            <DialogTitle className="text-white">Add Venue</DialogTitle>
            <DialogDescription className="text-gray-200">
              Add a new venue to your organization.
            </DialogDescription>
          </DialogHeader>
          <AddVenueForm
            onSuccess={handleCloseDialog}
            onClose={handleCloseDialog}
          />
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}

export default function LeaguesPage() {
  return <LeaguesContent />;
}
