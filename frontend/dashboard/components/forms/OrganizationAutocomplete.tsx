'use client'

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useOrganizationSearch } from '@/hooks/useOrganizationSearch'
import { Loader2, X } from 'lucide-react'

interface Organization {
  id: string
  org_name: string
  org_email?: string
}

interface OrganizationAutocompleteProps {
  value: string
  onChange: (orgName: string) => void
  onOrganizationSelect: (org: Organization) => void
  selectedOrganization?: Organization | null
  onClear?: () => void
  error?: any
}

export function OrganizationAutocomplete({
  value,
  onChange,
  onOrganizationSelect,
  selectedOrganization,
  onClear,
  error,
}: OrganizationAutocompleteProps) {
  const { organizations, isLoading } = useOrganizationSearch()
  const [showAutocomplete, setShowAutocomplete] = useState(false)
  const [debouncedOrgName, setDebouncedOrgName] = useState('')
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number; width: number }>({
    top: 0,
    left: 0,
    width: 0,
  })
  const [isMounted, setIsMounted] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Mount component on client side only
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Debounce organization name input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedOrgName(value)
      if (value.length >= 1) {
        setShowAutocomplete(true)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [value])

  // Update dropdown position when input changes or autocomplete shows
  useEffect(() => {
    if (showAutocomplete && inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect()
      setDropdownPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
      })
    }
  }, [showAutocomplete, value])

  // Handle clicks outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node
      const isInContainer = containerRef.current && containerRef.current.contains(target)
      const isInDropdown = dropdownRef.current && dropdownRef.current.contains(target)

      if (!isInContainer && !isInDropdown) {
        setShowAutocomplete(false)
      }
    }

    if (showAutocomplete) {
      const timeoutId = setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside)
      }, 50)

      return () => {
        clearTimeout(timeoutId)
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [showAutocomplete])

  // Filter organizations based on input
  const hasExactMatch =
    selectedOrganization && selectedOrganization.org_name.toLowerCase() === debouncedOrgName.toLowerCase()

  const filteredOrganizations = showAutocomplete && debouncedOrgName && !hasExactMatch
    ? organizations.filter((org) =>
      org.org_name.toLowerCase().includes(debouncedOrgName.toLowerCase())
    )
    : []


  const handleSelectOrganization = (org: Organization) => {
    onChange(org.org_name)
    onOrganizationSelect(org)
    setShowAutocomplete(false)
  }

  const handleClearSelection = () => {
    onChange('')
    onClear?.()
  }

  return (
    <div className="space-y-2" ref={containerRef}>
      <Label htmlFor="organization">Organization</Label>
      <div className="relative">
        <div className="relative">
          <Input
            ref={inputRef}
            id="organization"
            type="text"
            placeholder="Search organizations..."
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => {
              // Show autocomplete when focused if there's input and no selection
              if (debouncedOrgName.length >= 1 && !selectedOrganization) {
                setShowAutocomplete(true)
              }
            }}
            onBlur={() => {
              // Let the outside click handler manage closing the dropdown
              // Only close after a delay to allow dropdown clicks to register
            }}
            disabled={isLoading}
            aria-invalid={error ? 'true' : 'false'}
            className={selectedOrganization ? 'pr-10' : ''}
          />
          {isLoading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />}
          {selectedOrganization && !isLoading && (
            <button
              type="button"
              onClick={handleClearSelection}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </div>

      </div>

      {error && <p className="text-sm text-red-600">{error.message}</p>}

      {selectedOrganization && (
        <p className="text-sm text-green-600">✓ Organization selected: {selectedOrganization.org_name}</p>
      )}

      {/* Dropdown Portal - renders outside dialog hierarchy */}
      {isMounted &&
        showAutocomplete &&
        createPortal(
          <div
            ref={dropdownRef}
            style={{
              position: 'fixed',
              top: `${dropdownPosition.top}px`,
              left: `${dropdownPosition.left}px`,
              width: `${dropdownPosition.width}px`,
              minWidth: '200px',
              maxHeight: '240px',
              height: 'auto',
              zIndex: 9999,
              backgroundColor: 'white',
              border: '1px solid rgb(209, 213, 219)',
              borderRadius: '0.375rem',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
              overflow: 'auto',
              pointerEvents: 'auto',
              display: 'flex',
              flexDirection: 'column',
            }}
            onMouseDown={(e) => e.stopPropagation()}
            onWheel={(e) => e.stopPropagation()}
          >
            <div style={{ overflow: 'auto', flex: 1 }}>
              {isLoading && <div className="px-4 py-2 text-sm text-gray-500">Loading organizations...</div>}
              {!isLoading && filteredOrganizations.length === 0 && (
                <div className="px-4 py-2 text-sm text-gray-500">No organizations found</div>
              )}
              {filteredOrganizations.map((org) => (
                <button
                  key={org.id}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault()
                    handleSelectOrganization(org)
                  }}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '0.5rem 1rem',
                    cursor: 'pointer',
                    borderBottom: '1px solid rgb(229, 231, 235)',
                    backgroundColor: 'transparent',
                    border: 'none',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgb(243, 244, 246)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <span style={{ fontWeight: 500, fontSize: '0.875rem' }}>{org.org_name}</span>
                  {org.org_email && <span style={{ fontSize: '0.75rem', color: 'rgb(107, 114, 128)' }}>{org.org_email}</span>}
                </button>
              ))}
            </div>
          </div>,
          document.body
        )}
    </div>
  )
}
