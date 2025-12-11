'use client'

import { useEffect, useRef, ForwardedRef, forwardRef } from 'react'
import dynamic from 'next/dynamic'
import { Input } from '@/components/ui/input'

// Dynamically import AddressAutofill to avoid SSR issues
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const AddressAutofill = dynamic(
  () => import('@mapbox/search-js-react').then(mod => mod.AddressAutofill),
  { ssr: false }
) as any

interface MapboxAddressInputProps {
  id?: string
  placeholder?: string
  defaultValue?: string
  value?: string
  onChange?: (value: string) => void
  onRetrieve?: (featureCollection: any) => void
  disabled?: boolean
  className?: string
  onMapboxDropdownStateChange?: (isOpen: boolean) => void
  hasError?: boolean
}

/**
 * MapboxAddressInput Component
 *
 * A reusable component that wraps Mapbox AddressAutofill with proper event handling
 * for modal dialogs. Automatically sets up event listeners to prevent parent dialogs
 * from closing when interacting with the Mapbox dropdown.
 *
 * Usage:
 * const [address, setAddress] = useState('')
 * const [mapboxOpen, setMapboxOpen] = useState(false)
 *
 * <MapboxAddressInput
 *   placeholder="Search address..."
 *   value={address}
 *   onChange={setAddress}
 *   onRetrieve={handleAddressSelected}
 *   onMapboxDropdownStateChange={setMapboxOpen}
 * />
 */
export const MapboxAddressInput = forwardRef(
  (
    {
      id,
      placeholder = 'Search address...',
      defaultValue = '',
      value,
      onChange,
      onRetrieve,
      disabled = false,
      className,
      onMapboxDropdownStateChange,
      hasError = false,
    }: MapboxAddressInputProps,
    ref: ForwardedRef<HTMLInputElement>
  ) => {
    const internalRef = useRef<HTMLInputElement>(null)
    const inputRef = ref || internalRef

    // Update input when onRetrieve is called (when user selects from Mapbox dropdown)
    const handleRetrieve = (featureCollection: any) => {
      // Call parent's onRetrieve to handle the feature data
      onRetrieve?.(featureCollection)
    }

    // Handle manual typing in the input
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value
      onChange?.(newValue)
    }

    // Monitor Mapbox AddressAutofill dropdown and prevent parent dialog from closing
    useEffect(() => {
      let debounceTimer: NodeJS.Timeout
      let lastEventTime = 0
      const debounceDelay = 50

      const handlePointerDown = (e: PointerEvent) => {
        const target = e.target as HTMLElement
        const isMapboxElement = target.closest(
          '[class*="mapbox"], [class*="search"], [role="option"], [class*="suggestions"], [class*="suggestion"]'
        )

        if (isMapboxElement) {
          const now = Date.now()
          if (now - lastEventTime < debounceDelay) {
            return
          }
          lastEventTime = now

          onMapboxDropdownStateChange?.(true)

          e.stopPropagation()
          e.preventDefault()
        }
      }

      const handlePointerUp = (e: PointerEvent) => {
        const target = e.target as HTMLElement
        const isMapboxElement = target.closest(
          '[class*="mapbox"], [class*="search"], [role="option"], [class*="suggestions"], [class*="suggestion"]'
        )

        if (isMapboxElement) {
          const now = Date.now()
          if (now - lastEventTime < debounceDelay) {
            return
          }
          lastEventTime = now

          e.stopPropagation()
          e.preventDefault()
        }

        clearTimeout(debounceTimer)
        debounceTimer = setTimeout(() => {
          const mapboxSuggestions = document.querySelector('[class*="suggestions"]')
          if (!mapboxSuggestions || window.getComputedStyle(mapboxSuggestions).display === 'none') {
            onMapboxDropdownStateChange?.(false)
          }
        }, 100)
      }

      document.addEventListener('pointerdown', handlePointerDown, true)
      document.addEventListener('pointerup', handlePointerUp, true)

      return () => {
        clearTimeout(debounceTimer)
        document.removeEventListener('pointerdown', handlePointerDown, true)
        document.removeEventListener('pointerup', handlePointerUp, true)
      }
    }, [onMapboxDropdownStateChange])

    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN

    const displayValue = value !== undefined ? value : defaultValue

    return mapboxToken ? (
      <AddressAutofill accessToken={mapboxToken} onRetrieve={handleRetrieve}>
        <input
          ref={inputRef}
          id={id}
          type="text"
          autoComplete="address-line1"
          placeholder={placeholder}
          defaultValue={displayValue}
          onChange={handleChange}
          onClick={(e) => e.stopPropagation()}
          disabled={disabled}
          className={`w-full px-3 py-2 border rounded-md text-gray-900 placeholder-gray-400 disabled:bg-gray-100 disabled:cursor-not-allowed outline-none focus:ring-1 ${
            hasError
              ? 'border-red-500 border-2 focus:border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
          } ${className || ''}`}
        />
      </AddressAutofill>
    ) : (
      <input
        ref={inputRef}
        id={id}
        type="text"
        placeholder={placeholder}
        defaultValue={displayValue}
        onChange={handleChange}
        onClick={(e) => e.stopPropagation()}
        disabled={disabled}
        className={`w-full px-3 py-2 border rounded-md text-gray-900 placeholder-gray-400 disabled:bg-gray-100 disabled:cursor-not-allowed outline-none focus:ring-1 ${
          hasError
            ? 'border-red-500 border-2 focus:border-red-500 focus:ring-red-500'
            : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
        } ${className || ''}`}
      />
    )
  }
)

MapboxAddressInput.displayName = 'MapboxAddressInput'
