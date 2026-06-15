const express = require('express');
const bodyParser = require('body-parser');

const app = express();
// Dejamos que Railway elija el puerto solo, sin forzar el 8080 en texto si no existe
const PORT = process.env.PORT || 3000; 

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ==================================================================
// 🏁 EL "SALVAVIDAS": RESPUESTA INMEDIATA PARA EL HEALTH CHECK
// ==================================================================
app.get('/', (req, res) => {
    res.status(200).send('OK');
});

app.post('/', (req, res) => {
    res.status(200).send('OK');
});

// ==================================================================
// 🎮 CONTROLADOR PARA EL APK (LIBMONSTERS.SO)
// ==================================================================
const handleGameTraffic = (req, res) => {
    try {
        const action = req.body?.action || req.query?.action || req.body?.cmd || req.query?.cmd;
        
        // Imprime en la consola de Railway qué está pidiendo el APK al tocar jugar
        if (action) {
            console.log(`🕹️ [APK] Acción ejecutada: "${action}"`);
        }

        // Si pide iniciar sesión
        if (action === 'gs_player') {
            return res.json({
                player: {
                    user_id: 123456,
                    display_name: "Jugador_MSM",
                    coins: 999999,
                    diamonds: 999,
                    level: 1,
                    last_seen: Date.now()
                }
            });
        }

        // Si pide configuraciones o anuncios (Evita el cartel de "Problema de Conexión")
        if (action === 'game_settings') {
            return res.json({ status: "success", settings: { maintenance: false, is_available: true } });
        }

        // Bloque interceptor automático para todas las bases de datos (db_monster, db_island, etc.)
        if (action && action.startsWith('db_')) {
            const claveLimpia = action.replace('db_', '');
            return res.json({ [claveLimpia]: [] });
        }

        // Fallback universal para peticiones secundarias de analíticas/logs
        return res.json({ status: "success", code: 1, message: "OK" });

    } catch (error) {
        return res.status(200).json({ status: "success" });
    }
};

// Vinculamos las rutas comunes del APK
app.post('/game_request', handleGameTraffic);
app.get('/game_request', handleGameTraffic);

// ==================================================================
// 🚀 ESCUCHA DE PUERTO DIRECTA (ESTILO STANDARD NODE.JS)
// ==================================================================
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en el puerto ${PORT}`);
});
