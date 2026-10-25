const express = require("express");
const path = require("path");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// ========================================
// Cache ระบบเก็บข้อมูลธาตุ
// ========================================
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

// ========================================
// Routes การดึงหน้าเว็บและข้อมูล Pokémon
// ========================================

app.get("/", (req, res) => {
    res.send("Pokémon API Server is running!");
});

// API สำหรับดึง ค้นหา กรอง และเรียงลำดับ Pokémon
app.get("/pokemons", async (req, res) => {
    try {
        const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
        const limit = Math.min(25, Math.max(1, Number.parseInt(req.query.limit, 10) || 25));
        const search = String(req.query.search || "").toLowerCase().trim();
        const type = String(req.query.type || "all").toLowerCase().trim();
        const stat = String(req.query.stat || "id");
        const order = String(req.query.order || "asc");

        const resAll = await fetch(`https://pokeapi.co/api/v2/pokemon?limit=1025`, {
            headers: { "User-Agent": "Mozilla/5.0" }
        });
        if (!resAll.ok) throw new Error(`API Error: ${resAll.status}`);
        const dataAll = await resAll.json();

        let mainList = dataAll.results.filter(p => {
            const idMatch = p.url.match(/\/pokemon\/(\d+)\//);
            const id = idMatch ? parseInt(idMatch[1], 10) : 0;
            return id >= 1 && id <= 1025;
        });

        if (search) {
            mainList = mainList.filter(p => p.name.toLowerCase().includes(search));
        }

        if (type !== "all") {
            const typeNames = await getPokemonNamesByType(type);
            mainList = mainList.filter(p => typeNames.has(p.name));
        }

        const totalCount = mainList.length;
        const start = (page - 1) * limit;
        const targetList = mainList.slice(start, start + limit);

        const pagePokemons = await Promise.all(
            targetList.map(async (pokemon) => {
                const resDetail = await fetch(pokemon.url, {
                    headers: { "User-Agent": "Mozilla/5.0" }
                });
                if (!resDetail.ok) return null;
                const detail = await resDetail.json();

                return {
                    id: detail.id,
                    name: detail.name,
                    image: detail.sprites.front_default,
                    hp: detail.stats[0].base_stat,
                    attack: detail.stats[1].base_stat,
                    defense: detail.stats[2].base_stat,
                    specialAttack: detail.stats[3].base_stat,
                    specialDefense: detail.stats[4].base_stat,
                    speed: detail.stats[5].base_stat,
                    types: detail.types.map(({ type }) => type.name)
                };
            })
        );

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

// ========================================
// API ดึงข้อมูล ท่าโจมตี (Moves)
// ========================================
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
        console.error("Moves Fetch Error:", error);
        res.status(502).json({ error: "โหลดข้อมูลท่าโจมตีไม่สำเร็จ" });
    }
});

// ========================================
// API ดึงข้อมูล ความสามารถพิเศษ (Abilities)
// ========================================
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
                    description: effectText ? effectText.short_effect.replace(/\f|\n/g, " ") : "ไม่มีคำอธิบาย"
                };
            })
        );

        res.json({
            abilities: abilities.filter(a => a !== null),
            page,
            totalPages: Math.ceil(data.count / limit)
        });
    } catch (error) {
        console.error("Abilities Fetch Error:", error);
        res.status(502).json({ error: "โหลดข้อมูลความสามารถไม่สำเร็จ" });
    }
});

// ========================================
// Algorithm: Insertion Sort
// ========================================

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

// ========================================
// Data Structure: Stack & History System
// ========================================

class Stack {
    constructor() {
        this.items = [];
    }

    push(item) {
        this.items.push(item);
    }

    pop() {
        return this.items.pop();
    }

    peek() {
        return this.items[this.items.length - 1];
    }

    isEmpty() {
        return this.items.length === 0;
    }

    clear() {
        this.items = [];
    }

    getAll() {
        return [...this.items];
    }
}

const teamStack = new Stack();
const undoStack = new Stack();
const redoStack = new Stack();

function saveHistory() {
    const snapshot = JSON.parse(JSON.stringify(teamStack.getAll()));
    undoStack.push(snapshot);
    redoStack.clear();
}

function setTeam(newTeam) {
    teamStack.clear();
    newTeam.forEach(pokemon => teamStack.push(pokemon));
}

// ========================================
// Endpoints: จัดการทีม Pokémon (Team API)
// ========================================

app.post("/team/push", (req, res) => {
    if (teamStack.getAll().length >= 6) {
        return res.status(400).json({ error: "ทีมเต็มแล้ว" });
    }

    saveHistory();
    teamStack.push(req.body);

    res.json({
        success: true,
        team: teamStack.getAll()
    });
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

    res.json({
        success: true,
        team: teamStack.getAll()
    });
});

app.post("/team/clear", (req, res) => {
    if (!teamStack.isEmpty()) {
        saveHistory();
        teamStack.clear();
    }

    res.json({
        success: true,
        team: teamStack.getAll()
    });
});

app.post("/team/set", (req, res) => {
    saveHistory();
    const newTeam = Array.isArray(req.body.team) ? req.body.team.slice(0, 6) : [];
    setTeam(newTeam);

    res.json({
        success: true,
        team: teamStack.getAll()
    });
});

app.post("/team/undo", (req, res) => {
    if (undoStack.isEmpty()) {
        return res.json({
            success: false,
            message: "ไม่มีประวัติให้ย้อนกลับ",
            team: teamStack.getAll()
        });
    }

    const currentSnapshot = JSON.parse(JSON.stringify(teamStack.getAll()));
    redoStack.push(currentSnapshot);

    const previousTeam = undoStack.pop();
    setTeam(previousTeam);

    res.json({
        success: true,
        team: teamStack.getAll()
    });
});

app.post("/team/redo", (req, res) => {
    if (redoStack.isEmpty()) {
        return res.json({
            success: false,
            message: "ไม่มีประวัติให้ทำซ้ำ",
            team: teamStack.getAll()
        });
    }

    const currentSnapshot = JSON.parse(JSON.stringify(teamStack.getAll()));
    undoStack.push(currentSnapshot);

    const nextTeam = redoStack.pop();
    setTeam(nextTeam);

    res.json({
        success: true,
        team: teamStack.getAll()
    });
});

app.listen(PORT, () => {
    console.log(`เซิร์ฟเวอร์พร้อมใช้งานที่ http://localhost:${PORT}`);
});