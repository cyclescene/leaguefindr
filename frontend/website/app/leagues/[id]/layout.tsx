import { LeaguesApi } from '@/lib/api'
import { Metadata } from 'next'

// Dynamic metadata generation
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const resolvedParams = await params
  try {
    const response = await LeaguesApi.getLeagueById(Number(resolvedParams.id))
    
    if (response.success && response.data) {
      const league = response.data
      const title = `${league.organization.name} - ${league.sport.name} League | LeagueFindr`
      const fee = league.seasonFee ? `$${league.seasonFee}` : league.perGameFee ? `$${league.perGameFee}/game` : 'Contact for pricing'
      const description = `Join ${league.organization.name}'s ${league.sport.name} league. ${league.ageGroup} ${league.gender} league starting ${league.seasonStartDate.toLocaleDateString()}. Fee: ${fee}.`
      
      return {
        title,
        description,
        openGraph: {
          title,
          description,
          type: 'website',
          url: `https://leaguefindr.com/leagues/${resolvedParams.id}`,
        },
        twitter: {
          card: 'summary_large_image',
          title,
          description,
        },
      }
    }
  } catch (error) {
    // Fallback metadata if API call fails
  }
  
  return {
    title: 'League Details | LeagueFindr',
    description: 'View detailed information about this sports league including schedule, pricing, and registration details.',
  }
}

export default function LeagueLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
} 