const express = require('express');
const bodyParser = require('body-parser');
const compression = require('compression');
const fs = require('fs');
const path = require('path');

const app = express();
// Forzamos el uso del puerto 3000 si Railway pasa un valor inválido o 0
const PORT = process.env.PORT && process.env.PORT !== '0' ? process.env.PORT : 3000;

// Omitir logs pesados en producción para mejorar la velocidad
const IS_PROD = process.env.NODE_ENV === 'production';

// Habilitar compresión Gzip para transferir datos más rápido al APK
app.use(compression());

// Configuración de Body Parser
app.use(bodyParser.json({ limit: '1mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '1mb' }));

// Ruta de control de salud para evitar el error 'Stopping Container'
app.get('/', (req, res) => {
    res.status(200).send('Servidor MSM Activo y Corriendo');
});

// Sistema de caché en memoria RAM para la carpeta /data
const dataCache = {};
const dataDir = path.join(__dirname, 'data');

console.log(`[Sistema] Buscando archivos de configuración en: ${dataDir}`);

if (fs.existsSync(dataDir)) {
    const files = fs.readdirSync(dataDir);
    let loadedCount = 0;

    files.forEach(file => {
        if (file.endsWith('.json')) {
            const actionName = path.basename(file, '.json');
            try {
                const content = fs.readFileSync(path.join(dataDir, file), 'utf8');
                dataCache[actionName] = JSON.parse(content);
                loadedCount++;
            } catch (err) {
                console.error(`[Error] No se pudo parsear el archivo /data/${file}:`, err.message);
            }
        }
    });
    console.log(`[Caché] Se cargaron con éxito ${loadedCount} archivos JSON desde /data.`);
} else {
    console.warn(`[Alerta Crítica] La carpeta '/data' no fue encontrada en la raíz del proyecto.`);
}

// Logger ligero para las peticiones
app.use((req, res, next) => {
    if (!IS_PROD) {
        console.log(`[${new Date().toLocaleTimeString()}] Petición entrante: ${req.body.action || req.url}`);
    }
    next();
});

// Ruta unificada para las peticiones del juego
app.post('/game_request', (req, res) => {
    const { action } = req.body;

    if (!action) {
        return res.status(400).json({ error: "Falta el parámetro 'action'" });
    }

    if (action.startsWith('db_')) {
        if (dataCache[action]) {
            return res.json(dataCache[action]);
        }
        const fallbackKey = action.replace('db_', '');
        return res.json({ [fallbackKey]: [] });
    }

    switch (action) {
        case 'gs_player':
            return res.json({
                player: {
                    user_id: 123456,
                    display_name: "Jugador_Anonimo",
                    coins: 9999999, 
                    diamonds: 5000,
                    level: 30,
                    xp: 500000
                }
            });

        case 'gs_quest':
            return res.json({ active_quests: [] });

        case 'gs_timed_events':
        case 'gs_rare_monster_data':
        case 'gs_epic_monster_data':
        case 'gs_cant_breed':
        case 'gs_flip_boards':
        case 'gs_flip_levels':
        case 'gs_monster_island_2_island_data':
            return res.json({ data: [], active: false });

        case 'gs_buy_egg':
            return res.json({ status: "success", user_egg_id: Date.now() });

        case 'gs_hatch_egg':
            return res.json({ status: "success", user_monster_id: Date.now() });

        case 'gs_sell_egg':
        case 'gs_sell_monster':
        case 'gs_sell_structure':
            return res.json({ status: "success", reward_coins: 1000 });

        case 'gs_rename_monster':
            return res.json({ status: "success", name: req.body.name || "Monstruo" });

        case 'gs_move_monster':
        case 'gs_buy_structure':
            return res.json({ status: "success" });

        case 'gs_get_code':
            return res.json({ status: "success", code: req.body.code || "R:GENERIC" });

        case 'test_types':
            return res.json({ status: "test_ok", types: ["int", "long", "utf-string"] });

        default:
            return res.json({ status: "success", action_emulated: action });
    }
});

// Inicialización del servidor con la IP de red abierta 0.0.0.0
app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Servidor] Emulador MSM activo en el puerto ${PORT} (Host: 0.0.0.0)`);
});
 
