"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface DatePickerProps {
  date?: Date
  onDateChange: (date: Date | undefined) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function DatePicker({
  date,
  onDateChange,
  placeholder = "Pick a date",
  disabled = false,
  className,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "MMM d, yyyy") : placeholder}
        </Button>
      </DialogTrigger>
      <DialogContent className="w-auto p-0">
        <DialogTitle className="sr-only">Select a date</DialogTitle>
        <Calendar
          mode="single"
          selected={date}
          onSelect={(selectedDate) => {
            onDateChange(selectedDate)
            setOpen(false)
          }}
          disabled={disabled}
          initialFocus
        />
      </DialogContent>
    </Dialog>
  )
}
