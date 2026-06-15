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
app.use(bodyParser.json({ limit: '2mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '2mb' }));

// ===================================================
// MIDDLEWARE DE RASTREO EXHAUSTIVO PARA EL APK
// ===================================================
app.use((req, res, next) => {
    console.log(`\n--- [NUEVA PETICIÓN DETECTADA] ---`);
    console.log(`Hora: [${new Date().toLocaleTimeString()}] | Método: ${req.method} | Ruta: ${req.url}`);
    
    if (Object.keys(req.query).length > 0) {
        console.log(`Query Params:`, JSON.stringify(req.query, null, 2));
    }
    
    if (Object.keys(req.body).length > 0) {
        console.log(`Body Data:`, JSON.stringify(req.body, null, 2));
    } else if (req.method === 'POST') {
        console.log(`[Aviso] Petición POST recibida pero el cuerpo está vacío.`);
    }
    console.log(`-----------------------------------\n`);
    next();
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
}

// ===================================================
// CONTROLADOR CENTRAL DE PETICIONES DEL JUEGO
// ===================================================
const handleGameTraffic = (req, res) => {
    const action = req.body.action || req.query.action;

    if (!action) {
        return res.json({ status: "alive", message: "En espera de parámetros válidos del APK" });
    }

    console.log(`[Procesando] Ejecutando respuesta para la acción: ${action}`);

    // Interceptor dinámico por archivos en /data/
    if (dataCache[action]) {
        return res.json(dataCache[action]);
    }

    if (action.startsWith('db_')) {
        const fallbackKey = action.replace('db_', '');
        return res.json({ [fallbackKey]: [] });
    }

    switch (action) {
        // ==========================================
        // CONFIGURACIÓN CENTRAL Y JUGADOR
        // ==========================================
        case 'gs_player':
            return res.json({
                player: {
                    user_id: 123456,
                    display_name: "Jugador_Educativo",
                    coins: 9999999, 
                    diamonds: 5000,
                    level: 30,
                    xp: 500000,
                    starpower: 1000,
                    relics: 500,
                    keys: 50
                }
            });

        case 'game_settings':
            return res.json({ status: "success", settings: { maintenance: false, client_version_required: "4.0.0", is_available: true } });

        // ==========================================
        // NUEVAS ACCIONES NUEVA TANDA (BUZÓN, EVENTOS, TIENDA PREMIUM)
        // ==========================================
        case 'gs_mailbox_get_messages':
            // Carga los mensajes del sistema, regalos pendientes o avisos de la comunidad
            return res.json({ status: "success", messages: [] });

        case 'gs_mailbox_read_message':
            return res.json({ status: "success", message_id: req.body.message_id || 0, read: true });

        case 'gs_mailbox_delete_message':
            return res.json({ status: "success", deleted_id: req.body.message_id || 0 });

        case 'gs_mailbox_claim_attachment':
            // Reclama premios (monedas, diamantes) adjuntos a correos administradores
            return res.json({ status: "success", claimed: true, rewards: {} });

        case 'gs_buy_storage_shed':
            // Compra del cobertizo de almacenamiento para guardar decoraciones/monstruos fuera de la isla
            return res.json({ status: "success", user_structure_id: Date.now(), storage_capacity: 20 });

        case 'gs_upgrade_storage_shed':
            return res.json({ status: "success", new_capacity: (req.body.current_capacity || 20) + 10 });

        case 'gs_spin_wheel':
            // Minijuego del castillo: La ruleta de la fortuna
            return res.json({ status: "success", slice_index: 3, reward: { type: "relics", amount: 3 } });

        case 'gs_island_pass_claim_all':
            // Reclama de golpe todos los niveles desbloqueados del pase de temporada
            return res.json({ status: "success", claimed_tiers: [], rewards_delivered: true });

        case 'gs_change_avatar':
            // Cambiar la imagen de perfil que ven otros jugadores en la clasificación social
            return res.json({ status: "success", current_avatar_id: req.body.avatar_id || 1 });

        case 'gs_unlock_avatar':
            return res.json({ status: "success", unlocked_avatar_id: req.body.avatar_id || 0 });

        case 'gs_get_unlocked_avatars':
            return res.json({ status: "success", unlocked_ids: [1, 2, 3] });

        case 'gs_link_account':
            // Vinculación de cuentas (ej. pasar de cuenta de invitado a correo/redes)
            return res.json({ status: "success", linked: true, provider: req.body.provider || "email" });

        case 'gs_contact_support':
            // Simulación del envío de un ticket de soporte técnico interno
            return res.json({ status: "success", ticket_id: "MSM-EDU-999" });

        // ==========================================
        // ACCIONES DE TANDAS ANTERIORES (INVENTARIO, DISFRACES, CAJAS)
        // ==========================================
        case 'gs_box_monster':
            return res.json({ status: "success", box_monster_id: req.body.user_monster_id || 0, filled: true });

        case 'gs_evolve_monster':
            return res.json({ status: "success", user_monster_id: Date.now(), evolved: true });

        case 'gs_crucible_upgrade_evolve':
            return res.json({ status: "success", crucible_level: 2 });

        case 'gs_costume_store_data':
            return res.json({ status: "success", costumes: [] });

        case 'gs_buy_costume':
            return res.json({ status: "success", costume_id: req.body.costume_id || 0 });

        case 'gs_equip_costume':
            return res.json({ status: "success", user_monster_id: req.body.user_monster_id || 0, costume_id: req.body.costume_id || 0 });

        case 'gs_composer_save_track':
            return res.json({ status: "success", track_id: Date.now() });

        case 'gs_composer_get_tracks':
            return res.json({ status: "success", tracks: [] });

        case 'gs_fuzer_data':
            return res.json({ status: "success", fuzer_active: false, results: [] });

        case 'gs_attune_monster':
            return res.json({ status: "success", attuned: true });

        case 'gs_feed_monster':
            return res.json({ status: "success", level_up: true, new_level: (req.body.current_level || 1) + 1 });

        case 'gs_recollect_all':
            return res.json({ status: "success", total_coins_collected: 50000, total_diamonds_collected: 2 });

        case 'gs_bake_bread':
            return res.json({ status: "success", user_baking_id: Date.now(), completion_time: Date.now() + 60000 });

        case 'gs_collect_bread':
            return res.json({ status: "success", food_reward: 5000 });

        case 'gs_coliseum_data':
            return res.json({ status: "success", coliseum_level: 1, dynamic_events: [], unlocked: true });

        case 'gs_synthesizer_data':
            return res.json({ status: "success", synthesizer_level: 1, active_synthesis: null });

        case 'gs_scratch_card':
            return res.json({ status: "success", won_prize: "egg_generic" });

        case 'gs_island_pass_data':
            return res.json({ status: "success", pass_active: false });

        // ==========================================
        // ENTRADA DE RELEVOS Y CAÍDAS POR DEFECTO
        // ==========================================
        case 'gs_monster_island_2_island_data':
        case 'gs_dipster_data':
        case 'gs_timed_events':
        case 'gs_buy_egg':
        case 'gs_hatch_egg':
        case 'gs_sell_monster':
        case 'gs_rename_monster':
        case 'gs_move_monster':
        case 'gs_buy_structure':
        case 'gs_get_friends':
        case 'gs_quest':
            return res.json({ status: "success", action_fallback: action });

        case 'test_types':
            return res.json({ status: "test_ok", types: ["int", "long", "utf-string"] });

        default:
            console.log(`[Advertencia] Acción emulada por defecto: ${action}`);
            return res.json({ status: "success", action_emulated: action });
    }
};

// Rutas de escucha HTTP POST
app.post('/game_request', handleGameTraffic);
app.post('/', handleGameTraffic);

app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Servidor] Emulador MSM activo en el puerto ${PORT}`);
});
