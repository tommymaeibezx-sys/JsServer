const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

let currentOnlinePlayers = 0;
const MAX_PLAYERS = 32;
const massiveTimeSeconds = 999999999 * 24 * 60 * 60;

// Estructura de las Islas Elementales y Espejo exigidas
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

// Función generadora del perfil de recursos infinitos
function generateMsmProfile(username) {
    return {
        "status": 1,
        "session_id": "session_" + Math.floor(Math.random() * 888888 + 111111),
        "player_id": Math.floor(Math.random() * 500000 + 100000),
        "current_server_time": Math.floor(Date.now() / 1000),
        "data": {
            "user": {
                "name": username,
                "level": 75,
                "xp": 99999999,
                "coins": 999999999,
                "diamonds": 99999999,
                "keys": 99999999,
                "food": 999999999,
                "relics": 99999999,
                "stamina": 99999999,
                "islands": exclusiveIslands,
                "monsters": []
            }
        }
    };
}

// Registro global y cabeceras
app.use((req, res, next) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    if (currentOnlinePlayers >= MAX_PLAYERS && !req.originalUrl.includes('logout')) {
        return res.status(503).json({ "status": 0, "error": "Server full" });
    }
    next();
});

// CAPTURADOR DE ACCIONES UNIVERSAL (Formato v3.0.0)
app.all('*', (req, res) => {
    const action = (req.body.action || req.query.action || "").toLowerCase();
    const url = req.originalUrl.toLowerCase();
    
    console.log(`[MSM v3.0.0] URL: ${req.originalUrl} | Action: ${action} | Body: ${JSON.stringify(req.body)}`);

    // 1. SISTEMA DE AUTENTICACIÓN (Invitado y Login con Cuenta)
    if (action.includes('login') || action.includes('auth') || url.includes('login')) {
        const inputUser = req.body.username || req.body.user || req.body.email || "";
        const inputPass = req.body.password || req.body.pass || "";
        const isGuest = req.body.guest || req.body.is_guest || action.includes('guest') || (!inputUser && !inputPass);

        // Opción A: Entrada Vía Invitado (Campos vacíos o bandera Guest)
        if (isGuest) {
            currentOnlinePlayers++;
            return res.json(generateMsmProfile("Guest_Player"));
        }

        // Opción B: Login con cuenta específica (User: 2026 | Pass: 123)
        if (inputUser === "2026" && inputPass === "123") {
            currentOnlinePlayers++;
            return res.json(generateMsmProfile("2026"));
        }

        // Si intentan usar otros datos que no correspondan
        return res.json({ 
            "status": 0, 
            "error": "Acceso Inválido. Usa el botón Invitado o ingresa el usuario 2026 con clave 123" 
        });
    }

    // 2. RESPUESTA DE LA TIENDA
    if (action.includes('shop') || action.includes('catalog') || action.includes('items')) {
        return res.json({
            "status": 1,
            "items": shopCatalog
        });
    }

    // 3. RESPUESTA BASE DE CONTROL (Previene fallos de red instantáneos)
    return res.json({
        "status": 1,
        "success": true,
        "action": "none",
        "force_update": false,
        "server_version": "3.0.0"
    });
});

app.listen(PORT, () => {
    console.log(`Servidor MSM v3.0.0 en línea. Modo: Invitado o Login (2026/123). Límite: 32.`);
});
