'use client'

import React, { useState, useRef } from 'react'
import MCPButton from './MCPButton'
import { MessageSquare, X, Send } from 'lucide-react'
import { useAuth } from './supabase/SupabaseAuthProvider'

export interface McpTool {
  name: string
  enabled: boolean
  description: string
}

export interface McpService {
  name: string
  enabled: boolean
  tools: McpTool[]
}

export interface McpConfigValue {
  services: McpService[]
}

export interface MCPBarProps {
  value: McpConfigValue
  onChange: (value: McpConfigValue) => void
  onAddSourceClick?: () => void
}

export default function MCPBar({ value, onChange, onAddSourceClick }: MCPBarProps) {
  // Filter services with enabled tools
  const activeServices = value.services.filter(service => 
    service.enabled && service.tools.some(tool => tool.enabled)
  )
  
  // Get removed services (services without enabled tools)
  const removedServices = value.services.filter(service => 
    !service.enabled || !service.tools.some(tool => tool.enabled)
  )

  const handleServiceChange = (updatedService: McpService) => {
    const newServices = value.services.map(service => 
      service.name === updatedService.name ? updatedService : service
    )
    onChange({ services: newServices })
  }

  return (
    <>
      {/* MCP Services Bar - each button has its own panel */}
      {activeServices.map((service) => (
        <MCPButton
          key={service.name}
          service={service}
          onServiceChange={handleServiceChange}
        />
      ))}

      {/* Add MCP Button - for restoring removed services and adding custom MCP */}
      <AddMCPButton
        removedServices={removedServices}
        onRestoreService={(serviceName) => {
          const serviceIndex = value.services.findIndex(s => s.name === serviceName)
          if (serviceIndex !== -1) {
            const newServices = [...value.services]
            newServices[serviceIndex] = {
              ...newServices[serviceIndex],
              enabled: true,
              tools: newServices[serviceIndex].tools.map(tool => ({ ...tool, enabled: true }))
            }
            onChange({ services: newServices })
          }
        }}
        onAddSourceClick={onAddSourceClick}
      />

      {/* Spacer to push feedback to right */}
      <div style={{ flex: 1 }} />

      {/* Feedback Button */}
      <FeedbackButton />
    </>
  )
}

// Star SVG path constant
const STAR_POINTS = "12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"

// Feedback Button component with two-step flow: rating first, then text
function FeedbackButton() {
  const { session } = useAuth()
  const userEmail = session?.user?.email || ''
  
  const [showFeedback, setShowFeedback] = useState(false)
  const [step, setStep] = useState<'rating' | 'text'>('rating')
  const [rating, setRating] = useState(0)
  const [hoveredStar, setHoveredStar] = useState(0)
  const [feedbackText, setFeedbackText] = useState('')
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false)
  const [feedbackSuccess, setFeedbackSuccess] = useState(false)
  const feedbackRef = useRef<HTMLDivElement>(null)

  // Reset all feedback state
  const resetState = () => {
    setStep('rating')
    setRating(0)
    setFeedbackText('')
  }

  // Close popup and reset after delay
  const closeWithDelay = (delay = 200) => {
    setShowFeedback(false)
    setTimeout(resetState, delay)
  }

  // Show success and close
  const completeSubmission = () => {
    setFeedbackSuccess(true)
    setTimeout(() => {
      setFeedbackSuccess(false)
      closeWithDelay(0)
    }, 1500)
  }

  // Close feedback popup on outside click
  React.useEffect(() => {
    if (!showFeedback) return
    const handleClickOutside = (event: MouseEvent) => {
      if (feedbackRef.current && !feedbackRef.current.contains(event.target as Node)) {
        closeWithDelay()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showFeedback])

  // Handle star click - move to text step
  const handleStarClick = (starValue: number) => {
    setRating(starValue)
    setTimeout(() => setStep('text'), 300)
  }

  // Submit feedback to Formspree
  const handleFeedbackSubmit = async () => {
    if (feedbackSubmitting) return
    setFeedbackSubmitting(true)
    
    try {
      const formspreeEndpoint = process.env.NEXT_PUBLIC_FORMSPREE_ENDPOINT || ''
      if (!formspreeEndpoint) {
        console.warn('Formspree endpoint not configured')
        completeSubmission()
        return
      }
      
      const response = await fetch(formspreeEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ 
          rating,
          email: userEmail || '(Anonymous)',
          message: feedbackText || '(No comment)',
          _subject: `DeepWide Feedback: ${rating} stars`,
          timestamp: new Date().toISOString()
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        console.error('Formspree error:', response.status, errorData)
      }
      completeSubmission()
    } catch (err) {
      console.error('Feedback submit error:', err)
      completeSubmission()
    } finally {
      setFeedbackSubmitting(false)
    }
  }

  // Render star button
  const renderStar = (starValue: number) => {
    const isFilled = starValue <= (hoveredStar || rating)
    return (
      <button
        key={starValue}
        onClick={() => handleStarClick(starValue)}
        onMouseEnter={() => setHoveredStar(starValue)}
        onMouseLeave={() => setHoveredStar(0)}
        style={{
          background: 'none',
          border: 'none',
          padding: '4px',
          cursor: 'pointer',
          transition: 'transform 150ms ease',
          transform: hoveredStar === starValue ? 'scale(1.2)' : 'scale(1)'
        }}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill={isFilled ? '#fbbf24' : 'none'}
          stroke={isFilled ? '#fbbf24' : '#555'}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ transition: 'all 150ms ease' }}
        >
          <polygon points={STAR_POINTS} />
        </svg>
      </button>
    )
  }

  return (
    <div style={{ position: 'relative' }} ref={feedbackRef}>
      <button
        onClick={() => setShowFeedback(!showFeedback)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '32px',
          height: '32px',
          borderRadius: '8px',
          border: 'none',
          background: showFeedback ? 'rgba(255,255,255,0.08)' : 'transparent',
          color: showFeedback ? '#e5e5e5' : '#666',
          cursor: 'pointer',
          transition: 'all 150ms ease'
        }}
        onMouseEnter={(e) => {
          if (!showFeedback) {
            e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
            e.currentTarget.style.color = '#888'
          }
        }}
        onMouseLeave={(e) => {
          if (!showFeedback) {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = '#666'
          }
        }}
        title="Send Feedback"
      >
        <MessageSquare size={16} />
      </button>

      {/* Feedback Popup */}
      {showFeedback && (
        <div
          style={{
            position: 'absolute',
            bottom: '100%',
            right: 0,
            marginBottom: '8px',
            width: step === 'rating' ? '220px' : '280px',
            background: '#1a1a1a',
            border: '1px solid #333',
            borderRadius: '12px',
            padding: '16px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            zIndex: 1000,
            transition: 'width 200ms ease'
          }}
        >
          {feedbackSuccess ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px',
              color: '#4ade80',
              fontSize: '14px',
              fontWeight: 500
            }}>
              ✓ Thanks for your feedback!
            </div>
          ) : step === 'rating' ? (
            // Step 1: Star Rating
            <div style={{ textAlign: 'center' }}>
              <div style={{ 
                fontSize: '13px', 
                color: '#999', 
                marginBottom: '12px',
                fontWeight: 500
              }}>
                How&apos;s your experience?
              </div>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                gap: '4px'
              }}>
                {[1, 2, 3, 4, 5].map(renderStar)}
              </div>
            </div>
          ) : (
            // Step 2: Text Feedback
            <>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    onClick={() => setStep('rating')}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#666',
                      cursor: 'pointer',
                      padding: '2px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    title="Back to rating"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M19 12H5M12 19l-7-7 7-7"/>
                    </svg>
                  </button>
                  <div style={{ display: 'flex', gap: '2px' }}>
                    {[1, 2, 3, 4, 5].map(i => (
                      <svg
                        key={i}
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill={i <= rating ? '#fbbf24' : 'none'}
                        stroke={i <= rating ? '#fbbf24' : '#444'}
                        strokeWidth="2"
                      >
                        <polygon points={STAR_POINTS} />
                      </svg>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => closeWithDelay()}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#666',
                    cursor: 'pointer',
                    padding: '2px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <X size={14} />
                </button>
              </div>
              <div style={{ 
                fontSize: '13px', 
                color: '#888', 
                marginBottom: '10px'
              }}>
                Any thoughts? <span style={{ color: '#555' }}>(optional)</span>
              </div>
              <textarea
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="What could be better..."
                style={{
                  width: '100%',
                  height: '70px',
                  background: '#0d0d0d',
                  border: '1px solid #333',
                  borderRadius: '8px',
                  padding: '10px',
                  color: '#e5e5e5',
                  fontSize: '13px',
                  resize: 'none',
                  outline: 'none',
                  fontFamily: 'inherit',
                  lineHeight: '1.4',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#555'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#333'}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.metaKey) {
                    handleFeedbackSubmit()
                  }
                }}
                autoFocus
              />
              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                marginTop: '10px'
              }}>
                <button
                  onClick={handleFeedbackSubmit}
                  disabled={feedbackSubmitting}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 14px',
                    background: '#4a90e2',
                    border: 'none',
                    borderRadius: '6px',
                    color: '#fff',
                    fontSize: '12px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 150ms ease',
                    opacity: feedbackSubmitting ? 0.7 : 1
                  }}
                >
                  {feedbackSubmitting ? 'Sending...' : (
                    <>
                      <Send size={12} />
                      Send
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

// Standalone Add MCP Button component
interface AddMCPButtonProps {
  removedServices: McpService[]
  onRestoreService: (serviceName: string) => void
  onAddSourceClick?: () => void
}

function AddMCPButton({ removedServices, onRestoreService, onAddSourceClick }: AddMCPButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isAddHover, setIsAddHover] = useState(false)

  // Close panel on outside click
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isOpen) {
        const target = event.target as Element
        const panel = document.querySelector('[data-add-mcp-panel]')
        const button = document.querySelector('[data-add-mcp-button]')
        
        if (panel && button) {
          const isClickInPanel = panel.contains(target)
          const isClickOnButton = button.contains(target)
          
          if (!isClickInPanel && !isClickOnButton) {
            setIsOpen(false)
          }
        }
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  return (
    <div style={{ position: 'relative' }}>
      {/* Add MCP Panel */}
      {(!onAddSourceClick) && (
      <div
        style={{
          position: 'absolute',
          bottom: '47px',
          left: '0',
          width: '195px',
          background: 'linear-gradient(135deg, rgba(25,25,25,0.98) 0%, rgba(15,15,15,0.98) 100%)',
          border: '1px solid #3a3a3a',
          borderRadius: '14px',
          boxShadow: isOpen 
            ? '0 12px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.08), inset 0 1px 0 rgba(255,255,255,0.1)' 
            : '0 4px 12px rgba(0,0,0,0.3)',
          overflow: 'visible',
          opacity: isOpen ? 1 : 0,
          transform: isOpen ? 'translateY(0) scale(1)' : 'translateY(-10px) scale(0.95)',
          transition: 'all 300ms cubic-bezier(0.34, 1.56, 0.64, 1)',
          pointerEvents: isOpen ? 'auto' : 'none',
          backdropFilter: 'blur(12px)',
          zIndex: 10
        }}
        aria-hidden={!isOpen}
        data-add-mcp-panel
      >
        <div style={{ padding: '14px' }}>
          {/* Default MCP Servers Section */}
          {removedServices.length > 0 && (
            <>
              <div style={{ 
                fontSize: '10px', 
                color: '#888', 
                textTransform: 'uppercase', 
                letterSpacing: '0.5px',
                marginBottom: '8px',
                paddingBottom: '8px',
              borderBottom: '1px solid #3a3a3a'
              }}>
                Default MCP Servers
              </div>

              {removedServices.map((service, serviceIndex) => (
                <div
                  key={service.name}
                  style={{
                    marginBottom: serviceIndex < removedServices.length - 1 ? '4px' : '8px',
                    height: '28px',
                    padding: '0 8px',
                    background: 'transparent',
                    border: '1px dashed #5a5a5a',
                    borderRadius: '8px',
                    transition: 'all 150ms ease',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                  onClick={(e) => {
                    e.stopPropagation()
                    onRestoreService(service.name)
                    setIsOpen(false) // 关闭面板
                  }}
                >
                  <img 
                    src={service.name === 'Tavily' ? '/tavilylogo.png' : '/exalogo.png'}
                    alt={`${service.name} logo`}
                    style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '2px',
                      objectFit: 'contain'
                    }}
                  />
                  <div style={{ 
                    fontSize: '12px', 
                    fontWeight: '500',
                    color: '#888',
                    flex: 1
                  }}>
                    Add {service.name}
                  </div>
                  <svg 
                    width="12" 
                    height="12" 
                    viewBox="0 0 24 24" 
                    fill="none"
                  >
                    <path 
                      d="M12 5v14M5 12h14" 
                      stroke="#888" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              ))}
            </>
          )}

          {/* Custom MCP Section */}
          <div style={{ 
            fontSize: '10px', 
            color: '#888', 
            textTransform: 'uppercase', 
            letterSpacing: '0.5px',
            marginBottom: '8px',
            paddingBottom: removedServices.length > 0 ? '8px' : '0',
            borderBottom: removedServices.length > 0 ? '1px solid #3a3a3a' : 'none',
            marginTop: removedServices.length > 0 ? '12px' : '0'
          }}>
            Custom MCP
          </div>

          <div
            style={{
              height: '28px',
              padding: '0 8px',
              background: 'transparent',
              border: '1px solid #5a5a5a',
              borderRadius: '8px',
              transition: 'all 150ms ease',
              cursor: 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              opacity: 0.5
            }}
          >
            <div style={{
              width: '12px',
              height: '12px',
              borderRadius: '2px',
              background: 'linear-gradient(135deg, #666 0%, #444 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <svg width="8" height="8" viewBox="0 0 24 24" fill="none">
                <path d="M12 5v14M5 12h14" stroke="#888" strokeWidth="3" strokeLinecap="round"/>
              </svg>
            </div>
            <div style={{ 
              fontSize: '12px', 
              fontWeight: '500',
              color: '#666',
              flex: 1
            }}>
              Import MCP
            </div>
            <div style={{ 
              fontSize: '10px', 
              color: '#555',
              fontStyle: 'italic'
            }}>
              Soon
            </div>
          </div>
        </div>
      </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center' }}>
      <button
        onClick={(e) => {
          e.stopPropagation()
          if (onAddSourceClick) {
            onAddSourceClick()
          } else {
          setIsOpen(!isOpen)
          }
        }}
          onMouseEnter={(e) => {
            setIsAddHover(true)
            if (!isOpen) {
              e.currentTarget.style.borderColor = '#5a5a5a'
              e.currentTarget.style.color = '#e6e6e6'
            }
          }}
          onMouseLeave={(e) => {
            setIsAddHover(false)
            if (!isOpen) {
              e.currentTarget.style.borderColor = '#5a5a5a'
              e.currentTarget.style.color = '#666'
            }
          }}
          title="Add source"
          aria-label="Add source"
        data-add-mcp-button
        style={{
          position: 'relative',
          height: '32px',
          padding: '0 12px',
          borderRadius: '0px',
          border: isOpen ? '2px solid #5a5a5a' : '1px dashed #5a5a5a',
          background: isOpen 
            ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.08) 100%)'
            : 'rgba(20, 20, 20, 0.5)',
            color: isOpen ? '#e6e6e6' : '#888',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          cursor: 'pointer',
          boxShadow: isOpen
            ? '0 4px 16px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255,255,255,0.1)'
            : '0 2px 8px rgba(0,0,0,0.2)',
          transition: 'border-color 150ms ease, color 150ms ease, background-color 150ms ease, box-shadow 150ms ease',
          backdropFilter: 'blur(8px)',
          margin: 0,
          opacity: isOpen ? 1 : (isAddHover ? 0.9 : 0.7)
        }}
      >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
          <span style={{ fontSize: '12px', fontWeight: 400 }}>Source</span>
      </button>
      </div>
    </div>
  )
}