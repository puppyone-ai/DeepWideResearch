import { Copy, Check, ChevronDown, ChevronRight } from 'lucide-react'
import { useState, useEffect } from 'react'
import MarkdownRenderer from './MarkdownRenderer'
import type { Message, SourceItem } from '../types'

// Runtime CSS injection removed; animations and tooltip styles live in globals.css

export type ActionStepStatus = 'pending' | 'running' | 'completed' | 'error'

export interface ActionStep {
  id?: string
  text: string
  status?: ActionStepStatus
}

export interface BotMessageProps {
  message: Message
  actionSteps?: ActionStep[]
}

export default function BotMessage({ message, actionSteps }: BotMessageProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [copied, setCopied] = useState(false)
  const [isExpanded, setIsExpanded] = useState(true)
  const [isSourcesExpanded, setIsSourcesExpanded] = useState(true)
  const [hoveredUrl, setHoveredUrl] = useState<string | null>(null)
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 })

  // Add global mouse move listener to detect when mouse leaves link areas
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!hoveredUrl) return
      
      // Check if mouse is over any link element
      const target = e.target as HTMLElement
      const isOverLink = target.tagName === 'A' || target.closest('a')
      
      if (!isOverLink) {
        setHoveredUrl(null)
      }
    }
    
    document.addEventListener('mousemove', handleGlobalMouseMove)
    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove)
    }
  }, [hoveredUrl])

  // No-op: CSS is provided via globals.css

  const handleCopy = async () => {
    try {
      const copyPayload = message.content || ''
      if (!copyPayload) return
      await navigator.clipboard.writeText(copyPayload)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {}
  }

  const handleLinkHover = (url: string, event: React.MouseEvent) => {
    setHoveredUrl(url)
    // Position tooltip relative to the link element
    const target = event.currentTarget as HTMLElement
    const rect = target.getBoundingClientRect()
    // Position below the link with some offset
    const x = rect.left
    const y = rect.bottom + 8
    setTooltipPosition({ x, y })
  }

  const handleLinkLeave = () => {
    setHoveredUrl(null)
  }

  // Extract domain from URL for favicon
  const getFaviconUrl = (url: string) => {
    try {
      const urlObj = new URL(url)
      return `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=64`
    } catch {
      return null
    }
  }

// styles object removed; inline styles are used directly below

  // 极简：仅使用显式 props
  const resolvedActionSteps: ActionStep[] = Array.isArray(actionSteps) ? actionSteps : []
  const contentToRender = message.content || ''
  const shouldShowContent = contentToRender.length > 0
  const sources: SourceItem[] = Array.isArray(message.sources) ? message.sources : []
  const stepsBefore: ActionStep[] = resolvedActionSteps.length > 1 ? resolvedActionSteps.slice(0, -1) : []
  const lastStep: ActionStep | null = resolvedActionSteps.length > 0 ? resolvedActionSteps[resolvedActionSteps.length - 1] : null
  
  const hasReasoningOrSources = resolvedActionSteps.length > 0 || sources.length > 0

  return (
    <div 
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0px', width: '100%' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 🧠 Thinking Process Card (The "Back" Card) */}
      {hasReasoningOrSources && (
        <div style={{ 
          display: 'flex',
          flexDirection: 'column',
          width: '98%',
          background: 'transparent', // Kept minimal to recede visually
          border: '1px solid rgba(255, 255, 255, 0.05)',
          borderBottom: shouldShowContent ? 'none' : '1px solid rgba(255, 255, 255, 0.05)',
          borderRadius: shouldShowContent ? '14px 14px 0 0' : '14px',
          padding: '10px 16px 14px 16px',
          marginBottom: shouldShowContent ? '-6px' : '0',
          zIndex: 0,
          position: 'relative',
          transition: 'all 0.2s ease'
        }}>
            {/* Toggle Header */}
            <div 
              onClick={() => setIsExpanded(!isExpanded)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                cursor: 'pointer',
                userSelect: 'none',
                marginBottom: isExpanded ? '14px' : '0',
                color: 'rgba(255,255,255,0.6)',
                fontSize: '14px',
                fontWeight: 500,
                transition: 'color 0.2s',
                width: 'fit-content'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.9)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.6)'}
            >
              {/* Chevron container */}
              <div style={{ 
                width: '16px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                flexShrink: 0,
                marginLeft: '-4px'
              }}>
                {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </div>
              <span>Thinking Process</span>
              {!isExpanded && sources.length > 0 && (
                <span style={{ fontSize: '12px', opacity: 0.7, marginLeft: '4px', background: 'rgba(255,255,255,0.1)', padding: '1px 6px', borderRadius: '10px' }}>
                  {sources.length} sources
                </span>
              )}
            </div>

            {/* Collapsible Content */}
            <div style={{ 
              display: isExpanded ? 'block' : 'none', 
              width: '100%',
              animation: 'fadeIn 0.2s ease-in-out'
            }}>
              {/* 📜 执行步骤记录 - 时间线样式 */}
              {stepsBefore.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '12px', width: '100%' }}>
                  {stepsBefore.map((step, index) => {
                    const isLastItem = index === resolvedActionSteps.length - 1
                    const status: ActionStepStatus | undefined = step.status
                    const isCompleted = status === 'completed'
                    const isRunning = status === 'running'
                    const isPending = status === 'pending'
                    const isError = status === 'error'
                    return (
                      <div 
                        key={step.id ?? `action-step-${index}`}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          position: 'relative',
                          marginBottom: !isLastItem ? '12px' : '0'
                        }}
                      >
                        {/* 左侧时间线容器 */}
                        <div style={{ 
                          display: 'flex', 
                          flexDirection: 'column', 
                          alignItems: 'center',
                          flexShrink: 0,
                          position: 'relative'
                        }}>
                          {/* 圆点 */}
                          <div style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: isCompleted ? '#888' : (isError ? 'rgba(255, 107, 107, 0.35)' : 'transparent'), // 实心灰色 vs 空心灰色
                            border: isCompleted ? 'none' : (isError ? '2px solid #ff6b6b' : (isRunning ? '2px solid #888' : '2px solid #888')),
                            flexShrink: 0,
                            zIndex: 1,
                            animation: isRunning ? 'breathe 2s ease-in-out infinite' : 'none',
                            transformOrigin: 'center'
                          }} />
                          
                          {/* 连接线 - 除了最后一项都显示 */}
                          {!isLastItem && (
                            <div style={{
                              width: '2px',
                              height: '16px',
                              backgroundColor: '#666',
                              opacity: 0.4,
                              position: 'absolute',
                              top: '100%',
                              marginTop: '4px'
                            }} />
                          )}
                        </div>
                        
                        {/* 步骤文本 */}
                        <div
                          style={{
                            fontSize: '14px',
                            color: 'transparent',
                            WebkitTextFillColor: 'transparent',
                            padding: 0,
                            backgroundImage: isError
                              ? 'linear-gradient(90deg, #ff7b7b 0%, #ff9b9b 100%)'
                              : isCompleted
                                ? 'linear-gradient(90deg, #999 0%, #999 100%)'
                                : 'linear-gradient(90deg, #888 0%, #888 48%, #fff 50%, #888 52%, #888 100%)',
                            backgroundClip: 'text',
                            WebkitBackgroundClip: 'text',
                            backgroundSize: isRunning ? '200% 100%' : '100% 100%',
                            animation: isRunning ? 'textFlash 2s linear infinite' : 'none',
                            transition: 'opacity 0.3s ease-in-out',
                            opacity: isCompleted ? 0.8 : (isPending ? 0.7 : 1),
                            lineHeight: '1.5',
                            flex: 1
                          }}
                        >
                          {step.text}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
              {/* 🔗 信息源卡片 - 密集网格布局 (Dense Grid) + 渐变遮罩 (Fade Mask) */}
              {sources.length > 0 && (
                <div style={{ position: 'relative', width: '100%', marginBottom: '12px' }}>
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', // Responsive dense grid
                        gap: '8px',
                        width: '100%',
                        maxHeight: isSourcesExpanded ? 'none' : '240px', // ~3.5 rows (60px * 3.5 + gap) to show volume
                        overflow: 'hidden',
                        transition: 'max-height 0.3s ease-in-out'
                      }}
                    >
                      {sources.map((src, idx) => {
                        let domain = ''
                        try {
                          const u = new URL(src.url)
                          domain = u.hostname.replace(/^www\./, '')
                        } catch {}
                        const favicon = getFaviconUrl(src.url)
                        const mcpLogo = (() => {
                          const s = (src.service || '').toLowerCase()
                          if (s === 'tavily') return '/tavilylogo.png'
                          if (s === 'exa') return '/exalogo.png'
                          return ''
                        })()
                        // Truncate query for compact view
                        const queryPreview = (src.query || '').length > 40 ? (src.query || '').slice(0, 40) + '...' : (src.query || '')
                        const isCardHovered = hoveredUrl === src.url
                        
                        return (
                          <a
                            key={`${src.url}-${idx}`}
                            href={src.url}
                            target="_blank"
                            rel="noreferrer"
                            onMouseEnter={(e) => handleLinkHover(src.url, e)}
                            onMouseLeave={(e) => { e.stopPropagation(); handleLinkLeave() }}
                            style={{ 
                              textDecoration: 'none', 
                              display: 'block',
                              width: '100%'
                            }}
                          >
                            <div
                              style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '6px',
                                padding: '10px',
                                border: `1px solid ${isCardHovered ? 'rgba(59,130,246,0.9)' : 'rgba(255,255,255,0.12)'}`,
                                background: isCardHovered ? 'rgba(59,130,246,0.18)' : 'rgba(255,255,255,0.02)',
                                borderRadius: '8px', // Slightly sharper corners for "card stack" feel
                                transition: 'border-color 0.15s ease, background-color 0.15s ease',
                                height: '60px', 
                                justifyContent: 'space-between'
                              }}
                            >
                              {/* Top row: favicon + domain */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, width: '100%' }}>
                                {favicon && (
                                  <img
                                    src={favicon}
                                    alt="favicon"
                                    style={{ width: 14, height: 14, borderRadius: 3, flexShrink: 0, opacity: 0.8 }}
                                  />
                                )}
                                <div style={{ fontSize: '12px', color: '#d2d2d2', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, fontWeight: 500 }}>
                                  {domain || src.url}
                                </div>
                              </div>

                              {/* Bottom row: query (tiny) + MCP logo */}
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minWidth: 0, width: '100%' }}>
                                <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontStyle: 'italic', maxWidth: '85%' }}>
                                    {queryPreview ? `"${queryPreview}"` : 'Source'}
                                </span>
                                {mcpLogo && (
                                  <div
                                    style={{
                                      width: 12,
                                      height: 12,
                                      borderRadius: '50%',
                                      border: '1px solid rgba(255,255,255,0.2)',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      flexShrink: 0,
                                      background: 'rgba(255,255,255,0.03)'
                                    }}
                                  >
                                    <img
                                      src={mcpLogo}
                                      alt={`${src.service} logo`}
                                      style={{ width: 8, height: 8, objectFit: 'contain' }}
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                          </a>
                        )
                      })}
                    </div>

                    {/* 遮罩 + 展开按钮 (Show More) */}
                    {!isSourcesExpanded && sources.length > 12 && ( // > 3 rows roughly
                        <div 
                            onClick={() => setIsSourcesExpanded(true)}
                            style={{
                                position: 'absolute',
                                bottom: 0,
                                left: 0,
                                width: '100%',
                                height: '60px',
                                background: 'linear-gradient(to bottom, transparent, #0a0a0a)', // Matches thinking card background roughly (or make it darker if needed)
                                display: 'flex',
                                alignItems: 'flex-end',
                                justifyContent: 'center',
                                paddingBottom: '4px',
                                cursor: 'pointer',
                                zIndex: 2
                            }}
                        >
                            <div style={{
                                background: 'rgba(30, 30, 30, 0.9)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                padding: '4px 12px',
                                borderRadius: '12px',
                                fontSize: '11px',
                                color: '#a0a0a0',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.4)'
                            }}>
                                <ChevronDown size={12} />
                                <span>View all {sources.length} sources</span>
                            </div>
                        </div>
                    )}
                    
                    {/* 收起按钮 (Show Less) - 可选，放在最下面 */}
                    {isSourcesExpanded && sources.length > 12 && (
                        <div 
                            onClick={() => setIsSourcesExpanded(false)}
                            style={{
                                width: '100%',
                                display: 'flex',
                                justifyContent: 'center',
                                marginTop: '8px',
                                cursor: 'pointer'
                            }}
                        >
                            <div style={{
                                fontSize: '11px',
                                color: '#666',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                            }}>
                                <ChevronDown size={12} style={{ transform: 'rotate(180deg)' }} />
                                <span>Show less</span>
                            </div>
                        </div>
                    )}
                </div>
              )}

              {/* 📌 最新进度（单行） */}
              {lastStep && (
                <div style={{ display: 'flex', flexDirection: 'column', marginTop: '8px', marginBottom: '12px', width: '100%' }}>
                  {(() => {
                    const status: ActionStepStatus | undefined = lastStep.status
                    const isCompleted = status === 'completed'
                    const isRunning = status === 'running'
                    const isPending = status === 'pending'
                    const isError = status === 'error'
                    return (
                      <div 
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          position: 'relative'
                        }}
                      >
                        <div style={{ 
                          display: 'flex', 
                          flexDirection: 'column', 
                          alignItems: 'center',
                          flexShrink: 0,
                          position: 'relative'
                        }}>
                          <div style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: isCompleted ? '#888' : (isError ? 'rgba(255, 107, 107, 0.35)' : 'transparent'),
                            border: isCompleted ? 'none' : (isError ? '2px solid #ff6b6b' : (isRunning ? '2px solid #888' : '2px solid #888')),
                            flexShrink: 0,
                            zIndex: 1,
                            animation: isRunning ? 'breathe 2s ease-in-out infinite' : 'none',
                            transformOrigin: 'center'
                          }} />
                        </div>
                        <div
                          style={{
                            fontSize: '14px',
                            color: 'transparent',
                            WebkitTextFillColor: 'transparent',
                            padding: 0,
                            backgroundImage: isError
                              ? 'linear-gradient(90deg, #ff7b7b 0%, #ff9b9b 100%)'
                              : isCompleted
                                ? 'linear-gradient(90deg, #999 0%, #999 100%)'
                                : 'linear-gradient(90deg, #888 0%, #888 48%, #fff 50%, #888 52%, #888 100%)',
                            backgroundClip: 'text',
                            WebkitBackgroundClip: 'text',
                            backgroundSize: isRunning ? '200% 100%' : '100% 100%',
                            animation: isRunning ? 'textFlash 2s linear infinite' : 'none',
                            transition: 'opacity 0.3s ease-in-out',
                            opacity: isCompleted ? 0.8 : (isPending ? 0.7 : 1),
                            lineHeight: '1.5',
                            flex: 1
                          }}
                        >
                          {lastStep.text}
                        </div>
                      </div>
                    )
                  })()}
                </div>
              )}
            </div>
        </div>
      )}

      {/* 📄 Report Card (The "Front" Card) */}
      {shouldShowContent && (
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'flex-start', 
          width: '100%', 
          minWidth: 0, 
          padding: '16px 20px', 
          borderRadius: '16px', 
          border: '1px solid rgba(255, 255, 255, 0.08)',
          backgroundColor: '#18181b', // Lighter than background to pop out
          zIndex: 1,
          position: 'relative',
          boxShadow: hasReasoningOrSources ? '0 -4px 20px -5px rgba(0,0,0,0.2)' : 'none' // Slight shadow to separate
        }}>
            {/* Message content */}
            <div style={{ 
              fontSize: '16px', 
              color: '#d2d2d2', 
              whiteSpace: 'normal', 
              lineHeight: '1.6', 
              margin: 0, 
              textAlign: 'left', 
              wordBreak: 'break-word', 
              overflowWrap: 'break-word', 
              width: '100%'
            }}>
              <MarkdownRenderer
                content={(contentToRender || '').replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n')}
                onLinkEnter={(href, e) => { e.stopPropagation(); handleLinkHover(href, e) }}
                onLinkLeave={(e) => { e.stopPropagation(); handleLinkLeave() }}
                onLinkMove={(href, e) => {
                  if (hoveredUrl && href) {
                    const target = e.currentTarget as HTMLElement
                    const rect = target.getBoundingClientRect()
                    const x = rect.left
                    const y = rect.bottom + 8
                    setTooltipPosition({ x, y })
                  }
                }}
              />
            </div>
        </div>
      )}

      {/* Meta bar - 时间戳和复制按钮显示在消息框外面 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px', marginLeft: '4px', opacity: isHovered ? 0.6 : 0, transition: 'opacity 0.2s ease', justifyContent: 'flex-start', alignSelf: 'flex-start' }}>
        <div style={{ fontSize: '14px', color: '#a0a0a0' }}>
          {message.timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
        </div>
        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '20px', height: '20px', borderRadius: '4px', color: '#a0a0a0', cursor: 'pointer' }} title={copied ? 'Copied' : 'Copy message'} onClick={handleCopy}>
          {copied ? (
            <div style={{ width: '18px', height: '18px', borderRadius: '50%', backgroundColor: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Check style={{ width: '12px', height: '12px', color: '#000000' }} />
            </div>
          ) : (
            <Copy style={{ width: '14px', height: '14px' }} />
          )}
        </div>
      </div>

      {/* Link Tooltip */}
      {hoveredUrl && (
        <div
          className="link-tooltip"
          style={{
            left: `${tooltipPosition.x}px`,
            top: `${tooltipPosition.y}px`,
          }}
        >
          {getFaviconUrl(hoveredUrl) && (
            <img 
              src={getFaviconUrl(hoveredUrl) || ''} 
              alt="favicon"
              className="favicon"
            />
          )}
          <div className="url-text">{hoveredUrl}</div>
        </div>
      )}
    </div>
  )
}
