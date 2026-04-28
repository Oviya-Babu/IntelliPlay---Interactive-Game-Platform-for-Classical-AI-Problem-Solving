import { useState, useEffect, useRef, useCallback } from 'react'
import type { StepDict, WSClientMessage } from '@/types/ai.types'

export function useAIStream(sessionId: string | null, wsPath: string = 'tictactoe') {
  const [steps, setSteps] = useState<StepDict[]>([])
  const [currentStep, setCurrentStep] = useState<StepDict | null>(null)
  const [isStreaming, setIsStreaming] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<number | null>(null)
  const shouldReconnectRef = useRef(true)

  const connect = useCallback(() => {
    if (!sessionId) return
    
    setIsStreaming(true)
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const url = `${protocol}//${window.location.host}/ws/${wsPath}/${sessionId}`
    const ws = new WebSocket(url)
    wsRef.current = ws

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.type === 'done') {
          setIsStreaming(false)
          // ✅ Mark that we received "done" message - don't auto-reconnect
          shouldReconnectRef.current = false
        } else if (data.type === 'error') {
          setIsStreaming(false)
          console.error('WS Error:', data.message)
        } else if (data.type === 'pong') {
          // ignore
        } else {
          // StepDict
          setSteps(prev => [...prev, data as StepDict])
          setCurrentStep(data as StepDict)
        }
      } catch (e) {
        console.error('Error parsing WS message', e)
      }
    }

    ws.onclose = () => {
      setIsStreaming(false)
      // ✅ Auto-reconnect only if we haven't received "done" message
      // and only if should reconnect flag is true
      if (shouldReconnectRef.current && sessionId) {
        reconnectTimeoutRef.current = window.setTimeout(() => {
          if (wsRef.current?.readyState === WebSocket.CLOSED && sessionId && shouldReconnectRef.current) {
            console.log('[AI STREAM] Auto-reconnecting...')
            connect()
          }
        }, 2000)
      }
    }
    
    ws.onerror = () => {
      ws.close()
    }
  }, [sessionId])

  useEffect(() => {
    if (sessionId) {
      // Reset connection flags for new session
      shouldReconnectRef.current = true
      setSteps([])
      setCurrentStep(null)
      connect()
    }
    return () => {
      // ✅ Prevent auto-reconnect when effect cleanup runs
      shouldReconnectRef.current = false
      if (wsRef.current) {
        wsRef.current.close()
      }
      if (reconnectTimeoutRef.current !== null) {
        clearTimeout(reconnectTimeoutRef.current)
      }
    }
  }, [sessionId, connect])

  const sendControl = useCallback((msg: WSClientMessage) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg))
    }
  }, [])

  return {
    steps,
    currentStep,
    isStreaming,
    sendControl
  }
}
