'use client'

import { useEffect } from 'react'
import { initializeAnalytics, Analytics } from '@/lib/analytics'

export default function ClientAnalytics() {
  useEffect(() => {
    // Initialize analytics after component mounts
    initializeAnalytics()
    
    // Track device type
    const isMobile = window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    
    if (isMobile) {
      Analytics.custom('device_view_mobile')
    } else {
      Analytics.custom('device_view_desktop')
    }
  }, [])

  return null
} 