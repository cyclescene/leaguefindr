'use client'

import { useRouter } from 'next/navigation'
import { Container } from '@/components/ui'
import { FilterTile, SportIcon } from '@/components/ui'
import { SPORTS } from '@/lib/constants'
import { Sport } from '@/lib/types'
import { Analytics } from '@/lib/analytics'

interface QuickFiltersProps {
  onFiltersChange?: (filters: { sport?: Sport }) => void
}

export function QuickFilters({ onFiltersChange: _onFiltersChange }: QuickFiltersProps) {
  const router = useRouter()

  const handleSportSelect = (sport: Sport) => {
    // Track quick filter click
    Analytics.clickedSportQuickFilter(sport)

    // Clear any existing cache to ensure fresh results
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('leagues_cache')
      sessionStorage.removeItem('pagination_cache')
      sessionStorage.removeItem('filters_cache')
      sessionStorage.removeItem('quickFilters')
    }

    // Navigate with URL parameter to pass filter (same as manual selection)
    const params = new URLSearchParams()
    params.set('sport', sport)

    // Scroll to top before navigation
    window.scrollTo({ top: 0, behavior: 'instant' });

    router.push(`/find-a-league?${params.toString()}`);
  };

  return (
    <section className="py-16 bg-gray-1 overflow-visible">
      <Container>
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-6">
            <h2 className="mb-4">Discover the league for you</h2>
            <h4 className="text-gray-5 max-w-xl">
              Filter leagues by sport to find your perfect match
            </h4>
          </div>

          {/* Right Filters */}
          <div className="space-y-8 pb-8">
            {/* Sports */}
            <div className="pb-4">
              <h5 className="mb-4 text-left">Sports</h5>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pb-4">
                {SPORTS.map((sport) => (
                  <FilterTile
                    key={sport.value}
                    label={sport.label}
                    icon={<SportIcon sport={sport.value} size={40} />}
                    isActive={false} // Never show as active since we navigate immediately
                    onClick={() => handleSportSelect(sport.value)}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  )
} 