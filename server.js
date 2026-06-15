const express = require('express');
const fs = require('fs').promises;
const path = require('path');

const app = express();

// 🚨 CRUCIAL PARA RENDER: Render asigna el puerto dinámicamente (por defecto el 10000).
// Si no encuentra la variable, usa el 3000 como rueda de auxilio local.
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

const dbCache = {};
const DATA_DIR = path.join(__dirname, 'data');

// 💾 Control de aforo en tiempo real (Máx 30)
const activeSessions = {}; 
const MAX_ONLINE_PLAYERS = 30;
const SESSION_TTL = 15 * 60 * 1000; 

// 🔄 LECTOR ASÍNCRONO PARALELO DE DATOS
async function cargarBasesDeDatos() {
    console.log("\n====================================================");
    console.log("🔄 [RENDER] Cargando repositorios JSON en caché RAM...");
    console.log("====================================================");
    
    const basesDeDatos = [
        'db_battle_monster', 'db_battle_music', 'db_costumes', 
        'db_flexeggdefs', 'db_gene', 'db_island', 'db_island_v2', 
        'db_level', 'db_monster', 'db_store', 'db_store_v2', 'db_structures'
    ];

    try {
        await Promise.all(basesDeDatos.map(async (dbName) => {
            const filePath = path.join(DATA_DIR, `${dbName}.json`);
            try {
                const data = await fs.readFile(filePath, 'utf8');
                dbCache[dbName] = JSON.parse(data);
                console.log(`⚡ [✓] Carga exitosa: ${dbName}.json`);
            } catch (err) {
                dbCache[dbName] = [];
                console.log(`⚠️ [Aviso] -> Creando estructura vacía para: ${dbName}.json`);
            }
        }));
        console.log("====================================================");
        console.log("🟢 [RENDER] Caché lista. Servidor MSM al 100% de potencia.");
        console.log("====================================================\n");
    } catch (error) {
        console.error("❌ Error en indexación de datos:", error.message);
    }
}

// 🏁 PING DE CONTROL PARA EL DASHBOARD DE RENDER
app.get('/', (req, res) => res.status(200).send('Servidor MSM Activo en Render'));
app.post('/', (req, res) => {
    if (!req.body?.action && !req.body?.cmd) return res.status(200).send('OK');
    return handleGame(req, res);
});

// 🎮 INTERCEPTOR DE COMANDOS DEL APK (libmonsters.so)
const handleGame = (req, res) => {
    try {
        const action = req.body?.action || req.query?.action || req.body?.cmd || req.query?.cmd;
        if (action) console.log(`📩 [Petición APK] Comando detectado: "${action}"`);

        // 🔐 LOGIN INTERCEPTADO (Login tradicional o Anónimo -> Todos son Kairox)
        if (action === 'gs_player') {
            const ahora = Date.now();
            
            for (const id in activeSessions) {
                if (ahora - activeSessions[id] > SESSION_TTL) delete activeSessions[id];
            }

            const totalOnline = Object.keys(activeSessions).length;
            if (totalOnline >= MAX_ONLINE_PLAYERS) {
                console.log(`🚫 [Aforo] Servidor lleno: ${totalOnline}/${MAX_ONLINE_PLAYERS}`);
                return res.json({
                    player: { user_id: 0, display_name: "SERVER_FULL_TRY_AGAIN", level: 1, coins: 0, diamonds: 0 }
                });
            }

            const deviceToken = req.body?.device_id || req.body?.mac || `session_${Math.floor(100000 + Math.random() * 900000)}`;
            activeSessions[deviceToken] = ahora;

            console.log(`👤 [Acceso] Dispositivo asignado a la cuenta 'Kairox'. Online: ${Object.keys(activeSessions).length}/${MAX_ONLINE_PLAYERS}`);

            return res.json({
                player: {
                    user_id: 777777,
                    display_name: "Kairox",
                    email: "Kairox",
                    password: "KairoxBlaze",
                    coins: 999999999,
                    diamonds: 500000,
                    level: 75,
                    xp: 9999999,
                    starpower: 100000,
                    relics: 9999,
                    keys: 999,
                    is_admin: true,
                    last_seen: ahora
                },
                temp_session_key: "Kairox_Shared_Active_Session"
            });
        }

        if (action === 'game_settings') {
            return res.json({ status: "success", settings: { maintenance: false, client_version_required: "1.0.0", is_available: true } });
        }

        // 📂 SERVICIO DINÁMICO DE DATOS (db_*)
        if (action && action.startsWith('db_')) {
            const dataFiltrada = dbCache[action] || [];
            if (dataFiltrada && typeof dataFiltrada === 'object' && !Array.isArray(dataFiltrada) && dataFiltrada[action.replace('db_', '')]) {
                return res.json(dataFiltrada);
            }
            return res.json({ [action.replace('db_', '')]: dataFiltrada });
        }

        // Listado completo de métodos nativos para blindar el entorno
        const metodosNativos = [
            'gs_is_registered', 'check_username', 'log_client_error', 'client_log', 'analytics_event',
            'get_eligible_offers', 'get_store_products', 'sync_purchases', 'get_ad_settings', 'ad_config',
            'gs_timed_events', 'gs_get_messages', 'gs_promos', 'gs_update_properties', 'gs_unlock_breeding_structure',
            'gs_collect_daily_reward', 'gs_set_displayname', 'gs_refresh_tribe_requests', 'gs_get_code', 'gs_set_tribename',
            'gs_set_islandname', 'gs_get_friends', 'gs_get_random_tribes', 'gs_get_friend_visit_data', 'gs_visit_specific_friend_island',
            'gs_friend_version_error', 'gs_get_random_visit_data', 'gs_get_tribal_island_data', 'gs_get_ranked_island_data',
            'gs_get_island_rank', 'gs_rate_island', 'gs_rare_monster_data', 'gs_epic_monster_data', 'gs_monster_island_2_island_data',
            'gs_dipster_data', 'gs_store_replacements', 'gs_achievement_unlocked', 'gs_update_achievement_status', 'gs_move_monster',
            'gs_feed_monster', 'gs_mute_monster', 'gs_flip_monster', 'gs_collect_monster', 'gs_sell_monster', 'gs_tribal_feed_monster',
            'gs_breed_monsters', 'gs_finish_breeding', 'gs_speed_up_breeding', 'gs_buy_egg', 'gs_send_monster_home', 'gs_box_add_egg',
            'gs_box_activate_monster', 'gs_box_purchase_fill_cost', 'gs_box_purchase_fill', 'gs_box_add_monster', 'gs_mega_monster_message',
            'gs_sell_egg', 'gs_start_baking', 'gs_finish_baking', 'gs_speed_up_baking', 'gs_collect_from_mine', 'gs_update_monster',
            'gs_multi_update_monster', 'gs_hatch_egg', 'gs_speed_up_hatching', 'gs_buy_island', 'gs_activate_island_theme', 'gs_change_island',
            'gs_buy_structure', 'gs_sell_structure', 'gs_move_structure', 'gs_flip_structure', 'gs_finish_upgrade_structure', 'gs_speed_up_structure',
            'gs_finish_structure', 'gs_start_obstacle', 'gs_clear_obstacle', 'gs_clear_obstacle_speed_up', 'gs_update_structure',
            'gs_process_unclaimed_purchases', 'gs_collect_invite_reward', 'gs_collect_rewards', 'gs_collect_global_ach_rewards',
            'gs_collect_facebook_reward', 'gs_delete_messages', 'gs_display_generic_message', 'gs_place_on_gold_island', 'gs_place_on_tribal',
            'gs_cancel_tribe_request', 'gs_send_tribe_request', 'gs_send_tribe_invite', 'gs_join_tribe', 'gs_leave_tribe_request',
            'gs_kick_tribe_request', 'gs_player_has_scratch_off', 'gs_play_scratch_off', 'gs_collect_scratch_off', 'gs_memory_minigame_current_cost',
            'gs_flip_minigame_cost', 'gs_play_memory_minigame', 'gs_collect_memory_minigame', 'gs_collect_flip_minigame', 'gs_purchase_memory_minigame',
            'gs_purchase_flip_minigame', 'gs_get_memory_game_numbers', 'gs_save_composer_template', 'gs_save_composer_track', 'gs_referral_request',
            'gs_remove_promo', 'gs_remove_promo_v2', 'gs_sticker', 'gs_store_decoration', 'gs_unstore_decoration', 'gs_store_monster',
            'gs_unstore_monster', 'gs_store_buddy', 'gs_unstore_buddy', 'gs_start_fuzing', 'gs_finish_fuzing', 'gs_speed_up_fuzing',
            'gs_update_sold_monsters', 'gs_facebook_help_nursery'
        ];

        if (metodosNativos.includes(action) || action?.startsWith('gs_')) {
            return res.json({ status: "success", registered: true, exists: true, logged: true, code: 1, message: "OK", products: [], offers: [], active_events: [] });
        }

        return res.json(req.body?.list || req.url?.includes('list') ? [] : { status: "success", code: 1, message: "OK" });

    } catch (error) {
        return res.status(200).json({ status: "success" });
    }
};

app.all('/game_request', handleGame);
app.all('/publicidad', handleGame);
app.all('/log', handleGame);

// 🚀 ESCUCHA COMPATIBLE CON EL ENTORNO DE RENDER
app.listen(PORT, '0.0.0.0', () => {
    console.log(`====================================================`);
    console.log(`🟢 [ESTADO] Servidor levantado en Render. Puerto: ${PORT}`);
    console.log(`====================================================`);
    cargarBasesDeDatos();
});

process.on('uncaughtException', () => {});
