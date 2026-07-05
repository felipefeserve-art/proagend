const Database = require("better-sqlite3");

const db = new Database("./database/banco.db");

db.exec(`

CREATE TABLE IF NOT EXISTS usuarios(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario TEXT UNIQUE,
    senha TEXT,
    tipo TEXT
);

CREATE TABLE IF NOT EXISTS servicos(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT,
    valor REAL,
    duracao INTEGER
);

CREATE TABLE IF NOT EXISTS agendamentos(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cliente TEXT,
    servico_id INTEGER,
    data TEXT,
    hora TEXT,
    status TEXT
);

CREATE TABLE agendamentos(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cliente TEXT,
  servico_id INTEGER,
  profissional TEXT,
  data TEXT,
  hora TEXT,
  status TEXT
);

`);

console.log("Banco criado com sucesso!");