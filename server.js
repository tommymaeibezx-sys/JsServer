const express = require('express');
const bodyParser = require('body-parser');
const compression = require('compression');
const fs = require('fs').promises; // Promesas nativas asíncronas
const fsSync = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(compression());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// ==================================================================
// 🏁 1. HEALTH CHECK CRÍTICO (ESTO SALVA EL CONTENEDOR EN RAILWAY)
// ==================================================================
app.get('/', (req, res) => {
    // Responde instantáneamente para que Railway sepa que el proceso está perfectamente vivo
    res.status(200).send('Servidor MSM Activo | Sistema unificado funcionando.');
});

// ==================================================================
// 🔎 2. LOGGER DE CONTROL TOTAL EN CONSOLA
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

// ==================================================================
// 💾 3. CONFIGURACIÓN DE AJUSTES Y VARIABLES DE RAM (1GB MAX)
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

// Daemon automático de purga por inactividad absoluta
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

// ==================================================================
// 📂 4. INDEXACIÓN ASÍNCRONA PARALELA (EVITA EL TIMEOUT DE ARRANQUE)
// ==================================================================
const dataCache = {};
const dataDir = path.join(__dirname, 'data');

const cargarTodasLasBasesDeDatosAsincrono = async () => {
    console.log(`[Arranque] Iniciando lectura diferida de archivos JSON...`);
    
    if (!fsSync.existsSync(dataDir)) {
        console.log(`⚠️ [Alerta] Carpeta /data no detectada en la raíz del proyecto.`);
        return;
    }

    try {
        const files = await fs.readdir(dataDir);
        
        // Carga secuencial asíncrona para no congelar la CPU de tu plan de 1GB
        for (const file of files) {
            if (file.endsWith('.json')) {
                const actionName = path.basename(file, '.json');
                try {
                    const filePath = path.join(dataDir, file);
                    const content = await fs.readFile(filePath, 'utf8');
                    
                    if (content.trim().length > 0) {
                        dataCache[actionName] = JSON.parse(content);
                        console.log(`   [✓ JSON OK] Indexado: ${file}`);
                    }
                } catch (err) {
                    console.error(`   [X JSON ERROR] Falló la estructura en ${file}:`, err.message);
                }
            }
        }
        console.log(`🚀 [ÉXITO TOTAL] Datos de monstruos e islas cargados. Servidor listo para recibir tráfico del APK.\n`);
    } catch (error) {
        console.error("❌ Error crítico en lectura asíncrona:", error.message);
    }
};

// ==================================================================
// 🎮 5. INTERCEPTOR CENTRAL Y CONTROL DE TRÁFICO LIBMONSTERS
// ==================================================================
const handleGameTraffic = (req, res) => {
    try {
        const action = req.body?.action || req.query?.action || req.body?.cmd || req.query?.cmd;
        const username = req.body?.username ? String(req.body.username).trim() : null;

        if (username && activeUsers[username]) {
            activeUsers[username].last_seen = Date.now();
        }

        // Despacho prioritario de catálogos db_ desde la memoria ram cacheada
        if (action && dataCache[action]) {
            return res.json(dataCache[action]);
        }
        if (action && action.startsWith('db_')) {
            const fallbackKey = action.replace('db_', '');
            return res.json({ [fallbackKey]: [] });
        }

        // FLUJO DE CONTROL DE INICIO DE SESIÓN (gs_player)
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

            // Verificación del cupo de aforo diario (Límite 30)
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

            // Inicialización de la cuenta limpia (Estructura requerida en libmonsters.so)
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

        // CONTROLADOR DE PETICIONES SECUNDARIAS NATIVAS DE C++ (Anuncios/Logs/Tienda)
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
                // Interceptor universal de seguridad para prevenir congelamientos de pantalla
                if (req.body?.list || req.url?.includes('list')) {
                    return res.json([]);
                }
                return res.json({ status: "success", code: 1, message: "OK", data: {} });
        }
    } catch (error) {
        console.error("❌ [Error Interno Atrapado]:", error.message);
        return res.status(200).json({ status: "success", message: "OK" });
    }
};

// Enlaces universales a las sub-rutas de red analíticas y de juego
app.post('/game_request', handleGameTraffic);
app.post('/publicidad', handleGameTraffic);
app.post('/log', handleGameTraffic);
app.post('/', handleGameTraffic);
app.get('/game_request', handleGameTraffic);
app.get('/publicidad', handleGameTraffic);
app.get('/log', handleGameTraffic);
app.get('/', handleGameTraffic);

// ==================================================================
// 🚀 6. INICIO DE PUERTO INMEDIATO (BYPASS HEALTH CHECK)
// ==================================================================
app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n==================================================================`);
    console.log(`🚀 [CONEXIÓN] Servidor vinculado exitosamente al puerto de red: ${PORT}`);
    console.log(`🟢 [ESTADO] Puerto abierto. Railway recibirá luz verde de inmediato.`);
    console.log(`==================================================================\n`);
    
    // Al usar setImmediate, dejamos que Express termine de responder el ping a Railway primero.
    // Una vez que el contenedor está seguro y activo, se disparará la carga asíncrona de los archivos de juego.
    setImmediate(() => {
        cargarTodasLasBasesDeDatosAsincrono();
    });
});
