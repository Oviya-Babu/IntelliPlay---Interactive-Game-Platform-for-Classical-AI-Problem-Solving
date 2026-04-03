"""
backend/algorithms/astar.py
A* search algorithm for 8-Puzzle.
"""
import heapq
from dataclasses import dataclass, field
from typing import Any
from backend.games.eight_puzzle import EightPuzzleState, GOAL_STATE

@dataclass
class AStarResult:
    path: list[EightPuzzleState]
    steps: list[dict[str, Any]]
    nodes_explored: int
    optimal_length: int
    h_breakdown: dict[str, int]

@dataclass(order=True)
class SearchNode:
    f: int
    h: int
    g: int
    state: EightPuzzleState = field(compare=False)
    path: list[EightPuzzleState] = field(compare=False)
    moved_tile: int = field(compare=False)
    direction: str = field(compare=False)

def astar(start: EightPuzzleState) -> AStarResult:
    """A* search algorithm for 8-Puzzle.
    Guarantees: Returns full path from start to goal [1,2,3,4,5,6,7,8,0].
    """
    steps = []
    goal = tuple(GOAL_STATE)
    
    # If already at goal, return immediate solution
    if start.board == goal:
        return AStarResult(
            path=[start],
            steps=[],
            nodes_explored=1,
            optimal_length=0,
            h_breakdown={"manhattan": 0}
        )
    
    # Priority queue: items are SearchNode (f takes priority)
    h_start = start.manhattan_distance(goal)
    start_node = SearchNode(f=h_start, h=h_start, g=0, state=start, path=[start], moved_tile=0, direction="")
    
    frontier = [start_node]
    explored = set()
    nodes_explored = 0
    
    while frontier:
        node = heapq.heappop(frontier)
        
        if node.state.board in explored:
            continue
            
        explored.add(node.state.board)
        nodes_explored += 1
        
        # Check if goal reached
        if node.state.board == goal:
            # Build steps for solution path with detailed explanations
            solution_steps = []
            for i, state in enumerate(node.path):
                if i == 0:
                    move_desc = "Starting position"
                    h_val = state.manhattan_distance(goal)
                    expl = f"Starting position. Misplaced tiles (Manhattan distance): {h_val}. Need to find path to [1,2,3,4,5,6,7,8,0]"
                elif i == len(node.path) - 1:
                    prev_state = node.path[i - 1]
                    prev_blank = prev_state.board.index(0)
                    curr_blank = state.board.index(0)
                    moved_tile = prev_state.board[curr_blank]
                    h_val = state.manhattan_distance(goal)
                    expl = f"GOAL REACHED! Moved tile {moved_tile}. Manhattan distance: {h_val} (0 = goal!). Solution found in {len(node.path) - 1} moves."
                else:
                    prev_state = node.path[i - 1]
                    prev_blank = prev_state.board.index(0)
                    curr_blank = state.board.index(0)
                    moved_tile = prev_state.board[curr_blank]
                    h_val = state.manhattan_distance(goal)
                    expl = f"Moved tile {moved_tile}. Manhattan distance now: {h_val}. {len(node.path) - 1 - i} moves remaining."
                
                solution_steps.append({
                    "step_id": i,
                    "algorithm": "a_star",
                    "action": "Goal" if i == len(node.path) - 1 else "Path",
                    "state": {"board": list(state.board)},
                    "score": -(i + h_val) if i > 0 else -h_val,
                    "depth": i,
                    "pruned": False,
                    "best_so_far": None,
                    "explanation": expl,
                    "h_breakdown": {"manhattan": h_val}
                })
            
            # DEBUG: Verify goal state
            final_state = solution_steps[-1]["state"]["board"]
            print(f"[A* SOLVER] FINAL STATE: {final_state}")
            print(f"[A* SOLVER] GOAL STATE: {GOAL_STATE}")
            print(f"[A* SOLVER] MATCH: {final_state == GOAL_STATE}")
            print(f"[A* SOLVER] Total steps: {len(solution_steps)}, Optimal moves: {len(node.path) - 1}")
            
            return AStarResult(
                path=node.path,
                steps=solution_steps,
                nodes_explored=nodes_explored,
                optimal_length=len(node.path) - 1,
                h_breakdown={"manhattan": node.h}
            )
            
        # Explore neighbors
        for neighbor_state, direction in node.state.get_neighbors():
            if neighbor_state.board not in explored:
                g = node.g + 1
                h = neighbor_state.manhattan_distance(goal)
                f = g + h
                
                # Determine which tile was moved by comparing blank positions
                blank_old = node.state.board.index(0)
                blank_new = neighbor_state.board.index(0)
                moved_tile = node.state.board[blank_new]
                
                new_node = SearchNode(
                    f=f, h=h, g=g,
                    state=neighbor_state,
                    path=node.path + [neighbor_state],
                    moved_tile=moved_tile,
                    direction=direction
                )
                heapq.heappush(frontier, new_node)
    
    # If we exhaust frontier without finding goal, return empty (shouldn't happen for solvable puzzles)
    return AStarResult(path=[], steps=[], nodes_explored=nodes_explored, optimal_length=0, h_breakdown={})
