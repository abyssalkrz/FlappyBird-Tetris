// ─── Sudoku Generator ────────────────────────────────────────────────────────

// Returns a fully solved 9x9 board (array of 81 numbers)
function generateSolvedBoard() {
    const board = Array(81).fill(0);
    solve(board);
    return board;
}

// Backtracking solver — fills the board in place, returns true if solved
function solve(board) {
    const empty = board.indexOf(0);
    if (empty === -1) return true; // no empty cells → solved

    const row = Math.floor(empty / 9);
    const col = empty % 9;
    const nums = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);

    for (const num of nums) {
        if (isValid(board, row, col, num)) {
        board[empty] = num;
        if (solve(board)) return true;
        board[empty] = 0;
        }
    }
    return false;
}

// Returns true if placing `num` at (row, col) breaks no Sudoku rules
function isValid(board, row, col, num) {
    for (let i = 0; i < 9; i++) {
        if (board[row * 9 + i] === num) return false;       // same row
        if (board[i * 9 + col] === num) return false;       // same column
    }
    const boxRow = Math.floor(row / 3) * 3;
    const boxCol = Math.floor(col / 3) * 3;
    for (let r = boxRow; r < boxRow + 3; r++) {
        for (let c = boxCol; c < boxCol + 3; c++) {
        if (board[r * 9 + c] === num) return false;       // same 3x3 box
        }
    }
    return true;
}

// Removes cells from a solved board to create the puzzle
function createPuzzle(solvedBoard, difficulty) {
    const cluesTarget = { easy: 36, medium: 28, hard: 22 }[difficulty];
    const puzzle = [...solvedBoard];
    const positions = shuffle([...Array(81).keys()]);
    let clues = 81;

    for (const pos of positions) {
        if (clues <= cluesTarget) break;
        const backup = puzzle[pos];
        puzzle[pos] = 0;
        clues--;
        // Put the number back if removing it breaks unique-solution guarantee
        if (!hasUniqueSolution(puzzle)) {
        puzzle[pos] = backup;
        clues++;
        }
    }
    return puzzle;
}

// Checks that the puzzle has exactly one solution (fast: stops after finding 2)
function hasUniqueSolution(board) {
    const copy = [...board];
    let count = 0;
    function bt() {
        const empty = copy.indexOf(0);
        if (empty === -1) { count++; return; }
        const row = Math.floor(empty / 9);
        const col = empty % 9;
        for (let num = 1; num <= 9; num++) {
        if (isValid(copy, row, col, num)) {
            copy[empty] = num;
            bt();
            copy[empty] = 0;
            if (count > 1) return;
        }
        }
    }
    bt();
    return count === 1;
}

// Fisher-Yates shuffle — returns a new shuffled array
function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

// ─── Game State ───────────────────────────────────────────────────────────────

let solution = [];   // the correct solved board
let puzzle   = [];   // the starting clues (0 = empty)
let userGrid = [];   // what the user has typed so far
let selected = -1;   // index of the currently selected cell (−1 = none)
let seconds  = 0;
let timerId  = null;
let won      = false;

// ─── Build & Render the Board ─────────────────────────────────────────────────

function newGame() {
    const difficulty = document.getElementById("difficulty").value;
    solution = generateSolvedBoard();
    puzzle   = createPuzzle(solution, difficulty);
    userGrid = puzzle.map(v => v);   // copy; 0 means the user hasn't filled it yet
    selected = -1;
    won      = false;

    document.getElementById("message").textContent = "";
    resetTimer();
    startTimer();
    renderBoard();
}

function renderBoard() {
    const boardEl = document.getElementById("board");
    boardEl.innerHTML = "";

    for (let i = 0; i < 81; i++) {
        const cell = document.createElement("div");
        cell.className = "cell";
        cell.dataset.index = i;

        if (puzzle[i] !== 0) {
        // Given clue — locked
        cell.classList.add("given");
        cell.textContent = puzzle[i];
        } else if (userGrid[i] !== 0) {
        // User-entered number
        cell.classList.add("user");
        cell.textContent = userGrid[i];
        }

        if (i === selected) cell.classList.add("selected");

        cell.addEventListener("click", () => selectCell(i));
        boardEl.appendChild(cell);
    }
}

// ─── Cell Selection & Input ───────────────────────────────────────────────────

function selectCell(index) {
    if (puzzle[index] !== 0) {
        // Clicking a given cell just highlights matching numbers
        selected = index;
    } else {
        selected = index;
    }
    document.getElementById("message").textContent = "";
    renderBoard();
    highlightMatching();
}

function highlightMatching() {
    if (selected === -1) return;
    const value = userGrid[selected] || puzzle[selected];
    if (!value) return;

    const cells = document.querySelectorAll(".cell");
    cells.forEach((cell, i) => {
        const v = puzzle[i] !== 0 ? puzzle[i] : userGrid[i];
        if (v === value && i !== selected) {
        cell.classList.add("highlight");
        }
    });
}

// Listen for keyboard number input
document.addEventListener("keydown", (e) => {
    if (won) return;
    if (selected === -1) return;
    if (puzzle[selected] !== 0) return; // can't change a given cell

    if (e.key >= "1" && e.key <= "9") {
        userGrid[selected] = parseInt(e.key);
        renderBoard();
        highlightMatching();
        checkWin();
    }

    if (e.key === "Backspace" || e.key === "Delete" || e.key === "0") {
        userGrid[selected] = 0;
        renderBoard();
    }

    // Arrow key navigation
    const moves = { ArrowUp: -9, ArrowDown: 9, ArrowLeft: -1, ArrowRight: 1 };
    if (moves[e.key] !== undefined) {
        const next = selected + moves[e.key];
        if (next >= 0 && next < 81) selectCell(next);
    }
});

// ─── Check & Clear ────────────────────────────────────────────────────────────

function checkErrors() {
    const cells = document.querySelectorAll(".cell");
    let hasError = false;
    cells.forEach((cell, i) => {
        cell.classList.remove("error");
        if (puzzle[i] === 0 && userGrid[i] !== 0 && userGrid[i] !== solution[i]) {
        cell.classList.add("error");
        hasError = true;
        }
    });
    if (!hasError) {
        document.getElementById("message").textContent = "No errors found!";
    }
}

function clearBoard() {
    userGrid = puzzle.map(v => v);
    selected = -1;
    document.getElementById("message").textContent = "";
    renderBoard();
}

function checkWin() {
    const complete = userGrid.every((v, i) => v === solution[i]);
    if (complete) {
        won = true;
        stopTimer();
        const elapsed = document.getElementById("timer").textContent;
        document.getElementById("message").textContent =
        "You solved it! Time: " + elapsed;
    }
}

// ─── Timer ────────────────────────────────────────────────────────────────────

function resetTimer() {
    stopTimer();
    seconds = 0;
    updateTimerDisplay();
}

function startTimer() {
    timerId = setInterval(() => {
        seconds++;
        updateTimerDisplay();
    }, 1000);
}

function stopTimer() {
    clearInterval(timerId);
    timerId = null;
}

function updateTimerDisplay() {
    const m = Math.floor(seconds / 60);
    const s = String(seconds % 60).padStart(2, "0");
    document.getElementById("timer").textContent = m + ":" + s;
}

// ─── Wire Up Buttons ──────────────────────────────────────────────────────────

document.getElementById("new-game-btn").addEventListener("click", newGame);
document.getElementById("check-btn").addEventListener("click", checkErrors);
document.getElementById("clear-btn").addEventListener("click", clearBoard);

// ─── Start ────────────────────────────────────────────────────────────────────

newGame();
