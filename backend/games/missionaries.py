"""
backend/games/missionaries.py
Missionaries and Cannibals state representation.
"""
from __future__ import annotations
from dataclasses import dataclass

@dataclass(frozen=True)
class MissionariesState:
    m_left: int
    c_left: int
    boat_side: int  # 0 for left, 1 for right

    @classmethod
    def initial(cls) -> "MissionariesState":
        return cls(m_left=3, c_left=3, boat_side=0)

    def is_goal(self) -> bool:
        return self.m_left == 0 and self.c_left == 0 and self.boat_side == 1

    def is_valid(self) -> bool:
        m_right = 3 - self.m_left
        c_right = 3 - self.c_left
        
        # Check if missionaries on left are eaten
        if self.m_left > 0 and self.c_left > self.m_left:
            return False
            
        # Check if missionaries on right are eaten
        if m_right > 0 and c_right > m_right:
            return False
            
        # Check bounds
        if self.m_left < 0 or self.m_left > 3 or self.c_left < 0 or self.c_left > 3:
            return False
            
        return True

    def get_valid_actions(self) -> list[tuple[int, int]]:
        """Returns list of (m_moved, c_moved) actions."""
        # Max capacity of boat is 2, min is 1
        possible_moves = [(1, 0), (2, 0), (0, 1), (0, 2), (1, 1)]
        valid_moves = []
        
        for m, c in possible_moves:
            # Check if we have enough people to move
            if self.boat_side == 0:
                if self.m_left >= m and self.c_left >= c:
                    valid_moves.append((m, c))
            else:
                m_right = 3 - self.m_left
                c_right = 3 - self.c_left
                if m_right >= m and c_right >= c:
                    valid_moves.append((m, c))
                    
        return valid_moves

    def apply_action(self, m: int, c: int) -> "MissionariesState":
        if self.boat_side == 0:
            return MissionariesState(self.m_left - m, self.c_left - c, 1)
        else:
            return MissionariesState(self.m_left + m, self.c_left + c, 0)
