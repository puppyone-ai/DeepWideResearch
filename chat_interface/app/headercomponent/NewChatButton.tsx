import React from 'react'

interface NewChatButtonProps {
  isCreating: boolean
  showSuccess: boolean
  onClick: () => void
}

export default function NewChatButton({ isCreating, showSuccess, onClick }: NewChatButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={isCreating}
      title="New Chat"
      style={{
        position: 'relative',
        width: '36px',
        height: '36px',
        borderRadius: '18px',
        border: '1px solid #2a2a2a',
        background: 'rgba(20, 20, 20, 0.9)',
        color: '#bbb',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: isCreating ? 'default' : 'pointer',
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
        transition: 'all 200ms ease',
        backdropFilter: 'blur(8px)',
        padding: 0,
        margin: 0,
        opacity: isCreating ? 0.6 : 1
      }}
      onMouseEnter={(e) => {
        if (!isCreating) {
          e.currentTarget.style.borderColor = '#3a3a3a'
          e.currentTarget.style.background = 'rgba(25,25,25,0.9)'
          e.currentTarget.style.color = '#e6e6e6'
        }
      }}
      onMouseLeave={(e) => {
        if (!isCreating) {
          e.currentTarget.style.borderColor = '#2a2a2a'
          e.currentTarget.style.background = 'rgba(20,20,20,0.9)'
          e.currentTarget.style.color = '#bbb'
        }
      }}
    >
      {isCreating ? (
        <svg style={{ animation: 'spin 1s linear infinite', height: '18px', width: '18px' }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"></circle>
          <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : showSuccess ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 20h9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )}
    </button>
  )
}

