import { AgeGroup } from '@/lib/types'

interface AgeGroupIconProps {
  ageGroup: AgeGroup
  className?: string
  size?: number
}

export function AgeGroupIcon({ ageGroup, className = '', size = 32 }: AgeGroupIconProps) {
  const iconProps = {
    width: size,
    height: size,
    viewBox: "0 0 32 32",
    className: className
  }

  switch (ageGroup) {
    case 'Adult':
      return (
        <svg {...iconProps}>
          {/* Adult group - multiple people */}
          <circle 
            cx="11" cy="10" r="4" 
            fill="rgba(255, 255, 255, 0.2)" 
            stroke="#17492C" 
            strokeWidth="2"
          />
          <circle 
            cx="21" cy="10" r="4" 
            fill="rgba(255, 255, 255, 0.2)" 
            stroke="#17492C" 
            strokeWidth="2"
          />
          <path 
            d="M4 28 Q11 18 11 18 Q11 18 18 28" 
            fill="rgba(255, 255, 255, 0.1)" 
            stroke="#17492C" 
            strokeWidth="2"
          />
          <path 
            d="M14 28 Q21 18 21 18 Q21 18 28 28" 
            fill="rgba(255, 255, 255, 0.1)" 
            stroke="#17492C" 
            strokeWidth="2"
          />
        </svg>
      )
    
    case 'Youth':
      return (
        <svg {...iconProps}>
          {/* Youth - single smaller person */}
          <circle 
            cx="16" cy="8" r="4" 
            fill="rgba(255, 255, 255, 0.2)" 
            stroke="#17492C" 
            strokeWidth="2"
          />
          <path 
            d="M8 28 Q16 16 16 16 Q16 16 24 28" 
            fill="rgba(255, 255, 255, 0.1)" 
            stroke="#17492C" 
            strokeWidth="2"
          />
          {/* Fun elements for youth */}
          <circle cx="6" cy="6" r="1.5" fill="rgba(255, 255, 255, 0.3)" stroke="#17492C" strokeWidth="1"/>
          <circle cx="26" cy="6" r="1.5" fill="rgba(255, 255, 255, 0.3)" stroke="#17492C" strokeWidth="1"/>
          <path 
            d="M6 6 L10 4" 
            stroke="#17492C" 
            strokeWidth="1"
          />
          <path 
            d="M26 6 L22 4" 
            stroke="#17492C" 
            strokeWidth="1"
          />
        </svg>
      )
    
    default:
      return (
        <svg {...iconProps}>
          <circle 
            cx="16" cy="16" r="14" 
            fill="rgba(255, 255, 255, 0.1)" 
            stroke="#17492C" 
            strokeWidth="2"
          />
          <circle cx="16" cy="16" r="4" fill="#17492C"/>
        </svg>
      )
  }
} 