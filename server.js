const express = require('express');
const net = require('net'); // Servidor TCP nativo para emular SmartFox ligero
const app = express();

const HTTP_PORT = process.env.PORT || 3000;
const SOCKET_PORT = 9339; // Puerto estándar que busca el juego original

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

let currentOnlinePlayers = 0;
const MAX_PLAYERS = 10;
const massiveTimeSeconds = 999999999 * 24 * 60 * 60;

// Configuración estructural de islas elementales y espejo exigidas
const exclusiveIslands = [
    { "island_id": 1, "unlocked": true, "castle_level": 10, "bed_capacity": 999999 },
    { "island_id": 2, "unlocked": true, "castle_level": 10, "bed_capacity": 999999 },
    { "island_id": 3, "unlocked": true, "castle_level": 10, "bed_capacity": 999999 },
    { "island_id": 4, "unlocked": true, "castle_level": 10, "bed_capacity": 999999 },
    { "island_id": 5, "unlocked": true, "castle_level": 10, "bed_capacity": 999999 },
    { "island_id": 11, "unlocked": true, "castle_level": 10, "bed_capacity": 999999 },
    { "island_id": 12, "unlocked": true, "castle_level": 10, "bed_capacity": 999999 },
    { "island_id": 13, "unlocked": true, "castle_level": 10, "bed_capacity": 999999 },
    { "island_id": 14, "unlocked": true, "castle_level": 10, "bed_capacity": 999999 },
    { "island_id": 15, "unlocked": true, "castle_level": 10, "bed_capacity": 999999 }
];

// IDs de Monstruos (Elementales, Mágicos, Raros, Épicos y Wubbox)
const baseMonsterIds = [
    1, 2, 3, 4, 5, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19,
    30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 50, 51, 52, 53, 54,
    70, 71, 72, 73, 74, 80, 81, 82, 83, 84,
    90, 91, 92, 93, 94, 95, 96,
    201, 202, 203, 204, 205, 211, 212, 213, 214, 215
];

const shopCatalog = [];
for (const id of baseMonsterIds) {
    shopCatalog.push({ "monster_id": id, "cost_coins": 0, "cost_diamonds": 0, "time_left": massiveTimeSeconds, "type": "common" });
    if (id < 92 || id >= 201) {
        shopCatalog.push({ "monster_id": id + 1000, "cost_coins": 0, "cost_diamonds": 0, "time_left": massiveTimeSeconds, "type": "rare" });
        shopCatalog.push({ "monster_id": id + 2000, "cost_coins": 0, "cost_diamonds": 0, "time_left": massiveTimeSeconds, "type": "epic" });
    }
}

// ------------------------------------
// 1. PASARELA HTTP (Express)
// ------------------------------------
app.use((req, res, next) => {
    res.setHeader('Content-Type', 'application/json');
    if (currentOnlinePlayers >= MAX_PLAYERS) {
        return res.status(503).json({ "status": "error", "message": "Server full" });
    }
    next();
});

app.all('*', (req, res) => {
    const action = (req.body.action || req.query.action || "").toLowerCase();
    
    // Bypass inmediato de edad, términos y descargas para cargar en < 2 segundos
    if (action.includes('age') || action.includes('terms') || action.includes('policy') || action.includes('download')) {
        return res.json({
            "status": "success",
            "age_gate_passed": true,
            "terms_accepted": true,
            "privacy_accepted": true,
            "needs_download": false,
            "server_version": "3.0.0"
        });
    }

    if (action.includes('shop') || action.includes('catalog') || req.originalUrl.includes('shop')) {
        return res.json({ "status": "success", "monsters": shopCatalog });
    }

    // Redirección HTTP inicial exitosa
    return res.json({
        "status": "success",
        "action": "none",
        "force_update": false,
        "age_gate_passed": true,
        "terms_accepted": true,
        "server_version": "3.0.0"
    });
});

// ------------------------------------
// 2. EMULADOR TCP (Bypass del SFS Socket)
// ------------------------------------
const tcpServer = net.createServer((socket) => {
    console.log('[TCP SOCKET] Cliente conectado desde el APK.');

    socket.on('data', (data) => {
        const packetStr = data.toString('utf8');
        
        // Interceptamos el apretón de manos (Handshake) y el intento de Login del APK
        if (packetStr.includes('ver') || packetStr.includes('login') || packetStr.includes('txt')) {
            currentOnlinePlayers++;

            // Construimos la cadena de datos plana que el motor gráfico C++ necesita procesar
            const payload = JSON.stringify({
                "status": "success",
                "session_id": "secured_tcp_session_2026",
                "player_id": 88887777,
                "player_data": {
                    "username": "2026",
                    "level": 75,
                    "coins": 999999999,
                    "diamonds": 99999999,
                    "keys": 99999999,
                    "food": 999999999,
                    "relics": 99999999,
                    "stamina": 99999999,
                    "islands": exclusiveIslands,
                    "monsters": []
                }
            });

            // Enviamos la respuesta binaria limpia de vuelta al juego terminada en un byte nulo (\u0000)
            // Esto es crucial para que el socket C++ sepa que el paquete terminó de transmitirse
            socket.write(payload + '\u0000');
        }
    });

    socket.on('end', () => {
        if (currentOnlinePlayers > 0) currentOnlinePlayers--;
        console.log('[TCP SOCKET] Cliente desconectado.');
    });

    socket.on('error', (err) => {
        console.log(`[TCP ERROR] ${err.message}`);
    });
});

// Inicialización de ambos entornos
app.listen(HTTP_PORT, () => {
    console.log(`Servidor HTTP MSM activo en puerto ${HTTP_PORT}.`);
});

// Nota: Render en su plan gratuito solo expone un puerto público (el HTTP). 
// Para que tu APK se conecte al entorno TCP de forma local en Android, el script lo escucha internamente.
tcpServer.listen(SOCKET_PORT, '0.0.0.0', () => {
    console.log(`Emulador de Socket MSM corriendo internamente en puerto ${SOCKET_PORT}.`);
});
 
