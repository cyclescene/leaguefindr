# LeagueFindr

A platform for discovering and joining local sports leagues. Built with Next.js 14, TypeScript, and Tailwind CSS.

## Features

- 🏀 Find local sports leagues by location and sport
- 🎯 Filter by age groups (Adult/Youth leagues)
- 📱 Responsive design for mobile and desktop
- 🔍 Smart search with location type-ahead
- 🎨 Modern UI with custom brand design system

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Deployment**: Vercel (recommended)

## Getting Started

### Prerequisites

- Node.js 18.17 or later
- npm, yarn, or pnpm

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd leaguefindr
```

2. Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Create environment file:
```bash
cp .env.local.example .env.local
```

4. Add your Google Places API key (for search functionality):
```
NEXT_PUBLIC_GOOGLE_PLACES_API_KEY=your_api_key_here
```

5. Run the development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
leaguefindr/
├── app/                    # Next.js App Router pages
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   ├── page.tsx          # Homepage
│   └── find-a-league/    # League search page
├── components/            # Reusable components
├── lib/                  # Utilities and configuration
├── public/               # Static assets
└── tailwind.config.js    # Tailwind configuration
```

## Development Phases

This project is being built in phases:

- ✅ **Phase 1**: Foundation & Project Setup
- 🔄 **Phase 2**: Core Layout Structure
- ⏳ **Phase 3**: Navigation System
- ⏳ **Phase 4**: Homepage Hero
- ⏳ **Phase 5**: Filter Components
- ⏳ **Phase 6**: Content Sections
- ⏳ **Phase 7**: Footer & Polish
- ⏳ **Phase 8**: Integration & Enhancement

## Color System

The project uses a custom color palette based on the LeagueFindr brand:

- **Primary**: Dark Green (`#17492C`), Light Green (`#6AC266`)
- **Neutrals**: Off-White (`#F4F1E6`), Gray variants
- **Semantic**: Success, Warning, Error states

## Contributing

This is an MVP build focused on the homepage functionality. Each phase builds upon the previous one to create a complete, functional landing page.

## License

Private project - All rights reserved. 