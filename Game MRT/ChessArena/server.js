
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

// Local practice game
const localGame = new Chess();

// Online multiplayer rooms
const rooms = new Map();

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// ====================================
// CHESS GAME STATE
// ====================================

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

// ====================================
// ROOM MANAGEMENT
// ====================================

function generateRoomCode() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    let code;

    do {
        const bytes = crypto.randomBytes(6);

        code = Array.from(bytes, byte => {
            return chars[byte % chars.length];
        }).join("");

    } while (rooms.has(code));

    return code;
}

function getRoomState(room) {
    return {
        roomCode: room.code,
        playerCount: room.black ? 2 : 1,
        whiteConnected: Boolean(room.white),
        blackConnected: Boolean(room.black),
        ready: Boolean(room.white && room.black),

        // Each room has its own game state
        game: getGameState(room.game)
    };
}

function getPlayerRoom(socket) {
    const code = socket.data.roomCode;

    if (!code) return null;

    const room = rooms.get(code);

    if (!room) return null;

    const isMember =
        room.white === socket.id ||
        room.black === socket.id;

    return isMember ? room : null;
}

// ====================================
// EXISTING LOCAL GAME REST API
// ====================================

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

    if (!/^[a-h][1-8]$/.test(square)) {
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
        !/^[a-h][1-8]$/.test(from) ||
        !/^[a-h][1-8]$/.test(to)
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

    } catch (error) {
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

// ====================================
// REAL-TIME MULTIPLAYER
// ====================================

io.on("connection", (socket) => {

    console.log("Player Connected:", socket.id);

    // --------------------------------
    // CREATE ROOM
    // --------------------------------

    socket.on("room:create", (callback) => {

        if (typeof callback !== "function") return;

        if (getPlayerRoom(socket)) {
            return callback({
                ok: false,
                error: "Already in a room"
            });
        }

        const code = generateRoomCode();

        const room = {
            code,
            white: socket.id,
            black: null,

            // NEW: Separate chess game per room
            game: new Chess()
        };

        rooms.set(code, room);

        socket.join(code);

        socket.data.roomCode = code;
        socket.data.color = "w";

        console.log("Room Created:", code);

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
    });

    // --------------------------------
    // JOIN ROOM
    // --------------------------------

    socket.on("room:join", (requestedCode, callback) => {

        if (typeof callback !== "function") return;

        if (getPlayerRoom(socket)) {
            return callback({
                ok: false,
                error: "Already in a room"
            });
        }

        if (typeof requestedCode !== "string") {
            return callback({
                ok: false,
                error: "Invalid Room Code"
            });
        }

        const code = requestedCode.trim().toUpperCase();

        if (!/^[A-Z0-9]{6}$/.test(code)) {
            return callback({
                ok: false,
                error: "Invalid Room Code"
            });
        }

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

        console.log("Player Joined:", code);

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

    // --------------------------------
    // GET ONLINE GAME STATE
    // --------------------------------

    socket.on("game:state", (callback) => {

        if (typeof callback !== "function") return;

        const room = getPlayerRoom(socket);

        if (!room) {
            return callback({
                ok: false,
                error: "You are not in a room"
            });
        }

        callback({
            ok: true,
            game: getGameState(room.game)
        });
    });

    // --------------------------------
    // GET LEGAL MOVES
    // --------------------------------

    socket.on("game:legal-moves", (square, callback) => {

        if (typeof callback !== "function") return;

        const room = getPlayerRoom(socket);

        if (!room || !room.black) {
            return callback({
                ok: false,
                error: "Waiting for both players"
            });
        }

        if (
            typeof square !== "string" ||
            !/^[a-h][1-8]$/.test(square)
        ) {
            return callback({
                ok: false,
                error: "Invalid square"
            });
        }

        if (room.game.isGameOver()) {
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

    // --------------------------------
    // MAKE ONLINE CHESS MOVE
    // --------------------------------

    socket.on("game:move", (data, callback) => {

        if (typeof callback !== "function") return;

        const room = getPlayerRoom(socket);

        if (!room || !room.black) {
            return callback({
                ok: false,
                error: "Waiting for both players"
            });
        }

        if (room.game.isGameOver()) {
            return callback({
                ok: false,
                error: "Game already finished"
            });
        }

        // Only the correct player can move
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
            !/^[a-h][1-8]$/.test(data.from) ||
            !/^[a-h][1-8]$/.test(data.to)
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

            const gameState = getGameState(room.game);

            console.log(
                `Room ${room.code}: ${move.san}`
            );

            // Send updated game to BOTH players
            io.to(room.code).emit(
                "room:game",
                gameState
            );

            callback({
                ok: true,
                move: move.san,
                game: gameState
            });

        } catch (error) {
            callback({
                ok: false,
                error: "Illegal chess move"
            });
        }
    });

    // --------------------------------
    // PLAYER DISCONNECT
    // --------------------------------

    socket.on("disconnect", () => {

        console.log("Player Disconnected:", socket.id);

        const code = socket.data.roomCode;

        if (!code) return;

        const room = rooms.get(code);

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
                message: "Other player disconnected. Room closed."
            });
        }

        rooms.delete(code);

        console.log("Room Closed:", code);
    });
});

// ====================================
// START SERVER
// ====================================

httpServer.listen(PORT, () => {
    console.log(
        `ChessArena running at http://localhost:${PORT}`
    );

    console.log("Socket.IO Server is Ready!");
});
