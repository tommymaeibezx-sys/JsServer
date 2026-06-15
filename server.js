const express = require('express');
const fs = require('fs');
const fsPromises = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

const dbCache = {};
const DATA_DIR = path.join(__dirname, 'data');

// ✅ Crear carpeta data si no existe (por si Railway falla al clonar)
if (!fs.existsSync(DATA_DIR)) {
    console.log("📁 Creando carpeta /data...");
    fs.mkdirSync(DATA_DIR);
}

// 💾 sesiones
const activeSessions = {}; 
const MAX_ONLINE_PLAYERS = 30;
const SESSION_TTL = 15 * 60 * 1000; 

// 🔄 cargar JSON
async function cargarBasesDeDatos() {
    console.log("🔄 Cargando bases de datos...");

    const basesDeDatos = [
        'db_battle_monster','db_battle_music','db_costumes',
        'db_flexeggdefs','db_gene','db_island','db_island_v2',
        'db_level','db_monster','db_store','db_store_v2','db_structures'
    ];

    for (const dbName of basesDeDatos) {
        const filePath = path.join(DATA_DIR, `${dbName}.json`);

        try {
            const data = await fsPromises.readFile(filePath, 'utf8');

            try {
                dbCache[dbName] = JSON.parse(data);
                console.log(`✅ ${dbName}.json OK`);
            } catch (e) {
                console.log(`❌ JSON corrupto: ${dbName}`);
                dbCache[dbName] = [];
            }

        } catch {
            console.log(`⚠️ No existe: ${dbName}.json`);
            dbCache[dbName] = [];
        }
    }

    console.log("🟢 Bases de datos listas");
}

// 🏁 healthcheck
app.get('/', (req, res) => res.status(200).send('OK'));

// 🎮 handler
function handleGame(req, res) {
    try {
        const action = req.body?.action || req.query?.action || req.body?.cmd;

        // LOGIN
        if (action === 'gs_player') {
            const now = Date.now();

            for (const id in activeSessions) {
                if (now - activeSessions[id] > SESSION_TTL) delete activeSessions[id];
            }

            if (Object.keys(activeSessions).length >= MAX_ONLINE_PLAYERS) {
                return res.json({
                    player: { user_id: 0, display_name: "SERVER_LLENO" }
                });
            }

            const id = req.body?.device_id || `session_${Math.random()}`;
            activeSessions[id] = now;

            return res.json({
                player: {
                    user_id: 777777,
                    display_name: "Kairox",
                    coins: 999999999,
                    diamonds: 999999,
                    level: 75
                },
                temp_session_key: "Kairox_Session"
            });
        }

        // SETTINGS
        if (action === 'game_settings') {
            return res.json({
                status: "success",
                settings: { maintenance: false, is_available: true }
            });
        }

        // DATABASE
        if (action && action.startsWith('db_')) {
            const data = dbCache[action] || [];
            return res.json({ [action.replace('db_', '')]: data });
        }

        return res.json({ status: "success", message: "OK" });

    } catch (err) {
        console.error("💥 ERROR:", err);
        return res.status(200).json({ status: "success" });
    }
}

// rutas
app.post('/', handleGame);
app.all('/game_request', handleGame);
app.all('/publicidad', handleGame);
app.all('/log', handleGame);

// 🚀 iniciar
app.listen(PORT, '0.0.0.0', async () => {
    console.log(`🟢 Servidor corriendo en puerto ${PORT}`);
    await cargarBasesDeDatos();
});

// 🔥 NO ocultar errores
process.on('uncaughtException', (err) => {
    console.error('💥 uncaughtException:', err);
});

process.on('unhandledRejection', (err) => {
    console.error('💥 unhandledRejection:', err);
});

// 🟢 keep alive
setInterval(() => {
    console.log("🟢 alive");
}, 30000);
