import { cn } from '@/lib/utils'

interface GridProps {
  children: React.ReactNode
  className?: string
  cols?: 1 | 2 | 3 | 4 | 6
  gap?: 'sm' | 'md' | 'lg' | 'xl'
  responsive?: boolean
}

export function Grid({ 
  children, 
  className,
  cols = 3,
  gap = 'lg',
  responsive = true
}: GridProps) {
  const gapClasses = {
    sm: 'gap-3',
    md: 'gap-4', 
    lg: 'gap-6',
    xl: 'gap-8'
  }

  const colClasses = responsive ? {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
    6: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6'
  } : {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    6: 'grid-cols-6'
  }

  return (
    <div className={cn(
      'grid',
      colClasses[cols],
      gapClasses[gap],
      className
    )}>
      {children}
    </div>
  )
} 