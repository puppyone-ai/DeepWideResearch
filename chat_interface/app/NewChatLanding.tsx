'use client'

import React from 'react'
import MCPBar, { type McpConfigValue } from './MCPBar'
import AddSourcePanel from './AddSourcePanel'
import DeepWideModel from './DeepWideModel'

export interface NewChatLandingProps {
  researchParams: { deep: number; wide: number; model?: string }
  onResearchParamsChange: (value: { deep: number; wide: number; model?: string }) => void
  mcpConfig: McpConfigValue
  onMcpConfigChange: (value: McpConfigValue) => void
  placeholder?: string
  disabled?: boolean
  onSendMessage?: (message: string, onStreamUpdate?: (content: string, isStreaming?: boolean, statusHistory?: string[]) => void) => Promise<string> | string
  externalIsTyping?: boolean
  externalIsStreaming?: boolean
}

export default function NewChatLanding({
  researchParams,
  onResearchParamsChange,
  mcpConfig,
  onMcpConfigChange,
  placeholder = 'Ask anything about your research topic...',
  disabled = false,
  onSendMessage,
  externalIsTyping,
  externalIsStreaming,
}: NewChatLandingProps) {
  const [inputValue, setInputValue] = React.useState('')
  const [isFocused, setIsFocused] = React.useState(false)
  const [logoEntered, setLogoEntered] = React.useState(false)
  const fullBrandText = 'Open Deep Wide Research'
  const [brandTextDisplayed, setBrandTextDisplayed] = React.useState('')
  const [isDeepWideHover, setIsDeepWideHover] = React.useState(false)
  const deepBlocksRef = React.useRef<HTMLSpanElement>(null)
  const wideBlocksRef = React.useRef<HTMLSpanElement>(null)
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)
  const [suggestionIndex, setSuggestionIndex] = React.useState(0)
  const [isAddSourceOpen, setIsAddSourceOpen] = React.useState(false)
  const [isModelHover, setIsModelHover] = React.useState(false)
  const [showModelMenu, setShowModelMenu] = React.useState(false)
  const modelMenuRef = React.useRef<HTMLDivElement>(null)

  const isBusy = !!externalIsTyping || !!externalIsStreaming

  const AVAILABLE_MODELS = [
    { label: 'GPT-5.1', value: 'openai/gpt-5' },
    { label: 'Gemini 3', value: 'google/gemini-3' },
    { label: 'o4-mini', value: 'openai/o4-mini' },
    { label: 'GPT-4o', value: 'openai/gpt-4o' }
  ]
  const selectedModelLabel = AVAILABLE_MODELS.find(m => m.value === researchParams.model)?.label || 'Select Model'

  const handleSend = async () => {
    if (!inputValue.trim() || disabled || !onSendMessage) return
    const current = inputValue
    setInputValue('')
    await onSendMessage(current)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  React.useEffect(() => {
    // Animate logo slide-in and brand text typing on mount
    setLogoEntered(false)
    setBrandTextDisplayed('')

    const enterTimer = setTimeout(() => {
      setLogoEntered(true)
    }, 0)

    let index = 0
    const typingSpeedMs = 18
    const typeTimer = setInterval(() => {
      if (index < fullBrandText.length) {
        setBrandTextDisplayed(fullBrandText.slice(0, index + 1))
        index += 1
      } else {
        clearInterval(typeTimer)
      }
    }, typingSpeedMs)

    return () => {
      clearTimeout(enterTimer)
      clearInterval(typeTimer)
    }
  }, [])

  const BAR_LEN = 12
  const STEPS = 4
  const makeBarLine = (label: 'Deep' | 'Wide', v: number) => {
    const filled = Math.round(v * BAR_LEN)
    const empty = Math.max(0, BAR_LEN - filled)
    return `${label.toUpperCase()}: ${'█'.repeat(filled)}${'░'.repeat(empty)} ${Math.round(v * 100)}%`
  }

  const makeBlocks = (v: number) => {
    const filled = Math.round(v * BAR_LEN)
    const empty = Math.max(0, BAR_LEN - filled)
    return `${'█'.repeat(filled)}${'░'.repeat(empty)}`
  }

  const recommendedQuestions = [
    'What were the 2025 Nobel Prizes awarded for?',
    'Explain quantum computing.',
    "What's the difference between Databricks and Snowflake?"
  ]

  // Rotate subtle suggestions for placeholder
  React.useEffect(() => {
    const id = setInterval(() => {
      setSuggestionIndex((i) => (i + 1) % recommendedQuestions.length)
    }, 3500)
    return () => clearInterval(id)
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
      <AddSourcePanel open={isAddSourceOpen} onClose={() => setIsAddSourceOpen(false)} />
      <div style={{
        flex: 1,
        minHeight: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}>
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Brand header */}
          <div style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            marginBottom:"48px",
            height: '32px',
            whiteSpace: 'nowrap'
          }}>
            <div style={{ fontSize: '30px', lineHeight: '32px', fontWeight: 600, color: '#e5e5e5', whiteSpace: 'pre' }}>{brandTextDisplayed}</div>
          </div>
          {/* Settings row (MCP only) */}
          <div style={{
            width: '100%',
            maxWidth: '720px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-start',
            gap: '8px',
            paddingLeft: '32px',
            paddingRight: '32px',
            paddingTop: '8px',
            paddingBottom: '0px'
          }}>
            <MCPBar value={mcpConfig} onChange={onMcpConfigChange} onAddSourceClick={() => setIsAddSourceOpen(true)} />
          </div>

          {/* Centered search-style input */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            border: isFocused ? '2px solid #4a90e2' : '2px solid #3a3a3a',
            borderRadius: '32px',
            paddingLeft:"16px",
            paddingRight:"16px",
            paddingBottom:"16px",
            paddingTop:"8px",
            backgroundColor: '#2a2a2a',
            boxShadow: isFocused
              ? 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06), 0 0 0 2px rgba(74, 144, 226, 0.15)'
              : 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
            transition: 'all 0.3s ease',
            width: '100%',
            maxWidth: '720px',
            margin: '0 auto'
          }}>
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              onKeyDown={(e) => {
                if (e.key === 'Tab' && !e.shiftKey && !inputValue.trim()) {
                  e.preventDefault()
                  setInputValue(recommendedQuestions[suggestionIndex])
                }
              }}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder={`${recommendedQuestions[suggestionIndex]}`}
              style={{
                flex: 1,
                height: 'auto',
                padding: '8px',
                resize: 'none',
                outline: 'none',
                fontSize: '16px',
                lineHeight: '1.5',
                fontFamily: 'inherit',
                backgroundColor: 'transparent',
                color: '#e5e5e5',
                border: 'none',
                minHeight: '72px',
                boxSizing: 'border-box',
                maxHeight: '200px',
                overflowY: 'auto'
              }}
              rows={1}
              className="puppychat-textarea"
            />
            {/* Controls row: Deep/Wide bars (left) + Send button (right) */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <DeepWideModel
                  researchParams={researchParams}
                  onResearchParamsChange={onResearchParamsChange}
                  menuDirection="down"
                />
              </div>
              <button
              onClick={handleSend}
              disabled={!inputValue.trim() || isBusy || disabled}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                flexShrink: 0,
                backgroundColor: inputValue.trim() && !isBusy ? '#4a90e2' : '#3a3a3a',
                color: '#ffffff',
                boxShadow: inputValue.trim() && !isBusy ? '0 4px 12px rgba(74, 144, 226, 0.3)' : '0 2px 8px rgba(0, 0, 0, 0.2)',
                opacity: !inputValue.trim() || isBusy ? 0.3 : 1
              }}
            >
              {isBusy ? (
                <svg className="puppychat-spin" style={{ height: '24px', width: '24px' }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"></circle>
                  <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg style={{ width: '24px', height: '20px' }} fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 4L12 16M12 4L6 10M12 4L18 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                </svg>
              )}
            </button>
            </div>
          </div>
          {/* Visual spacer to nudge input upward in overall centering */}
          <div
            aria-hidden="true"
            style={{
              width: '100%',
              maxWidth: '720px',
              margin: '0 auto',
              height: '28px'
            }}
          />

          {/* Subtle suggestions are provided via rotating placeholder and Tab acceptance; no visible chips */}
        </div>
      </div>
    </div>
  )
}


