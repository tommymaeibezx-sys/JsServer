const express = require('express');
const bodyParser = require('body-parser');
const compression = require('compression');
const fs = require('fs').promises; // Usamos la versión de promesas asíncronas para no bloquear la RAM
const fsSync = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(compression());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Health Check inmediato para Railway (Le da el semáforo verde al contenedor al instante)
app.get('/', (req, res) => res.status(200).send('Servidor MSM Activo | Arranque Seguro Verificado'));

// ==================================================================
// 🔎 1. LOGGER DE CONTROL TOTAL
// ==================================================================
app.use((req, res, next) => {
    try {
        const action = req.body?.action || req.query?.action || req.body?.cmd || req.query?.cmd || "Petición Secundaria/Directa";
        console.log(`\n==================================================================`);
        console.log(`📩 [APK REQ] -> [${new Date().toLocaleTimeString()}] | RUTA: ${req.method} ${req.url} | ACCIÓN: "${action}"`);
        if (req.body && Object.keys(req.body).length > 0) {
            console.log(`   📦 BODY:`, JSON.stringify(req.body, null, 2));
        }
        console.log(`==================================================================`);
    } catch (err) {
        console.log(`⚠️ [Logger Notice]: Petición entrante procesada.`);
    }
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
    return Object.keys(activeUsers).filter(key => key !== ADMIN_USER && key !== 'undefined' && key !== 'null').length;
};

// Daemon de purga por inactividad absoluta
setInterval(() => {
    try {
        const ahora = Date.now();
        for (const key in activeUsers) {
            if (activeUsers[key].is_admin) continue;
            if (ahora - activeUsers[key].last_seen > INACTIVITY_TTL) {
                delete activeUsers[key];
            }
        }
    } catch (e) { console.error("Error en Daemon:", e.message); }
}, 10 * 60 * 1000);

// ===================================================
// 🛠️ INDEXACIÓN ASÍNCRONA ULTRA-SEGURA (ANTI-STOPPING CONTAINER)
// ===================================================
const dataCache = {};
const dataDir = path.join(__dirname, 'data');

const cargarTodasLasBasesDeDatosAsincrono = async () => {
    console.log(`[Arranque] Iniciando lectura asíncrona de archivos JSON...`);
    
    if (!fsSync.existsSync(dataDir)) {
        console.log(`⚠️ [Alerta] Carpeta /data no encontrada en el directorio raíz.`);
        return;
    }

    try {
        const files = await fs.readdir(dataDir);
        
        // Procesamos los archivos uno a uno de forma asíncrona para dejar respirar a la RAM
        for (const file of files) {
            if (file.endsWith('.json')) {
                const actionName = path.basename(file, '.json');
                try {
                    const filePath = path.join(dataDir, file);
                    const content = await fs.readFile(filePath, 'utf8');
                    
                    if (content.trim().length > 0) {
                        dataCache[actionName] = JSON.parse(content);
                        console.log(`   [✓] Cargado con éxito: ${file}`);
                    }
                } catch (err) {
                    // Si un archivo JSON está roto o mal estructurado, se reporta aquí pero NO tumba el servidor
                    console.error(`   [X] Error aislado en archivo ${file}:`, err.message);
                }
            }
        }
        console.log(`[Caché Completa] Proceso de inicialización terminado en segundo plano.\n`);
    } catch (error) {
        console.error("❌ Error general en lectura asíncrona:", error.message);
    }
};

// ===================================================
// CONTROLADOR CENTRAL E INTERCEPTOR ANTI-TRABAS
// ===================================================
const handleGameTraffic = (req, res) => {
    try {
        const action = req.body?.action || req.query?.action || req.body?.cmd || req.query?.cmd;
        const username = req.body?.username ? String(req.body.username).trim() : null;

        if (username && activeUsers[username]) {
            activeUsers[username].last_seen = Date.now();
        }

        // Despacho de catálogos db_
        if (action && dataCache[action]) {
            return res.json(dataCache[action]);
        }
        if (action && action.startsWith('db_')) {
            const fallbackKey = action.replace('db_', '');
            return res.json({ [fallbackKey]: [] });
        }

        // FLUJO PRINCIPAL DE LOGIN (gs_player)
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

            const jugadoresOnline = getOnlineCount();
            if (jugadoresOnline >= MAX_ONLINE_PLAYERS) {
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

            if (isAnonymous || !cuentaKey || cuentaKey === 'undefined' || cuentaKey === 'null') {
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

            return res.json({ player: activeUsers[cuentaKey], temp_session_key: cuentaKey });
        }

        // SWITCH DE PETICIONES SECUNDARIAS NATIVAS
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
                if (req.body?.list || req.url?.includes('list')) {
                    return res.json([]);
                }
                return res.json({ status: "success", code: 1, message: "OK", data: {} });
        }
    } catch (error) {
        console.error("❌ [Error Interno Protegido]:", error.message);
        return res.status(200).json({ status: "success", message: "OK" });
    }
};

// Enlaces de rutas globales
app.post('/game_request', handleGameTraffic);
app.post('/publicidad', handleGameTraffic);
app.post('/log', handleGameTraffic);
app.post('/', handleGameTraffic);
app.get('/game_request', handleGameTraffic);
app.get('/publicidad', handleGameTraffic);
app.get('/log', handleGameTraffic);
app.get('/', handleGameTraffic);

// ===================================================
// ESCUCHA INMEDIATA Y ARRANQUE DIFERIDO
// ===================================================
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 [Servidor MSM] Contenedor levantado con éxito en el puerto: ${PORT}`);
    console.log(`🔄 Enlazando lectura diferida para proteger el inicio de Railway...`);
    
    // Al usar un retardo de tiempo controlado (setTimeout), liberamos el proceso principal de Node.js.
    // Railway verifica que el puerto responde, pone la aplicación en VERDE, y luego el servidor lee los JSON.
    setTimeout(() => {
        cargarTodasLasBasesDeDatosAsincrono();
    }, 1500); 
});
