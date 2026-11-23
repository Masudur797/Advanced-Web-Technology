
/* =========================================
   ChessArena - Socket.IO Client
   Room Code + Multiplayer + Live Timer
========================================= */

(() => {
    "use strict";

    // Socket.IO connection
    const socket = io();

    // Share socket with app.js
    window.chessArenaSocket = socket;

    // =====================================
    // HTML ELEMENTS
    // =====================================

    const createBtn =
        document.getElementById("createRoomBtn");

    const joinBtn =
        document.getElementById("joinRoomBtn");

    const codeInput =
        document.getElementById("roomCodeInput");

    const roomStatus =
        document.getElementById("roomStatus");

    const roomDetails =
        document.getElementById("roomDetails");

    const gameInfo =
        document.querySelector(".game-info");

    const whiteTime =
        document.getElementById("whiteTime");

    const blackTime =
        document.getElementById("blackTime");

    const whiteClock =
        document.getElementById("whiteClock");

    const blackClock =
        document.getElementById("blackClock");

    // Validate required elements
    if (
        !createBtn ||
        !joinBtn ||
        !codeInput ||
        !roomStatus ||
        !roomDetails ||
        !gameInfo ||
        !window.ChessArenaGame
    ) {
        console.error(
            "ChessArena: HTML elements or app.js missing."
        );
        return;
    }

    // =====================================
    // ROOM CODE DISPLAY
    // =====================================

    const codePanel = document.createElement("div");

    codePanel.id = "roomCodePanel";

    codePanel.style.cssText = `
        display: none;
        margin: 16px auto;
        padding: 16px;
        max-width: 440px;
        border: 2px solid #38bdf8;
        border-radius: 12px;
        background: #0f172a;
        color: #ffffff;
        text-align: center;
    `;

    const codeHeading = document.createElement("div");

    codeHeading.textContent =
        "ROOM CODE (JOIN PASSWORD)";

    codeHeading.style.cssText = `
        font-size: 13px;
        letter-spacing: 1px;
        color: #7dd3fc;
    `;

    const codeValue = document.createElement("div");

    codeValue.id = "visibleRoomCode";

    codeValue.style.cssText = `
        font-size: 34px;
        font-weight: 800;
        letter-spacing: 5px;
        margin: 10px 0;
        overflow-wrap: anywhere;
    `;

    const copyBtn = document.createElement("button");

    copyBtn.type = "button";
    copyBtn.textContent = "Copy Room Code";

    copyBtn.style.cssText = `
        padding: 9px 16px;
        background: #38bdf8;
        color: #0f172a;
        border: none;
        border-radius: 8px;
        font-weight: bold;
        cursor: pointer;
    `;

    codePanel.append(
        codeHeading,
        codeValue,
        copyBtn
    );

    roomStatus.parentNode.insertBefore(
        codePanel,
        roomStatus
    );

    // =====================================
    // SOCKET CONNECTION STATUS
    // =====================================

    const connectionStatus =
        document.createElement("p");

    connectionStatus.id = "connectionStatus";

    connectionStatus.textContent =
        "Socket: Connecting...";

    connectionStatus.style.marginTop = "15px";

    gameInfo.appendChild(connectionStatus);

    // =====================================
    // MULTIPLAYER VARIABLES
    // =====================================

    let currentRoom = null;
    let waitingForResponse = false;

    // Separate from app.js roomReady variable
    let clientRoomReady = false;

    let lastFen = null;
    let lastStatus = null;
    let lastGameOver = null;

    let recoveryInterval = null;

    // =====================================
    // ROOM MESSAGE
    // =====================================

    function showMessage(message, error = false) {
        roomStatus.textContent = message;

        roomStatus.style.color = error
            ? "#f87171"
            : "#22c55e";
    }

    // =====================================
    // UPDATE BUTTONS
    // =====================================

    function updateButtons() {
        const enabled =
            socket.connected &&
            !currentRoom &&
            !waitingForResponse;

        createBtn.disabled = !enabled;
        joinBtn.disabled = !enabled;
        codeInput.disabled = !enabled;
    }

    // =====================================
    // SHOW ROOM CODE
    // =====================================

    function showCode(code) {
        codeValue.textContent = code;

        codePanel.style.display = "block";

        copyBtn.textContent = "Copy Room Code";
    }

    // =====================================
    // COPY ROOM CODE
    // =====================================

    copyBtn.addEventListener("click", async () => {
        if (!currentRoom) return;

        try {
            await navigator.clipboard.writeText(
                currentRoom.code
            );

            copyBtn.textContent = "Copied!";

        } catch (error) {
            copyBtn.textContent =
                "Select and copy the code above";

            console.warn(
                "Clipboard unavailable:",
                error
            );
        }
    });

    // =====================================
    // CHESS TIMER FORMAT
    // =====================================

    function formatTime(milliseconds) {
        const totalSeconds = Math.ceil(
            Math.max(0, milliseconds) / 1000
        );

        const minutes =
            Math.floor(totalSeconds / 60);

        const seconds =
            totalSeconds % 60;

        return (
            String(minutes).padStart(2, "0") +
            ":" +
            String(seconds).padStart(2, "0")
        );
    }

    // =====================================
    // UPDATE LIVE TIMER
    // =====================================

    function updateClock(clock) {
        if (
            !clock ||
            !Number.isFinite(clock.whiteMs) ||
            !Number.isFinite(clock.blackMs)
        ) {
            return;
        }

        // White timer
        if (whiteTime) {
            whiteTime.textContent =
                formatTime(clock.whiteMs);

            whiteTime.classList.toggle(
                "low-time",
                clock.whiteMs <= 30000
            );
        }

        // Black timer
        if (blackTime) {
            blackTime.textContent =
                formatTime(clock.blackMs);

            blackTime.classList.toggle(
                "low-time",
                clock.blackMs <= 30000
            );
        }

        // Highlight active player
        if (whiteClock) {
            whiteClock.classList.toggle(
                "active",
                Boolean(
                    clock.running &&
                    clock.activeColor === "w"
                )
            );
        }

        if (blackClock) {
            blackClock.classList.toggle(
                "active",
                Boolean(
                    clock.running &&
                    clock.activeColor === "b"
                )
            );
        }
    }

    // =====================================
    // RESET TIMER
    // =====================================

    function resetClock() {
        if (whiteTime) {
            whiteTime.textContent = "05:00";
            whiteTime.classList.remove("low-time");
        }

        if (blackTime) {
            blackTime.textContent = "05:00";
            blackTime.classList.remove("low-time");
        }

        if (whiteClock) {
            whiteClock.classList.remove("active");
        }

        if (blackClock) {
            blackClock.classList.remove("active");
        }
    }

    // =====================================
    // STOP AUTOMATIC RECOVERY
    // =====================================

    function stopRecovery() {
        if (recoveryInterval !== null) {
            clearInterval(recoveryInterval);
            recoveryInterval = null;
        }
    }

    // =====================================
    // CLEAR ROOM
    // =====================================

    function clearRoom(message) {
        stopRecovery();

        currentRoom = null;
        waitingForResponse = false;
        clientRoomReady = false;

        lastFen = null;
        lastStatus = null;
        lastGameOver = null;

        codePanel.style.display = "none";
        codeValue.textContent = "";

        roomDetails.textContent = "Not in a room";

        resetClock();

        window.ChessArenaGame.leaveRoom();

        showMessage(message, true);

        updateButtons();
    }

    // =====================================
    // SYNC CHESS GAME
    // =====================================

    function syncGame(game, force = false) {
        if (
            !currentRoom ||
            !game ||
            typeof game.fen !== "string"
        ) {
            return;
        }

        // Update timer even if board is unchanged
        updateClock(game.clock);

        // Avoid unnecessary board rendering
        if (
            !force &&
            game.fen === lastFen &&
            game.status === lastStatus &&
            game.gameOver === lastGameOver
        ) {
            return;
        }

        window.ChessArenaGame.syncRoom(
            game,
            clientRoomReady
        );

        lastFen = game.fen;
        lastStatus = game.status;
        lastGameOver = game.gameOver;

        console.log(
            "Chess Board Updated:",
            game.fen
        );
    }

    // =====================================
    // UPDATE ROOM STATE
    // =====================================

    function updateRoomState(state) {
        if (
            !currentRoom ||
            !state ||
            state.roomCode !== currentRoom.code
        ) {
            return;
        }

        clientRoomReady = Boolean(state.ready);

        const color =
            currentRoom.color === "w"
                ? "White"
                : "Black";

        // Always show the Room Code
        showCode(currentRoom.code);

        roomDetails.textContent =
            `Room: ${currentRoom.code} | ` +
            `You: ${color} | ` +
            `Players: ${state.playerCount}/2`;

        syncGame(state.game, true);

        if (clientRoomReady) {
            if (!state.game?.clock) {
                showMessage(
                    "Game ready, but server chess clock is missing.",
                    true
                );
            } else {
                showMessage(
                    "Both players joined! Game is ready."
                );
            }
        } else {
            showMessage(
                "Room created! Share the code with Player 2."
            );
        }
    }

    // =====================================
    // RECOVER LATEST GAME STATE
    // =====================================

    function requestLatestGame() {
        if (
            !socket.connected ||
            !currentRoom ||
            !clientRoomReady
        ) {
            return;
        }

        const requestedCode = currentRoom.code;

        socket.timeout(5000).emit(
            "game:state",
            (error, response) => {
                if (
                    error ||
                    !response?.ok ||
                    !response.game
                ) {
                    return;
                }

                if (
                    !currentRoom ||
                    currentRoom.code !== requestedCode
                ) {
                    return;
                }

                syncGame(response.game);
            }
        );
    }

    // =====================================
    // CREATE / JOIN ROOM RESPONSE
    // =====================================

    function handleRoomResponse(error, response) {
        waitingForResponse = false;

        console.log(
            "ROOM CREATE/JOIN RESPONSE:",
            error || response
        );

        if (!socket.connected) {
            showMessage(
                "Socket disconnected. Reconnect and try again.",
                true
            );

            updateButtons();
            return;
        }

        if (error || !response?.ok) {
            showMessage(
                error
                    ? "Server response timeout. Check Terminal."
                    : (
                        response?.error ||
                        "Room request failed"
                    ),
                true
            );

            updateButtons();
            return;
        }

        if (
            typeof response.roomCode !== "string" ||
            !response.state?.game
        ) {
            showMessage(
                "Server returned invalid Room Code or Game State.",
                true
            );

            updateButtons();
            return;
        }

        currentRoom = {
            code: response.roomCode,
            color: response.color
        };

        clientRoomReady =
            Boolean(response.state.ready);

        // Show code immediately
        showCode(currentRoom.code);

        showMessage(
            `Room Code: ${currentRoom.code}`
        );

        try {
            window.ChessArenaGame.enterRoom(
                response.state.game,
                response.color,
                clientRoomReady
            );

            updateRoomState(response.state);

        } catch (error) {
            console.error(
                "Room UI Error:",
                error
            );

            showMessage(
                `Room ${currentRoom.code} created. ` +
                `UI Error: ${error.message}`,
                true
            );
        }

        // Automatic recovery every 2 seconds
        stopRecovery();

        recoveryInterval = setInterval(
            requestLatestGame,
            2000
        );

        updateButtons();
    }

    // =====================================
    // SOCKET CONNECTED
    // =====================================

    socket.on("connect", () => {
        connectionStatus.textContent =
            "🟢 Socket Connected";

        connectionStatus.style.color = "#22c55e";

        if (currentRoom) {
            clearRoom(
                "Reconnected. Create or join a new room."
            );
        }

        updateButtons();

        console.log(
            "SOCKET CONNECTED:",
            socket.id
        );
    });

    // =====================================
    // SOCKET DISCONNECTED
    // =====================================

    socket.on("disconnect", () => {
        connectionStatus.textContent =
            "🔴 Socket Disconnected";

        connectionStatus.style.color = "#ef4444";

        clearRoom(
            "Connection lost. Room closed."
        );
    });

    // =====================================
    // SOCKET CONNECTION ERROR
    // =====================================

    socket.on("connect_error", error => {
        connectionStatus.textContent =
            "Connection Failed";

        connectionStatus.style.color = "#ef4444";

        console.error(
            "Socket Connection Error:",
            error.message
        );

        updateButtons();
    });

    // =====================================
    // ROOM STATE RECEIVER
    // =====================================

    socket.on("room:state", state => {
        updateRoomState(state);
    });

    // =====================================
    // REAL-TIME MOVE RECEIVER
    // =====================================

    socket.on("room:game", game => {
        console.log(
            "REAL-TIME MOVE RECEIVED:",
            game?.fen
        );

        syncGame(game);
    });

    // =====================================
    // LIVE TIMER RECEIVER
    // =====================================

    socket.on("room:clock", data => {
        if (!currentRoom) return;

        if (
            data?.roomCode !== currentRoom.code
        ) {
            return;
        }

        updateClock(data.clock);
    });

    // =====================================
    // ROOM CLOSED
    // =====================================

    socket.on("room:closed", data => {
        clearRoom(
            data?.message || "Room closed"
        );
    });

    // =====================================
    // CREATE ROOM BUTTON
    // =====================================

    createBtn.addEventListener("click", () => {
        if (!socket.connected) {
            showMessage(
                "Socket not connected. Start the server first.",
                true
            );
            return;
        }

        if (currentRoom || waitingForResponse) {
            return;
        }

        waitingForResponse = true;

        updateButtons();

        showMessage("Creating room...");

        socket.timeout(5000).emit(
            "room:create",
            handleRoomResponse
        );
    });

    // =====================================
    // JOIN ROOM BUTTON
    // =====================================

    joinBtn.addEventListener("click", () => {
        if (
            !socket.connected ||
            currentRoom ||
            waitingForResponse
        ) {
            return;
        }

        const code = codeInput.value
            .trim()
            .toUpperCase();

        if (!/^[A-Z0-9]{6}$/.test(code)) {
            showMessage(
                "Enter a valid 6-character Room Code.",
                true
            );

            return;
        }

        waitingForResponse = true;

        updateButtons();

        showMessage("Joining room...");

        socket.timeout(5000).emit(
            "room:join",
            code,
            handleRoomResponse
        );
    });

    // =====================================
    // INITIALIZE
    // =====================================

    updateButtons();

    console.log(
        "ChessArena ROOM + TIMER FIX Loaded!"
    );

})();
