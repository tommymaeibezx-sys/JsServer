const express = require('express');
const bodyParser = require('body-parser');
const compression = require('compression');

const app = express();

// OBLIGATORIO PARA RAILWAY: Capturar el puerto dinámico asignado por la plataforma
const PORT = process.env.PORT || 8080;

app.use(compression());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// ==================================================================
// 🏁 PARCHE RESISTENTE PARA EL HEALTH CHECK DE RAILWAY
// ==================================================================
// Respondemos un "200 OK" plano e inmediato a cualquier variante de ping en la raíz
app.get('/', (req, res) => res.status(200).send('OK'));
app.post('/', (req, res) => res.status(200).send('OK'));

// Logger ultra-simplificado para no saturar los búferes de Railway
app.use((req, res, next) => {
    try {
        const action = req.body?.action || req.query?.action || "Petición Secundaria";
        console.log(`📩 [APK] -> RUTA: ${req.method} ${req.url} | ACCIÓN: "${action}"`);
    } catch (err) {}
    next();
});

// Variables básicas en RAM para My Singing Monsters (Límite 30 jugadores)
const activeUsers = {};
const MAX_ONLINE_PLAYERS = 30;

activeUsers["msmMod"] = {
    user_id: 999999,
    display_name: "Administrador_MSM",
    coins: 99999999,
    diamonds: 50000,
    level: 75,
    is_admin: true,
    last_seen: Infinity
};

// Interceptor y controlador de tráfico centralizado (libmonsters.so)
const handleGameTraffic = (req, res) => {
    try {
        const action = req.body?.action || req.query?.action || req.body?.cmd || req.query?.cmd;
        const username = req.body?.username ? String(req.body.username).trim() : null;

        if (action === 'gs_player') {
            let cuentaKey = username || `anon_${Math.floor(100000 + Math.random() * 900000)}`;
            if (cuentaKey === 'undefined' || cuentaKey === 'null') {
                cuentaKey = `anon_${Math.floor(100000 + Math.random() * 900000)}`;
            }

            activeUsers[cuentaKey] = {
                user_id: Math.floor(100000 + Math.random() * 900000),
                display_name: `Monstruo_${cuentaKey.replace('anon_', '')}`,
                coins: 50000, diamonds: 500, level: 1, xp: 0, starpower: 0, relics: 0, keys: 0, is_admin: false, last_seen: Date.now()
            };
            return res.json({ player: activeUsers[cuentaKey], temp_session_key: cuentaKey });
        }

        switch (action) {
            case 'game_settings':
                return res.json({ status: "success", settings: { maintenance: false, client_version_required: "1.0.0", is_available: true } });
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
                return res.json({ [action.replace('db_', '')]: [] });
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

// Enrutamiento unificado
app.post('/game_request', handleGameTraffic);
app.post('/publicidad', handleGameTraffic);
app.post('/log', handleGameTraffic);
app.get('/game_request', handleGameTraffic);
app.get('/', handleGameTraffic);

// ==================================================================
// 🚀 ARRANQUE DE RED FORZADO EN CUALQUIER INTERFAZ
// ==================================================================
// Escuchar en '::' u '0.0.0.0' le abre las puertas a los pings internos de Railway
app.listen(PORT, '0.0.0.0', () => {
    console.log(`==================================================================`);
    console.log(`🚀 [SERVIDOR MSM COMPLETO] Corriendo en el puerto: ${PORT}`);
    console.log(`🛡️  Health Check listo. Esperando validación de Railway...`);
    console.log(`==================================================================`);
});

process.on('uncaughtException', (err) => {});
