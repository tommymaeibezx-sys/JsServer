const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

let currentOnlinePlayers = 0;
const MAX_PLAYERS = 32;
const massiveTimeSeconds = 999999999 * 24 * 60 * 60;

// Configuración completa de Islas Elementales y Espejo exigidas
const exclusiveIslands = [
    { "island_id": 1, "unlocked": 1, "island_castle_level": 10, "max_beds": 999999, "structures": [] },
    { "island_id": 2, "unlocked": 1, "island_castle_level": 10, "max_beds": 999999, "structures": [] },
    { "island_id": 3, "unlocked": 1, "island_castle_level": 10, "max_beds": 999999, "structures": [] },
    { "island_id": 4, "unlocked": 1, "island_castle_level": 10, "max_beds": 999999, "structures": [] },
    { "island_id": 5, "unlocked": 1, "island_castle_level": 10, "max_beds": 999999, "structures": [] },
    { "island_id": 11, "unlocked": 1, "island_castle_level": 10, "max_beds": 999999, "structures": [] },
    { "island_id": 12, "unlocked": 1, "island_castle_level": 10, "max_beds": 999999, "structures": [] },
    { "island_id": 13, "unlocked": 1, "island_castle_level": 10, "max_beds": 999999, "structures": [] },
    { "island_id": 14, "unlocked": 1, "island_castle_level": 10, "max_beds": 999999, "structures": [] },
    { "island_id": 15, "unlocked": 1, "island_castle_level": 10, "max_beds": 999999, "structures": [] }
];

const elementalMonsters = [
    { "id": 1 }, { "id": 2 }, { "id": 3 }, { "id": 4 }, { "id": 5 },
    { "id": 10 }, { "id": 11 }, { "id": 12 }, { "id": 13 }, { "id": 14 },
    { "id": 15 }, { "id": 16 }, { "id": 17 }, { "id": 18 }, { "id": 19 },
    { "id": 30 }, { "id": 31 }, { "id": 32 }, { "id": 33 }, { "id": 34 },
    { "id": 35 }, { "id": 36 }, { "id": 37 }, { "id": 38 }, { "id": 39 },
    { "id": 50 }, { "id": 51 }, { "id": 52 }, { "id": 53 }, { "id": 54 },
    { "id": 70 }, { "id": 71 }, { "id": 72 }, { "id": 73 }, { "id": 74 },
    { "id": 80 }, { "id": 81 }, { "id": 82 }, { "id": 83 }, { "id": 84 },
    { "id": 90 }, { "id": 91 }, { "id": 92 }, { "id": 93 }, { "id": 94 },
    { "id": 95 }, { "id": 96 }
];

const shopCatalog = [];
for (const monster of elementalMonsters) {
    shopCatalog.push({ "item_id": monster.id, "cost": 0, "currency": "coins", "duration": massiveTimeSeconds, "type": "common" });
    if (monster.id < 92) {
        shopCatalog.push({ "item_id": monster.id + 1000, "cost": 0, "currency": "coins", "duration": massiveTimeSeconds, "type": "rare" });
        shopCatalog.push({ "item_id": monster.id + 2000, "cost": 0, "currency": "coins", "duration": massiveTimeSeconds, "type": "epic" });
    }
}

// Forzado de cabeceras HTTP limpias basadas en Objetos
app.use((req, res, next) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    if (currentOnlinePlayers >= MAX_PLAYERS && !req.originalUrl.includes('logout')) {
        return res.status(503).json({ "status": 0, "error": "Server full" });
    }
    next();
});

// CAPTURADOR DE PETICIONES ESTÁNDAR
app.all('*', (req, res) => {
    const action = (req.body.action || req.query.action || "").toLowerCase();
    const url = req.originalUrl.toLowerCase();
    
    console.log(`[ROUTE] v3.0.0 -> Action: ${action} | URL: ${url}`);

    // LOGIN RECONSTRUIDO (Acepta Invitado o Datos Fijos)
    if (action.includes('login') || action.includes('auth') || action.includes('start') || url.includes('login')) {
        const inputUser = req.body.username || req.body.user || req.body.email || "";
        const inputPass = req.body.password || req.body.pass || "";
        const isGuest = action.includes('guest') || req.body.guest || (!inputUser && !inputPass);

        // Si es válido (Invitado o Cuenta 2026/123), inyectamos todo el árbol estructural del juego
        if (isGuest || (inputUser === "2026" && inputPass === "123")) {
            currentOnlinePlayers++;
            
            return res.json({
                "status": 1,
                "success": true,
                "session_id": "session_fixed_2026",
                "player_id": 88887777,
                "current_server_time": Math.floor(Date.now() / 1000),
                "user_data": {
                    "username": isGuest ? "Guest_Player" : "2026",
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
                    "monsters": [],
                    "structures": [],
                    "egg_backpack": []
                }
            });
        }

        return res.json({ "status": 0, "error": "Usa el boton Invitado o introduce usuario 2026 y clave 123" });
    }

    // RESPUESTA DE LA TIENDA
    if (action.includes('shop') || action.includes('catalog') || action.includes('items')) {
        return res.json({
            "status": 1,
            "success": true,
            "items": shopCatalog
        });
    }

    // RESPUESTA DE BYPASS DE VERSIÓN Y RUTINAS
    return res.json({
        "status": 1,
        "success": true,
        "action": "none",
        "force_update": false,
        "server_version": "3.0.0"
    });
});

app.listen(PORT, () => {
    console.log(`Servidor MSM v3.0.0 restaurado. Límite: 32. Login: Invitado o 2026/123.`);
});
 
