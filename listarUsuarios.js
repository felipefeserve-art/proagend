const Database = require("better-sqlite3");

const db = new Database("./database/banco.db");

const usuarios = db
  .prepare("SELECT * FROM usuarios")
  .all();

console.table(usuarios);