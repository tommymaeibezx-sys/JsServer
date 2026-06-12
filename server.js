const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Límite estricto de 10 personas simultáneas solicitado
let activeConnections = 0;
const MAX_PLAYERS = 10;
const maxDurationSeconds = 999999999 * 24 * 60 * 60;

// ESTRUCTURA DE ISLAS OFICIALES (Formato Nativo Reducido v3.0.0)
// i: island_id, u: unlocked, c: castle_level, b: bed_capacity, s: structures
const officialIslandsStructure = [
    { "i": 1, "u": 1, "c": 10, "b": 999999, "s": [] }, // Plant Island
    { "i": 2, "u": 1, "c": 10, "b": 999999, "s": [] }, // Cold Island
    { "i": 3, "u": 1, "c": 10, "b": 999999, "s": [] }, // Air Island
    { "i": 4, "u": 1, "c": 10, "b": 999999, "s": [] }, // Water Island
    { "i": 5, "u": 1, "c": 10, "b": 999999, "s": [] }, // Earth Island
    { "i": 11, "u": 1, "c": 10, "b": 999999, "s": [] }, // Mirror Plant
    { "i": 12, "u": 1, "c": 10, "b": 999999, "s": [] }, // Mirror Cold
    { "i": 13, "u": 1, "c": 10, "b": 999999, "s": [] }, // Mirror Air
    { "i": 14, "u": 1, "c": 10, "b": 999999, "s": [] }, // Mirror Water
    { "i": 15, "u": 1, "c": 10, "b": 999999, "s": [] }  // Mirror Earth
];

// IDs DE MONSTRUOS (Elementales, Mágicos, Raros, Épicos y Supernaturales/Wubbox)
const officialMonsterIds = [
    1, 2, 3, 4, 5, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19,
    30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 50, 51, 52, 53, 54,
    70, 71, 72, 73, 74, 80, 81, 82, 83, 84,
    90, 91, 92, 93, 94, 95, 96,
    201, 202, 203, 204, 205, 211, 212, 213, 214, 215
];

// MAPEO ESTATICO DE LA TIENDA (m: monster_id, c: cost, d: diamonds, t: time_left, cl: class)
const officialShopCatalog = [];
for (const id of officialMonsterIds) {
    officialShopCatalog.push({ "m": id, "c": 0, "d": 0, "t": maxDurationSeconds, "cl": "common" });
    if (id < 92 || id >= 201) {
        officialShopCatalog.push({ "m": id + 1000, "c": 0, "d": 0, "t": maxDurationSeconds, "cl": "rare" });
        officialShopCatalog.push({ "m": id + 2000, "c": 0, "d": 0, "t": maxDurationSeconds, "cl": "epic" });
    }
}

// Configuración global e inyección de Content-Type idéntico al servidor original
app.use((req, res, next) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    if (activeConnections >= MAX_PLAYERS && !req.originalUrl.includes('logout')) {
        return res.status(503).json({ "status": 0, "error": "server_full" });
    }
    next();
});

// CAPTURADOR GENERAL DE ACCIONES (Simula el enrutamiento unificado de Big Blue Bubble)
app.all('*', (req, res) => {
    // La v3.0.0 lee el comando en minúsculas desde el cuerpo del POST o variables query
    const action = (req.body.action || req.query.action || "").toLowerCase();
    
    console.log(`[AUTENTICO v3.0.0] Procesando acción oficial: ${action}`);

    // 1. CONTROL DE PRIVACIDAD, EDAD Y REQUISITOS LEGALES (Omitir carga pesada)
    if (action.includes('age') || action.includes('terms') || action.includes('policy') || action.includes('download')) {
        return res.json({
            "status": 1,
            "age_gate": 1,          // 1 indica aprobado numérico
            "terms": 1,             // 1 indica aprobado numérico
            "privacy": 1,           // 1 indica aprobado numérico
            "download_required": 0, // 0 indica falso (no descargar archivos extra)
            "version": "3.0.0"
        });
    }

    // 2. PROTOCOLO DE AUTENTICACIÓN (Acepta botón Invitado o credenciales manuales 2026/123)
    if (action.includes('login') || action.includes('auth') || action.includes('start') || req.originalUrl.includes('login')) {
        const usernameInput = req.body.username || req.body.user || "";
        const passwordInput = req.body.password || req.body.pass || "";
        
        // Criterio de Invitado: sin texto en casillas, o bandera directa del botón del APK
        const isGuest = action.includes('guest') || req.body.guest || (!usernameInput && !passwordInput);

        if (isGuest || (usernameInput === "2026" && passwordInput === "123")) {
            activeConnections++;
            
            // Retorna el árbol estructurado idéntico que el cliente C++ decodifica nativamente
            return res.json({
                "status": 1,
                "sid": "session_v3_secured_2026", // sid: session_id
                "pid": 88887777,                 // pid: player_id
                "ag": 1,                          // ag: age_gate
                "tm": 1,                          // tm: terms_accepted
                "sv": "3.0.0",                    // sv: server_version
                "user_profile": {
                    "n": isGuest ? "Invitado" : "2026", // n: name
                    "l": 75,                            // l: level
                    "x": 99999999,                      // x: xp
                    "r": {                              // r: resources
                        "co": 999999999, // co: coins
                        "di": 99999999,  // di: diamonds
                        "ke": 99999999,  // ke: keys
                        "fo": 999999999, // fo: food
                        "re": 99999999,  // re: relics
                        "st": 99999999   // st: stamina
                    },
                    "islands_data": officialIslandsStructure,
                    "monsters_active": []
                }
            });
        }
        
        return res.json({ "status": 0, "error": "credenciales_invalidas" });
    }

    // 3. RESPUESTA DEL MERCADO (Mapeada en el nodo raíz plano oficial)
    if (action.includes('shop') || action.includes('catalog') || action.includes('items') || req.originalUrl.includes('shop')) {
        return res.json({
            "status": 1,
            "catalog_version": 3,
            "shop_items": officialShopCatalog
        });
    }

    // RESPUESTA BASE DE RED
    return res.json({
        "status": 1,
        "action": "none",
        "update": 0,
        "ag": 1,
        "tm": 1,
        "sv": "3.0.0"
    });
});

// Desconexión de slots
app.post('/api/player_logout', (req, res) => {
    if (activeConnections > 0) activeConnections--;
    res.json({ "status": 1 });
});

app.listen(PORT, () => {
    console.log(`Estructura oficial MSM v3.0.0 replicada con éxito en puerto ${PORT}.`);
});
