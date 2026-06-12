const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware para procesar textos planos y JSON, ya que algunos APKs envían datos sin formatear
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.text());

let currentOnlinePlayers = 0;

// Middleware de depuración: Te mostrará EXACTAMENTE qué ruta está buscando tu juego
app.use((req, res, next) => {
    console.log(`[PETICIÓN RECIBIDA] Método: ${req.method} | Ruta original: ${req.originalUrl}`);
    
    if (currentOnlinePlayers >= 51) {
        return res.status(503).json({ "status": "error", "message": "Servidor lleno." });
    }
    next();
});

// VARIABLES BASE DE CONFIGURACIÓN Masiva
const massiveTimeSeconds = 999999999 * 24 * 60 * 60;
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

// INTERCEPTOR UNIVERSAL: Captura cualquier petición sospechosa si la ruta cambia en el APK
app.use((req, res, next) => {
    const url = req.originalUrl.toLowerCase();
    
    // Si la URL contiene palabras clave de login o verificación, forzamos la respuesta adecuada inmediatamente
    if (url.includes('version') || url.includes('check')) {
        return res.json({ "status": "success", "action": "none", "force_update": false, "server_version": "5.0.0" });
    }
    
    if (url.includes('login') || url.includes('auth') || url.includes('user')) {
        currentOnlinePlayers++;
        return res.json({
            "status": "success",
            "player_id": "anon_" + Math.floor(Math.random() * 100000),
            "game_data": {
                "account_type": "guest_anonymous",
                "level": 75,
                "resources": { "coins": 999999999, "diamonds": 99999999, "keys": 99999999, "food": 999999999, "relics": 99999999, "stamina": 99999999 },
                "islands": exclusiveIslands
            }
        });
    }

    if (url.includes('shop') || url.includes('catalog')) {
        return res.json({ "status": "success", "shop_items": [] }); // (Aquí se acopla tu lógica previa si pasa el filtro)
    }

    if (url.includes('save') || url.includes('progress')) {
        return res.json({ "status": "success" });
    }

    next();
});

// Rutas estáticas de respaldo
app.post('/api/version_check', (req, res) => res.json({ "status": "success", "action": "none", "force_update": false }));
app.post('/api/player_login', (req, res) => res.json({ "status": "success" }));

app.listen(PORT, () => {
    console.log(`Servidor de Redirección Universal MSM Activo en puerto ${PORT}.`);
});
 
