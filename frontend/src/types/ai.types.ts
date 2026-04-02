export interface StepDict {
  step_id: number
  algorithm: string
  action: string
  state: unknown
  score: number | null
  depth: number | null
  pruned: boolean
  best_so_far: unknown
  explanation: string
  h_breakdown?: Record<string, number>
}

export type WSClientMessage =
  | { type: 'pause' }
  | { type: 'resume' }
  | { type: 'set_speed'; delay_ms: number }
  | { type: 'request_hint' }
  | { type: 'make_move'; position: number[] }
  | { type: 'ping' }

export type WSServerMessage =
  | StepDict
  | { type: 'done'; best_move: number | null; total_steps: number }
  | { type: 'error'; message: string }
  | { type: 'pong' }

export interface AIStreamState {
  steps: StepDict[]
  currentStep: StepDict | null
  isStreaming: boolean
  isDone: boolean
  error: string | null
}
