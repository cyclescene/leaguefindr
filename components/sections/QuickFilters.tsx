'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Container } from '@/components/ui'
import { FilterTile, SportIcon, AgeGroupIcon } from '@/components/ui'
import { AGE_GROUPS, SPORTS } from '@/lib/constants'
import { AgeGroup, Sport, FilterState } from '@/lib/types'
import { Analytics } from '@/lib/analytics'

interface QuickFiltersProps {
  onFiltersChange?: (filters: { ageGroup?: AgeGroup; sport?: Sport }) => void
}

export function QuickFilters({ onFiltersChange }: QuickFiltersProps) {
  const [selectedAgeGroup, setSelectedAgeGroup] = useState<AgeGroup | undefined>()
  const [selectedSport, setSelectedSport] = useState<Sport | undefined>()
  const router = useRouter()

  const handleAgeGroupSelect = (ageGroup: AgeGroup) => {
    // Track quick filter click
    Analytics.clickedAgeGroupQuickFilter(ageGroup)
    
    // Clear any existing cache to ensure fresh results
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('leagues_cache')
      sessionStorage.removeItem('pagination_cache') 
      sessionStorage.removeItem('filters_cache')
      sessionStorage.removeItem('quickFilters')
    }
    
    // Navigate with URL parameter to pass filter (same as manual selection)
    const params = new URLSearchParams()
    params.set('ageGroup', ageGroup)
    
    // Scroll to top before navigation
    window.scrollTo({ top: 0, behavior: 'instant' });
    
    router.push(`/find-a-league?${params.toString()}`);
  };

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
              Filter leagues by age group and sport to find your perfect match
            </h4>
          </div>

          {/* Right Filters */}
          <div className="space-y-8 pb-8">
            {/* Age Groups */}
            <div>
              <h5 className="mb-4 text-left">Age Groups</h5>
              <div className="grid grid-cols-2 gap-4">
                {AGE_GROUPS.map((ageGroup) => (
                  <FilterTile
                    key={ageGroup.value}
                    label={ageGroup.label}
                    icon={<AgeGroupIcon ageGroup={ageGroup.value} size={40} />}
                    isActive={false} // Never show as active since we navigate immediately
                    onClick={() => handleAgeGroupSelect(ageGroup.value)}
                  />
                ))}
              </div>
            </div>

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