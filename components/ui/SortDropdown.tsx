'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'
import { Analytics } from '@/lib/analytics'

export interface SortOption {
  value: string
  label: string
  field: 'distance' | 'price' | 'date' | 'sport' | 'name' | 'relevance'
  direction: 'asc' | 'desc'
}

export interface SortDropdownProps {
  value?: SortOption
  onChange: (option: SortOption) => void
  options: SortOption[]
  className?: string
}

export function SortDropdown({ value, onChange, options, className = '' }: SortDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (option: SortOption) => {
    // Track sort application based on field
    switch (option.field) {
      case 'distance':
        Analytics.appliedSortVenueLocation()
        break
      case 'price':
        Analytics.appliedSortPrice()
        break
      case 'date':
        // Check if it's registration date or season start date based on value
        if (option.value.includes('registration')) {
          Analytics.appliedSortRegistrationDate()
        } else {
          Analytics.appliedSortSeasonStartDate()
        }
        break
    }
    
    onChange(option)
    setIsOpen(false)
  }

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-dark-green focus:border-dark-green transition-colors"
      >
        <span>Sort: {value?.label || 'Default'}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 min-w-[200px] bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1">
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => handleSelect(option)}
              className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
                value?.value === option.value ? 'text-dark-green font-medium bg-dark-green/5' : 'text-gray-700'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
} 