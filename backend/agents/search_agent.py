"""
backend/agents/search_agent.py
SearchAgent wrapping A* and BFS searches for WebSocket streaming.
"""
from typing import Any
from backend.agents.base_agent import BaseAgent
from backend.algorithms.astar import astar
from backend.algorithms.bfs import bfs
from backend.games.eight_puzzle import EightPuzzleState
from backend.games.missionaries import MissionariesState

class SearchAgent(BaseAgent):
    def get_best_move(self, state: Any) -> Any:
        pass  # Unused. We are calling solve_puzzle directly for these games

    def solve_eight_puzzle(self, start: EightPuzzleState) -> Any:
        return astar(start)

    def solve_missionaries(self, start: MissionariesState) -> Any:
        return bfs(start)
