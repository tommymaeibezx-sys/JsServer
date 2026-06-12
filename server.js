const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

let currentPlayers = 0;
const MAX_PLAYERS = 10;
const massiveTime = 999999999 * 24 * 60 * 60;

// Estructura universal de islas elementales y espejo v3.0.0
const universalIslands = [
    { "island_id": 1, "i": 1, "unlocked": 1, "u": 1, "castle_level": 10, "c": 10, "bed_capacity": 999999, "b": 999999 },
    { "island_id": 2, "i": 2, "unlocked": 1, "u": 1, "castle_level": 10, "c": 10, "bed_capacity": 999999, "b": 999999 },
    { "island_id": 3, "i": 3, "unlocked": 1, "u": 1, "castle_level": 10, "c": 10, "bed_capacity": 999999, "b": 999999 },
    { "island_id": 4, "i": 4, "unlocked": 1, "u": 1, "castle_level": 10, "c": 10, "bed_capacity": 999999, "b": 999999 },
    { "island_id": 5, "i": 5, "unlocked": 1, "u": 1, "castle_level": 10, "c": 10, "bed_capacity": 999999, "b": 999999 },
    { "island_id": 11, "i": 11, "unlocked": 1, "u": 1, "castle_level": 10, "c": 10, "bed_capacity": 999999, "b": 999999 },
    { "island_id": 12, "i": 12, "unlocked": 1, "u": 1, "castle_level": 10, "c": 10, "bed_capacity": 999999, "b": 999999 },
    { "island_id": 13, "i": 13, "unlocked": 1, "u": 1, "castle_level": 10, "c": 10, "bed_capacity": 999999, "b": 999999 },
    { "island_id": 14, "i": 14, "unlocked": 1, "u": 1, "castle_level": 10, "max_beds": 999999 },
    { "island_id": 15, "i": 15, "unlocked": 1, "u": 1, "castle_level": 10, "max_beds": 999999 }
];

// IDs de Monstruos corregidos y completados (Naturales, Mágicos y Wubboxes)
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

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');
    next();
});

// 1. RESPUESTA RE-ESTRUCTURADA AL TEST HEAD
app.head('/', (req, res) => {
    res.status(200).end();
});

// 2. ENTRADA DEL XML DE PRODUCCIÓN COMPATIBLE (Usa rutas dinámicas sin protocolo estricto)
app.get('/', (req, res) => {
    console.log("[RASTREO] Enviando XML oficial compatible");
    res.setHeader('Content-Type', 'text/xml; charset=utf-8');
    
    const host = req.headers.host;

    // Formato de nodos legítimo de Big Blue Bubble en la era v3.X
    const xmlConfig = `<?xml version="1.0" encoding="utf-8"?>
<config>
    <game_version>3.0.0</game_version>
    <status>1</status>
    <services>
        <gateway>http://${host}/api</gateway>
        <login>http://${host}/login</login>
        <shop>http://${host}/shop</shop>
    </services>
    <legal>
        <age_gate>1</age_gate>
        <terms_accepted>1</terms_accepted>
        <privacy_accepted>1</privacy_accepted>
    </legal>
</config>`;

    return res.status(200).send(xmlConfig);
});

// 3. PROCESAMIENTO GENERAL DE RESPUESTAS SECUNDARIAS
app.all('*', (req, res) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    const action = (req.body.action || req.query.action || "").toLowerCase();
    const url = req.originalUrl.toLowerCase();

    console.log(`[ACCIÓN DETECTADA] -> URL: ${req.originalUrl} | Action: ${action}`);

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
                    "monsters": []
                }
            });
        }
        return res.json({ "status": 0, "error": "credenciales_invalidas" });
    }

    if (action.includes('shop') || action.includes('catalog') || url.includes('shop')) {
        return res.json({
            "status": 1,
            "success": true,
            "monsters": universalShop
        });
    }

    return res.json({
        "status": 1,
        "success": true,
        "server_version": "3.0.0"
    });
});

app.listen(PORT, () => {
    console.log(`Servidor MSM XML-Compatible levantado en puerto ${PORT}.`);
});
 
