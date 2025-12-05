'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Twitter, Facebook, Instagram, Linkedin } from 'lucide-react'

const FOOTER_LINKS = [
  { href: 'https://leaguefindr.com', label: 'Home' },
  { href: 'https://leaguefindr.com/search', label: 'Find a League' },
  { href: 'https://leaguefindr.com/about', label: 'About Us' },
  { href: 'https://leaguefindr.com/privacy', label: 'Privacy Policy' },
  { href: 'https://leaguefindr.com/terms', label: 'Terms of Service' },
  { href: 'https://leaguefindr.com/cookies', label: 'Cookie Settings' },
]

// Custom TikTok icon component
const TikTokIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="currentColor"
    width="20"
    height="20"
  >
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-.88-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43V7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.04.57z"/>
  </svg>
)

const SOCIAL_LINKS = [
  { href: 'https://twitter.com/leaguefindr', icon: Twitter, label: 'Twitter' },
  { href: 'https://facebook.com/leaguefindr', icon: Facebook, label: 'Facebook' },
  { href: 'https://instagram.com/leaguefindr', icon: Instagram, label: 'Instagram' },
  { href: 'https://tiktok.com/@leaguefindr', icon: TikTokIcon, label: 'TikTok' },
  { href: 'https://linkedin.com/company/leaguefindr', icon: Linkedin, label: 'LinkedIn' },
]

export function Footer() {
  return (
    <footer className="bg-brand-dark text-white">
      <div className="max-w-7xl mx-auto px-6 py-12 lg:py-16">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12 mb-8 items-start">
          {/* Quick Links - Left */}
          <div className="text-left">
            <h4 className="font-bold text-lg uppercase mb-4 text-white">
              Quick Links
            </h4>
            <nav className="space-y-3">
              {FOOTER_LINKS.slice(0, 6).map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-gray-300 hover:text-brand-light transition-colors duration-200 text-sm"
                >
                  {link.label}
                </a>
              ))}
            </nav>
          </div>

          {/* Logo & Social - Center */}
          <div className="flex flex-col items-center justify-start text-center">
            <a
              href="https://leaguefindr.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mb-6 hover:opacity-90 transition-opacity"
            >
              <Image
                src="/logo.svg"
                alt="LeagueFindr"
                width={140}
                height={42}
                sizes="140px"
                className="h-10 w-auto object-contain"
                quality={95}
              />
            </a>

            {/* Social Media */}
            <div className="flex justify-center space-x-5">
              {SOCIAL_LINKS.map((social) => {
                const Icon = social.icon
                return (
                  <a
                    key={social.href}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-300 hover:text-brand-light transition-colors duration-200"
                    title={social.label}
                  >
                    <Icon className="h-5 w-5" />
                  </a>
                )
              })}
            </div>
          </div>

          {/* Contact - Right */}
          <div className="text-left lg:text-right">
            <h4 className="font-bold text-lg uppercase mb-4 text-white">
              Connect
            </h4>

            {/* Contact Email */}
            <div>
              <a
                href="mailto:info@leaguefindr.com"
                className="text-gray-300 hover:text-brand-light transition-colors duration-200 text-sm"
              >
                info@leaguefindr.com
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Border */}
        <div className="border-t border-brand-dark/20 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-gray-300 text-sm">
              © {new Date().getFullYear()} Recess Sports dba LeagueFindr. All rights reserved.
            </p>

            {/* Additional Legal Links */}
            <div className="flex space-x-6">
              <a
                href="https://leaguefindr.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-300 hover:text-brand-light transition-colors duration-200 text-sm"
              >
                Privacy
              </a>
              <a
                href="https://leaguefindr.com/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-300 hover:text-brand-light transition-colors duration-200 text-sm"
              >
                Terms
              </a>
              <a
                href="https://leaguefindr.com/cookies"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-300 hover:text-brand-light transition-colors duration-200 text-sm"
              >
                Cookies
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
