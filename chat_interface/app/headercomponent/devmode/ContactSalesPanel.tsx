'use client'

import React from 'react'
import { useAuth } from '../../supabase/SupabaseAuthProvider'
import { X } from 'lucide-react'

export interface ContactSalesPanelProps {
  open: boolean
  onClose: () => void
}

// 公司规模选项
const COMPANY_SIZES = [
  { key: '1-10', label: '1-10' },
  { key: '11-50', label: '11-50' },
  { key: '51-200', label: '51-200' },
  { key: '201-1000', label: '201-1000' },
  { key: '1000+', label: '1000+' },
]

export default function ContactSalesPanel({ open, onClose }: ContactSalesPanelProps) {
  const { session } = useAuth()
  const userEmail = session?.user?.email || ''
  
  const [companyName, setCompanyName] = React.useState('')
  const [companySize, setCompanySize] = React.useState('')
  const [requirements, setRequirements] = React.useState('')
  const [busy, setBusy] = React.useState(false)
  const [done, setDone] = React.useState(false)
  const [err, setErr] = React.useState<string | null>(null)

  // Check if form is valid
  const isFormValid = companyName.trim() && companySize && requirements.trim()

  const onSubmit = async () => {
    if (busy || done || !isFormValid) return
    setBusy(true)
    setErr(null)
    
    try {
      const endpoint = process.env.NEXT_PUBLIC_FORMSPREE_CONTACT_ENDPOINT || 
                       process.env.NEXT_PUBLIC_FORMSPREE_ENDPOINT || ''
      if (!endpoint) {
        console.warn('Contact endpoint not configured')
        setDone(true)
        return
      }
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          email: userEmail || '(Anonymous)',
          company_name: companyName.trim(),
          company_size: companySize,
          requirements: requirements.trim(),
          _subject: `DeepWide Enterprise Inquiry: ${companyName.trim()}`,
          timestamp: new Date().toISOString()
        })
      })
      
      if (!response.ok) {
        console.error('Contact submit error:', response.status)
      }
      setDone(true)
    } catch (error) {
      console.error('Contact submit error:', error)
      setDone(true)
    } finally {
      setBusy(false)
    }
  }

  // Reset form when panel closes
  React.useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setCompanyName('')
        setCompanySize('')
        setRequirements('')
        setDone(false)
        setErr(null)
      }, 200)
    }
  }, [open])

  return (
    <div
      aria-hidden={!open}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1100,
        pointerEvents: open ? 'auto' : 'none',
        opacity: open ? 1 : 0,
        transition: 'opacity 200ms ease',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
      onClick={onClose}
    >
      {/* Backdrop */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)'
        }}
      />
      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative',
          width: 'min(480px, 92vw)',
          maxHeight: 'min(85vh, 600px)',
          overflow: 'auto',
          background: '#0f0f0f',
          border: '1px solid #2a2a2a',
          borderRadius: '16px',
          color: '#e5e5e5',
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'none',
            border: 'none',
            color: '#666',
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '6px',
            transition: 'color 150ms ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = '#999'}
          onMouseLeave={(e) => e.currentTarget.style.color = '#666'}
        >
          <X size={20} />
        </button>

        {done ? (
          // Success state
          <div style={{ padding: '60px 32px', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📬</div>
            <div style={{ fontSize: '20px', fontWeight: 600, marginBottom: '8px', color: '#4ade80' }}>
              Request Received!
            </div>
            <div style={{ fontSize: '14px', color: '#888', lineHeight: 1.5 }}>
              We&apos;ll reach out to you soon.
            </div>
            <button
              onClick={onClose}
              style={{
                marginTop: '24px',
                padding: '10px 24px',
                borderRadius: '8px',
                border: '1px solid #333',
                background: 'transparent',
                color: '#e5e5e5',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Close
            </button>
          </div>
        ) : (
          // Form
          <div style={{ padding: '32px' }}>
            {/* Header */}
            <div style={{ marginBottom: '28px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <div style={{ fontSize: '20px', fontWeight: 700, color: '#EDEDED' }}>
                  Contact Sales
                </div>
                <span style={{ 
                  fontSize: '10px', 
                  fontWeight: 600, 
                  color: '#0B0B0B', 
                  background: '#FBBF24', 
                  borderRadius: '9999px', 
                  padding: '3px 8px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Enterprise
                </span>
              </div>
              <div style={{ fontSize: '13px', color: '#888' }}>
                Tell us about your needs and we&apos;ll get back to you
              </div>
            </div>

            {/* Company Name */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '10px', color: '#ccc' }}>
                Company Name
              </div>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Your company name"
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '8px',
                  border: '1px solid #333',
                  background: '#1a1a1a',
                  color: '#e5e5e5',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#333'}
              />
            </div>

            {/* Company Size */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '10px', color: '#ccc' }}>
                Company Size
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {COMPANY_SIZES.map(item => {
                  const isSelected = companySize === item.key
                  return (
                    <button
                      key={item.key}
                      onClick={() => setCompanySize(item.key)}
                      style={{
                        padding: '10px 16px',
                        borderRadius: '8px',
                        border: isSelected ? '1px solid #3b82f6' : '1px solid #333',
                        background: isSelected ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                        color: isSelected ? '#60a5fa' : '#999',
                        cursor: 'pointer',
                        fontSize: '13px',
                        transition: 'all 150ms ease',
                        flex: '1 1 auto',
                        minWidth: '70px'
                      }}
                    >
                      {item.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Requirements */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '10px', color: '#ccc' }}>
                What are your requirements?
              </div>
              <textarea
                value={requirements}
                onChange={(e) => setRequirements(e.target.value)}
                placeholder="Describe your use case, expected volume, integrations needed, etc."
                style={{
                  width: '100%',
                  height: '100px',
                  padding: '12px 14px',
                  borderRadius: '8px',
                  border: '1px solid #333',
                  background: '#1a1a1a',
                  color: '#e5e5e5',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box',
                  resize: 'none',
                  fontFamily: 'inherit',
                  lineHeight: 1.5
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#333'}
              />
            </div>

            {/* Submit button */}
            <button
              onClick={onSubmit}
              disabled={busy || !isFormValid}
              style={{
                width: '100%',
                height: '44px',
                borderRadius: '10px',
                border: 'none',
                background: isFormValid ? '#3b82f6' : '#333',
                color: isFormValid ? '#fff' : '#666',
                cursor: isFormValid && !busy ? 'pointer' : 'not-allowed',
                fontSize: '14px',
                fontWeight: 600,
                transition: 'all 150ms ease',
                opacity: busy ? 0.7 : 1
              }}
            >
              {busy ? 'Sending...' : 'Send Request'}
            </button>
            
            {err && (
              <div style={{ textAlign: 'center', marginTop: '12px', fontSize: '13px', color: '#ef4444' }}>
                {err}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

