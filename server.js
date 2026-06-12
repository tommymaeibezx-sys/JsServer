const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

let currentOnlinePlayers = 0;
const MAX_PLAYERS = 10;
const massiveTimeSeconds = 999999999 * 24 * 60 * 60;

// 1. ESTRUCTURA DE ISLAS ELEMENTALES Y ESPEJO FIJAS EN MEMORIA
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

// 2. CATÁLOGO ESTÁTICO PRE-CONSTRUIDO (Evita retrasos de CPU de Render)
const shopCatalog = [
    { "monster_id": 1, "cost_coins": 0, "cost_diamonds": 0, "time_left": massiveTimeSeconds, "type": "common" },
    { "monster_id": 2, "cost_coins": 0, "cost_diamonds": 0, "time_left": massiveTimeSeconds, "type": "common" },
    { "monster_id": 90, "cost_coins": 0, "cost_diamonds": 0, "time_left": massiveTimeSeconds, "type": "common" },
    { "monster_id": 1090, "cost_coins": 0, "cost_diamonds": 0, "time_left": massiveTimeSeconds, "type": "rare" },
    { "monster_id": 2090, "cost_coins": 0, "cost_diamonds": 0, "time_left": massiveTimeSeconds, "type": "epic" }
];

// Cabeceras HTTP globales con tiempo de respuesta de microsegundos
app.use((req, res, next) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Connection', 'keep-alive');
    
    if (currentOnlinePlayers >= MAX_PLAYERS && !req.originalUrl.includes('logout')) {
        return res.status(503).json({ "status": "error", "message": "Server full" });
    }
    next();
});

// INTERCEPTOR DIRECTO SIN LOGS PESADOS (Aumenta la velocidad de Render)
app.all('*', (req, res) => {
    const action = (req.body.action || req.query.action || "").toLowerCase();

    // LOGIN DIRECTO CON RESPUESTA EN < 0.1 SEGUNDOS
    if (action.includes('login') || action.includes('auth') || req.originalUrl.includes('login') || action.includes('start')) {
        const inputUser = req.body.username || req.body.user || "";
        const inputPass = req.body.password || req.body.pass || "";
        const isGuest = action.includes('guest') || req.body.guest || (!inputUser && !inputPass);

        if (isGuest || (inputUser === "2026" && inputPass === "123")) {
            currentOnlinePlayers++;
            
            return res.json({
                "status": "success",
                "session_id": "fast_token_2026",
                "player_id": 88887777,
                "age_gate_passed": true,
                "terms_accepted": true,
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
        return res.json({ "status": "error", "message": "Usa Invitado o introduce 2026 con 123" });
    }

    // RESPUESTA DE LA TIENDA
    if (action.includes('shop') || action.includes('catalog') || req.originalUrl.includes('shop')) {
        return res.json({
            "status": "success",
            "monsters": shopCatalog
        });
    }

    // RESPUESTA DE BYPASS PARA CONTROL LEGAL Y REDIRECCIÓN RECURRENTE
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
    console.log(`Servidor MSM v3.0.0 optimizado para evitar timeout de 3 segundos.`);
});
