const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*" }
});

const PORT = process.env.PORT || 10000;

// Estado global do jogo no servidor
let players = {};
let structures = [];

app.get('/status', (req, res) => {
    res.json({
        status: "online",
        serverName: "DEAD ZONE - BR Vanilla",
        onlinePlayers: Object.keys(players).length
    });
});

io.on('connection', (socket) => {
    console.log(`Sobrevivente conectado: ${socket.id}`);

    // Jogador entra no servidor
    socket.on('joinServer', (data) => {
        players[socket.id] = {
            id: socket.id,
            name: data.name || "Sobrevivente",
            x: 1000,
            y: 1000
        };

        // Enviar estado atual do mundo para o novo jogador
        socket.emit('worldInit', { players, structures });

        // Avisar os outros jogadores
        socket.broadcast.emit('playerJoined', players[socket.id]);
    });

    // Movimentação em tempo real
    socket.on('move', (data) => {
        if (players[socket.id]) {
            players[socket.id].x = data.x;
            players[socket.id].y = data.y;
            socket.broadcast.emit('playerMoved', { id: socket.id, x: data.x, y: data.y });
        }
    });

    // Construção de bases modulares
    socket.on('build', (data) => {
        const structure = { type: data.type, x: data.x, z: data.z, owner: socket.id };
        structures.push(structure);
        io.emit('structureBuilt', structure); // Sincroniza com todos no servidor
    });

    // Desconexão
    socket.on('disconnect', () => {
        console.log(`Sobrevivente saiu: ${socket.id}`);
        delete players[socket.id];
        io.emit('playerLeft', socket.id);
    });
});

server.listen(PORT, () => {
    console.log(`Servidor DEAD ZONE rodando na porta ${PORT}`);
});
