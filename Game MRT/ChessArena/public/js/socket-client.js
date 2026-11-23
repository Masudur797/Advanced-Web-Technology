
const socket = io();

// Allow app.js to send socket requests
window.chessArenaSocket = socket;

// Room UI
const createRoomBtn =
    document.getElementById("createRoomBtn");

const joinRoomBtn =
    document.getElementById("joinRoomBtn");

const roomCodeInput =
    document.getElementById("roomCodeInput");

const roomStatus =
    document.getElementById("roomStatus");

const roomDetails =
    document.getElementById("roomDetails");

// Connection status
const connectionStatus = document.createElement("p");

connectionStatus.id = "connectionStatus";
connectionStatus.textContent = "Socket: Connecting...";

connectionStatus.style.marginTop = "15px";

document.querySelector(".game-info")
    .appendChild(connectionStatus);

// Multiplayer room information
let currentRoom = null;
let waitingForRoomResponse = false;

// Display room messages
function showRoomMessage(message, isError = false) {
    roomStatus.textContent = message;

    roomStatus.style.color = isError
        ? "#f87171"
        : "#22c55e";
}

// Update buttons
function updateControls() {
    const canChooseRoom =
        socket.connected &&
        !currentRoom &&
        !waitingForRoomResponse;

    createRoomBtn.disabled = !canChooseRoom;
    joinRoomBtn.disabled = !canChooseRoom;
    roomCodeInput.disabled = !canChooseRoom;
}

// Clear room when connection is lost
function clearRoom(message) {
    currentRoom = null;
    waitingForRoomResponse = false;

    roomDetails.textContent = "Not in a room";

    window.ChessArenaGame.leaveRoom();

    showRoomMessage(message, true);
    updateControls();
}

// Update room details
function updateRoomState(state) {
    if (!currentRoom) return;

    if (currentRoom.code !== state.roomCode) {
        return;
    }

    const color = currentRoom.color === "w"
        ? "White"
        : "Black";

    roomDetails.textContent =
        `Room: ${state.roomCode} | ` +
        `You: ${color} | ` +
        `Players: ${state.playerCount}/2`;

    // Synchronize the room's chess state
    window.ChessArenaGame.syncRoom(
        state.game,
        state.ready
    );

    if (state.ready) {
        showRoomMessage(
            "Both players joined! Game is ready."
        );
    } else {
        showRoomMessage(
            "Waiting for second player..."
        );
    }
}

// Handle Create Room / Join Room response
function handleRoomResponse(error, response) {
    waitingForRoomResponse = false;

    if (!socket.connected) {
        clearRoom("Connection lost. Please reconnect.");
        return;
    }

    if (error || !response || !response.ok) {
        const message = error
            ? "Server response timeout"
            : response?.error || "Request failed";

        showRoomMessage(message, true);
        updateControls();
        return;
    }

    currentRoom = {
        code: response.roomCode,
        color: response.color
    };

    // Switch local chess board into online mode
    window.ChessArenaGame.enterRoom(
        response.state.game,
        response.color,
        response.state.ready
    );

    updateRoomState(response.state);
    updateControls();
}

// Socket Connected
socket.on("connect", () => {
    console.log("Socket Connected:", socket.id);

    connectionStatus.textContent =
        "🟢 Socket Connected";

    connectionStatus.style.color = "#22c55e";

    if (currentRoom) {
        clearRoom(
            "Reconnected. Please create or join a new room."
        );
    } else {
        updateControls();
    }
});

// Socket Disconnected
socket.on("disconnect", () => {
    console.log("Socket Disconnected");

    connectionStatus.textContent =
        "🔴 Socket Disconnected";

    connectionStatus.style.color = "#ef4444";

    clearRoom("Connection lost. Room closed.");
});

// Connection Error
socket.on("connect_error", error => {
    console.error("Socket Error:", error.message);

    connectionStatus.textContent =
        "Connection Failed";

    connectionStatus.style.color = "#ef4444";

    updateControls();
});

// Receive room information
socket.on("room:state", state => {
    updateRoomState(state);
});

// NEW: Receive real-time chess moves
socket.on("room:game", game => {
    if (!currentRoom) return;

    console.log("Game State Updated:", game.fen);

    window.ChessArenaGame.syncRoom(game, true);
});

// Room closed by server
socket.on("room:closed", data => {
    clearRoom(
        data.message || "Room closed"
    );
});

// Create Room
createRoomBtn.addEventListener("click", () => {
    if (!socket.connected || currentRoom) return;
    if (waitingForRoomResponse) return;

    waitingForRoomResponse = true;
    updateControls();

    showRoomMessage("Creating room...");

    socket.timeout(5000).emit(
        "room:create",
        handleRoomResponse
    );
});

// Join Room
joinRoomBtn.addEventListener("click", () => {
    if (!socket.connected || currentRoom) return;
    if (waitingForRoomResponse) return;

    const code = roomCodeInput.value
        .trim()
        .toUpperCase();

    if (!/^[A-Z0-9]{6}$/.test(code)) {
        showRoomMessage(
            "Enter a valid 6-character Room Code",
            true
        );
        return;
    }

    waitingForRoomResponse = true;
    updateControls();

    showRoomMessage("Joining room...");

    socket.timeout(5000).emit(
        "room:join",
        code,
        handleRoomResponse
    );
});

// Disable controls until socket connects
updateControls();
