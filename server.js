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

// Health Check para monitoreo de Railway
app.get('/', (req, res) => res.status(200).send('Servidor MSM Activo | Regeneración Automática Lista'));

// ===================================================
// CONFIGURACIÓN DE AJUSTES Y VARIABLES DE RAM
// ===================================================
const activeUsers = {}; 
const MAX_ONLINE_PLAYERS = 30; // Límite estricto de aforo

// Umbral de inactividad máxima (Ejemplo: 12 horas)
const MAX_INACTIVITY_HOURS = 12; 
const INACTIVITY_TTL = MAX_INACTIVITY_HOURS * 60 * 60 * 1000; 

// Credenciales del Administrador VIP
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

// Helper para calcular cuántas cuentas no administrativas ocupan espacio en RAM
const getOnlineCount = () => {
    return Object.keys(activeUsers).filter(key => key !== ADMIN_USER).length;
};

// ===================================================
// DAEMON DE PURGA AUTOMÁTICA POR INACTIVIDAD
// ===================================================
setInterval(() => {
    const ahora = Date.now();
    let eliminados = 0;

    for (const key in activeUsers) {
        if (activeUsers[key].is_admin) continue;

        // Si superó el tiempo límite de inactividad, se remueve de la RAM
        if (ahora - activeUsers[key].last_seen > INACTIVITY_TTL) {
            delete activeUsers[key];
            eliminados++;
        }
    }
    
    if (eliminados > 0) {
        console.log(`🧹 [Auto-Purga] Se liberaron ${eliminados} cuentas inactivas. Cupos disponibles: ${MAX_ONLINE_PLAYERS - getOnlineCount()}`);
    }
}, 10 * 60 * 1000); // Inspección cada 10 minutos

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
    } catch (e) { console.error("Error cargando archivos JSON:", e.message); }
};

// ===================================================
// CONTROLADOR CENTRAL DE PETICIONES
// ===================================================
const handleGameTraffic = (req, res) => {
    const action = req.body.action || req.query.action;
    const username = req.body.username || req.query.username;

    if (!action) return res.json({ status: "alive" });

    // Actualizar pulso de actividad si la sesión sigue viva en RAM
    if (username && activeUsers[username]) {
        activeUsers[username].last_seen = Date.now();
    }

    // Despacho de catálogos db_
    if (dataCache[action]) return res.json(dataCache[action]);
    if (action.startsWith('db_')) {
        const fallbackKey = action.replace('db_', '');
        return res.json({ [fallbackKey]: [] });
    }

    // FLUJO DE CONTROL DE JUGADORES (gs_player)
    if (action === 'gs_player') {
        const password = req.body.password || req.query.password;
        const isAnonymous = req.body.anonymous || req.query.anonymous === 'true';

        // 1. Validar cuenta fija del Administrador
        if (username === ADMIN_USER && password === ADMIN_PASS) {
            console.log(`👑 [VIP LOGIN] Administrador conectado.`);
            return res.json({ player: activeUsers[ADMIN_USER] });
        }

        // 2. Jugador existente y activo en RAM -> Entra directo
        if (username && activeUsers[username]) {
            activeUsers[username].last_seen = Date.now();
            console.log(`🔄 [RECONEXIÓN] Retorna el usuario: "${username}".`);
            return res.json({ player: activeUsers[username] });
        }

        // 3. CONTROL DE REGENERACIÓN O REGISTRO NUEVO
        // Si el usuario envió un nombre de cuenta pero NO existe en la RAM (porque se borró o es nuevo)
        // O si está iniciando una sesión anónima desde cero:
        const jugadoresOnline = getOnlineCount();
        if (jugadoresOnline >= MAX_ONLINE_PLAYERS) {
            console.log(`⚠️ [BLOQUEO] Servidor lleno (${jugadoresOnline}/${MAX_ONLINE_PLAYERS}). Intento rechazado.`);
            return res.json({ 
                status: "error", 
                message: `SERVIDOR SATURADO. Capacidad máxima alcanzada (30/30). Vuelve a intentarlo más tarde.` 
            });
        }

        // Determinar qué identificador usar para la cuenta
        let cuentaKey = username;
        let esRegenerada = true;

        if (isAnonymous || !cuentaKey) {
            const tempId = Math.floor(100000 + Math.random() * 900000);
            cuentaKey = `anon_${tempId}`;
            esRegenerada = false;
        }

        // Crear la cuenta nueva o regenerada en blanco en este preciso segundo
        activeUsers[cuentaKey] = {
            user_id: Math.floor(100000 + Math.random() * 900000),
            display_name: esRegenerada ? `Regen_${cuentaKey.substring(0, 5)}` : `Monstruo_${cuentaKey.replace('anon_', '')}`,
            coins: 10000,
            diamonds: 100,
            level: 1,
            is_admin: false,
            last_seen: Date.now()
        };

        if (esRegenerada) {
            console.log(`♻️ [REGENERACIÓN] La cuenta "${cuentaKey}" fue purgada anteriormente. Creando un perfil limpio nuevo.`);
        } else {
            console.log(`🆕 [RAM ASIGNADA] Nueva sesión anónima registrada: "${cuentaKey}".`);
        }

        console.log(`📈 Estado de aforo actual: ${getOnlineCount()}/${MAX_ONLINE_PLAYERS} jugadores.`);
        return res.json({ player: activeUsers[cuentaKey], temp_session_key: cuentaKey });
    }

    // Configuración general por defecto
    switch (action) {
        case 'game_settings':
            return res.json({ status: "success", settings: { maintenance: false, client_version_required: "1.0.0", is_available: true } });
        default:
            return res.json({ status: "success", action_emulated: action });
    }
};

app.post('/game_request', handleGameTraffic);
app.post('/', handleGameTraffic);
app.get('/game_request', handleGameTraffic);

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 [Servidor MSM] Sistema de regeneración cíclica online en el puerto ${PORT}.`);
    console.log(`🛡️ Regla activa: Cuentas inactivas por más de ${MAX_INACTIVITY_HOURS} horas se limpian. Al regresar, se les otorga una nueva automáticamente.`);
    setImmediate(cargarTodasLasBasesDeDatos);
});
