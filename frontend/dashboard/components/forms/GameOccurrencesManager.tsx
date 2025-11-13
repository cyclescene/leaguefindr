'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { X, Plus } from 'lucide-react'
import { type GameOccurrence } from '@/lib/schemas'

interface GameOccurrencesManagerProps {
  gameOccurrences: GameOccurrence[]
  onGameOccurrencesChange: (occurrences: GameOccurrence[]) => void
  isViewingLeague?: boolean
  errors?: string
}

export function GameOccurrencesManager({
  gameOccurrences,
  onGameOccurrencesChange,
  isViewingLeague = false,
  errors,
}: GameOccurrencesManagerProps) {
  const [newGameDay, setNewGameDay] = useState('')
  const [newGameStartTime, setNewGameStartTime] = useState('19:00')
  const [newGameEndTime, setNewGameEndTime] = useState('21:00')

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
    onGameOccurrencesChange(updated)
    setNewGameDay('')
    setNewGameStartTime('19:00')
    setNewGameEndTime('21:00')
  }

  const handleRemoveGameOccurrence = (index: number) => {
    const updated = gameOccurrences.filter((_, i) => i !== index)
    onGameOccurrencesChange(updated)
  }

  return (
    <div>
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
              disabled={isViewingLeague}
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
              disabled={isViewingLeague}
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
              disabled={isViewingLeague}
            />
          </div>
        </div>

        {!isViewingLeague && (
          <Button type="button" onClick={handleAddGameOccurrence}>
            <Plus size={16} />
            Add Game Occurrence
          </Button>
        )}
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
              {!isViewingLeague && (
                <Button
                  type="button"
                  onClick={() => handleRemoveGameOccurrence(index)}
                  variant="ghost"
                  size="icon"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <X size={18} />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {errors && <p className="text-sm text-red-600 mt-2">{errors}</p>}
    </div>
  )
}
