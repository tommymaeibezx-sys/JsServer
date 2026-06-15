const express = require('express');
const bodyParser = require('body-parser');
const compression = require('compression');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(compression());

// ===================================================
// RUTA DE ALTA PRIORIDAD PARA EL HEALTH CHECK (RAILWAY)
// ===================================================
app.get('/', (req, res) => {
    return res.status(200).send('Servidor MSM Activo y Corriendo');
});

// Configuración de procesadores de datos
app.use(bodyParser.json({ limit: '5mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '5mb' }));

// ===================================================
// MIDDLEWARE DE RASTREO EXHAUSTIVO PARA EL APK
// ===================================================
app.use((req, res, next) => {
    console.log(`\n--- [NUEVA PETICIÓN DETECTADA] ---`);
    console.log(`Hora: [${new Date().toLocaleTimeString()}] | Método: ${req.method} | Ruta: ${req.url}`);
    
    const action = req.body.action || req.query.action;
    if (action) console.log(`Acción solicitada: ${action}`);

    if (Object.keys(req.body).length > 0 && action && !action.startsWith('db_')) {
        console.log(`Cuerpo del Body:`, JSON.stringify(req.body, null, 2));
    }
    next();
});

// ===================================================
// CARGA AUTOMÁTICA Y MASIVA DE BASES DE DATOS (JSON)
// ===================================================
const dataCache = {};
const dataDir = path.join(__dirname, 'data');

const cargarTodasLasBasesDeDatos = () => {
    console.log(`[Sistema] Iniciando escaneo de la carpeta: ${dataDir}`);
    
    if (fs.existsSync(dataDir)) {
        const files = fs.readdirSync(dataDir);
        let loadedCount = 0;

        files.forEach(file => {
            // Filtra y procesa únicamente archivos con extensión .json
            if (file.endsWith('.json')) {
                const actionName = path.basename(file, '.json'); // Quita el ".json" para obtener el nombre de la acción
                try {
                    const content = fs.readFileSync(path.join(dataDir, file), 'utf8');
                    dataCache[actionName] = JSON.parse(content);
                    console.log(`   [✓] Cargado con éxito: ${file} -> Clave interna: "${actionName}"`);
                    loadedCount++;
                } catch (err) {
                    console.error(`   [X] Error crítico parseando /data/${file}:`, err.message);
                }
            }
        });
        console.log(`[Caché] Totalizado: ${loadedCount} diccionarios de datos listos en memoria.\n`);
    } else {
        console.log(`[Advertencia] Carpeta /data no detectada en el directorio raíz. Creando una nueva...`);
        fs.mkdirSync(dataDir);
    }
};

// Ejecutar mapeo masivo inicial
cargarTodasLasBasesDeDatos();

// ===================================================
// CONTROLADOR CENTRAL DE PETICIONES DEL JUEGO
// ===================================================
const handleGameTraffic = (req, res) => {
    const action = req.body.action || req.query.action;

    if (!action) {
        return res.json({ status: "alive", message: "En espera de parámetros del APK" });
    }

    // 1. INTERCEPTOR UNIVERSAL (Busca en la caché masiva de archivos JSON)
    // Si la acción es 'db_monsters' y tienes 'db_monsters.json', se envía de inmediato.
    if (dataCache[action]) {
        console.log(`[DB HIT] Despachando JSON real para la acción: ${action}`);
        return res.json(dataCache[action]);
    }

    // 2. FALLBACK PARA BASE DE DATOS NO MAPEADAS AÚN
    // Si el APK te pide un 'db_islands_themes' y no tienes el JSON en GitHub,
    // el servidor responde de manera segura para evitar que el juego se cierre (Crash).
    if (action.startsWith('db_')) {
        console.log(`[DB MISS] No se encontró /data/${action}.json. Creando respuesta defensiva vacía.`);
        const fallbackKey = action.replace('db_', '');
        return res.json({ [fallbackKey]: [] });
    }

    // 3. SECCIÓN DE ACCIONES DE FLUJO DE JUEGO (gs_)
    // Controladores estáticos obligatorios mientras terminas de modular el progreso del jugador
    switch (action) {
        case 'gs_player':
            return res.json({
                player: {
                    user_id: 123456,
                    display_name: "Mod_Educativo_MSM",
                    coins: 9999999, 
                    diamonds: 7500,
                    level: 30,
                    xp: 500000,
                    starpower: 5000,
                    relics: 350,
                    keys: 100
                }
            });

        case 'game_settings':
            return res.json({ status: "success", settings: { maintenance: false, client_version_required: "1.0.0", is_available: true } });

        case 'gs_mailbox_get_messages':
            return res.json({ status: "success", messages: [{ id: 1, title: "Servidor Educativo", body: "Servidor masivo sincronizado con GitHub con éxito." }] });

        case 'gs_recollect_all':
            return res.json({ status: "success", total_coins_collected: 50000, total_diamonds_collected: 5 });

        case 'gs_feed_monster':
            return res.json({ status: "success", level_up: true, new_level: (req.body.current_level || 1) + 1 });

        case 'gs_bake_bread':
            return res.json({ status: "success", user_baking_id: Date.now(), completion_time: Date.now() + 5000 });

        case 'gs_collect_bread':
            return res.json({ status: "success", food_reward: 2500 });

        case 'gs_buy_egg':
            return res.json({ status: "success", user_egg_id: Date.now() });

        case 'gs_hatch_egg':
            return res.json({ status: "success", user_monster_id: Date.now() });

        case 'gs_move_monster':
        case 'gs_buy_structure':
            return res.json({ status: "success" });

        case 'test_types':
            return res.json({ status: "test_ok", types: ["int", "long", "utf-string"] });

        default:
            console.log(`[MOCK] Acción "${action}" emulada de forma genérica.`);
            return res.json({ status: "success", action_emulated: action });
    }
};

// Mapeo de métodos de entrada requeridos por el binario nativo (.so)
app.post('/game_request', handleGameTraffic);
app.post('/', handleGameTraffic);
app.get('/game_request', handleGameTraffic);

app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Servidor] Emulador MSM Activo en el puerto: ${PORT}`);
});
