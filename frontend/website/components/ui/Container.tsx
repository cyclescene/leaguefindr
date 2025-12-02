import { cn } from '@/lib/utils'

interface ContainerProps {
  children: React.ReactNode
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
}

export function Container({ 
  children, 
  className,
  size = 'xl'
}: ContainerProps) {
  const sizeClasses = {
    sm: 'max-w-3xl',
    md: 'max-w-5xl', 
    lg: 'max-w-6xl',
    xl: 'max-w-7xl',
    full: 'max-w-none'
  }

  return (
    <div className={cn(
      'mx-auto w-full px-4 sm:px-6 lg:px-8 overflow-x-hidden',
      sizeClasses[size],
      className
    )}>
      {children}
    </div>
  )
} 