'use client'

import { Container } from '@/components/ui'

export function LocationBanner() {
  return (
    <div className="bg-light-green py-2">
      <Container>
        <div className="text-center">
          <p className="text-dark-green font-montserrat font-semibold text-sm">
            Currently serving leagues in the Greater Los Angeles area.
          </p>
        </div>
      </Container>
    </div>
  )
} 