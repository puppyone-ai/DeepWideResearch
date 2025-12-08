'use client'

import React from 'react'
import { useSession, type ChatMessage } from '../context/SessionContext'
import type { McpConfigValue } from '../MCPBar'

type ResearchParams = { deep: number; wide: number; model?: string }

export function useStreamingChat(opts: {
  researchParams: ResearchParams
  mcpConfig: McpConfigValue
  getAccessToken: () => Promise<string | null>
}) {
  const { researchParams, mcpConfig, getAccessToken } = opts

  const {
    chatHistory,
    currentSessionId,
    tempSessionId,
    createSession,
    promoteTempSession,
    switchSession,
    addMessage,
    updateMessages,
    saveSessionToBackend
  } = useSession()

  const [isStreaming, setIsStreaming] = React.useState(false)

  const send = React.useCallback(async (message: string, onStreamUpdate?: (content: string, isStreaming?: boolean, statusHistory?: string[]) => void) => {
    if (!message.trim()) return ''

    let targetSessionId = currentSessionId
    let messagesBeforePromotion: ChatMessage[] = []

    if (tempSessionId && currentSessionId === tempSessionId) {
      messagesBeforePromotion = chatHistory[tempSessionId] || []
      const firstUserMessage = message.slice(0, 60)
      targetSessionId = await promoteTempSession(firstUserMessage)
    } else if (!targetSessionId) {
      const firstUserMessage = message.slice(0, 60)
      targetSessionId = await createSession(firstUserMessage)
      await switchSession(targetSessionId)
    }

    const userMessage: ChatMessage = { role: 'user', content: message, timestamp: Date.now() }

    const currentMessages = messagesBeforePromotion.length > 0
      ? messagesBeforePromotion
      : (chatHistory[targetSessionId] || [])
    const localHistoryBefore = [...currentMessages, userMessage]

    setIsStreaming(true)
    try {
      addMessage(targetSessionId!, userMessage)

      const assistantTimestamp = Date.now()
      let assistantMessage: ChatMessage = { role: 'assistant', content: '', timestamp: assistantTimestamp, actionList: [] }
      addMessage(targetSessionId!, assistantMessage)
      let workingHistory: ChatMessage[] = [...localHistoryBefore, assistantMessage]

      const sanitizedHistory = localHistoryBefore.map((m) => ({
        role: m.role,
        content: m.content,
        timestamp: m.timestamp
      }))

      const mcp = mcpConfig.services.reduce((acc, service) => {
        if (service.enabled) {
          const enabledTools = service.tools
            .filter(tool => tool.enabled)
            .map(tool => tool.name)
          if (enabledTools.length > 0) {
            acc[service.name.toLowerCase()] = enabledTools
          }
        }
        return acc
      }, {} as Record<string, string[]>)

      const requestData = {
        message: {
          query: message,
          deepwide: {
            deep: researchParams.deep,
            wide: researchParams.wide,
            model: researchParams.model
          },
          mcp
        },
        history: sanitizedHistory
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const token = await getAccessToken()
      const response = await fetch(`${apiUrl}/api/research`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(requestData),
        cache: 'no-store'
      })

      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`)
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('No response body reader available')
      }

      const statusHistory: string[] = []
      let finalReport = ''
      let isGeneratingReport = false

      const decoder = new TextDecoder()
      let pending = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        pending += decoder.decode(value, { stream: true })
        const lines = pending.split('\n')
        pending = lines.pop() || ''

        for (const rawLine of lines) {
          const line = rawLine.trimEnd()
          if (!line.startsWith('data: ')) continue
          try {
            const data = JSON.parse(line.slice(6))
            if (data.action === 'complete' && data.final_report) {
              finalReport = data.final_report
              onStreamUpdate?.(finalReport, false, statusHistory)
              isGeneratingReport = false
              assistantMessage = { ...assistantMessage, content: finalReport, actionList: statusHistory.length > 0 ? [...statusHistory] : undefined }
              workingHistory = [...localHistoryBefore, assistantMessage]
              updateMessages(targetSessionId!, workingHistory)
            } else if (data.action === 'report_chunk') {
              finalReport = data.accumulated_report
              if (!isGeneratingReport) isGeneratingReport = true
              onStreamUpdate?.(finalReport, true, statusHistory)
              assistantMessage = { ...assistantMessage, content: finalReport, actionList: statusHistory.length > 0 ? [...statusHistory] : assistantMessage.actionList }
              workingHistory = [...localHistoryBefore, assistantMessage]
              updateMessages(targetSessionId!, workingHistory)
            } else if (data.action === 'sources_update' && Array.isArray(data.sources)) {
              assistantMessage = { ...assistantMessage, sources: data.sources }
              workingHistory = [...localHistoryBefore, assistantMessage]
              updateMessages(targetSessionId!, workingHistory)
            } else if (data.message) {
              statusHistory.push(data.message)
              if (!isGeneratingReport) {
                onStreamUpdate?.(data.message, true, statusHistory)
              }
              assistantMessage = { ...assistantMessage, actionList: [...statusHistory] }
              workingHistory = [...localHistoryBefore, assistantMessage]
              updateMessages(targetSessionId!, workingHistory)
            }
          } catch {
            // ignore malformed SSE chunks
          }
        }
      }

      const completeHistory = workingHistory
      await saveSessionToBackend(targetSessionId!, completeHistory)
      return finalReport || statusHistory[statusHistory.length - 1] || ''
    } catch (error) {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const errorMessage = `❌ Error: ${error instanceof Error ? error.message : `Failed to connect to research API. Please make sure the backend server is running at ${apiUrl}`}`
      const fallbackSessionId = currentSessionId || tempSessionId
      if (fallbackSessionId) {
        const userMessage: ChatMessage = { role: 'user', content: message, timestamp: Date.now() }
        const errorAssistantMessage: ChatMessage = { role: 'assistant', content: errorMessage, timestamp: Date.now() }
        addMessage(fallbackSessionId, userMessage)
        addMessage(fallbackSessionId, errorAssistantMessage)
        const localHistory = [...(chatHistory[fallbackSessionId] || []), userMessage, errorAssistantMessage]
        await saveSessionToBackend(fallbackSessionId, localHistory).catch(() => {})
      }
      return errorMessage
    } finally {
      setIsStreaming(false)
    }
  }, [
    chatHistory,
    currentSessionId,
    tempSessionId,
    researchParams.deep,
    researchParams.wide,
    researchParams.model,
    mcpConfig.services,
    getAccessToken,
    createSession,
    promoteTempSession,
    switchSession,
    addMessage,
    updateMessages,
    saveSessionToBackend
  ])

  return { send, isStreaming }
}


