
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

// Multiplayer rooms
const rooms = new Map();

const SQUARE_RE = /^[a-h][1-8]$/;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// =====================================
// CHESS GAME STATE
// =====================================

function getGameState(game) {
    let status = "Game in progress";

    if (game.isCheckmate()) {
        status = game.turn() === "w"
            ? "Checkmate! Black wins!"
            : "Checkmate! White wins!";

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
    const chars =
        "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

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

// =====================================
// ONLINE ROOM GAME STATE
// =====================================

function getRoomGameState(room) {
    const state = getGameState(room.game);

    // Time Out
    if (room.timedOutColor) {
        state.gameOver = true;

        state.status =
            room.timedOutColor === "w"
                ? "Time out! Black wins."
                : "Time out! White wins.";

    // Resign
    } else if (room.resignedColor) {
        state.gameOver = true;

        state.status =
            room.resignedColor === "w"
                ? "White resigned! Black wins."
                : "Black resigned! White wins.";

    // Draw by agreement
    } else if (room.drawAgreed) {
        state.gameOver = true;
        state.status = "Draw by agreement.";
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

        ready: Boolean(
            room.white && room.black
        ),

        game: getRoomGameState(room)
    };
}

// =====================================
// FIND PLAYER ROOM
// =====================================

function getPlayerRoom(socket) {
    const code = socket.data.roomCode;

    const room = code && rooms.get(code);

    if (!room) {
        return null;
    }

    const isMember =
        room.white === socket.id ||
        room.black === socket.id;

    return isMember ? room : null;
}

// =====================================
// CHECK IF MATCH FINISHED
// =====================================

function isRoomGameOver(room) {
    return Boolean(
        room.timedOutColor ||
        room.resignedColor ||
        room.drawAgreed ||
        room.game.isGameOver()
    );
}

// =====================================
// SERVER-SIDE CHESS CLOCK
// =====================================

function advanceClock(room) {
    const clock = room.clock;

    if (
        !clock.activeColor ||
        isRoomGameOver(room)
    ) {
        return false;
    }

    const now = Date.now();

    const elapsed = Math.max(
        0,
        now - clock.lastUpdatedAt
    );

    const field =
        clock.activeColor === "w"
            ? "whiteMs"
            : "blackMs";

    // Deduct elapsed time
    clock[field] = Math.max(
        0,
        clock[field] - elapsed
    );

    clock.lastUpdatedAt = now;

    // Time finished
    if (clock[field] === 0) {
        room.timedOutColor =
            clock.activeColor;

        clock.activeColor = null;
        clock.lastUpdatedAt = null;

        return true;
    }

    return false;
}

// =====================================
// BROADCAST CHESS GAME
// =====================================

function publishRoomGame(room) {
    io.to(room.code).emit(
        "room:game",
        getRoomGameState(room)
    );
}

// =====================================
// CANCEL PENDING DRAW OFFER
// =====================================

function resolvePendingDraw(room, reason) {
    if (!room.pendingDrawOffer) {
        return;
    }

    room.pendingDrawOffer = null;

    io.to(room.code).emit(
        "game:draw-resolved",
        {
            roomCode: room.code,
            accepted: false,
            reason
        }
    );
}

// =====================================
// UPDATE CLOCK AND HANDLE TIMEOUT
// =====================================

function updateClockAndPublishTimeout(room) {
    if (advanceClock(room)) {
        resolvePendingDraw(
            room,
            "game-over"
        );

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

// Health Check
app.get("/api/health", (req, res) => {
    res.json({
        success: true,
        message: "ChessArena API is working"
    });
});

// Get local game
app.get("/api/game", (req, res) => {
    res.json(getGameState(localGame));
});

// Get legal moves
app.get(
    "/api/game/legal-moves/:square",
    (req, res) => {

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
    }
);

// Make local move
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

// Reset local game
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

    console.log(
        "Player Connected:",
        socket.id
    );

    // =================================
    // CREATE ROOM
    // =================================

    socket.on(
        "room:create",
        (optionsOrCallback, maybeCallback) => {

            // Support both:
            // room:create(callback)
            // room:create({ minutes: 5 }, callback)

            const callback =
                typeof optionsOrCallback === "function"
                    ? optionsOrCallback
                    : maybeCallback;

            const options =
                optionsOrCallback &&
                typeof optionsOrCallback === "object"
                    ? optionsOrCallback
                    : {};

            if (
                typeof callback !== "function"
            ) {
                return;
            }

            if (getPlayerRoom(socket)) {
                return callback({
                    ok: false,
                    error: "Already in a room"
                });
            }

            const minutes =
                options.minutes === undefined
                    ? 5
                    : options.minutes;

            if (![5, 10].includes(minutes)) {
                return callback({
                    ok: false,
                    error: "Choose 5 or 10 minutes"
                });
            }

            const code = generateRoomCode();

            const initialMs =
                minutes * 60 * 1000;

            const room = {
                code,

                white: socket.id,
                black: null,

                game: new Chess(),

                minutes,

                // Match results
                timedOutColor: null,
                resignedColor: null,

                // Draw Offer
                pendingDrawOffer: null,
                drawAgreed: false,

                // Chess Timer
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

    // =================================
    // JOIN ROOM
    // =================================

    socket.on(
        "room:join",
        (requestedCode, callback) => {

            if (
                typeof callback !== "function"
            ) {
                return;
            }

            if (getPlayerRoom(socket)) {
                return callback({
                    ok: false,
                    error: "Already in a room"
                });
            }

            if (
                typeof requestedCode !== "string" ||
                !/^[A-Z0-9]{6}$/.test(
                    requestedCode
                        .trim()
                        .toUpperCase()
                )
            ) {
                return callback({
                    ok: false,
                    error: "Invalid Room Code"
                });
            }

            const code =
                requestedCode
                    .trim()
                    .toUpperCase();

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

            // Start White timer
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
        }
    );

    // =================================
    // GET GAME STATE
    // =================================

    socket.on(
        "game:state",
        callback => {

            if (
                typeof callback !== "function"
            ) {
                return;
            }

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
        }
    );

    // =================================
    // GET LEGAL MOVES
    // =================================

    socket.on(
        "game:legal-moves",
        (square, callback) => {

            if (
                typeof callback !== "function"
            ) {
                return;
            }

            const room = getPlayerRoom(socket);

            if (!room || !room.black) {
                return callback({
                    ok: false,
                    error: "Waiting for both players"
                });
            }

            updateClockAndPublishTimeout(room);

            if (isRoomGameOver(room)) {
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

            if (
                room.game.turn() !==
                socket.data.color
            ) {
                return callback({
                    ok: false,
                    error: "Not your turn"
                });
            }

            const piece = room.game.get(square);

            if (
                !piece ||
                piece.color !== socket.data.color
            ) {
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
                    promotion:
                        move.promotion || null
                }))
            });
        }
    );

    // =================================
    // MAKE ONLINE MOVE
    // =================================

    socket.on(
        "game:move",
        (data, callback) => {

            if (
                typeof callback !== "function"
            ) {
                return;
            }

            const room = getPlayerRoom(socket);

            if (!room || !room.black) {
                return callback({
                    ok: false,
                    error: "Waiting for both players"
                });
            }

            // Update clock first
            updateClockAndPublishTimeout(room);

            if (isRoomGameOver(room)) {
                return callback({
                    ok: false,
                    error: "Game already finished"
                });
            }

            if (
                room.game.turn() !==
                socket.data.color
            ) {
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

            const promotion =
                data.promotion || "q";

            if (
                !["q", "r", "b", "n"].includes(
                    promotion
                )
            ) {
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

                // A completed move cancels
                // a pending draw offer
                resolvePendingDraw(
                    room,
                    "move"
                );

                // Switch timer
                if (room.game.isGameOver()) {
                    room.clock.activeColor = null;
                    room.clock.lastUpdatedAt = null;

                } else {
                    room.clock.activeColor =
                        room.game.turn();

                    room.clock.lastUpdatedAt =
                        Date.now();
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
        }
    );

    // =================================
    // OFFER DRAW
    // =================================

    socket.on(
        "game:offer-draw",
        callback => {

            if (
                typeof callback !== "function"
            ) {
                return;
            }

            const room = getPlayerRoom(socket);

            if (!room || !room.black) {
                return callback({
                    ok: false,
                    error: "No active multiplayer match"
                });
            }

            updateClockAndPublishTimeout(room);

            if (isRoomGameOver(room)) {
                return callback({
                    ok: false,
                    error: "Match already finished"
                });
            }

            if (room.pendingDrawOffer) {
                return callback({
                    ok: false,
                    error: "A draw offer is already pending"
                });
            }

            const playerColor =
                socket.data.color;

            room.pendingDrawOffer =
                playerColor;

            const opponentId =
                playerColor === "w"
                    ? room.black
                    : room.white;

            // Notify opponent
            io.to(opponentId).emit(
                "game:draw-offered",
                {
                    roomCode: room.code,
                    from: playerColor
                }
            );

            console.log(
                `Room ${room.code}: ` +
                `Draw offered by ${playerColor}`
            );

            callback({
                ok: true,
                message: "Draw offer sent"
            });
        }
    );

    // =================================
    // ACCEPT / DECLINE DRAW
    // =================================

    socket.on(
        "game:respond-draw",
        (accept, callback) => {

            if (
                typeof callback !== "function"
            ) {
                return;
            }

            const room = getPlayerRoom(socket);

            if (!room || !room.black) {
                return callback({
                    ok: false,
                    error: "No active multiplayer match"
                });
            }

            if (
                typeof accept !== "boolean"
            ) {
                return callback({
                    ok: false,
                    error: "Invalid draw response"
                });
            }

            updateClockAndPublishTimeout(room);

            if (isRoomGameOver(room)) {
                resolvePendingDraw(
                    room,
                    "game-over"
                );

                return callback({
                    ok: false,
                    error: "Match already finished"
                });
            }

            if (!room.pendingDrawOffer) {
                return callback({
                    ok: false,
                    error: "No pending draw offer"
                });
            }

            // Cannot accept own offer
            if (
                room.pendingDrawOffer ===
                socket.data.color
            ) {
                return callback({
                    ok: false,
                    error: "Cannot respond to your own offer"
                });
            }

            room.pendingDrawOffer = null;

            if (accept) {
                room.drawAgreed = true;

                // Stop both chess clocks
                room.clock.activeColor = null;
                room.clock.lastUpdatedAt = null;

                publishRoomGame(room);
            }

            io.to(room.code).emit(
                "game:draw-resolved",
                {
                    roomCode: room.code,
                    accepted: accept,
                    reason: accept
                        ? "accepted"
                        : "declined"
                }
            );

            console.log(
                `Room ${room.code}: Draw ` +
                `${accept ? "accepted" : "declined"}`
            );

            callback({
                ok: true,
                accepted: accept,
                game: getRoomGameState(room)
            });
        }
    );

    // =================================
    // RESIGN MATCH
    // =================================

    socket.on(
        "game:resign",
        callback => {

            if (
                typeof callback !== "function"
            ) {
                return;
            }

            const room = getPlayerRoom(socket);

            if (!room || !room.black) {
                return callback({
                    ok: false,
                    error: "No active multiplayer match"
                });
            }

            updateClockAndPublishTimeout(room);

            if (isRoomGameOver(room)) {
                return callback({
                    ok: false,
                    error: "Match already finished"
                });
            }

            room.resignedColor =
                socket.data.color;

            resolvePendingDraw(
                room,
                "game-over"
            );

            // Stop timers
            room.clock.activeColor = null;
            room.clock.lastUpdatedAt = null;

            const playerName =
                room.resignedColor === "w"
                    ? "White"
                    : "Black";

            console.log(
                `Room ${room.code}: ` +
                `${playerName} resigned`
            );

            publishRoomGame(room);

            callback({
                ok: true,
                game: getRoomGameState(room)
            });
        }
    );

    // =================================
    // PLAYER DISCONNECT
    // =================================

    socket.on("disconnect", () => {
        console.log(
            "Player Disconnected:",
            socket.id
        );

        const code = socket.data.roomCode;

        const room = code && rooms.get(code);

        if (!room) return;

        const otherId =
            room.white === socket.id
                ? room.black
                : room.white;

        const otherSocket =
            otherId
                ? io.sockets.sockets.get(otherId)
                : null;

        if (otherSocket) {
            otherSocket.data.roomCode = null;
            otherSocket.data.color = null;

            otherSocket.leave(code);

            otherSocket.emit(
                "room:closed",
                {
                    message:
                        "Other player disconnected. Room closed."
                }
            );
        }

        rooms.delete(code);

        console.log(
            "Room Closed:",
            code
        );
    });
});

// =====================================
// CLOCK UPDATE EVERY SECOND
// =====================================

setInterval(() => {
    for (const room of rooms.values()) {

        if (!room.black) {
            continue;
        }

        updateClockAndPublishTimeout(room);

        io.to(room.code).emit(
            "room:clock",
            {
                roomCode: room.code,
                clock: getClockState(room)
            }
        );
    }
}, 1000);

// =====================================
// START SERVER
// =====================================

httpServer.listen(PORT, () => {
    console.log(
        `ChessArena running at http://localhost:${PORT}`
    );

    console.log(
        "Socket.IO Server is Ready!"
    );

    console.log(
        "Chess Clock Server is Ready!"
    );
});
