const express = require('express');
const app = express();

const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

let activePlayers = 0;
const MAX_PLAYERS = 60;

const universalIslands = [
    { "island_id": 1, "i": 1, "unlocked": 1, "u": 1, "castle_level": 10, "c": 10, "bed_capacity": 999999, "b": 999999, "max_beds": 999999 },
    { "island_id": 2, "i": 2, "unlocked": 1, "u": 1, "castle_level": 10, "c": 10, "bed_capacity": 999999, "b": 999999, "max_beds": 999999 },
    { "island_id": 3, "i": 3, "unlocked": 1, "u": 1, "castle_level": 10, "c": 10, "bed_capacity": 999999, "b": 999999, "max_beds": 999999 },
    { "island_id": 4, "i": 4, "unlocked": 1, "u": 1, "castle_level": 10, "c": 10, "bed_capacity": 999999, "b": 999999, "max_beds": 999999 },
    { "island_id": 5, "i": 5, "unlocked": 1, "u": 1, "castle_level": 10, "c": 10, "bed_capacity": 999999, "b": 999999, "max_beds": 999999 },
    { "island_id": 11, "i": 11, "unlocked": 1, "u": 1, "castle_level": 10, "c": 10, "bed_capacity": 999999, "b": 999999, "max_beds": 999999 },
    { "island_id": 12, "i": 12, "unlocked": 1, "u": 1, "castle_level": 10, "c": 10, "bed_capacity": 999999, "b": 999999, "max_beds": 999999 },
    { "island_id": 13, "i": 13, "unlocked": 1, "u": 1, "castle_level": 10, "c": 10, "bed_capacity": 999999, "b": 999999, "max_beds": 999999 },
    { "island_id": 14, "i": 14, "unlocked": 1, "u": 1, "castle_level": 10, "c": 10, "bed_capacity": 999999, "b": 999999, "max_beds": 999999 },
    { "island_id": 15, "i": 15, "unlocked": 1, "u": 1, "castle_level": 10, "c": 10, "bed_capacity": 999999, "b": 999999, "max_beds": 999999 }
];

// ARREGLADO: Lista de IDs integrada correctamente dentro de los corchetes
const baseMonsterIds = [
    1, 2, 3, 4, 5, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19,
    30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 50, 51, 52, 53, 54,
    70, 71, 72, 73, 74, 80, 81, 82, 83, 84,
    90, 91, 92, 93, 94, 95, 96,
    201, 202, 203, 204, 205, 211, 212, 213, 214, 215
];

const universalShop = [];
for (const id of baseMonsterIds) {
    universalShop.push({ "monster_id": id, "m": id, "cost_coins": 0, "c": 0, "cost_diamonds": 0, "d": 0, "time_left": 0, "t": 0, "incubation_time": 0, "type": "common", "cl": "common" });
    if (id < 92 || id >= 201) {
        universalShop.push({ "monster_id": id + 1000, "m": id + 1000, "cost_coins": 0, "c": 0, "cost_diamonds": 0, "d": 0, "time_left": 0, "t": 0, "incubation_time": 0, "type": "rare", "cl": "rare" });
        universalShop.push({ "monster_id": id + 2000, "m": id + 2000, "cost_coins": 0, "c": 0, "cost_diamonds": 0, "d": 0, "time_left": 0, "t": 0, "incubation_time": 0, "type": "epic", "cl": "epic" });
    }
}

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', '*');
    res.setHeader('Access-Control-Allow-Headers', '*');
    if (req.method === 'OPTIONS') return res.status(200).end();
    next();
});

app.head('/', (req, res) => res.status(200).end());

app.get('/', (req, res) => {
    if (String(req.headers['user-agent']).includes('Railway') || !req.headers.host) {
        return res.status(200).send("OK");
    }

    res.setHeader('Content-Type', 'text/xml; charset=utf-8');
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const secureBaseUrl = `${protocol}://${host}`;

    return res.status(200).send(`<?xml version="1.0" encoding="utf-8"?>
<config>
    <game_version>3.0.0</game_version>
    <status>1</status>
    <services>
        <gateway>${secureBaseUrl}/api</gateway>
        <login>${secureBaseUrl}/api</login>
        <shop>${secureBaseUrl}/api</shop>
    </services>
    <legal><age_gate>1</age_gate><terms_accepted>1</terms_accepted><privacy_accepted>1</privacy_accepted></legal>
</config>`.trim());
});

app.all('*', (req, res) => {
    if (req.originalUrl.includes('favicon') || req.originalUrl.includes('well-known')) {
        return res.status(404).end();
    }

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    
    const action = String(req.body.action || req.query.action || req.body.cmd || "").toLowerCase();
    const url = String(req.originalUrl).toLowerCase();

    console.log(`[Petición Solicitada]: URL: ${url} | Action: ${action}`);

    const inputUser = String(req.body.username || req.body.user || req.body.email || "").trim();
    let displayName = "Invitado";
    
    if (inputUser && inputUser !== "") {
        displayName = inputUser.includes('@') ? inputUser.split('@')[0] : inputUser;
    }

    const customPlayerData = {
        "username": displayName, "n": displayName,
        "level": 75, "l": 75,
        "coins": 999999999, "co": 999999999,
        "diamonds": 99999999, "di": 99999999,
        "keys": 99999999, "ke": 99999999,
        "food": 999999999, "fo": 999999999,
        "relics": 99999999, "re": 99999999,
        "starpower": 99999999, "st": 99999999,
        "islands": universalIslands, "islands_data": universalIslands,
        "monsters": [],
        "unlocked_costumes": ["*"], 
        "costumes": [{ "costume_id": "*", "unlocked": 1, "u": 1 }]
    };

    if (action.includes('login') || action.includes('auth') || url.includes('login') || action.includes('start') || req.body.user || req.body.username) {
        if (activePlayers >= MAX_PLAYERS) {
            return res.json({ "status": 1, "success": true, "error": "full" });
        }
        activePlayers++;

        return res.json({
            "status": 1,
            "success": true,
            "session_id": `s_${Date.now()}`, "sid": `s_${Date.now()}`,
            "player_id": Math.floor(1000000 + Math.random() * 9000000), "pid": Math.floor(1000000 + Math.random() * 9000000),
            "player_data": customPlayerData
        });
    }

    if (action.includes('shop') || action.includes('catalog') || url.includes('shop')) {
        return res.json({ "status": 1, "success": true, "monsters": universalShop });
    }

    return res.json({
        "status": 1,
        "success": true,
        "server_version": "3.0.0",
        "session_id": `s_${Date.now()}`,
        "player_id": 7777777,
        "player_data": customPlayerData,
        "monsters": universalShop
    });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor MSM listo en producción sobre puerto ${PORT}.`);
});
