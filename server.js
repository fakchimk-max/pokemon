//pokemon api//

const express = require("express");
const fs = require("fs");

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
    const data = await response.json();
    console.log(data);
    const results = await Promise.all(

    data.results.map(async (pokemon) => {
        const response = await fetch(pokemon.url);
        const detail = await response.json();
    //เอาค่าต่าง ๆ ของ pokemon//
        const pokemonData = {
            id: detail.id,
            name: detail.name,
            image: detail.sprites.front_default,
            hp: detail.stats[0].base_stat,
            attack: detail.stats[1].base_stat,
            defense: detail.stats[2].base_stat
        };
        return pokemonData;
    })

);
}
//เอาข้อมูลไปเก็บ//
pokemons = results;
console.log(pokemons);