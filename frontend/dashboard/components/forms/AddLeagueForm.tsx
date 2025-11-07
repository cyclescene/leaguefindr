'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { addLeagueSchema, type AddLeagueFormData, type GameOccurrence } from '@/lib/schemas'
import { useAuth } from '@clerk/nextjs'
import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DatePicker } from '@/components/ui/date-picker'
import { X, Plus } from 'lucide-react'
import { format, parse } from 'date-fns'
import { Button } from '@/components/ui/button'
import { useSportSearch } from '@/hooks/useSportSearch'
import { SportAutocompleteDropdown } from './SportAutocompleteDropdown'

interface Sport {
  id: number
  name: string
  status: 'approved' | 'pending' | 'rejected'
  request_count: number
}

interface AddLeagueFormProps {
  onSuccess?: () => void
  onClose?: () => void
  organizationId?: number
}

export function AddLeagueForm({ onSuccess, onClose, organizationId }: AddLeagueFormProps) {
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
      league_name: '',
      division: '' as any,
      age_group: '',
      gender: '',
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

  const pricingStrategy = watch('pricing_strategy')
  const pricingAmount = watch('pricing_amount')
  const minimumPlayers = watch('minimum_team_players')

  // Load draft on mount
  useEffect(() => {
    const loadDraft = async () => {
      if (!organizationId || !getToken) {
        setDraftLoading(false)
        return
      }

      try {
        const token = await getToken()
        if (!token) {
          setDraftLoading(false)
          return
        }

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/v1/drafts/${organizationId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )

        if (response.ok) {
          const draftData = await response.json()
          if (draftData) {
            // Populate form with draft data
            Object.keys(draftData).forEach((key) => {
              const value = draftData[key]
              // Handle date fields
              if (
                (key === 'registration_deadline' ||
                  key === 'season_start_date' ||
                  key === 'season_end_date') &&
                value
              ) {
                try {
                  const parsedDate = parse(value, 'yyyy-MM-dd', new Date())
                  if (key === 'registration_deadline') {
                    setRegistrationDeadline(parsedDate)
                  } else if (key === 'season_start_date') {
                    setSeasonStartDate(parsedDate)
                  } else if (key === 'season_end_date') {
                    setSeasonEndDate(parsedDate)
                  }
                } catch (e) {
                  console.error(`Failed to parse date for ${key}:`, e)
                }
              }
              // Handle game occurrences
              else if (key === 'game_occurrences' && Array.isArray(value)) {
                setGameOccurrences(value)
              }
              // Set all other form values
              else {
                setValue(key as any, value)
              }
            })
            setDraftSaveStatus('Draft loaded')
            setTimeout(() => setDraftSaveStatus(null), 2000)
          }
        }
      } catch (error) {
        console.error('Failed to load draft:', error)
      } finally {
        setDraftLoading(false)
      }
    }

    loadDraft()
  }, [organizationId, getToken, setValue])

  // Debounce sport search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSportName(sportSearchInput)
      setShowSportAutocomplete(sportSearchInput.length >= 1)
    }, 300)

    return () => clearTimeout(timer)
  }, [sportSearchInput])

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
  const filteredSportSuggestions = showSportAutocomplete && debouncedSportName
    ? approvedSports.filter((sport) =>
      sport.name.toLowerCase().includes(debouncedSportName.toLowerCase())
    )
    : []

  const handleSelectSport = (sport: Sport) => {
    setSelectedSport(sport)
    setSportSearchInput(sport.name)
    setValue('sport_id', sport.id)
    setShowSportAutocomplete(false)
  }

  const handleClearSportSelection = () => {
    setSelectedSport(null)
    setSportSearchInput('')
    setValue('sport_id', undefined)
    setDebouncedSportName('')
    setShowSportAutocomplete(false)
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
        league_name: watch('league_name'),
        division: watch('division'),
        age_group: watch('age_group'),
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
        `${process.env.NEXT_PUBLIC_API_URL}/v1/drafts`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            'X-Clerk-User-ID': userId,
          },
          body: JSON.stringify({
            org_id: organizationId,
            data: draftData,
          }),
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save draft')
      }

      setDraftSaveStatus('Draft saved successfully')
      setTimeout(() => setDraftSaveStatus(null), 3000)
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

      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/drafts/${organizationId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
    } catch (error) {
      console.error('Failed to delete draft:', error)
    }
  }

  // Handle form submission
  const onSubmit = async (data: AddLeagueFormData) => {
    setSubmitError(null)

    try {
      const token = await getToken()

      if (!token || !userId) {
        throw new Error('Authentication required. Please sign in.')
      }

      // Format the payload
      const payload = {
        ...data,
        org_id: organizationId || undefined,
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/leagues`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            'X-Clerk-User-ID': userId,
          },
          body: JSON.stringify(payload),
        }
      )

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
      {/* Section: League Info */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">League Information</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Sport Selection with Autocomplete */}
          <div className="space-y-2">
            <Label htmlFor="sport_search">Sport *</Label>
            <div className="relative">
              <div className="relative">
                <Input
                  id="sport_search"
                  placeholder="e.g., Basketball, Football, Tennis"
                  value={sportSearchInput}
                  onChange={(e) => setSportSearchInput(e.target.value)}
                  onFocus={() => sportSearchInput.length >= 1 && setShowSportAutocomplete(true)}
                  maxLength={255}
                  autoComplete="off"
                  aria-invalid={errors.sport_id ? 'true' : 'false'}
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

            {errors.sport_id && (
              <p className="text-sm text-red-600">{errors.sport_id.message}</p>
            )}
          </div>

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

          {/* Age Group */}
          <div className="space-y-2">
            <Label htmlFor="age_group">Age Group *</Label>
            <Input
              {...register('age_group')}
              id="age_group"
              type="text"
              placeholder="e.g., 18+, Adults, Youth (U18)"
              aria-invalid={errors.age_group ? 'true' : 'false'}
            />
            {errors.age_group && (
              <p className="text-sm text-red-600">{errors.age_group.message}</p>
            )}
          </div>

          {/* Gender */}
          // TODO: using an enum here would be better and using a select group
          <div className="space-y-2">
            <Label htmlFor="gender">Gender *</Label>
            <Input
              {...register('gender')}
              id="gender"
              type="text"
              placeholder="e.g., Male, Female, Co-ed"
              aria-invalid={errors.gender ? 'true' : 'false'}
            />
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

        {/* Season Details */}
        <div className="space-y-2 mt-4">
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

      {/* Section: Registration */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Registration</h3>

        <div className="space-y-2 mb-6">
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
