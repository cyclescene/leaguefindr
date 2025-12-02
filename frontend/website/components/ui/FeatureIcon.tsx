interface FeatureIconProps {
  type: 'location' | 'filter' | 'share' | 'signup'
  size?: number
  className?: string
}

export function FeatureIcon({ type, size = 48, className = '' }: FeatureIconProps) {
  const iconProps = {
    width: size,
    height: size,
    viewBox: "0 0 48 48",
    className: className
  }

  switch (type) {
    case 'location':
      return (
        <svg {...iconProps}>
          {/* Location/Map Pin */}
          <circle 
            cx="24" cy="24" r="22" 
            fill="rgba(106, 194, 102, 0.1)" 
            stroke="#6AC266" 
            strokeWidth="2"
          />
          <path 
            d="M24 12 C19 12 15 16 15 21 C15 28 24 36 24 36 S33 28 33 21 C33 16 29 12 24 12 Z" 
            fill="rgba(23, 73, 44, 0.1)" 
            stroke="#17492C" 
            strokeWidth="2"
          />
          <circle cx="24" cy="21" r="4" fill="#17492C"/>
        </svg>
      )
    
    case 'filter':
      return (
        <svg {...iconProps}>
          {/* Filter/Funnel */}
          <circle 
            cx="24" cy="24" r="22" 
            fill="rgba(106, 194, 102, 0.1)" 
            stroke="#6AC266" 
            strokeWidth="2"
          />
          <path 
            d="M12 16 L36 16 L30 24 L30 32 L18 32 L18 24 Z" 
            fill="rgba(23, 73, 44, 0.1)" 
            stroke="#17492C" 
            strokeWidth="2"
          />
          <line x1="16" y1="20" x2="32" y2="20" stroke="#17492C" strokeWidth="1.5"/>
          <line x1="20" y1="24" x2="28" y2="24" stroke="#17492C" strokeWidth="1.5"/>
          <line x1="22" y1="28" x2="26" y2="28" stroke="#17492C" strokeWidth="1.5"/>
        </svg>
      )
    
    case 'share':
      return (
        <svg {...iconProps}>
          {/* Share/Network */}
          <circle 
            cx="24" cy="24" r="22" 
            fill="rgba(106, 194, 102, 0.1)" 
            stroke="#6AC266" 
            strokeWidth="2"
          />
          <circle cx="16" cy="16" r="4" fill="rgba(23, 73, 44, 0.1)" stroke="#17492C" strokeWidth="2"/>
          <circle cx="32" cy="16" r="4" fill="rgba(23, 73, 44, 0.1)" stroke="#17492C" strokeWidth="2"/>
          <circle cx="24" cy="32" r="4" fill="rgba(23, 73, 44, 0.1)" stroke="#17492C" strokeWidth="2"/>
          <line x1="19" y1="18" x2="29" y2="18" stroke="#17492C" strokeWidth="2"/>
          <line x1="18" y1="19" x2="22" y2="29" stroke="#17492C" strokeWidth="2"/>
          <line x1="30" y1="19" x2="26" y2="29" stroke="#17492C" strokeWidth="2"/>
        </svg>
      )
    
    case 'signup':
      return (
        <svg {...iconProps}>
          {/* Signup/Checkmark */}
          <circle 
            cx="24" cy="24" r="22" 
            fill="rgba(106, 194, 102, 0.1)" 
            stroke="#6AC266" 
            strokeWidth="2"
          />
          <circle 
            cx="24" cy="24" r="12" 
            fill="rgba(23, 73, 44, 0.1)" 
            stroke="#17492C" 
            strokeWidth="2"
          />
          <path 
            d="M18 24 L22 28 L30 20" 
            fill="none" 
            stroke="#17492C" 
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )
    
    default:
      return (
        <svg {...iconProps}>
          <circle 
            cx="24" cy="24" r="22" 
            fill="rgba(106, 194, 102, 0.1)" 
            stroke="#6AC266" 
            strokeWidth="2"
          />
          <circle cx="24" cy="24" r="6" fill="#17492C"/>
        </svg>
      )
  }
} 