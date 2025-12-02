import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Find Local Sports Leagues Near You | LeagueFindr',
  description: 'Search and discover recreational sports leagues in your area. Filter by sport, age group, gender, and location to find the perfect league for you.',
  openGraph: {
    title: 'Find Local Sports Leagues Near You | LeagueFindr',
    description: 'Search and discover recreational sports leagues in your area. Filter by sport, age group, gender, and location.',
    type: 'website',
    url: 'https://leaguefindr.com/find-a-league',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Find Local Sports Leagues Near You | LeagueFindr',
    description: 'Search and discover recreational sports leagues in your area.',
  },
}

export default function FindALeagueLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
} 