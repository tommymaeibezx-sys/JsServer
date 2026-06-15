const express = require('express');
const bodyParser = require('body-parser');
const compression = require('compression');
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');

const app = express();

// REGLA DE ORO: Railway necesita usar estrictamente el puerto que te da en process.env.PORT
const PORT = process.env.PORT || 8080; 

app.use(compression());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// ==================================================================
// 🏁 1. HEALTH CHECK INSTANTÁNEO (LE DICE A RAILWAY "ESTOY VIVO")
// ==================================================================
app.get('/', (req, res) => {
    res.status(200).send('OK');
});

// Responde también a la raíz por POST por si Railway hace un ping ciego
app.post('/', (req, res) => {
    res.status(200).json({ status: "alive" });
});

// ==================================================================
// 🔎 2. LOGGER DE CONTROL DE PETICIONES
// ==================================================================
app.use((req, res, next) => {
    try {
        const action = req.body?.action || req.query?.action || req.body?.cmd || req.query?.cmd || "Petición Secundaria";
        console.log(`📩 [APK] -> RUTA: ${req.method} ${req.url} | ACCIÓN: "${action}"`);
    } catch (err) {}
    next();
});

// ==================================================================
// 💾 3. GESTIÓN DE RAM (LÍMITE 30 JUGADORES / 12H INACTIVIDAD)
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

setInterval(() => {
    try {
        const ahora = Date.now();
        for (const key in activeUsers) {
            if (activeUsers[key].is_admin) continue;
            if (ahora - activeUsers[key].last_seen > INACTIVITY_TTL) {
                delete activeUsers[key];
            }
        }
    } catch (e) {}
}, 10 * 60 * 1000);

// ==================================================================
// 📂 4. CARGA ASÍNCRONA DE JSONs
// ==================================================================
const dataCache = {};
const dataDir = path.join(__dirname, 'data');

const cargarTodasLasBasesDeDatosAsincrono = async () => {
    if (!fsSync.existsSync(dataDir)) return;
    try {
        const files = await fs.readdir(dataDir);
        for (const file of files) {
            if (file.endsWith('.json')) {
                const actionName = path.basename(file, '.json');
                try {
                    const content = await fs.readFile(path.join(dataDir, file), 'utf8');
                    if (content.trim().length > 0) {
                        dataCache[actionName] = JSON.parse(content);
                    }
                } catch (err) {}
            }
        }
        console.log(`🚀 [ÉXITO TOTAL] Datos de monstruos listos en memoria RAM.`);
    } catch (error) {
        console.error("❌ Error en lectura:", error.message);
    }
};

// ==================================================================
// 🎮 5. INTERCEPTOR CENTRAL DE TRÁFICO
// ==================================================================
const handleGameTraffic = (req, res) => {
    try {
        const action = req.body?.action || req.query?.action || req.body?.cmd || req.query?.cmd;
        const username = req.body?.username ? String(req.body.username).trim() : null;

        if (username && activeUsers[username]) {
            activeUsers[username].last_seen = Date.now();
        }

        if (action && dataCache[action]) return res.json(dataCache[action]);
        if (action && action.startsWith('db_')) {
            return res.json({ [action.replace('db_', '')]: [] });
        }

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

            activeUsers[cuentaKey] = {
                user_id: Math.floor(100000 + Math.random() * 900000),
                display_name: esRegenerada ? `Regen_${cuentaKey.substring(0, 4)}` : `Monstruo_${cuentaKey.replace('anon_', '')}`,
                coins: 50000, diamonds: 500, level: 1, xp: 0, starpower: 0, relics: 0, keys: 0, is_admin: false, last_seen: Date.now()
            };

            return res.json({ player: activeUsers[cuentaKey], temp_session_key: cuentaKey });
        }

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
                if (req.body?.list || req.url?.includes('list')) return res.json([]);
                return res.json({ status: "success", code: 1, message: "OK", data: {} });
        }
    } catch (error) {
        return res.status(200).json({ status: "success" });
    }
};

app.post('/game_request', handleGameTraffic);
app.post('/publicidad', handleGameTraffic);
app.post('/log', handleGameTraffic);
app.post('/', handleGameTraffic);
app.get('/game_request', handleGameTraffic);
app.get('/publicidad', handleGameTraffic);
app.get('/log', handleGameTraffic);
app.get('/', handleGameTraffic);

// ==================================================================
// 🚀 6. INICIO FORZADO EN PORT-BINDING PARA EVITAR APAGADOS
// ==================================================================
// Escuchar en '0.0.0.0' permite que Railway redirija correctamente el tráfico externo a tu contenedor
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🟢 [PUERTO ABIERTO] Servidor MSM escuchando en el puerto ${PORT}`);
    
    // Disparamos la carga de la base de datos inmediatamente
    cargarTodasLasBasesDeDatosAsincrono();
});

// Evita cierres abruptos por pérdida de streams en la consola de Railway
process.on('uncaughtException', (err) => {
    console.error('⚠️ Excepción atrapada para evitar crash:', err.message);
});
