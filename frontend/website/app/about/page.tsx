import Image from 'next/image'
import { Container, Section, LocationBanner } from '@/components/ui'
import { Footer } from '@/components/layout'

export const dynamic = 'force-dynamic'

export default function AboutPage() {
  return (
    <main className="flex-1 overflow-x-hidden">
      <LocationBanner />
      {/* Hero Section */}
      <Section background="off-white" padding="xl">
        <Container>
          <div className="text-center mb-16 px-4 py-8">
            <h1 className="mb-8 leading-tight text-3xl sm:text-4xl lg:text-5xl">
              About LeagueFindr
            </h1>
            <h3 className="max-w-3xl mx-auto leading-relaxed">
              At LeagueFindr, we believe that playing sports should be simple and accessible for everyone. Whether you're a parent searching for a local youth league, a player eager to compete, or a manager organizing your team, our platform is designed to make the entire process seamless.
            </h3>
          </div>
        </Container>
      </Section>

      {/* Banner Section */}
      <section className="bg-dark-green py-16 md:py-20">
        <Container>
          <div className="text-center">
            <h2 className="text-light-green">Built by rec players, for rec players.</h2>
          </div>
        </Container>
      </section>

      {/* What We Offer Section */}
      <Section background="white" padding="xl">
        <Container>
          <div className="relative overflow-hidden">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              
              {/* Image */}
              <div className="order-2 lg:order-1 relative">
                <div className="relative rounded-2xl overflow-hidden shadow-2xl h-[400px] md:h-[500px] lg:h-[650px] w-full">
                  <Image
                    src="/images/about-soccer-team.jpg"
                    alt="Soccer team in blue jerseys huddled together on field"
                    width={800}
                    height={600}
                    className="w-full h-full object-cover"
                    priority
                  />
                </div>
              </div>

              {/* Content */}
              <div className="order-1 lg:order-2">
                <h2 className="mb-12">What We Offer</h2>
                
                <div className="space-y-10">
                  
                  {/* Community & Social Benefits */}
                  <div>
                    <h4 className="mb-4 text-dark-green">Community & Social Benefits</h4>
                    <h5 className="mb-3 text-gray-5">Meet new people. Build real connections.</h5>
                    <p className="text-gray-5 font-montserrat leading-relaxed">
                      LeagueFindr helps you find more than just a game — it helps you find your crew. Join coed, Men's 
                      or women's leagues in LA where post-game hangouts, team spirit, and good vibes come standard.
                    </p>
                  </div>

                  {/* Fitness & Wellness */}
                  <div>
                    <h4 className="mb-4 text-dark-green">Fitness & Wellness</h4>
                    <h5 className="mb-3 text-gray-5">Get active without hitting the gym.</h5>
                    <p className="text-gray-5 font-montserrat leading-relaxed">
                      Whether you're lacing up for cardio or just want to stay moving, LeagueFindr makes fitness fun. 
                      Playing in a league keeps you accountable, energized, and excited to stay in shape — no treadmill 
                      required.
                    </p>
                  </div>

                  {/* Competition & Fun */}
                  <div>
                    <h4 className="mb-4 text-dark-green">Competition & Fun</h4>
                    <h5 className="mb-3 text-gray-5">Play to win. Or just play to play.</h5>
                    <p className="text-gray-5 font-montserrat leading-relaxed">
                      Whether you're looking for a serious championship run or a casual weekly match, LeagueFindr 
                      connects you with leagues that match your style. Show up, PLAY, and enjoy the game your way.
                    </p>
                  </div>

                </div>
              </div>
            </div>
          </div>
        </Container>
      </Section>

      {/* Mission Statement Section */}
      <Section background="gray-light" padding="xl">
        <Container className="text-center">
          <div className="max-w-4xl mx-auto">
            <h2 className="mb-8">Our Mission</h2>
            <h3 className="mb-8 text-gray-5">
              Making sports accessible, social, and fun for everyone
            </h3>
            <p className="text-lg text-gray-5 font-montserrat leading-relaxed mb-8">
              Our mission is to remove the frustration from discovering, exploring, and registering for sports leagues. By offering intuitive search tools, comprehensive league information, and direct registration links, we make it easier than ever to get in the game.
            </p>
            <div className="bg-off-white p-8 rounded-xl shadow-lg">
              <h5 className="mb-4 text-dark-green">Ready to Find Your League?</h5>
              <p className="text-gray-5 font-montserrat mb-6">
                Join thousands of players who've discovered their perfect match through LeagueFindr.
              </p>
              <a href="/find-a-league" className="btn-primary inline-block">
                Find a League
              </a>
            </div>
          </div>
        </Container>
      </Section>

      <Footer />
    </main>
  )
} 