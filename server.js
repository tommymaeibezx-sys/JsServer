const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

let currentOnlinePlayers = 0;

// Configuración Masiva de Recursos e Islas Requeridas
const massiveTimeSeconds = 999999999 * 24 * 60 * 60;
const exclusiveIslands = [
    { "island_id": 1, "unlocked": 1, "island_castle_level": 10, "max_beds": 999999 },
    { "island_id": 2, "unlocked": 1, "island_castle_level": 10, "max_beds": 999999 },
    { "island_id": 3, "unlocked": 1, "island_castle_level": 10, "max_beds": 999999 },
    { "island_id": 4, "unlocked": 1, "island_castle_level": 10, "max_beds": 999999 },
    { "island_id": 5, "unlocked": 1, "island_castle_level": 10, "max_beds": 999999 },
    { "island_id": 11, "unlocked": 1, "island_castle_level": 10, "max_beds": 999999 },
    { "island_id": 12, "unlocked": 1, "island_castle_level": 10, "max_beds": 999999 },
    { "island_id": 13, "unlocked": 1, "island_castle_level": 10, "max_beds": 999999 },
    { "island_id": 14, "unlocked": 1, "island_castle_level": 10, "max_beds": 999999 },
    { "island_id": 15, "unlocked": 1, "island_castle_level": 10, "max_beds": 999999 }
];

// Middleware de Diagnóstico Obligatorio
app.use((req, res, next) => {
    console.log(`[PETICIÓN DETECTADA] URL: ${req.originalUrl} | Body: ${JSON.stringify(req.body)}`);
    if (currentOnlinePlayers >= 51) {
        return res.status(503).json({ "status": 0, "error": "Server full" });
    }
    next();
});

// 1. MANEJO GLOBAL DE PETICIONES (Filtro Adaptativo)
app.use((req, res, next) => {
    const url = req.originalUrl.toLowerCase();

    // Bypass de control de actualización e inicio de pasarela
    if (url.includes('version') || url.includes('check') || url.includes('gate')) {
        return res.json({
            "status": 1,
            "success": true,
            "action": "none",
            "force_update": false,
            "server_version": "5.0.0",
            "cc_ip": "127.0.0.1"
        });
    }

    // Login Anónimo / Estructura Nativa de Cuenta BBB
    if (url.includes('login') || url.includes('auth') || url.includes('start')) {
        currentOnlinePlayers++;
        return res.json({
            "status": 1,
            "success": true,
            "session_id": "session_" + Math.floor(Math.random() * 999999),
            "player_id": 12345678,
            "user_data": {
                "active": 1,
                "level": 75,
                "xp": 99999999,
                "currency": {
                    "coins": 999999999,
                    "diamonds": 99999999,
                    "keys": 99999999,
                    "food": 999999999,
                    "relics": 99999999,
                    "stamina": 99999999
                },
                "islands": exclusiveIslands,
                "monsters": []
            }
        });
    }

    // Respuesta del catálogo de la Tienda Masiva
    if (url.includes('shop') || url.includes('catalog') || url.includes('structures')) {
        return res.json({
            "status": 1,
            "success": true,
            "items": [
                { "item_id": 90, "cost": 0, "currency": "coins", "duration": massiveTimeSeconds },
                { "item_id": 91, "cost": 0, "currency": "coins", "duration": massiveTimeSeconds },
                { "item_id": 92, "cost": 0, "currency": "coins", "duration": massiveTimeSeconds }
            ]
        });
    }

    // Simulación obligatoria de persistencia para el bucle de autoguardado del APK
    if (url.includes('save') || url.includes('update') || url.includes('record')) {
        return res.json({ "status": 1, "success": true });
    }

    next();
});

// Manejadores por defecto en caso de llamadas REST directas
app.post('/api/version_check', (req, res) => res.json({ "status": 1, "success": true }));
app.post('/api/player_login', (req, res) => res.json({ "status": 1, "success": true }));

app.listen(PORT, () => {
    console.log(`Servidor de Protocolo Estricto MSM Operando en Puerto ${PORT}.`);
});
 
