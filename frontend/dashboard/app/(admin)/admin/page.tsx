"use client"
import { useUser, useSession, useAuth } from "@clerk/nextjs";
import { Suspense, useEffect, useState } from "react";
import { Loader2, MoreHorizontalIcon } from "lucide-react";
import type { League } from "@/types/leagues";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Header } from "@/components/common/Header";
import { Footer } from "@/components/common/Footer";
import { AdminActionButtons } from "@/components/admin/AdminActionButtons";
import { AdminLeagueReviewModal } from "@/components/admin/AdminLeagueReviewModal";
import { AdminDraftViewerModal } from "@/components/admin/AdminDraftViewerModal";
import { RejectLeagueDialog } from "@/components/admin/RejectLeagueDialog";
import { LeagueTable } from "@/components/admin/LeagueTable";
import { OrganizationsTable } from "@/components/admin/OrganizationsTable";
import { SportsTable } from "@/components/admin/SportsTable";
import { VenuesTable } from "@/components/admin/VenuesTable";
import { AdminDraftsTable } from "@/components/admin/AdminDraftsTable";
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Input } from "@/components/ui/input";
import { usePendingLeagues, useAllLeagues, useAdminLeagueOperations } from "@/hooks/useAdminLeagues";
import { useAdminOrganizations } from "@/hooks/useAdminOrganizations";
import { useAdminSports } from "@/hooks/useAdminSports";
import { useAdminVenues } from "@/hooks/useAdminVenues";
import { useAdminDrafts } from "@/hooks/useAdminDrafts";
import type { AdminDraft } from "@/hooks/useAdminDrafts";

const ITEMS_PER_PAGE = 20

function DashboardContent() {
  const { user, isLoaded } = useUser();
  const { session, isLoaded: isSessionLoaded } = useSession();
  const { getToken } = useAuth();

  useEffect(() => {
    session?.reload()

  }, [isSessionLoaded]);
  // Active tab state
  const [activeTab, setActiveTab] = useState('all')

  // Draft viewer state
  const [viewingDraft, setViewingDraft] = useState<AdminDraft | null>(null)

  // Pagination state for each table
  const [pendingPage, setPendingPage] = useState(0)
  const [allPage, setAllPage] = useState(0)
  const [orgPage, setOrgPage] = useState(0)
  const [sportsPage, setSportsPage] = useState(0)
  const [venuesPage, setVenuesPage] = useState(0)
  const [draftsPage, setDraftsPage] = useState(0)

  // Sort state for each table
  const [leaguesSortBy, setLeaguesSortBy] = useState<string>('dateSubmitted')
  const [leaguesSortOrder, setLeaguesSortOrder] = useState<'asc' | 'desc'>('desc')
  const [orgSortBy, setOrgSortBy] = useState<string>('org_name')
  const [orgSortOrder, setOrgSortOrder] = useState<'asc' | 'desc'>('asc')
  const [sportsSortBy, setSportsSortBy] = useState<string>('name')
  const [sportsSortOrder, setSportsSortOrder] = useState<'asc' | 'desc'>('asc')
  const [venuesSortBy, setVenuesSortBy] = useState<string>('name')
  const [venuesSortOrder, setVenuesSortOrder] = useState<'asc' | 'desc'>('asc')
  const [draftsSortBy, setDraftsSortBy] = useState<string>('created_at')
  const [draftsSortOrder, setDraftsSortOrder] = useState<'asc' | 'desc'>('desc')

  // Filter state for each table
  const [leagueStatusFilter, setLeagueStatusFilter] = useState<'pending' | 'approved' | 'rejected' | ''>('')
  const [orgFilter, setOrgFilter] = useState<string>('')
  const [sportsFilter, setSportsFilter] = useState<string>('')
  const [venuesFilter, setVenuesFilter] = useState<string>('')
  const [draftsFilter, setDraftsFilter] = useState<string>('')
  const [draftsTypeFilter, setDraftsTypeFilter] = useState<'draft' | 'template' | ''>('')

  // Fetch all data immediately - always load to avoid refetches on tab switches
  const { pendingLeagues, total: totalPending, isLoading: isLoadingPending, refetch: refetchPendingLeagues } = usePendingLeagues(
    ITEMS_PER_PAGE,
    pendingPage * ITEMS_PER_PAGE
  )
  const { allLeagues, total: totalAll, isLoading: isLoadingAll, refetch: refetchAllLeagues } = useAllLeagues(
    ITEMS_PER_PAGE,
    allPage * ITEMS_PER_PAGE,
    leagueStatusFilter || undefined
  )

  // Admin operations
  const { approveLeague, rejectLeague } = useAdminLeagueOperations()
  const [isApproving, setIsApproving] = useState<number | null>(null)
  const [isRejecting, setIsRejecting] = useState<number | null>(null)

  // Debounced filter values
  const [debouncedOrgFilter, setDebouncedOrgFilter] = useState<string>('')
  const [debouncedSportsFilter, setDebouncedSportsFilter] = useState<string>('')
  const [debouncedVenuesFilter, setDebouncedVenuesFilter] = useState<string>('')
  const [debouncedDraftsFilter, setDebouncedDraftsFilter] = useState<string>('')

  // Debounce effect for org filter
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedOrgFilter(orgFilter)
    }, 300)
    return () => clearTimeout(timer)
  }, [orgFilter])

  // Debounce effect for sports filter
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSportsFilter(sportsFilter)
    }, 300)
    return () => clearTimeout(timer)
  }, [sportsFilter])

  // Debounce effect for venues filter
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedVenuesFilter(venuesFilter)
    }, 300)
    return () => clearTimeout(timer)
  }, [venuesFilter])

  // Debounce effect for drafts filter
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedDraftsFilter(draftsFilter)
    }, 300)
    return () => clearTimeout(timer)
  }, [draftsFilter])

  const { data: organizations, total: totalOrganizations, isLoading: isLoadingOrganizations, refetch: refetchOrganizations } = useAdminOrganizations(
    ITEMS_PER_PAGE,
    orgPage * ITEMS_PER_PAGE,
    debouncedOrgFilter ? { name: debouncedOrgFilter } : undefined,
    orgSortBy as 'name' | 'created_at',
    orgSortOrder
  )
  const { data: sports, total: totalSports, isLoading: isLoadingSports, refetch: refetchSports } = useAdminSports(
    ITEMS_PER_PAGE,
    sportsPage * ITEMS_PER_PAGE,
    debouncedSportsFilter ? { name: debouncedSportsFilter } : undefined,
    sportsSortBy as 'name',
    sportsSortOrder
  )
  const { data: venues, total: totalVenues, isLoading: isLoadingVenues, refetch: refetchVenues } = useAdminVenues(
    ITEMS_PER_PAGE,
    venuesPage * ITEMS_PER_PAGE,
    debouncedVenuesFilter ? { name: debouncedVenuesFilter } : undefined,
    venuesSortBy as 'name',
    venuesSortOrder
  )
  const { data: drafts, total: totalDrafts, isLoading: isLoadingDrafts, refetch: refetchDrafts } = useAdminDrafts(
    ITEMS_PER_PAGE,
    draftsPage * ITEMS_PER_PAGE,
    debouncedDraftsFilter ? { name: debouncedDraftsFilter, type: draftsTypeFilter || undefined } : { type: draftsTypeFilter || undefined },
    draftsSortBy as 'name' | 'date',
    draftsSortOrder,
    user?.id
  )

  // Review modal state
  const [reviewModalOpen, setReviewModalOpen] = useState(false)
  const [reviewingLeagueId, setReviewingLeagueId] = useState<number | null>(null)

  // Reject dialog state
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [rejectingLeagueId, setRejectingLeagueId] = useState<number | null>(null)
  const [rejectingLeagueName, setRejectingLeagueName] = useState<string | undefined>(undefined)

  // Transform API data to table format
  const transformLeague = (league: any): League & { [key: string]: any } => ({
    id: league.id,
    name: league.league_name,
    organizationName: league.form_data?.organization_name || league.org_id || 'Unknown',
    sport: league.form_data?.sport_name || league.sport_id?.toString() || 'Unknown',
    gender: league.gender || 'N/A',
    startDate: new Date(league.season_start_date).toLocaleDateString(),
    venue: league.form_data?.venue_name || league.venue_id?.toString() || 'Unknown',
    dateSubmitted: new Date(league.created_at).toLocaleDateString(),
    status: league.status,
    // Preserve original league data for handlers
    league_name: league.league_name,
    form_data: league.form_data,
  })

  const pendingLeaguesTransformed: League[] = pendingLeagues.map(transformLeague)
  const allLeaguesTransformed: League[] = allLeagues.map(transformLeague)

  // Sort leagues based on current sort state
  const sortLeagues = (leagues: League[]) => {
    const sorted = [...leagues]
    sorted.sort((a, b) => {
      let aVal: any = a[leaguesSortBy as keyof League]
      let bVal: any = b[leaguesSortBy as keyof League]

      // Handle date sorting
      if (leaguesSortBy === 'startDate' || leaguesSortBy === 'dateSubmitted') {
        aVal = new Date(aVal).getTime()
        bVal = new Date(bVal).getTime()
      }

      // Handle string sorting
      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase()
        bVal = bVal.toLowerCase()
      }

      if (aVal < bVal) return leaguesSortOrder === 'asc' ? -1 : 1
      if (aVal > bVal) return leaguesSortOrder === 'asc' ? 1 : -1
      return 0
    })
    return sorted
  }

  const sortedPendingLeagues = sortLeagues(pendingLeaguesTransformed)
  const sortedAllLeagues = sortLeagues(allLeaguesTransformed)

  // Sort sports based on current sort state
  const sortedSports = sports ? [...sports].sort((a, b) => {
    let aVal: any = a[sportsSortBy as keyof typeof a]
    let bVal: any = b[sportsSortBy as keyof typeof b]

    // Handle string sorting
    if (typeof aVal === 'string') {
      aVal = aVal.toLowerCase()
      bVal = bVal.toLowerCase()
    }

    if (aVal < bVal) return sportsSortOrder === 'asc' ? -1 : 1
    if (aVal > bVal) return sportsSortOrder === 'asc' ? 1 : -1
    return 0
  }) : []


  const handleViewLeague = (leagueId: number) => {
    setReviewingLeagueId(leagueId)
    setReviewModalOpen(true)
  }

  const handleViewDraft = (draft: AdminDraft) => {
    setViewingDraft(draft)
  }

  const handleCloseDraftViewer = () => {
    setViewingDraft(null)
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


  const handleSaveAsDraft = async (leagueData: any, name?: string) => {
    try {
      const token = await getToken();
      if (!token) return;

      const orgId = leagueData.form_data?.org_id;
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

      refetchDrafts();
    } catch (error) {
      console.error('Error saving as draft:', error);
    }
  };

  const handleSaveAsTemplate = async (leagueData: any, name?: string) => {
    try {
      const token = await getToken();
      if (!token) return;

      const orgId = leagueData.form_data?.org_id;
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

      refetchDrafts();
    } catch (error) {
      console.error('Error saving as template:', error);
    }
  };


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

    if (totalPages <= 5) {
      // Show all pages if 5 or fewer
      for (let i = 0; i < totalPages; i++) {
        pages.push(i)
      }
      // Pad with empty slots to always have 7 items
      while (pages.length < 7) {
        pages.push(-2) // placeholder (invisible)
      }
    } else {
      // Calculate window of 3 pages centered around current page
      let startPage = Math.max(1, currentPage - 1)
      let endPage = startPage + 2

      // Adjust if we're near the end
      if (endPage >= totalPages - 1) {
        endPage = totalPages - 2
        startPage = Math.max(1, endPage - 2)
      }

      // Always add page 1
      pages.push(0)

      // Check if there's a gap between page 1 and the window
      if (startPage === 1) {
        // No gap, just add the pages
        for (let i = startPage; i <= endPage; i++) {
          pages.push(i)
        }
      } else {
        // Gap exists, add ellipsis then pages
        pages.push(-1)
        for (let i = startPage; i <= endPage; i++) {
          pages.push(i)
        }
      }

      // Check if there's a gap between the window and last page
      if (endPage === totalPages - 2) {
        // No gap, just add the last page
        pages.push(totalPages - 1)
      } else {
        // Gap exists, add ellipsis then last page
        pages.push(-1)
        pages.push(totalPages - 1)
      }

      // Pad with empty slots to always have 7 items
      while (pages.length < 7) {
        pages.push(-2) // placeholder (invisible)
      }
    }

    return pages
  }

  const renderPagination = (currentPage: number, totalPages: number, onPageChange: (p: number) => void) => {
    const pageNumbers = getPageNumbers(currentPage, totalPages)
    // Fixed items: 7 page/ellipsis items + 2 (prev/next) = 9 items
    // Each item is w-10 (40px) with gap-1 (4px) between items
    // 9 * 40px + 8 * 4px = 360px + 32px = 392px

    return (
      <Pagination className="mt-6">
        <PaginationContent className="w-full justify-center min-w-[392px]">
          <PaginationItem>
            <PaginationPrevious
              onClick={() => currentPage > 0 && onPageChange(currentPage - 1)}
              className={currentPage === 0 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
            />
          </PaginationItem>
          {pageNumbers.map((pageNum, idx) => (
            pageNum === -1 ? (
              <PaginationItem key={`ellipsis-${idx}`} className="w-10 h-10">
                <div className="w-10 h-10 flex items-center justify-center">
                  <MoreHorizontalIcon className="size-4" />
                </div>
              </PaginationItem>
            ) : pageNum === -2 ? (
              // Placeholder - invisible spacer
              <PaginationItem key={`placeholder-${idx}`} className="w-10 h-10" />
            ) : (
              <PaginationItem key={pageNum} className="w-10 h-10">
                <PaginationLink
                  onClick={() => onPageChange(pageNum)}
                  isActive={currentPage === pageNum}
                  className="cursor-pointer w-10 h-10 flex items-center justify-center"
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

      <main className="flex-1 w-full max-w-360 mx-auto px-3 py-12">
        <Tabs defaultValue="pending" onValueChange={(value) => { setActiveTab(value); setPendingPage(0); setAllPage(0); setOrgPage(0); setSportsPage(0); setVenuesPage(0); setDraftsPage(0); }}>
          <div className="flex flex-row w-full justify-between items-center mb-4">
            <TabsList>
              <TabsTrigger value="pending">Awaiting ({totalPending})</TabsTrigger>
              <TabsTrigger value="all">Leagues ({totalAll})</TabsTrigger>
              <TabsTrigger value="organizations">Organizations ({totalOrganizations})</TabsTrigger>
              <TabsTrigger value="venues">Venues ({totalVenues})</TabsTrigger>
              <TabsTrigger value="sports">Sports ({totalSports})</TabsTrigger>
              <TabsTrigger value="drafts">Templates/Drafts ({totalDrafts})</TabsTrigger>
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
                <div className="mb-6">
                  <select
                    value={leagueStatusFilter}
                    onChange={(e) => { setLeagueStatusFilter(e.target.value as '' | 'pending' | 'approved' | 'rejected'); setAllPage(0); }}
                    className="px-3 py-2 rounded border border-neutral-300 text-sm cursor-pointer bg-white"
                  >
                    <option value="">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
                {totalAll > ITEMS_PER_PAGE && renderPagination(allPage, totalPagingAll, setAllPage)}
                <LeagueTable
                  leagues={sortedAllLeagues}
                  onView={handleViewLeague}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  onSort={(column, order) => { setLeaguesSortBy(column); setLeaguesSortOrder(order); setAllPage(0); }}
                  sortBy={leaguesSortBy}
                  sortOrder={leaguesSortOrder}
                  onSaveAsDraft={handleSaveAsDraft}
                  onSaveAsTemplate={handleSaveAsTemplate}
                />
                {totalAll > ITEMS_PER_PAGE && renderPagination(allPage, totalPagingAll, setAllPage)}
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
                {totalPending > ITEMS_PER_PAGE && renderPagination(pendingPage, totalPagingPending, setPendingPage)}
                <LeagueTable
                  leagues={sortedPendingLeagues}
                  onView={handleViewLeague}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  onSort={(column, order) => { setLeaguesSortBy(column); setLeaguesSortOrder(order); setPendingPage(0); }}
                  sortBy={leaguesSortBy}
                  sortOrder={leaguesSortOrder}
                  onSaveAsDraft={handleSaveAsDraft}
                  onSaveAsTemplate={handleSaveAsTemplate}
                />
                {totalPending > ITEMS_PER_PAGE && renderPagination(pendingPage, totalPagingPending, setPendingPage)}
              </>
            )}
          </TabsContent>

          <TabsContent value="organizations">
            {isLoadingOrganizations ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="animate-spin text-brand-dark" size={40} />
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <Input
                    placeholder="Filter by organization name..."
                    value={orgFilter}
                    onChange={(e) => { setOrgFilter(e.target.value); setOrgPage(0); }}
                    className="max-w-sm bg-white"
                  />
                </div>
                {totalOrganizations > ITEMS_PER_PAGE && renderPagination(orgPage, Math.ceil(totalOrganizations / ITEMS_PER_PAGE), setOrgPage)}
                <OrganizationsTable
                  organizations={organizations || []}
                  isLoading={isLoadingOrganizations}
                  onSort={(column, order) => { setOrgSortBy(column); setOrgSortOrder(order); setOrgPage(0); }}
                  sortBy={orgSortBy}
                  sortOrder={orgSortOrder}
                />
                {totalOrganizations > ITEMS_PER_PAGE && renderPagination(orgPage, Math.ceil(totalOrganizations / ITEMS_PER_PAGE), setOrgPage)}
              </>
            )}
          </TabsContent>

          <TabsContent value="sports">
            {isLoadingSports ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="animate-spin text-brand-dark" size={40} />
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <Input
                    placeholder="Filter by sport name..."
                    value={sportsFilter}
                    onChange={(e) => { setSportsFilter(e.target.value); setSportsPage(0); }}
                    className="max-w-sm bg-white"
                  />
                </div>
                {totalSports > ITEMS_PER_PAGE && renderPagination(sportsPage, Math.ceil(totalSports / ITEMS_PER_PAGE), setSportsPage)}
                <div className="flex justify-center">
                  <SportsTable
                    sports={sortedSports}
                    isLoading={isLoadingSports}
                    onSort={(column, order) => { setSportsSortBy(column); setSportsSortOrder(order); setSportsPage(0); }}
                    sortBy={sportsSortBy}
                    sortOrder={sportsSortOrder}
                  />
                </div>
                {totalSports > ITEMS_PER_PAGE && renderPagination(sportsPage, Math.ceil(totalSports / ITEMS_PER_PAGE), setSportsPage)}
              </>
            )}
          </TabsContent>

          <TabsContent value="venues">
            {isLoadingVenues ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="animate-spin text-brand-dark" size={40} />
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <Input
                    placeholder="Filter by venue name..."
                    value={venuesFilter}
                    onChange={(e) => { setVenuesFilter(e.target.value); setVenuesPage(0); }}
                    className="max-w-sm bg-white"
                  />
                </div>
                {totalVenues > ITEMS_PER_PAGE && renderPagination(venuesPage, Math.ceil(totalVenues / ITEMS_PER_PAGE), setVenuesPage)}
                <VenuesTable
                  venues={venues || []}
                  isLoading={isLoadingVenues}
                  onSort={(column, order) => { setVenuesSortBy(column); setVenuesSortOrder(order); setVenuesPage(0); }}
                  sortBy={venuesSortBy}
                  sortOrder={venuesSortOrder}
                />
                {totalVenues > ITEMS_PER_PAGE && renderPagination(venuesPage, Math.ceil(totalVenues / ITEMS_PER_PAGE), setVenuesPage)}
              </>
            )}
          </TabsContent>

          <TabsContent value="drafts">
            {isLoadingDrafts ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="animate-spin text-brand-dark" size={40} />
              </div>
            ) : (
              <>
                <div className="mb-6 flex gap-4">
                  <Input
                    placeholder="Filter by draft name..."
                    value={draftsFilter}
                    onChange={(e) => { setDraftsFilter(e.target.value); setDraftsPage(0); }}
                    className="max-w-sm bg-white"
                  />
                  <select
                    value={draftsTypeFilter}
                    onChange={(e) => { setDraftsTypeFilter(e.target.value as "" | "draft" | "template"); setDraftsPage(0); }}
                    className="px-3 py-2 rounded border border-neutral-300 text-sm cursor-pointer bg-white"
                  >
                    <option value="">All Types</option>
                    <option value="draft">Draft</option>
                    <option value="template">Template</option>
                  </select>
                </div>
                {totalDrafts > ITEMS_PER_PAGE && renderPagination(draftsPage, Math.ceil(totalDrafts / ITEMS_PER_PAGE), setDraftsPage)}
                <AdminDraftsTable
                  drafts={drafts || []}
                  isLoading={isLoadingDrafts}
                  onView={handleViewDraft}
                  onSort={(column, order) => { setDraftsSortBy(column); setDraftsSortOrder(order); setDraftsPage(0); }}
                  sortBy={draftsSortBy}
                  sortOrder={draftsSortOrder}
                />
                {totalDrafts > ITEMS_PER_PAGE && renderPagination(draftsPage, Math.ceil(totalDrafts / ITEMS_PER_PAGE), setDraftsPage)}
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

      {/* Draft Viewer Modal */}
      <AdminDraftViewerModal
        draft={viewingDraft}
        isOpen={viewingDraft !== null}
        onClose={handleCloseDraftViewer}
        onSuccess={() => {
          refetchDrafts()
        }}
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
