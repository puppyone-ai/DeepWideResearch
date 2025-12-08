'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../supabase/SupabaseAuthProvider'

export default function AuthCallbackPage() {
  const { supabase, session } = useAuth()
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const didRunRef = React.useRef(false)

  useEffect(() => {
    if (!supabase) return
    if (didRunRef.current) return
    didRunRef.current = true

    // If session already exists, go home
    if (session) {
      router.replace('/')
      return
    }

    // Only attempt exchange when the URL contains auth params
    const href = typeof window !== 'undefined' ? window.location.href : ''
    const url = typeof window !== 'undefined' ? new URL(window.location.href) : null
    const hasCode = url?.searchParams.get('code')
    const hashParams = typeof window !== 'undefined' && window.location.hash
      ? new URLSearchParams(window.location.hash.slice(1))
      : null
    const hasAccessToken = hashParams?.get('access_token')

    if (!hasCode && !hasAccessToken) {
      // Missing auth parameters -> go to login
      router.replace('/login')
      return
    }

    const run = async () => {
      try {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(href)
        if (exchangeError) throw exchangeError
        router.replace('/')
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Authentication failed'
        setError(msg)
        // Directly go to login if exchange fails (avoid delayed flicker)
        router.replace('/login')
      }
    }
    void run()
  }, [supabase, session, router])

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#0a0a0a',
      color: '#ddd',
      padding: 24
    }}>
      <div style={{ textAlign: 'center' }}>
        <img src="/SimpleDWlogo.svg" alt="Deep Wide Research" width={48} height={48} style={{ opacity: 0.9, display: 'block', margin: '0 auto' }} />
        <div style={{ marginTop: 12, fontSize: 14 }}>
          {error ? `Auth error: ${error}` : 'Signing you in…'}
        </div>
      </div>
    </div>
  )
}


