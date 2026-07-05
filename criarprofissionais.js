const Database = require("better-sqlite3");

const db = new Database("./database/banco.db");

db.exec(`

SELECT *
FROM profissional_servicos;

`);

console.log("Tabela clientes criada!");