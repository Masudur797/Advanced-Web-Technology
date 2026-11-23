
const board = document.getElementById("chessBoard");

const statusTitle = document.querySelector(".game-info h3");
const statusText = document.querySelector(".game-info p");

// Chess piece symbols
const pieces = {
    r: "♜", n: "♞", b: "♝",
    q: "♛", k: "♚", p: "♟",

    R: "♖", N: "♘", B: "♗",
    Q: "♕", K: "♔", P: "♙"
};

// Game variables
let gameState = null;
let selectedSquare = null;
let legalTargets = [];
let boardPieces = {};
let busy = false;

// API helper function
async function apiRequest(url, options = {}) {
    const response = await fetch(url, options);
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || "Request failed");
    }

    return data;
}

// Load current chess game from backend
async function loadGame() {
    try {
        gameState = await apiRequest("/api/game");

        selectedSquare = null;
        legalTargets = [];

        renderBoard();
        updateStatus();

    } catch (error) {
        statusText.textContent = error.message;
        console.error("Load Game Error:", error);
    }
}

// Convert FEN notation into an 8x8 board
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

            // Highlight selected piece
            if (selectedSquare === squareName) {
                square.classList.add("selected");
            }

            // Highlight legal destinations
            if (legalTargets.includes(squareName)) {
                square.classList.add("possible");
            }

            // Handle square click
            square.addEventListener("click", () => {
                handleSquareClick(squareName);
            });

            board.appendChild(square);
        }
    }
}

// Check whether a piece belongs to current player
function isCurrentPlayerPiece(piece) {
    if (!piece || piece === ".") {
        return false;
    }

    if (gameState.turn === "w") {
        return piece === piece.toUpperCase();
    }

    return piece === piece.toLowerCase();
}

// Handle chess square selection
async function handleSquareClick(squareName) {
    if (busy || !gameState || gameState.gameOver) {
        return;
    }

    // Make move if clicked square is legal
    if (
        selectedSquare &&
        legalTargets.includes(squareName)
    ) {
        await makeMove(selectedSquare, squareName);
        return;
    }

    // Deselect current square
    if (selectedSquare === squareName) {
        selectedSquare = null;
        legalTargets = [];

        renderBoard();
        return;
    }

    const piece = boardPieces[squareName];

    // Only current player's pieces can be selected
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

        // Remove duplicate destinations
        legalTargets = [
            ...new Set(data.moves.map(move => move.to))
        ];

        renderBoard();

    } catch (error) {
        statusText.textContent = error.message;
        console.error("Legal Move Error:", error);

    } finally {
        busy = false;
    }
}

// Send chess move to backend
async function makeMove(from, to) {
    busy = true;

    try {
        const data = await apiRequest("/api/game/move", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                from: from,
                to: to
            })
        });

        gameState = data;

        selectedSquare = null;
        legalTargets = [];

        renderBoard();
        updateStatus();

    } catch (error) {
        console.error("Move Error:", error);

        await loadGame();
        statusText.textContent = error.message;

    } finally {
        busy = false;
    }
}

// Update turn and game status
function updateStatus() {
    if (!gameState) return;

    const currentPlayer =
        gameState.turn === "w" ? "White" : "Black";

    if (gameState.gameOver) {
        statusTitle.textContent = "Game Over";
    } else {
        statusTitle.textContent =
            `${currentPlayer} to Move`;
    }

    statusText.textContent = gameState.status;
}

// Create New Game button
const resetButton = document.createElement("button");

resetButton.textContent = "New Game";
resetButton.className = "reset-btn";

document.querySelector(".game-info")
    .appendChild(resetButton);

// Reset chess game
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
        console.error("Reset Game Error:", error);

    } finally {
        busy = false;
    }
});

// Initialize chess game
loadGame();

