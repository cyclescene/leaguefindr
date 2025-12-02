import { useEffect, useRef } from 'react'
import { Analytics } from '@/lib/analytics'

// Throttle function to limit event frequency
function throttle(func: Function, delay: number) {
  let timeoutId: NodeJS.Timeout | null = null
  let lastExecTime = 0
  
  return function (...args: any[]) {
    const currentTime = Date.now()
    
    if (currentTime - lastExecTime > delay) {
      func.apply(null, args)
      lastExecTime = currentTime
    } else {
      if (timeoutId) clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        func.apply(null, args)
        lastExecTime = Date.now()
      }, delay - (currentTime - lastExecTime))
    }
  }
}

export function useScrollTracking(elementRef: React.RefObject<HTMLElement>, eventName: string, throttleMs: number = 1000) {
  const hasTrackedRef = useRef(false)

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    const throttledTracker = throttle(() => {
      if (!hasTrackedRef.current) {
        Analytics.custom(eventName)
        hasTrackedRef.current = true
      }
    }, throttleMs)

    const handleScroll = () => {
      throttledTracker()
    }

    element.addEventListener('scroll', handleScroll, { passive: true })
    
    return () => {
      element.removeEventListener('scroll', handleScroll)
    }
  }, [elementRef, eventName, throttleMs])

  // Reset tracking when component unmounts or ref changes
  useEffect(() => {
    hasTrackedRef.current = false
  }, [elementRef.current])
}

// Hook for tracking section visibility (when scrolled into view)
export function useSectionTracking(elementRef: React.RefObject<HTMLElement>, sectionName: string) {
  const hasTrackedRef = useRef(false)

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasTrackedRef.current) {
            Analytics.scrolledToSection(sectionName)
            hasTrackedRef.current = true
          }
        })
      },
      {
        threshold: 0.3, // Trigger when 30% of section is visible
        rootMargin: '-50px 0px' // Offset to ensure user has actually scrolled to see it
      }
    )

    observer.observe(element)

    return () => {
      observer.unobserve(element)
    }
  }, [elementRef, sectionName])

  // Reset tracking when component unmounts or ref changes
  useEffect(() => {
    hasTrackedRef.current = false
  }, [elementRef.current])
} 