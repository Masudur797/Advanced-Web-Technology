
const express = require("express");
const path = require("path");
const http = require("http");
const crypto = require("crypto");
const { Server } = require("socket.io");
const { Chess } = require("chess.js");

const app = express();
const PORT = process.env.PORT || 3000;

const httpServer = http.createServer(app);
const io = new Server(httpServer);

// Local practice chess game
const localGame = new Chess();

// Online multiplayer rooms
const rooms = new Map();

const SQUARE_RE = /^[a-h][1-8]$/;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// =====================================
// GAME STATE
// =====================================

function getGameState(game) {
    let status = "Game in progress";

    if (game.isCheckmate()) {
        const winner = game.turn() === "w"
            ? "Black"
            : "White";

        status = `Checkmate! ${winner} wins!`;

    } else if (game.isDraw()) {
        status = "Game Draw!";

    } else if (game.isCheck()) {
        status = "Check!";
    }

    return {
        fen: game.fen(),
        turn: game.turn(),
        gameOver: game.isGameOver(),
        status,
        history: game.history()
    };
}

// =====================================
// ROOM CODE GENERATOR
// =====================================

function generateRoomCode() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    let code;

    do {
        code = Array.from(
            crypto.randomBytes(6),
            byte => chars[byte % chars.length]
        ).join("");

    } while (rooms.has(code));

    return code;
}

// =====================================
// CHESS CLOCK STATE
// =====================================

function getClockState(room) {
    return {
        minutes: room.minutes,
        whiteMs: room.clock.whiteMs,
        blackMs: room.clock.blackMs,
        activeColor: room.clock.activeColor,
        running: Boolean(room.clock.activeColor),
        timedOutColor: room.timedOutColor
    };
}

// Game state with timeout information
function getRoomGameState(room) {
    const state = getGameState(room.game);

    if (room.timedOutColor) {
        state.gameOver = true;

        state.status = room.timedOutColor === "w"
            ? "Time out! Black wins."
            : "Time out! White wins.";
    }

    state.clock = getClockState(room);

    return state;
}

// =====================================
// ROOM STATE
// =====================================

function getRoomState(room) {
    return {
        roomCode: room.code,
        playerCount: room.black ? 2 : 1,
        whiteConnected: Boolean(room.white),
        blackConnected: Boolean(room.black),
        ready: Boolean(room.white && room.black),
        game: getRoomGameState(room)
    };
}

function getPlayerRoom(socket) {
    const code = socket.data.roomCode;
    const room = code && rooms.get(code);

    if (!room) return null;

    const isMember =
        room.white === socket.id ||
        room.black === socket.id;

    return isMember ? room : null;
}

// =====================================
// SERVER-SIDE CLOCK LOGIC
// =====================================

// Deduct actual elapsed time
function advanceClock(room) {
    const clock = room.clock;

    if (
        !clock.activeColor ||
        room.timedOutColor ||
        room.game.isGameOver()
    ) {
        return false;
    }

    const now = Date.now();

    const elapsed = Math.max(
        0,
        now - clock.lastUpdatedAt
    );

    const field = clock.activeColor === "w"
        ? "whiteMs"
        : "blackMs";

    clock[field] = Math.max(
        0,
        clock[field] - elapsed
    );

    clock.lastUpdatedAt = now;

    // Time expired
    if (clock[field] === 0) {
        room.timedOutColor = clock.activeColor;

        clock.activeColor = null;
        clock.lastUpdatedAt = null;

        return true;
    }

    return false;
}

// Broadcast updated chess game
function publishRoomGame(room) {
    io.to(room.code).emit(
        "room:game",
        getRoomGameState(room)
    );
}

// Advance time and notify on timeout
function updateClockAndPublishTimeout(room) {
    if (advanceClock(room)) {
        console.log(
            "TIME OUT:",
            room.code,
            room.timedOutColor
        );

        publishRoomGame(room);
    }
}

// =====================================
// LOCAL PRACTICE REST API
// =====================================

app.get("/api/health", (req, res) => {
    res.json({
        success: true,
        message: "ChessArena API is working"
    });
});

app.get("/api/game", (req, res) => {
    res.json(getGameState(localGame));
});

app.get("/api/game/legal-moves/:square", (req, res) => {
    const square = req.params.square;

    if (!SQUARE_RE.test(square)) {
        return res.status(400).json({
            error: "Invalid square"
        });
    }

    const moves = localGame.isGameOver()
        ? []
        : localGame.moves({
            square,
            verbose: true
        });

    res.json({
        moves: moves.map(move => ({
            from: move.from,
            to: move.to,
            san: move.san
        }))
    });
});

app.post("/api/game/move", (req, res) => {
    const { from, to } = req.body || {};

    if (
        typeof from !== "string" ||
        typeof to !== "string" ||
        !SQUARE_RE.test(from) ||
        !SQUARE_RE.test(to)
    ) {
        return res.status(400).json({
            error: "Invalid move format"
        });
    }

    if (localGame.isGameOver()) {
        return res.status(400).json({
            error: "Game already finished"
        });
    }

    try {
        const move = localGame.move({
            from,
            to,
            promotion: "q"
        });

        res.json({
            success: true,
            move: move.san,
            ...getGameState(localGame)
        });

    } catch {
        res.status(400).json({
            error: "Illegal chess move"
        });
    }
});

app.post("/api/game/reset", (req, res) => {
    localGame.reset();

    res.json({
        success: true,
        ...getGameState(localGame)
    });
});

// =====================================
// SOCKET.IO MULTIPLAYER
// =====================================

io.on("connection", socket => {
    console.log("Player Connected:", socket.id);

    // ---------------------------------
    // CREATE ROOM
    // ---------------------------------

    socket.on(
        "room:create",
        (optionsOrCallback, maybeCallback) => {

            const callback =
                typeof optionsOrCallback === "function"
                    ? optionsOrCallback
                    : maybeCallback;

            const options =
                typeof optionsOrCallback === "object" &&
                optionsOrCallback !== null
                    ? optionsOrCallback
                    : {};

            if (typeof callback !== "function") return;

            if (getPlayerRoom(socket)) {
                return callback({
                    ok: false,
                    error: "Already in a room"
                });
            }

            // Default = 5 minutes
            const minutes = options.minutes === undefined
                ? 5
                : options.minutes;

            if (![5, 10].includes(minutes)) {
                return callback({
                    ok: false,
                    error: "Choose 5 or 10 minutes"
                });
            }

            const code = generateRoomCode();
            const initialMs = minutes * 60 * 1000;

            const room = {
                code,
                white: socket.id,
                black: null,

                game: new Chess(),

                minutes,
                timedOutColor: null,

                clock: {
                    whiteMs: initialMs,
                    blackMs: initialMs,
                    activeColor: null,
                    lastUpdatedAt: null
                }
            };

            rooms.set(code, room);

            socket.join(code);

            socket.data.roomCode = code;
            socket.data.color = "w";

            console.log(
                "Room Created:",
                code,
                `${minutes} min`
            );

            callback({
                ok: true,
                roomCode: code,
                color: "w",
                state: getRoomState(room)
            });

            io.to(code).emit(
                "room:state",
                getRoomState(room)
            );
        }
    );

    // ---------------------------------
    // JOIN ROOM AND START CLOCK
    // ---------------------------------

    socket.on("room:join", (requestedCode, callback) => {
        if (typeof callback !== "function") return;

        if (getPlayerRoom(socket)) {
            return callback({
                ok: false,
                error: "Already in a room"
            });
        }

        if (
            typeof requestedCode !== "string" ||
            !/^[A-Z0-9]{6}$/.test(
                requestedCode.trim().toUpperCase()
            )
        ) {
            return callback({
                ok: false,
                error: "Invalid Room Code"
            });
        }

        const code = requestedCode.trim().toUpperCase();
        const room = rooms.get(code);

        if (!room) {
            return callback({
                ok: false,
                error: "Room Not Found"
            });
        }

        if (room.black) {
            return callback({
                ok: false,
                error: "Room is already full"
            });
        }

        room.black = socket.id;

        socket.join(code);

        socket.data.roomCode = code;
        socket.data.color = "b";

        // Start White player's clock
        room.clock.activeColor = "w";
        room.clock.lastUpdatedAt = Date.now();

        console.log(
            "Player Joined:",
            code,
            "- clock started"
        );

        callback({
            ok: true,
            roomCode: code,
            color: "b",
            state: getRoomState(room)
        });

        io.to(code).emit(
            "room:state",
            getRoomState(room)
        );
    });

    // ---------------------------------
    // GET ONLINE GAME STATE
    // ---------------------------------

    socket.on("game:state", callback => {
        if (typeof callback !== "function") return;

        const room = getPlayerRoom(socket);

        if (!room) {
            return callback({
                ok: false,
                error: "You are not in a room"
            });
        }

        updateClockAndPublishTimeout(room);

        callback({
            ok: true,
            game: getRoomGameState(room)
        });
    });

    // ---------------------------------
    // GET LEGAL MOVES
    // ---------------------------------

    socket.on("game:legal-moves", (square, callback) => {
        if (typeof callback !== "function") return;

        const room = getPlayerRoom(socket);

        if (!room || !room.black) {
            return callback({
                ok: false,
                error: "Waiting for both players"
            });
        }

        updateClockAndPublishTimeout(room);

        if (room.timedOutColor || room.game.isGameOver()) {
            return callback({
                ok: false,
                error: "Game already finished"
            });
        }

        if (
            typeof square !== "string" ||
            !SQUARE_RE.test(square)
        ) {
            return callback({
                ok: false,
                error: "Invalid square"
            });
        }

        if (room.game.turn() !== socket.data.color) {
            return callback({
                ok: false,
                error: "Not your turn"
            });
        }

        const piece = room.game.get(square);

        if (!piece || piece.color !== socket.data.color) {
            return callback({
                ok: true,
                moves: []
            });
        }

        const moves = room.game.moves({
            square,
            verbose: true
        });

        callback({
            ok: true,
            moves: moves.map(move => ({
                from: move.from,
                to: move.to,
                san: move.san,
                promotion: move.promotion || null
            }))
        });
    });

    // ---------------------------------
    // MAKE ONLINE MOVE
    // ---------------------------------

    socket.on("game:move", (data, callback) => {
        if (typeof callback !== "function") return;

        const room = getPlayerRoom(socket);

        if (!room || !room.black) {
            return callback({
                ok: false,
                error: "Waiting for both players"
            });
        }

        // Deduct time before validating move
        updateClockAndPublishTimeout(room);

        if (room.timedOutColor || room.game.isGameOver()) {
            return callback({
                ok: false,
                error: "Game already finished"
            });
        }

        if (room.game.turn() !== socket.data.color) {
            return callback({
                ok: false,
                error: "Not your turn"
            });
        }

        if (
            !data ||
            typeof data !== "object" ||
            typeof data.from !== "string" ||
            typeof data.to !== "string" ||
            !SQUARE_RE.test(data.from) ||
            !SQUARE_RE.test(data.to)
        ) {
            return callback({
                ok: false,
                error: "Invalid move format"
            });
        }

        const promotion = data.promotion || "q";

        if (!["q", "r", "b", "n"].includes(promotion)) {
            return callback({
                ok: false,
                error: "Invalid promotion"
            });
        }

        try {
            const move = room.game.move({
                from: data.from,
                to: data.to,
                promotion
            });

            // Switch to next player's clock
            if (room.game.isGameOver()) {
                room.clock.activeColor = null;
                room.clock.lastUpdatedAt = null;

            } else {
                room.clock.activeColor = room.game.turn();
                room.clock.lastUpdatedAt = Date.now();
            }

            console.log(
                `Room ${room.code}: ${move.san}`
            );

            publishRoomGame(room);

            callback({
                ok: true,
                move: move.san,
                game: getRoomGameState(room)
            });

        } catch {
            callback({
                ok: false,
                error: "Illegal chess move"
            });
        }
    });

    // ---------------------------------
    // PLAYER DISCONNECT
    // ---------------------------------

    socket.on("disconnect", () => {
        console.log("Player Disconnected:", socket.id);

        const code = socket.data.roomCode;
        const room = code && rooms.get(code);

        if (!room) return;

        const otherId = room.white === socket.id
            ? room.black
            : room.white;

        const otherSocket = otherId
            ? io.sockets.sockets.get(otherId)
            : null;

        if (otherSocket) {
            otherSocket.data.roomCode = null;
            otherSocket.data.color = null;

            otherSocket.leave(code);

            otherSocket.emit("room:closed", {
                message:
                    "Other player disconnected. Room closed."
            });
        }

        rooms.delete(code);

        console.log("Room Closed:", code);
    });
});

// =====================================
// CLOCK BROADCAST EVERY SECOND
// =====================================

setInterval(() => {
    for (const room of rooms.values()) {

        if (!room.black) continue;

        updateClockAndPublishTimeout(room);

        io.to(room.code).emit("room:clock", {
            roomCode: room.code,
            clock: getClockState(room)
        });
    }
}, 1000);

// =====================================
// START SERVER
// =====================================

httpServer.listen(PORT, () => {
    console.log(
        `ChessArena running at http://localhost:${PORT}`
    );

    console.log("Socket.IO Server is Ready!");
    console.log("Chess Clock Server is Ready!");
});
