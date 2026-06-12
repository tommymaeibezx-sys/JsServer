const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const TIEMPO_INFINITO_SEGUNDOS = 999999999 * 365 * 24 * 60 * 60;

// Lista de TODAS las islas actuales del juego
const todasLasIslas = [
    { island_id: 1, name: "Plant Island", unlocked: true },
    { island_id: 2, name: "Cold Island", unlocked: true },
    { island_id: 3, name: "Air Island", unlocked: true },
    { island_id: 4, name: "Water Island", unlocked: true },
    { island_id: 5, name: "Earth Island", unlocked: true },
    { island_id: 6, name: "Fire Haven", unlocked: true },
    { island_id: 7, name: "Fire Oasis", unlocked: true },
    { island_id: 8, name: "Light Island", unlocked: true },
    { island_id: 9, name: "Psychic Island", unlocked: true },
    { island_id: 10, name: "Faerie Island", unlocked: true },
    { island_id: 11, name: "Bone Island", unlocked: true },
    { island_id: 12, name: "Wublin Island", unlocked: true },
    { island_id: 13, name: "Celestial Island", unlocked: true },
    { island_id: 14, name: "Tribal Island", unlocked: true },
    { island_id: 15, name: "Gold Island", unlocked: true },
    { island_id: 16, name: "Amber Island", unlocked: true },
    { island_id: 17, name: "Mythical Island", unlocked: true },
    { island_id: 18, name: "Ethereal Island", unlocked: true },
    { island_id: 19, name: "Ethereal Workshop", unlocked: true },
    { island_id: 20, name: "Shugabush Island", unlocked: true },
    { island_id: 21, name: "Magical Sanctum", unlocked: true }
];

// Catálogo completo de la tienda con monstruos de todas las islas
const tiendaMonstruos = [
    // Planta y Naturales (Normal, Rare, Epic)
    { id: "noggin", name: "Noggin", type: "Normal" },
    { id: "rare_noggin", name: "Rare Noggin", type: "Rare" },
    { id: "epic_noggin", name: "Epic Noggin", type: "Epic" },
    { id: "mammott", name: "Mammott", type: "Normal" },
    { id: "rare_mammott", name: "Rare Mammott", type: "Rare" },
    { id: "epic_mammott", name: "Epic Mammott", type: "Epic" },
    { id: "entbrat", name: "Entbrat", type: "Normal" },
    { id: "rare_entbrat", name: "Rare Entbrat", type: "Rare" },
    { id: "epic_entbrat", name: "Epic Entbrat", type: "Epic" },
    
    // Etéreos y Taller Etéreo
    { id: "ghazt", name: "Ghazt", type: "Normal" },
    { id: "rare_ghazt", name: "Rare Ghazt", type: "Rare" },
    { id: "epic_ghazt", name: "Epic Ghazt", type: "Epic" },
    { id: "meebkin", name: "Meebkin", type: "Normal" },
    { id: "yooreek", name: "Yooreek", type: "Normal" },
    { id: "gaddzooks", name: "Gaddzooks", type: "Normal" },
    
    // Míticos y Estacionales
    { id: "gjoob", name: "G'joob", type: "Mythical" },
    { id: "strombonin", name: "Strombonin", type: "Mythical" },
    { id: "punkleton", name: "Punkleton", type: "Seasonal" },
    { id: "monculus", name: "Monculus", type: "Seasonal" },
    
    // Especiales y Celestiales
    { id: "wubbox", name: "Wubbox", type: "Exclusive" },
    { id: "rare_wubbox", name: "Rare Wubbox", type: "Rare Exclusive" },
    { id: "epic_wubbox", name: "Epic Wubbox", type: "Epic Exclusive" },
    { id: "galvana", name: "Galvana", type: "Celestial" },
    { id: "attmoz", name: "Attmoz", type: "Celestial" },
    
    // Werdos y Wublins
    { id: "tawkerr", name: "Tawkerr", type: "Werdo" },
    { id: "parlsona", name: "Parlsona", type: "Werdo" },
    { id: "brump", name: "Brump", type: "Wublin" },
    { id: "zynth", name: "Zynth", type: "Wublin" }
].map(m => ({
    ...m,
    available: true,
    price: 0,
    currency: "gold",
    time_left_years: 9999999,
    seconds_remaining: TIEMPO_INFINITO_SEGUNDOS
}));

// Datos de perfil fijo para cualquier persona que se conecte
const msmPlayerData = {
    user_id: "77777777",
    display_name: "New Player Modded", // Nombre solicitado
    level: 99,
    xp: 999999999,
    currency: {
        gold: 999999999,
        diamonds: 999999999,
        food: 999999999,
        relics: 999999999,
        keys: 999999999,
        stardust: 999999999,
        starpower: 999999999
    },
    islands: todasLasIslas, // Todas las islas desbloqueadas al iniciar
    monsters: []
};

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, X-Game-Version");
    next();
});

// Bypass de actualización forzada. Si el juego pregunta la versión, siempre decimos la que pida o una altísima
app.get(['/', '/api/version', '/v1/config'], (req, res) => {
    // Captura la versión que el cliente envía, si no, por defecto responde que el server está en una versión del futuro (v99.9.9)
    const clientVersion = req.headers['x-game-version'] || "99.9.9";
    
    res.json({
        status: "success",
        server_time: Math.floor(Date.now() / 1000),
        maintenance: false,
        latest_version: clientVersion, // Se adapta para saltar el bloqueo
        force_update: false, // Forzar que no pida actualizar
        dismiss_update_prompt: true // Si hay un mensaje viejo en caché, ordena cerrarlo
    });
});

// Login Anónimo Universal (Acepta CUALQUIER usuario y contraseña falsos)
app.post(['/api/player/login', '/v1/auth/login', '/login'], (req, res) => {
    const { username, password, user, msg } = req.body;
    
    console.log(`Login Anónimo Exitoso - Usuario recibido: [${username || user || "anon_lol"}]`);

    // Responde con éxito total omitiendo cualquier verificación de contraseña
    res.json({
        result: "OK",
        error_code: 0,
        message: "Acceso concedido al servidor modificado",
        force_update: false, // Asegura romper el bucle de actualización en el arranque
        data: {
            session_token: "bypass_token_" + Math.random().toString(36).substring(7),
            player_data: msmPlayerData
        }
    });
});

// Tienda Completa de Monstruos
app.get(['/api/shop/monsters', '/shop/monsters'], (req, res) => {
    res.json({
        result: "OK",
        count: tiendaMonstruos.length,
        monsters: tiendaMonstruos
    });
});

// Compra instantánea sin coste
app.post(['/api/shop/buy', '/shop/buy'], (req, res) => {
    const { id_monstruo, island_id } = req.body;
    const objetoTienda = tiendaMonstruos.find(m => m.id === id_monstruo);

    if (!objetoTienda) {
        return res.status(404).json({ result: "ERROR", message: "Monstruo no válido" });
    }

    const nuevoMonstruo = {
        instance_id: "inst_" + Date.now() + Math.floor(Math.random() * 1000),
        monster_id: objetoTienda.id,
        name: objetoTienda.name,
        type: objetoTienda.type,
        island_id: island_id || 1, // Se puede colocar en cualquier ID de isla de la 1 a la 21
        level: 20, // Aparecen directo a nivel máximo
        x: 0,
        y: 0
    };

    msmPlayerData.monsters.push(nuevoMonstruo);

    res.json({
        result: "OK",
        player_currency: msmPlayerData.currency,
        monsters_owned: msmPlayerData.monsters
    });
});

// Sincronización automática para simular estabilidad
app.post(['/api/player/sync', '/v1/game/sync'], (req, res) => {
    res.json({ result: "OK", force_update: false, currency_status: msmPlayerData.currency });
});

app.listen(PORT, () => {
    console.log("Servidor MSM Modded 100% Anónimo y sin Bloqueos listo.");
});
