const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// La v3.0.0 envía cuerpos codificados en URL por defecto
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

let currentOnlinePlayers = 0;
const MAX_PLAYERS = 32;
const massiveTimeSeconds = 999999999 * 24 * 60 * 60;

// Configuración de Islas Elementales y Espejo adaptadas al motor de la v3.0.0
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

// Lista de monstruos de las islas elementales con Wubboxes
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

// Interceptor del Gateway de la v3.0.0
app.use((req, res, next) => {
    res.setHeader('Content-Type', 'application/json');
    
    // Captura el parámetro de acción del juego clásico de BBB
    const action = req.body.action || req.query.action || "";
    console.log(`[GATEWAY v3.0.0] Acción detectada: ${action}`);

    if (currentOnlinePlayers >= MAX_PLAYERS) {
        return res.status(503).json({ "status": 0, "error": "Servidor lleno. Límite de 32 alcanzado." });
    }

    // 1. LOGIN DE USUARIO CENTRALIZADO (User: 123 | Pass: 123)
    if (action.includes('login') || action.includes('auth') || req.originalUrl.includes('login')) {
        const inputUser = req.body.username || req.body.user || req.body.email || "123";
        const inputPass = req.body.password || req.body.pass || "123";

        if (inputUser === "123" && inputPass === "123") {
            currentOnlinePlayers++;
            return res.json({
                "status": 1,
                "success": true,
                "session_id": "session_secured_123",
                "player_id": 88887777,
                "user_data": {
                    "username": "123",
                    "level": 75,
                    "xp": 99999999,
                    "currency": {
                        "coins": 999999999, "diamonds": 99999999, "keys": 99999999, 
                        "food": 999999999, "relics": 99999999, "stamina": 99999999
                    },
                    "islands": exclusiveIslands,
                    "monsters": []
                }
            });
        } else {
            return res.json({ "status": 0, "success": false, "error": "Datos inválidos. Introduce 123 y 123" });
        }
    }

    // 2. DETECTAR LLAMADAS A LA TIENDA O CONFIGURACIONES
    if (action.includes('shop') || action.includes('catalog') || action.includes('get_items')) {
        return res.json({ "status": 1, "success": true, "items": shopCatalog });
    }

    // 3. RESPUESTA UNIVERSAL PARA BYPASS DE ACTUALIZACIÓN Y LLAMADAS DE RUTINA
    return res.json({
        "status": 1,
        "success": true,
        "action": "none",
        "force_update": false,
        "server_version": "3.0.0" 
    });
});

// Desconexión limpia
app.post('/api/player_logout', (req, res) => {
    if (currentOnlinePlayers > 0) currentOnlinePlayers--;
    res.json({ "status": 1, "success": true });
});

app.listen(PORT, () => {
    console.log(`Servidor MSM v3.0.0 emulado con éxito. Capacidad máxima: 32 usuarios.`);
});
 
