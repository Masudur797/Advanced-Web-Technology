
const board = document.getElementById("chessBoard");

const statusTitle = document.querySelector(".game-info h3");
const statusText = document.querySelector(".game-info p");

const pieces = {
    r: "♜", n: "♞", b: "♝",
    q: "♛", k: "♚", p: "♟",

    R: "♖", N: "♘", B: "♗",
    Q: "♕", K: "♔", P: "♙"
};

let gameState = null;
let selectedSquare = null;
let legalTargets = [];
let boardPieces = {};
let busy = false;

// API helper
async function apiRequest(url, options = {}) {
    const response = await fetch(url, options);
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || "Request failed");
    }

    return data;
}

// Load game from backend
async function loadGame() {
    try {
        gameState = await apiRequest("/api/game");
        selectedSquare = null;
        legalTargets = [];

        renderBoard();
        updateStatus();
    } catch (error) {
        statusText.textContent = error.message;
    }
}

// Convert FEN into 8x8 board
function getBoardFromFen(fen) {
    const rows = fen.split(" ")[0].split("/");

    return rows.map(row => {
        return row.replace(/[1-8]/g, number => {
            return ".".repeat(Number(number));
        });
    });
}

// Render chess board
function renderBoard() {
    if (!gameState) return;

    board.innerHTML = "";
    boardPieces = {};

    const rows = getBoardFromFen(gameState.fen);

    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {

            const square = document.createElement("div");

            const squareName =
                "abcdefgh"[col] + (8 - row);

            const piece = rows[row][col];

            boardPieces[squareName] = piece;

            const isLight = (row + col) % 2 === 0;

            square.className =
                `square ${isLight ? "light" : "dark"}`;

            square.dataset.square = squareName;
            square.textContent = pieces[piece] || "";

            if (selectedSquare === squareName) {
                square.classList.add("selected");
            }

            if (legalTargets.includes(squareName)) {
                square.classList.add("possible");
            }

            square.addEventListener("click", () => {
                handleSquareClick(squareName);
            });

            board.appendChild(square);
        }
    }
}

// Check if piece belongs to current player
function isCurrentPlayerPiece(piece) {
    if (!piece || piece === ".") return false;

    if (gameState.turn === "w") {
        return piece === piece.toUpperCase();
    }

    return piece === piece.toLowerCase();
}

// Handle chess square click
async function handleSquareClick(squareName) {
    if (busy || !gameState || gameState.gameOver) {
        return;
    }

    if (
        selectedSquare &&
        legalTargets.includes(squareName)
    ) {
        await makeMove(selectedSquare, squareName);
        return;
    }

    if (selectedSquare === squareName) {
        selectedSquare = null;
        legalTargets = [];
        renderBoard();
        return;
    }

    const piece = boardPieces[squareName];

    if (!isCurrentPlayerPiece(piece)) {
        selectedSquare = null;
        legalTargets = [];
        renderBoard();
        return;
    }

    busy = true;

    try {
        const data = await apiRequest(
            `/api/game/legal-moves/${squareName}`
        );

        selectedSquare = squareName;

        legalTargets = [
            ...new Set(data.moves.map(move => move.to))
        ];

        renderBoard();
    } catch (error) {
        statusText.textContent = error.message;
    } finally {
        busy = false;
    }
}

// Send move to backend
async function makeMove(from, to) {
    busy = true;

    try {
        const data = await apiRequest("/api/game/move", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ from, to })
        });

        gameState = data;
        selectedSquare = null;
        legalTargets = [];

        renderBoard();
        updateStatus();

    } catch (error) {
        statusText.textContent = error.message;
        await loadGame();
    } finally {
        busy = false;
    }
}

// Update game status
function updateStatus() {
    if (!gameState) return;

    const currentPlayer =
        gameState.turn === "w" ? "White" : "Black";

    statusTitle.textContent = gameState.gameOver
        ? "Game Over"
        : `${currentPlayer} to Move`;

    statusText.textContent = gameState.status;
}

// Create New Game button
const resetButton = document.createElement("button");

resetButton.textContent = "New Game";
resetButton.className = "reset-btn";

document.querySelector(".game-info")
    .appendChild(resetButton);

resetButton.addEventListener("click", async () => {
    if (busy) return;

    busy = true;

    try {
        await apiRequest("/api/game/reset", {
            method: "POST"
        });

        await loadGame();
    } catch (error) {
        statusText.textContent = error.message;
    } finally {
        busy = false;
    }
});

// Start game
loadGame();
