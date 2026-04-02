/* ══════════════════════════════════════════
   websocket.ts — Managed WebSocket client
   ══════════════════════════════════════════ */

import type { WSClientMessage, WSServerMessage } from '@/types/ai.types'

export type WSStatus = 'connecting' | 'open' | 'closed' | 'error'

export interface ManagedWebSocket {
  send:  (msg: WSClientMessage) => void
  close: () => void
  status: () => WSStatus
}

const WS_BASE = (() => {
  const url = import.meta.env.VITE_API_URL ?? window.location.origin
  return url.replace(/^http/, 'ws')
})()

/**
 * Create a managed WebSocket that:
 * - Reconnects on abnormal close (up to maxRetries)
 * - Sends keepalive pings every 15s
 * - Parses JSON messages and calls onMessage
 * - Queues messages sent before the socket is open
 */
export function createWebSocket(options: {
  path:       string     // e.g. "/ws/tictactoe/session-123"
  onMessage:  (msg: WSServerMessage) => void
  onStatusChange?: (status: WSStatus) => void
  maxRetries?: number
}): ManagedWebSocket {
  const { path, onMessage, onStatusChange, maxRetries = 3 } = options

  let ws: WebSocket | null = null
  let retries = 0
  let status: WSStatus = 'connecting'
  let pingInterval: ReturnType<typeof setInterval> | null = null
  const queue: WSClientMessage[] = []

  function setStatus(s: WSStatus) {
    status = s
    onStatusChange?.(s)
  }

  function connect() {
    ws = new WebSocket(`${WS_BASE}${path}`)
    setStatus('connecting')

    ws.onopen = () => {
      setStatus('open')
      retries = 0
      // flush queued messages
      while (queue.length) {
        const msg = queue.shift()!
        ws!.send(JSON.stringify(msg))
      }
      // keepalive
      pingInterval = setInterval(() => {
        if (ws?.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'ping' }))
        }
      }, 15_000)
    }

    ws.onmessage = evt => {
      try {
        const data = JSON.parse(evt.data) as WSServerMessage
        onMessage(data)
      } catch {
        // ignore malformed frames
      }
    }

    ws.onclose = evt => {
      if (pingInterval) { clearInterval(pingInterval); pingInterval = null }
      // 1000 = normal close, don't retry
      if (evt.code !== 1000 && retries < maxRetries) {
        retries++
        setStatus('connecting')
        setTimeout(connect, 1000 * retries)
      } else {
        setStatus('closed')
      }
    }

    ws.onerror = () => {
      setStatus('error')
    }
  }

  connect()

  return {
    send: (msg: WSClientMessage) => {
      if (ws?.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(msg))
      } else {
        queue.push(msg)
      }
    },
    close: () => {
      if (pingInterval) clearInterval(pingInterval)
      ws?.close(1000, 'client-closed')
    },
    status: () => status,
  }
}
