const express = require("express");
const fs = require("fs");

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static("public"));

const API_URL = "https://pokeapi.co/api/v2/pokemon?limit=1025";
let pokemons = [];