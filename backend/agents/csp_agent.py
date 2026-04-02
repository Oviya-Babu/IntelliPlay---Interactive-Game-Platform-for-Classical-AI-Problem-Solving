"""
backend/agents/csp_agent.py
CSP Agent wrapping N-Queens and Cryptarithmetic solvers.
"""
from backend.agents.base_agent import BaseAgent
from backend.algorithms.csp import CSPResult, solve_nqueens
from backend.algorithms.cryptarith_solver import SolverResult as CryptarithResult, solve_to_stepdicts
from typing import Any



class CSPAgent(BaseAgent):
    def get_best_move(self, state: Any) -> Any:
        pass  # Not used for CSP games

    def solve_nqueens(self, n: int = 8) -> CSPResult:
        return solve_nqueens(n)

    def solve_cryptarith(self, equation: str) -> CryptarithResult:
        return solve_to_stepdicts(equation)
