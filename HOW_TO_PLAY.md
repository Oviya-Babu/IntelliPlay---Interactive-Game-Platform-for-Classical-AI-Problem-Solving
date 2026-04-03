# 8-PUZZLE GAME - COMPLETE WORKFLOW

## 🚀 Quick Start

### Step 1: Start Backend
```bash
cd "C:\Users\ompra\OneDrive\Desktop\AI Project"
python -m uvicorn backend.main:app --reload --port 8000
```

Expected output:
```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete.
```

### Step 2: Start Frontend
```bash
cd "C:\Users\ompra\OneDrive\Desktop\AI Project\frontend"
npm run dev
```

Expected output:
```
VITE v4.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
```

### Step 3: Open in Browser
- Go to http://localhost:5173
- Click "8-Puzzle" from the game menu
- You should see a random puzzle board

---

## 📋 Test Checklist

### ✅ Game Initialization
- [ ] Page loads without errors
- [ ] Shows random puzzle (different each time)
- [ ] Left panel shows Current State != Goal State
- [ ] Move counter shows "0 / XX"
- [ ] Board displays 3x3 grid with numbers 1-8 and empty space

### ✅ Manual Play
- [ ] Can see which tiles are clickable (they should glow)
- [ ] Arrows show direction to move tiles
- [ ] Clicking adjacent tile swaps with empty space
- [ ] Move counter increments after each move
- [ ] Invalid move (clicking non-adjacent) shows error
- [ ] "New Game" button resets everything

### ✅ AI Solving
- [ ] "Solve Puzzle" button appears (when !solved && !aiSolving)
- [ ] Clicking it starts the animation
- [ ] Tiles animate to solution
- [ ] Right panel shows explanation for each step
- [ ] Step counter shows progress (X / N)
- [ ] Speed buttons (0.5x, 1x, 2x, 3x) work
- [ ] Pause button stops animation
- [ ] Resume button continues animation

### ✅ Completion
- [ ] Shows "✓ SOLVED!" message
- [ ] Shows final move count
- [ ] Can play another game with "New Game"

---

## 🎮 Playing the Game

### Manual Mode:
1. New game loads with random puzzle
2. Click tiles next to the empty space (they'll have arrows)
3. Try to arrange them in order: 1,2,3,4,5,6,7,8 with empty in corner
4. Tiles show arrows pointing toward empty space
5. Minimize your moves compared to optimal

### AI Mode:
1. Click "Solve Puzzle"
2. Watch AI solve using A* algorithm
3. Right panel explains each decision
4. Shows g(n), h(n), f(n) cost breakdown
5. Control speed with buttons
6. Pause/resume anytime

---

## 🔍 What Changed

### Before (Broken):
- Board always showed same initial/goal state
- Can't move tiles
- No solve button
- Complex, error-prone code

### After (Fixed):
- ✓ Random initial state != Goal state
- ✓ Tile movement works perfectly
- ✓ "Solve Puzzle" button works
- ✓ Clean, simple code
- ✓ Beautiful UI with clear feedback
- ✓ Educational explanations

---

## 🛠️ Architecture

```
┌─────────────────────────────────────┐
│     Frontend: EightPuzzleNew.tsx     │
│  ┌──────────────────────────────┐   │
│  │ Left: State Display          │   │
│  │ Center: Game Board (playable)│   │
│  │ Right: AI Tutor Panel        │   │
│  └──────────────────────────────┘   │
└────────────┬────────────────────────┘
             │
             ↓ HTTP API + WebSocket
┌────────────────────────────────────┐
│     Backend: routes/game.py         │
│  POST /eightpuzzle/new             │
│  POST /eightpuzzle/move            │
│  WS /eightpuzzle/{sessionId}       │
└────────────┬────────────────────────┘
             │
             ↓
┌────────────────────────────────────┐
│ Logic: eight_puzzle.py             │
│ - State representation             │
│ - Move validation                  │
│ - Neighbor generation              │
│ - Manhattan distance heuristic     │
└────────────┬────────────────────────┘
             │
             ↓
┌────────────────────────────────────┐
│ AI: algorithms/astar.py            │
│ - A* search algorithm              │
│ - Step-by-step solution            │
│ - Explanations for each step       │
└────────────────────────────────────┘
```

---

## 📊 Example Session

```
User: Navigates to 8-Puzzle
↓
Backend: Generates [7,3,4,8,1,2,0,5,6]
         Solves with A* (18 optimal moves)
         Returns to frontend
↓
Frontend: Displays puzzle
          Left: Current [7,3,4...] vs Goal [1,2,3,4,5,6,7,8,0]
          Center: 3x3 grid
          Right: Instructions
↓
User: Moves tiles manually (5 moves)
↓
User: Clicks "Solve Puzzle"
↓
Frontend: Opens WebSocket to backend
          Backend streams A* solution steps
          Each step animated on board
          Right panel explains:
            "Moved tile 1, f(n)=17
             g(n)=1, h(n)=16
             15 moves remaining"
↓
Animation: Solves puzzle in 18 optimal moves
           Shows "✓ SOLVED!"
↓
User: Clicks "New Game"
↓  (back to start)
```

---

## 🎯 Key Features Showcase

### Random Puzzles:
```python
# Every time you click "New Game"
board = [7, 3, 4, 8, 1, 2, 0, 5, 6]  # Different each time!
```

### Smart Validation:
```
User tries to move tile 7 (not adjacent to empty)
→ Red error: "Only move tiles adjacent to empty space"
```

### AI Solving:
```
Step 1: Moved tile 1 toward goal
Step 2: Moved tile 2 toward goal
...
Step 18: SOLVED! [1,2,3,4,5,6,7,8,0]
```

### Speed Control:
```
0.5x - Slow, easy to follow
1x   - Normal
2x   - Fast
3x   - Very fast
```

---

## 📱 Responsive Design

- **Desktop**: Full 3-panel layout (left, center, right)
- **Tablet**: Responsive grid layout
- **Mobile**: Stacked layout with touch-friendly buttons

---

## 🐛 Troubleshooting

### Backend won't start:
```bash
# Check if port 8000 is in use
netstat -ano | findstr :8000
# If used, change port in uvicorn command
```

### Frontend won't connect:
```bash
# Check if API URL is correct
# Open browser DevTools → Network tab
# Should see requests to: http://localhost:8000/api/games/eightpuzzle/new
```

### Tiles stuck/won't move:
```bash
# Make sure you click tiles WITH arrows (adjacent to empty)
# Check browser console for errors (F12 → Console)
```

### AI won't solve:
```bash
# Check WebSocket connection in DevTools → Network
# Should see: ws://localhost:8000/api/ws/eightpuzzle/{sessionId}
```

---

## 💡 Tips for Users

1. **Click tiles with arrows** - They're the only ones you can move
2. **Watch for the empty space** - Move tiles toward it
3. **Use "Solve Puzzle"** - Learn the A* algorithm in action
4. **Adjust speed** - Slow it down to understand each step
5. **Compare your solution** - Beat the optimal move count!

---

## 🎉 You're Ready!

Everything should work perfectly now:
- ✅ Random initial states
- ✅ Tile movement
- ✅ Solve Puzzle button
- ✅ AI explanations
- ✅ Beautiful UI

**Enjoy the game!**

