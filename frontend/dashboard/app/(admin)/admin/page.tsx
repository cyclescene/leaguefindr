"use client"
import { useUser } from "@clerk/nextjs";
import { Suspense, useState } from "react";
import { Loader2 } from "lucide-react";
import type { ClerkUser } from "@/types/clerk";
import type { League, Draft } from "@/types/leagues";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Header } from "@/components/common/Header";
import { Footer } from "@/components/common/Footer";
import { ActionButtons } from "@/components/forms/ActionButtons";
import { LeagueTable } from "@/components/admin/LeagueTable";
import { DraftLeagueTable } from "@/components/admin/DraftLeagueTable";
import { usePendingLeagues, useAdminLeagueOperations } from "@/hooks/useAdminLeagues";

function DashboardContent() {
  const { user, isLoaded } = useUser() as { user: ClerkUser | null; isLoaded: boolean };

  // Fetch pending leagues for admin review
  const { pendingLeagues, isLoading: isLoadingPending, mutate: mutatePendingLeagues } = usePendingLeagues()

  // For now, we'll skip fetching drafts from a specific org
  // TODO: Implement global draft fetching for admin view or remove drafts tab
  const isLoadingDrafts = false
  const draftList: Draft[] = []

  // Admin operations
  const { approveLeague, rejectLeague } = useAdminLeagueOperations()
  const [isApproving, setIsApproving] = useState<number | null>(null)
  const [isRejecting, setIsRejecting] = useState<number | null>(null)

  // Transform API data to table format
  const leagues: League[] = pendingLeagues.map(league => ({
    id: league.id,
    name: league.league_name,
    organizationName: league.org_id,
    sport: league.sport_id?.toString() || 'Unknown',
    gender: league.gender || 'N/A',
    startDate: new Date(league.season_start_date).toLocaleDateString(),
    venue: league.venue_id?.toString() || 'Unknown',
    dateSubmitted: new Date(league.created_at).toLocaleDateString(),
    status: league.status,
  }))


  const handleViewLeague = (leagueId: number) => {
    console.log('View league:', leagueId)
    // TODO: Open league review modal with LeagueFormContext in 'admin-review' mode
  }

  const handleApprove = async (leagueId: number) => {
    try {
      setIsApproving(leagueId)
      await approveLeague(leagueId)
      await mutatePendingLeagues()
    } catch (error) {
      console.error('Failed to approve league:', error)
      alert('Failed to approve league')
    } finally {
      setIsApproving(null)
    }
  }

  const handleReject = async (leagueId: number) => {
    try {
      setIsRejecting(leagueId)
      const reason = window.prompt('Enter rejection reason:')
      if (reason) {
        await rejectLeague(leagueId, reason)
        await mutatePendingLeagues()
      }
    } catch (error) {
      console.error('Failed to reject league:', error)
      alert('Failed to reject league')
    } finally {
      setIsRejecting(null)
    }
  }

  const handleEditDraft = (leagueId: number) => {
    console.log('Edit draft:', leagueId)
    // TODO: Open draft edit modal
  }

  const handleDeleteDraft = (leagueId: number) => {
    console.log('Delete draft:', leagueId)
    // TODO: Implement draft deletion API call
  }

  const handleSubmitDraft = (leagueId: number) => {
    console.log('Submit draft:', leagueId)
    // TODO: Implement draft submission from admin panel
  }

  const isLoading = !isLoaded || isLoadingPending || isLoadingDrafts

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
      <Header organizationName="" />

      <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-12">
        <Tabs defaultValue="submitted">
          <div className="flex flex-row w-full justify-between items-center mb-4">
            <TabsList>
              <TabsTrigger value="submitted">Submitted Leagues ({leagues.length})</TabsTrigger>
              <TabsTrigger value="drafts">Drafts ({draftList.length})</TabsTrigger>
            </TabsList>
            <ActionButtons />
          </div>
          <TabsContent value="submitted">
            {isLoadingPending ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="animate-spin text-brand-dark" size={40} />
              </div>
            ) : (
              <LeagueTable
                leagues={leagues}
                onView={handleViewLeague}
                onApprove={handleApprove}
                onReject={handleReject}
              />
            )}
          </TabsContent>
          <TabsContent value="drafts">
            {isLoadingDrafts ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="animate-spin text-brand-dark" size={40} />
              </div>
            ) : (
              <DraftLeagueTable
                drafts={draftList}
                onView={handleViewLeague}
                onEdit={handleEditDraft}
                onDelete={handleDeleteDraft}
                onSubmit={handleSubmitDraft}
              />
            )}
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
