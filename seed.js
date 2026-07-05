const Database = require("better-sqlite3");

const db = new Database("./database/banco.db");

const inserir = db.prepare(`
INSERT INTO usuarios
(usuario, senha, tipo)
VALUES (?, ?, ?)
`);

inserir.run(
  "admin",
  "123456",
  "admin"
);

console.log("Usuário administrador criado!");