/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // LeagueFindr Brand Colors
        'dark-blue': '#0C2B4B',
        'light-blue': '#AFD6E0',
        'off-white': '#F4F1E6',
        'light-green': '#6AC266',
        'dark-green': '#17492C',
        
        // Grayscale
        'gray-1': '#F8F7F5',
        'gray-2': '#F3F2EE',
        'gray-3': '#D4D2CD',
        'gray-4': '#A19F9A',
        'gray-5': '#3C3A35',
        
        // Semantic Colors
        'alert-success': '#5E8029',
        'alert-warning': '#FFA724',
        'alert-error': '#BA161D',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        montserrat: ['var(--font-montserrat)', 'var(--font-inter)', 'system-ui', 'sans-serif'],
        dirk: ['Oswald', 'var(--font-montserrat)', 'var(--font-inter)', 'system-ui', 'sans-serif'], // Using Oswald as Dirk Black equivalent
      },
      fontSize: {
        // Exact client specifications
        'h1-desktop': ['4rem', { lineHeight: '1.1', letterSpacing: '0.02em' }],     // 64px
        'h1-mobile': ['3.125rem', { lineHeight: '1.1', letterSpacing: '0.02em' }], // 50px
        'h2-desktop': ['3rem', { lineHeight: '92%', letterSpacing: '0.02em' }],    // 48px
        'h2-mobile': ['2.125rem', { lineHeight: '92%', letterSpacing: '0.02em' }], // 34px
        'h3-desktop': ['1.75rem', { lineHeight: '125%', letterSpacing: '0px' }],   // 28px
        'h3-mobile': ['1.4375rem', { lineHeight: '125%', letterSpacing: '0px' }],  // 23px
        'h4': ['1.75rem', { lineHeight: '90%', letterSpacing: '0.02em' }],         // 28px
        'h5': ['1.25rem', { lineHeight: '140%', letterSpacing: '0px' }],           // 20px
        'label-large': ['1rem', { lineHeight: '110%', letterSpacing: '0px' }],     // 16px
        'label-small': ['0.75rem', { lineHeight: '120%', letterSpacing: '0px' }],  // 12px
        'body-1': ['1rem', { lineHeight: '120%', letterSpacing: '0px' }],          // 16px
        'body-2': ['0.75rem', { lineHeight: '120%', letterSpacing: '0px' }],       // 12px
        'body-3': ['0.75rem', { lineHeight: '120%', letterSpacing: '0px' }],       // 12px
      },
      letterSpacing: {
        'header': '0.02em', // 2% letter spacing for headers
        'normal': '0px',    // 0px letter spacing for body/labels
      },
      maxWidth: {
        '8xl': '90rem',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      }
    },
  },
  plugins: [],
} 