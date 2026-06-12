const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

let currentOnlinePlayers = 0;

// Límite estricto de 51 jugadores activos simultáneamente
app.use((req, res, next) => {
    if (currentOnlinePlayers >= 51) {
        return res.status(503).json({ 
            "status": "error", 
            "message": "Servidor lleno. Capacidad máxima: 51 jugadores." 
        });
    }
    next();
});

// 1. SALTAR ACTUALIZACIÓN DEL JUEGO
app.post('/api/version_check', (req, res) => {
    res.json({
        "status": "success",
        "action": "none", 
        "force_update": false,
        "server_version": req.body.version || "5.0.0"
    });
});

// 2. LOGIN ANÓNIMO VOLÁTIL (Islas Elementales y Espejo Desbloqueadas al Máximo)
app.post('/api/player_login', (req, res) => {
    currentOnlinePlayers++;

    const exclusiveIslands = [
        { "island_id": 1, "name": "Plant Island", "unlocked": true, "beds": 999999, "castle_level": 10 },
        { "island_id": 2, "name": "Cold Island", "unlocked": true, "beds": 999999, "castle_level": 10 },
        { "island_id": 3, "name": "Air Island", "unlocked": true, "beds": 999999, "castle_level": 10 },
        { "island_id": 4, "name": "Water Island", "unlocked": true, "beds": 999999, "castle_level": 10 },
        { "island_id": 5, "name": "Earth Island", "unlocked": true, "beds": 999999, "castle_level": 10 },
        { "island_id": 11, "name": "Mirror Plant Island", "unlocked": true, "beds": 999999, "castle_level": 10 },
        { "island_id": 12, "name": "Mirror Cold Island", "unlocked": true, "beds": 999999, "castle_level": 10 },
        { "island_id": 13, "name": "Mirror Air Island", "unlocked": true, "beds": 999999, "castle_level": 10 },
        { "island_id": 14, "name": "Mirror Water Island", "unlocked": true, "beds": 999999, "castle_level": 10 },
        { "island_id": 15, "name": "Mirror Earth Island", "unlocked": true, "beds": 999999, "castle_level": 10 }
    ];

    res.json({
        "status": "success",
        "player_id": req.body.player_id || "anon_player_" + Math.floor(Math.random() * 100000),
        "game_data": {
            "account_type": "guest_anonymous",
            "level": 75,
            "resources": {
                "coins": 999999999,
                "diamonds": 99999999,
                "keys": 99999999,
                "food": 999999999,
                "relics": 99999999,
                "stamina": 99999999
            },
            "islands": exclusiveIslands
        }
    });
});

// 3. TIENDA COMPLETA: Inicialización limpia corregida
app.get('/api/get_shop', (req, res) => {
    const massiveTimeSeconds = 999999999 * 24 * 60 * 60; 

    const elementalMonsters = [
        { "id": 1, "name": "Noggin" }, { "id": 2, "name": "Mammott" }, 
        { "id": 3, "name": "Toe Jammer" }, { "id": 4, "name": "Potbelly" }, { "id": 5, "name": "Tweedle" },
        { "id": 10, "name": "Drumpler" }, { "id": 11, "name": "Fwog" }, { "id": 12, "name": "Maw" }, 
        { "id": 13, "name": "Shrubb" }, { "id": 14, "name": "Furcorn" }, { "id": 15, "name": "Oaktopus" }, 
        { "id": 16, "name": "Dandidoo" }, { "id": 17, "name": "Pango" }, { "id": 18, "name": "Quibble" }, 
        { "id": 19, "name": "Cybop" }, { "id": 30, "name": "T-Rox" }, { "id": 31, "name": "Clamble" }, 
        { "id": 32, "name": "Bowgart" }, { "id": 33, "name": "Pummel" }, { "id": 34, "name": "Thumpies" }, 
        { "id": 35, "name": "Congle" }, { "id": 36, "name": "Spunge" }, { "id": 37, "name": "Scups" }, 
        { "id": 38, "name": "PomPom" }, { "id": 39, "name": "Reedling" }, { "id": 50, "name": "Entbrat" }, 
        { "id": 51, "name": "Deedge" }, { "id": 52, "name": "Riff" }, { "id": 53, "name": "Shellbeat" }, 
        { "id": 54, "name": "Quarrister" }, { "id": 70, "name": "G'joob" }, { "id": 71, "name": "Strombonin" }, 
        { "id": 72, "name": "Yawstrich" }, { "id": 73, "name": "Anglow" }, { "id": 74, "name": "Hyehehe" }, 
        { "id": 80, "name": "Punkleton" }, { "id": 81, "name": "Yool" }, { "id": 82, "name": "Schmoochle" }, 
        { "id": 83, "name": "Blabbit" }, { "id": 84, "name": "Hoola" }, { "id": 90, "name": "Wubbox Comun" }, 
        { "id": 91, "name": "Rare Wubbox" }, { "id": 92, "name": "Epic Wubbox Plant" }, 
        { "id": 93, "name": "Epic Wubbox Cold" }, { "id": 94, "name": "Epic Wubbox Air" }, 
        { "id": 95, "name": "Epic Wubbox Water" }, { "id": 96, "name": "Epic Wubbox Earth" }
    ];

    const catalog = [];

    // Bucle clásico for-of para evitar fallos de inicialización en ámbitos flecha
    for (const monster of elementalMonsters) {
        catalog.push({
            "monster_id": monster.id,
            "name": monster.name,
            "type": "common",
            "cost_coins": 0,
            "cost_diamonds": 0,
            "time_left": massiveTimeSeconds
        });

        if (monster.id < 92) {
            catalog.push({
                "monster_id": monster.id + 1000,
                "name": "Rare " + monster.name,
                "type": "rare",
                "cost_coins": 0,
                "cost_diamonds": 0,
                "time_left": massiveTimeSeconds
            });

            catalog.push({
                "monster_id": monster.id + 2000,
                "name": "Epic " + monster.name,
                "type": "epic",
                "cost_coins": 0,
                "cost_diamonds": 0,
                "time_left": massiveTimeSeconds
            });
        }
    }

    res.json({
        "status": "success",
        "shop_items": catalog
    });
});

// 4. SIMULAR GUARDADO EXITOSO
app.post('/api/save_progress', (req, res) => {
    res.json({ "status": "success" });
});

// 5. REMOVER CONEXIÓN ACTIVA AL SALIR
app.post('/api/player_logout', (req, res) => {
    if (currentOnlinePlayers > 0) currentOnlinePlayers--;
    res.json({ "status": "success" });
});

app.listen(PORT, () => {
    console.log(`Servidor MSM corregido activo en puerto ${PORT}.`);
});
