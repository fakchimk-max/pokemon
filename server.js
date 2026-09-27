//pokemon api//

const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// โหลดเฉพาะรายการชื่อและ URL ของ Pokémon ทั้งหมดก่อน
const API_URL = "https://pokeapi.co/api/v2/pokemon?limit=1025";

let pokemonList = [];
const detailCache = new Map();
const typeCache = new Map();

// จำกัดจำนวน request พร้อมกัน เพื่อป้องกัน Vercel ขึ้น EMFILE
const DETAIL_BATCH_SIZE = 12;

// ========================================
// โหลดรายชื่อ Pokémon 1,025 ตัว
// ========================================

async function loadPokemonList() {

    console.log("กำลังโหลดรายชื่อ Pokémon อยู่จ้า . . .");

    const response = await fetch(API_URL, {
        headers: { "User-Agent": "Mozilla/5.0" }
    });

    if (!response.ok) {
        throw new Error(`โหลดรายการ Pokémon ไม่สำเร็จ: ${response.status}`);
    }

    const data = await response.json();

    pokemonList = data.results.map((pokemon, index) => ({
        id: index + 1,
        name: pokemon.name,
        url: pokemon.url
    }));

    console.log(`โหลดรายชื่อ Pokémon สำเร็จ ${pokemonList.length} ตัว`);
}

const pokemonListPromise = loadPokemonList().catch((error) => {
    console.error("โหลดรายชื่อ Pokémon ไม่สำเร็จ:", error);
    throw error;
});

// ========================================
// โหลดรายละเอียด Pokémon และเก็บ cache
// ========================================

async function getPokemonDetail(pokemon) {

    if (detailCache.has(pokemon.id)) {
        return detailCache.get(pokemon.id);
    }

    const response = await fetch(pokemon.url, {
        headers: { "User-Agent": "Mozilla/5.0" }
    });

    if (!response.ok) {
        throw new Error(`โหลดข้อมูล ${pokemon.name} ไม่สำเร็จ: ${response.status}`);
    }

    const detail = await response.json();

    const pokemonData = {
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

    detailCache.set(pokemon.id, pokemonData);

    return pokemonData;
}

// โหลดเป็นชุดเล็ก ๆ เช่น 12 ตัวต่อครั้ง
async function getPokemonDetails(list) {

    const results = [];

    for (let i = 0; i < list.length; i += DETAIL_BATCH_SIZE) {

        const batch = list.slice(i, i + DETAIL_BATCH_SIZE);

        const batchResults = await Promise.all(
            batch.map((pokemon) => getPokemonDetail(pokemon))
        );

        results.push(...batchResults);
    }

    return results;
}

// ========================================
// โหลดรายชื่อ Pokémon ตามธาตุ
// ========================================

async function getPokemonNamesByType(type) {

    if (typeCache.has(type)) {
        return typeCache.get(type);
    }

    const response = await fetch(
        `https://pokeapi.co/api/v2/type/${type}`,
        {
            headers: { "User-Agent": "Mozilla/5.0" }
        }
    );

    if (!response.ok) {
        throw new Error(
            `โหลดข้อมูลธาตุ ${type} ไม่สำเร็จ: ${response.status}`
        );
    }

    const data = await response.json();

    const names = new Set(
        data.pokemon.map((item) => item.pokemon.name)
    );

    typeCache.set(type, names);

    return names;
}

// ========================================
// API สำหรับแบ่งหน้า
// ========================================

app.get("/pokemons", async (req, res) => {

    try {

        await pokemonListPromise;

        const page = Math.max(
            1,
            Number.parseInt(req.query.page, 10) || 1
        );

        const limit = Math.min(
            25,
            Math.max(
                1,
                Number.parseInt(req.query.limit, 10) || 25
            )
        );

        const search = String(req.query.search || "")
            .toLowerCase()
            .trim();

        const type = String(req.query.type || "all")
            .toLowerCase()
            .trim();

        let filtered = pokemonList;

        // ค้นหาจากชื่อ
        if (search) {

            filtered = filtered.filter((pokemon) =>
                pokemon.name
                    .toLowerCase()
                    .includes(search)
            );
        }

        // กรองตามธาตุ
        if (type !== "all") {

            const typeNames =
                await getPokemonNamesByType(type);

            filtered = filtered.filter((pokemon) =>
                typeNames.has(pokemon.name)
            );
        }

        const total = filtered.length;

        const totalPages = Math.max(
            1,
            Math.ceil(total / limit)
        );

        const safePage = Math.min(
            page,
            totalPages
        );

        const start = (safePage - 1) * limit;

        const pageList = filtered.slice(
            start,
            start + limit
        );

        // โหลดรายละเอียดเฉพาะ Pokémon ของหน้านี้
        const pagePokemons =
            await getPokemonDetails(pageList);

        res.json({
            pokemons: pagePokemons,
            total,
            page: safePage,
            limit,
            totalPages
        });

    } catch (error) {

        console.error(
            "โหลดข้อมูล Pokémon ไม่สำเร็จ:",
            error
        );

        res.status(502).json({
            error: "โหลดข้อมูล Pokémon ไม่สำเร็จ"
        });
    }
});

// ส่งหน้า index.html เมื่อเปิดเข้ามาที่หน้าแรก
app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {

    console.log(
        `เซิร์ฟเวอร์พร้อมใช้งานที่ http://localhost:${PORT}`
    );

});

// ========================================
// Insertion Sort
// ========================================

function insertionSort(
    array,
    field = "id",
    order = "asc"
) {

    // สร้าง Array ใหม่ เพื่อไม่แก้ไข Array ต้นฉบับ
    const arr = [...array];

    // เริ่มที่ index 1 เพราะข้อมูลตัวแรกถือว่าเรียงแล้ว
    for (let i = 1; i < arr.length; i++) {

        // เก็บข้อมูลตัวที่กำลังจะนำไปแทรก
        const current = arr[i];

        // ดึงค่าที่ใช้สำหรับเปรียบเทียบ
        const currentValue =
            Number(current[field]) || 0;

        // เริ่มเปรียบเทียบจากข้อมูลด้านซ้าย
        let j = i - 1;

        // ตรวจสอบข้อมูลด้านซ้าย
        while (j >= 0) {

            // ดึงค่าของข้อมูลก่อนหน้า
            const previousValue =
                Number(arr[j][field]) || 0;

            let shouldMove;

            if (order === "asc") {

                // Ascending (asc) น้อยไปมาก
                shouldMove =
                    previousValue > currentValue;

            } else {

                // Descending (desc) มากไปน้อย
                shouldMove =
                    previousValue < currentValue;
            }

            // ถ้าไม่ต้องเลื่อน
            if (!shouldMove) {
                break;
            }

            // เลื่อนข้อมูลด้านซ้ายไปทางขวา
            arr[j + 1] = arr[j];

            // เลื่อนตำแหน่ง j ไปทางซ้าย
            j--;
        }

        // นำข้อมูล current ไปใส่ในตำแหน่งที่ถูกต้อง
        arr[j + 1] = current;
    }

    // ส่งข้อมูลที่เรียงแล้วกลับไป
    return arr;
}

// ========================================
// Stack
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
        return this.items[
            this.items.length - 1
        ];
    }

    isEmpty() {
        return this.items.length === 0;
    }

    getAll() {
        return this.items;
    }
}

app.use(express.static("public"));

app.listen(PORT, () => {
    console.log(`เซิร์ฟเวอร์พร้อมใช้งานที่ http://localhost:${PORT}`);
});