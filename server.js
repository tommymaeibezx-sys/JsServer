const express = require('express');
const bodyParser = require('body-parser');
const compression = require('compression');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(compression());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// ==================================================================
// 🏁 1. HEALTH CHECK INSTANTÁNEO (LÍNEA DE VIDA PARA RAILWAY)
// ==================================================================
app.get('/', (req, res) => res.status(200).send('Servidor MSM Activo | Anti-Crash Habilitado'));
app.post('/', (req, res) => res.status(200).json({ status: "alive" }));

// ==================================================================
// 🔎 2. LOGGER TOTAL EN CONSOLA (MUESTRA TODO EN TIEMPO REAL)
// ==================================================================
app.use((req, res, next) => {
    try {
        const action = req.body?.action || req.query?.action || req.body?.cmd || req.query?.cmd || "Petición Externa/Directa";
        console.log(`\n==================================================================`);
        console.log(`📩 [APK REQ] -> [${new Date().toLocaleTimeString()}] | RUTA: ${req.method} ${req.url}`);
        console.log(`🎬 ACCIÓN DETECTADA: "${action}"`);
        if (req.body && Object.keys(req.body).length > 0) {
            console.log(`📦 DATOS ENVIADOS:`, JSON.stringify(req.body, null, 2));
        }
        console.log(`==================================================================`);
    } catch (err) {}
    next();
});

// ==================================================================
// 💾 3. GESTIÓN DE MEMORIA TEMPORAL (MÁX 30 JUGADORES / PURGA 12H)
// ==================================================================
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
    return Object.keys(activeUsers).filter(key => key !== ADMIN_USER && key !== 'undefined' && key !== 'null').length;
};

// Daemon de limpieza continua cada 10 minutos
setInterval(() => {
    try {
        const ahora = Date.now();
        let purgados = 0;
        for (const key in activeUsers) {
            if (activeUsers[key].is_admin) continue;
            if (ahora - activeUsers[key].last_seen > INACTIVITY_TTL) {
                delete activeUsers[key];
                purgados++;
            }
        }
        if (purgados > 0) console.log(`🧹 [Auto-Purga] Se eliminaron ${purgados} cuentas inactivas de la RAM.`);
    } catch (e) {}
}, 10 * 60 * 1000);

// ==================================================================
// 🎮 4. GESTOR CENTRAL DE TRÁFICO E INTERCEPTOR DE CAPTURAS (db_)
// ==================================================================
const handleGameTraffic = (req, res) => {
    try {
        const action = req.body?.action || req.query?.action || req.body?.cmd || req.query?.cmd;
        const username = req.body?.username ? String(req.body.username).trim() : null;

        // Si la sesión existe en memoria, renovamos su tiempo de vida de inmediato
        if (username && activeUsers[username]) {
            activeUsers[username].last_seen = Date.now();
        }

        // CONTROLADOR DE INICIO DE SESIÓN (gs_player)
        if (action === 'gs_player') {
            const password = req.body?.password || req.query?.password;
            const isAnonymous = req.body?.anonymous || req.query?.anonymous === 'true' || req.query?.anonymous === 1;

            if (username === ADMIN_USER && password === ADMIN_PASS) {
                return res.json({ player: activeUsers[ADMIN_USER] });
            }

            if (username && activeUsers[username]) {
                activeUsers[username].last_seen = Date.now();
                return res.json({ player: activeUsers[username] });
            }

            // Control de aforo para cuidar la RAM
            if (getOnlineCount() >= MAX_ONLINE_PLAYERS) {
                return res.json({
                    player: { user_id: 777777, display_name: "SERVER_LLENO", coins: 0, diamonds: 0, level: 1, last_seen: Date.now() }
                });
            }

            let cuentaKey = username;
            let esRegenerada = true;

            if (isAnonymous || !cuentaKey || cuentaKey === 'undefined' || cuentaKey === 'null') {
                cuentaKey = `anon_${Math.floor(100000 + Math.random() * 900000)}`;
                esRegenerada = false;
            }

            // Estructura de personaje limpia que exige libmonsters.so
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

            return res.json({ player: activeUsers[cuentaKey], temp_session_key: cuentaKey });
        }

        // ==================================================================
        // MAPPING DE TODAS LAS PETICIONES DETECTADAS EN TUS CAPTURAS (db_*)
        // ==================================================================
        switch (action) {
            // Ajustes básicos de carga inicial
            case 'game_settings':
                return res.json({ status: "success", settings: { maintenance: false, client_version_required: "1.0.0", is_available: true } });
            
            // Tablas de batallas e islas vistas en tus capturas de logs
            case 'db_battle_monster':
            case 'db_battle_music':
            case 'db_costumes':
            case 'db_flexeggdefs':
            case 'db_gene':
            case 'db_island':
            case 'db_island_v2':
            case 'db_level':
            case 'db_monster':
            case 'db_store':
            case 'db_store_v2':
            case 'db_structures':
                console.log(`🟢 [Mapeo Captura] Enviando tabla de datos estructurada para: "${action}"`);
                // Devolvemos el contenedor con la clave limpia que espera el motor nativo de C++
                return res.json({ [action.replace('db_', '')]: [] });

            // Servicios y trackers de Big Blue Bubble
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
                // Interceptor genérico de seguridad por si el juego pide bases de datos secundarias adicionales
                if (action && action.startsWith('db_')) {
                    console.log(`🟡 [Interceptor db_] Fallback seguro activado para la base de datos: "${action}"`);
                    return res.json({ [action.replace('db_', '')]: [] });
                }
                if (req.body?.list || req.url?.includes('list')) return res.json([]);
                return res.json({ status: "success", code: 1, message: "OK", data: {} });
        }
    } catch (error) {
        console.error("❌ Error interceptado en el core de red:", error.message);
        return res.status(200).json({ status: "success" });
    }
};

// Rutas globales unificadas para interceptar cualquier endpoint analítico o de juego
app.post('/game_request', handleGameTraffic);
app.post('/publicidad', handleGameTraffic);
app.post('/log', handleGameTraffic);
app.post('/', handleGameTraffic);

app.get('/game_request', handleGameTraffic);
app.get('/publicidad', handleGameTraffic);
app.get('/log', handleGameTraffic);
app.get('/', handleGameTraffic);

// ==================================================================
// 🚀 5. ARRANQUE INSTANTÁNEO EN INTERFAZ GLOBAL
// ==================================================================
app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n==================================================================`);
    console.log(`🚀 [SERVIDOR MSM COMPLETO] Corriendo de forma nativa en el puerto: ${PORT}`);
    console.log(`🛡️  Mapeo de capturas unificado. Cero retrasos de disco duro (I/O).`);
    console.log(`==================================================================\n`);
});

// Captura de excepciones globales para evitar bloqueos del hilo principal de Node
process.on('uncaughtException', (err) => {
    console.error('⚠️ [Prevención de Crash] Excepción controlada:', err.message);
});
