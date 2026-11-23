
const express = require("express");
const path = require("path");
const { Chess } = require("chess.js");

const app = express();
const PORT = process.env.PORT || 3000;

// Temporary single game (Step 4)
const game = new Chess();

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Get current game status
function getGameState() {
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
        status: status,
        history: game.history()
    };
}

// Health Check API
app.get("/api/health", (req, res) => {
    res.json({
        success: true,
        message: "ChessArena API is working"
    });
});

// Get chess board state
app.get("/api/game", (req, res) => {
    res.json(getGameState());
});

// Get legal moves for a square
app.get("/api/game/legal-moves/:square", (req, res) => {
    const square = req.params.square;

    if (!/^[a-h][1-8]$/.test(square)) {
        return res.status(400).json({
            error: "Invalid square"
        });
    }

    const moves = game.isGameOver()
        ? []
        : game.moves({
            square: square,
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

// Make a chess move
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

    if (game.isGameOver()) {
        return res.status(400).json({
            error: "Game already finished"
        });
    }

    try {
        const move = game.move({
            from,
            to,
            promotion: "q"
        });

        res.json({
            success: true,
            move: move.san,
            ...getGameState()
        });
    } catch (error) {
        res.status(400).json({
            error: "Illegal chess move"
        });
    }
});

// Reset game
app.post("/api/game/reset", (req, res) => {
    game.reset();

    res.json({
        success: true,
        ...getGameState()
    });
});

// Start server
app.listen(PORT, () => {
    console.log(
        `ChessArena running at http://localhost:${PORT}`
    );
});

