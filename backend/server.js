const express = require("express");
const path = require("path");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

const GEN_RANGES = {
    '1': [1, 151],
    '2': [152, 251],
    '3': [252, 386],
    '4': [387, 493],
    '5': [494, 649],
    '6': [650, 721],
    '7': [722, 809],
    '8': [810, 905],
    '9': [906, 1025]
};

const typeCache = new Map();

async function getPokemonNamesByType(type) {
    if (typeCache.has(type)) {
        return typeCache.get(type);
    }
    const response = await fetch(`https://pokeapi.co/api/v2/type/${type}`, {
        headers: { "User-Agent": "Mozilla/5.0" }
    });
    if (!response.ok) {
        throw new Error(`โหลดข้อมูลธาตุ ${type} ไม่สำเร็จ`);
    }
    const data = await response.json();
    const names = new Set(data.pokemon.map((item) => item.pokemon.name));
    typeCache.set(type, names);
    return names;
}

app.get("/", (req, res) => {
    res.send("Pokémon API Server is running!");
});

app.get("/pokemons", async (req, res) => {
    try {
        const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
        const limit = Math.min(25, Math.max(1, Number.parseInt(req.query.limit, 10) || 25));
        const search = String(req.query.search || "").toLowerCase().trim();
        const type = String(req.query.type || "all").toLowerCase().trim();
        const gen = String(req.query.gen || "all").toLowerCase().trim();
        const stat = String(req.query.stat || "id");
        const order = String(req.query.order || "asc");

        const resAll = await fetch(`https://pokeapi.co/api/v2/pokemon?limit=1025`, {
            headers: { "User-Agent": "Mozilla/5.0" }
        });
        if (!resAll.ok) throw new Error(`API Error: ${resAll.status}`);
        const dataAll = await resAll.json();

        let mainList = dataAll.results.map(p => {
            const idMatch = p.url.match(/\/pokemon\/(\d+)\//);
            const id = idMatch ? parseInt(idMatch[1], 10) : 0;
            return { ...p, id };
        }).filter(p => p.id >= 1 && p.id <= 1025);

        if (search) {
            mainList = mainList.filter(p => p.name.toLowerCase().includes(search));
        }

        if (gen !== "all" && GEN_RANGES[gen]) {
            const [minId, maxId] = GEN_RANGES[gen];
            mainList = mainList.filter(p => p.id >= minId && p.id <= maxId);
        }

        if (type !== "all") {
            const typeNames = await getPokemonNamesByType(type);
            mainList = mainList.filter(p => typeNames.has(p.name));
        }

        const totalCount = mainList.length;
        const start = (page - 1) * limit;
        const targetList = mainList.slice(start, start + limit);

        // ดึงรายละเอียดแบบต่อคิวทีละตัว เพื่อไม่ให้โดน PokéAPI บล็อก 502
        const pagePokemons = [];
        for (const pokemon of targetList) {
            try {
                const resDetail = await fetch(pokemon.url, {
                    headers: { "User-Agent": "Mozilla/5.0" }
                });
                if (resDetail.ok) {
                    const detail = await resDetail.json();
                    
                    // ดึงภาพ Animated Pixel Art
                    const animImage = detail.sprites.versions?.['generation-v']?.['black-white']?.animated?.front_default 
                        || detail.sprites.front_default 
                        || detail.sprites.other?.['official-artwork']?.front_default 
                        || '';

                    pagePokemons.push({
                        id: detail.id,
                        name: detail.name,
                        image: animImage,
                        hp: detail.stats[0].base_stat,
                        attack: detail.stats[1].base_stat,
                        defense: detail.stats[2].base_stat,
                        specialAttack: detail.stats[3].base_stat,
                        specialDefense: detail.stats[4].base_stat,
                        speed: detail.stats[5].base_stat,
                        types: detail.types.map(({ type }) => type.name)
                    });
                }
            } catch (err) {
                console.error(`Error fetching detail for ${pokemon.name}:`, err);
            }
        }

        const sortedPokemons = insertionSort(
            pagePokemons.filter(p => p !== null),
            stat,
            order
        );

        res.json({
            pokemons: sortedPokemons,
            total: totalCount,
            page,
            limit,
            totalPages: Math.ceil(totalCount / limit) || 1
        });

    } catch (error) {
        console.error("Fetch Error:", error);
        res.status(502).json({ error: "โหลดข้อมูลไม่สำเร็จ" });
    }
});

app.get("/moves", async (req, res) => {
    try {
        const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
        const limit = 20;
        const offset = (page - 1) * limit;

        const response = await fetch(`https://pokeapi.co/api/v2/move?limit=${limit}&offset=${offset}`, {
            headers: { "User-Agent": "Mozilla/5.0" }
        });
        if (!response.ok) throw new Error("Fetch moves failed");
        const data = await response.json();

        const moves = await Promise.all(
            data.results.map(async (item) => {
                const resDetail = await fetch(item.url, { headers: { "User-Agent": "Mozilla/5.0" } });
                if (!resDetail.ok) return null;
                const detail = await resDetail.json();
                const flavorText = detail.flavor_text_entries.find(e => e.language.name === "en");

                return {
                    id: detail.id,
                    name: detail.name,
                    type: detail.type.name,
                    power: detail.power || "-",
                    pp: detail.pp || "-",
                    accuracy: detail.accuracy || "-",
                    damageClass: detail.damage_class.name,
                    description: flavorText ? flavorText.flavor_text.replace(/\f|\n/g, " ") : ""
                };
            })
        );

        res.json({
            moves: moves.filter(m => m !== null),
            page,
            totalPages: Math.ceil(data.count / limit)
        });
    } catch (error) {
        res.status(502).json({ error: "โหลดข้อมูลไม่สำเร็จ" });
    }
});

app.get("/abilities", async (req, res) => {
    try {
        const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
        const limit = 20;
        const offset = (page - 1) * limit;

        const response = await fetch(`https://pokeapi.co/api/v2/ability?limit=${limit}&offset=${offset}`, {
            headers: { "User-Agent": "Mozilla/5.0" }
        });
        if (!response.ok) throw new Error("Fetch abilities failed");
        const data = await response.json();

        const abilities = await Promise.all(
            data.results.map(async (item) => {
                const resDetail = await fetch(item.url, { headers: { "User-Agent": "Mozilla/5.0" } });
                if (!resDetail.ok) return null;
                const detail = await resDetail.json();
                const effectText = detail.effect_entries.find(e => e.language.name === "en");

                return {
                    id: detail.id,
                    name: detail.name,
                    description: effectText ? effectText.short_effect.replace(/\f|\n/g, " ") : "No description available"
                };
            })
        );

        res.json({
            abilities: abilities.filter(a => a !== null),
            page,
            totalPages: Math.ceil(data.count / limit)
        });
    } catch (error) {
        res.status(502).json({ error: "โหลดข้อมูลไม่สำเร็จ" });
    }
});

function insertionSort(array, field = "id", order = "asc") {
    const arr = [...array];
    for (let i = 1; i < arr.length; i++) {
        const current = arr[i];
        const currentValue = Number(current[field]) || 0;
        let j = i - 1;

        while (j >= 0) {
            const previousValue = Number(arr[j][field]) || 0;
            let shouldMove = order === "asc" ? previousValue > currentValue : previousValue < currentValue;
            if (!shouldMove) break;
            arr[j + 1] = arr[j];
            j--;
        }
        arr[j + 1] = current;
    }
    return arr;
}

class Stack {
    constructor() { this.items = []; }
    push(item) { this.items.push(item); }
    pop() { return this.items.pop(); }
    peek() { return this.items[this.items.length - 1]; }
    isEmpty() { return this.items.length === 0; }
    clear() { this.items = []; }
    getAll() { return [...this.items]; }
}

const teamStack = new Stack();
const undoStack = new Stack();
const redoStack = new Stack();

function saveHistory() {
    undoStack.push(JSON.parse(JSON.stringify(teamStack.getAll())));
    redoStack.clear();
}

function setTeam(newTeam) {
    teamStack.clear();
    newTeam.forEach(pokemon => teamStack.push(pokemon));
}

app.post("/team/push", (req, res) => {
    if (teamStack.getAll().length >= 6) return res.status(400).json({ error: "ทีมเต็มแล้ว" });
    saveHistory();
    teamStack.push(req.body);
    res.json({ success: true, team: teamStack.getAll() });
});

app.post("/team/remove", (req, res) => {
    const id = Number(req.body.id);
    const currentTeam = teamStack.getAll();
    const index = currentTeam.findIndex(p => Number(p.id) === id);
    if (index !== -1) {
        saveHistory();
        currentTeam.splice(index, 1);
        setTeam(currentTeam);
    }
    res.json({ success: true, team: teamStack.getAll() });
});

app.post("/team/clear", (req, res) => {
    if (!teamStack.isEmpty()) { saveHistory(); teamStack.clear(); }
    res.json({ success: true, team: teamStack.getAll() });
});

app.post("/team/set", (req, res) => {
    saveHistory();
    setTeam(Array.isArray(req.body.team) ? req.body.team.slice(0, 6) : []);
    res.json({ success: true, team: teamStack.getAll() });
});

app.get('/pokedex-detail', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 25;
        const search = (req.query.search || '').toLowerCase();
        const type = req.query.type || 'all';
        const offset = (page - 1) * limit;

        const response = await fetch(`https://pokeapi.co/api/v2/pokemon?limit=151&offset=0`);
        const data = await response.json();

        const pokemonPromises = data.results.map(async (p) => {
            const detailRes = await fetch(p.url);
            const detail = await detailRes.json();
            
            let description = 'ไม่มีข้อมูลคำอธิบาย';
            let habitat = 'unknown';

            try {
                const speciesRes = await fetch(detail.species.url);
                const species = await speciesRes.json();
                if (species.habitat) habitat = species.habitat.name;
                const flavorEntry = species.flavor_text_entries.find(e => e.language.name === 'en');
                if (flavorEntry) description = flavorEntry.flavor_text.replace(/[\f\n\r]/g, ' ');
            } catch(e) {}

            return {
                id: detail.id,
                name: detail.name,
                image: detail.sprites.versions?.['generation-v']?.['black-white']?.animated?.front_default 
                 || detail.sprites.front_default 
                 || detail.sprites.other?.['official-artwork']?.front_default 
                 || '',
                types: detail.types.map(t => t.type.name),
                height: detail.height,
                weight: detail.weight,
                habitat: habitat,
                description: description
            };
        });

        let pokemons = await Promise.all(pokemonPromises);

        if (search) {
            pokemons = pokemons.filter(p => p.name.toLowerCase().includes(search));
        }

        if (type !== 'all') {
            pokemons = pokemons.filter(p => p.types.includes(type));
        }

        const totalItems = pokemons.length;
        const totalPages = Math.ceil(totalItems / limit);
        const paginatedPokemons = pokemons.slice(offset, offset + limit);

        res.json({
            pokemons: paginatedPokemons,
            page,
            totalPages,
            totalItems
        });
    } catch (error) {
        console.error("Error fetching pokedex detail:", error);
        res.status(500).json({ error: "Failed to fetch pokedex details" });
    }
});

app.listen(PORT, () => {
    console.log(`เซิร์ฟเวอร์พร้อมใช้งานที่ http://localhost:${PORT}`);
});