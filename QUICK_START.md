# 8-PUZZLE GAME - QUICK REFERENCE CARD

## 🎮 Start Playing

```bash
# Terminal 1: Backend
cd "C:\Users\ompra\OneDrive\Desktop\AI Project"
python -m uvicorn backend.main:app --reload --port 8000

# Terminal 2: Frontend  
cd "C:\Users\ompra\OneDrive\Desktop\AI Project\frontend"
npm run dev

# Browser: http://localhost:5173
# Click: 8-Puzzle game
```

---

## 🎯 Game Controls

### Manual Play:
- **Click tile**: Move tile adjacent to empty space
- **New Game**: Start fresh puzzle
- **Arrows**: Tell you which tiles can move

### Watch AI:
- **Solve Puzzle**: Let AI solve puzzle
- **Pause**: Stop animation
- **Resume**: Continue animation
- **0.5x, 1x, 2x, 3x**: Change speed

---

## 📊 What You See

```
┌─────────────────────────────────────────┐
│ Left Panel        Center Panel  Right   │
├─────────────────────────────────────────┤
│ Current State     Game Board    AI Help │
│ [7,3,4,8...]     ┌─┬─┬─┐       or      │
│                  │7│3│4│      Info     │
│ Goal State       ├─┼─┼─┤               │
│ [1,2,3,4,5...]   │8│1│2│               │
│                  ├─┼─┼─┤               │
│ Stats            │·│5│6│               │
│ Moves: 5/18      └─┴─┴─┘               │
│ Status: Playing                        │
└─────────────────────────────────────────┘
```

---

## ✅ What's Fixed

| Issue | Before | After |
|-------|--------|-------|
| Initial state same as goal | ❌ | ✅ Random cada game |
| Can't move tiles | ❌ | ✅ Click & move |
| No AI solver | ❌ | ✅ "Solve Puzzle" button |
| UI confusing | ❌ | ✅ Clean & clear |

---

## 🧪 Test It

```bash
# Backend test
python _test_backend.py

# Frontend: Check browser console (F12)
# Should see: No errors, game loads smoothly
```

---

## 📚 Resources

- **How to Play**: `HOW_TO_PLAY.md`
- **Technical Details**: `8PUZZLE_FIX.md`
- **Full Implementation**: `IMPLEMENTATION_COMPLETE.md`

---

## 🚨 If Something Goes Wrong

| Problem | Solution |
|---------|----------|
| Backend won't start | Check port 8000 in use |
| Frontend won't connect | Check API URL in browser console |
| Tiles won't move | Click tiles with arrows (adjacent to empty) |
| AI won't solve | Check WebSocket in browser Network tab |

---

## 💡 Pro Tips

- Click tiles WITH arrows - those are the only ones you can move
- Watch for the empty space (shown as · dot)
- Compare your moves to the optimal count
- Slow down AI (0.5x) to understand each step
- Use "Solve Puzzle" to learn the A* algorithm

---

## 📈 Key Features

✓ Random puzzles  
✓ Manual play  
✓ AI solving  
✓ Speed control  
✓ Pause/Resume  
✓ Step explanations  
✓ Clean UI  
✓ Visual feedback  

---

**Status: ✅ READY TO USE**

