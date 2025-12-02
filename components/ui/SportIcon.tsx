'use client'

import { Sport } from '@/lib/types'

interface SportIconProps {
  sport: Sport | string  // Allow string to support database sport names
  className?: string
  size?: number
}

export function SportIcon({ sport, className = '', size = 32 }: SportIconProps) {
  // Map sports to Font Awesome icon names - same as quick filters
  const getIconClass = (sport: Sport | string): string => {
    const sportName = typeof sport === 'string' ? sport : sport
    
    switch (sportName) {
      case 'Soccer':
        return 'far fa-futbol'
      case 'Basketball':
        return 'far fa-basketball'
      case 'Volleyball':
        return 'far fa-volleyball'
      case 'Softball':
        return 'far fa-baseball-bat-ball'
      case 'Baseball':
        return 'far fa-baseball'
      case 'Pickleball':
        return 'far fa-pickleball'
      case 'Kickball':
        return 'far fa-futbol' // Same as soccer
      case 'Football':
        return 'far fa-football-helmet'
      case 'Flag Football':
        return 'far fa-football'
      case 'Tennis':
        return 'far fa-tennis-ball'
      case 'Golf':
        return 'far fa-golf-flag-hole'
      case 'Hockey':
      case 'Ice Hockey':
        return 'far fa-hockey-stick-puck'
      case 'Ultimate Frisbee':
        return 'far fa-flying-disc'
      case 'Lacrosse':
        return 'far fa-lacrosse-stick-ball'
      case 'Bowling':
        return 'far fa-bowling-ball-pin'
      case 'Boxing':
        return 'far fa-boxing-glove'
      case 'Running':
        return 'far fa-person-running-fast'
      case 'Cornhole':
      case 'Cheerleading':
      case 'Horseshoes':
        return 'far fa-circle-dot' // Placeholder for sports without specific icons
      case 'Dodgeball':
        return 'far fa-circle-dot'
      case 'Spikeball':
        return 'far fa-volleyball'
      case 'Cheerleading':
        return 'far fa-pom-pom'
      case 'Cornhole':
        return 'far fa-bullseye'
      case 'Foot Golf':
        return 'far fa-golf-ball'
      case 'Paddleball':
        return 'far fa-table-tennis'
      default:
        return 'far fa-circle-dot' // Better fallback icon
    }
  }

  return (
    <i 
      className={`${getIconClass(sport)} ${className}`}
      style={{ fontSize: `${size}px` }}
      aria-label={`${sport} icon`}
      aria-hidden="true"
    />
  )
} 