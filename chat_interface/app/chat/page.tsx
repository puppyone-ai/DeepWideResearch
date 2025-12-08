'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '../supabase/SupabaseAuthProvider'
import dynamic from 'next/dynamic'
// Grid and MCP controls are composed inside ChatPanel

import DevModePanel from '../headercomponent/DevModeButton'
import MainHeaderBar from '../headercomponent/MainHeaderBar'
import { useRouter } from 'next/navigation'
import { useSession } from '../context/SessionContext'
import type { Message as UIMessage } from '../../components/ChatMain'
import { useUiMessages } from '../hooks/useUiMessages'
import { useAccountData } from '../context/AccountDataContext'
import { useStreamingChat } from '../hooks/useStreamingChat'


// Dynamically import ChatPanel (composes settings buttons and ChatInterface)
const ChatPanel = dynamic(
  () => import('../ChatPanel'),
  { ssr: false }
)

export default function Home() {
  const { getAccessToken, session, isAuthReady, supabase } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isAuthReady || session || !supabase) return
    let cancelled = false
    const confirmSession = async () => {
      try {
        const { data } = await supabase.auth.getSession()
        if (!cancelled && !data.session) {
          router.replace('/login')
        }
      } catch (error) {
        if (!cancelled) {
          router.replace('/login')
        }
      }
    }
    void confirmSession()
    return () => {
      cancelled = true
    }
  }, [isAuthReady, session, supabase, router])
  // 🎯 Use SessionContext (contains session list, message history, etc.)
  const {
    sessions,
    chatHistory,
    currentSessionId,
    tempSessionId,
    isLoading: isLoadingSessions,
    isLoadingChat,
    createSession,
    createTempSession,
    promoteTempSession,
    switchSession,
    deleteSession,
    addMessage,
    saveSessionToBackend,
    updateMessages
  } = useSession()

  // UI state
  const [researchParams, setResearchParams] = useState<{ deep: number; wide: number; model?: string }>({ 
    deep: 0.75, 
    wide: 0.75,
    model: 'google/gemini-3-pro-preview' // Default model
  })
  const [sidebarWidth, setSidebarWidth] = useState(240)
  const [isSidebarMenuOpen, setIsSidebarMenuOpen] = useState(false)
  const [isDevModeOpen, setIsDevModeOpen] = useState(false)
  const [isCreatingSession, setIsCreatingSession] = useState(false)
  const [showCreateSuccess, setShowCreateSuccess] = useState(false)
  const { balance, balanceLoading } = useAccountData()
  
  // 📜 Cache streaming history for each session (session_id -> streamingHistory[])
  const [sessionStreamingCache, setSessionStreamingCache] = useState<Record<string, string[]>>({})
  
  // 🔑 Stable key for ChatMain component, avoid re-mounting when promoting temporary session
  const [chatComponentKey, setChatComponentKey] = useState<string>('default')
  
  // Update chatComponentKey when currentSessionId changes (excluding temporary session promotion)
  const previousSessionIdRef = React.useRef<string | null>(null)
  React.useEffect(() => {
    const prev = previousSessionIdRef.current
    const current = currentSessionId
    
    // If switching from temporary session to permanent session (promotion), keep key unchanged
    const isTempPromotion = prev?.startsWith('temp-') && current && !current.startsWith('temp-')
    
    if (!isTempPromotion && current !== prev && current) {
      // Normal session switch, update key
      console.log('🔑 Updating chatComponentKey from', prev, 'to', current)
      setChatComponentKey(current)
    }
    
    previousSessionIdRef.current = current
  }, [currentSessionId])
  
  // Track currentSessionId changes
  React.useEffect(() => {
    console.log('📌 currentSessionId changed to:', currentSessionId)
  }, [currentSessionId])

  // Close Dev Mode panel on outside click
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!isDevModeOpen) return
      const target = event.target as Element
      const devPanel = document.querySelector('[data-dev-panel]')
      const devButton = document.querySelector('[data-dev-button]')
      const isClickInDev = devPanel ? devPanel.contains(target) : false
      const isClickOnDevButton = devButton ? devButton.contains(target) : false
      if (!isClickInDev && !isClickOnDevButton) {
        setIsDevModeOpen(false)
      }
    }
    
    // Listen for custom event to open Dev Mode
    const handleOpenDevMode = () => setIsDevModeOpen(true)
    window.addEventListener('open-dev-mode', handleOpenDevMode)
    document.addEventListener('mousedown', handleClickOutside)
    
    return () => {
      window.removeEventListener('open-dev-mode', handleOpenDevMode)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isDevModeOpen])
  const [mcpConfig, setMcpConfig] = useState({
    services: [
      { 
        name: 'Tavily', 
        enabled: true, 
        tools: [
          { name: 'tavily_search', enabled: true, description: 'Web search using Tavily' }
        ]
      },
      { 
        name: 'Exa', 
        enabled: true, 
        tools: [
          { name: 'web_search_exa', enabled: true, description: 'AI-powered web search using Exa' }
        ]
      }
    ]
  })

  const { send } = useStreamingChat({
    researchParams,
    mcpConfig,
    getAccessToken
  })


  // Balance now comes from AccountDataContext (single source of truth). No local fetching here.

  // Add debug info - show current parameter state
  React.useEffect(() => {
    console.log('📊 Current research params:', researchParams)
  }, [researchParams])


  // Sidebar dropdown (overlay) close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!isSidebarMenuOpen) return
      const target = event.target as Element
      const panel = document.querySelector('[data-sidebar-panel]')
      const toggle = document.querySelector('[data-sidebar-toggle]')
      if (panel && toggle) {
        const inPanel = panel.contains(target)
        const onToggle = toggle.contains(target)
        if (!inPanel && !onToggle) {
          setIsSidebarMenuOpen(false)
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isSidebarMenuOpen])

  // Map messages from Context to UI messages via hook (keeps this file lean)
  const uiMessages: UIMessage[] = useUiMessages(chatHistory, currentSessionId, sessionStreamingCache)

  // Decide whether to show a splash (logo) while chat history is loading/preparing
  const hasSession = !!currentSessionId
  const isTempSession = currentSessionId ? currentSessionId.startsWith('temp-') : false
  const hasLoadedCurrent = hasSession ? (chatHistory[currentSessionId!] !== undefined) : false
  const showChatSplash = !hasSession || (!isTempSession && !hasLoadedCurrent) || isLoadingChat

  // Handle creating new chat
  const handleCreateNewChat = async () => {
    if (isCreatingSession) return
    setIsCreatingSession(true)
    try {
      // If already has temporary session, switch to it; otherwise create new temporary session
      if (tempSessionId) {
        await switchSession(tempSessionId)
      } else {
        createTempSession()
      }
      setIsSidebarMenuOpen(false)
      // Show success feedback
      setShowCreateSuccess(true)
      setTimeout(() => setShowCreateSuccess(false), 2000)
    } finally {
      setIsCreatingSession(false)
    }
  }

  // Handle session switch (use Context's cache mechanism)
  const handleSessionClick = async (id: string) => {
    try {
      await switchSession(id) // ✅ Use Context's switchSession, automatically handle cache
      setIsSidebarMenuOpen(false)
    } catch (e) {
      console.warn('Failed to switch session:', e)
    }
  }

  // Handle session deletion
  const handleDeleteSession = async (id: string) => {
    try {
      await deleteSession(id) // ✅ Use Context's deleteSession
    } catch (e) {
      console.warn('Failed to delete session:', e)
    }
  }

  // useStreamingChat 提供的 send 函数承担完整发送/流式逻辑

  // Gate rendering to avoid flicker: wait for auth to resolve
  if (!isAuthReady) {
    return (
      <div style={{
        height: '100vh',
        width: '100vw',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0a0a0a',
        backgroundImage: 'radial-gradient(circle at 20% 80%, rgba(120, 120, 120, 0.06) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(120, 120, 120, 0.06) 0%, transparent 50%)'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <img src="/SimpleDWlogo.svg" alt="Deep Wide Research" width={52} height={52} style={{ opacity: 0.95 }} />
          <div style={{ marginTop: 4, color: '#bbb', fontSize: 12 }}>Loading…</div>
        </div>
      </div>
    )
  }

  // If not authenticated (and auth is ready), let the redirect occur without rendering chat UI
  if (!session) {
    return null
  }

  return (
    <div style={{ 
      height: '100vh', 
      width: '100vw',
      display: 'flex', 
      alignItems: 'flex-start',
      justifyContent: 'flex-start',
        padding: '24px 24px 24px 24px',
      backgroundColor: '#0a0a0a',
      backgroundImage: 'radial-gradient(circle at 20% 80%, rgba(120, 120, 120, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(120, 120, 120, 0.1) 0%, transparent 50%)',
      overflow: 'hidden',
      boxSizing: 'border-box'
    }}>
      <div style={{ 
        height: '100%', 
        width: '100%', 
        display: 'flex', 
        alignItems: 'stretch', 
        gap: '16px',
        overflow: 'hidden'
      }}>
        {/* Left side no longer occupies flex space, sessions rendered as header overlay */}

        {/* Right side chat area (limit max width to 800px) */}
        <div style={{ 
          flex: 1, 
          display: 'flex', 
          justifyContent: 'center',
          overflow: 'hidden',
          minHeight: 0
        }}>
          <div style={{ 
            width: '100%', 
            height: '100%', 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '2px',
            overflow: 'hidden',
            minHeight: 0
          }}>
            {/* Top control bar (independent width) */}
            <MainHeaderBar
              isSidebarMenuOpen={isSidebarMenuOpen}
              onToggleSidebarMenu={() => setIsSidebarMenuOpen(prev => !prev)}
              isCreatingSession={isCreatingSession}
              showCreateSuccess={showCreateSuccess}
              onCreateNewChat={handleCreateNewChat}
              sessions={sessions}
              currentSessionId={currentSessionId}
              isLoadingSessions={isLoadingSessions}
              onSessionClick={handleSessionClick}
              onDeleteSession={handleDeleteSession}
              sidebarWidth={sidebarWidth}
              isDevModeOpen={isDevModeOpen}
              onToggleDevMode={() => setIsDevModeOpen(prev => !prev)}
              balance={balance}
              balanceLoading={balanceLoading}
            />

            {/* Dev Mode Panel (aligned with header width) */}
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div style={{ width: '100%', maxWidth: '900px' }} data-dev-panel>
                <DevModePanel isOpen={isDevModeOpen} onClose={() => setIsDevModeOpen(false)} />
              </div>
            </div>

            {/* ChatMain wrapper - fill remaining space */}
            <div style={{
              flex: 1,
              minHeight: 0,
              display: 'flex',
              flexDirection: 'column'
            }}>
              {showChatSplash ? (
                <div style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <img src="/SimpleDWlogo.svg" alt="Deep Wide Research" width={52} height={52} style={{ opacity: 0.95 }} />
                </div>
              ) : (
                <ChatPanel
                  key={chatComponentKey}
                  initialMessages={uiMessages.length > 0 ? uiMessages : undefined}
                  onSendMessage={send}
                  placeholder="Ask anything about your research topic..."
                  researchParams={researchParams}
                  onResearchParamsChange={setResearchParams}
                  mcpConfig={mcpConfig}
                  onMcpConfigChange={setMcpConfig}
                  style={{ height: '100%' }}
                />
              )}
            </div>

            {/* Composer is managed inside ChatPanel */}
          </div>
        </div>
      </div>
    </div>
  )
}

