'use client'

import { Container } from '@/components/ui'
import { Footer } from '@/components/layout'

export default function CookiesPage() {
  const openKlaroManager = () => {
    // Open Klaro consent manager
    if (typeof window !== 'undefined' && (window as any).klaro) {
      (window as any).klaro.show()
    }
  }

  return (
    <main className="flex-1">
      <section className="py-16 lg:py-24 bg-off-white">
        <Container>
          <div className="max-w-4xl">
            <h1 className="mb-8">Cookie Settings</h1>
            <div className="space-y-8">
              <div className="prose prose-lg max-w-none">
                <p className="text-gray-5 font-montserrat text-body-1 leading-relaxed">
                  Manage your cookie preferences using our cookie consent manager. 
                  We use cookies to enhance your browsing experience, serve personalized content, and analyze our traffic.
                </p>
              </div>

              {/* Cookie Information */}
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <h3 className="font-dirk font-bold text-lg text-gray-900 mb-4">Cookie Categories</h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Essential Cookies</h4>
                    <p className="text-sm text-gray-600">
                      These cookies are necessary for the website to function and cannot be switched off.
                      They are usually only set in response to actions made by you such as setting your privacy preferences.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Analytics Cookies</h4>
                    <p className="text-sm text-gray-600">
                      These cookies help us understand how visitors interact with our website by collecting and reporting information anonymously.
                      This helps us improve the user experience.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Marketing Cookies</h4>
                    <p className="text-sm text-gray-600">
                      These cookies are used to track visitors across websites and display personalized advertisements.
                      They may be set by our advertising partners through our site.
                    </p>
                  </div>
                </div>
              </div>

              {/* Manage Preferences */}
              <div className="bg-dark-green rounded-xl p-6 text-white">
                <h3 className="font-dirk font-bold text-lg mb-4">Manage Your Cookie Preferences</h3>
                <p className="mb-6">
                  Click the button below to open our cookie preference manager where you can enable or disable different types of cookies.
                </p>
                <button
                  onClick={openKlaroManager}
                  className="px-6 py-3 bg-light-green text-dark-green font-semibold rounded-lg hover:bg-light-green/90 transition-colors"
                >
                  Open Cookie Settings
                </button>
              </div>

              <div className="mt-8 pt-8 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  For more information about our privacy practices, please read our{' '}
                  <a href="/privacy" className="text-dark-green hover:text-light-green underline">
                    Privacy Policy
                  </a>.
                  If you have questions about cookies, contact us at{' '}
                  <a href="mailto:info@leaguefindr.com" className="text-dark-green hover:text-light-green underline">
                    info@leaguefindr.com
                  </a>.
                </p>
              </div>
            </div>
          </div>
        </Container>
      </section>
      <Footer />
    </main>
  )
} 