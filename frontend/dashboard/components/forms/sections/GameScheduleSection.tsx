'use client'

import { useFormContext } from 'react-hook-form'
import { GameOccurrencesManager } from '../GameOccurrencesManager'
import { type AddLeagueFormData, type GameOccurrence } from '@/lib/schemas'

interface GameScheduleSectionProps {
  gameOccurrences: GameOccurrence[]
  onGameOccurrencesChange: (occurrences: GameOccurrence[]) => void
  isViewingLeague?: boolean
}

export function GameScheduleSection({
  gameOccurrences,
  onGameOccurrencesChange,
  isViewingLeague = false,
}: GameScheduleSectionProps) {
  const {
    formState: { errors },
  } = useFormContext<AddLeagueFormData>()

  const displayErrors = errors

  return (
    <div className="border-t pt-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-1">Game Schedule</h3>
      <p className="text-sm text-gray-600 mb-4">Create your league schedule</p>
      <GameOccurrencesManager
        gameOccurrences={gameOccurrences}
        onGameOccurrencesChange={onGameOccurrencesChange}
        isViewingLeague={isViewingLeague}
        errors={displayErrors.game_occurrences?.message}
      />
    </div>
  )
}
