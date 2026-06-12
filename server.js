const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

let currentOnlinePlayers = 0;
const MAX_PLAYERS = 10;
const massiveTimeSeconds = 999999999 * 24 * 60 * 60;

// Configuración numérica pura de islas elementales y espejo para v3.0.0
const exclusiveIslands = [
    { "island_id": 1, "unlocked": 1, "castle_level": 10, "bed_capacity": 999999 },
    { "island_id": 2, "unlocked": 1, "castle_level": 10, "bed_capacity": 999999 },
    { "island_id": 3, "unlocked": 1, "castle_level": 10, "bed_capacity": 999999 },
    { "island_id": 4, "unlocked": 1, "castle_level": 10, "bed_capacity": 999999 },
    { "island_id": 5, "unlocked": 1, "castle_level": 10, "bed_capacity": 999999 },
    { "island_id": 11, "unlocked": 1, "castle_level": 10, "bed_capacity": 999999 },
    { "island_id": 12, "unlocked": 1, "castle_level": 10, "bed_capacity": 999999 },
    { "island_id": 13, "unlocked": 1, "castle_level": 10, "bed_capacity": 999999 },
    { "island_id": 14, "unlocked": 1, "island_castle_level": 10, "max_beds": 999999 },
    { "island_id": 15, "unlocked": 1, "island_castle_level": 10, "max_beds": 999999 }
];

// Catálogo estático optimizado para el motor antiguo
const shopCatalog = [
    { "monster_id": 1, "cost_coins": 0, "cost_diamonds": 0, "time_left": massiveTimeSeconds, "type": "common" },
    { "monster_id": 2, "cost_coins": 0, "cost_diamonds": 0, "time_left": massiveTimeSeconds, "type": "common" },
    { "monster_id": 90, "cost_coins": 0, "cost_diamonds": 0, "time_left": massiveTimeSeconds, "type": "common" },
    { "monster_id": 1090, "cost_coins": 0, "cost_diamonds": 0, "time_left": massiveTimeSeconds, "type": "rare" },
    { "monster_id": 2090, "cost_coins": 0, "cost_diamonds": 0, "time_left": massiveTimeSeconds, "type": "epic" }
];

// Forzado de cabeceras HTTP limpias de tipo plano
app.use((req, res, next) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    if (currentOnlinePlayers >= MAX_PLAYERS && !req.originalUrl.includes('logout')) {
        return res.status(503).json({ "status": 0, "error": "Server full" });
    }
    next();
});

// INTERCEPTOR DE PETICIONES CON ENVOLTORIO NATIVO "USER"
app.all('*', (req, res) => {
    const action = (req.body.action || req.query.action || "").toLowerCase();
    const url = req.originalUrl.toLowerCase();

    console.log(`[ROUTE LOGGER v3.0.0] Action: ${action} | URL: ${url}`);

    // LOGIN ADAPTATIVO (Fuerza la estructura nativa)
    if (action.includes('login') || action.includes('auth') || url.includes('login') || action.includes('start')) {
        const inputUser = req.body.username || req.body.user || req.body.email || "";
        const inputPass = req.body.password || req.body.pass || "";
        const isGuest = action.includes('guest') || req.body.guest || (!inputUser && !inputPass);

        if (isGuest || (inputUser === "2026" && inputPass === "123")) {
            currentOnlinePlayers++;
            
            return res.json({
                "status": 1,
                "session_id": "session_secured_2026",
                "player_id": 7777777,
                "age_gate_passed": 1,
                "terms_accepted": 1,
                "privacy_accepted": 1,
                "user": {
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
        return res.json({ "status": 0, "error": "Usa Invitado o introduce usuario 2026 con clave 123" });
    }

    // RESPUESTA DEL MERCADO
    if (action.includes('shop') || action.includes('catalog') || action.includes('items') || url.includes('shop')) {
        return res.json({
            "status": 1,
            "monsters": shopCatalog
        });
    }

    // RESPUESTA GENERAL DE RED (Bypass legal y versión de control numérico)
    return res.json({
        "status": 1,
        "action": "none",
        "force_update": 0,
        "age_gate_passed": 1,
        "terms_accepted": 1,
        "privacy_accepted": 1,
        "server_version": "3.0.0"
    });
});

app.post('/api/player_logout', (req, res) => {
    if (currentOnlinePlayers > 0) currentOnlinePlayers--;
    res.json({ "status": 1 });
});

app.listen(PORT, () => {
    console.log(`Servidor MSM v3.0.0 con Formato Estricto Numérico activo.`);
});
