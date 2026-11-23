
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

// Chess state
let gameState = null;
let selectedSquare = null;
let legalMoves = [];
let boardPieces = {};
let busy = false;

// Game mode
let gameMode = "local";
let playerColor = null;
let roomReady = false;

// REST API helper
async function apiRequest(url, options = {}) {
    const response = await fetch(url, options);
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || "Request failed");
    }

    return data;
}

// Socket.IO request with acknowledgement
function socketRequest(eventName, payload) {
    return new Promise((resolve, reject) => {
        const socket = window.chessArenaSocket;

        if (!socket || !socket.connected) {
            reject(new Error("Socket is not connected"));
            return;
        }

        socket.timeout(5000).emit(
            eventName,
            payload,
            (error, response) => {
                if (error) {
                    reject(new Error("Server response timeout"));
                    return;
                }

                if (!response || !response.ok) {
                    reject(new Error(
                        response?.error || "Request failed"
                    ));
                    return;
                }

                resolve(response);
            }
        );
    });
}

// Load local practice game
async function loadLocalGame() {
    try {
        const data = await apiRequest("/api/game");

        if (gameMode !== "local") return;

        gameState = data;
        selectedSquare = null;
        legalMoves = [];

        renderBoard();
        updateStatus();

    } catch (error) {
        if (gameMode === "local") {
            statusText.textContent = error.message;
        }

        console.error("Load Game Error:", error);
    }
}

// Convert FEN into board rows
function getBoardFromFen(fen) {
    const rows = fen.split(" ")[0].split("/");

    return rows.map(row => {
        return row.replace(/[1-8]/g, number => {
            return ".".repeat(Number(number));
        });
    });
}

// Render Chess Board
function renderBoard() {
    if (!gameState) return;

    board.innerHTML = "";
    boardPieces = {};

    const rows = getBoardFromFen(gameState.fen);

    // Black sees the board rotated 180 degrees
    const flipped =
        gameMode === "online" && playerColor === "b";

    const targets = legalMoves.map(move => move.to);

    for (let displayRow = 0; displayRow < 8; displayRow++) {
        for (let displayCol = 0; displayCol < 8; displayCol++) {

            const row = flipped
                ? 7 - displayRow
                : displayRow;

            const col = flipped
                ? 7 - displayCol
                : displayCol;

            const squareName =
                "abcdefgh"[col] + (8 - row);

            const piece = rows[row][col];

            boardPieces[squareName] = piece;

            const square = document.createElement("div");

            const isLight = (row + col) % 2 === 0;

            square.className =
                `square ${isLight ? "light" : "dark"}`;

            square.dataset.square = squareName;
            square.textContent = pieces[piece] || "";

            if (selectedSquare === squareName) {
                square.classList.add("selected");
            }

            if (targets.includes(squareName)) {
                square.classList.add("possible");
            }

            square.addEventListener("click", () => {
                handleSquareClick(squareName);
            });

            board.appendChild(square);
        }
    }
}

// Check whether current player owns the piece
function isCurrentPlayerPiece(piece) {
    if (!piece || piece === ".") return false;

    const pieceColor =
        piece === piece.toUpperCase() ? "w" : "b";

    if (pieceColor !== gameState.turn) {
        return false;
    }

    if (gameMode === "online") {
        return (
            roomReady &&
            pieceColor === playerColor
        );
    }

    return true;
}

// Get legal moves based on game mode
async function getLegalMoves(square) {
    if (gameMode === "online") {
        const response = await socketRequest(
            "game:legal-moves",
            square
        );

        return response.moves;
    }

    const response = await apiRequest(
        `/api/game/legal-moves/${square}`
    );

    return response.moves;
}

// Handle square selection
async function handleSquareClick(squareName) {
    if (busy || !gameState || gameState.gameOver) {
        return;
    }

    // Prevent opponent's turn in online mode
    if (gameMode === "online") {
        if (!roomReady || gameState.turn !== playerColor) {
            return;
        }
    }

    const selectedMove = legalMoves.find(
        move => move.to === squareName
    );

    if (selectedSquare && selectedMove) {
        await makeMove(selectedSquare, squareName);
        return;
    }

    if (selectedSquare === squareName) {
        selectedSquare = null;
        legalMoves = [];

        renderBoard();
        return;
    }

    const piece = boardPieces[squareName];

    if (!isCurrentPlayerPiece(piece)) {
        selectedSquare = null;
        legalMoves = [];

        renderBoard();
        return;
    }

    busy = true;
    const requestedMode = gameMode;

    try {
        const moves = await getLegalMoves(squareName);

        if (requestedMode !== gameMode) return;

        selectedSquare = squareName;
        legalMoves = moves;

        renderBoard();

    } catch (error) {
        statusText.textContent = error.message;
        console.error("Legal Moves Error:", error);

    } finally {
        busy = false;
    }
}

// Make a chess move
async function makeMove(from, to) {
    busy = true;

    const requestedMode = gameMode;

    try {
        let data;

        if (requestedMode === "online") {

            // Server validates player turn and move
            const response = await socketRequest(
                "game:move",
                {
                    from,
                    to,
                    promotion: "q"
                }
            );

            data = response.game;

        } else {

            data = await apiRequest("/api/game/move", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ from, to })
            });
        }

        if (requestedMode !== gameMode) return;

        gameState = data;
        selectedSquare = null;
        legalMoves = [];

        renderBoard();
        updateStatus();

    } catch (error) {
        console.error("Move Error:", error);

        if (requestedMode === gameMode) {
            statusText.textContent = error.message;

            if (gameMode === "local") {
                await loadLocalGame();
                statusText.textContent = error.message;
            }
        }

    } finally {
        busy = false;
    }
}

// Update game information
function updateStatus() {
    if (!gameState) return;

    const currentPlayer =
        gameState.turn === "w" ? "White" : "Black";

    if (gameState.gameOver) {
        statusTitle.textContent = "Game Over";

    } else if (gameMode === "online") {

        if (!roomReady) {
            statusTitle.textContent =
                "Waiting for Opponent";

        } else if (gameState.turn === playerColor) {
            statusTitle.textContent =
                `Your Turn (${currentPlayer})`;

        } else {
            statusTitle.textContent =
                `${currentPlayer} to Move`;
        }

    } else {
        statusTitle.textContent =
            `${currentPlayer} to Move`;
    }

    statusText.textContent = gameState.status;
}

// New Game button
const resetButton = document.createElement("button");

resetButton.textContent = "New Game";
resetButton.className = "reset-btn";

document.querySelector(".game-info")
    .appendChild(resetButton);

// Disable local reset inside multiplayer room
function updateResetButton() {
    resetButton.disabled = gameMode === "online";

    resetButton.textContent = gameMode === "online"
        ? "New Game (Local Only)"
        : "New Game";
}

// Reset local game
resetButton.addEventListener("click", async () => {
    if (busy || gameMode !== "local") return;

    busy = true;

    try {
        const data = await apiRequest("/api/game/reset", {
            method: "POST"
        });

        if (gameMode !== "local") return;

        gameState = data;
        selectedSquare = null;
        legalMoves = [];

        renderBoard();
        updateStatus();

    } catch (error) {
        statusText.textContent = error.message;
        console.error("Reset Error:", error);

    } finally {
        busy = false;
    }
});

// Apply an online game update
function applyOnlineGame(state, ready) {
    if (gameMode !== "online") return;
    if (!state || typeof state.fen !== "string") return;

    gameState = state;
    roomReady = Boolean(ready);

    selectedSquare = null;
    legalMoves = [];

    renderBoard();
    updateStatus();
}

// Public functions used by socket-client.js
window.ChessArenaGame = {

    enterRoom(state, color, ready) {
        gameMode = "online";
        playerColor = color;
        roomReady = Boolean(ready);

        updateResetButton();
        applyOnlineGame(state, ready);
    },

    syncRoom(state, ready) {
        applyOnlineGame(state, ready);
    },

    leaveRoom() {
        gameMode = "local";
        playerColor = null;
        roomReady = false;

        selectedSquare = null;
        legalMoves = [];

        updateResetButton();
        loadLocalGame();
    }
};

// Start local game
loadLocalGame();
