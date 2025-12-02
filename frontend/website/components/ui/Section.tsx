import { cn } from '@/lib/utils'
import { Container } from './Container'

interface SectionProps {
  children: React.ReactNode
  className?: string
  background?: 'white' | 'off-white' | 'gray-light' | 'dark-green'
  padding?: 'sm' | 'md' | 'lg' | 'xl' | 'none'
  containerSize?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  withContainer?: boolean
}

export function Section({ 
  children, 
  className,
  background = 'white',
  padding = 'lg',
  containerSize = 'xl',
  withContainer = true
}: SectionProps) {
  const backgroundClasses = {
    white: 'bg-white',
    'off-white': 'bg-off-white',
    'gray-light': 'bg-gray-1',
    'dark-green': 'bg-dark-green text-white'
  }

  const paddingClasses = {
    none: '',
    sm: 'py-8 md:py-12',
    md: 'py-12 md:py-16',
    lg: 'py-16 md:py-20',
    xl: 'py-20 md:py-24'
  }

  const content = withContainer ? (
    <Container size={containerSize}>
      {children}
    </Container>
  ) : children

  return (
    <section className={cn(
      backgroundClasses[background],
      paddingClasses[padding],
      className
    )}>
      {content}
    </section>
  )
} 