'use client'

import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { addLeagueSchema, type AddLeagueFormData, type GameOccurrence } from '@/lib/schemas'
import { useAuth } from '@clerk/nextjs'
import { useState, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { useLeagueFormContext } from '@/context/LeagueFormContext'
import { format, parse } from 'date-fns'
import { LeagueFormButtons } from './LeagueFormButtons'
import { SaveLeagueModal } from '@/components/leagues/SaveLeagueModal'
import { useLeagueFormData } from '@/lib/hooks/useLeagueFormData'
import { useLeagueFormPopulation } from '@/lib/hooks/useLeagueFormPopulation'
import { useLeagueDraftOperations } from '@/lib/hooks/useLeagueDraftOperations'
import { SportAndLeagueInformationSection } from './sections/SportAndLeagueInformationSection'
import { SeasonDatesSection } from './sections/SeasonDatesSection'
import { VenueSection } from './sections/VenueSection'
import { GameScheduleSection } from './sections/GameScheduleSection'
import { PricingSection } from './sections/PricingSection'
import { AdditionalInformationSection } from './sections/AdditionalInformationSection'
import dynamic from 'next/dynamic'

// Dynamically import AddressAutofill to avoid SSR issues
// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
const AddressAutofill = dynamic(
  () => import('@mapbox/search-js-react').then(mod => mod.AddressAutofill),
  { ssr: false }
) as unknown

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

  const methods = useForm<AddLeagueFormData>({
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

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    reset,
    getValues,
  } = methods

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

  return (
    <FormProvider {...methods}>
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

        {/* Sport & League Information Section */}
        <SportAndLeagueInformationSection
          selectedSport={selectedSport}
          sportSearchInput={sportSearchInput}
          onSportChange={setSelectedSport}
          onSportSearchChange={setSportSearchInput}
          isViewingLeague={isViewingLeague}
        />

        {/* Season Dates Section */}
        <SeasonDatesSection
          registrationDeadline={registrationDeadline}
          seasonStartDate={seasonStartDate}
          seasonEndDate={seasonEndDate}
          onRegistrationDeadlineChange={handleRegistrationDeadlineChange}
          onSeasonStartDateChange={handleSeasonStartDateChange}
          onSeasonEndDateChange={handleSeasonEndDateChange}
          isViewingLeague={isViewingLeague}
        />

        {/* Venue Section */}
        <VenueSection
          selectedVenue={selectedVenue}
          venueSearchInput={venueSearchInput}
          showNewVenueForm={showNewVenueForm}
          onVenueChange={setSelectedVenue}
          onVenueSearchChange={handleVenueSearchChange}
          onVenueAddressChange={handleVenueAddressChange}
          onShowNewVenueFormChange={setShowNewVenueForm}
          onMapboxDropdownStateChange={setIsMapboxDropdownOpen}
          isViewingLeague={isViewingLeague}
        />

        {/* Game Schedule Section */}
        <GameScheduleSection
          gameOccurrences={gameOccurrences}
          onGameOccurrencesChange={handleGameOccurrencesChange}
          isViewingLeague={isViewingLeague}
        />

        {/* Pricing Section */}
        <PricingSection isViewingLeague={isViewingLeague} />

        {/* Additional Information Section */}
        <AdditionalInformationSection isViewingLeague={isViewingLeague} />

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
    </FormProvider>
  )
}
