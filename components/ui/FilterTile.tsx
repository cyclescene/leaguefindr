'use client'

import { cn } from '@/lib/utils'
import { FilterTileProps } from '@/lib/types'

export function FilterTile({ 
  label, 
  icon, 
  isActive, 
  onClick, 
  className 
}: FilterTileProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative group p-6 rounded-xl border-2 transition-all duration-300 ease-out",
        "hover:scale-105 focus:scale-105 active:scale-95",
        "hover:shadow-lg focus:shadow-lg",
        "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-light-green",
        isActive
          ? "bg-light-green border-light-green text-white shadow-lg transform scale-105"
          : "bg-white border-gray-3 text-gray-5 hover:border-light-green hover:text-dark-green",
        className
      )}
    >
      <div className="flex flex-col items-center space-y-3">
        <div className={cn(
          "transition-transform duration-300 group-hover:scale-110",
          isActive ? "text-white" : "text-gray-4 group-hover:text-dark-green"
        )}>
          {icon}
        </div>
        <span className={cn(
          "font-montserrat font-bold text-sm text-center leading-tight",
          isActive ? "text-white" : "text-gray-5 group-hover:text-dark-green"
        )}>
          {label}
        </span>
      </div>

      {/* Active indicator */}
      {isActive && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full border-2 border-light-green animate-pulse" />
      )}
    </button>
  )
} 