const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

let currentPlayers = 0;
const MAX_PLAYERS = 10;
const massiveTime = 999999999 * 24 * 60 * 60;

// Estructura de islas elementales y espejo v3.0.0
const universalIslands = [
    { "island_id": 1, "i": 1, "unlocked": 1, "u": 1, "castle_level": 10, "c": 10, "bed_capacity": 999999, "b": 999999 },
    { "island_id": 2, "i": 2, "unlocked": 1, "u": 1, "castle_level": 10, "c": 10, "bed_capacity": 999999, "b": 999999 },
    { "island_id": 3, "i": 3, "unlocked": 1, "u": 1, "castle_level": 10, "c": 10, "bed_capacity": 999999, "b": 999999 },
    { "island_id": 4, "i": 4, "unlocked": 1, "u": 1, "castle_level": 10, "c": 10, "bed_capacity": 999999, "b": 999999 },
    { "island_id": 5, "i": 5, "unlocked": 1, "u": 1, "castle_level": 10, "c": 10, "bed_capacity": 999999, "b": 999999 },
    { "island_id": 11, "i": 11, "unlocked": 1, "u": 1, "castle_level": 10, "c": 10, "bed_capacity": 999999, "b": 999999 },
    { "island_id": 12, "i": 12, "unlocked": 1, "u": 1, "castle_level": 10, "c": 10, "bed_capacity": 999999, "b": 999999 },
    { "island_id": 13, "i": 13, "unlocked": 1, "u": 1, "castle_level": 10, "c": 10, "bed_capacity": 999999, "b": 999999 },
    { "island_id": 14, "i": 14, "unlocked": 1, "u": 1, "castle_level": 10, "c": 10, "bed_capacity": 999999, "b": 999999 },
    { "island_id": 15, "i": 15, "unlocked": 1, "u": 1, "castle_level": 10, "c": 10, "bed_capacity": 999999, "b": 999999 }
];

// IDs de Monstruos compactados (Elementales, Mágicos, Raros, Épicos y Wubbox)
const baseMonsterIds = [
    1, 2, 3, 4, 5, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19,
    30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 50, 51, 52, 53, 54,
    70, 71, 72, 73, 74, 80, 81, 82, 83, 84,
    90, 91, 92, 93, 94, 95, 96,
    201, 202, 203, 204, 205, 211, 212, 213, 214, 215
];

const universalShop = [];
for (const id of baseMonsterIds) {
    universalShop.push({ "monster_id": id, "m": id, "cost_coins": 0, "c": 0, "cost_diamonds": 0, "d": 0, "time_left": massiveTime, "t": massiveTime, "type": "common", "cl": "common" });
    if (id < 92 || id >= 201) {
        universalShop.push({ "monster_id": id + 1000, "m": id + 1000, "cost_coins": 0, "c": 0, "cost_diamonds": 0, "d": 0, "time_left": massiveTime, "t": massiveTime, "type": "rare", "cl": "rare" });
        universalShop.push({ "monster_id": id + 2000, "m": id + 2000, "cost_coins": 0, "c": 0, "cost_diamonds": 0, "d": 0, "time_left": massiveTime, "t": massiveTime, "type": "epic", "cl": "epic" });
    }
}

// Interceptor global con depuración limpia
app.use((req, res, next) => {
    console.log(`[RASTREO] Ruta: ${req.originalUrl} | Método: ${req.method}`);
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    
    if (currentPlayers >= MAX_PLAYERS && !req.originalUrl.includes('logout')) {
        return res.status(503).json({ "status": 0, "error": "server_full" });
    }
    next();
});

// CORRECCIÓN DE LA RAÍZ PRINCIPAL: Responde de forma exitosa al Ping inicial del juego
app.get('/', (req, res) => {
    return res.json({
        "status": 1,
        "success": true,
        "action": "none",
        "age_gate_passed": 1, "age_gate": 1, "ag": 1,
        "terms_accepted": 1, "terms": 1, "tm": 1,
        "privacy_accepted": 1, "privacy": 1,
        "download_required": 0, "needs_download": false,
        "server_version": "3.0.0", "version": "3.0.0", "sv": "3.0.0"
    });
});

// MANEJADOR UNIVERSAL PARA EL RESTO DE PETICIONES
app.all('*', (req, res) => {
    const action = (req.body.action || req.query.action || "").toLowerCase();
    const url = req.originalUrl.toLowerCase();

    // 1. INICIO DE SESIÓN
    if (action.includes('login') || action.includes('auth') || url.includes('login') || action.includes('start')) {
        const inputUser = req.body.username || req.body.user || "";
        const inputPass = req.body.password || req.body.pass || "";
        const isGuest = action.includes('guest') || req.body.guest || (!inputUser && !inputPass);

        if (isGuest || (inputUser === "2026" && inputPass === "123")) {
            currentPlayers++;
            
            return res.json({
                "status": 1,
                "success": true,
                "session_id": "s_2026", "sid": "s_2026",
                "player_id": 7777777, "pid": 7777777,
                "age_gate_passed": 1, "ag": 1,
                "terms_accepted": 1, "tm": 1,
                "privacy_accepted": 1,
                "server_version": "3.0.0", "sv": "3.0.0",
                "player_data": {
                    "username": isGuest ? "Invitado" : "2026", "n": isGuest ? "Invitado" : "2026",
                    "level": 75, "l": 75,
                    "coins": 999999999, "co": 999999999,
                    "diamonds": 99999999, "di": 99999999,
                    "keys": 99999999, "ke": 99999999,
                    "food": 999999999, "fo": 999999999,
                    "relics": 99999999, "re": 99999999,
                    "starpower": 99999999, "st": 99999999,
                    "islands": universalIslands, "islands_data": universalIslands,
                    "monsters": [], "monsters_active": []
                },
                "user": {
                    "username": isGuest ? "Invitado" : "2026",
                    "level": 75,
                    "coins": 999999999,
                    "diamonds": 99999999,
                    "islands": universalIslands
                }
            });
        }
        return res.json({ "status": 0, "error": "invalid_credentials" });
    }

    // 2. MERCADO COMPLETO
    if (action.includes('shop') || action.includes('catalog') || url.includes('shop')) {
        return res.json({
            "status": 1,
            "success": true,
            "monsters": universalShop,
            "shop_items": universalShop,
            "items": universalShop
        });
    }

    // 3. RESPUESTA BASE LEGAL ADAPTATIVA
    return res.json({
        "status": 1,
        "success": true,
        "action": "none",
        "force_update": 0,
        "update": 0,
        "age_gate_passed": 1, "age_gate": 1, "ag": 1,
        "terms_accepted": 1, "terms": 1, "tm": 1,
        "privacy_accepted": 1, "privacy": 1,
        "download_required": 0, "needs_download": false,
        "server_version": "3.0.0", "version": "3.0.0", "sv": "3.0.0"
    });
});

app.listen(PORT, () => {
    console.log(`Servidor MSM v3.0.0 con respuesta raíz('/') activa en puerto ${PORT}.`);
});
