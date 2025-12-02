import { Inter, Montserrat } from 'next/font/google'
import './globals.css'
import type { Metadata, Viewport } from 'next'
import { Navbar } from '@/components/layout'
import { ErrorBoundary, KlaroWrapper, StructuredData } from '@/components/ui'
import ClientAnalytics from '@/components/ui/ClientAnalytics'
import { Analytics } from '@vercel/analytics/next'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-montserrat',
  weight: ['400', '600', '700', '800', '900'],
  display: 'swap',
})

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'LeagueFindr - Find Your Game',
  description: 'Discover, explore and play in local sports leagues near you. Connect with recreational and competitive sports leagues in your area.',
  keywords: 'sports leagues, recreational sports, local leagues, basketball, soccer, volleyball, softball, pickleball, kickball, adult sports, youth sports, coed leagues',
  authors: [{ name: 'LeagueFindr Team' }],
  creator: 'LeagueFindr',
  publisher: 'LeagueFindr',
  metadataBase: new URL('https://leaguefindr.com'),
  alternates: {
    canonical: '/',
  },
  manifest: '/site.webmanifest',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: 'LeagueFindr - Find Your Game',
    description: 'Discover, explore and play in local sports leagues near you.',
    type: 'website',
    locale: 'en_US',
    siteName: 'LeagueFindr',
    url: 'https://leaguefindr.com',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LeagueFindr - Find Your Game',
    description: 'Discover, explore and play in local sports leagues near you.',
    creator: '@leaguefindr',
    site: '@leaguefindr',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    // Add Google Search Console verification when available
    // google: 'your-google-verification-code',
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180' },
    ],
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${montserrat.variable} scroll-smooth`}>
      <head>
        {/* FontAwesome loaded asynchronously to avoid sync script warning */}
        <script async src="https://kit.fontawesome.com/3a7a4f167f.js" crossOrigin="anonymous"></script>
        <StructuredData type="Organization" data={null} />
        <StructuredData type="WebSite" data={null} />
      </head>
      <body className="min-h-screen bg-white antialiased">
        <Navbar />
        <div className="flex flex-col min-h-screen">
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
          <KlaroWrapper />
          <ClientAnalytics />
          <Analytics />
        </div>
      </body>
    </html>
  )
} 