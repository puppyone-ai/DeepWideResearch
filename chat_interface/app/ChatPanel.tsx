'use client'

import React from 'react'
import ChatMain, { type ChatMainProps } from '../components/ChatMain'
import MCPBar, { type McpConfigValue } from './MCPBar'
import AddSourcePanel from './AddSourcePanel'
import NewChatLanding from './NewChatLanding'
import DeepWideModel from './DeepWideModel'

export interface ChatPanelProps extends ChatMainProps {
  researchParams: { deep: number; wide: number; model?: string }
  onResearchParamsChange: (value: { deep: number; wide: number; model?: string }) => void
  mcpConfig: McpConfigValue
  onMcpConfigChange: (value: McpConfigValue) => void
  placeholder?: string
  disabled?: boolean
  onSendMessage?: (message: string, onStreamUpdate?: (content: string, isStreaming?: boolean, statusHistory?: string[]) => void) => Promise<string> | string
  style?: React.CSSProperties
}

export default function ChatPanel({
  researchParams,
  onResearchParamsChange,
  mcpConfig,
  onMcpConfigChange,
  style,
  placeholder = 'Type your message...',
  disabled = false,
  onSendMessage,
  ...chatProps
}: ChatPanelProps) {
  const [inputValue, setInputValue] = React.useState('')
  const [isFocused, setIsFocused] = React.useState(false)
  const [isStreaming, setIsStreaming] = React.useState(false)
  const [hasSentFirstMessage, setHasSentFirstMessage] = React.useState(false)
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)
  const [suggestionIndex, setSuggestionIndex] = React.useState(0)
  const [isAddSourceOpen, setIsAddSourceOpen] = React.useState(false)
  const recommendedQuestions = [
    'What were the 2025 Nobel Prizes awarded for?',
    'Explain quantum computing.',
    "What's the difference between Databricks and Snowflake?"
  ]
  React.useEffect(() => {
    const id = setInterval(() => {
      setSuggestionIndex(i => (i + 1) % recommendedQuestions.length)
    }, 3500)
    return () => clearInterval(id)
  }, [])
  // Wrapper for NewChatLanding: trigger streaming UI immediately on first send
  const handleLandingSend = async (text: string) => {
    return await performStreamingSend(text)
  }


  const handleSend = async () => {
    if (!inputValue.trim() || disabled || !onSendMessage) return
    const current = inputValue
    setInputValue('')
    await performStreamingSend(current)
  }

  const performStreamingSend = async (text: string) => {
    if (!text.trim() || disabled || !onSendMessage) return ''
    setIsStreaming(true)
    if (!hasSentFirstMessage) setHasSentFirstMessage(true)
    try {
      const result = await onSendMessage(text)
      return result
    } finally {
      setIsStreaming(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
      return
    }
    if (e.key === 'Tab' && !e.shiftKey && !inputValue.trim()) {
      e.preventDefault()
      setInputValue(recommendedQuestions[suggestionIndex])
      textareaRef.current?.focus()
    }
  }

  const inputStyles = {
    container: {
      padding: '16px 8px',
      borderBottomLeftRadius: '16px',
      borderBottomRightRadius: '16px',
      backgroundColor: 'transparent'
    },
    inner: {
      width: '100%',
      maxWidth: '900px',
      margin: '0 auto',
      paddingLeft: '32px',
      paddingRight: '32px'
    },
    wrapper: {
      display: 'flex',
      alignItems: 'flex-end',
      gap: '12px',
      border: isFocused ? '2px solid #4a90e2' : '2px solid #3a3a3a',
      borderRadius: '20px',
      padding: '8px',
      backgroundColor: '#2a2a2a',
      boxShadow: isFocused 
        ? 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06), 0 0 0 2px rgba(74, 144, 226, 0.15)' 
        : 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
      transition: 'all 0.3s ease'
    },
    textarea: {
      flex: 1,
      height: 'auto',
      padding: '8px',
      resize: 'none' as const,
      outline: 'none',
      fontSize: '16px',
      lineHeight: '1.5',
      fontFamily: 'inherit',
      backgroundColor: 'transparent',
      color: '#e5e5e5',
      border: 'none',
      minHeight: '40px',
      boxSizing: 'border-box' as const,
      maxHeight: '200px',
      overflowY: 'auto' as const
    },
    sendButton: {
      width: '40px',
      height: '40px',
      borderRadius: '12px',
      border: 'none',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      flexShrink: 0
    }
  }

  const isNewChat = !chatProps.initialMessages || chatProps.initialMessages.length === 0
  const showNewChatLanding = isNewChat && !hasSentFirstMessage

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', ...(style || {}) }}>
      <AddSourcePanel open={isAddSourceOpen} onClose={() => setIsAddSourceOpen(false)} />
      {showNewChatLanding ? (
        <NewChatLanding
          researchParams={researchParams}
          onResearchParamsChange={onResearchParamsChange}
          mcpConfig={mcpConfig}
          onMcpConfigChange={onMcpConfigChange}
          placeholder={placeholder}
          disabled={disabled}
          onSendMessage={handleLandingSend}
          externalIsStreaming={isStreaming}
        />
      ) : (
        <>
          <ChatMain
            {...chatProps}
            isStreaming={isStreaming}
          />

          {/* Inline toolbar directly above composer */}
          <div style={{
            width: '100%',
            maxWidth: '900px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-start',
            gap: '8px',
            paddingLeft: '32px',
            paddingRight: '32px'
          }}>
            {/* Inline Deep/Wide bar (match NewChatLanding styling) */}
            <DeepWideModel
              researchParams={researchParams}
              onResearchParamsChange={onResearchParamsChange}
            />
            <div style={{ width: '1px', height: '24px', background: '#333', marginLeft: '8px', marginRight: '8px' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
              <MCPBar value={mcpConfig} onChange={onMcpConfigChange} onAddSourceClick={() => setIsAddSourceOpen(true)} />
            </div>
          </div>

          {/* Composer */}
          <div style={inputStyles.container}>
            <div style={inputStyles.inner}>
              <div style={inputStyles.wrapper as React.CSSProperties}>
                <textarea
                ref={textareaRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  disabled={isStreaming || disabled}
                placeholder={''}
                  style={inputStyles.textarea}
                  className="puppychat-textarea"
                  rows={1}
                />
                <button
                  onClick={handleSend}
                  disabled={!inputValue.trim() || isStreaming || disabled}
                  style={{
                    ...inputStyles.sendButton,
                    backgroundColor: inputValue.trim() && !isStreaming ? '#4a90e2' : '#3a3a3a',
                    color: '#ffffff',
                    boxShadow: inputValue.trim() && !isStreaming ? '0 4px 12px rgba(74, 144, 226, 0.3)' : '0 2px 8px rgba(0, 0, 0, 0.2)',
                    opacity: !inputValue.trim() || isStreaming ? 0.3 : 1
                  }}
                >
                  {isStreaming ? (
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
          </div>
        </>
      )}
    </div>
  )
}


