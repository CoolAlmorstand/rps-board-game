import { createServer } from "node:http";
import express from "express";
import { Server } from "socket.io";
import { Board, } from "@rps/shared";
const app = express();
const port = Number(process.env.PORT ?? 3000);
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: { origin: "*" },
});
const games = new Map();
const socketRooms = new Map();
const ROOM_CODE_PATTERN = /^[A-HJ-NP-Z2-9]{5}$/;
const MAX_USERNAME_LENGTH = 24;
function getGameState(game) {
    return {
        roomCode: game.roomCode,
        board: game.board.getState(),
        activeTeam: game.activeTeam,
        winner: game.winner,
        status: game.status,
        players: {
            blue: game.players.blue?.username ?? null,
            red: game.players.red?.username ?? null,
        },
    };
}
function emitGameState(game) {
    io.to(game.roomCode).emit("game_state", getGameState(game));
}
function normalizePayload(payload) {
    if (typeof payload?.roomCode !== "string" || typeof payload?.username !== "string") {
        return null;
    }
    const roomCode = payload.roomCode.trim().toUpperCase();
    const username = payload.username.trim().slice(0, MAX_USERNAME_LENGTH);
    if (!ROOM_CODE_PATTERN.test(roomCode) || !username) {
        return null;
    }
    return { roomCode, username };
}
function getPlayerTeam(game, socketId) {
    if (game.players.blue?.socketId === socketId) {
        return "blue";
    }
    if (game.players.red?.socketId === socketId) {
        return "red";
    }
    return null;
}
app.get("/", (_request, response) => {
    response.json({ status: "ok" });
});
io.on("connection", (socket) => {
    socket.on("create_game", (payload, acknowledge) => {
        if (socketRooms.has(socket.id)) {
            acknowledge({ ok: false, error: "You are already in a game." });
            return;
        }
        const normalizedPayload = normalizePayload(payload);
        if (!normalizedPayload) {
            acknowledge({ ok: false, error: "Enter a valid username and room code." });
            return;
        }
        const { roomCode, username } = normalizedPayload;
        if (games.has(roomCode)) {
            acknowledge({ ok: false, error: "That room code is already in use." });
            return;
        }
        const game = {
            roomCode,
            board: new Board(10, 10),
            players: {
                blue: { socketId: socket.id, username },
                red: null,
            },
            activeTeam: null,
            winner: null,
            status: "waiting",
        };
        games.set(roomCode, game);
        socketRooms.set(socket.id, roomCode);
        void socket.join(roomCode);
        acknowledge({ ok: true, team: "blue" });
        emitGameState(game);
    });
    socket.on("join_game", (payload, acknowledge) => {
        if (socketRooms.has(socket.id)) {
            acknowledge({ ok: false, error: "You are already in a game." });
            return;
        }
        const normalizedPayload = normalizePayload(payload);
        if (!normalizedPayload) {
            acknowledge({ ok: false, error: "Enter a valid username and room code." });
            return;
        }
        const { roomCode, username } = normalizedPayload;
        const game = games.get(roomCode);
        if (!game) {
            acknowledge({ ok: false, error: "Room not found." });
            return;
        }
        const availableTeam = !game.players.blue
            ? "blue"
            : !game.players.red
                ? "red"
                : null;
        if (!availableTeam) {
            acknowledge({ ok: false, error: "That room is full." });
            return;
        }
        game.players[availableTeam] = { socketId: socket.id, username };
        socketRooms.set(socket.id, roomCode);
        void socket.join(roomCode);
        if (game.status !== "finished") {
            game.status = "playing";
            game.activeTeam = "blue";
        }
        acknowledge({ ok: true, team: availableTeam });
        emitGameState(game);
    });
    socket.on("make_move", (payload, acknowledge) => {
        const roomCode = socketRooms.get(socket.id);
        const game = roomCode ? games.get(roomCode) : undefined;
        if (!game) {
            acknowledge({ ok: false, error: "Game not found." });
            return;
        }
        const playerTeam = getPlayerTeam(game, socket.id);
        if (!playerTeam) {
            acknowledge({ ok: false, error: "You are not a player in this game." });
            return;
        }
        if (game.status !== "playing" || !game.activeTeam) {
            acknowledge({ ok: false, error: "The game has not started." });
            return;
        }
        if (game.activeTeam !== playerTeam) {
            acknowledge({ ok: false, error: "It is not your turn." });
            return;
        }
        if (!payload || typeof payload !== "object") {
            acknowledge({ ok: false, error: "Invalid move coordinates." });
            return;
        }
        const { fromCol, fromRow, toCol, toRow } = payload;
        const coordinates = [fromCol, fromRow, toCol, toRow];
        if (coordinates.some((coordinate) => !Number.isInteger(coordinate))) {
            acknowledge({ ok: false, error: "Invalid move coordinates." });
            return;
        }
        if (fromCol < 0 ||
            fromCol >= game.board.cols ||
            fromRow < 0 ||
            fromRow >= game.board.rows ||
            toCol < 0 ||
            toCol >= game.board.cols ||
            toRow < 0 ||
            toRow >= game.board.rows) {
            acknowledge({ ok: false, error: "Move is outside the board." });
            return;
        }
        const piece = game.board.tiles[fromRow][fromCol].piece;
        if (piece?.team !== playerTeam) {
            acknowledge({ ok: false, error: "Select one of your pieces." });
            return;
        }
        try {
            game.board.movePiece(fromCol, fromRow, toCol, toRow);
        }
        catch {
            acknowledge({ ok: false, error: "That move is not valid." });
            return;
        }
        const winner = game.board.checkWinCondition().winner ?? null;
        game.winner = winner;
        if (winner) {
            game.status = "finished";
            game.activeTeam = null;
        }
        else {
            game.activeTeam = playerTeam === "blue" ? "red" : "blue";
        }
        acknowledge({ ok: true });
        emitGameState(game);
    });
    socket.on("disconnect", () => {
        const roomCode = socketRooms.get(socket.id);
        if (!roomCode) {
            return;
        }
        socketRooms.delete(socket.id);
        const game = games.get(roomCode);
        if (!game) {
            return;
        }
        const playerTeam = getPlayerTeam(game, socket.id);
        if (playerTeam) {
            game.players[playerTeam] = null;
        }
        if (!game.players.blue && !game.players.red) {
            games.delete(roomCode);
            return;
        }
        if (game.status !== "finished") {
            game.status = "waiting";
            game.activeTeam = null;
        }
        emitGameState(game);
    });
});
httpServer.listen(port, () => {
    console.log(`Backend listening on http://localhost:${port}`);
});
