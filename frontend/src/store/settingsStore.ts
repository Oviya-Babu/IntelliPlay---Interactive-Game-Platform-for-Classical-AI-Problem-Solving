import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SettingsState {
  playerName: string
  setPlayerName: (name: string) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      playerName: 'Player',
      setPlayerName: (name) => set({ playerName: name }),
    }),
    {
      name: 'intelliplay_settings',
    }
  )
)
