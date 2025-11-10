'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { addLeagueSchema, type AddLeagueFormData, type GameOccurrence } from '@/lib/schemas'
import { useAuth } from '@clerk/nextjs'
import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DatePicker } from '@/components/ui/date-picker'
import { X, Plus } from 'lucide-react'
import { format, parse } from 'date-fns'
import { Button } from '@/components/ui/button'
import { useSportSearch } from '@/hooks/useSportSearch'
import { useVenueSearch } from '@/hooks/useVenueSearch'
import { SportAutocompleteDropdown } from './SportAutocompleteDropdown'
import dynamic from 'next/dynamic'

// Dynamically import AddressAutofill to avoid SSR issues
const AddressAutofill = dynamic(
  () => import('@mapbox/search-js-react').then(mod => mod.AddressAutofill),
  { ssr: false }
) as any

interface Sport {
  id: number
  name: string
  status: 'approved' | 'pending' | 'rejected'
  request_count: number
}

interface Venue {
  id: number
  name: string
  address: string
  lat: number
  lng: number
  status: 'approved' | 'pending' | 'rejected'
  request_count: number
}

interface AddLeagueFormProps {
  onSuccess?: () => void
  onClose?: () => void
  organizationId?: string
  organizationName?: string
  onSaveAsTemplate?: (formData: AddLeagueFormData) => void
}

export function AddLeagueForm({ onSuccess, onClose, organizationId, organizationName, onSaveAsTemplate }: AddLeagueFormProps) {
  const { getToken, userId } = useAuth()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<AddLeagueFormData>({
    resolver: zodResolver(addLeagueSchema),
    defaultValues: {
      sport_id: undefined,
      sport_name: '',
      venue_id: undefined,
      venue_name: '',
      venue_address: '',
      venue_lat: undefined,
      venue_lng: undefined,
      league_name: '',
      division: '' as any,
      gender: '' as any,
      registration_deadline: '',
      season_start_date: '',
      season_end_date: '',
      season_details: '',
      game_occurrences: [],
      pricing_strategy: 'per_person',
      pricing_amount: 0,
      per_game_fee: undefined,
      registration_url: '',
      duration: 8,
      minimum_team_players: 5,
      org_id: organizationId,
      organization_name: organizationName || '',
    },
  })

  const [submitError, setSubmitError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [gameOccurrences, setGameOccurrences] = useState<GameOccurrence[]>([])
  const [newGameDay, setNewGameDay] = useState('')
  const [newGameStartTime, setNewGameStartTime] = useState('19:00')
  const [newGameEndTime, setNewGameEndTime] = useState('21:00')

  // Date state
  const [registrationDeadline, setRegistrationDeadline] = useState<Date | undefined>()
  const [seasonStartDate, setSeasonStartDate] = useState<Date | undefined>()
  const [seasonEndDate, setSeasonEndDate] = useState<Date | undefined>()

  // Draft state
  const [draftLoading, setDraftLoading] = useState(true)
  const [draftSaveStatus, setDraftSaveStatus] = useState<string | null>(null)
  const [draftError, setDraftError] = useState<string | null>(null)
  const [isSavingDraft, setIsSavingDraft] = useState(false)

  // Sport search state
  const { approvedSports } = useSportSearch()
  const [debouncedSportName, setDebouncedSportName] = useState('')
  const [showSportAutocomplete, setShowSportAutocomplete] = useState(false)
  const [selectedSport, setSelectedSport] = useState<Sport | null>(null)
  const [sportSearchInput, setSportSearchInput] = useState('')

  // Venue search state
  const { approvedVenues } = useVenueSearch()
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null)
  const [debouncedVenueName, setDebouncedVenueName] = useState('')
  const [showVenueAutocomplete, setShowVenueAutocomplete] = useState(false)
  const [venueSearchInput, setVenueSearchInput] = useState('')
  const addressInputRef = useRef<HTMLInputElement>(null)

  const pricingStrategy = watch('pricing_strategy')
  const pricingAmount = watch('pricing_amount')
  const minimumPlayers = watch('minimum_team_players')

  // Remove auto-load on mount - users should select drafts from the drafts table
  useEffect(() => {
    setDraftLoading(false)
  }, [])

  // Debounce sport search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSportName(sportSearchInput)
      setShowSportAutocomplete(sportSearchInput.length >= 1)
    }, 300)

    return () => clearTimeout(timer)
  }, [sportSearchInput])

  // Debounce venue search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedVenueName(venueSearchInput)
      setShowVenueAutocomplete(venueSearchInput.length >= 1)
    }, 300)

    return () => clearTimeout(timer)
  }, [venueSearchInput])

  // Populate sport display when draft loads with sport_id
  useEffect(() => {
    const sportId = watch('sport_id')
    if (sportId && approvedSports.length > 0 && !selectedSport) {
      const foundSport = approvedSports.find((s) => s.id === sportId)
      if (foundSport) {
        setSelectedSport(foundSport)
        setSportSearchInput(foundSport.name)
      }
    }
  }, [watch('sport_id'), approvedSports, selectedSport])

  // Filter approved sports for autocomplete
  // Don't show suggestions if there's an exact match with selected sport
  const hasExactSportMatch = selectedSport && selectedSport.name.toLowerCase() === debouncedSportName.toLowerCase();

  const filteredSportSuggestions = showSportAutocomplete && debouncedSportName && !hasExactSportMatch
    ? approvedSports.filter((sport) =>
      sport.name.toLowerCase().includes(debouncedSportName.toLowerCase())
    )
    : []

  // Populate venue display when draft loads with venue_id
  useEffect(() => {
    const venueId = watch('venue_id')
    if (venueId && approvedVenues.length > 0 && !selectedVenue) {
      const foundVenue = approvedVenues.find((v) => v.id === venueId)
      if (foundVenue) {
        setSelectedVenue(foundVenue)
        setVenueSearchInput(foundVenue.name)
      }
    }
  }, [watch('venue_id'), approvedVenues, selectedVenue])

  // Filter approved venues for autocomplete
  // Don't show suggestions if there's an exact match with selected venue
  const hasExactVenueMatch = selectedVenue && selectedVenue.name.toLowerCase() === debouncedVenueName.toLowerCase();

  const filteredVenueSuggestions = showVenueAutocomplete && debouncedVenueName && !hasExactVenueMatch
    ? approvedVenues.filter((venue) =>
      venue.name.toLowerCase().includes(debouncedVenueName.toLowerCase()) ||
      venue.address.toLowerCase().includes(debouncedVenueName.toLowerCase())
    )
    : []

  const handleSelectSport = (sport: Sport) => {
    setSelectedSport(sport)
    setSportSearchInput(sport.name)
    setValue('sport_id', sport.id)
    setValue('sport_name', sport.name)
    setShowSportAutocomplete(false)
  }

  const handleClearSportSelection = () => {
    setSelectedSport(null)
    setSportSearchInput('')
    setValue('sport_id', undefined)
    setDebouncedSportName('')
    setShowSportAutocomplete(false)
  }

  // Handle venue address selection from Mapbox AddressAutofill
  const handleVenueAddressChange = (featureCollection: any) => {
    const feature = featureCollection?.features?.[0]

    if (feature && feature.geometry && feature.properties) {
      const [lng, lat] = feature.geometry.coordinates
      const address = feature.properties.full_address || feature.properties.place_name

      // Look for matching venue in the database by address
      const matchingVenue = approvedVenues.find(
        (v) => v.address.toLowerCase() === address.toLowerCase()
      )

      if (matchingVenue) {
        // Venue exists in database - set venue_id and other venue fields
        setSelectedVenue(matchingVenue)
        setValue('venue_id', matchingVenue.id)
        setValue('venue_name', matchingVenue.name)
        setValue('venue_address', address)
        setValue('venue_lat', lat)
        setValue('venue_lng', lng)
        if (addressInputRef.current) {
          addressInputRef.current.value = address
        }
      } else {
        // Venue doesn't exist - store the address and coordinates for later creation
        setSelectedVenue(null)
        setValue('venue_id', null as any)
        setValue('venue_address', address)
        setValue('venue_lat', lat)
        setValue('venue_lng', lng)
        if (addressInputRef.current) {
          addressInputRef.current.value = address
        }
      }
    }
  }

  const handleSelectVenue = (venue: Venue) => {
    setSelectedVenue(venue)
    setValue('venue_id', venue.id)
    setValue('venue_name', venue.name)
    setValue('venue_address', venue.address)
    setValue('venue_lat', venue.lat)
    setValue('venue_lng', venue.lng)
    if (addressInputRef.current) {
      addressInputRef.current.value = venue.address
    }
  }

  const handleClearVenueSelection = () => {
    setSelectedVenue(null)
    setValue('venue_id', null as any)
    setValue('venue_name', '')
    setValue('venue_address', '')
    setValue('venue_lat', null as any)
    setValue('venue_lng', null as any)
    if (addressInputRef.current) {
      addressInputRef.current.value = ''
    }
  }

  // Handle date changes
  const handleRegistrationDeadlineChange = (date: Date | undefined) => {
    setRegistrationDeadline(date)
    if (date) {
      setValue('registration_deadline', format(date, 'yyyy-MM-dd'))
    }
  }

  const handleSeasonStartDateChange = (date: Date | undefined) => {
    setSeasonStartDate(date)
    if (date) {
      setValue('season_start_date', format(date, 'yyyy-MM-dd'))
    }
  }

  const handleSeasonEndDateChange = (date: Date | undefined) => {
    setSeasonEndDate(date)
    if (date) {
      setValue('season_end_date', format(date, 'yyyy-MM-dd'))
    } else {
      setValue('season_end_date', null as any)
    }
  }

  // Calculate per-player price
  const calculatePerPlayerPrice = () => {
    if (!pricingAmount || !minimumPlayers) return null
    if (pricingStrategy === 'per_person') return pricingAmount
    if (pricingStrategy === 'per_team') {
      return Math.ceil(pricingAmount / minimumPlayers)
    }
    return null
  }

  const perPlayerPrice = calculatePerPlayerPrice()

  // Add game occurrence
  const handleAddGameOccurrence = () => {
    if (!newGameDay || !newGameStartTime || !newGameEndTime) {
      alert('Please fill in all game occurrence fields')
      return
    }

    const newOccurrence: GameOccurrence = {
      day: newGameDay,
      startTime: newGameStartTime,
      endTime: newGameEndTime,
    }

    const updated = [...gameOccurrences, newOccurrence]
    setGameOccurrences(updated)
    setValue('game_occurrences', updated)
    setNewGameDay('')
    setNewGameStartTime('19:00')
    setNewGameEndTime('21:00')
  }

  // Remove game occurrence
  const handleRemoveGameOccurrence = (index: number) => {
    const updated = gameOccurrences.filter((_, i) => i !== index)
    setGameOccurrences(updated)
    setValue('game_occurrences', updated)
  }

  // Save draft
  const handleSaveDraft = async () => {
    setDraftError(null)
    setIsSavingDraft(true)

    try {
      const token = await getToken()

      if (!token || !userId || !organizationId) {
        throw new Error('Authentication or organization required')
      }

      // Prepare draft data - include both date values and current form values
      const draftData = {
        sport_id: watch('sport_id'),
        sport_name: watch('sport_name'),
        venue_id: watch('venue_id'),
        venue_name: watch('venue_name'),
        venue_address: watch('venue_address'),
        venue_lat: watch('venue_lat'),
        venue_lng: watch('venue_lng'),
        league_name: watch('league_name'),
        division: watch('division'),
        gender: watch('gender'),
        registration_deadline: registrationDeadline ? format(registrationDeadline, 'yyyy-MM-dd') : '',
        season_start_date: seasonStartDate ? format(seasonStartDate, 'yyyy-MM-dd') : '',
        season_end_date: seasonEndDate ? format(seasonEndDate, 'yyyy-MM-dd') : null,
        season_details: watch('season_details'),
        game_occurrences: gameOccurrences,
        pricing_strategy: watch('pricing_strategy'),
        pricing_amount: watch('pricing_amount'),
        per_game_fee: watch('per_game_fee'),
        minimum_team_players: watch('minimum_team_players'),
        registration_url: watch('registration_url'),
        duration: watch('duration'),
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/leagues/drafts?org_id=${organizationId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            'X-Clerk-User-ID': userId,
          },
          body: JSON.stringify({
            data: draftData,
          }),
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save draft')
      }

      setDraftSaveStatus('Draft saved successfully')
      setTimeout(() => {
        setDraftSaveStatus(null)
        onClose?.()
      }, 1500)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save draft'
      setDraftError(message)
      console.error('Draft save error:', error)
    } finally {
      setIsSavingDraft(false)
    }
  }

  // Delete draft
  const handleDeleteDraft = async () => {
    if (!organizationId) return

    try {
      const token = await getToken()
      if (!token) return

      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/leagues/drafts/${organizationId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
    } catch (error) {
      console.error('Failed to delete draft:', error)
    }
  }

  // Handle save as template
  const handleSaveAsTemplate = () => {
    const formData: AddLeagueFormData = {
      sport_id: watch('sport_id'),
      sport_name: watch('sport_name'),
      venue_id: watch('venue_id'),
      venue_name: watch('venue_name'),
      venue_address: watch('venue_address'),
      venue_lat: watch('venue_lat'),
      venue_lng: watch('venue_lng'),
      league_name: watch('league_name'),
      division: watch('division'),
      gender: watch('gender'),
      registration_deadline: registrationDeadline ? format(registrationDeadline, 'yyyy-MM-dd') : '',
      season_start_date: seasonStartDate ? format(seasonStartDate, 'yyyy-MM-dd') : '',
      season_end_date: seasonEndDate ? format(seasonEndDate, 'yyyy-MM-dd') : null,
      season_details: watch('season_details'),
      game_occurrences: gameOccurrences,
      pricing_strategy: watch('pricing_strategy'),
      pricing_amount: watch('pricing_amount'),
      per_game_fee: watch('per_game_fee'),
      minimum_team_players: watch('minimum_team_players'),
      registration_url: watch('registration_url'),
      duration: watch('duration'),
      org_id: organizationId,
      organization_name: organizationName || '',
    }

    onSaveAsTemplate?.(formData)
  }

  // Handle form submission
  const onSubmit = async (data: AddLeagueFormData) => {
    setSubmitError(null)

    try {
      const token = await getToken()

      if (!token || !userId) {
        throw new Error('Authentication required. Please sign in.')
      }

      // Format the payload - remove org_id and organization_name from body
      const { org_id, organization_name, ...payload } = data

      const url = organizationId
        ? `${process.env.NEXT_PUBLIC_API_URL}/v1/leagues?org_id=${organizationId}`
        : `${process.env.NEXT_PUBLIC_API_URL}/v1/leagues`

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'X-Clerk-User-ID': userId,
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create league')
      }

      // Delete draft after successful submission
      await handleDeleteDraft()

      setSuccess(true)
      setTimeout(() => {
        onSuccess?.()
        onClose?.()
      }, 1500)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to submit league'
      setSubmitError(message)
      console.error('Submit error:', error)
    }
  }

  if (success) {
    return (
      <div className="py-4 text-center">
        <p className="text-green-600 font-medium">League submitted successfully! It will be reviewed by an admin.</p>
      </div>
    )
  }

  if (draftLoading) {
    return (
      <div className="py-8 text-center">
        <p className="text-gray-600">Loading form...</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 w-full">
      {/* Hidden organization ID field */}
      <input
        type="hidden"
        {...register('org_id')}
        value={organizationId}
      />

      {/* Hidden organization name field */}
      <input
        type="hidden"
        {...register('organization_name')}
      />

      {/* Section: League Info */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">League Information</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Sport Selection with Autocomplete */}
          <div className="space-y-2">
            <Label htmlFor="sport_name">Sport *</Label>
            <div className="relative">
              <div className="relative">
                <Input
                  id="sport_name"
                  placeholder="e.g., Basketball, Football, Tennis"
                  value={sportSearchInput}
                  onChange={(e) => {
                    setSportSearchInput(e.target.value)
                    setValue('sport_name', e.target.value)
                  }}
                  onFocus={() => sportSearchInput.length >= 1 && !selectedSport && setShowSportAutocomplete(true)}
                  onBlur={() => setTimeout(() => setShowSportAutocomplete(false), 150)}
                  maxLength={255}
                  autoComplete="off"
                  aria-invalid={errors.sport_name ? 'true' : 'false'}
                />
                {selectedSport && (
                  <button
                    type="button"
                    onClick={handleClearSportSelection}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Sport Autocomplete Dropdown */}
              <SportAutocompleteDropdown
                show={showSportAutocomplete && filteredSportSuggestions.length > 0}
                suggestions={filteredSportSuggestions}
                onSelect={handleSelectSport}
              />
            </div>

            {errors.sport_name && (
              <p className="text-sm text-red-600">{errors.sport_name.message}</p>
            )}
          </div>

          {/* Hidden sport_id field */}
          <input
            type="hidden"
            {...register('sport_id', { valueAsNumber: true })}
          />

          {/* League Name */}
          <div className="space-y-2">
            <Label htmlFor="league_name">League Name *</Label>
            <Input
              {...register('league_name')}
              id="league_name"
              type="text"
              placeholder="e.g., Summer Basketball League"
              aria-invalid={errors.league_name ? 'true' : 'false'}
            />
            {errors.league_name && (
              <p className="text-sm text-red-600">{errors.league_name.message}</p>
            )}
          </div>


          {/* Division/Skill Level */}
          <div className="space-y-2">
            <Label htmlFor="division">Skill Level *</Label>
            <select
              {...register('division')}
              id="division"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white"
              aria-invalid={errors.division ? 'true' : 'false'}
            >
              <option value="">Select a skill level</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="expert">Expert</option>
            </select>
            {errors.division && (
              <p className="text-sm text-red-600">{errors.division.message}</p>
            )}
          </div>

          {/* Gender */}
          <div className="space-y-2">
            <Label htmlFor="gender">Gender *</Label>
            <select
              {...register('gender')}
              id="gender"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white"
              aria-invalid={errors.gender ? 'true' : 'false'}
            >
              <option value="">Select a gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="co-ed">Co-ed</option>
            </select>
            {errors.gender && (
              <p className="text-sm text-red-600">{errors.gender.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Section: Dates */}
      {/* // TODO: We should not liking the dialog approach to the date pickers */}
      {/* // they should just open up in the form */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Season Dates</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Registration Deadline */}
          <div className="space-y-2">
            <Label htmlFor="registration_deadline">Registration Deadline *</Label>
            <DatePicker
              date={registrationDeadline}
              onDateChange={handleRegistrationDeadlineChange}
              placeholder="Select deadline"
            />
            {errors.registration_deadline && (
              <p className="text-sm text-red-600">{errors.registration_deadline.message}</p>
            )}
          </div>

          {/* Registration URL */}
          <div className="space-y-2">
            <Label htmlFor="registration_url">Registration URL *</Label>
            <Input
              {...register('registration_url')}
              id="registration_url"
              type="url"
              placeholder="https://example.com/register"
              aria-invalid={errors.registration_url ? 'true' : 'false'}
            />
            {errors.registration_url && (
              <p className="text-sm text-red-600">{errors.registration_url.message}</p>
            )}
          </div>

          {/* Season Start Date */}
          <div className="space-y-2">
            <Label htmlFor="season_start_date">Season Start Date *</Label>
            <DatePicker
              date={seasonStartDate}
              onDateChange={handleSeasonStartDateChange}
              placeholder="Select start date"
            />
            {errors.season_start_date && (
              <p className="text-sm text-red-600">{errors.season_start_date.message}</p>
            )}
          </div>

          {/* Season End Date */}
          <div className="space-y-2">
            <Label htmlFor="season_end_date">Season End Date (Optional)</Label>
            <DatePicker
              date={seasonEndDate}
              onDateChange={handleSeasonEndDateChange}
              placeholder="Select end date"
            />
            {errors.season_end_date && (
              <p className="text-sm text-red-600">{errors.season_end_date.message}</p>
            )}
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <Label htmlFor="duration">Duration (weeks) *</Label>
            <Input
              {...register('duration', { valueAsNumber: true })}
              id="duration"
              type="number"
              min="1"
              max="52"
              placeholder="8"
              aria-invalid={errors.duration ? 'true' : 'false'}
            />
            {errors.duration && (
              <p className="text-sm text-red-600">{errors.duration.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Section: Venue */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Venue</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Venue Search with Autocomplete */}
          <div className="space-y-2">
            <Label htmlFor="venue_search">Venue (Optional)</Label>
            <p className="text-sm text-gray-600">Select from popular venues or add a new one</p>
            <div className="relative">
              <div className="relative">
                <Input
                  id="venue_search"
                  placeholder="e.g., Central Park Courts"
                  value={venueSearchInput}
                  onChange={(e) => {
                    setVenueSearchInput(e.target.value)
                    setValue('venue_name', e.target.value)
                  }}
                  onFocus={() => venueSearchInput.length >= 1 && !selectedVenue && setShowVenueAutocomplete(true)}
                  onBlur={() => setTimeout(() => setShowVenueAutocomplete(false), 150)}
                  maxLength={255}
                  autoComplete="off"
                  aria-invalid={errors.venue_name ? 'true' : 'false'}
                />
                {selectedVenue && (
                  <button
                    type="button"
                    onClick={handleClearVenueSelection}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Venue Autocomplete Dropdown */}
              {showVenueAutocomplete && filteredVenueSuggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
                  {filteredVenueSuggestions.map((venue) => (
                    <button
                      key={venue.id}
                      type="button"
                      onClick={() => {
                        handleSelectVenue(venue)
                        setShowVenueAutocomplete(false)
                      }}
                      className="w-full px-3 py-2 text-left hover:bg-gray-100 border-b last:border-b-0"
                    >
                      <p className="text-sm font-medium text-gray-900">{venue.name}</p>
                      <p className="text-xs text-gray-600">{venue.address}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {errors.venue_name && (
              <p className="text-sm text-red-600">{errors.venue_name.message}</p>
            )}
          </div>

          {/* Address field - hidden when venue is selected from dropdown */}
          {!selectedVenue && (
            <div className="space-y-2">
              <Label htmlFor="venue_address">Search Address</Label>
              <p className="text-sm text-gray-600">Find address or enter custom location</p>
              {(() => {
                const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
                return mapboxToken ? (
                  <AddressAutofill accessToken={mapboxToken} onRetrieve={handleVenueAddressChange}>
                    <Input
                      ref={addressInputRef}
                      id="venue_address"
                      type="text"
                      autoComplete="address-line1"
                      placeholder="Search address..."
                      aria-invalid={errors.venue_id ? 'true' : 'false'}
                    />
                  </AddressAutofill>
                ) : (
                  <Input
                    ref={addressInputRef}
                    id="venue_address"
                    type="text"
                    placeholder="Enter address..."
                    aria-invalid={errors.venue_id ? 'true' : 'false'}
                  />
                )
              })()}
              {errors.venue_id && (
                <p className="text-sm text-red-600">{errors.venue_id.message}</p>
              )}
            </div>
          )}
        </div>

        {selectedVenue && (
          <div className="mt-4 flex items-center justify-between bg-green-50 p-3 rounded-md border border-green-200">
            <div className="flex-1">
              <p className="text-sm text-green-700 font-medium">{selectedVenue.name}</p>
              <p className="text-xs text-green-600">{selectedVenue.address}</p>
            </div>
            <button
              type="button"
              onClick={handleClearVenueSelection}
              className="ml-2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {!selectedVenue && addressInputRef.current?.value && (
          <p className="text-xs text-gray-500 italic mt-4">
            This venue will be created during admin approval if it doesn't exist
          </p>
        )}

        {/* Hidden venue coordinates */}
        <input type="hidden" {...register('venue_lat', { valueAsNumber: true })} />
        <input type="hidden" {...register('venue_lng', { valueAsNumber: true })} />
      </div>

      {/* Section: Game Schedule */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Game Schedule</h3>

        {/* Add Game Occurrence */}
        <div className="space-y-4 mb-6">
          <p className="text-sm text-gray-600">Add all days and times when games occur</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Day */}
            <div className="space-y-2">
              <Label htmlFor="new_game_day">Day</Label>
              <Input
                id="new_game_day"
                type="text"
                placeholder="e.g., Monday, Wednesday"
                value={newGameDay}
                onChange={(e) => setNewGameDay(e.target.value)}
              />
            </div>

            {/* Start Time */}
            <div className="space-y-2">
              <Label htmlFor="new_game_start_time">Start Time</Label>
              <Input
                id="new_game_start_time"
                type="time"
                value={newGameStartTime}
                onChange={(e) => setNewGameStartTime(e.target.value)}
              />
            </div>

            {/* End Time */}
            <div className="space-y-2">
              <Label htmlFor="new_game_end_time">End Time</Label>
              <Input
                id="new_game_end_time"
                type="time"
                value={newGameEndTime}
                onChange={(e) => setNewGameEndTime(e.target.value)}
              />
            </div>
          </div>

          <Button type="button" onClick={handleAddGameOccurrence}>
            <Plus size={16} />
            Add Game Occurrence
          </Button>
        </div>

        {/* Game Occurrences List */}
        {gameOccurrences.length > 0 && (
          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-700">Added game occurrences:</p>
            {gameOccurrences.map((occurrence, index) => (
              <div
                key={index}
                className="flex items-center justify-between bg-gray-50 p-4 rounded-md"
              >
                <span className="text-sm text-gray-700">
                  {occurrence.day} · {occurrence.startTime} - {occurrence.endTime}
                </span>
                <Button
                  type="button"
                  onClick={() => handleRemoveGameOccurrence(index)}
                  variant="ghost"
                  size="icon"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <X size={18} />
                </Button>
              </div>
            ))}
          </div>
        )}

        {errors.game_occurrences && (
          <p className="text-sm text-red-600 mt-2">{errors.game_occurrences.message}</p>
        )}
      </div>

      {/* Section: Pricing */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Pricing</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Pricing Strategy */}
          <div className="space-y-2">
            <Label htmlFor="pricing_strategy">Pricing Strategy *</Label>
            <select
              {...register('pricing_strategy')}
              id="pricing_strategy"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white"
              aria-invalid={errors.pricing_strategy ? 'true' : 'false'}
            >
              <option value="per_person">Per Person</option>
              <option value="per_team">Per Team</option>
            </select>
            {errors.pricing_strategy && (
              <p className="text-sm text-red-600">{errors.pricing_strategy.message}</p>
            )}
          </div>

          {/* Pricing Amount */}
          <div className="space-y-2">
            <Label htmlFor="pricing_amount">
              {pricingStrategy === 'per_team' ? 'Team Cost ($)' : 'Price per Person ($)'} *
            </Label>
            <Input
              {...register('pricing_amount', { valueAsNumber: true })}
              id="pricing_amount"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              aria-invalid={errors.pricing_amount ? 'true' : 'false'}
            />
            {errors.pricing_amount && (
              <p className="text-sm text-red-600">{errors.pricing_amount.message}</p>
            )}
          </div>
        </div>

        {/* Per Game Fee */}
        <div className="space-y-2 mb-6">
          <Label htmlFor="per_game_fee">Per Game Fee (Optional)</Label>
          <p className="text-sm text-gray-600">Additional fee per game for referee, equipment, or facility costs</p>
          <Input
            {...register('per_game_fee', { valueAsNumber: true })}
            id="per_game_fee"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            aria-invalid={errors.per_game_fee ? 'true' : 'false'}
          />
          {errors.per_game_fee && (
            <p className="text-sm text-red-600">{errors.per_game_fee.message}</p>
          )}
        </div>

        {/* Minimum Team Players */}
        <div className="space-y-2 mb-6">
          <Label htmlFor="minimum_team_players">Minimum Team Players *</Label>
          <Input
            {...register('minimum_team_players', { valueAsNumber: true })}
            id="minimum_team_players"
            type="number"
            min="1"
            max="100"
            placeholder="5"
            aria-invalid={errors.minimum_team_players ? 'true' : 'false'}
          />
          {errors.minimum_team_players && (
            <p className="text-sm text-red-600">{errors.minimum_team_players.message}</p>
          )}
        </div>

        {/* Price Preview */}
        {perPlayerPrice !== null && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <p className="text-sm text-gray-700">
              <span className="font-medium">Estimated price per player:</span>{' '}
              <span className="text-lg font-bold text-blue-600">${perPlayerPrice.toFixed(2)}</span>
            </p>
            {pricingStrategy === 'per_team' && (
              <p className="text-xs text-gray-600 mt-1">
                (Calculated by dividing team cost by {minimumPlayers} players)
              </p>
            )}
          </div>
        )}
      </div>

      {/* Section: Season Details */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h3>

        <div className="space-y-2">
          <Label htmlFor="season_details">Season Details (Optional)</Label>
          <textarea
            {...register('season_details')}
            id="season_details"
            placeholder="Additional details about the season format, rules, etc."
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-400"
            rows={3}
            aria-invalid={errors.season_details ? 'true' : 'false'}
          />
          {errors.season_details && (
            <p className="text-sm text-red-600">{errors.season_details.message}</p>
          )}
        </div>
      </div>

      {/* Draft Status */}
      {draftSaveStatus && (
        <div className="rounded-md bg-green-50 p-4">
          <p className="text-sm text-green-800">{draftSaveStatus}</p>
        </div>
      )}

      {/* Draft Error */}
      {draftError && (
        <div className="rounded-md bg-yellow-50 p-4">
          <p className="text-sm text-yellow-800">{draftError}</p>
        </div>
      )}

      {/* Approval Notification - Shows what will be created */}
      {(() => {
        const sportId = watch('sport_id')
        const sportName = watch('sport_name')
        const venueId = watch('venue_id')
        const venueName = watch('venue_name')
        const venueAddress = watch('venue_address')

        const willCreateSport = !sportId && sportName
        const willCreateVenue = !venueId && (venueName || venueAddress)

        if (willCreateSport || willCreateVenue) {
          return (
            <div className="border-l-4 border-blue-400 bg-blue-50 p-4 rounded">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-700 font-medium">
                    The following will be created when this league is approved:
                  </p>
                  <ul className="mt-2 text-sm text-blue-600 space-y-1">
                    {willCreateSport && (
                      <li className="flex items-center">
                        <span className="mr-2">•</span>
                        <span><strong>Sport:</strong> {sportName}</span>
                      </li>
                    )}
                    {willCreateVenue && (
                      <li className="flex items-center">
                        <span className="mr-2">•</span>
                        <span>
                          <strong>Venue:</strong> {venueName || 'Custom Venue'}
                          {venueAddress && ` (${venueAddress})`}
                        </span>
                      </li>
                    )}
                  </ul>
                  <p className="mt-2 text-xs text-blue-600 italic">
                    An admin will review and approve these before they become available for other leagues.
                  </p>
                </div>
              </div>
            </div>
          )
        }
        return null
      })()}

      {/* Submit Error Message */}
      {submitError && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">{submitError}</p>
        </div>
      )}

      {/* Button Group */}
      <div className="flex gap-3">
        <Button
          type="button"
          onClick={handleSaveDraft}
          disabled={isSavingDraft || isSubmitting}
          variant="outline"
          className="flex-1"
        >
          {isSavingDraft ? 'Saving Draft...' : 'Save Draft'}
        </Button>
        {onSaveAsTemplate && (
          <Button
            type="button"
            onClick={handleSaveAsTemplate}
            disabled={isSubmitting || isSavingDraft}
            variant="outline"
            className="flex-1"
          >
            Continue to Save as Template
          </Button>
        )}
        <Button
          type="submit"
          disabled={isSubmitting || isSavingDraft}
          className="flex-1"
        >
          {isSubmitting ? 'Submitting...' : 'Submit League'}
        </Button>
      </div>

      <p className="text-xs text-gray-500">
        Your league submission will be reviewed by an admin before appearing on the map.
      </p>
    </form>
  )
}
