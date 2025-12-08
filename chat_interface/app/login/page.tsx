'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '../supabase/SupabaseAuthProvider'
import { Github } from 'lucide-react'

export default function LoginPage() {
  const { session, signInWithProvider } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState<'google' | 'github' | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (session) {
      router.replace('/')
    }
  }, [session, router])

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#0a0a0a',
      color: '#ddd',
      padding: 24,
      fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace'
    }}>
      {/* Back to home link */}
      <Link 
        href="/" 
        style={{
          position: 'absolute',
          top: 24,
          left: 24,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          color: '#666',
          fontSize: 12,
          textDecoration: 'none',
          transition: 'color 150ms ease'
        }}
        onMouseEnter={(e) => { e.currentTarget.style.color = '#e5e5e5' }}
        onMouseLeave={(e) => { e.currentTarget.style.color = '#666' }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        <span>Back to home</span>
      </Link>

      <div style={{
        width: 360,
        border: '2px solid #2a2a2a',
        padding: 32,
        background: '#0a0a0a'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <img 
              src="/DWResearch.svg" 
              alt="Deep Wide Research" 
              width={64} 
              height={64} 
              style={{ opacity: 0.9, display: 'block', margin: '0 auto' }} 
            />
            <div style={{ marginTop: 16, fontSize: 14, fontWeight: 500, color: '#888', letterSpacing: '-0.01em' }}>Sign in to continue</div>
          </div>

          <button
            onClick={async () => {
              setError(null)
              setLoading('google')
              try {
                await signInWithProvider('google')
              } catch (e: unknown) {
                const errMessage = e instanceof Error ? e.message : 'Sign-in failed'
                setError(errMessage)
              } finally {
                setLoading(null)
              }
            }}
            style={btnStyle}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
              e.currentTarget.style.borderColor = '#444'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.borderColor = '#2a2a2a'
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <GoogleIcon />
              <span>{loading === 'google' ? 'Redirecting...' : 'Continue with Google'}</span>
            </span>
          </button>

          <button
            onClick={async () => {
              setError(null)
              setLoading('github')
              try {
                await signInWithProvider('github')
              } catch (e: unknown) {
                const errMessage = e instanceof Error ? e.message : 'Sign-in failed'
                setError(errMessage)
              } finally {
                setLoading(null)
              }
            }}
            style={btnStyle}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
              e.currentTarget.style.borderColor = '#444'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.borderColor = '#2a2a2a'
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <Github size={14} />
              <span>{loading === 'github' ? 'Redirecting...' : 'Continue with GitHub'}</span>
            </span>
          </button>

          {error && (
            <div style={{ color: '#ef4444', fontSize: 11, textAlign: 'center', fontFamily: 'inherit' }}>{error}</div>
          )}

          <div style={{ fontSize: 10, color: '#555', textAlign: 'center', marginTop: 16, lineHeight: 1.5 }}>
            By continuing you agree to our Terms and Privacy Policy.
          </div>
        </div>
      </div>
    </div>
  )
}

const btnStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  border: '2px solid #2a2a2a',
  background: 'transparent',
  color: '#e6e6e6',
  cursor: 'pointer',
  fontSize: 12,
  fontFamily: 'inherit',
  transition: 'all 150ms ease'
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 533.5 544.3" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path fill="#4285f4" d="M533.5 278.4c0-17.6-1.6-34.4-4.6-50.4H272v95.3h147c-6.4 34.6-25.8 63.9-55 83.6l89 69.4c51.8-47.7 80.5-118 80.5-198z"/>
      <path fill="#34a853" d="M272 544.3c74.7 0 137.5-24.8 183.3-67.4l-89-69.4c-24.7 16.6-56.3 26.3-94.3 26.3-72.5 0-134-49-155.9-114.9l-92 71.6c41.6 82.5 127.1 153.8 247.9 153.8z"/>
      <path fill="#fbbc04" d="M116.1 318.9c-10-29.8-10-62.1 0-91.9l-92-71.6C4 211 0 240.9 0 272.4s4 61.4 24.1 116.9l92-70.4z"/>
      <path fill="#ea4335" d="M272 107.7c39.7-.6 77.6 14.7 105.8 42.9l77.5-77.5C395.1 24 334.2 0 272 0 151.2 0 65.7 71.3 24.1 155.5l92 71.6C138 161.3 199.5 107.7 272 107.7z"/>
    </svg>
  )
}


