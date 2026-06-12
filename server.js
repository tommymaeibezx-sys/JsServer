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

// 3. TIENDA COMPLETA: Monstruos Elementales, Variantes y Wubboxes a precio 0 por tiempo masivo
app.get('/api/get_shop', (req, res) => {
    // Cálculo del tiempo solicitado en segundos para el motor del juego
    const massiveTimeSeconds = 999999999 * 24 * 60 * 60; 

    // Listado mapeado de ID originales de monstruos de las islas elementales
    const elementalMonsters = [
        // --- 1 Elemento (Naturales) ---
        { "id": 1, "name": "Noggin", "class": "common" },
        { "id": 2, "name": "Mammott", "class": "common" },
        { "id": 3, "name": "Toe Jammer", "class": "common" },
        { "id": 4, "name": "Potbelly", "class": "common" },
        { "id": 5, "name": "Tweedle", "class": "common" },

        // --- 2 Elementos ---
        { "id": 10, "name": "Drumpler", "class": "common" },
        { "id": 11, "name": "Fwog", "class": "common" },
        { "id": 12, "name": "Maw", "class": "common" },
        { "id": 13, "name": "Shrubb", "class": "common" },
        { "id": 14, "name": "Furcorn", "class": "common" },
        { "id": 15, "name": "Oaktopus", "class": "common" },
        { "id": 16, "name": "Dandidoo", "class": "common" },
        { "id": 17, "name": "Pango", "class": "common" },
        { "id": 18, "name": "Quibble", "class": "common" },
        { "id": 19, "name": "Cybop", "class": "common" },

        // --- 3 Elementos ---
        { "id": 30, "name": "T-Rox", "class": "common" },
        { "id": 31, "name": "Clamble", "class": "common" },
        { "id": 32, "name": "Bowgart", "class": "common" },
        { "id": 33, "name": "Pummel", "class": "common" },
        { "id": 34, "name": "Thumpies", "class": "common" },
        { "id": 35, "name": "Congle", "class": "common" },
        { "id": 36, "name": "Spunge", "class": "common" },
        { "id": 37, "name": "Scups", "class": "common" },
        { "id": 38, "name": "PomPom", "class": "common" },
        { "id": 39, "name": "Reedling", "class": "common" },

        // --- 4 Elementos (Jefes de Isla) ---
        { "id": 50, "name": "Entbrat", "class": "common" },
        { "id": 51, "name": "Deedge", "class": "common" },
        { "id": 52, "name": "Riff", "class": "common" },
        { "id": 53, "name": "Shellbeat", "class": "common" },
        { "id": 54, "name": "Quarrister", "class": "common" },

        // --- Míticos y Estacionales de estas Islas ---
        { "id": 70, "name": "G'joob", "class": "mythical" },
        { "id": 71, "name": "Strombonin", "class": "mythical" },
        { "id": 72, "name": "Yawstrich", "class": "mythical" },
        { "id": 73, "name": "Anglow", "class": "mythical" },
        { "id": 74, "name": "Hyehehe", "class": "mythical" },
        { "id": 80, "name": "Punkleton", "class": "seasonal" }, // Spooktacle (Plant)
        { "id": 81, "name": "Yool", "class": "seasonal" },       // Festival of Yay (Cold)
        { "id": 82, "name": "Schmoochle", "class": "seasonal" },  // Season of Love (Air)
        { "id": 83, "name": "Blabbit", "class": "seasonal" },     // Eggstravaganza (Water)
        { "id": 84, "name": "Hoola", "class": "seasonal" },       // SummerSong (Earth)

        // --- SUPERNATURALES: Los Wubbox ---
        { "id": 90, "name": "Wubbox Común", "class": "supernatural" },
        { "id": 91, "name": "Rare Wubbox", "class": "supernatural" },
        { "id": 92, "name": "Epic Wubbox (Plant)", "class": "supernatural" },
        { "id": 93, "name": "Epic Wubbox (Cold)", "class": "supernatural" },
        { "id": 94, "name": "Epic Wubbox (Air)", "class": "supernatural" },
        { "id": 95, "name": "Epic Wubbox (Water)", "class": "supernatural" },
        { "id": 96, "name": "Epic Wubbox (Earth)", "class": "supernatural" }
    ];

    const catalog = [];

    // Bucle para generar automáticamente las variantes Normales, Raras y Épicas de cada uno
    elementalMonsters.forEach(monster => {
        // Variante Común / Base
        catalog.push({
            "monster_id": monster.id,
            "name": monster.name,
            "type": "common",
            "cost_coins": 0,
            "cost_diamonds": 0,
            "time_left": massiveTimeSeconds
        });

        // Generar variante Rara (Excluyendo los Epic Wubbox fijos)
        if (monster.id < 92) {
            catalog.push({
                "monster_id": monster.id + 1000, // Offset estándar para variantes raras
                "name": "Rare " + monster.name,
                "type": "rare",
                "cost_coins": 0,
                "cost_diamonds": 0,
                "time_left": massiveTimeSeconds
            });

            // Generar variante Épica
            catalog.push({
                "monster_id": monster.id + 2000, // Offset estándar para variantes épicas
                "name": "Epic " + monster.name,
                "type": "epic",
                "cost_coins": 0,
                "cost_diamonds": 0,
                "time_left": massiveTimeSeconds
            });
        }
    });

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
    console.log(`Servidor MSM con Tienda Completa y Wubbox en puerto ${PORT}.`);
});
    const listaMonstruos Base = [
        // 1 Elemento (Singulares)
        { id: "noggin", name: "Noggin", class: "Natural (Earth)" },
        { id: "mammott", name: "Mammott", class: "Natural (Cold)" },
        { id: "toe_jammer", name: "Toe Jammer", class: "Natural (Water)" },
        { id: "potbelly", name: "Potbelly", class: "Natural (Plant)" },
        { id: "tweedle", name: "Tweedle", class: "Natural (Air)" },
        { id: "kayna", name: "Kayna", class: "Fire" },
        { id: "fluoress", name: "Fluoress", class: "Light" },
        { id: "theremind", name: "Theremind", class: "Psychic" },
        { id: "floot_fly", name: "Floot Fly", class: "Faerie" },
        { id: "clackula", name: "Clackula", class: "Bone" },
        { id: "ghazt", name: "Ghazt", class: "Ethereal" },
        { id: "reubro", name: "Reubro", class: "Ethereal" },

        // 2 Elementos (Dobles)
        { id: "fwog", name: "Fwog", class: "Double Natural" },
        { id: "drumpler", name: "Drumpler", class: "Double Natural" },
        { id: "maw", name: "Maw", class: "Double Natural" },
        { id: "furcorn", name: "Furcorn", class: "Double Natural" },
        { id: "shrubb", name: "Shrubb", class: "Double Natural" },
        { id: "oaktopus", name: "Oaktopus", class: "Double Natural" },
        { id: "dandidoo", name: "Dandidoo", class: "Double Natural" },
        { id: "pango", name: "Pango", class: "Double Natural" },
        { id: "quibble", name: "Quibble", class: "Double Natural" },
        { id: "cybop", name: "Cybop", class: "Double Natural" },
        { id: "phangler", name: "Phangler", class: "Double Fire" },
        { id: "boskus", name: "Boskus", class: "Double Fire" },

        // 3 Elementos (Triples)
        { id: "t_rox", name: "T-Rox", class: "Triple Natural" },
        { id: "clamble", name: "Clamble", class: "Triple Natural" },
        { id: "pummel", name: "Pummel", class: "Triple Natural" },
        { id: "bowgart", name: "Bowgart", class: "Triple Natural" },
        { id: "spunge", name: "Spunge", class: "Triple Natural" },
        { id: "thumpies", name: "Thumpies", class: "Triple Natural" },
        { id: "congle", name: "Congle", class: "Triple Natural" },
        { id: "pompom", name: "PomPom", class: "Triple Natural" },
        { id: "scups", name: "Scups", class: "Triple Natural" },
        { id: "reedling", name: "Reedling", class: "Triple Natural" },
        { id: "sooza", name: "Sooza", class: "Triple Fire" },
        { id: "repot", name: "Repatillo", class: "Triple Fire" },

        // 4 Elementos (Cuádruples)
        { id: "entbrat", name: "Entbrat", class: "Quad Natural" },
        { id: "deedge", name: "Deedge", class: "Quad Natural" },
        { id: "riff", name: "Riff", class: "Quad Natural" },
        { id: "shellbeat", name: "Shellbeat", class: "Quad Natural" },
        { id: "quarrister", name: "Quarrister", class: "Quad Natural" },
        { id: "tring", name: "Tring", class: "Quad Fire" },
        { id: "sneyser", name: "Sneyser", class: "Quad Fire" },
        { id: "blow't", name: "Blow't", class: "Quad Light" },
        { id: "gloptic", name: "Gloptic", class: "Quad Psychic" },
        { id: "pladdie", name: "Pladdie", class: "Quad Faerie" },
        { id: "plinkajou", name: "Plinkajou", class: "Quad Bone" },

        // 5 Elementos (Quintetos) y Especiales Altos
        { id: "candelavra", name: "Candelavra", class: "Quint Element" },
        { id: "drummidary", name: "Drummidary", class: "Quint Element" },
        { id: "bowhead", name: "Bowhead", class: "Quint Element" },
        { id: "tuskski", name: "Tuskski", class: "Quint Element" },
        { id: "gnarls", name: "Gnarls", class: "Quint Element" },
        
        // Miticos, Estacionales, Wubboxes y Celestiales
        { id: "gjoob", name: "G'joob", class: "Mythical" },
        { id: "strombonin", name: "Strombonin", class: "Mythical" },
        { id: "punkleton", name: "Punkleton", class: "Seasonal" },
        { id: "monculus", name: "Monculus", class: "Seasonal" },
        { id: "wubbox", name: "Wubbox", class: "Exclusive" },
        { id: "galvana", name: "Galvana", class: "Celestial" },
        { id: "attmoz", name: "Attmoz", class: "Celestial" },
        { id: "tawkerr", name: "Tawkerr", class: "Werdo" },
        { id: "parlsona", name: "Parlsona", class: "Werdo" }
    ];

    let catalogoFinal = [];

    // Este bucle clona automáticamente cada monstruo base en sus variantes Raras y Épicas
    listaMonstruosBase.forEach(m => {
        // Añadir Versión Normal
        catalogoFinal.push({ id: m.id, name: m.name, type: "Normal", class: m.class });
        // Añadir Versión Rara
        catalogoFinal.push({ id: `rare_${m.id}`, name: `Rare ${m.name}`, type: "Rare", class: m.class });
        // Añadir Versión Épica
        catalogoFinal.push({ id: `epic_${m.id}`, name: `Epic ${m.name}`, type: "Epic", class: m.class });
    });

    // Formatear propiedades de la tienda para que sean infinitos y gratuitos
    return catalogoFinal.map(m => ({
        ...m,
        available: true,
        price: 0,
        currency: "gold",
        time_left_years: 9999999,
        seconds_remaining: TIEMPO_INFINITO_SEGUNDOS
    }));
};

const tiendaMonstruos = generarCatalogoCompleto();

// 3. DATOS DE PERFIL FIJO (New Player Modded / Nivel 99 / Recursos al máximo)
const msmPlayerData = {
    user_id: "77777777",
    display_name: "New Player Modded",
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
    islands: todasLasIslas,
    monsters: []
};

// Configuración de cabeceras de red globales
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, X-Game-Version");
    next();
});

// Bypass dinámico para anular pantallas de actualización forzada en el juego móvil
app.get(['/', '/api/version', '/v1/config'], (req, res) => {
    const clientVersion = req.headers['x-game-version'] || "99.9.9";
    res.json({
        status: "success",
        server_time: Math.floor(Date.now() / 1000),
        maintenance: false,
        latest_version: clientVersion, // Coincide siempre para engañar al cliente
        force_update: false,
        dismiss_update_prompt: true
    });
});

// Login universal (Acepta cualquier string de usuario o contraseña)
app.post(['/api/player/login', '/v1/auth/login', '/login'], (req, res) => {
    console.log("Login aceptado de forma anónima.");
    res.json({
        result: "OK",
        error_code: 0,
        message: "Acceso ilimitado concedido",
        force_update: false,
        data: {
            session_token: "bypass_token_" + Math.random().toString(36).substring(7),
            player_data: msmPlayerData
        }
    });
});

// Obtener la tienda con todos los monstruos de todos los elementos (Normales, Raros y Épicos)
app.get(['/api/shop/monsters', '/shop/monsters'], (req, res) => {
    res.json({
        result: "OK",
        count: tiendaMonstruos.length,
        monsters: tiendaMonstruos
    });
});

// Comprar un monstruo de cualquier elemento (Nivel 20 automático al obtenerlo)
app.post(['/api/shop/buy', '/shop/buy'], (req, res) => {
    const { id_monstruo, island_id } = req.body;
    const objetoTienda = tiendaMonstruos.find(m => m.id === id_monstruo);

    if (!objetoTienda) {
        return res.status(404).json({ result: "ERROR", message: "Monstruo no disponible" });
    }

    const nuevoMonstruo = {
        instance_id: "inst_" + Date.now() + Math.floor(Math.random() * 1000),
        monster_id: objetoTienda.id,
        name: objetoTienda.name,
        type: objetoTienda.type,
        class: objetoTienda.class,
        island_id: island_id || 1,
        level: 20,
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

app.post(['/api/player/sync', '/v1/game/sync'], (req, res) => {
