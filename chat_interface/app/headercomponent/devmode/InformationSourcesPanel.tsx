'use client'

import React from 'react'
import AddSourcePanel from '../../AddSourcePanel'

const LOGOS: Array<{ key: string; logoSrc: string }> = [
  { key: 'notion', logoSrc: '/moreMcpLogo/notion.png' },
  { key: 'linear', logoSrc: '/moreMcpLogo/images.jpeg' },
  { key: 'jina', logoSrc: '/moreMcpLogo/jina-text.png' },
  { key: 'elasticsearch', logoSrc: '/moreMcpLogo/elasticsearch.svg' },
  { key: 'jira', logoSrc: '/moreMcpLogo/jira.png' },
  { key: 'milvus', logoSrc: '/moreMcpLogo/milvus-icon-color.png' },
  { key: 'pinecone', logoSrc: '/moreMcpLogo/pinecone 1.png' },
  { key: 'postgresql', logoSrc: '/moreMcpLogo/Postgresql_elephant.svg.png' },
  { key: 'slack', logoSrc: '/moreMcpLogo/Slack_icon_2019.svg.png' },
  { key: 'supabase', logoSrc: '/moreMcpLogo/supabase-icon.png' },
  { key: 'youtube', logoSrc: '/moreMcpLogo/YouTube.webp' },
  { key: 'airtable', logoSrc: '/moreMcpLogo/airtable.png' },
]

export default function InformationSourcesPanel() {
  const [showWaitlistForm, setShowWaitlistForm] = React.useState(false)

  return (
    <>
      <div style={{ marginBottom: '16px' }}>
        <div style={{ 
          border: '1px solid #2a2a2a', 
          borderRadius: 12, 
          background: 'linear-gradient(135deg, #0a0a0a 0%, #121212 100%)',
          padding: '32px',
          paddingRight: '0',
          display: 'flex',
          alignItems: 'center',
          gap: '32px',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Left side - Content */}
          <div style={{ flex: 1, zIndex: 1 }}>
            <h3 style={{ 
              fontSize: '20px', 
              fontWeight: 700, 
              color: '#e5e5e5',
              marginBottom: '12px',
              lineHeight: '1.3'
            }}>
              Connect 100 information sources
            </h3>
            <p style={{ 
              fontSize: '13px', 
              color: '#9aa0a6',
              lineHeight: '1.5',
              marginBottom: '20px'
            }}>
              Access enterprise data via MCP protocol.
            </p>
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column',
              gap: '8px',
              marginBottom: '24px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='#22C55E' strokeWidth='2.5' strokeLinecap='round' strokeLinejoin='round'>
                  <polyline points='20 6 9 17 4 12'/>
                </svg>
                <span style={{ fontSize: '12px', color: '#cfcfcf' }}>100+ enterprise integrations</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='#22C55E' strokeWidth='2.5' strokeLinecap='round' strokeLinejoin='round'>
                  <polyline points='20 6 9 17 4 12'/>
                </svg>
                <span style={{ fontSize: '12px', color: '#cfcfcf' }}>Real-time synchronization</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='#22C55E' strokeWidth='2.5' strokeLinecap='round' strokeLinejoin='round'>
                  <polyline points='20 6 9 17 4 12'/>
                </svg>
                <span style={{ fontSize: '12px', color: '#cfcfcf' }}>Enterprise security</span>
              </div>
            </div>
            <button
              onClick={() => setShowWaitlistForm(true)}
              style={{
                height: '32px',
                padding: '0 12px',
                borderRadius: '6px',
                border: 'none',
                background: '#3b82f6',
                color: '#ffffff',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'background 0.2s ease',
                boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#2563eb'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#3b82f6'}
            >
              <svg width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
                <path d='M12 19V5M5 12l7-7 7 7'/>
              </svg>
              Join Waitlist
            </button>
          </div>

          {/* Right side - Static Logos Grid */}
          <div style={{ 
            flex: 1,
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: '10px',
            zIndex: 1,
            paddingRight: '0',
            background: '#000',
            border: '1px solid #2a2a2a',
            borderRadius: '10px',
            padding: '16px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)'
          }}>
            {LOGOS.map((item) => (
              <div
                key={item.key}
                style={{
                  width: '100%',
                  aspectRatio: '1',
                  background: 'transparent',
                  border: 'none',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'transform 0.2s ease, background 0.2s ease',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.1)'
                  e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)'
                  e.currentTarget.style.background = 'transparent'
                }}
                title={item.key}
              >
                <img src={item.logoSrc} alt={item.key} style={{ width: '45%', height: '45%', objectFit: 'contain', borderRadius: '4px' }} />
              </div>
            ))}
          </div>

          {/* Subtle background pattern */}
          <div style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '200px',
            height: '100%',
            background: 'radial-gradient(circle at 80% 50%, rgba(34,197,94,0.03) 0%, transparent 70%)',
            pointerEvents: 'none'
          }}/>
        </div>
      </div>

      {/* Waitlist Form Modal */}
      <AddSourcePanel 
        open={showWaitlistForm} 
        onClose={() => setShowWaitlistForm(false)} 
      />
    </>
  )
}
