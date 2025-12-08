'use client'

import React from 'react'
import { useAuth } from './supabase/SupabaseAuthProvider'
import { X } from 'lucide-react'

export interface AddSourcePanelProps {
  open: boolean
  onClose: () => void
}

// 使用场景选项
const USE_CASES = [
  { key: 'market_research', label: 'Market Research', icon: '📊' },
  { key: 'competitive_analysis', label: 'Competitive Analysis', icon: '🔍' },
  { key: 'content_creation', label: 'Content Creation', icon: '📝' },
  { key: 'sales_intelligence', label: 'Sales Intelligence', icon: '💼' },
  { key: 'product_development', label: 'Product Development', icon: '🛠️' },
  { key: 'business_analytics', label: 'Business Analytics', icon: '📈' },
  { key: 'academic_research', label: 'Academic Research', icon: '🎓' },
  { key: 'other', label: 'Other', icon: '🔧' },
]

// 信息源选项
const DATA_SOURCES = [
  { key: 'files', label: 'Files (PDF, Word, etc.)', logoSrc: '', icon: '📄' },
  { key: 'notion', label: 'Notion', logoSrc: '/moreMcpLogo/notion.png' },
  { key: 'slack', label: 'Slack', logoSrc: '/moreMcpLogo/Slack_icon_2019.svg.png' },
  { key: 'linear', label: 'Linear', logoSrc: '/moreMcpLogo/images.jpeg' },
  { key: 'jira', label: 'Jira', logoSrc: '/moreMcpLogo/jira.png' },
  { key: 'airtable', label: 'Airtable', logoSrc: '/moreMcpLogo/airtable.png' },
  { key: 'postgresql', label: 'PostgreSQL', logoSrc: '/moreMcpLogo/Postgresql_elephant.svg.png' },
  { key: 'supabase', label: 'Supabase', logoSrc: '/moreMcpLogo/supabase-icon.png' },
  { key: 'elasticsearch', label: 'Elasticsearch', logoSrc: '/moreMcpLogo/elasticsearch.svg' },
  { key: 'pinecone', label: 'Pinecone', logoSrc: '/moreMcpLogo/pinecone 1.png' },
  { key: 'milvus', label: 'Milvus', logoSrc: '/moreMcpLogo/milvus-icon-color.png' },
  { key: 'youtube', label: 'YouTube', logoSrc: '/moreMcpLogo/YouTube.webp' },
  { key: 'github', label: 'GitHub', logoSrc: '/github.png' },
  { key: 'google_drive', label: 'Google Drive', logoSrc: '/Google_Drive.png' },
  { key: 'other', label: 'Other', logoSrc: '' },
]

// 团队规模选项
const TEAM_SIZES = [
  { key: '1-5', label: '1-5 people' },
  { key: '6-20', label: '6-20 people' },
  { key: '21-100', label: '21-100 people' },
  { key: '100+', label: '100+ people' },
]

export default function AddSourcePanel({ open, onClose }: AddSourcePanelProps) {
  const { session } = useAuth()
  const userEmail = session?.user?.email || ''
  
  const [selectedUseCases, setSelectedUseCases] = React.useState<string[]>([])
  const [selectedSources, setSelectedSources] = React.useState<string[]>([])
  const [otherUseCase, setOtherUseCase] = React.useState('')
  const [otherSource, setOtherSource] = React.useState('')
  const [teamSize, setTeamSize] = React.useState<string>('')
  const [busy, setBusy] = React.useState(false)
  const [done, setDone] = React.useState(false)
  const [err, setErr] = React.useState<string | null>(null)

  // Toggle multi-select
  const toggleUseCase = (key: string) => {
    setSelectedUseCases(prev => 
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    )
  }
  
  const toggleSource = (key: string) => {
    setSelectedSources(prev => 
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    )
  }

  // Check if form is valid (if "other" is selected, must have text)
  const useCaseValid = selectedUseCases.length > 0 && 
    (!selectedUseCases.includes('other') || otherUseCase.trim())
  const sourceValid = selectedSources.length > 0 && 
    (!selectedSources.includes('other') || otherSource.trim())
  const isFormValid = useCaseValid && sourceValid && teamSize

  const onSubmit = async () => {
    if (busy || done || !isFormValid) return
    setBusy(true)
    setErr(null)
    
    try {
      const endpoint = process.env.NEXT_PUBLIC_FORMSPREE_WAITLIST_ENDPOINT || ''
      if (!endpoint) {
        console.warn('Waitlist endpoint not configured')
        setDone(true)
        return
      }
      
      // Build use cases string with "other" text if provided
      const useCasesFormatted = selectedUseCases
        .map(k => k === 'other' && otherUseCase.trim() ? `Other: ${otherUseCase.trim()}` : k)
        .join(', ')
      
      // Build sources string with "other" text if provided
      const sourcesFormatted = selectedSources
        .map(k => k === 'other' && otherSource.trim() ? `Other: ${otherSource.trim()}` : k)
        .join(', ')
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          email: userEmail || '(Anonymous)',
          use_cases: useCasesFormatted,
          data_sources: sourcesFormatted,
          team_size: teamSize,
          _subject: `DeepWide Waitlist: ${userEmail || 'Anonymous'}`,
          timestamp: new Date().toISOString()
        })
      })
      
      if (!response.ok) {
        console.error('Waitlist submit error:', response.status)
      }
      setDone(true)
    } catch (error) {
      console.error('Waitlist submit error:', error)
      setDone(true)
    } finally {
      setBusy(false)
    }
  }

  // Reset form when panel closes
  React.useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setSelectedUseCases([])
        setSelectedSources([])
        setOtherUseCase('')
        setOtherSource('')
        setTeamSize('')
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
        zIndex: 1000,
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
          width: 'min(600px, 92vw)',
          maxHeight: 'min(85vh, 800px)',
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
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎉</div>
            <div style={{ fontSize: '20px', fontWeight: 600, marginBottom: '8px', color: '#4ade80' }}>
              You&apos;re on the list!
            </div>
            <div style={{ fontSize: '14px', color: '#888' }}>
              We&apos;ll reach out when enterprise sources are ready.
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
                  Join the Waitlist
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
                Get early access to 100+ enterprise information sources
              </div>
            </div>

            {/* Question 1: Data Sources */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', color: '#ccc' }}>
                Which sources do you need? <span style={{ color: '#666', fontWeight: 400 }}>(select all that apply)</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {DATA_SOURCES.map(item => {
                  const isSelected = selectedSources.includes(item.key)
                  return (
                    <button
                      key={item.key}
                      onClick={() => toggleSource(item.key)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '8px',
                        border: isSelected ? '1px solid #3b82f6' : '1px solid #333',
                        background: isSelected ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                        color: isSelected ? '#60a5fa' : '#999',
                        cursor: 'pointer',
                        fontSize: '13px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        transition: 'all 150ms ease'
                      }}
                    >
                      {item.logoSrc ? (
                        <img 
                          src={item.logoSrc} 
                          alt={item.label} 
                          style={{ width: '16px', height: '16px', objectFit: 'contain', borderRadius: '2px' }}
                        />
                      ) : 'icon' in item && item.icon ? (
                        <span style={{ fontSize: '14px' }}>{item.icon}</span>
                      ) : (
                        <span style={{ fontSize: '14px' }}>➕</span>
                      )}
                      <span>{item.label}</span>
                    </button>
                  )
                })}
              </div>
              {/* Other source input */}
              {selectedSources.includes('other') && (
                <input
                  type="text"
                  value={otherSource}
                  onChange={(e) => setOtherSource(e.target.value)}
                  placeholder="Please specify the sources you need..."
                  style={{
                    marginTop: '12px',
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid #333',
                    background: '#1a1a1a',
                    color: '#e5e5e5',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.currentTarget.style.borderColor = '#333'}
                />
              )}
            </div>

            {/* Question 2: Use Cases */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', color: '#ccc' }}>
                What will you use it for? <span style={{ color: '#666', fontWeight: 400 }}>(select all that apply)</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {USE_CASES.map(item => {
                  const isSelected = selectedUseCases.includes(item.key)
                  return (
                    <button
                      key={item.key}
                      onClick={() => toggleUseCase(item.key)}
                      style={{
                        padding: '8px 14px',
                        borderRadius: '8px',
                        border: isSelected ? '1px solid #3b82f6' : '1px solid #333',
                        background: isSelected ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                        color: isSelected ? '#60a5fa' : '#999',
                        cursor: 'pointer',
                        fontSize: '13px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'all 150ms ease'
                      }}
                    >
                      <span>{item.icon}</span>
                      <span>{item.label}</span>
                    </button>
                  )
                })}
              </div>
              {/* Other use case input */}
              {selectedUseCases.includes('other') && (
                <input
                  type="text"
                  value={otherUseCase}
                  onChange={(e) => setOtherUseCase(e.target.value)}
                  placeholder="Please specify your use case..."
                  style={{
                    marginTop: '12px',
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid #333',
                    background: '#1a1a1a',
                    color: '#e5e5e5',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.currentTarget.style.borderColor = '#333'}
                />
              )}
            </div>

            {/* Question 3: Team Size */}
            <div style={{ marginBottom: '28px' }}>
              <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', color: '#ccc' }}>
                Team size
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {TEAM_SIZES.map(item => {
                  const isSelected = teamSize === item.key
                  return (
                    <button
                      key={item.key}
                      onClick={() => setTeamSize(item.key)}
                      style={{
                        padding: '10px 16px',
                        borderRadius: '8px',
                        border: isSelected ? '1px solid #3b82f6' : '1px solid #333',
                        background: isSelected ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                        color: isSelected ? '#60a5fa' : '#999',
                        cursor: 'pointer',
                        fontSize: '13px',
                        transition: 'all 150ms ease',
                        flex: 1
                      }}
                    >
                      {item.label}
                    </button>
                  )
                })}
              </div>
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
              {busy ? 'Submitting...' : 'Join Waitlist'}
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
