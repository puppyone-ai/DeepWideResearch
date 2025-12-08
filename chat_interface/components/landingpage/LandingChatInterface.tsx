"use client"

import React from 'react'
import DeepWideModel from '@/app/DeepWideModel'
import Image from 'next/image'
import type { McpConfigValue } from '@/app/MCPBar'

export interface ResearchParams {
  deep: number
  wide: number
  model: string
  mcpConfig: McpConfigValue
}

export interface LandingChatInterfaceProps {
  onStartResearch?: (query: string, params: ResearchParams) => void
}

export default function LandingChatInterface({ onStartResearch }: LandingChatInterfaceProps) {
  const [researchParams, setResearchParams] = React.useState({ deep: 0.75, wide: 0.75, model: 'google/gemini-3-pro-preview' })
  const [mcpConfig, setMcpConfig] = React.useState<McpConfigValue>({
    services: [
        {
            name: 'Tavily',
            enabled: true,
            tools: [
                { name: 'web_search', enabled: true, description: 'Search the web' }
            ]
        },
        {
            name: 'Exa',
            enabled: true,
            tools: [
                { name: 'search', enabled: true, description: 'Neural search' }
            ]
        }
    ]
  })
  
  const [inputValue, setInputValue] = React.useState('')
  const [isFocused, setIsFocused] = React.useState(false)
  const fullBrandText = 'Open Deep Wide Research'
  const [brandTextDisplayed, setBrandTextDisplayed] = React.useState('')
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)
  const [suggestionIndex, setSuggestionIndex] = React.useState(0)
  // Landing page: MCP is showcase-only (no clicks/effects)
  
  // State for demo "busy"
  const [isBusy, setIsBusy] = React.useState(false)
  const visibleMcps = [
    { name: 'Tavily', logo: '/tavilylogo.png' },
    { name: 'Exa', logo: '/exalogo.png' },
  ]

  const handleSend = async () => {
    if (!inputValue.trim() || isBusy) return
    
    setIsBusy(true)
    
    // Simulate processing or navigation
    if (onStartResearch) {
        await onStartResearch(inputValue, { ...researchParams, mcpConfig })
    } else {
        // Fallback demo behavior: route to login inside this app
        setTimeout(() => {
            window.location.href = "/login"
            setIsBusy(false)
            setInputValue('')
        }, 500)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  React.useEffect(() => {
    // Animate brand text typing on mount
    setBrandTextDisplayed('')
    
    let index = 0
    const typingSpeedMs = 40
    const typeTimer = setInterval(() => {
      if (index < fullBrandText.length) {
        setBrandTextDisplayed(fullBrandText.slice(0, index + 1))
        index += 1
      } else {
        clearInterval(typeTimer)
      }
    }, typingSpeedMs)

    return () => {
      clearInterval(typeTimer)
    }
  }, [])

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
    <div className="w-full flex flex-col items-center justify-center pt-20 md:pt-40 pb-12 font-sans">
      <div className="w-full flex flex-col gap-2">
          {/* Brand header */}
          <div className="w-full flex flex-col items-center justify-center gap-3 mb-12">
            <div className="h-8 flex items-center justify-center">
            <div className="text-xl md:text-2xl lg:text-3xl font-semibold text-foreground whitespace-pre text-center font-sans">{brandTextDisplayed}</div>
            </div>
          <p className={`text-sm text-foreground/40 text-center max-w-2xl leading-relaxed font-sans transition-opacity duration-1000 ${brandTextDisplayed.length >= fullBrandText.length ? 'opacity-100' : 'opacity-0'}`}>
              Customize Deep & Wide • Customize Information Sources • Enterprise Agentic RAG
            </p>
          </div>
          
          {/* Settings row (MCP showcase-only; no interactivity) */}
          <div className="w-full max-w-[720px] mx-auto flex items-center justify-start gap-2 px-4 md:px-8 pb-1 select-none">
            <div className="flex items-center gap-2">
              {visibleMcps.map((svc) => (
                <div key={svc.name} className="relative flex items-center gap-2 border border-white/15 bg-white/[0.03] px-3 py-1.5 cursor-default">
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#2CAC58] shadow-[0_0_0_2px_rgba(10,10,10,1)]" aria-hidden />
                  <Image src={svc.logo} alt={`${svc.name} logo`} width={14} height={14} className="opacity-80" />
                  <span className="text-xs text-[#888888]">{svc.name}</span>
                </div>
              ))}
              <a href="/login" className="flex items-center gap-2 border border-dashed border-white/20 bg-transparent px-3 py-1.5 hover:bg-white/5 transition-colors">
                <span className="text-xs text-foreground/50">+ Source</span>
              </a>
            </div>
          </div>

          {/* Centered search-style input */}
          <div 
            className={`
                flex flex-col gap-2 border-2 rounded-[32px] px-4 pb-3 pt-3 w-full max-w-[720px] mx-auto transition-all duration-300
                ${isFocused ? 'border-[#4a90e2] shadow-[inset_0_2px_4px_0_rgba(0,0,0,0.06),0_0_0_2px_rgba(74,144,226,0.15)]' : 'border-[#3a3a3a] shadow-[inset_0_2px_4px_0_rgba(0,0,0,0.06)]'}
                bg-[#2a2a2a]
            `}
          >
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
              rows={1}
              className="flex-1 h-auto p-2 resize-none outline-none text-sm leading-relaxed font-sans bg-transparent text-gray-100 border-none min-h-[72px] max-h-[200px] overflow-y-auto placeholder-gray-500"
            />
            {/* Controls row: Deep/Wide bars (left) + Send button (right) */}
            <div className="flex items-center justify-between gap-2 overflow-x-auto">
              <div className="flex items-center gap-2 min-w-0 flex-shrink">
                <DeepWideModel
                  researchParams={researchParams}
                  onResearchParamsChange={(value) => setResearchParams({ ...researchParams, ...value })}
                  menuDirection="down"
                />
              </div>
              <button
                onClick={handleSend}
                disabled={!inputValue.trim() || isBusy}
                className={`
                    w-10 h-10 rounded-xl border-none flex items-center justify-center cursor-pointer transition-all flex-shrink-0
                    ${inputValue.trim() && !isBusy ? 'bg-[#4a90e2] text-white shadow-[0_4px_12px_rgba(74,144,226,0.3)]' : 'bg-[#3a3a3a] text-white opacity-30'}
                `}
              >
              {isBusy ? (
                <svg className="animate-spin h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg className="w-6 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 4L12 16M12 4L6 10M12 4L18 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                </svg>
              )}
            </button>
            </div>
          </div>
          
          {/* Visual spacer */}
          <div className="w-full max-w-[720px] mx-auto h-7" aria-hidden="true" />
      </div>
    </div>
  )
}



