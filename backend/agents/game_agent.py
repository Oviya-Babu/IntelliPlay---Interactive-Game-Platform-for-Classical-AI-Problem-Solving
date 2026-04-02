"""
backend/agents/game_agent.py
TicTacToe specific agent utilizing alpha_beta.
"""
from backend.agents.base_agent import BaseAgent
from backend.games.tictactoe import TicTacToeState
from backend.algorithms.alpha_beta import alpha_beta
from backend.algorithms.minimax import MinimaxResult

class TicTacToeAgent(BaseAgent):
    def get_best_move(self, state: TicTacToeState) -> MinimaxResult:
        is_max = state.current_player == "X"
        return alpha_beta(state, depth=0, is_max=is_max)
