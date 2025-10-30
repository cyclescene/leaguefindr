"use client"
import { useUser } from "@clerk/nextjs";
import { Suspense, useState } from "react";
import { Loader2 } from "lucide-react";
import type { ClerkUser } from "@/types/clerk";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Header } from "@/components/common/Header";
import { Footer } from "@/components/common/Footer";
import { ActionButtons } from "@/components/forms/ActionButtons";
import { LeagueTable } from "@/components/admin/LeagueTable";
import { DraftLeagueTable } from "@/components/admin/DraftLeagueTable";

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

interface Draft {
  id: number;
  name: string;
  sport: string;
  ageGroup: string;
  gender: string;
  startDate: string;
  venue: string;
  dateSubmitted: string;
  status: string;
}

function DashboardContent() {
  const { user, isLoaded } = useUser() as { user: ClerkUser | null; isLoaded: boolean };
  const { organizationName } = user?.publicMetadata || {};

  const [leagues, setLeagues] = useState<League[]>([
    { id: 1, name: 'Test League', organizationName: 'Test Org', sport: 'Football', ageGroup: '12-16', gender: 'Male', startDate: '2023-01-01', venue: 'Test Venue', dateSubmitted: '2023-01-01', status: 'pending_review' },
    { id: 2, name: 'Test League', organizationName: 'Test Org', sport: 'Football', ageGroup: '12-16', gender: 'Male', startDate: '2023-01-01', venue: 'Test Venue', dateSubmitted: '2023-01-01', status: 'approved' },
    { id: 3, name: 'Test League', organizationName: 'Test Org', sport: 'Football', ageGroup: '12-16', gender: 'Male', startDate: '2023-01-01', venue: 'Test Venue', dateSubmitted: '2023-01-01', status: 'rejected' },
    { id: 4, name: 'Test League', organizationName: 'Test Org', sport: 'Football', ageGroup: '12-16', gender: 'Male', startDate: '2023-01-01', venue: 'Test Venue', dateSubmitted: '2023-01-01', status: 'pending_review' },
  ])


  const [drafts, setDrafts] = useState<Draft[]>([
    { id: 1, name: 'Test League', sport: 'Football', ageGroup: '12-16', gender: 'Male', startDate: '2023-01-01', venue: 'Test Venue', dateSubmitted: '2023-01-01', status: 'draft' },
    { id: 2, name: 'Test League', sport: 'Football', ageGroup: '12 - 16', gender: 'Male', startDate: '2023-01-01', venue: 'Test Venue', dateSubmitted: '2023-01-01', status: 'draft' },
    { id: 3, name: 'Test League', sport: 'Football', ageGroup: '12-16', gender: 'Male', startDate: '2023-01-01', venue: 'Test Venue', dateSubmitted: '2023-01-01', status: 'draft' },
    { id: 4, name: 'Test League', sport: 'Football', ageGroup: '12-16', gender: 'Male', startDate: '2023-01-01', venue: 'Test Venue', dateSubmitted: '2023-01-01', status: 'draft' },
  ])

  const handleStatusChange = (leagueId: number, status: string) => {
    setLeagues(leagues.map(l => l.id === leagueId ? { ...l, status } : l))
    console.log('handleStatusChange', leagueId, status)
  }

  const handleViewLeague = (leagueId: number) => {
    console.log('View league:', leagueId)
  }


  const handleEditDraft = (leagueId: number) => {
    console.log('Edit draft:', leagueId)
  }

  const handleDeleteDraft = (leagueId: number) => {
    setDrafts(drafts.filter(l => l.id !== leagueId))
    console.log('Delete draft:', leagueId)
  }

  const handleSubmitDraft = (leagueId: number) => {
    const draftLeague = drafts.find(l => l.id === leagueId)
    if (draftLeague) {
      setDrafts(drafts.filter(l => l.id !== leagueId))
    }
    console.log('Submit draft:', leagueId)
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-neutral-light">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-brand-dark" size={40} />
          <p className="text-brand-dark font-medium">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-neutral-light">
      <Header organizationName={organizationName} />

      <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-12">
        <Tabs defaultValue="submitted">
          <div className="flex flex-row w-full justify-between items-center mb-4">
            <TabsList>
              <TabsTrigger value="submitted">Submitted Leagues</TabsTrigger>
              <TabsTrigger value="drafts">Drafts</TabsTrigger>
            </TabsList>
            <ActionButtons />
          </div>
          <TabsContent value="submitted">
            <LeagueTable
              leagues={leagues}
              onView={handleViewLeague}
              onApprove={(id) => handleStatusChange(id, 'approved')}
              onReject={(id) => handleStatusChange(id, 'rejected')}
            />
          </TabsContent>
          <TabsContent value="drafts">
            <DraftLeagueTable
              drafts={drafts}
              onView={handleViewLeague}
              onEdit={handleEditDraft}
              onDelete={handleDeleteDraft}
              onSubmit={handleSubmitDraft}
            />
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
}

export default function Dashboard() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-neutral-light">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-brand-dark" size={40} />
          <p className="text-brand-dark font-medium">Loading dashboard...</p>
        </div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
