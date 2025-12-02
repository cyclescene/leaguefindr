'use client'

import { HeroSection, QuickFilters, ContentSections } from '@/components/sections'
import { Footer } from '@/components/layout'
import { LocationBanner } from '@/components/ui'

export const dynamic = 'force-dynamic'

export default function HomePage() {
  return (
    <main className="flex-1">
      <LocationBanner />
      <HeroSection />
      <QuickFilters />
      <ContentSections />
      <Footer />
    </main>
  )
} 