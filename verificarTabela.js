const Database = require("better-sqlite3");

const db = new Database("./database/banco.db");

const colunas = db
  .prepare("PRAGMA table_info(agendamentos)")
  .all();

console.table(colunas);