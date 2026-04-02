"""
backend/algorithms/bfs.py
BFS search for Missionaries and Cannibals.
"""
from collections import deque
from dataclasses import dataclass
from typing import Any
from backend.games.missionaries import MissionariesState

@dataclass
class BFSResult:
    path: list[MissionariesState]
    steps: list[dict[str, Any]]
    nodes_explored: int

@dataclass
class BFSNode:
    state: MissionariesState
    path: list[MissionariesState]
    depth: int

def bfs(start: MissionariesState) -> BFSResult:
    steps = []
    
    # Queue for BFS: items are BFSNode
    start_node = BFSNode(state=start, path=[start], depth=0)
    frontier = deque([start_node])
    explored = set()
    nodes_explored = 0
    
    while frontier:
        node = frontier.popleft()
        state_tuple = (node.state.m_left, node.state.c_left, node.state.boat_side)
        
        if state_tuple in explored:
            continue
            
        explored.add(state_tuple)
        nodes_explored += 1
        
        steps.append({
            "step_id": len(steps),
            "algorithm": "bfs",
            "action": "Evaluating",
            "state": {"m_left": node.state.m_left, "c_left": node.state.c_left, "boat": node.state.boat_side},
            "score": None,
            "depth": node.depth,
            "pruned": False,
            "best_so_far": None,
            "explanation": f"Expanding level {node.depth} of my search tree. I'm methodically checking every possible state reachable in EXACTLY {node.depth} crossings before looking deeper. It's like ripples in a pond — I check the closest ripple fully before the next one. This guarantees the first solution I find is the SHORTEST possible!",
        })
            
        if node.state.is_goal():
            steps.append({
                "step_id": len(steps),
                "algorithm": "bfs",
                "action": "Best",
                "state": {"m_left": node.state.m_left, "c_left": node.state.c_left, "boat": node.state.boat_side},
                "score": None,
                "depth": node.depth,
                "pruned": False,
                "best_so_far": None,
                "explanation": f"EVERYONE'S ACROSS! Found the solution at depth {node.depth} — meaning {node.depth} crossings is the absolute minimum. I explored {nodes_explored} states to prove no shorter solution exists. BFS guarantees optimality — it's not just fast, it's provably correct!",
            })
            return BFSResult(
                path=node.path,
                steps=steps,
                nodes_explored=nodes_explored
            )
            
        for m, c in node.state.get_valid_actions():
            neighbor_state = node.state.apply_action(m, c)
            neighbor_tuple = (neighbor_state.m_left, neighbor_state.c_left, neighbor_state.boat_side)
            
            if not neighbor_state.is_valid():
                steps.append({
                    "step_id": len(steps),
                    "algorithm": "bfs",
                    "action": "Pruned",
                    "state": {"m_left": neighbor_state.m_left, "c_left": neighbor_state.c_left, "boat": neighbor_state.boat_side},
                    "score": None,
                    "depth": node.depth + 1,
                    "pruned": True,
                    "best_so_far": None,
                    "explanation": f"Nope! State ({m}M, {c}C) is illegal — cannibals would outnumber missionaries. Pruned. This is constraint checking in action — I eliminate impossible states BEFORE exploring them!",
                })
            elif neighbor_tuple not in explored:
                steps.append({
                    "step_id": len(steps),
                    "algorithm": "bfs",
                    "action": "Valid",
                    "state": {"m_left": neighbor_state.m_left, "c_left": neighbor_state.c_left, "boat": neighbor_state.boat_side},
                    "score": None,
                    "depth": node.depth + 1,
                    "pruned": False,
                    "best_so_far": None,
                    "explanation": f"State ({m}M, {c}C, boat={neighbor_state.boat_side}) is valid! ✓ Missionaries safe: {neighbor_state.m_left} ≥ {neighbor_state.c_left} on left, {3-neighbor_state.m_left} ≥ {3-neighbor_state.c_left} on right. Adding to queue. Current queue size: {len(frontier)+1} states to explore.",
                })
                new_node = BFSNode(
                    state=neighbor_state,
                    path=node.path + [neighbor_state],
                    depth=node.depth + 1
                )
                frontier.append(new_node)
                
    return BFSResult(path=[], steps=steps, nodes_explored=nodes_explored)
