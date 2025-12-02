declare module 'klaro' {
  export function render(config: any): void
  export function show(): void
  
  // Add other klaro methods as needed
  export interface KlaroConfig {
    version: number
    elementID: string
    styling?: {
      theme?: string[]
    }
    noAutoLoad?: boolean
    htmlTexts?: boolean
    embedded?: boolean
    groupByPurpose?: boolean
    storageMethod?: string
    cookieName?: string
    cookieExpiresAfterDays?: number
    default?: boolean
    mustConsent?: boolean
    acceptAll?: boolean
    hideDeclineAll?: boolean
    hideLearnMore?: boolean
    noticeAsModal?: boolean
    disablePoweredBy?: boolean
    additionalClass?: string
    translations?: any
    services?: any[]
  }
} 