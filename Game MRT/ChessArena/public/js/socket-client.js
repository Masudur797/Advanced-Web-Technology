
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

    // Update room readiness
    clientRoomReady = Boolean(state.ready);

    const color =
        currentRoom.color === "w"
            ? "White"
            : "Black";

    // Show Room Code
    showCode(currentRoom.code);

    // Show players
    roomDetails.textContent =
        `Room: ${currentRoom.code} | ` +
        `You: ${color} | ` +
        `Players: ${state.playerCount}/2`;

    // Sync chess board and timer
    syncGame(state.game, true);

    if (clientRoomReady) {

        showMessage(
            "Both players joined! Game is ready."
        );

    } else {

        showMessage(
            "Waiting for second player..."
        );
    }

    // =====================================
    // FIX: UPDATE OFFER DRAW BUTTON
    // =====================================

    if (typeof updateDrawUI === "function") {

        drawMatchFinished =
            Boolean(state.game?.gameOver);

        updateDrawUI();

        console.log(
            "DRAW UI UPDATED:",
            {
                roomReady: clientRoomReady,
                gameOver: drawMatchFinished
            }
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

    
    // =====================================
    // GAME TIME SELECTION
    // =====================================

    const timeSelect =
        document.createElement("select");

    timeSelect.id = "gameMinutes";

    timeSelect.innerHTML = `
        <option value="5">5 Minutes</option>
        <option value="10">10 Minutes</option>
    `;

    timeSelect.style.cssText = `
        padding: 12px;
        background: #1e293b;
        color: white;
        border: 2px solid #38bdf8;
        border-radius: 8px;
        font-size: 15px;
        cursor: pointer;
    `;

    // Show selection before Create Room button
    createBtn.parentNode.insertBefore(
        timeSelect,
        createBtn
    );

    // =====================================
    // CREATE ROOM BUTTON
    // =====================================

    createBtn.addEventListener("click", () => {

        if (!socket.connected) {
            showMessage(
                "Socket not connected!",
                true
            );
            return;
        }

        if (currentRoom || waitingForResponse) {
            return;
        }

        const selectedMinutes =
            Number(timeSelect.value);

        waitingForResponse = true;

        updateButtons();

        showMessage(
            `Creating ${selectedMinutes}-minute room...`
        );

        socket.timeout(5000).emit(
            "room:create",
            {
                minutes: selectedMinutes
            },
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

     
    // =====================================
    // STEP 8.3B - DRAW OFFER UI
    // =====================================

    const offerDrawBtn =
        document.createElement("button");

    offerDrawBtn.id = "offerDrawBtn";
    offerDrawBtn.type = "button";
    offerDrawBtn.textContent = "🤝 Offer Draw";

    offerDrawBtn.style.cssText = `
        display: none;
        margin: 12px auto;
        padding: 12px 24px;
        background: #2563eb;
        color: #ffffff;
        border: none;
        border-radius: 8px;
        font-size: 16px;
        font-weight: bold;
        cursor: pointer;
    `;

    // Panel for incoming draw offer
    const drawOfferPanel =
        document.createElement("div");

    drawOfferPanel.id = "drawOfferPanel";

    drawOfferPanel.style.cssText = `
        display: none;
        margin: 15px auto;
        max-width: 420px;
        padding: 18px;
        background: #1e293b;
        border: 2px solid #38bdf8;
        border-radius: 12px;
        text-align: center;
        color: #ffffff;
    `;

    const drawOfferText =
        document.createElement("p");

    drawOfferText.textContent =
        "Your opponent has offered a draw.";

    const acceptDrawBtn =
        document.createElement("button");

    acceptDrawBtn.type = "button";
    acceptDrawBtn.textContent = "Accept Draw";

    acceptDrawBtn.style.cssText = `
        padding: 10px 16px;
        margin: 5px;
        background: #16a34a;
        color: white;
        border: none;
        border-radius: 8px;
        cursor: pointer;
    `;

    const declineDrawBtn =
        document.createElement("button");

    declineDrawBtn.type = "button";
    declineDrawBtn.textContent = "Decline Draw";

    declineDrawBtn.style.cssText = `
        padding: 10px 16px;
        margin: 5px;
        background: #dc2626;
        color: white;
        border: none;
        border-radius: 8px;
        cursor: pointer;
    `;

    drawOfferPanel.append(
        drawOfferText,
        acceptDrawBtn,
        declineDrawBtn
    );

    // Display draw-related messages
    const drawNotice =
        document.createElement("p");

    drawNotice.id = "drawNotice";

    drawNotice.style.cssText = `
        display: none;
        text-align: center;
        margin: 10px auto;
        color: #38bdf8;
    `;

    gameInfo.append(
        offerDrawBtn,
        drawOfferPanel,
        drawNotice
    );

    // Draw UI state
    let drawMatchFinished = false;
    let incomingDrawOffer = false;
    let outgoingDrawOffer = false;
    let drawRequestBusy = false;

    function showDrawNotice(
        message,
        isError = false
    ) {
        drawNotice.textContent = message;

        drawNotice.style.display =
            message ? "block" : "none";

        drawNotice.style.color = isError
            ? "#f87171"
            : "#38bdf8";
    }

    function updateDrawUI() {
        const activeMatch = Boolean(
            currentRoom &&
            clientRoomReady &&
            socket.connected &&
            !drawMatchFinished
        );

        offerDrawBtn.style.display =
            activeMatch ? "block" : "none";

        offerDrawBtn.disabled =
            !activeMatch ||
            incomingDrawOffer ||
            outgoingDrawOffer ||
            drawRequestBusy;

        drawOfferPanel.style.display =
            activeMatch && incomingDrawOffer
                ? "block"
                : "none";

        acceptDrawBtn.disabled = drawRequestBusy;
        declineDrawBtn.disabled = drawRequestBusy;

        if (!activeMatch) {
            drawOfferPanel.style.display = "none";
        }
    }

    function resetDrawUI() {
        drawMatchFinished = false;
        incomingDrawOffer = false;
        outgoingDrawOffer = false;
        drawRequestBusy = false;

        showDrawNotice("");
        updateDrawUI();
    }

    // =====================================
    // OFFER DRAW BUTTON
    // =====================================

    offerDrawBtn.addEventListener(
        "click",
        () => {
            if (
                !currentRoom ||
                !clientRoomReady ||
                drawMatchFinished ||
                incomingDrawOffer ||
                outgoingDrawOffer ||
                drawRequestBusy
            ) {
                return;
            }

            drawRequestBusy = true;
            updateDrawUI();

            socket.timeout(5000).emit(
                "game:offer-draw",
                (error, response) => {
                    drawRequestBusy = false;

                    if (error || !response?.ok) {
                        showDrawNotice(
                            error
                                ? "Draw request timed out."
                                : (
                                    response?.error ||
                                    "Could not offer draw."
                                ),
                            true
                        );

                        updateDrawUI();
                        return;
                    }

                    outgoingDrawOffer = true;

                    showDrawNotice(
                        "Draw offer sent. Waiting for opponent."
                    );

                    updateDrawUI();
                }
            );
        }
    );

    // =====================================
    // RECEIVE DRAW OFFER
    // =====================================

    socket.on("game:draw-offered", data => {
        if (
            !currentRoom ||
            data?.roomCode !== currentRoom.code ||
            data.from === currentRoom.color ||
            drawMatchFinished
        ) {
            return;
        }

        incomingDrawOffer = true;

        const playerName =
            data.from === "w" ? "White" : "Black";

        drawOfferText.textContent =
            `${playerName} Player offered a draw.`;

        showDrawNotice(
            "Your opponent is requesting a draw."
        );

        updateDrawUI();
    });

    // =====================================
    // ACCEPT / DECLINE DRAW
    // =====================================

    function respondToDraw(accept) {
        if (
            !currentRoom ||
            !incomingDrawOffer ||
            drawRequestBusy ||
            drawMatchFinished
        ) {
            return;
        }

        drawRequestBusy = true;
        updateDrawUI();

        socket.timeout(5000).emit(
            "game:respond-draw",
            accept,
            (error, response) => {
                drawRequestBusy = false;

                if (error || !response?.ok) {
                    showDrawNotice(
                        error
                            ? "Draw response timed out."
                            : (
                                response?.error ||
                                "Could not respond to draw."
                            ),
                        true
                    );

                    updateDrawUI();
                    return;
                }

                incomingDrawOffer = false;

                if (response.game?.gameOver) {
                    drawMatchFinished = true;

                    window.ChessArenaGame.syncRoom(
                        response.game,
                        clientRoomReady
                    );
                }

                updateDrawUI();
            }
        );
    }

    acceptDrawBtn.addEventListener(
        "click",
        () => respondToDraw(true)
    );

    declineDrawBtn.addEventListener(
        "click",
        () => respondToDraw(false)
    );

    // =====================================
    // DRAW OFFER RESOLVED
    // =====================================

    socket.on("game:draw-resolved", data => {
        if (
            !currentRoom ||
            data?.roomCode !== currentRoom.code
        ) {
            return;
        }

        incomingDrawOffer = false;
        outgoingDrawOffer = false;

        if (data.accepted) {
            drawMatchFinished = true;

            showDrawNotice(
                "Draw accepted. Match finished."
            );

        } else if (data.reason === "declined") {
            showDrawNotice(
                "Draw offer declined. Match continues."
            );

        } else if (data.reason === "move") {
            showDrawNotice(
                "Draw offer cancelled after a move."
            );

        } else {
            showDrawNotice(
                "Draw offer cancelled."
            );
        }

        updateDrawUI();
    });

    // =====================================
    // KEEP DRAW BUTTON IN SYNC
    // =====================================

    socket.on("room:state", state => {
        if (
            !currentRoom ||
            state?.roomCode !== currentRoom.code
        ) {
            return;
        }

        drawMatchFinished =
            Boolean(state.game?.gameOver);

        updateDrawUI();
    });

    socket.on("room:game", game => {
        if (!currentRoom) return;

        drawMatchFinished =
            Boolean(game?.gameOver);

        if (drawMatchFinished) {
            incomingDrawOffer = false;
            outgoingDrawOffer = false;
        }

        updateDrawUI();
    });

    socket.on("room:clock", data => {
        if (
            !currentRoom ||
            data?.roomCode !== currentRoom.code
        ) {
            return;
        }

        if (data.clock?.timedOutColor) {
            drawMatchFinished = true;
            updateDrawUI();
        }
    });

    socket.on("room:closed", resetDrawUI);
    socket.on("disconnect", resetDrawUI);



    updateButtons();

    console.log(
        "ChessArena ROOM + TIMER FIX Loaded!"
    );

})();
