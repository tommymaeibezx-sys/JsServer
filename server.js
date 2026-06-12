const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const TIEMPO_INFINITO_SEGUNDOS = 999999999 * 365 * 24 * 60 * 60;

// 1. TODAS LAS ISLAS DEL JUEGO ACTUALIZADAS
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

// 2. GENERADOR AUTOMÁTICO DE TODOS LOS ELEMENTOS (1, 2, 3, 4 y 5 elementos + Especiales)
const generarCatalogoCompleto = () => {
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
