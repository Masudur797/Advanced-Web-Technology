
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



/* =====================================
   STEP 7.1 - LIVE MOVE HISTORY
===================================== */

// Create Move History Panel
const historyPanel = document.createElement("section");

historyPanel.id = "moveHistoryPanel";

historyPanel.style.cssText = `
    max-width: 480px;
    margin: 20px auto;
    padding: 20px;
    background: #1e293b;
    border: 2px solid #334155;
    border-radius: 12px;
    color: #ffffff;
`;

// History Heading
const historyHeading = document.createElement("h2");

historyHeading.textContent = "♟ Move History";

historyHeading.style.cssText = `
    margin: 0 0 15px;
    font-size: 22px;
    text-align: center;
`;

// History List
const historyList = document.createElement("div");

historyList.id = "moveHistoryList";

historyList.style.cssText = `
    max-height: 260px;
    overflow-y: auto;
`;

// Add elements
historyPanel.appendChild(historyHeading);
historyPanel.appendChild(historyList);

// Place History Panel before Multiplayer Room Panel
document.querySelector(".room-panel").before(historyPanel);

// =====================================
// RENDER MOVE HISTORY
// =====================================

function updateMoveHistory() {

    historyList.innerHTML = "";

    if (!gameState) return;

    const moves = Array.isArray(gameState.history)
        ? gameState.history
        : [];

    // Show message before first move
    if (moves.length === 0) {

        const emptyMessage =
            document.createElement("p");

        emptyMessage.textContent =
            "No moves yet. Start playing!";

        emptyMessage.style.cssText = `
            color: #94a3b8;
            text-align: center;
            padding: 15px;
        `;

        historyList.appendChild(emptyMessage);
        return;
    }

    // Table Header
    const header = document.createElement("div");

    header.style.cssText = `
        display: grid;
        grid-template-columns: 50px 1fr 1fr;
        gap: 10px;
        padding: 10px;
        font-weight: bold;
        border-bottom: 1px solid #475569;
        color: #38bdf8;
    `;

    ["#", "White", "Black"].forEach(text => {
        const column = document.createElement("span");
        column.textContent = text;
        header.appendChild(column);
    });

    historyList.appendChild(header);

    // Each row contains one White and one Black move
    for (let i = 0; i < moves.length; i += 2) {

        const row = document.createElement("div");

        row.style.cssText = `
            display: grid;
            grid-template-columns: 50px 1fr 1fr;
            gap: 10px;
            padding: 10px;
            border-bottom: 1px solid #334155;
            font-family: monospace;
            font-size: 16px;
        `;

        const moveNumber =
            document.createElement("span");

        moveNumber.textContent =
            `${Math.floor(i / 2) + 1}.`;

        const whiteMove =
            document.createElement("span");

        whiteMove.textContent =
            moves[i] || "—";

        const blackMove =
            document.createElement("span");

        blackMove.textContent =
            moves[i + 1] || "—";

        row.appendChild(moveNumber);
        row.appendChild(whiteMove);
        row.appendChild(blackMove);

        historyList.appendChild(row);
    }

    // Automatically scroll to the latest move
    historyList.scrollTop =
        historyList.scrollHeight;
}

// =====================================
// UPDATE GAME INFORMATION
// =====================================

function updateStatus() {

    if (!gameState) return;

    const currentPlayer =
        gameState.turn === "w"
            ? "White"
            : "Black";

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

    updateMoveHistory();
   updateMatchResult();



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









/* =====================================
   STEP 7.2 - COPY CHESS MOVE HISTORY
===================================== */


/* =====================================
   STEP 7.2 - COPY PGN BUTTON
===================================== */

(() => {
    const panel =
        document.getElementById("moveHistoryPanel");

    if (!panel) {
        console.error("Move History Panel not found!");
        return;
    }

    // Prevent duplicate buttons
    if (document.getElementById("copyPgnBtn")) {
        return;
    }

    const copyBtn = document.createElement("button");

    copyBtn.id = "copyPgnBtn";
    copyBtn.type = "button";
    copyBtn.textContent = "📋 Copy PGN";

    copyBtn.style.cssText = `
        display: block;
        width: 100%;
        margin-top: 15px;
        padding: 12px;
        background: #38bdf8;
        color: #0f172a;
        border: none;
        border-radius: 8px;
        font-size: 16px;
        font-weight: bold;
        cursor: pointer;
    `;

    panel.appendChild(copyBtn);

    copyBtn.addEventListener("click", async () => {
        const moves = Array.isArray(gameState?.history)
            ? gameState.history
            : [];

        if (moves.length === 0) {
            copyBtn.textContent = "No moves to copy!";
            return;
        }

        const moveList = [];

        for (let i = 0; i < moves.length; i += 2) {
            const number = Math.floor(i / 2) + 1;

            let text = `${number}. ${moves[i]}`;

            if (moves[i + 1]) {
                text += ` ${moves[i + 1]}`;
            }

            moveList.push(text);
        }

        let result = "*";

        if (gameState?.gameOver) {
            const status =
                String(gameState.status || "").toLowerCase();

            if (status.includes("white wins")) {
                result = "1-0";
            } else if (status.includes("black wins")) {
                result = "0-1";
            } else if (status.includes("draw")) {
                result = "1/2-1/2";
            }
        }

        const pgn = moveList.join(" ") + " " + result;

        try {
            await navigator.clipboard.writeText(pgn);

            copyBtn.textContent = "✅ PGN Copied!";

            console.log("Copied PGN:", pgn);

        } catch (error) {
            console.error("Copy failed:", error);
            copyBtn.textContent = "Copy Failed!";
        }
    });
})();



/* =====================================
   STEP 7.3 - DOWNLOAD PGN FILE
===================================== */

(() => {
    const panel =
        document.getElementById("moveHistoryPanel");

    if (!panel) {
        console.error("Move History Panel not found!");
        return;
    }

    // Prevent duplicate download buttons
    if (document.getElementById("downloadPgnBtn")) {
        return;
    }

    // Create Download Button
    const downloadBtn = document.createElement("button");

    downloadBtn.id = "downloadPgnBtn";
    downloadBtn.type = "button";
    downloadBtn.textContent = "⬇ Download PGN";

    downloadBtn.style.cssText = `
        display: block;
        width: 100%;
        margin-top: 10px;
        padding: 12px;
        background: #22c55e;
        color: #0f172a;
        border: none;
        border-radius: 8px;
        font-size: 16px;
        font-weight: bold;
        cursor: pointer;
    `;

    panel.appendChild(downloadBtn);

    // =====================================
    // GENERATE PGN
    // =====================================

    function buildPGN() {
        const moves = Array.isArray(gameState?.history)
            ? gameState.history
            : [];

        if (moves.length === 0) {
            return "";
        }

        const moveList = [];

        for (let i = 0; i < moves.length; i += 2) {
            const number = Math.floor(i / 2) + 1;

            let moveText = `${number}. ${moves[i]}`;

            if (moves[i + 1]) {
                moveText += ` ${moves[i + 1]}`;
            }

            moveList.push(moveText);
        }

        // Detect match result
        let result = "*";

        if (gameState?.gameOver) {
            const status = String(
                gameState.status || ""
            ).toLowerCase();

            if (status.includes("white wins")) {
                result = "1-0";
            } else if (status.includes("black wins")) {
                result = "0-1";
            } else if (
                status.includes("draw") ||
                status.includes("stalemate")
            ) {
                result = "1/2-1/2";
            }
        }

        // Current date for PGN header
        const now = new Date();

        const date = [
            now.getFullYear(),
            String(now.getMonth() + 1).padStart(2, "0"),
            String(now.getDate()).padStart(2, "0")
        ].join(".");

        const headers = [
            '[Event "ChessArena Match"]',
            '[Site "ChessArena"]',
            `[Date "${date}"]`,
            '[White "White Player"]',
            '[Black "Black Player"]',
            `[Result "${result}"]`
        ];

        return (
            headers.join("\n") +
            "\n\n" +
            moveList.join(" ") +
            " " +
            result +
            "\n"
        );
    }

    // =====================================
    // DOWNLOAD BUTTON CLICK
    // =====================================

    downloadBtn.addEventListener("click", () => {
        const pgn = buildPGN();

        if (!pgn) {
            downloadBtn.textContent =
                "No moves to download!";
            return;
        }

        // Create PGN file
        const blob = new Blob([pgn], {
            type: "application/x-chess-pgn"
        });

        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");

        link.href = url;

        // Unique filename
        const date = new Date();

        const timestamp =
            date.getFullYear() + "-" +
            String(date.getMonth() + 1).padStart(2, "0") + "-" +
            String(date.getDate()).padStart(2, "0") + "-" +
            String(date.getHours()).padStart(2, "0") +
            String(date.getMinutes()).padStart(2, "0");

        link.download =
            `ChessArena-Match-${timestamp}.pgn`;

        document.body.appendChild(link);

        link.click();

        link.remove();

        setTimeout(() => {
            URL.revokeObjectURL(url);
        }, 1000);

        downloadBtn.textContent =
            "✅ PGN Downloaded!";

        console.log("Downloaded PGN:", pgn);
    });

})();



/* =====================================
   STEP 8.1 - MATCH RESULT CARD
===================================== */

// Create Result Panel
const matchResultPanel =
    document.createElement("section");

matchResultPanel.id = "matchResultPanel";

matchResultPanel.style.cssText = `
    display: none;
    max-width: 480px;
    margin: 20px auto;
    padding: 25px;
    background: #1e293b;
    border: 2px solid #22c55e;
    border-radius: 12px;
    text-align: center;
    color: #ffffff;
`;

// Result Title
const matchResultTitle =
    document.createElement("h2");

matchResultTitle.style.cssText = `
    font-size: 26px;
    margin-bottom: 12px;
    color: #22c55e;
`;

// Result Description
const matchResultDescription =
    document.createElement("p");

matchResultDescription.style.cssText = `
    font-size: 18px;
    margin: 0;
    color: #e2e8f0;
`;

// Add elements to panel
matchResultPanel.append(
    matchResultTitle,
    matchResultDescription
);

// Place after Game Status
document.querySelector(".game-info")
    .after(matchResultPanel);

// =====================================
// UPDATE MATCH RESULT
// =====================================

function updateMatchResult() {

    if (!gameState || !gameState.gameOver) {
        matchResultPanel.style.display = "none";
        return;
    }

    const status = String(
        gameState.status || "Game finished"
    );

    const lowerStatus = status.toLowerCase();

    let title = "🏁 Match Finished!";

    // Checkmate
    if (lowerStatus.includes("checkmate")) {
        title = "♚ Checkmate!";

    // Time Out
    } else if (
        lowerStatus.includes("time out") ||
        lowerStatus.includes("timeout")
    ) {
        title = "⏱️ Time's Up!";

    // Draw
    } else if (
        lowerStatus.includes("draw") ||
        lowerStatus.includes("stalemate")
    ) {
        title = "🤝 Match Draw!";
    }

    matchResultTitle.textContent = title;

    matchResultDescription.textContent = status;

    matchResultPanel.style.display = "block";

    console.log("Chess Match Result:", status);
}

