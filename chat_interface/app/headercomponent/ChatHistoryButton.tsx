import React from 'react'
import SessionsSidebar from '../../components/SessionsSidebar'

export interface HistoryToggleButtonProps {
  isOpen: boolean
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void
}

export function HistoryToggleButton({ isOpen, onClick }: HistoryToggleButtonProps) {
  return (
    <button
      data-sidebar-toggle
      onClick={onClick}
      title={isOpen ? "Close history" : "Open history"}
      style={{
        position: 'relative',
        width: '36px',
        height: '36px',
        borderRadius: '18px',
        border: isOpen 
          ? '2px solid #4a4a4a' 
          : '1px solid #2a2a2a',
        background: isOpen 
          ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.08) 100%)' 
          : 'rgba(20, 20, 20, 0.9)',
        color: isOpen ? '#e6e6e6' : '#bbb',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        boxShadow: isOpen 
          ? '0 4px 16px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255,255,255,0.1)' 
          : '0 2px 8px rgba(0,0,0,0.3)',
        transition: 'all 200ms ease',
        backdropFilter: 'blur(8px)',
        padding: 0,
        margin: 0
      }}
      onMouseEnter={(e) => {
        if (!isOpen) {
          e.currentTarget.style.borderColor = '#3a3a3a'
          e.currentTarget.style.background = 'rgba(25,25,25,0.9)'
          e.currentTarget.style.color = '#e6e6e6'
        }
      }}
      onMouseLeave={(e) => {
        if (!isOpen) {
          e.currentTarget.style.borderColor = '#2a2a2a'
          e.currentTarget.style.background = 'rgba(20,20,20,0.9)'
          e.currentTarget.style.color = '#bbb'
        }
      }}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 8v4l3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M3.05 11a9 9 0 1 1 .5 4m-.5 -4H7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </button>
  )
}

interface Session {
  id: string
  title: string
  createdAt: number
  updatedAt: number
}

interface SessionsOverlayProps {
  isOpen: boolean
  sidebarWidth: number
  sessions: Session[]
  selectedSessionId: string | null
  isLoading: boolean
  onSessionClick: (id: string) => void
  onCreateNew: () => void
  onDeleteSession: (id: string) => void
}

export default function SessionsOverlay({
  isOpen,
  sidebarWidth,
  sessions,
  selectedSessionId,
  isLoading,
  onSessionClick,
  onCreateNew,
  onDeleteSession
}: SessionsOverlayProps) {
  return (
    <div
      data-sidebar-panel
      style={{
        position: 'absolute',
        top: '47px',
        left: 0,
        width: `${sidebarWidth}px`,
        maxHeight: '60vh',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, rgba(25,25,25,0.98) 0%, rgba(15,15,15,0.98) 100%)',
        border: '1px solid #2a2a2a',
        borderRadius: '14px',
        boxShadow: isOpen 
          ? '0 12px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.08), inset 0 1px 0 rgba(255,255,255,0.1)' 
          : '0 4px 12px rgba(0,0,0,0.3)',
        opacity: isOpen ? 1 : 0,
        transform: isOpen ? 'translateY(0) scale(1)' : 'translateY(-10px) scale(0.95)',
        transition: 'all 300ms cubic-bezier(0.34, 1.56, 0.64, 1)',
        pointerEvents: isOpen ? 'auto' : 'none',
        backdropFilter: 'blur(12px)',
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column'
      }}
      aria-hidden={!isOpen}
      onClick={(e) => e.stopPropagation()}
    >
      <SessionsSidebar
        sessions={sessions}
        selectedSessionId={selectedSessionId}
        isLoading={isLoading}
        showHeader={false}
        showNewButton={false}
        onSessionClick={onSessionClick}
        onCreateNew={onCreateNew}
        onDeleteSession={onDeleteSession}
      />
    </div>
  )
}

