const express = require("express");
const path = require("path");
const app = express();
const PORT = process.env.PORT || 3000;

const allowedOrigins = new Set(
    (process.env.FRONTEND_URL || "")
        .split(",")
        .map(origin => origin.trim())
        .filter(Boolean)
);

app.use((req, res, next) => {
    const origin = req.get("Origin");
    if (origin && allowedOrigins.has(origin)) {
        res.setHeader("Access-Control-Allow-Origin", origin);
        res.setHeader("Vary", "Origin");
        if (req.method === "OPTIONS") {
            res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
            res.setHeader(
                "Access-Control-Allow-Headers",
                req.get("Access-Control-Request-Headers") || "Content-Type"
            );
            return res.sendStatus(204);
        }
    } else if (req.method === "OPTIONS") {
        return res.status(403).json({ error: "Origin is not allowed" });
    }
    next();
});

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
const pokemonOptionsCache = { value: null };
const pokemonRecommendationsCache = new Map();
const itemListCache = { value: null };
const pokemonSearchIndexCache = { value: null, promise: null };

async function getPokemonSearchIndex() {
    if (pokemonSearchIndexCache.value) {
        return pokemonSearchIndexCache.value;
    }

    if (!pokemonSearchIndexCache.promise) {
        pokemonSearchIndexCache.promise = (async () => {
            const response = await fetch("https://pokeapi.co/api/v2/pokemon?limit=1025", {
                headers: { "User-Agent": "Mozilla/5.0" }
            });
            if (!response.ok) throw new Error(`API Error: ${response.status}`);
            const data = await response.json();
            const pokemons = data.results.map(pokemon => {
                const idMatch = pokemon.url.match(/\/pokemon\/(\d+)\//);
                return { ...pokemon, id: idMatch ? parseInt(idMatch[1], 10) : 0 };
            }).filter(pokemon => pokemon.id >= 1 && pokemon.id <= 1025);
            const bySubstring = new Map();

            for (const pokemon of pokemons) {
                const substrings = new Set();
                for (let start = 0; start < pokemon.name.length; start++) {
                    for (let end = start + 1; end <= pokemon.name.length; end++) {
                        substrings.add(pokemon.name.slice(start, end));
                    }
                }
                for (const substring of substrings) {
                    const matches = bySubstring.get(substring);
                    if (matches) {
                        matches.push(pokemon);
                    } else {
                        bySubstring.set(substring, [pokemon]);
                    }
                }
            }

            pokemonSearchIndexCache.value = { pokemons, bySubstring };
            return pokemonSearchIndexCache.value;
        })().catch(error => {
            pokemonSearchIndexCache.promise = null;
            throw error;
        });
    }

    return pokemonSearchIndexCache.promise;
}

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

        const { pokemons, bySubstring } = await getPokemonSearchIndex();
        let mainList = search ? bySubstring.get(search) || [] : pokemons;

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

app.get("/pokemon-options", async (req, res) => {
    try {
        if (!pokemonOptionsCache.value) {
            const response = await fetch("https://pokeapi.co/api/v2/pokemon?limit=1025", {
                headers: { "User-Agent": "Mozilla/5.0" }
            });
            if (!response.ok) throw new Error(`Fetch Pokémon list failed: ${response.status}`);

            const data = await response.json();
            pokemonOptionsCache.value = data.results.map(pokemon => {
                const idMatch = pokemon.url.match(/\/pokemon\/(\d+)\/?$/);
                return { id: idMatch ? Number(idMatch[1]) : 0, name: pokemon.name };
            });
        }
        res.json({ pokemons: pokemonOptionsCache.value });
    } catch (error) {
        console.error("Fetch Pokémon options error:", error);
        res.status(502).json({ error: "โหลดรายชื่อ Pokémon ไม่สำเร็จ" });
    }
});

app.get("/pokemon-recommendations/:name", async (req, res) => {
    const name = String(req.params.name || "").toLowerCase().trim();
    if (!/^[a-z0-9-]+$/.test(name)) {
        return res.status(400).json({ error: "ชื่อ Pokémon ไม่ถูกต้อง" });
    }

    try {
        if (pokemonRecommendationsCache.has(name)) {
            return res.json(pokemonRecommendationsCache.get(name));
        }

        const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${encodeURIComponent(name)}`, {
            headers: { "User-Agent": "Mozilla/5.0" }
        });
        if (response.status === 404) return res.status(404).json({ error: "ไม่พบ Pokémon ที่เลือก" });
        if (!response.ok) throw new Error(`Fetch Pokémon failed: ${response.status}`);

        const pokemon = await response.json();
        const types = pokemon.types.map(({ type }) => type.name);
        const attack = pokemon.stats.find(({ stat }) => stat.name === "attack")?.base_stat || 0;
        const specialAttack = pokemon.stats.find(({ stat }) => stat.name === "special-attack")?.base_stat || 0;
        const preference = attack >= specialAttack ? "physical" : "special";
        const candidates = pokemon.moves
            .map(({ move, version_group_details }) => {
                const details = version_group_details || [];
                const isScarletViolet = details.some(({ version_group }) => version_group.name === "scarlet-violet");
                const latestDetail = details[details.length - 1];
                const method = latestDetail?.move_learn_method?.name || "";
                const methodPriority = method === "level-up" ? 0 : method === "machine" ? 1 : method === "tutor" ? 2 : 3;
                return { name: move.name, isScarletViolet, methodPriority };
            })
            .filter(candidate => candidate.methodPriority < 3)
            .sort((a, b) => {
                if (a.isScarletViolet !== b.isScarletViolet) return a.isScarletViolet ? -1 : 1;
                return a.methodPriority - b.methodPriority;
            });
        const candidatePool = candidates.some(candidate => candidate.isScarletViolet)
            ? candidates.filter(candidate => candidate.isScarletViolet)
            : candidates;
        const moveNames = [...new Set(candidatePool.map(candidate => candidate.name))].slice(0, 20);

        const moves = await Promise.all(moveNames.map(async moveName => {
            const moveResponse = await fetch(`https://pokeapi.co/api/v2/move/${encodeURIComponent(moveName)}`, {
                headers: { "User-Agent": "Mozilla/5.0" }
            });
            if (!moveResponse.ok) return null;
            const move = await moveResponse.json();
            const flavorText = move.flavor_text_entries.find(entry => entry.language.name === "en");
            const power = move.power || 0;
            const stabBonus = types.includes(move.type.name) ? 1.5 : 1;
            const classBonus = move.damage_class.name === preference ? 1.15 : 1;
            return {
                id: move.id,
                name: move.name,
                type: move.type.name,
                power: move.power || "-",
                damageClass: move.damage_class.name,
                description: flavorText ? flavorText.flavor_text.replace(/\f|\n/g, " ") : "",
                score: power * stabBonus * classBonus
            };
        }));

        const result = {
            pokemon: {
                id: pokemon.id,
                name: pokemon.name,
                image: pokemon.sprites.versions?.["generation-v"]?.["black-white"]?.animated?.front_default
                    || pokemon.sprites.front_default
                    || pokemon.sprites.other?.["official-artwork"]?.front_default
                    || "",
                types
            },
            moves: moves
                .filter(move => move !== null)
                .sort((a, b) => b.score - a.score)
                .slice(0, 6)
                .map(({ score, ...move }) => move)
        };

        pokemonRecommendationsCache.set(name, result);
        res.json(result);
    } catch (error) {
        console.error(`Fetch recommended moves for ${name} error:`, error);
        res.status(502).json({ error: "โหลดท่าแนะนำไม่สำเร็จ" });
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

// ========================================
// API ดึงข้อมูลไอเทม (Items)
// ========================================
app.get("/items", async (req, res) => {
    try {
        const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
        const limit = 20;
        const search = String(req.query.search || "").toLowerCase().trim();

        if (!itemListCache.value) {
            const response = await fetch("https://pokeapi.co/api/v2/item?limit=10000&offset=0", {
                headers: { "User-Agent": "Mozilla/5.0" }
            });
            if (!response.ok) throw new Error("Fetch items failed");
            const data = await response.json();
            itemListCache.value = data.results;
        }

        const matchingItems = itemListCache.value.filter(item => item.name.includes(search));
        const totalCount = matchingItems.length;
        const pageItems = matchingItems.slice((page - 1) * limit, page * limit);

        const items = await Promise.all(
            pageItems.map(async (item) => {
                const resDetail = await fetch(item.url, { headers: { "User-Agent": "Mozilla/5.0" } });
                if (!resDetail.ok) return null;
                const detail = await resDetail.json();

                // ค้นหาคำอธิบายภาษาอังกฤษ
                const effectText = detail.effect_entries.find(e => e.language.name === "en");
                const flavorText = detail.flavor_text_entries.find(e => e.language.name === "en");

                return {
                    id: detail.id,
                    name: detail.name,
                    category: detail.category?.name || "general",
                    image: detail.sprites?.default || "", // รูปภาพ Pixel Art ของไอเทม
                    description: effectText ? effectText.short_effect.replace(/\f|\n/g, " ") 
                               : (flavorText ? flavorText.flavor_text.replace(/\f|\n/g, " ") : "ไม่มีคำอธิบาย")
                };
            })
        );

        res.json({
            items: items.filter(i => i !== null),
            page,
            totalPages: Math.ceil(totalCount / limit)
        });
    } catch (error) {
        console.error("Fetch Items Error:", error);
        res.status(502).json({ error: "โหลดข้อมูลไอเทมไม่สำเร็จ" });
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

let team = [];

app.post("/team/push", (req, res) => {
    if (team.length >= 6) return res.status(400).json({ error: "ทีมเต็มแล้ว" });
    team.push(req.body);
    res.json({ success: true, team: [...team] });
});

app.post("/team/remove", (req, res) => {
    const id = Number(req.body.id);
    const index = team.findIndex(pokemon => Number(pokemon.id) === id);
    if (index !== -1) {
        team.splice(index, 1);
    }
    res.json({ success: true, team: [...team] });
});

app.post("/team/clear", (req, res) => {
    team = [];
    res.json({ success: true, team: [...team] });
});

app.post("/team/set", (req, res) => {
    team = Array.isArray(req.body.team) ? req.body.team.slice(0, 6) : [];
    res.json({ success: true, team: [...team] });
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