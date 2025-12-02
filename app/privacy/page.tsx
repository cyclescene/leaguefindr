import { Container } from '@/components/ui'
import { Footer } from '@/components/layout'

export default function PrivacyPage() {
  return (
    <main className="flex-1">
      <section className="py-16 lg:py-24 bg-off-white">
        <Container>
          <div className="max-w-4xl">
            <h1 className="mb-4">Privacy Policy</h1>
            <p className="text-gray-4 font-montserrat text-body-2 mb-8">
              Effective Date: June 20, 2025
            </p>
            
            <div className="prose prose-lg max-w-none space-y-8">
              <div>
                <p className="text-gray-5 font-montserrat text-body-1 leading-relaxed">
                  Recess Sports LLC, doing business as "LeagueFindr," values your privacy. This Privacy Policy explains how we collect, use, and protect your personal information when you use our website and services.
                </p>
              </div>

              <div>
                <h2 className="font-dirk font-bold text-xl text-dark-green mb-4">1. Information We Collect</h2>
                <div className="space-y-3">
                  <p className="text-gray-5 font-montserrat text-body-1 leading-relaxed">
                    <strong>Personal Information:</strong> Name, email address, location, and other contact details.
                  </p>
                  <p className="text-gray-5 font-montserrat text-body-1 leading-relaxed">
                    <strong>Device and Usage Data:</strong> IP address, browser type, operating system, and interaction with our website.
                  </p>
                  <p className="text-gray-5 font-montserrat text-body-1 leading-relaxed">
                    <strong>Cookies and Tracking Technologies:</strong> Used to improve functionality and personalize your experience.
                  </p>
                </div>
              </div>

              <div>
                <h2 className="font-dirk font-bold text-xl text-dark-green mb-4">2. How We Use Your Information</h2>
                <ul className="list-disc pl-6 space-y-2">
                  <li className="text-gray-5 font-montserrat text-body-1 leading-relaxed">To provide and maintain our platform</li>
                  <li className="text-gray-5 font-montserrat text-body-1 leading-relaxed">To personalize and improve your experience</li>
                  <li className="text-gray-5 font-montserrat text-body-1 leading-relaxed">To communicate updates, offers, or important notices</li>
                </ul>
              </div>

              <div>
                <h2 className="font-dirk font-bold text-xl text-dark-green mb-4">3. Sharing Your Information</h2>
                <p className="text-gray-5 font-montserrat text-body-1 leading-relaxed">
                  We do not sell your personal information. We may share your information with trusted service providers who support our platform or if legally required.
                </p>
              </div>

              <div>
                <h2 className="font-dirk font-bold text-xl text-dark-green mb-4">4. Cookies and Tracking Technologies</h2>
                <p className="text-gray-5 font-montserrat text-body-1 leading-relaxed mb-4">
                  We use cookies and similar tracking technologies to enhance your experience on LeagueFindr, analyze site usage, and support our marketing efforts.
                </p>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="font-dirk font-bold text-lg text-gray-900 mb-2">What Are Cookies?</h3>
                    <p className="text-gray-5 font-montserrat text-body-1 leading-relaxed">
                      Cookies are small data files stored on your device by your web browser. They help websites remember information about your visit, such as login status, preferences, and activity.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-dirk font-bold text-lg text-gray-900 mb-2">Types of Cookies We Use:</h3>
                    <ul className="list-disc pl-6 space-y-2">
                      <li className="text-gray-5 font-montserrat text-body-1 leading-relaxed">
                        <strong>Essential Cookies</strong> – Required for core functionality like navigation.
                      </li>
                      <li className="text-gray-5 font-montserrat text-body-1 leading-relaxed">
                        <strong>Analytics Cookies</strong> – Help us understand how users interact with the platform (e.g., Google Analytics).
                      </li>
                      <li className="text-gray-5 font-montserrat text-body-1 leading-relaxed">
                        <strong>Marketing Cookies</strong> – May be used to deliver relevant ads and track ad performance.
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-dirk font-bold text-lg text-gray-900 mb-2">Managing Your Cookie Preferences:</h3>
                    <p className="text-gray-5 font-montserrat text-body-1 leading-relaxed">
                      You can manage or disable cookies through your browser settings at any time. Some parts of the site may not function properly without essential cookies. 
                      If applicable, you may also use our{' '}
                      <a href="/cookies" className="text-dark-green hover:text-light-green underline">Cookie Settings</a>{' '}
                      tool to manage your preferences.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-dirk font-bold text-lg text-gray-900 mb-2">Third-Party Cookies:</h3>
                    <p className="text-gray-5 font-montserrat text-body-1 leading-relaxed">
                      Some cookies may be set by third-party services that appear on our site (e.g., embedded maps, videos, or analytics tools). These providers have their own privacy policies.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="font-dirk font-bold text-xl text-dark-green mb-4">5. Data Retention</h2>
                <p className="text-gray-5 font-montserrat text-body-1 leading-relaxed">
                  We retain your data as long as your account is active or as required by law.
                </p>
              </div>

              <div>
                <h2 className="font-dirk font-bold text-xl text-dark-green mb-4">6. Your Rights</h2>
                <p className="text-gray-5 font-montserrat text-body-1 leading-relaxed">
                  You may access, update, or delete your personal information by contacting us at{' '}
                  <a href="mailto:info@leaguefindr.com" className="text-dark-green hover:text-light-green underline">
                    info@leaguefindr.com
                  </a>.
                </p>
              </div>

              <div>
                <h2 className="font-dirk font-bold text-xl text-dark-green mb-4">7. Contact Us</h2>
                <p className="text-gray-5 font-montserrat text-body-1 leading-relaxed">
                  If you have any questions about this Privacy Policy, contact us at{' '}
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