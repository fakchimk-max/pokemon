//pokemon api//

const express = require("express");

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static("public"));

const API_URL = "https://pokeapi.co/api/v2/pokemon?limit=1025";
let pokemons = [];

//โหลดเอา pokemon จาก pokeapi//

async function loadPokemons() {

    console.log("กำลังโหลดข้อมูล Pokémon อยู่จ้า . . .");

    const response = await fetch(API_URL);

    if (!response.ok) {
        throw new Error(`โหลดรายการ Pokémon ไม่สำเร็จ: ${response.status}`);
    }

    const data = await response.json();

    // โหลดรายละเอียดทีละชุด
    // ยังคงโหลดครบ 1025 ตัวเหมือนเดิม
    const results = [];
    const batchSize = 25;

    for (let i = 0; i < data.results.length; i += batchSize) {

        const batch = data.results.slice(i, i + batchSize);

        const batchResults = await Promise.all(

            batch.map(async (pokemon) => {

                const response = await fetch(pokemon.url);

                if (!response.ok) {
                    throw new Error(
                        `โหลดข้อมูล ${pokemon.name} ไม่สำเร็จ: ${response.status}`
                    );
                }

                const detail = await response.json();

                //เอาค่าต่าง ๆ ของ pokemon//

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

                return pokemonData;
            })

        );

        results.push(...batchResults);

        console.log(
            `โหลด Pokémon แล้ว ${results.length}/${data.results.length} ตัว`
        );
    }

    //เอาข้อมูลไปเก็บ//
    pokemons = results;

    console.log(`โหลด Pokémon สำเร็จ ${pokemons.length} ตัว`);
}

let pokemonLoadError;

const pokemonLoadPromise = loadPokemons().catch((error) => {
    pokemonLoadError = error;
    console.error("โหลดข้อมูล Pokémon ไม่สำเร็จ:", error);
});

app.get("/pokemons", async (req, res) => {

    await pokemonLoadPromise;

    if (pokemonLoadError) {
        return res.status(502).json({
            error: "โหลดข้อมูล Pokémon ไม่สำเร็จ"
        });
    }

    res.json(pokemons);
});

app.listen(PORT, () => {

    console.log(
        `เซิร์ฟเวอร์พร้อมใช้งานที่ http://localhost:${PORT}`
    );

});

function insertionSort(array, field = "id", order = "asc") {

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
                // ถ้าค่าก่อนหน้ามากกว่า current ต้องเลื่อนไปทางขวา
                shouldMove =
                    previousValue > currentValue;

            } else {

                // Descending (desc) มากไปน้อย
                // ถ้าค่าก่อนหน้าน้อยกว่า current ต้องเลื่อนไปทางขวา
                shouldMove =
                    previousValue < currentValue;
            }

            // ถ้าไม่ต้องเลื่อน แสดงว่าเจอตำแหน่งที่ถูกต้องแล้ว
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