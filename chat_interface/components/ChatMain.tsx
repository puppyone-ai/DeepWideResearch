'use client'

import { useState, useRef, useEffect } from 'react'
import BotMessage from './component/BotMessage'
import UserMessage from './component/UserMessage'

// Export Message interface
export interface Message {
  id: string
  content: string
  sender: 'user' | 'bot'
  timestamp: Date
  actionList?: string[] 
  sources?: { service: string; query: string; url: string }[]
}

// Add component Props interface (moved from ChatInterface)
export interface ChatMainProps {
  initialMessages?: Message[]
  isStreaming?: boolean
}

export default function ChatMain({
  initialMessages,
  isStreaming,
}: ChatMainProps = {}) {
  const messages = initialMessages ?? []
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  const [isInitialLoad, setIsInitialLoad] = useState(true)

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    const container = messagesContainerRef.current
    if (!container) return
    container.scrollTo({ top: container.scrollHeight, behavior })
  }

  // Scroll to bottom when messages change
  useEffect(() => {
    if (isInitialLoad) {
      scrollToBottom('auto')
      setIsInitialLoad(false)
    } else {
      scrollToBottom('smooth')
    }
  }, [messages.length])


  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column' as const,
        flex: 1,
        minHeight: 0,
        borderRadius: '16px'
      }}
      data-nosnippet
    >
      {/* Messages */}
      <div
        ref={messagesContainerRef}
        style={{
          flex: 1,
          overflowY: 'auto' as const,
          padding: '24px',
          backgroundColor: 'transparent',
          display: 'flex',
          flexDirection: 'column' as const,
          gap: '16px',
          borderTopLeftRadius: '16px',
          borderTopRightRadius: '16px',
          overscrollBehavior: 'contain' as const,
          maskImage: 'linear-gradient(to bottom, transparent, black 32px, black calc(100% - 32px), transparent)',
          WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 32px, black calc(100% - 32px), transparent)'
        }}
        className="puppychat-messages puppychat-history"
      >
        <div style={{ width: '100%', maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {(() => {
            // Find the last bot message index for running-state determination
            let lastBotIndex = -1
            for (let i = messages.length - 1; i >= 0; i--) {
              if (messages[i]?.sender === 'bot') { lastBotIndex = i; break }
            }

            return messages.map((message, index) => {
            return message.sender === 'bot' ? (
              <BotMessage
                key={message.id}
                message={{ ...message, content: message.content }}
                actionSteps={(message.actionList || []).map((text, stepIdx, arr) => {
                  const isLastStep = stepIdx === arr.length - 1
                  const isLatestBotMessage = index === lastBotIndex
                  const running = Boolean(isStreaming) && isLatestBotMessage && isLastStep
                  return { text, status: running ? 'running' : 'completed' }
                })}
              />
            ) : (
              <UserMessage
                key={message.id}
                message={message}
                showAvatar={false}
              />
            )
            })
          })()}
        </div>
      </div>

    </div>
  )
}
