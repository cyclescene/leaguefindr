import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About LeagueFindr - Built by Rec Players, For Rec Players',
  description: 'Learn about LeagueFindr mission to make sports accessible, social, and fun for everyone.',
  icons: '/favicon.ico',
}

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
} 