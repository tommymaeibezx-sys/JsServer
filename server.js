const express = require('express');
const bodyParser = require('body-parser');
const compression = require('compression');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(compression());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Health Check limpio para Railway
app.get('/', (req, res) => res.status(200).send('Servidor MSM Activo | Logger + Interceptor Completo'));

// ==================================================================
// 🔎 1. LOGGER DE CONTROL TOTAL (MUESTRA CUALQUIER PETICIÓN EN ENTRADA)
// ==================================================================
app.use((req, res, next) => {
    const action = req.body.action || req.query.action || req.body.cmd || req.query.cmd || "Petición Secundaria/Directa";
    
    console.log(`\n==================================================================`);
    console.log(`📩 [APK REQ] -> [${new Date().toLocaleTimeString()}]`);
    console.log(`   📌 RUTA:   ${req.method} ${req.url}`);
    console.log(`   🎬 ACCIÓN: "${action}"`);
    
    if (Object.keys(req.body).length > 0) {
        console.log(`   📦 BODY (DATOS):`, JSON.stringify(req.body, null, 2));
    } else {
        console.log(`   📦 BODY (DATOS): [Sin JSON / Vacío]`);
    }
    console.log(`==================================================================`);
    next();
});

// ===================================================
// CONFIGURACIÓN DE AJUSTES Y VARIABLES DE RAM
// ===================================================
const activeUsers = {}; 
const MAX_ONLINE_PLAYERS = 30; 
const MAX_INACTIVITY_HOURS = 12; 
const INACTIVITY_TTL = MAX_INACTIVITY_HOURS * 60 * 60 * 1000; 

const ADMIN_USER = "msmMod";
const ADMIN_PASS = "123";

activeUsers[ADMIN_USER] = {
    user_id: 999999,
    display_name: "Administrador_MSM",
    coins: 99999999,
    diamonds: 50000,
    level: 75,
    is_admin: true,
    last_seen: Infinity
};

const getOnlineCount = () => {
    return Object.keys(activeUsers).filter(key => key !== ADMIN_USER && key !== 'undefined').length;
};

// Daemon de purga por inactividad absoluta
setInterval(() => {
    const ahora = Date.now();
    for (const key in activeUsers) {
        if (activeUsers[key].is_admin) continue;
        if (ahora - activeUsers[key].last_seen > INACTIVITY_TTL) {
            delete activeUsers[key];
        }
    }
}, 10 * 60 * 1000);

// ===================================================
// INTERCEPTOR DE BASES DE DATOS DE GITHUB (db_)
// ===================================================
const dataCache = {};
const dataDir = path.join(__dirname, 'data');

const cargarTodasLasBasesDeDatos = () => {
    if (!fs.existsSync(dataDir)) return;
    try {
        const files = fs.readdirSync(dataDir);
        files.forEach(file => {
            if (file.endsWith('.json')) {
                const actionName = path.basename(file, '.json');
                const content = fs.readFileSync(path.join(dataDir, file), 'utf8');
                if (content.trim().length > 0) {
                    dataCache[actionName] = JSON.parse(content);
                }
            }
        });
        console.log(`[Caché GITHUB] Tablas de datos indexadas correctamente.`);
    } catch (e) { console.error("Error cargando archivos JSON:", e.message); }
};

// ===================================================
// 🛠️ 2. CONTROLADOR CENTRAL E INTERCEPTOR ANTI-TRABAS
// ===================================================
const handleGameTraffic = (req, res) => {
    const action = req.body.action || req.query.action || req.body.cmd || req.query.cmd;
    const username = req.body.username ? String(req.body.username).trim() : null;

    // Renovar actividad si la sesión sigue viva en RAM
    if (username && activeUsers[username]) {
        activeUsers[username].last_seen = Date.now();
    }

    // Despacho prioritario de catálogos db_ reales de GitHub
    if (action && dataCache[action]) {
        console.log(`🟢 [RESPUESTA] Despachando JSON real de GitHub para: ${action}`);
        return res.json(dataCache[action]);
    }
    if (action && action.startsWith('db_')) {
        console.log(`🟡 [RESPUESTA] Fallback seguro (vacío) para base de datos: ${action}`);
        const fallbackKey = action.replace('db_', '');
        return res.json({ [fallbackKey]: [] });
    }

    // FLUJO PRINCIPAL DE LOGIN (gs_player)
    if (action === 'gs_player') {
        const password = req.body.password || req.query.password;
        const isAnonymous = req.body.anonymous || req.query.anonymous === 'true' || req.query.anonymous === 1;

        if (username === ADMIN_USER && password === ADMIN_PASS) {
            console.log(`👑 [RESPUESTA] Acceso concedido al Administrador.`);
            return res.json({ player: activeUsers[ADMIN_USER] });
        }

        if (username && activeUsers[username]) {
            activeUsers[username].last_seen = Date.now();
            console.log(`🔄 [RESPUESTA] Reconexión exitosa para: "${username}".`);
            return res.json({ player: activeUsers[username] });
        }

        // Control de aforo estricto para cuidar el 1GB de RAM
        const jugadoresOnline = getOnlineCount();
        if (jugadoresOnline >= MAX_ONLINE_PLAYERS) {
            console.log(`⚠️ [RESPUESTA] Servidor saturado (${jugadoresOnline}/${MAX_ONLINE_PLAYERS}). Enviando cuenta fantasma de aviso.`);
            return res.json({
                player: {
                    user_id: 777777,
                    display_name: "SERVER_LLENO_INTENTA_LUEGO",
                    coins: 0, diamonds: 0, level: 1, last_seen: Date.now()
                }
            });
        }

        let cuentaKey = username;
        let esRegenerada = true;

        if (isAnonymous || !cuentaKey || cuentaKey === 'undefined') {
            const tempId = Math.floor(100000 + Math.random() * 900000);
            cuentaKey = `anon_${tempId}`;
            esRegenerada = false;
        }

        activeUsers[cuentaKey] = {
            user_id: Math.floor(100000 + Math.random() * 900000),
            display_name: esRegenerada ? `Regen_${cuentaKey.substring(0, 4)}` : `Monstruo_${cuentaKey.replace('anon_', '')}`,
            coins: 50000,
            diamonds: 500,
            level: 1,
            xp: 0,
            starpower: 0,
            relics: 0,
            keys: 0,
            is_admin: false,
            last_seen: Date.now()
        };

        console.log(`🚀 [RESPUESTA] Perfil exitoso devuelto al APK para: "${cuentaKey}"`);
        return res.json({ player: activeUsers[cuentaKey], temp_session_key: cuentaKey });
    }

    // SWITCH DETALLADO DE PETICIONES SECUNDARIAS NATIVAS DE C++ (Big Blue Bubble)
    switch (action) {
        case 'game_settings':
            return res.json({ status: "success", settings: { maintenance: false, client_version_required: "1.0.0", is_available: true } });
            
        case 'gs_is_registered':
        case 'check_username':
            return res.json({ status: "success", registered: true, exists: true });

        case 'log_client_error':
        case 'client_log':
        case 'analytics_event':
            return res.json({ status: "success", logged: true });

        case 'get_eligible_offers':
        case 'get_store_products':
        case 'sync_purchases':
            return res.json({ status: "success", products: [], offers: [], purchases: [] });

        case 'get_ad_settings':
        case 'ad_config':
            return res.json({ status: "success", ads_enabled: false, config: {} });

        default:
            // INTERCEPTOR DE SEGURIDAD ABSOLUTA
            // Si libmonsters.so inventa o pide una acción oculta, esto analiza la estructura y responde con éxito preventivo
            console.log(`🔵 [MOCK DEFENSIVO] Respondiendo éxito preventivo a la acción: "${action || 'Invisibles/Rutas Cortas'}"`);
            
            if (req.body.list || req.url.includes('list')) {
                return res.json([]);
            }
            return res.json({ status: "success", code: 1, message: "OK", data: {} });
    }
};

// Enlazamos todas las sub-rutas dinámicas que el APK suele olfatear al arrancar
app.post('/game_request', handleGameTraffic);
app.post('/publicidad', handleGameTraffic);
app.post('/log', handleGameTraffic);
app.post('/', handleGameTraffic);

app.get('/game_request', handleGameTraffic);
app.get('/publicidad', handleGameTraffic);
app.get('/log', handleGameTraffic);
app.get('/', handleGameTraffic);

app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🚀 [Servidor MSM] Combo de Logger + Interceptor Unificado y Activo en Puerto: ${PORT}`);
    setImmediate(cargarTodasLasBasesDeDatos);
});
