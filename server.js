const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Límite estricto ultraligero de 10 personas para carga instantánea
let currentOnlinePlayers = 0;
const MAX_PLAYERS = 10;
const massiveTimeSeconds = 999999999 * 24 * 60 * 60;

// Configuración optimizada de Islas Elementales y Espejo v3.0.0
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

// Lista base de IDs: Naturales, Estacionales, Wubboxes y Mágicos (v3.0.0)
const baseMonsterIds = [
    1, 2, 3, 4, 5, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, // Comunes 1 y 2 elementos
    30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 50, 51, 52, 53, 54, // 3 y 4 elementos
    70, 71, 72, 73, 74, 80, 81, 82, 83, 84, // Míticos y Estacionales
    90, 91, 92, 93, 94, 95, 96, // Wubboxes (Común, Raro y Épicos Elementales)
    201, 202, 203, 204, 205, 206, 207, 208, 209, 210, // Monstruos Mágicos base
    211, 212, 213, 214, 215, 216, 217, 218, 219, 220  // Híbridos Mágicos de las islas
];

const shopCatalog = [];
for (const id of baseMonsterIds) {
    // Variante Común a coste 0
    shopCatalog.push({ "monster_id": id, "cost_coins": 0, "cost_diamonds": 0, "time_left": massiveTimeSeconds, "type": "common" });
    
    // Evitar duplicar sobre los Epic Wubbox fijos
    if (id < 92 || id >= 201) {
        // Variante Rara (+1000)
        shopCatalog.push({ "monster_id": id + 1000, "cost_coins": 0, "cost_diamonds": 0, "time_left": massiveTimeSeconds, "type": "rare" });
        // Variante Épica (+2000)
        shopCatalog.push({ "monster_id": id + 2000, "cost_coins": 0, "cost_diamonds": 0, "time_left": massiveTimeSeconds, "type": "epic" });
    }
}

// Inyección y control de capacidad ultra-rápido
app.use((req, res, next) => {
    res.setHeader('Content-Type', 'application/json');
    if (currentOnlinePlayers >= MAX_PLAYERS && !req.originalUrl.includes('logout')) {
        return res.status(503).json({ "status": "error", "message": "Servidor lleno. Máximo 10 personas." });
    }
    next();
});

app.all('*', (req, res) => {
    const action = (req.body.action || req.query.action || "").toLowerCase();
    const url = req.originalUrl.toLowerCase();

    console.log(`[FAST SERVICE 10X] Action: ${action}`);

    // LOGIN INMEDIATO: Procesa Invitado o Cuenta 2026/123 en menos de 1 segundo
    if (action.includes('login') || action.includes('auth') || url.includes('login') || url.includes('start')) {
        const inputUser = req.body.username || req.body.user || req.body.email || "";
        const inputPass = req.body.password || req.body.pass || "";
        const isGuest = action.includes('guest') || req.body.guest || (!inputUser && !inputPass);

        if (isGuest || (inputUser === "2026" && inputPass === "123")) {
            currentOnlinePlayers++;
            
            return res.json({
                "status": "success",
                "action": "none",
                "session_id": "fast_session_" + Math.floor(Math.random() * 9999),
                "player_id": 88887777,
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
        return res.json({ "status": "error", "message": "Usa Invitado o introduce 2026 con clave 123." });
    }

    // CARGA DE LA TIENDA CON TODOS LOS MONSTRUOS Y MÁGICOS
    if (action.includes('shop') || action.includes('catalog') || action.includes('items') || url.includes('shop')) {
        return res.json({
            "status": "success",
            "monsters": shopCatalog
        });
    }

    // RESPUESTA BASE INSTANTÁNEA
    return res.json({
        "status": "success",
        "action": "none",
        "force_update": false,
        "server_version": "3.0.0"
    });
});

app.post('/api/player_logout', (req, res) => {
    if (currentOnlinePlayers > 0) currentOnlinePlayers--;
    res.json({ "status": "success" });
});

app.listen(PORT, () => {
    console.log(`Servidor MSM Fast-Load (Límite: 10) activo en puerto ${PORT}.`);
});
 
