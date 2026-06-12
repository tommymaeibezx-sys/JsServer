const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Límite estricto de 10 usuarios simultáneos para evitar latencia
let currentOnlinePlayers = 0;
const MAX_PLAYERS = 10;
const massiveTimeSeconds = 999999999 * 24 * 60 * 60;

// Mapeo estructural de islas elementales, mágicas y espejo para v3.0.0
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

// Catálogo optimizado: Naturales, Estacionales, Wubbox y Mágicos (v3.0.0)
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

// Inyección global de cabeceras HTTP limpias
app.use((req, res, next) => {
    res.setHeader('Content-Type', 'application/json');
    if (currentOnlinePlayers >= MAX_PLAYERS && !req.originalUrl.includes('logout')) {
        return res.status(503).json({ "status": "error", "message": "Server full" });
    }
    next();
});

// ENRUTADOR HÍBRIDO ADAPTATIVO
app.all('*', (req, res) => {
    const action = (req.body.action || req.query.action || "").toLowerCase();
    const url = req.originalUrl.toLowerCase();

    console.log(`[NET TRAFFIC v3.0.0] Capturado Action: ${action} | URL: ${url}`);

    // 1. CONTROL DE PRIVACIDAD, EDAD Y DESCARGA INICIAL (Fuerza carga rápida en <2s)
    if (action.includes('age') || action.includes('terms') || action.includes('policy') || action.includes('download') || url.includes('file')) {
        return res.json({
            "status": "success",
            "action": "none",
            "age_gate_passed": true,
            "terms_accepted": true,
            "privacy_accepted": true,
            "needs_download": false,
            "download_url": "",
            "server_version": "3.0.0"
        });
    }

    // 2. VALIDACIÓN DEL ACCESO (Invitado y Cuenta '2026'/'123')
    if (action.includes('login') || action.includes('auth') || url.includes('login') || url.includes('start')) {
        const inputUser = req.body.username || req.body.user || req.body.email || "";
        const inputPass = req.body.password || req.body.pass || "";
        const isGuest = action.includes('guest') || req.body.guest || (!inputUser && !inputPass);

        if (isGuest || (inputUser === "2026" && inputPass === "123")) {
            currentOnlinePlayers++;
            
            return res.json({
                "status": "success",
                "action": "none",
                "session_id": "session_secured_2026",
                "player_id": 88887777,
                "age_gate_passed": true,
                "terms_accepted": true,
                "shop_version": 3,
                "player_data": {
                    "username": isGuest ? "Invitado" : "2026",
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
        }
        return res.json({ "status": "error", "message": "Usa Invitado o introduce 2026 con clave 123" });
    }

    // 3. RESPUESTA DINÁMICA DEL MERCADO MÁGICO Y ELEMENTAL
    if (action.includes('shop') || action.includes('catalog') || action.includes('items') || url.includes('shop')) {
        return res.json({
            "status": "success",
            "monsters": shopCatalog
        });
    }

    // RESPUESTA BASE DE RED (Mantiene el socket activo)
    return res.json({
        "status": "success",
        "action": "none",
        "force_update": false,
        "age_gate_passed": true,
        "terms_accepted": true,
        "server_version": "3.0.0"
    });
});

app.post('/api/player_logout', (req, res) => {
    if (currentOnlinePlayers > 0) currentOnlinePlayers--;
    res.json({ "status": "success" });
});

app.listen(PORT, () => {
    console.log(`Servidor MSM v3.0.0 Híbrido en puerto ${PORT}. Límite: 10.`);
});
