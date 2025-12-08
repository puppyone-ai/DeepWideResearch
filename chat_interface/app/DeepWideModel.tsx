'use client'

import React, { useState, useRef, useLayoutEffect } from 'react'
import { useAccountData } from './context/AccountDataContext'
import { createPortal } from 'react-dom'

import { Lock } from 'lucide-react'

export interface DeepWideModelProps {
  researchParams: { deep: number; wide: number; model?: string }
  onResearchParamsChange: (value: { deep: number; wide: number; model?: string }) => void
  menuDirection?: 'up' | 'down'
  isPro?: boolean
}

const AVAILABLE_MODELS = [
  { label: 'Gemini 3 Pro', value: 'google/gemini-3-pro-preview' },
  { label: 'GPT 5.1', value: 'openai/gpt-5.1' },
  { label: 'Claude Opus 4.5', value: 'anthropic/claude-opus-4.5' }
]

export default function DeepWideModel({
  researchParams,
  onResearchParamsChange,
  menuDirection = 'up',
  isPro: _deprecatedIsPro // unused
}: DeepWideModelProps) {
  const { plan } = useAccountData()
  const isPaidPlan = plan === 'plus' || plan === 'pro' || plan === 'enterprise'

  const [isDeepWideHover, setIsDeepWideHover] = useState(false)
  const [isModelHover, setIsModelHover] = useState(false)
  const [showModelMenu, setShowModelMenu] = useState(false)
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null)
  const [upsellVisible, setUpsellVisible] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const [upsellType, setUpsellType] = useState<'deep' | 'wide' | null>(null)
  const [snapBackType, setSnapBackType] = useState<'deep' | 'wide' | null>(null)
  const deepBlocksRef = useRef<HTMLDivElement>(null)
  const wideBlocksRef = useRef<HTMLDivElement>(null)
  const modelMenuRef = useRef<HTMLDivElement>(null)
  const portalMenuRef = useRef<HTMLDivElement>(null)
  const upsellTimer = useRef<NodeJS.Timeout | null>(null)
  const closeTimer = useRef<NodeJS.Timeout | null>(null)

  // Close model menu on outside click (supports portal menu)
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      const insideTrigger = !!modelMenuRef.current && modelMenuRef.current.contains(target)
      const insidePortalMenu = !!portalMenuRef.current && portalMenuRef.current.contains(target)
      if (insideTrigger || insidePortalMenu) return
      setShowModelMenu(false)
      setIsModelHover(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])


  // Position the dropdown in a portal (avoid clipping by overflow/stacking contexts)
  useLayoutEffect(() => {
    if (!showModelMenu) return
    const updatePosition = () => {
      if (!modelMenuRef.current) return
      const rect = modelMenuRef.current.getBoundingClientRect()
      let top = menuDirection === 'up' ? rect.top : rect.bottom
      // Add small offset
      top += menuDirection === 'up' ? -4 : 4
      setMenuPosition({ top, left: rect.left })
      // If menuDirection is up, adjust by menu height after first render
      if (menuDirection === 'up' && portalMenuRef.current) {
        const h = portalMenuRef.current.getBoundingClientRect().height
        setMenuPosition({ top: rect.top - h - 4, left: rect.left })
      }
    }
    updatePosition()
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [showModelMenu, menuDirection])

  const triggerUpsell = (type: 'deep' | 'wide') => {
    setSnapBackType(type)
    setUpsellType(type)
    setUpsellVisible(true)
    setIsClosing(false)
    
    // Clear previous timers
    if (upsellTimer.current) clearTimeout(upsellTimer.current)
    if (closeTimer.current) clearTimeout(closeTimer.current)
    
    // Snap back animation visual cue
    setTimeout(() => {
      setSnapBackType(null)
    }, 200)

    // Auto hide upsell popover with fade out
    upsellTimer.current = setTimeout(() => {
      setIsClosing(true)
      closeTimer.current = setTimeout(() => {
        setUpsellVisible(false)
        setIsClosing(false)
        setUpsellType(null)
      }, 400) // Match exit animation duration (fast but gentle)
    }, 3000)
  }

  const STEPS = 4

  const getProviderLogoPath = (modelValue?: string) => {
    if (!modelValue) return '/moreMcpLogo/ChatGPT_logo.png'
    if (modelValue.startsWith('google/')) return '/gemini.png' // Gemini logo
    if (modelValue.startsWith('anthropic/')) return '/Claude.png' // Anthropic/Claude logo
    return '/moreMcpLogo/ChatGPT_logo.png' // OpenAI/ChatGPT logo
  }

  const selectedModelLabel = AVAILABLE_MODELS.find(m => m.value === researchParams.model)?.label || 'Select Model'
  const selectedLogo = getProviderLogoPath(researchParams.model)

  const handleInteract = (e: React.MouseEvent, type: 'deep' | 'wide') => {
    const ref = type === 'deep' ? deepBlocksRef : wideBlocksRef
    if (!ref.current) return
    
    const rect = ref.current.getBoundingClientRect()
    let x = e.clientX - rect.left
    x = Math.max(0, Math.min(rect.width, x))
    
    // 4 steps
    const step = Math.ceil((x / rect.width) * STEPS)
    const newValue = step / STEPS
    
    // Prevent 0 if desired, though logic above gives 1..4 if x>0. If x=0 (very left edge), step=0. 
    // Let's ensure at least 1 step is selected if that's the desired behavior, or allow 0. 
    // Usually Deep/Wide starts at 1/4? Let's stick to the ceiling logic which biases to 1..4 unless exactly 0.
    // Actually, let's just clamp to min 0.25 if needed, but let's respect user input.
    
    const finalValue = Math.max(0.25, newValue) // Ensure at least one block if clicked
    
    // Plan check: if trying to set 100% (4/4) and not on a paid plan (plus/pro/enterprise)
    if (!isPaidPlan && finalValue === 1) {
        triggerUpsell(type)
        // Snap back to 75%
        if (type === 'deep' && researchParams.deep !== 0.75) {
             onResearchParamsChange({ ...researchParams, deep: 0.75 })
        } else if (type === 'wide' && researchParams.wide !== 0.75) {
             onResearchParamsChange({ ...researchParams, wide: 0.75 })
        }
        return
    }

    if (type === 'deep') {
        if (finalValue !== researchParams.deep) {
             onResearchParamsChange({ ...researchParams, deep: finalValue })
        }
    } else {
        if (finalValue !== researchParams.wide) {
             onResearchParamsChange({ ...researchParams, wide: finalValue })
        }
    }
  }

  // New function to handle drag (mouse move while pressed)
  const handleMouseMove = (e: React.MouseEvent, type: 'deep' | 'wide') => {
      if (e.buttons === 1) {
          handleInteract(e, type)
      }
  }

  const renderGrid = (value: number, activeColor: string, type: 'deep' | 'wide') => {
    // If snapping back, show full for a moment to simulate "hit wall"
    const effectiveValue = (snapBackType === type) ? 1 : value
    const activeCount = Math.round(effectiveValue * STEPS)
    
    return (
        <div style={{ 
            display: 'flex',
            gap: '0', 
            height: '14px'
        }}>
            {Array.from({ length: STEPS }).map((_, i) => {
                const isActive = i < activeCount
                const isFirst = i === 0
                const isLast = i === STEPS - 1
                const borderColor = isActive ? activeColor : '#555'
                
                // Locked visual for 4th block if not on paid plan
                const isLockedBlock = !isPaidPlan && i === 3

                return (
                    <div 
                        key={i} 
                        style={{
                            width: '20px',
                            height: '100%',
                            backgroundColor: isActive ? activeColor : 'transparent',
                            borderTop: `1px solid ${borderColor}`,
                            borderBottom: `1px solid ${borderColor}`,
                            borderLeft: isFirst ? `1px solid ${borderColor}` : 'none',
                            borderRight: `1px solid ${borderColor}`,
                            transition: 'all 0.15s ease',
                            boxSizing: 'border-box',
                            position: 'relative',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                    </div>
                )
            })}
        </div>
    )
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      {/* Model Selector */}
      <div 
        style={{ position: 'relative' }} 
        ref={modelMenuRef}
        onMouseEnter={() => setIsModelHover(true)}
        onMouseLeave={() => setIsModelHover(false)}
      >
        <button
          onClick={() => {
            const next = !showModelMenu
            setShowModelMenu(next)
            if (!next) setIsModelHover(false)
          }}
          style={{
            fontSize: '12px',
            color: isModelHover || showModelMenu ? '#e5e5e5' : '#888',
            background: isModelHover || showModelMenu ? 'rgba(255,255,255,0.04)' : 'transparent',
            border: 'none',
            padding: '2px 8px',
            cursor: 'pointer',
            transition: 'all 150ms ease',
            fontFamily: 'inherit',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            height: '36px',
            borderRadius: '8px'
          }}
        >
          <img
            src={selectedLogo}
            alt="provider logo"
            style={{ width: '16px', height: '16px', borderRadius: '3px', objectFit: 'contain' }}
          />
          <span style={{ fontWeight: 400 }}>{selectedModelLabel}</span>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" style={{ transform: showModelMenu ? 'rotate(180deg)' : 'none', transition: 'transform 200ms' }}>
            <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        {showModelMenu && menuPosition && createPortal(
          <div
            ref={portalMenuRef}
            style={{
              position: 'fixed',
              top: `${menuPosition.top}px`,
              left: `${menuPosition.left}px`,
              background: '#1a1a1a',
              border: '1px solid #333',
              borderRadius: '8px',
              padding: '4px',
              width: '180px',
              zIndex: 10000,
              boxShadow: '0 8px 24px rgba(0,0,0,0.45)',
              display: 'flex',
              flexDirection: 'column',
              gap: '2px'
            }}
          >
            {AVAILABLE_MODELS.map((model) => (
              <div
                key={model.value}
                onClick={() => {
                  onResearchParamsChange({ ...researchParams, model: model.value })
                  setShowModelMenu(false)
                  setIsModelHover(false)
                }}
                style={{
                  padding: '8px 10px',
                  fontSize: '12px',
                  color: researchParams.model === model.value ? '#fff' : '#aaa',
                  background: researchParams.model === model.value ? 'rgba(255,255,255,0.12)' : 'transparent',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  transition: 'background 150ms',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
                onMouseEnter={(e) => {
                  if (researchParams.model !== model.value) {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
                    e.currentTarget.style.color = '#e5e5e5'
                  }
                }}
                onMouseLeave={(e) => {
                  if (researchParams.model !== model.value) {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.color = '#aaa'
                  }
                }}
              >
                <img
                  src={getProviderLogoPath(model.value)}
                  alt="provider logo"
                  style={{ width: '16px', height: '16px', borderRadius: '3px', objectFit: 'contain' }}
                />
                {model.label}
              </div>
            ))}
          </div>,
          document.body
        )}
      </div>

      <div style={{ width: '1px', height: '24px', background: '#333' }} />

      <div
        data-deepwide-inline-trigger
      onMouseEnter={() => setIsDeepWideHover(true)}
      onMouseLeave={() => setIsDeepWideHover(false)}
      title="Adjust Deep × Wide"
      style={{
        fontSize: '12px',
        color: isDeepWideHover ? '#e5e5e5' : '#888',
        fontFamily: 'inherit',
        lineHeight: '1.25',
        whiteSpace: 'pre',
        userSelect: 'none',
        transition: 'color 150ms ease, background 150ms ease',
        padding: '2px 8px',
        borderRadius: '8px',
        background: isDeepWideHover ? 'rgba(255,255,255,0.04)' : 'transparent',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: '4px',
        position: 'relative' // For upsell popover positioning
      }}
    >
      {/* Shared Upsell Popover - Anchored to the right of the container */}
      {upsellVisible && (
          <div style={{
              position: 'absolute',
              top: '50%',
              transform: 'translateY(-50%)', // Center vertically relative to the 2-row container
              left: '100%',
              marginLeft: '16px',
              background: '#4a90e2', // Brand Blue
              borderRadius: '20px',
              padding: '4px 10px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            boxShadow: '0 4px 12px rgba(74, 144, 226, 0.3)', // Soft blue glow
            zIndex: 200,
            animation: isClosing 
              ? 'fadeExit 0.4s cubic-bezier(0.32, 0, 0.67, 0) both' // Gentle fade out
              : 'popScale 0.2s cubic-bezier(0.16, 1, 0.3, 1) both', // Apple-like smooth entry
            whiteSpace: 'nowrap',
            pointerEvents: 'auto',
              cursor: 'pointer',
              height: '28px',
          }}
          onClick={(e) => {
              e.stopPropagation()
              try {
                  // Dispatch event to open dev mode
                  window.dispatchEvent(new CustomEvent('open-dev-mode'))
                  // Dispatch event to switch to plans tab
                  window.dispatchEvent(new CustomEvent('navigate-to-plans'))
              } catch {}
          }}
          >
              {/* Tiny speech bubble arrow pointing left */}
              <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '-4px',
                  marginTop: '-4px',
                  width: 0,
                  height: 0,
                  borderTop: '4px solid transparent',
                  borderBottom: '4px solid transparent',
                  borderRight: '6px solid #4a90e2',
              }} />

              <span style={{ color: '#fff', fontSize: '11px', fontWeight: 700, letterSpacing: '0.01em' }}>Unlock with Plus</span>
          </div>
      )}

      <div
        onMouseDown={(e) => handleInteract(e, 'deep')}
        onMouseMove={(e) => handleMouseMove(e, 'deep')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: 0,
          borderRadius: '6px',
          cursor: 'ew-resize'
        }}
      >
        {/* Anchored Micro-Popover for Deep removed - using shared one */}

        <span style={{ fontFamily: 'inherit', fontWeight: 400, width: '36px' }}>Deep</span>
        <div ref={deepBlocksRef}>
             {renderGrid(researchParams.deep, '#a3a3a3', 'deep')}
        </div>
        <span
          style={{
            fontFamily: 'inherit',
            display: 'inline-block',
            width: '4ch',
            textAlign: 'right',
            color: '#666',
            fontSize: '11px'
          }}
        >
          {Math.round(researchParams.deep * 100)}%
        </span>
      </div>

      {/* WIDE Row */}
      <div
        onMouseDown={(e) => handleInteract(e, 'wide')}
        onMouseMove={(e) => handleMouseMove(e, 'wide')}
        style={{
          marginTop: 0,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: 0,
          borderRadius: '6px',
          cursor: 'ew-resize'
        }}
      >
        {/* Anchored Micro-Popover for Wide removed - using shared one */}

        <span style={{ fontFamily: 'inherit', fontWeight: 400, width: '36px' }}>Wide</span>
        <div ref={wideBlocksRef}>
            {renderGrid(researchParams.wide, '#a3a3a3', 'wide')}
        </div>
        <span
          style={{
            fontFamily: 'inherit',
            display: 'inline-block',
            width: '4ch',
            textAlign: 'right',
            color: '#666',
            fontSize: '11px'
          }}
        >
          {Math.round(researchParams.wide * 100)}%
        </span>
      </div>
    </div>

      <style jsx>{`
        @keyframes popScale {
          0% { transform: translateY(-50%) scale(0.92); opacity: 0; }
          100% { transform: translateY(-50%) scale(1); opacity: 1; }
        }
        @keyframes fadeExit {
          0% { transform: translateY(-50%) scale(1); opacity: 1; }
          100% { transform: translateY(-50%) scale(0.98); opacity: 0; }
        }
      `}</style>
    </div>
  )
}
