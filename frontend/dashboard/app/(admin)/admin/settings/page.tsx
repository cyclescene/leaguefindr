"use client"

import { Suspense } from "react"
import Link from "next/link"
import { useUser } from "@clerk/nextjs"
import { Loader2, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/common/Header"
import { Footer } from "@/components/common/Footer"
import { NotificationPreferences } from "@/components/NotificationPreferences"
import { ChangePassword } from "@/components/ChangePassword"

function SettingsContent() {
  const { user } = useUser()

  return (
    <div className="flex flex-col min-h-screen bg-neutral-light">
      <Header email={user?.primaryEmailAddress?.emailAddress || user?.emailAddresses[0]?.emailAddress} />

      <main className="flex-1 w-full max-w-4xl mx-auto px-6 py-12">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/admin">
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
        </div>

        <h1 className="text-3xl font-bold text-brand-dark mb-8">Settings</h1>

        {/* Change Password Section */}
        <div className="mb-12">
          <ChangePassword />
        </div>

        {/* Notification Preferences Section */}
        <div className="mb-12">
          <NotificationPreferences />
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-neutral-light">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="animate-spin text-brand-dark" size={40} />
            <p className="text-brand-dark font-medium">Loading settings...</p>
          </div>
        </div>
      }
    >
      <SettingsContent />
    </Suspense>
  )
}
