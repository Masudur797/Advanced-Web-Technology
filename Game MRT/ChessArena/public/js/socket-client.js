
const socket = io();

// UI Elements
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

// Connection indicator
const connectionStatus = document.createElement("p");

connectionStatus.id = "connectionStatus";
connectionStatus.textContent = "Socket: Connecting...";

document.querySelector(".game-info")
    .appendChild(connectionStatus);

// Current room
let currentRoom = null;

// Display room message
function showRoomMessage(message, isError = false) {
    roomStatus.textContent = message;

    roomStatus.style.color = isError
        ? "#f87171"
        : "#22c55e";
}

// Enable or disable room controls
function updateControls() {
    const canChooseRoom =
        socket.connected && !currentRoom;

    createRoomBtn.disabled = !canChooseRoom;
    joinRoomBtn.disabled = !canChooseRoom;
    roomCodeInput.disabled = !canChooseRoom;
}

// Clear room information
function clearRoom(message) {
    currentRoom = null;

    roomDetails.textContent = "Not in a room";

    showRoomMessage(message, true);
    updateControls();
}

// Update current room information
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

    if (state.ready) {
        showRoomMessage(
            "Both players joined! Move sync comes in Step 5.3."
        );
    } else {
        showRoomMessage("Waiting for second player...");
    }
}

// Handle create/join response
function handleRoomResponse(error, response) {
    if (!socket.connected) return;

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

    updateRoomState(response.state);
    updateControls();
}

// Socket connected
socket.on("connect", () => {

    console.log("Socket Connected:", socket.id);

    connectionStatus.textContent = "🟢 Socket Connected";
    connectionStatus.style.color = "#22c55e";

    // On reconnection, old room membership is not restored
    if (currentRoom) {
        clearRoom("Reconnected. Please create or join a room.");
    } else {
        updateControls();
    }
});

// Socket disconnected
socket.on("disconnect", () => {

    connectionStatus.textContent =
        "🔴 Socket Disconnected";

    connectionStatus.style.color = "#ef4444";

    clearRoom("Connection lost. Please reconnect.");
});

// Socket connection error
socket.on("connect_error", (error) => {

    console.error("Socket Error:", error.message);

    connectionStatus.textContent =
        "Connection Failed";

    connectionStatus.style.color = "#ef4444";

    updateControls();
});

// Receive room updates
socket.on("room:state", (state) => {
    updateRoomState(state);
});

// Room closed
socket.on("room:closed", (data) => {
    clearRoom(data.message || "Room closed");
});

// Create Room button
createRoomBtn.addEventListener("click", () => {

    if (!socket.connected || currentRoom) return;

    createRoomBtn.disabled = true;
    joinRoomBtn.disabled = true;

    showRoomMessage("Creating room...");

    socket.timeout(5000).emit(
        "room:create",
        handleRoomResponse
    );
});

// Join Room button
joinRoomBtn.addEventListener("click", () => {

    if (!socket.connected || currentRoom) return;

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

    createRoomBtn.disabled = true;
    joinRoomBtn.disabled = true;

    showRoomMessage("Joining room...");

    socket.timeout(5000).emit(
        "room:join",
        code,
        handleRoomResponse
    );
});

// Initially disable buttons until connected
updateControls();
