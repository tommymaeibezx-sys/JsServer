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

// Monstruos Elementales y Wubboxes para la Tienda
const elementalMonsters = [
    { "id": 1, "name": "Noggin" }, { "id": 2, "name": "Mammott" }, { "id": 3, "name": "Toe Jammer" }, 
    { "id": 4, "name": "Potbelly" }, { "id": 5, "name": "Tweedle" }, { "id": 10, "name": "Drumpler" }, 
    { "id": 11, "name": "Fwog" }, { "id": 12, "name": "Maw" }, { "id": 13, "name": "Shrubb" }, 
    { "id": 14, "name": "Furcorn" }, { "id": 15, "name": "Oaktopus" }, { "id": 16, "name": "Dandidoo" }, 
    { "id": 17, "name": "Pango" }, { "id": 18, "name": "Quibble" }, { "id": 19, "name": "Cybop" }, 
    { "id": 30, "name": "T-Rox" }, { "id": 31, "name": "Clamble" }, { "id": 32, "name": "Bowgart" }, 
    { "id": 33, "name": "Pummel" }, { "id": 34, "name": "Thumpies" }, { "id": 35, "name": "Congle" }, 
    { "id": 36, "name": "Spunge" }, { "id": 37, "name": "Scups" }, { "id": 38, "name": "PomPom" }, 
    { "id": 39, "name": "Reedling" }, { "id": 50, "name": "Entbrat" }, { "id": 51, "name": "Deedge" }, 
    { "id": 52, "name": "Riff" }, { "id": 53, "name": "Shellbeat" }, { "id": 54, "name": "Quarrister" }, 
    { "id": 70, "name": "G'joob" }, { "id": 71, "name": "Strombonin" }, { "id": 72, "name": "Yawstrich" }, 
    { "id": 73, "name": "Anglow" }, { "id": 74, "name": "Hyehehe" }, { "id": 80, "name": "Punkleton" }, 
    { "id": 81, "name": "Yool" }, { "id": 82, "name": "Schmoochle" }, { "id": 83, "name": "Blabbit" }, 
    { "id": 84, "name": "Hoola" }, { "id": 90, "name": "Wubbox Comun" }, { "id": 91, "name": "Rare Wubbox" }, 
    { "id": 92, "name": "Epic Wubbox Plant" }, { "id": 93, "name": "Epic Wubbox Cold" }, 
    { "id": 94, "name": "Epic Wubbox Air" }, { "id": 95, "name": "Epic Wubbox Water" }, 
    { "id": 96, "name": "Epic Wubbox Earth" }
];

// Construcción del catálogo dinámico de la tienda
const shopCatalog = [];
for (const monster of elementalMonsters) {
    shopCatalog.push({ "item_id": monster.id, "cost": 0, "currency": "coins", "duration": massiveTimeSeconds, "type": "common" });
    if (monster.id < 92) {
        shopCatalog.push({ "item_id": monster.id + 1000, "cost": 0, "currency": "coins", "duration": massiveTimeSeconds, "type": "rare" });
        shopCatalog.push({ "item_id": monster.id + 2000, "cost": 0, "currency": "coins", "duration": massiveTimeSeconds, "type": "epic" });
    }
}

// Middleware de diagnóstico y control de capacidad
app.use((req, res, next) => {
    console.log(`[SOLICITUD] URL: ${req.originalUrl} | Body: ${JSON.stringify(req.body)}`);
    if (currentOnlinePlayers >= 51) {
        return res.status(503).json({ "status": 0, "error": "Servidor Lleno (Max 51)" });
    }
    next();
});

// ROUTING DE VALIDACIÓN COMPLETA
app.use((req, res, next) => {
    const url = req.originalUrl.toLowerCase();

    // 1. CONTROL DE VERSIÓN (Bypass obligatorio)
    if (url.includes('version') || url.includes('check') || url.includes('gate')) {
        return res.json({
            "status": 1,
            "success": true,
            "action": "none",
            "force_update": false,
            "server_version": "5.0.0"
        });
    }

    // 2. AUTENTICACIÓN CENTRALIZADA (User: MsmHack | Pass: 1234)
    if (url.includes('login') || url.includes('auth') || url.includes('start')) {
        const inputUser = req.body.username || req.body.user || req.body.email || "";
        const inputPass = req.body.password || req.body.pass || "";

        // Si el APK envía campos vacíos o diferentes, los interceptamos. 
        // Si quieres forzar que SÓLO entre con esa cuenta, validamos:
        if (inputUser === "MsmHack" && inputPass === "1234") {
            currentOnlinePlayers++;
            return res.json({
                "status": 1,
                "success": true,
                "session_id": "session_secured_9999",
                "player_id": 99998888,
                "user_data": {
                    "username": "MsmHack",
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
        } else {
            // Rechaza cualquier otro login incorrecto
            return res.json({
                "status": 0,
                "success": false,
                "error": "Credenciales Incorrectas. Usa MsmHack y 1234"
            });
        }
    }

    // 3. RESPUESTA DE LA TIENDA CORREGIDA
    if (url.includes('shop') || url.includes('catalog') || url.includes('structures')) {
        return res.json({
            "status": 1,
            "success": true,
            "items": shopCatalog
        });
    }

    // 4. IGNORAR PROGRESO (Sin Save Data)
    if (url.includes('save') || url.includes('update') || url.includes('record')) {
        return res.json({ "status": 1, "success": true });
    }

    next();
});

// Desconexión limpia
app.post('/api/player_logout', (req, res) => {
    if (currentOnlinePlayers > 0) currentOnlinePlayers--;
    res.json({ "status": 1, "success": true });
});

app.listen(PORT, () => {
    console.log(`Servidor MSM con cuenta única 'MsmHack' activo en puerto ${PORT}.`);
});
 
