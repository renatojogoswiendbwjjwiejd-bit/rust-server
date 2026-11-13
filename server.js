const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

const SERVER_INFO = {
  name: "BR Dedicated #01 - Vanilla",
  maxPlayers: 50,
  mapSize: 2000
};

let players = {};
let structures = [];

app.get('/status', (req, res) => {
  res.json({
    ...SERVER_INFO,
    onlinePlayers: Object.keys(players).length
  });
});

io.on('connection', (socket) => {
  console.log(`Jogador conectado: ${socket.id}`);

  socket.on('joinServer', (playerData) => {
    players[socket.id] = {
      id: socket.id,
      name: playerData.name || `Sobrevivente_${socket.id.slice(0, 4)}`,
      x: 1000,
      y: 1000,
      hp: 100,
      hunger: 100,
      thirst: 100
    };
    socket.emit('worldInit', { players, structures, serverInfo: SERVER_INFO });
    socket.broadcast.emit('playerJoined', players[socket.id]);
  });

  socket.on('move', (coords) => {
    if (players[socket.id]) {
      players[socket.id].x = coords.x;
      players[socket.id].y = coords.y;
      socket.broadcast.emit('playerMoved', { id: socket.id, x: coords.x, y: coords.y });
    }
  });

  socket.on('build', (structure) => {
    structures.push(structure);
    io.emit('structureBuilt', structure);
  });

  socket.on('disconnect', () => {
    delete players[socket.id];
    io.emit('playerLeft', socket.id);
    console.log(`Jogador saiu: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Servidor dedicado rodando na porta ${PORT}`);
});
