import { ReactNode } from 'react'

interface InfoBlockProps {
  title: string
  description: string
  icon?: ReactNode
  className?: string
}

export function InfoBlock({ title, description, icon, className = '' }: InfoBlockProps) {
  return (
    <div className={`text-center space-y-4 ${className}`}>
      {icon && (
        <div className="flex justify-center mb-6">
          {icon}
        </div>
      )}
      <h5 className="text-dark-green">{title}</h5>
      <p className="text-gray-5 font-montserrat font-normal normal-case leading-relaxed">
        {description}
      </p>
    </div>
  )
} 