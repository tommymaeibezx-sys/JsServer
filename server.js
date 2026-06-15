const express = require('express');
const bodyParser = require('body-parser');
const compression = require('compression');
const fs = require('fs');
const path = require('path');

const app = express();

// Dejamos que Railway inyecte su puerto nativo dinámico de forma obligatoria
const PORT = process.env.PORT || 8080;

const IS_PROD = process.env.NODE_ENV === 'production';

app.use(compression());
app.use(bodyParser.json({ limit: '1mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '1mb' }));

// Ruta raíz que Railway usará para validar el Health Check automáticamente
app.get('/', (req, res) => {
    res.status(200).send('Servidor MSM Activo y Corriendo');
});

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
}

app.use((req, res, next) => {
    if (!IS_PROD) {
        console.log(`[${new Date().toLocaleTimeString()}] Petición entrante: ${req.body.action || req.url}`);
    }
    next();
});

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

// Forzamos la escucha en la IP de red local abierta exigida por Railway
app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Servidor] Emulador MSM activo en el puerto ${PORT} (Host: 0.0.0.0)`);
});
