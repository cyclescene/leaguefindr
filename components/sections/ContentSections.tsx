'use client'

import Image from 'next/image'
import { Container, Section, Grid, InfoBlock, FeatureIcon } from '@/components/ui'
import { INFO_BLOCKS } from '@/lib/constants'
import Link from 'next/link'

const iconTypes: Array<'location' | 'filter' | 'share' | 'signup'> = [
  'location', 'filter', 'share', 'signup'
]

export function ContentSections() {
  return (
    <>
      {/* All Leagues Section */}
      <Section background="white" padding="xl">
        <Container>
          <div className="text-center mb-12">
            <h2 className="mb-8">All Leagues. All Sports. One Platform.</h2>
            <h4 className="text-gray-5 max-w-3xl mx-auto">
              LeagueFindr is your complete guide to every recreational and competitive sports league near you. No more bouncing between city websites, Facebook pages, or word-of-mouth — it's all right here.
            </h4>
          </div>

          <Grid cols={4} gap="lg">
            {INFO_BLOCKS.map((block, index) => (
              <InfoBlock
                key={block.title}
                title={block.title}
                description={block.description}
                icon={<FeatureIcon type={iconTypes[index]} size={48} />}
              />
            ))}
          </Grid>
        </Container>
      </Section>

      {/* Built by Athletes Section */}
      <Section background="gray-light" padding="xl">
        <Container>
          <div className="grid lg:grid-cols-2 gap-12">
            <div className="lg:order-2">
              <div className="relative h-96 lg:h-[500px] w-full">
                <Image
                  src="/images/team-celebration.jpg"
                  alt="Team celebrating together after a game"
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="rounded-xl object-cover shadow-lg"
                  quality={85}
                  placeholder="blur"
                  blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAVGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
                />
                <div className="absolute top-4 right-4 bg-light-green text-white p-3 sm:p-4 rounded-xl shadow-lg">
                  <div className="text-center">
                    <div className="text-xl sm:text-2xl font-bold">500+</div>
                    <div className="text-xs sm:text-sm">Leagues</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:order-1 flex flex-col justify-center space-y-6">
              <div>
                <h2 className="mb-4">Built by rec players, for rec players</h2>
                <h4 className="text-gray-5 mb-6">
                  We understand the struggle of finding the right league because we've been there too.
                </h4>
                <p className="text-gray-4 leading-relaxed mb-6">
                  We started LeagueFindr because we were tired of clunky sign-ups, outdated schedules, and missed games. Now we're building the go-to tool for finding leagues that fit your life.
                </p>
                <Link 
                  href="/about" 
                  className="btn-primary inline-block text-lg px-8 py-4 transition-all duration-300 hover:scale-105 focus:scale-105"
                >
                  About Us
                </Link>
              </div>
            </div>
          </div>
        </Container>
      </Section>

      {/* CTA Section */}
      <Section background="white" padding="xl">
        <Container>
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="mb-4">Ready to Find Your Game?</h2>
            <h4 className="text-gray-5 mb-8">
              Join thousands of players who have found their perfect league through LeagueFindr
            </h4>
            <div className="flex justify-center">
              <Link 
                href="/find-a-league" 
                className="btn-primary inline-block text-lg px-8 py-4 transition-all duration-300 hover:scale-105 focus:scale-105"
              >
                Find a League
              </Link>
            </div>
          </div>
        </Container>
      </Section>
    </>
  )
} 