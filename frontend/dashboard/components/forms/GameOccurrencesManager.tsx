'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { X, Plus } from 'lucide-react'
import { type GameOccurrence } from '@/lib/schemas'

/**
 * Convert time from 24-hour format (HH:MM) to 12-hour format with AM/PM
 */
function convertTo12HourFormat(time24: string): string {
  try {
    const [hours, minutes] = time24.split(':').map(Number)
    const period = hours >= 12 ? 'PM' : 'AM'
    const hours12 = hours % 12 || 12
    return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`
  } catch {
    return time24
  }
}

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
    <div className="">
      {/* Add Game Occurrence */}
      <div className="mb-6">
        <p className="text-sm text-gray-600 mb-4">Add all weekdays and timeframes when games could occur</p>
        <div className="flex gap-3 items-end w-full">
          {/* Day */}
          <div className="space-y-2 grow w-28 ">
            <Label htmlFor="new_game_day">Day</Label>
            <select
              id="new_game_day"
              value={newGameDay}
              onChange={(e) => setNewGameDay(e.target.value)}
              disabled={isViewingLeague}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white disabled:bg-gray-100 disabled:text-gray-500"
            >
              <option value="">Select a day</option>
              <option value="Monday">Monday</option>
              <option value="Tuesday">Tuesday</option>
              <option value="Wednesday">Wednesday</option>
              <option value="Thursday">Thursday</option>
              <option value="Friday">Friday</option>
              <option value="Saturday">Saturday</option>
              <option value="Sunday">Sunday</option>
            </select>
          </div>

          {/* Start Time */}
          <div className="space-y-2 grow w-24">
            <Label htmlFor="new_game_start_time">Earliest Start Time</Label>
            <Input
              id="new_game_start_time"
              type="time"
              value={newGameStartTime}
              onChange={(e) => setNewGameStartTime(e.target.value)}
              disabled={isViewingLeague}
            />
          </div>

          {/* End Time */}
          <div className="space-y-2 grow w-24">
            <Label htmlFor="new_game_end_time">Latest End Time</Label>
            <Input
              id="new_game_end_time"
              type="time"
              value={newGameEndTime}
              onChange={(e) => setNewGameEndTime(e.target.value)}
              disabled={isViewingLeague}
            />
          </div>

          {!isViewingLeague && (
            <Button type="button" onClick={handleAddGameOccurrence} className="h-10 shrink-0">
              <Plus size={16} className="mr-2" />
              Add to Game Schedule
            </Button>
          )}
        </div>
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
                {occurrence.day} · {convertTo12HourFormat(occurrence.startTime)} - {convertTo12HourFormat(occurrence.endTime)}
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
