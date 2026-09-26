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
}