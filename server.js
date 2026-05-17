const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const httpServer = createServer(app);
// Conectamos el servidor con los celulares mediante comunicación de alta velocidad
const io = new Server(httpServer, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

let players = {};
let globalCatalog = [
    { id: 1, name: "Smile Clásica", type: "face", data: "default" }
];

io.on('connection', (socket) => {
    console.log(`Usuario conectado al servidor: ${socket.id}`);

    // Al iniciar sesión de juego
    socket.on('join-game', (userData) => {
        players[socket.id] = {
            id: socket.id,
            username: userData.username,
            x: 0, y: 1, z: 0,
            ry: 0,
            outfit: userData.outfit || { head: "#ffcc00", torso: "#0056b3", legs: "#274627", face: "default" }
        };
        // Enviar la lista de jugadores actuales al nuevo
        socket.emit('current-players', players);
        socket.emit('update-catalog', globalCatalog);
        // Avisar a los demás que alguien entró
        socket.broadcast.emit('player-joined', players[socket.id]);
    });

    // Sincronización exacta de movimiento en tiempo real (60 veces por segundo)
    socket.on('player-movement', (movementData) => {
        if (players[socket.id]) {
            players[socket.id].x = movementData.x;
            players[socket.id].y = movementData.y;
            players[socket.id].z = movementData.z;
            players[socket.id].ry = movementData.ry;
            // Reenviar a los amigos en el mapa
            socket.broadcast.emit('player-moved', players[socket.id]);
        }
    });

    // Publicador UGC en red instantánea
    socket.on('publish-ugc', (item) => {
        const newItem = { id: Date.now(), name: item.name, type: item.type, data: item.data };
        globalCatalog.push(newItem);
        io.emit('update-catalog', globalCatalog); // Lo reciben todos los amigos conectados al mismo tiempo
    });

    socket.on('disconnect', () => {
        console.log(`Usuario desconectado: ${socket.id}`);
        delete players[socket.id];
        io.emit('player-left', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => console.log(`Servidor de Roblox Real corriendo en puerto ${PORT}`));
