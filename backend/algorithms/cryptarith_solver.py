"""
backend/algorithms/cryptarith_solver.py
Cryptarithmetic solver using coefficient-based CSP with:
 - Multiple solving modes (brute_force, backtrack, forward_checking, full_csp)
 - Configurable MRV heuristic
 - Detailed step tracking for visualization
 - Metrics collection (nodes, backtracks, pruned, depth, time)

Adapted from Oviya-Babu/Cryptarithmetic-AI-solver and rebuilt for IntelliPlay.
"""

import time
import itertools
from dataclasses import dataclass, field
from typing import Any


# ──────────────────────────────────────────
# Parsing
# ──────────────────────────────────────────

def parse_puzzle(word1: str, word2: str, result: str):
    """Extract unique letters, leading letters, and validate input."""
    words = [w.strip().upper() for w in [word1, word2, result]]
    for w in words:
        if not w.isalpha():
            raise ValueError(f"Invalid word: '{w}'. Only letters allowed.")
    all_letters = set()
    for w in words:
        all_letters.update(w)
    unique_letters = sorted(all_letters)
    if len(unique_letters) > 10:
        raise ValueError(f"Too many unique letters ({len(unique_letters)}). Max is 10.")
    leading_letters = {w[0] for w in words if w}
    return words, unique_letters, leading_letters


def check_assignment_arithmetic(assignment: dict, word1: str, word2: str, result: str) -> bool:
    """Check if a complete assignment satisfies the equation."""
    def word_to_num(word: str) -> int:
        num = 0
        for ch in word:
            num = num * 10 + assignment[ch]
        return num
    return word_to_num(word1) + word_to_num(word2) == word_to_num(result)


# ──────────────────────────────────────────
# Step / Metrics data classes
# ──────────────────────────────────────────

@dataclass
class SolverStep:
    step_id: int
    type: str           # assign, prune, backtrack, solution, no_solution, info
    letter: str
    digit: int
    assignment: dict     # snapshot of current assignment
    partial_sum: int
    domains: dict        # snapshot of remaining domains
    msg: str
    depth: int


@dataclass
class SolverMetrics:
    nodes_explored: int = 0
    backtracks: int = 0
    nodes_pruned: int = 0
    max_depth: int = 0
    time_ms: float = 0.0
    mode: str = "full_csp"


@dataclass
class SolverResult:
    solution: dict[str, int] | None
    steps: list[dict[str, Any]]
    metrics: SolverMetrics
    is_solvable: bool
    error: str | None = None


# ──────────────────────────────────────────
# Brute-force solver (for Level 3 demo)
# ──────────────────────────────────────────

def solve_brute_force(word1: str, word2: str, result_word: str,
                      max_trace: int = 60) -> SolverResult:
    """
    Solve via brute-force: try all digit permutations.
    Captures trace steps to show inefficiency.
    """
    start = time.perf_counter()
    try:
        words, unique_letters, leading_letters = parse_puzzle(word1, word2, result_word)
    except ValueError as e:
        return SolverResult(None, [], SolverMetrics(), False, str(e))

    n = len(unique_letters)
    steps: list[dict[str, Any]] = []
    nodes = 0
    step_id = 0

    for perm in itertools.permutations(range(10), n):
        nodes += 1
        assignment = dict(zip(unique_letters, perm))

        # Check leading letter constraint
        if any(assignment[l] == 0 for l in leading_letters):
            if len(steps) < max_trace:
                step_id += 1
                steps.append(_make_step(step_id, "prune", "", -1, assignment, 0, {},
                    f"Combination #{nodes}: Leading letter has digit 0 — skipping.", 0))
            continue

        if check_assignment_arithmetic(assignment, words[0], words[1], words[2]):
            step_id += 1
            steps.append(_make_step(step_id, "solution", "", -1, assignment, 0, {},
                f"✓ Found solution after {nodes:,} combinations! {_fmt_assignment(assignment)}", 0))

            elapsed = (time.perf_counter() - start) * 1000
            metrics = SolverMetrics(nodes, 0, 0, 0, elapsed, "brute_force")
            return SolverResult(assignment, steps, metrics, True)

        if len(steps) < max_trace and nodes % 500 == 0:
            step_id += 1
            steps.append(_make_step(step_id, "info", "", -1, assignment, 0, {},
                f"Tried {nodes:,} combinations so far... still searching.", 0))

    elapsed = (time.perf_counter() - start) * 1000
    step_id += 1
    steps.append(_make_step(step_id, "no_solution", "", -1, {}, 0, {},
        f"✗ Exhausted all {nodes:,} permutations. No solution exists.", 0))
    metrics = SolverMetrics(nodes, 0, 0, 0, elapsed, "brute_force")
    return SolverResult(None, steps, metrics, False)


# ──────────────────────────────────────────
# Main CSP solver with configurable modes
# ──────────────────────────────────────────

def solve_cryptarithm(
    word1: str,
    word2: str,
    result_word: str,
    mode: str = "full_csp",        # brute_force | backtrack | forward_checking | full_csp
    use_mrv: bool = True,
    max_trace: int = 2000,
) -> SolverResult:
    """
    Main solver entry point. Configurable via mode and use_mrv flags.
    Returns SolverResult with solution, step trace, and metrics.
    """
    word1, word2, result_word = word1.upper(), word2.upper(), result_word.upper()

    if mode == "brute_force":
        return solve_brute_force(word1, word2, result_word, max_trace)

    start = time.perf_counter()
    try:
        words, unique_letters, leading_letters = parse_puzzle(word1, word2, result_word)
    except ValueError as e:
        return SolverResult(None, [], SolverMetrics(), False, str(e))

    n = len(unique_letters)
    letter_index = {ch: i for i, ch in enumerate(unique_letters)}

    # Encode equation as: sum(coeff[i] * digit[i]) == 0
    coefficients = [0] * n
    for word in words[:-1]:
        for pos, ch in enumerate(reversed(word)):
            coefficients[letter_index[ch]] += 10 ** pos
    for pos, ch in enumerate(reversed(words[-1])):
        coefficients[letter_index[ch]] -= 10 ** pos

    no_lead_zero = {letter_index[ch] for ch in leading_letters}

    # Variable ordering
    use_forward = mode in ("forward_checking", "full_csp")
    use_mrv_actual = use_mrv and mode == "full_csp"

    if use_mrv_actual:
        def var_priority(i):
            ch = unique_letters[i]
            freq = sum(w.count(ch) for w in words)
            is_leading = ch in leading_letters
            return (-abs(coefficients[i]), -freq, is_leading)
        ordered_vars = sorted(range(n), key=var_priority)
    else:
        ordered_vars = list(range(n))

    assignment = [-1] * n
    used_digits = [False] * 10

    # Metrics tracking
    nodes_explored = [0]
    backtracks_count = [0]
    pruned_count = [0]
    max_depth = [0]
    step_counter = [0]
    steps: list[dict[str, Any]] = []

    def get_assignment_dict():
        return {unique_letters[i]: assignment[i] for i in range(n) if assignment[i] != -1}

    def get_domains_dict():
        domains = {}
        for i in range(n):
            if assignment[i] != -1:
                domains[unique_letters[i]] = [assignment[i]]
            else:
                is_nz = i in no_lead_zero
                domains[unique_letters[i]] = [d for d in range(0 if not is_nz else 1, 10) if not used_digits[d]]
        return domains

    def add_step(type_str: str, letter: str, digit: int, partial_sum: int, msg: str, depth: int):
        if len(steps) < max_trace:
            step_counter[0] += 1
            steps.append(_make_step(
                step_counter[0], type_str, letter, digit,
                get_assignment_dict(), partial_sum, get_domains_dict(),
                msg, depth
            ))

    def backtrack(var_pos: int, partial_sum: int) -> bool:
        nodes_explored[0] += 1
        if var_pos > max_depth[0]:
            max_depth[0] = var_pos

        if var_pos == n:
            if partial_sum == 0:
                asgn = get_assignment_dict()
                add_step("solution", "", -1, partial_sum,
                    f"✓ Solution found! {_fmt_assignment(asgn)}", var_pos)
                return True
            return False

        var = ordered_vars[var_pos]
        coeff = coefficients[var]
        ch = unique_letters[var]
        is_no_zero = var in no_lead_zero

        for digit in range(0 if not is_no_zero else 1, 10):
            if used_digits[digit]:
                continue

            assignment[var] = digit
            used_digits[digit] = True
            new_sum = partial_sum + coeff * digit

            add_step("assign", ch, digit, new_sum,
                f"Assign {ch} = {digit} (coeff={coeff:+d}, partial_sum={new_sum:+d})",
                var_pos)

            # Forward checking: range bounding
            if use_forward:
                remaining_vars = [ordered_vars[j] for j in range(var_pos + 1, n)]
                if remaining_vars:
                    can_reach_zero = True
                    min_possible = new_sum
                    max_possible = new_sum

                    for rv in remaining_vars:
                        c = coefficients[rv]
                        is_nz = rv in no_lead_zero
                        avail = [d for d in range(10) if not used_digits[d] and not (is_nz and d == 0)]
                        if not avail:
                            can_reach_zero = False
                            break
                        if c > 0:
                            min_possible += c * min(avail)
                            max_possible += c * max(avail)
                        else:
                            min_possible += c * max(avail)
                            max_possible += c * min(avail)

                    if not can_reach_zero or not (min_possible <= 0 <= max_possible):
                        pruned_count[0] += 1
                        add_step("prune", ch, digit, new_sum,
                            f"Pruned {ch}={digit}: range [{min_possible:+d}…{max_possible:+d}] cannot reach 0",
                            var_pos)
                        used_digits[digit] = False
                        assignment[var] = -1
                        continue

                    if backtrack(var_pos + 1, new_sum):
                        return True
                else:
                    if new_sum == 0:
                        return True
            else:
                # Pure backtracking — no forward check
                if backtrack(var_pos + 1, new_sum):
                    return True

            backtracks_count[0] += 1
            add_step("backtrack", ch, digit, new_sum,
                f"Backtrack from {ch}={digit} — dead end",
                var_pos)
            used_digits[digit] = False
            assignment[var] = -1

        return False

    found = backtrack(0, 0)
    elapsed = (time.perf_counter() - start) * 1000

    metrics = SolverMetrics(
        nodes_explored=nodes_explored[0],
        backtracks=backtracks_count[0],
        nodes_pruned=pruned_count[0],
        max_depth=max_depth[0],
        time_ms=round(elapsed, 2),
        mode=mode,
    )

    if not found:
        add_step("no_solution", "", -1, 0,
            f"✗ No valid assignment exists. Explored {nodes_explored[0]:,} nodes.",
            0)
        return SolverResult(None, steps, metrics, False)

    result_map = {ch: assignment[i] for i, ch in enumerate(unique_letters)}
    return SolverResult(result_map, steps, metrics, True)


# ──────────────────────────────────────────
# StepDict adapter (for WebSocket streaming)
# ──────────────────────────────────────────

@dataclass
class CryptarithStreamResult:
    solution: dict[str, int]
    steps: list[dict[str, Any]]
    assignments_tried: int


def solve_to_stepdicts(equation: str) -> CryptarithStreamResult:
    """
    Parses equation like "SEND + MORE = MONEY",
    calls solver, converts steps to StepDict format for WS streaming.
    """
    parts = equation.replace("=", "+").split("+")
    words = [p.strip().upper() for p in parts]
    if len(words) != 3:
        raise ValueError("Equation must have format: WORD1 + WORD2 = RESULT")

    result = solve_cryptarithm(words[0], words[1], words[2], mode="full_csp")

    action_map = {
        "assign": "Assign", "prune": "Prune",
        "backtrack": "Backtrack", "solution": "Solution",
        "no_solution": "NoSolution", "info": "Info",
    }

    ws_steps: list[dict[str, Any]] = []
    for i, s in enumerate(result.steps):
        ws_steps.append({
            "step_id": i,
            "algorithm": "csp_cryptarith",
            "action": action_map.get(s.get("type", "info"), "Info"),
            "state": {"assignment": s.get("assignment", {}), "equation": equation},
            "score": None,
            "depth": s.get("depth", i),
            "pruned": s.get("type") in ("prune", "backtrack"),
            "best_so_far": result.solution or {},
            "explanation": s.get("msg", ""),
        })

    return CryptarithStreamResult(
        solution=result.solution or {},
        steps=ws_steps,
        assignments_tried=result.metrics.nodes_explored,
    )


# ──────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────

def _make_step(step_id, type_str, letter, digit, assignment, partial_sum, domains, msg, depth):
    return {
        "step_id": step_id,
        "type": type_str,
        "letter": letter,
        "digit": digit,
        "assignment": dict(assignment),
        "partial_sum": partial_sum,
        "domains": dict(domains),
        "msg": msg,
        "depth": depth,
    }


def _fmt_assignment(asgn: dict) -> str:
    return ", ".join(f"{k}={v}" for k, v in sorted(asgn.items()))
