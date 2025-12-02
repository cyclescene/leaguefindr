import { Container } from '@/components/ui'
import { Footer } from '@/components/layout'

export default function TermsPage() {
  return (
    <main className="flex-1">
      <section className="py-16 lg:py-24 bg-off-white">
        <Container>
          <div className="max-w-4xl">
            <h1 className="mb-4">Terms of Use</h1>
            <p className="text-gray-4 font-montserrat text-body-2 mb-8">
              Effective Date: June 20, 2025
            </p>
            
            <div className="prose prose-lg max-w-none space-y-8">
              <div>
                <p className="text-gray-5 font-montserrat text-body-1 leading-relaxed">
                  Welcome to LeagueFindr, a platform operated by Recess Sports LLC ("we," "us," or "our"). 
                  By accessing or using our website and services, you agree to these Terms of Use.
                </p>
              </div>

              <div>
                <h2 className="font-dirk font-bold text-xl text-dark-green mb-4">1. Acceptance of Terms</h2>
                <p className="text-gray-5 font-montserrat text-body-1 leading-relaxed">
                  By using LeagueFindr, you agree to comply with and be bound by these Terms.
                </p>
              </div>

              <div>
                <h2 className="font-dirk font-bold text-xl text-dark-green mb-4">2. Eligibility</h2>
                <p className="text-gray-5 font-montserrat text-body-1 leading-relaxed">
                  You must be at least 13 years old to use our services. Users under 18 must have permission from a parent or guardian.
                </p>
              </div>

              <div>
                <h2 className="font-dirk font-bold text-xl text-dark-green mb-4">3. Use of Services</h2>
                <p className="text-gray-5 font-montserrat text-body-1 leading-relaxed">
                  You agree not to misuse the platform or engage in any illegal, abusive, or harmful behavior.
                </p>
              </div>

              <div>
                <h2 className="font-dirk font-bold text-xl text-dark-green mb-4">4. User Content and Ownership</h2>
                <p className="text-gray-5 font-montserrat text-body-1 leading-relaxed">
                  Users retain rights to their own submitted content but grant LeagueFindr a non-exclusive license to use it within the platform.
                </p>
              </div>

              <div>
                <h2 className="font-dirk font-bold text-xl text-dark-green mb-4">5. Intellectual Property</h2>
                <p className="text-gray-5 font-montserrat text-body-1 leading-relaxed">
                  All platform content, branding, and software are the intellectual property of Recess Sports LLC and may not be reused without permission.
                </p>
              </div>

              <div>
                <h2 className="font-dirk font-bold text-xl text-dark-green mb-4">6. Limitation of Liability</h2>
                <p className="text-gray-5 font-montserrat text-body-1 leading-relaxed">
                  We are not liable for any damages arising from the use or inability to use the platform.
                </p>
              </div>

              <div>
                <h2 className="font-dirk font-bold text-xl text-dark-green mb-4">7. Modifications</h2>
                <p className="text-gray-5 font-montserrat text-body-1 leading-relaxed">
                  We may update these Terms at any time. Continued use constitutes acceptance of the updated Terms.
                </p>
              </div>

              <div>
                <h2 className="font-dirk font-bold text-xl text-dark-green mb-4">8. Governing Law</h2>
                <p className="text-gray-5 font-montserrat text-body-1 leading-relaxed">
                  These Terms are governed by the laws of the State of California.
                </p>
              </div>

              <div>
                <h2 className="font-dirk font-bold text-xl text-dark-green mb-4">9. Contact Us</h2>
                <p className="text-gray-5 font-montserrat text-body-1 leading-relaxed">
                  For questions about these Terms, please contact:{' '}
                  <a href="mailto:info@leaguefindr.com" className="text-dark-green hover:text-light-green underline">
                    info@leaguefindr.com
                  </a>
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