'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { addLeagueSchema, type AddLeagueFormData, type GameOccurrence } from '@/lib/schemas'
import { useAuth } from '@clerk/nextjs'
import { useState, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { useLeagueFormContext } from '@/context/LeagueFormContext'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DatePicker } from '@/components/ui/date-picker'
import { MapboxAddressInput } from './MapboxAddressInput'
import { format, parse } from 'date-fns'
import { GameOccurrencesManager } from './GameOccurrencesManager'
import { LeagueFormButtons } from './LeagueFormButtons'
import { SportAutocomplete } from './SportAutocomplete'
import { VenueAutocomplete } from './VenueAutocomplete'
import { SaveLeagueModal } from '@/components/leagues/SaveLeagueModal'
import { useLeagueFormData } from '@/lib/hooks/useLeagueFormData'
import { useLeagueFormPopulation } from '@/lib/hooks/useLeagueFormPopulation'
import { useLeagueDraftOperations } from '@/lib/hooks/useLeagueDraftOperations'
import dynamic from 'next/dynamic'

// Dynamically import AddressAutofill to avoid SSR issues
// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  onSaveAsTemplate?: (formData: AddLeagueFormData) => void
  onMapboxDropdownStateChange?: (isOpen: boolean) => void
}

export function AddLeagueForm({ onSaveAsTemplate, onMapboxDropdownStateChange }: AddLeagueFormProps = {}) {
  // Get all form context from the provider
  const {
    mode,
    draftId: editingDraftId,
    templateId: editingTemplateId,
    leagueId: viewingLeagueId,
    leagueStatus,
    leagueRejectionReason,
    prePopulatedFormData,
    organizationId,
    organizationName,
    onSuccess,
    onClose,
    onLeagueSubmitted,
    refetchDrafts,
    refetchTemplates,
    refetchLeagues,
  } = useLeagueFormContext()

  // Derive boolean flags from mode
  const isEditingDraft = mode === 'edit-draft'
  const isEditingTemplate = mode === 'edit-template'
  const isCreatingTemplate = mode === 'create-template'
  const isViewingLeague = mode === 'view'
  const { getToken, userId } = useAuth()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    reset,
    getValues,
  } = useForm<AddLeagueFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(addLeagueSchema) as any,
    mode: 'onBlur',
    defaultValues: {
      sport_id: undefined,
      sport_name: '',
      venue_id: undefined,
      venue_name: '',
      venue_address: '',
      venue_lat: undefined,
      venue_lng: undefined,
      league_name: '',
      division: '',
      gender: 'co-ed',
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

  // State management
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [gameOccurrences, setGameOccurrences] = useState<GameOccurrence[]>([])
  const [registrationDeadline, setRegistrationDeadline] = useState<Date | undefined>()
  const [seasonStartDate, setSeasonStartDate] = useState<Date | undefined>()
  const [seasonEndDate, setSeasonEndDate] = useState<Date | undefined>()
  const [draftSaveStatus, setDraftSaveStatus] = useState<string | null>(null)
  const [draftError, setDraftError] = useState<string | null>(null)
  const [draftName, setDraftName] = useState('')
  const [selectedSport, setSelectedSport] = useState<Sport | null>(null)
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null)
  const [sportSearchInput, setSportSearchInput] = useState('')
  const [venueSearchInput, setVenueSearchInput] = useState('')
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [showNewVenueForm, setShowNewVenueForm] = useState(false)
  const [isMapboxDropdownOpen, setIsMapboxDropdownOpen] = useState(false)
  const newVenueAddressInputRef = useRef<HTMLInputElement>(null)

  // Notify parent about Mapbox dropdown state changes
  useEffect(() => {
    onMapboxDropdownStateChange?.(isMapboxDropdownOpen)
  }, [isMapboxDropdownOpen, onMapboxDropdownStateChange])


  // Initialize hooks
  const { collectData } = useLeagueFormData(
    watch,
    { registrationDeadline, seasonStartDate, seasonEndDate },
    gameOccurrences
  )

  const { populateForm, setSport, setVenue } = useLeagueFormPopulation(
    setValue,
    setSelectedSport,
    setSelectedVenue,
    setGameOccurrences,
    setShowNewVenueForm,
    reset
  )

  const { save: saveDraftOrTemplate, remove: deleteDraftOrTemplate, isLoading: isDraftOperationLoading, error: draftOperationError } = useLeagueDraftOperations({
    organizationId,
    onSuccess: () => {
      if (refetchDrafts) refetchDrafts()
      if (refetchTemplates) refetchTemplates()
    },
  })

  const pricingStrategy = watch('pricing_strategy')
  const pricingAmount = watch('pricing_amount')
  const minimumPlayers = watch('minimum_team_players')

  // Load pre-populated form data when available
  useEffect(() => {
    if (prePopulatedFormData) {
      populateForm(prePopulatedFormData)

      // Set sport/venue state for UI
      const sportId = prePopulatedFormData.sport_id
      const sportName = prePopulatedFormData.sport_name
      if (sportName) {
        setSportSearchInput(sportName)
        if (sportId) {
          setSport({ id: sportId, name: sportName, status: 'approved', request_count: 0 }, sportName)
        } else {
          // For drafts without sport_id, still set the sport name
          setSport(null, sportName)
        }
      }

      const venueId = prePopulatedFormData.venue_id
      const venueName = prePopulatedFormData.venue_name

      if (venueId) {
        // Venue exists with ID - use default venue autocomplete view
        setVenueSearchInput(venueName)
        setVenue(
          {
            id: venueId,
            name: venueName,
            address: prePopulatedFormData.venue_address || '',
            lat: prePopulatedFormData.venue_lat || 0,
            lng: prePopulatedFormData.venue_lng || 0,
            status: 'approved',
            request_count: 0,
          },
          venueName
        )
      } else if (venueName) {
        // Venue without ID (custom venue) - show the add new venue form
        setVenueSearchInput(venueName)
        setVenue(null, venueName)
      } else {
        // No venue data - show the add new venue form by default
        setVenue(null, '')
      }
    }
  }, [prePopulatedFormData])

  // Update date state variables when form values change
  useEffect(() => {
    const registrationDeadlineStr = watch('registration_deadline')
    const seasonStartDateStr = watch('season_start_date')
    const seasonEndDateStr = watch('season_end_date')

    if (registrationDeadlineStr && registrationDeadlineStr !== '1900-01-01') {
      try {
        const date = parse(registrationDeadlineStr as string, 'yyyy-MM-dd', new Date())
        if (!isNaN(date.getTime())) {
          setRegistrationDeadline(date)
        }
      } catch (e) {
        console.error('Failed to parse registration_deadline:', e)
      }
    } else {
      setRegistrationDeadline(undefined)
    }

    if (seasonStartDateStr && seasonStartDateStr !== '1900-01-01') {
      try {
        const date = parse(seasonStartDateStr as string, 'yyyy-MM-dd', new Date())
        if (!isNaN(date.getTime())) {
          setSeasonStartDate(date)
        }
      } catch (e) {
        console.error('Failed to parse season_start_date:', e)
      }
    } else {
      setSeasonStartDate(undefined)
    }

    if (seasonEndDateStr && seasonEndDateStr !== '1900-01-01') {
      try {
        const date = parse(seasonEndDateStr as string, 'yyyy-MM-dd', new Date())
        if (!isNaN(date.getTime())) {
          setSeasonEndDate(date)
        }
      } catch (e) {
        console.error('Failed to parse season_end_date:', e)
      }
    } else {
      setSeasonEndDate(undefined)
    }
  }, [watch('registration_deadline'), watch('season_start_date'), watch('season_end_date')])

  // When showing new venue form, populate address input with current form value
  useEffect(() => {
    if (showNewVenueForm && newVenueAddressInputRef.current) {
      const currentAddress = watch('venue_address') || ''
      newVenueAddressInputRef.current.value = currentAddress
    }
  }, [showNewVenueForm, watch('venue_address')])

  // Handle venue search input change - update both state and form value
  const handleVenueSearchChange = (input: string) => {
    setVenueSearchInput(input)
    setValue('venue_name', input) // Update form value when user types
  }

  // Handle venue address selection from Mapbox AddressAutofill
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleVenueAddressChange = (featureCollection: any) => {
    const feature = featureCollection?.features?.[0]

    if (feature && feature.geometry && feature.properties) {
      const [lng, lat] = feature.geometry.coordinates
      const address = feature.properties.full_address || feature.properties.place_name

      // Mark venue as not selected since we're using a custom address
      setSelectedVenue(null)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setValue('venue_id', null as any)
      // venue_name is already updated via handleVenueSearchChange as user types
      setValue('venue_address', address)
      setValue('venue_lat', lat)
      setValue('venue_lng', lng)
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  // Handle game occurrences change from GameOccurrencesManager
  const handleGameOccurrencesChange = (occurrences: GameOccurrence[]) => {
    setGameOccurrences(occurrences)
    setValue('game_occurrences', occurrences)
  }

  // Save draft using hook
  // Open save modal (for new submissions)
  const handleOpenSaveModal = () => {
    setShowSaveModal(true)
  }

  // Save as draft from modal
  const handleSaveAsDraft = async (name: string) => {
    setDraftError(null)

    try {
      const data = collectData()
      await saveDraftOrTemplate(data, name, 'draft', isEditingDraft ? editingDraftId : undefined)
      toast.success('Draft saved successfully')
      setTimeout(() => {
        onClose?.()
      }, 1500)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save draft'
      toast.error(message)
      throw new Error(message)
    }
  }

  // Save as template from modal
  const handleSaveAsTemplateFromModal = async (name: string) => {
    setSubmitError(null)

    try {
      const data = collectData()
      await saveDraftOrTemplate(data, name, 'template')
      toast.success('Template saved successfully')
      setTimeout(() => {
        onSuccess?.()
        onClose?.()
      }, 1500)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create template'
      toast.error(message)
      throw new Error(message)
    }
  }

  // Legacy handleSaveDraft for editing drafts
  const handleSaveDraft = async () => {
    if (isEditingDraft) {
      // For editing drafts, use the old flow
      setDraftError(null)

      try {
        const data = collectData()
        await saveDraftOrTemplate(data, draftName, 'draft', editingDraftId)
        toast.success('Draft saved successfully')
        setTimeout(() => {
          onClose?.()
        }, 1500)
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to save draft'
        toast.error(message)
        setDraftError(message)
        console.error('Draft save error:', error)
      }
    } else {
      // For new submissions, open the modal
      handleOpenSaveModal()
    }
  }

  // Delete draft using hook
  const handleDeleteDraft = async () => {
    if (!organizationId || !editingDraftId) return

    try {
      await deleteDraftOrTemplate(editingDraftId, 'draft')
      onClose?.()
    } catch (error) {
      console.error('Failed to delete draft:', error)
    }
  }

  // Update template using hook
  const handleUpdateTemplate = async () => {
    if (!organizationId || !editingTemplateId) return

    try {
      const data = collectData()
      await saveDraftOrTemplate(data, draftName, 'template', editingTemplateId)

      toast.success('Template updated successfully')
      setTimeout(() => {
        onSuccess?.()
        onClose?.()
      }, 1500)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update template'
      setSubmitError(message)
      toast.error(message)
      console.error('Update template error:', error)
    }
  }

  // Handle save as template
  const handleSaveAsTemplate = () => {
    const formData = collectData()
    onSaveAsTemplate?.(formData)
  }

  // Handle form submission
  const onSubmit = async (data: AddLeagueFormData) => {
    setSubmitError(null)

    try {
      // If creating a template, call onSaveAsTemplate instead
      if (isCreatingTemplate) {
        onSaveAsTemplate?.(data)
        return
      }

      const token = await getToken()

      if (!token || !userId) {
        throw new Error('Authentication required. Please sign in.')
      }

      // Format the payload - remove org_id from body but keep organization_name
      const { org_id, ...payload } = data

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
        let errorMessage = 'Failed to create league'
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
        } catch {
          // If JSON parsing fails, try to get plain text
          const text = await response.text()
          errorMessage = text || errorMessage
        }
        throw new Error(errorMessage)
      }

      // Delete draft after successful submission
      await handleDeleteDraft()

      // Refresh leagues and drafts lists after submission
      if (refetchLeagues) {
        await refetchLeagues()
      }
      if (refetchDrafts) {
        await refetchDrafts()
      }

      setSuccess(true)
      toast.success('League submitted successfully! It will be reviewed by an admin.')
      setTimeout(() => {
        onLeagueSubmitted?.()
        onSuccess?.()
        onClose?.()
      }, 1500)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to submit league'
      setSubmitError(message)
      toast.error(message)
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

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    // For template creation, bypass validation and get current values
    if (isCreatingTemplate) {
      const data = getValues()
      onSubmit(data)
    } else {
      // For other modes, use normal validation flow
      handleSubmit(onSubmit)(e)
    }
  }

  // When creating a template, don't show any validation errors
  const displayErrors = isCreatingTemplate ? {} : errors

  return (
    <form onSubmit={handleFormSubmit} onClick={(e) => e.stopPropagation()} className="space-y-6 w-full">
      {/* Show rejection reason if league was rejected */}
      {isViewingLeague && leagueStatus === 'rejected' && leagueRejectionReason && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mt-4">
          <p className="text-red-800 font-semibold mb-2">Rejection Reason:</p>
          <p className="text-red-900">{leagueRejectionReason}</p>
        </div>
      )}

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

      {/* Section: Sport & League Info */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Sport & League Information</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Sport Autocomplete */}
          <div>
            <SportAutocomplete
              selectedSport={selectedSport}
              sportSearchInput={sportSearchInput}
              onSportChange={(sport) => {
                setSelectedSport(sport)
                if (sport) {
                  setValue('sport_id', sport.id)
                  setValue('sport_name', sport.name)
                } else {
                  setValue('sport_id', undefined)
                  setValue('sport_name', '')
                }
              }}
              onSportSearchChange={(input) => {
                setSportSearchInput(input)
                setValue('sport_name', input)
              }}
              sportError={displayErrors.sport_name?.message}
              isViewingLeague={isViewingLeague}
            />
          </div>

          {/* League Name */}
          <div className="space-y-2">
            <Label htmlFor="league_name">League Name *</Label>
            <Input
              {...register('league_name')}
              id="league_name"
              type="text"
              placeholder="e.g., Summer Basketball League"
              disabled={isViewingLeague}
              aria-invalid={displayErrors.league_name ? 'true' : 'false'}
            />
            {displayErrors.league_name && (
              <p className="text-sm text-red-600">{displayErrors.league_name.message}</p>
            )}
          </div>

          {/* Division/Skill Level */}
          <div className="space-y-2">
            <Label htmlFor="division">Skill Level *</Label>
            <input
              {...register('division')}
              id="division"
              type="text"
              placeholder="e.g., Beginner, Intermediate, Expert"
              disabled={isViewingLeague}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white disabled:bg-gray-100 disabled:text-gray-500"
              aria-invalid={displayErrors.division ? 'true' : 'false'}
            />
            {displayErrors.division && (
              <p className="text-sm text-red-600">{displayErrors.division.message}</p>
            )}
          </div>

          {/* Gender */}
          <div className="space-y-2">
            <Label htmlFor="gender">Gender *</Label>
            <select
              {...register('gender')}
              id="gender"
              disabled={isViewingLeague}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white disabled:bg-gray-100 disabled:text-gray-500"
              aria-invalid={displayErrors.gender ? 'true' : 'false'}
            >
              <option value="">Select a gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="co-ed">Co-ed</option>
            </select>
            {displayErrors.gender && (
              <p className="text-sm text-red-600">{displayErrors.gender.message}</p>
            )}
          </div>
        </div>

        {/* Hidden sport_id field */}
        <input type="hidden" {...register('sport_id', { valueAsNumber: true })} />
      </div>

      {/* Section: Dates */}
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
              disabled={isViewingLeague}
            />
            {displayErrors.registration_deadline && (
              <p className="text-sm text-red-600">{displayErrors.registration_deadline.message}</p>
            )}
          </div>

          {/* Registration URL */}
          <div className="space-y-2">
            <Label htmlFor="registration_url">Registration URL *</Label>
            <Input
              {...register('registration_url')}
              id="registration_url"
              type="text"
              placeholder="https://example.com/register"
              disabled={isViewingLeague}
              aria-invalid={displayErrors.registration_url ? 'true' : 'false'}
            />
            {displayErrors.registration_url && (
              <p className="text-sm text-red-600">{displayErrors.registration_url.message}</p>
            )}
          </div>

          {/* Season Start Date */}
          <div className="space-y-2">
            <Label htmlFor="season_start_date">Season Start Date *</Label>
            <DatePicker
              date={seasonStartDate}
              onDateChange={handleSeasonStartDateChange}
              placeholder="Select start date"
              disabled={isViewingLeague}
            />
            {displayErrors.season_start_date && (
              <p className="text-sm text-red-600">{displayErrors.season_start_date.message}</p>
            )}
          </div>

          {/* Season End Date */}
          <div className="space-y-2">
            <Label htmlFor="season_end_date">Season End Date (Optional)</Label>
            <DatePicker
              date={seasonEndDate}
              onDateChange={handleSeasonEndDateChange}
              placeholder="Select end date"
              disabled={isViewingLeague}
            />
            {displayErrors.season_end_date && (
              <p className="text-sm text-red-600">{displayErrors.season_end_date.message}</p>
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
              disabled={isViewingLeague}
              aria-invalid={displayErrors.duration ? 'true' : 'false'}
            />
            {displayErrors.duration && (
              <p className="text-sm text-red-600">{displayErrors.duration.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Section: Venue */}
      <div className="border-t pt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Venue</h3>
          {!showNewVenueForm && (
            <button
              type="button"
              onClick={() => setShowNewVenueForm(true)}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
            >
              + Add New Venue
            </button>
          )}
        </div>

        {!showNewVenueForm ? (
          // Show only venue autocomplete
          <VenueAutocomplete
            selectedVenue={selectedVenue}
            venueSearchInput={venueSearchInput}
            onVenueChange={(venue) => {
              setSelectedVenue(venue)
              if (venue) {
                setValue('venue_id', venue.id)
                setValue('venue_name', venue.name)
                setValue('venue_address', venue.address)
                setValue('venue_lat', venue.lat)
                setValue('venue_lng', venue.lng)
              } else {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                setValue('venue_id', null as any)
                setValue('venue_name', '')
                setValue('venue_address', '')
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                setValue('venue_lat', null as any)
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                setValue('venue_lng', null as any)
              }
            }}
            onVenueSearchChange={handleVenueSearchChange}
            onVenueAddressChange={handleVenueAddressChange}
            onMapboxDropdownStateChange={setIsMapboxDropdownOpen}
            venueError={displayErrors.venue_name?.message}
            isViewingLeague={isViewingLeague}
            customVenueAddress={watch('venue_address') || undefined}
            hideAddressInput={true}
          />
        ) : (
          // Show new venue flow
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="new_venue_address" className="text-sm font-medium text-gray-700">
                Search Location
              </label>
              <p className="text-sm text-gray-600">Find address or enter custom location</p>
              <MapboxAddressInput
                ref={newVenueAddressInputRef}
                id="new_venue_address"
                placeholder="Search address..."
                onRetrieve={handleVenueAddressChange}
                onMapboxDropdownStateChange={setIsMapboxDropdownOpen}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="venue_name_new" className="text-sm font-medium text-gray-700">
                Venue Name (Optional)
              </label>
              <input
                type="text"
                id="venue_name_new"
                placeholder="e.g., Central Sports Complex"
                disabled={isViewingLeague}
                aria-invalid={displayErrors.venue_name ? 'true' : 'false'}
                value={watch('venue_name') || ''}
                onChange={(e) => setValue('venue_name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
              {displayErrors.venue_name && (
                <p className="text-sm text-red-600">{displayErrors.venue_name.message}</p>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowNewVenueForm(false)}
              className="text-sm text-gray-600 hover:text-gray-700 font-medium"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Hidden venue fields */}
        <input type="hidden" {...register('venue_id', { valueAsNumber: true })} />
        <input type="hidden" {...register('venue_name')} />
        <input type="hidden" {...register('venue_address')} />
        <input type="hidden" {...register('venue_lat', { valueAsNumber: true })} />
        <input type="hidden" {...register('venue_lng', { valueAsNumber: true })} />
      </div>

      {/* Section: Game Schedule */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Game Schedule</h3>
        <GameOccurrencesManager
          gameOccurrences={gameOccurrences}
          onGameOccurrencesChange={handleGameOccurrencesChange}
          isViewingLeague={isViewingLeague}
          errors={displayErrors.game_occurrences?.message}
        />
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
              disabled={isViewingLeague}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white disabled:bg-gray-100 disabled:text-gray-500"
              aria-invalid={displayErrors.pricing_strategy ? 'true' : 'false'}
            >
              <option value="per_person">Per Person</option>
              <option value="per_team">Per Team</option>
            </select>
            {displayErrors.pricing_strategy && (
              <p className="text-sm text-red-600">{displayErrors.pricing_strategy.message}</p>
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
              min={isCreatingTemplate ? "0" : "0.01"}
              placeholder="0.00"
              disabled={isViewingLeague}
              aria-invalid={displayErrors.pricing_amount ? 'true' : 'false'}
              onWheel={(e) => e.currentTarget.blur()}
            />
            {displayErrors.pricing_amount && (
              <p className="text-sm text-red-600">{displayErrors.pricing_amount.message}</p>
            )}
          </div>
        </div>

        {/* Per Game Fee */}
        <div className="space-y-2 mb-6">
          <Label htmlFor="per_game_fee">Per Game Fee (Optional)</Label>
          <p className="text-sm text-gray-600">Additional fee per game for referee, equipment, or facility costs</p>
          <Input
            {...register('per_game_fee')}
            id="per_game_fee"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            disabled={isViewingLeague}
            aria-invalid={displayErrors.per_game_fee ? 'true' : 'false'}
          />
          {displayErrors.per_game_fee && (
            <p className="text-sm text-red-600">{displayErrors.per_game_fee.message}</p>
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
            disabled={isViewingLeague}
            aria-invalid={displayErrors.minimum_team_players ? 'true' : 'false'}
          />
          {displayErrors.minimum_team_players && (
            <p className="text-sm text-red-600">{displayErrors.minimum_team_players.message}</p>
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
            disabled={isViewingLeague}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-400 disabled:bg-gray-100 disabled:text-gray-500"
            rows={3}
            aria-invalid={displayErrors.season_details ? 'true' : 'false'}
          />
          {displayErrors.season_details && (
            <p className="text-sm text-red-600">{displayErrors.season_details.message}</p>
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

      {/* Submit Error Message */}
      {submitError && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">{submitError}</p>
        </div>
      )}

      <LeagueFormButtons
        mode={mode}
        isSubmitting={isSubmitting}
        isSavingDraft={isDraftOperationLoading}
        draftName={draftName}
        onDraftNameChange={setDraftName}
        onSaveDraft={handleSaveDraft}
        onSubmit={handleSubmit(onSubmit)}
        onUpdateTemplate={handleUpdateTemplate}
        onClose={onClose}
      />

      {/* Save League Modal for new submissions */}
      <SaveLeagueModal
        open={showSaveModal}
        onOpenChange={setShowSaveModal}
        onSaveAsDraft={handleSaveAsDraft}
        onSaveAsTemplate={handleSaveAsTemplateFromModal}
      />
    </form>
  )
}
