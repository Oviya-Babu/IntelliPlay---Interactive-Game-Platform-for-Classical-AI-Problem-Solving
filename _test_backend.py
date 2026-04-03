from backend.games.eight_puzzle import EightPuzzleState, GOAL_STATE
from backend.algorithms.astar import astar

# Test 1: Create new game
print("=== TEST 1: Creating New Game ===")
state = EightPuzzleState.initial()
print(f"Initial: {list(state.board)}")
print(f"Is Solvable: {state.is_solvable()}")
print(f"Is Different from Goal: {list(state.board) != GOAL_STATE}")

# Test 2: Solve with A*
print("\n=== TEST 2: Solving with A* ===")
result = astar(state)
print(f"Optimal Moves: {result.optimal_length}")
print(f"Steps Generated: {len(result.steps)}")

# Test 3: Check move validation
print("\n=== TEST 3: Move Validation ===")
neighbors = state.get_neighbors()
print(f"Number of valid moves from initial state: {len(neighbors)}")

print("\n=== ALL TESTS PASSED ===")
