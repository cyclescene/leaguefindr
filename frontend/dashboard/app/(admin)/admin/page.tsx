"use client"
import { useUser } from "@clerk/nextjs";
import { Suspense, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import type { ClerkUser } from "@/types/clerk";
import type { League } from "@/types/leagues";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Header } from "@/components/common/Header";
import { Footer } from "@/components/common/Footer";
import { AdminActionButtons } from "@/components/admin/AdminActionButtons";
import { AdminLeagueReviewModal } from "@/components/admin/AdminLeagueReviewModal";
import { RejectLeagueDialog } from "@/components/admin/RejectLeagueDialog";
import { LeagueTable } from "@/components/admin/LeagueTable";
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { usePendingLeagues, useAllLeagues, useAdminLeagueOperations } from "@/hooks/useAdminLeagues";

const ITEMS_PER_PAGE = 20

function DashboardContent() {
  const { user, isLoaded, isSignedIn } = useUser();

  useEffect(() => {
    user?.reload()
  }, [isLoaded, isSignedIn])


  // Pagination state
  const [page, setPage] = useState(0)
  const [activeTab, setActiveTab] = useState('all')
  const offset = page * ITEMS_PER_PAGE

  // Fetch leagues by status with pagination
  const { pendingLeagues, total: totalPending, isLoading: isLoadingPending, refetch: refetchPendingLeagues } = usePendingLeagues(
    activeTab === 'pending' ? ITEMS_PER_PAGE : 0,
    activeTab === 'pending' ? offset : 0
  )
  const { allLeagues, total: totalAll, isLoading: isLoadingAll, refetch: refetchAllLeagues } = useAllLeagues(
    activeTab === 'all' ? ITEMS_PER_PAGE : 0,
    activeTab === 'all' ? offset : 0
  )

  // Admin operations
  const { approveLeague, rejectLeague } = useAdminLeagueOperations()
  const [isApproving, setIsApproving] = useState<number | null>(null)
  const [isRejecting, setIsRejecting] = useState<number | null>(null)

  // Review modal state
  const [reviewModalOpen, setReviewModalOpen] = useState(false)
  const [reviewingLeagueId, setReviewingLeagueId] = useState<number | null>(null)

  // Reject dialog state
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [rejectingLeagueId, setRejectingLeagueId] = useState<number | null>(null)
  const [rejectingLeagueName, setRejectingLeagueName] = useState<string | undefined>(undefined)

  // Transform API data to table format
  const transformLeague = (league: any): League => ({
    id: league.id,
    name: league.league_name,
    organizationName: league.form_data?.organization_name || league.org_id || 'Unknown',
    sport: league.form_data?.sport_name || league.sport_id?.toString() || 'Unknown',
    gender: league.gender || 'N/A',
    startDate: new Date(league.season_start_date).toLocaleDateString(),
    venue: league.form_data?.venue_name || league.venue_id?.toString() || 'Unknown',
    dateSubmitted: new Date(league.created_at).toLocaleDateString(),
    status: league.status,
  })

  const pendingLeaguesTransformed: League[] = pendingLeagues.map(transformLeague)
  const allLeaguesTransformed: League[] = allLeagues.map(transformLeague)


  const handleViewLeague = (leagueId: number) => {
    setReviewingLeagueId(leagueId)
    setReviewModalOpen(true)
  }

  const handleApprove = async (leagueId: number) => {
    try {
      setIsApproving(leagueId)
      await approveLeague(leagueId)
      // Refresh both pending and all leagues
      await Promise.all([refetchPendingLeagues(), refetchAllLeagues()])
    } catch (error) {
      console.error('Failed to approve league:', error)
      alert('Failed to approve league')
    } finally {
      setIsApproving(null)
    }
  }

  const handleReject = (leagueId: number) => {
    // Find the league to get its name
    const league = [...pendingLeagues, ...allLeagues].find(l => l.id === leagueId)
    setRejectingLeagueId(leagueId)
    setRejectingLeagueName(league?.league_name || undefined)
    setRejectDialogOpen(true)
  }

  const handleRejectConfirm = async (reason: string) => {
    if (!rejectingLeagueId) return

    try {
      setIsRejecting(rejectingLeagueId)
      await rejectLeague(rejectingLeagueId, reason)
      // Refresh both pending and all leagues
      await Promise.all([refetchPendingLeagues(), refetchAllLeagues()])
    } catch (error) {
      console.error('Failed to reject league:', error)
      throw error // Let the dialog handle the error display
    } finally {
      setIsRejecting(null)
    }
  }

  const isLoading = !isLoaded || isLoadingPending

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

  // Calculate pagination info
  const totalPagingPending = Math.ceil(totalPending / ITEMS_PER_PAGE)
  const totalPagingAll = Math.ceil(totalAll / ITEMS_PER_PAGE)

  // Generate page numbers for pagination component
  const getPageNumbers = (currentPage: number, totalPages: number) => {
    const pages = []
    const maxPagesToShow = 5

    if (totalPages <= maxPagesToShow) {
      for (let i = 0; i < totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Show first page, pages around current, and last page
      pages.push(0)
      const startPage = Math.max(1, currentPage - 1)
      const endPage = Math.min(totalPages - 2, currentPage + 1)

      if (startPage > 1) pages.push(-1) // ellipsis
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i)
      }
      if (endPage < totalPages - 2) pages.push(-1) // ellipsis
      pages.push(totalPages - 1)
    }

    return pages
  }

  const renderPagination = (currentPage: number, totalPages: number, onPageChange: (p: number) => void) => {
    const pageNumbers = getPageNumbers(currentPage, totalPages)

    return (
      <Pagination className="mt-6">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => currentPage > 0 && onPageChange(currentPage - 1)}
              className={currentPage === 0 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
            />
          </PaginationItem>
          {pageNumbers.map((pageNum, idx) => (
            pageNum === -1 ? (
              <PaginationItem key={`ellipsis-${idx}`}>
                <PaginationEllipsis />
              </PaginationItem>
            ) : (
              <PaginationItem key={pageNum}>
                <PaginationLink
                  onClick={() => onPageChange(pageNum)}
                  isActive={currentPage === pageNum}
                  className="cursor-pointer"
                >
                  {pageNum + 1}
                </PaginationLink>
              </PaginationItem>
            )
          ))}
          <PaginationItem>
            <PaginationNext
              onClick={() => currentPage < totalPages - 1 && onPageChange(currentPage + 1)}
              className={currentPage === totalPages - 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-neutral-light">
      <Header email={user?.primaryEmailAddress?.emailAddress || user?.emailAddresses[0]?.emailAddress} />

      <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-12">
        <Tabs defaultValue="all" onValueChange={(value) => { setActiveTab(value); setPage(0); }}>
          <div className="flex flex-row w-full justify-between items-center mb-4">
            <TabsList>
              <TabsTrigger value="all">All Leagues ({totalAll})</TabsTrigger>
              <TabsTrigger value="pending">Pending ({totalPending})</TabsTrigger>
            </TabsList>
            <AdminActionButtons />
          </div>

          <TabsContent value="all">
            {isLoadingAll ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="animate-spin text-brand-dark" size={40} />
              </div>
            ) : (
              <>
                {renderPagination(page, totalPagingAll, setPage)}
                <LeagueTable
                  leagues={allLeaguesTransformed}
                  onView={handleViewLeague}
                  onApprove={handleApprove}
                  onReject={handleReject}
                />
                {renderPagination(page, totalPagingAll, setPage)}
              </>
            )}
          </TabsContent>

          <TabsContent value="pending">
            {isLoadingPending ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="animate-spin text-brand-dark" size={40} />
              </div>
            ) : (
              <>
                {renderPagination(page, totalPagingPending, setPage)}
                <LeagueTable
                  leagues={pendingLeaguesTransformed}
                  onView={handleViewLeague}
                  onApprove={handleApprove}
                  onReject={handleReject}
                />
                {renderPagination(page, totalPagingPending, setPage)}
              </>
            )}
          </TabsContent>

        </Tabs>
      </main>

      {/* League Review Modal */}
      <AdminLeagueReviewModal
        leagueId={reviewingLeagueId}
        isOpen={reviewModalOpen}
        onClose={() => {
          setReviewModalOpen(false)
          setReviewingLeagueId(null)
        }}
        onApproveSuccess={() => {
          refetchPendingLeagues()
          refetchAllLeagues()
        }}
        onRejectSuccess={() => {
          refetchPendingLeagues()
          refetchAllLeagues()
        }}
      />

      {/* Reject League Dialog */}
      <RejectLeagueDialog
        isOpen={rejectDialogOpen}
        leagueName={rejectingLeagueName}
        onClose={() => {
          setRejectDialogOpen(false)
          setRejectingLeagueId(null)
          setRejectingLeagueName(undefined)
        }}
        onReject={handleRejectConfirm}
      />

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
