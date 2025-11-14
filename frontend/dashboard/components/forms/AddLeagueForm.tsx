'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { addLeagueSchema, type AddLeagueFormData, type GameOccurrence } from '@/lib/schemas'
import { useAuth } from '@clerk/nextjs'
import { useState, useEffect } from 'react'
import { useLeagueFormContext } from '@/context/LeagueFormContext'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DatePicker } from '@/components/ui/date-picker'
import { format, parse } from 'date-fns'
import { GameOccurrencesManager } from './GameOccurrencesManager'
import { LeagueFormButtons } from './LeagueFormButtons'
import { SportAutocomplete } from './SportAutocomplete'
import { VenueAutocomplete } from './VenueAutocomplete'

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
}

export function AddLeagueForm({ onSaveAsTemplate }: AddLeagueFormProps = {}) {
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
    mutateDrafts,
    mutateTemplates,
    mutateLeagues,
  } = useLeagueFormContext()

  // Derive boolean flags from mode
  const isEditingDraft = mode === 'edit-draft'
  const isEditingTemplate = mode === 'edit-template'
  const isViewingLeague = mode === 'view'
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

  // Date state
  const [registrationDeadline, setRegistrationDeadline] = useState<Date | undefined>()
  const [seasonStartDate, setSeasonStartDate] = useState<Date | undefined>()
  const [seasonEndDate, setSeasonEndDate] = useState<Date | undefined>()

  // Draft state
  const [draftLoading, setDraftLoading] = useState(true)
  const [draftSaveStatus, setDraftSaveStatus] = useState<string | null>(null)
  const [draftError, setDraftError] = useState<string | null>(null)
  const [isSavingDraft, setIsSavingDraft] = useState(false)
  const [draftName, setDraftName] = useState('')

  // Sport and venue selection state
  const [selectedSport, setSelectedSport] = useState<Sport | null>(null)
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null)
  const [sportSearchInput, setSportSearchInput] = useState('')
  const [venueSearchInput, setVenueSearchInput] = useState('')

  const pricingStrategy = watch('pricing_strategy')
  const pricingAmount = watch('pricing_amount')
  const minimumPlayers = watch('minimum_team_players')

  // Remove auto-load on mount - users should select drafts from the drafts table
  useEffect(() => {
    setDraftLoading(false)
  }, [])

  // Load pre-populated form data
  useEffect(() => {
    if (prePopulatedFormData) {
      // Populate form fields
      Object.keys(prePopulatedFormData).forEach((key) => {
        const value = prePopulatedFormData[key as keyof AddLeagueFormData]
        if (key === 'registration_deadline' && value) {
          try {
            const parsedDate = parse(value as string, 'yyyy-MM-dd', new Date())
            if (!isNaN(parsedDate.getTime())) {
              setRegistrationDeadline(parsedDate)
              setValue('registration_deadline', value as string)
            }
          } catch (e) {
            console.error('Failed to parse registration_deadline:', value)
          }
        } else if (key === 'season_start_date' && value) {
          try {
            const parsedDate = parse(value as string, 'yyyy-MM-dd', new Date())
            if (!isNaN(parsedDate.getTime())) {
              setSeasonStartDate(parsedDate)
              setValue('season_start_date', value as string)
            }
          } catch (e) {
            console.error('Failed to parse season_start_date:', value)
          }
        } else if (key === 'season_end_date' && value) {
          try {
            const parsedDate = parse(value as string, 'yyyy-MM-dd', new Date())
            if (!isNaN(parsedDate.getTime())) {
              setSeasonEndDate(parsedDate)
              setValue('season_end_date', value as string)
            }
          } catch (e) {
            console.error('Failed to parse season_end_date:', value)
          }
        } else if (key === 'game_occurrences' && Array.isArray(value)) {
          setGameOccurrences(value as GameOccurrence[])
          setValue('game_occurrences', value as GameOccurrence[])
        } else if (key !== 'game_occurrences' && key !== 'registration_deadline' && key !== 'season_start_date' && key !== 'season_end_date') {
          setValue(key as keyof AddLeagueFormData, value as any)
        }
      })

      // Set sport name in state so SportAutocomplete input displays it
      const sportName = prePopulatedFormData.sport_name as string | undefined
      if (sportName) {
        setSportSearchInput(sportName)
      }

      // Set venue name in state so VenueAutocomplete input displays it
      const venueName = prePopulatedFormData.venue_name as string | undefined
      if (venueName) {
        setVenueSearchInput(venueName)
      }
    }
  }, [prePopulatedFormData, setValue, isViewingLeague])

  // Handle venue search input change - update both state and form value
  const handleVenueSearchChange = (input: string) => {
    setVenueSearchInput(input)
    setValue('venue_name', input) // Update form value when user types
  }

  // Handle venue address selection from Mapbox AddressAutofill
  const handleVenueAddressChange = (featureCollection: any) => {
    const feature = featureCollection?.features?.[0]

    if (feature && feature.geometry && feature.properties) {
      const [lng, lat] = feature.geometry.coordinates
      const address = feature.properties.full_address || feature.properties.place_name

      // Mark venue as not selected since we're using a custom address
      setSelectedVenue(null)
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

      // Create or update draft via POST
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
            draft_id: isEditingDraft ? editingDraftId : undefined, // Include draft_id if updating existing draft
            name: draftName || null,
            data: draftData,
          }),
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save draft')
      }

      // Refresh drafts list after creation
      if (mutateDrafts) {
        await mutateDrafts()
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
    if (!organizationId || !editingDraftId) return

    try {
      const token = await getToken()
      if (!token) return

      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/leagues/drafts/org/${organizationId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          draft_id: editingDraftId,
        }),
      })

      // Refresh drafts list after deletion
      if (mutateDrafts) {
        await mutateDrafts()
      }
    } catch (error) {
      console.error('Failed to delete draft:', error)
    }
  }

  // Update template
  const handleUpdateTemplate = async () => {
    if (!organizationId || !editingTemplateId) return

    try {
      const token = await getToken()
      if (!token) return

      // Prepare template data
      const templateData = {
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
        `${process.env.NEXT_PUBLIC_API_URL}/v1/leagues/templates/${editingTemplateId}?org_id=${organizationId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(templateData),
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update template')
      }

      // Refresh templates list after update
      if (mutateTemplates) {
        await mutateTemplates()
      }

      setSuccess(true)
      setTimeout(() => {
        onSuccess?.()
        onClose?.()
      }, 1500)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update template'
      setSubmitError(message)
      console.error('Update template error:', error)
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
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create league')
      }

      // Delete draft after successful submission
      await handleDeleteDraft()

      // Refresh leagues and drafts lists after submission
      if (mutateLeagues) {
        await mutateLeagues()
      }
      if (mutateDrafts) {
        await mutateDrafts()
      }

      setSuccess(true)
      setTimeout(() => {
        onLeagueSubmitted?.()
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
              sportError={errors.sport_name?.message}
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
              disabled={isViewingLeague}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white disabled:bg-gray-100 disabled:text-gray-500"
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
              disabled={isViewingLeague}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white disabled:bg-gray-100 disabled:text-gray-500"
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
              disabled={isViewingLeague}
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
              disabled={isViewingLeague}
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
              disabled={isViewingLeague}
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
              disabled={isViewingLeague}
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
              setValue('venue_id', null as any)
              setValue('venue_name', '')
              setValue('venue_address', '')
              setValue('venue_lat', null as any)
              setValue('venue_lng', null as any)
            }
          }}
          onVenueSearchChange={handleVenueSearchChange}
          onVenueAddressChange={handleVenueAddressChange}
          venueError={errors.venue_name?.message}
          isViewingLeague={isViewingLeague}
          customVenueAddress={watch('venue_address')}
        />

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
          errors={errors.game_occurrences?.message}
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
              disabled={isViewingLeague}
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
            disabled={isViewingLeague}
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
            disabled={isViewingLeague}
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
            disabled={isViewingLeague}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-400 disabled:bg-gray-100 disabled:text-gray-500"
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

      {/* Submit Error Message */}
      {submitError && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">{submitError}</p>
        </div>
      )}

      <LeagueFormButtons
        mode={mode}
        isSubmitting={isSubmitting}
        isSavingDraft={isSavingDraft}
        draftName={draftName}
        onDraftNameChange={setDraftName}
        onSaveDraft={handleSaveDraft}
        onSaveAsTemplate={onSaveAsTemplate ? handleSaveAsTemplate : undefined}
        onSubmit={handleSubmit(onSubmit)}
        onUpdateTemplate={handleUpdateTemplate}
        onClose={onClose}
      />
    </form>
  )
}
