//pokemon api//

const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// เก็บ Cache สำหรับรายละเอียด Pokémon และ ธาตุ
const detailCache = new Map();
const typeCache = new Map();

// ========================================
// API สำหรับแบ่งหน้า (ดึงจาก PokeAPI ตรงๆ แบบจำกัดจำนวน)
// ========================================

app.get("/pokemons", async (req, res) => {
    try {
        const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
        const limit = Math.min(25, Math.max(1, Number.parseInt(req.query.limit, 10) || 25));
        const search = String(req.query.search || "").toLowerCase().trim();
        const type = String(req.query.type || "all").toLowerCase().trim();

        const offset = (page - 1) * limit;

        // ดึงเฉพาะจำนวนที่ต้องการในหน้านั้นๆ (เช่น ทีละ 25 ตัว)
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon?offset=${offset}&limit=${limit}`, {
            headers: { "User-Agent": "Mozilla/5.0" }
        });

        if (!response.ok) {
            throw new Error(`ดึงข้อมูล PokeAPI ไม่สำเร็จ: ${response.status}`);
        }

        const data = await response.json();

        // ดึงรายละเอียดเฉพาะ 25 ตัวของหน้านี้
        const pagePokemons = await Promise.all(
            data.results.map(async (pokemon) => {
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

        res.json({
            pokemons: pagePokemons.filter(p => p !== null),
            total: data.count, // PokeAPI มีคืนค่า count รวมทั้งหมดให้อยู่แล้ว (1000+)
            page,
            limit,
            totalPages: Math.ceil(data.count / limit)
        });

    } catch (error) {
        console.error("โหลดข้อมูล Pokémon ไม่สำเร็จ:", error);
        res.status(502).json({
            error: "โหลดข้อมูล Pokémon ไม่สำเร็จ"
        });
    }
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

app.listen(PORT, () => {
    console.log(`เซิร์ฟเวอร์พร้อมใช้งานที่ http://localhost:${PORT}`);
});