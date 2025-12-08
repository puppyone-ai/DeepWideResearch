'use client'

import React, { useState } from 'react'

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

export interface MCPButtonProps {
  service: McpService
  onServiceChange: (service: McpService) => void
}

interface ToolResponse {
  name: string
  description?: string
}

export default function MCPButton({ service, onServiceChange }: MCPButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle')
  const [testMessage, setTestMessage] = useState('')
  const [availableTools, setAvailableTools] = useState<string[]>([])
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'connected' | 'disconnected'>('unknown')

  const handleRemoveClick = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation()
    const newService = {
      ...service,
      enabled: false,
      tools: service.tools.map(t => ({ ...t, enabled: false }))
    }
    onServiceChange(newService)
    setIsOpen(false)
  }

  // Close panel on outside click
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isOpen) {
        const target = event.target as Element
        const panel = document.querySelector(`[data-mcp-panel="${service.name}"]`)
        const button = document.querySelector(`[data-mcp-button="${service.name}"]`)
        
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
  }, [isOpen, service.name])

  const handleToolToggle = (toolIndex: number) => {
    const newService = { ...service }
    
    // Toggle tool status
    newService.tools = newService.tools.map((t, i) => 
      i === toolIndex ? { ...t, enabled: !t.enabled } : t
    )
    
    // If any tool is enabled, service should also be enabled
    newService.enabled = newService.tools.some(t => t.enabled)
    
    onServiceChange(newService)
  }

  const handleTestConnection = async () => {
    setTestStatus('testing')
    setTestMessage('Testing connection...')
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const response = await fetch(`${apiUrl}/api/mcp/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          services: [service.name]
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      const serviceStatus = data.services[0]

      if (serviceStatus.available) {
        setTestStatus('success')
        setConnectionStatus('connected')
        setTestMessage(`✅ Connected! Found ${serviceStatus.tools.length} tool(s)`)
        setAvailableTools(serviceStatus.tools.map((t: ToolResponse) => t.name))
        
        // Update tool list to actual available tools (if backend returned different tools)
        const actualTools = serviceStatus.tools.map((t: ToolResponse) => ({
          name: t.name,
          enabled: true,
          description: t.description || ''
        }))
        
        onServiceChange({
          ...service,
          enabled: true,
          tools: actualTools
        })
      } else {
        setTestStatus('error')
        setConnectionStatus('disconnected')
        setTestMessage(serviceStatus.error || 'Connection failed')
      }
    } catch (error) {
      setTestStatus('error')
      setConnectionStatus('disconnected')
      setTestMessage(error instanceof Error ? error.message : 'Test failed')
    }
  }

  // Auto-test once when component mounts
  React.useEffect(() => {
    handleTestConnection()
  }, [])

  return (
    <div style={{ position: 'relative' }}>
      {/* MCP Tool Panel */}
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
        data-mcp-panel={service.name}
      >
        <div style={{ padding: '14px' }}>
          {/* Header */}
          <div style={{ 
            marginBottom: '12px',
            paddingBottom: '8px',
            borderBottom: '1px solid #3a3a3a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ 
              fontSize: '10px', 
              color: '#888', 
              textTransform: 'uppercase', 
              letterSpacing: '0.5px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
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
              {service.name} Tools
              {/* Status Indicator */}
              <div 
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: connectionStatus === 'connected' 
                    ? '#4ade80'
                    : connectionStatus === 'disconnected'
                    ? '#ef4444'
                    : '#888',
                  boxShadow: connectionStatus === 'connected'
                    ? '0 0 6px rgba(74, 222, 128, 0.6)'
                    : 'none',
                  animation: testStatus === 'testing' ? 'pulse 1.5s ease-in-out infinite' : 'none'
                }}
                title={connectionStatus === 'connected' ? 'Connected' : connectionStatus === 'disconnected' ? 'Disconnected' : 'Unknown'}
              />
            </div>
            
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {/* Refresh Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleTestConnection()
                        }}
                        disabled={testStatus === 'testing'}
                        title="Refresh connection status"
                        style={{
                          width: '18px',
                          height: '18px',
                          borderRadius: '9px',
                          border: 'none',
                          background: 'transparent',
                          color: testStatus === 'testing' ? '#888' : '#bbb',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: testStatus === 'testing' ? 'not-allowed' : 'pointer',
                          padding: 0,
                          transition: 'all 150ms ease',
                          opacity: testStatus === 'testing' ? 0.6 : 0.8
                        }}
                        onMouseEnter={(e) => {
                          if (testStatus !== 'testing') {
                            e.currentTarget.style.opacity = '1'
                            e.currentTarget.style.color = '#e6e6e6'
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.opacity = '0.8'
                          e.currentTarget.style.color = '#bbb'
                        }}
                      >
                        <svg 
                          width="12" 
                          height="12" 
                          viewBox="0 0 24 24" 
                          fill="none"
                          style={{
                            animation: testStatus === 'testing' ? 'spin 1s linear infinite' : 'none'
                          }}
                        >
                          <path 
                            d="M1 4v6h6M23 20v-6h-6" 
                            stroke="currentColor" 
                            strokeWidth="2" 
                            strokeLinecap="round" 
                            strokeLinejoin="round"
                          />
                          <path 
                            d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" 
                            stroke="currentColor" 
                            strokeWidth="2" 
                            strokeLinecap="round" 
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>
                      
                      {/* Remove Button */}
                      <button
                        onClick={handleRemoveClick}
                        title={`Remove ${service.name}`}
                        style={{
                          width: '18px',
                          height: '18px',
                          borderRadius: '9px',
                          border: 'none',
                          background: 'transparent',
                          color: '#bbb',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          padding: 0,
                          transition: 'all 150ms ease',
                          opacity: 0.8
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.opacity = '1'
                          e.currentTarget.style.color = '#ef4444'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.opacity = '0.8'
                          e.currentTarget.style.color = '#bbb'
                        }}
                      >
                        <svg 
                          width="12" 
                          height="12" 
                          viewBox="0 0 24 24" 
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                        >
                          <path d="M6 6L18 18M6 18L18 6" />
                        </svg>
                      </button>
                    </div>
            <style>{`
              @keyframes spin { to { transform: rotate(360deg); } }
              @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.3; }
              }
            `}</style>
          </div>

          {/* Tools List */}
          {service.tools.map((tool, toolIndex) => (
            <div
              key={tool.name}
              style={{
                marginBottom: toolIndex < service.tools.length - 1 ? '4px' : '0',
                height: '28px',
                padding: '0 8px',
                background: tool.enabled ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                border: `1px solid ${tool.enabled ? '#3a3a3a' : 'transparent'}`,
                borderRadius: '8px',
                transition: 'all 150ms ease',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
              onClick={(e) => {
                e.stopPropagation()
                handleToolToggle(toolIndex)
              }}
            >
              <div style={{ 
                fontSize: '12px', 
                fontWeight: '500',
                color: tool.enabled ? '#e6e6e6' : '#888',
                flex: 1
              }}>
                {tool.name}
              </div>
              {/* Checkmark Icon */}
              {tool.enabled && (
                <svg 
                  width="12" 
                  height="12" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  style={{ flexShrink: 0 }}
                >
                  <path 
                    d="M5 13l4 4L19 7" 
                    stroke="#4ade80" 
                    strokeWidth="2.5" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </div>
          ))}

          {/* Error Message Section */}
          {connectionStatus === 'disconnected' && testMessage && (
            <div style={{
              marginTop: '12px',
              paddingTop: '12px',
              borderTop: '1px solid #3a3a3a'
            }}>
              <div style={{
                padding: '8px 10px',
                background: '#dc2626',
                borderRadius: '8px',
                fontSize: '11px',
                color: '#fff',
                lineHeight: '1.5'
              }}>
                <div style={{ 
                  fontWeight: '600',
                  marginBottom: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                    <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  Connection Failed
                </div>
                <div style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: '10px' }}>
                  {testMessage}
                </div>
              </div>
            </div>
          )}

          {/* Success Message Section */}
          {connectionStatus === 'connected' && availableTools.length > 0 && (
            <div style={{
              marginTop: '12px',
              paddingTop: '12px',
              borderTop: '1px solid #3a3a3a'
            }}>
              <div style={{
                padding: '6px 10px',
                background: '#16a34a',
                borderRadius: '6px',
                fontSize: '10px',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Connected • {availableTools.length} tool{availableTools.length > 1 ? 's' : ''} available
              </div>
            </div>
          )}

        </div>
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation()
          // Toggle tool panel visibility
          setIsOpen(!isOpen)
        }}
        title={`Source: ${service.name}`}
        aria-label={`Source: ${service.name}`}
        data-mcp-button={service.name}
        style={{
          position: 'relative',
          height: '32px',
          padding: '0 12px',
          borderRadius: '0px',
          border: isOpen
            ? '2px solid #5a5a5a'
            : '1px solid #3a3a3a',
          background: isOpen
            ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.08) 100%)' 
            : 'rgba(20, 20, 20, 0.9)',
          color: isOpen ? '#e6e6e6' : '#bbb',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          cursor: 'pointer',
          boxShadow: isOpen
            ? '0 4px 16px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255,255,255,0.1)' 
            : '0 2px 8px rgba(0,0,0,0.3)',
          transition: 'border-color 150ms ease, color 150ms ease, background-color 150ms ease, box-shadow 150ms ease',
          backdropFilter: 'blur(8px)',
          margin: 0,
          zIndex: 11
        }}
        onMouseEnter={(e) => {
          if (!isOpen) {
            e.currentTarget.style.borderColor = '#5a5a5a'
            e.currentTarget.style.color = '#e6e6e6'
          }
        }}
        onMouseLeave={(e) => {
          if (!isOpen) {
            e.currentTarget.style.borderColor = '#3a3a3a'
            e.currentTarget.style.color = '#bbb'
          }
        }}
      >
        <img 
          src={service.name === 'Tavily' ? '/tavilylogo.png' : '/exalogo.png'}
          alt={`${service.name} logo`}
          style={{
            width: '14px',
            height: '14px',
            borderRadius: '0px',
            objectFit: 'contain'
          }}
        />
        <span
          style={{
            fontSize: '12px',
            color: isOpen ? '#e6e6e6' : '#888'
          }}
        >
          {service.name}
        </span>
        {/* Minimal corner status dot */}
        {connectionStatus === 'connected' && (
          <div style={{
            position: 'absolute',
            top: '-4px',
            right: '-4px',
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: '#4ade80',
            boxShadow: '0 0 0 1.5px rgba(20, 20, 20, 0.9)'
          }} />
        )}
        {connectionStatus === 'disconnected' && (
          <div style={{
            position: 'absolute',
            top: '-4px',
              right: '-4px',
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: '#ef4444',
            boxShadow: '0 0 0 1.5px rgba(20, 20, 20, 0.9)'
          }} />
        )}
      </button>
    </div>
  )
}
