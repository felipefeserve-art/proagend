const Database = require("better-sqlite3");

const db = new Database("./database/banco.db");

db.exec(`
ALTER TABLE profissionais
ADD COLUMN folga_domingo INTEGER DEFAULT 0;

ALTER TABLE profissionais
ADD COLUMN folga_segunda INTEGER DEFAULT 0;

ALTER TABLE profissionais
ADD COLUMN folga_terca INTEGER DEFAULT 0;

ALTER TABLE profissionais
ADD COLUMN folga_quarta INTEGER DEFAULT 0;

ALTER TABLE profissionais
ADD COLUMN folga_quinta INTEGER DEFAULT 0;

ALTER TABLE profissionais
ADD COLUMN folga_sexta INTEGER DEFAULT 0;

ALTER TABLE profissionais
ADD COLUMN folga_sabado INTEGER DEFAULT 0;
`);

console.log("Coluna ADICIONADA!");