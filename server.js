const express = require("express");
const jwt = require("jsonwebtoken");
const Database = require("better-sqlite3");
const dayjs = require("dayjs");

const app = express();

const db = new Database("./database/banco.db");

const SEGREDO = "MEU_SEGREDO";

app.use(express.json());

app.use(express.static("public"));

/* ==========================
   LOGIN
========================== */

app.post("/login", (req, res) => {

  const { usuario, senha } = req.body;

  const usuarioBanco = db
    .prepare(`
      SELECT *
      FROM usuarios
      WHERE usuario = ?
      AND senha = ?
    `)
    .get(usuario, senha);

  if (!usuarioBanco) {
    return res.status(401).json({
      erro: "Usuário ou senha inválidos"
    });
  }

  const token = jwt.sign(
    {
      id: usuarioBanco.id,
      usuario: usuarioBanco.usuario,
      tipo: usuarioBanco.tipo
    },
    SEGREDO,
    {
      expiresIn: "8h"
    }
  );

  res.json({
    token
  });

});

/* ==========================
   SERVIÇOS
========================== */

// LISTAR

app.get("/servicos", (req, res) => {

  const servicos = db
    .prepare(`
      SELECT *
      FROM servicos
      ORDER BY nome
    `)
    .all();

  res.json(servicos);

});

// BUSCAR POR ID

app.get("/servicos/:id", (req, res) => {

  const id = req.params.id;

  const servico = db
    .prepare(`
      SELECT *
      FROM servicos
      WHERE id = ?
    `)
    .get(id);

  if (!servico) {

    return res.status(404).json({
      erro: "Serviço não encontrado"
    });

  }

  res.json(servico);

});

// CADASTRAR

app.post("/servicos", (req, res) => {

  const {
    icone,
    nome,
    valor,
    duracao
  } = req.body;

  const resultado = db.prepare(`
    INSERT INTO servicos
    (
      icone,
      nome,
      valor,
      duracao
    )
    VALUES (?, ?, ?, ?)
  `).run(
    icone || "✂️",
    nome,
    valor,
    duracao
  );

  res.json({
    sucesso: true,
    id: resultado.lastInsertRowid
  });

});

// EDITAR

app.put("/servicos/:id", (req, res) => {

  const id = req.params.id;

  const {
    icone,
    nome,
    valor,
    duracao
  } = req.body;

  db.prepare(`
    UPDATE servicos
    SET
      icone = ?,
      nome = ?,
      valor = ?,
      duracao = ?
    WHERE id = ?
  `).run(
    icone,
    nome,
    valor,
    duracao,
    id
  );

  res.json({
    sucesso: true
  });

});

// EXCLUIR

app.delete("/servicos/:id", (req, res) => {

  const id = req.params.id;

  db.prepare(`
    DELETE FROM servicos
    WHERE id = ?
  `).run(id);

  res.json({
    sucesso: true
  });

});

/* ==========================
   HORARIOS OCUPADOS
========================== */

app.get("/agenda/:data",(req,res)=>{

  const data = req.params.data;

  const agenda = db.prepare(`

    SELECT

      a.*,

      s.nome AS servico_nome,
      s.valor AS servico_valor,
      s.duracao AS servico_duracao,

      p.nome AS profissional_nome

    FROM agendamentos a

    LEFT JOIN servicos s
      ON s.id = a.servico_id

    LEFT JOIN profissionais p
      ON p.id = a.profissional_id

    WHERE a.data = ?

    ORDER BY a.hora

  `).all(data);

  res.json(agenda);

});

/* ==========================
   CADASTRAR AGENDAMENTOS 
========================== */

app.post("/agendamentos",(req,res)=>{

  const {
    cliente,
    telefone,
    profissional_id,
    servico_id,
    data,
    hora
  } = req.body;

  const bloqueio = db.prepare(`
    SELECT *
    FROM bloqueios_profissional
    WHERE profissional_id = ?
    AND ? BETWEEN data_inicio
            AND data_fim
  `).get(
    profissional_id,
    data
  );

  if(bloqueio){

    return res.status(400).json({
      erro:
        "Profissional indisponível (" +
        bloqueio.motivo +
        ")"
    });

  }

  // VERIFICA FOLGAS SEMANAIS

const profissional = db.prepare(`
  SELECT
    folga_domingo,
    folga_segunda,
    folga_terca,
    folga_quarta,
    folga_quinta,
    folga_sexta,
    folga_sabado
  FROM profissionais
  WHERE id = ?
`).get(profissional_id);

if(profissional){

  const diaSemana =
    new Date(data + "T00:00:00").getDay();

  const folgas = [

    profissional.folga_domingo,
    profissional.folga_segunda,
    profissional.folga_terca,
    profissional.folga_quarta,
    profissional.folga_quinta,
    profissional.folga_sexta,
    profissional.folga_sabado

  ];

  if(folgas[diaSemana] == 1){

    const nomesDias = [
      "Domingo",
      "Segunda-feira",
      "Terça-feira",
      "Quarta-feira",
      "Quinta-feira",
      "Sexta-feira",
      "Sábado"
    ];

    return res.status(400).json({
      erro:
        `Este profissional não atende às ${nomesDias[diaSemana]}.`
    });

  }

}

    // VERIFICA HORÁRIO DE EXPEDIENTE

const dadosProfissional = db.prepare(`
  SELECT
    hora_inicio,
    hora_fim
  FROM profissionais
  WHERE id = ?
`).get(profissional_id);

if(dadosProfissional){

  if(
    hora < dadosProfissional.hora_inicio ||
    hora >= dadosProfissional.hora_fim
  ){

    return res.status(400).json({
      erro:
        `O horário selecionado está fora do expediente do profissional.`
    });

  }

}

  const servico = db.prepare(`
    SELECT *
    FROM servicos
    WHERE id = ?
  `).get(servico_id);

  if(!servico){

    return res.status(400).json({
      erro:"Serviço não encontrado"
    });

  }


  const inicioNovo =
    dayjs(`${data} ${hora}`);

  const fimNovo =
    inicioNovo.add(
      servico.duracao,
      "minute"
    );

  const agendamentos =
    db.prepare(`

      SELECT
        a.*,
        s.duracao

      FROM agendamentos a

      JOIN servicos s
      ON s.id = a.servico_id

      WHERE
        a.data = ?
      AND
        a.profissional_id = ?

    `).all(
      data,
      profissional_id
    );

  const conflito =
    agendamentos.find(a=>{

      const inicioExistente =
        dayjs(`${a.data} ${a.hora}`);

      const fimExistente =
        inicioExistente.add(
          a.duracao,
          "minute"
        );

      return (

        inicioNovo.isBefore(
          fimExistente
        )

        &&

        fimNovo.isAfter(
          inicioExistente
        )

      );

    });

  if(conflito){

    return res.status(400).json({
      erro:
      "Profissional já possui atendimento neste horário"
    });

  }

  db.prepare(`

    INSERT INTO agendamentos(

      cliente,
      telefone,
      profissional_id,
      servico_id,
      data,
      hora,
      status

    )

    VALUES(?,?,?,?,?,?,?)

  `).run(

    cliente,
    telefone,
    profissional_id,
    servico_id,
    data,
    hora,
    "Agendado"

  );

  res.json({
    sucesso:true
  });

});

/* ==========================
   CANCELAR AGENDAMENTO
========================== */

app.delete("/agendamentos/:id",(req,res)=>{

  const id = req.params.id;

  db.prepare(`
    DELETE FROM agendamentos
    WHERE id = ?
  `).run(id);

  res.json({
    sucesso:true
  });

});

/* ==========================
   CADASTRAR PROFISSINAL
========================== */


app.post("/profissionais",(req,res)=>{

  const {
    nome,
    telefone,
    especialidade,
    hora_inicio,
    hora_fim
  } = req.body;

  db.prepare(`
    INSERT INTO profissionais(
      nome,
      telefone,
      especialidade,
      hora_inicio,
      hora_fim
    )
    VALUES(?,?,?,?,?)
  `).run(
    nome,
    telefone,
    especialidade,
    hora_inicio,
    hora_fim
  );

  res.json({
    sucesso:true
  });

});

app.get(
  "/profissionais/:id/servicos",
  (req,res)=>{

    const servicos = db.prepare(`
      SELECT s.*
      FROM servicos s
      INNER JOIN profissional_servicos ps
      ON ps.servico_id = s.id
      WHERE ps.profissional_id = ?
      ORDER BY s.nome
    `).all(req.params.id);

    res.json(servicos);

});

/* ==========================
   LISTA PROFISSIONAIS
========================== */

app.get("/profissionais",(req,res)=>{

  const profissionais = db.prepare(`
    SELECT *
    FROM profissionais
    WHERE ativo = 1
    ORDER BY nome
  `).all();

  res.json(profissionais);

});


app.get("/profissionais/:id",(req,res)=>{

  const profissional = db.prepare(`
    SELECT *
    FROM profissionais
    WHERE id = ?
  `).get(req.params.id);

  res.json(profissional);

});

/* ==========================
   EXCLUIR PROFISSIONAL
========================== */

app.delete("/profissionais/:id",(req,res)=>{

  db.prepare(`
    UPDATE profissionais
    SET ativo = 0
    WHERE id = ?
  `).run(req.params.id);

  res.json({
    sucesso:true
  });

});

/* ==========================
   EDITAR PROFISSIONAL
========================== */

app.put("/profissionais/:id",(req,res)=>{

  console.log(req.body);

  const {
    nome,
    telefone,
    especialidade,
    hora_inicio,
    hora_fim,

    folga_domingo,
    folga_segunda,
    folga_terca,
    folga_quarta,
    folga_quinta,
    folga_sexta,
    folga_sabado

  } = req.body;

  db.prepare(`
    UPDATE profissionais
    SET
      nome = ?,
      telefone = ?,
      especialidade = ?,
      hora_inicio = ?,
      hora_fim = ?,

      folga_domingo = ?,
      folga_segunda = ?,
      folga_terca = ?,
      folga_quarta = ?,
      folga_quinta = ?,
      folga_sexta = ?,
      folga_sabado = ?

    WHERE id = ?
  `).run(

    nome,
    telefone,
    especialidade,
    hora_inicio,
    hora_fim,

    folga_domingo,
    folga_segunda,
    folga_terca,
    folga_quarta,
    folga_quinta,
    folga_sexta,
    folga_sabado,

    req.params.id

  );

  res.json({
    sucesso:true
  });

});

/* ==========================
   BUSCAR AGENDAMENTO
========================== */

app.get("/agendamentos/:id",(req,res)=>{

  const id = req.params.id;

  const agendamento = db.prepare(`
    SELECT *
    FROM agendamentos
    WHERE id = ?
  `).get(id);

  res.json(agendamento);

});

/* ==========================
   ATUALIZA  AGND
========================== */

app.put("/agendamentos/:id",(req,res)=>{

  const id = req.params.id;

  const {
    cliente,
    telefone,
    servico_id,
    profissional_id,
    data,
    hora
  } = req.body;

  db.prepare(`
    UPDATE agendamentos
    SET
      cliente = ?,
      telefone = ?,
      servico_id = ?,
      profissional_id = ?,
      data = ?,
      hora = ?
    WHERE id = ?
  `).run(
    cliente,
    telefone,
    servico_id,
    profissional_id,
    data,
    hora,
    id
  );

  res.json({
    sucesso:true
  });

});

/* ==========================
   CLIENTES
========================== */

// LISTAR

app.get("/clientes",(req,res)=>{

  const clientes = db.prepare(`
    SELECT *
    FROM clientes
    ORDER BY nome
  `).all();

  res.json(clientes);

});

// CADASTRAR

app.post("/clientes",(req,res)=>{

  const {
    nome,
    telefone,
    email,
    observacoes
  } = req.body;

  db.prepare(`
    INSERT INTO clientes(
      nome,
      telefone,
      email,
      observacoes,
      data_cadastro
    )
    VALUES(?,?,?,?,?)
  `).run(
    nome,
    telefone,
    email,
    observacoes,
    new Date().toISOString()
  );

  res.json({
    sucesso:true
  });

});

// BUSCAR

app.get("/clientes/:id",(req,res)=>{

  const cliente = db.prepare(`
    SELECT *
    FROM clientes
    WHERE id = ?
  `).get(req.params.id);

  res.json(cliente);

});

// EDITAR

app.put("/clientes/:id",(req,res)=>{

  const {
    nome,
    telefone,
    email,
    observacoes
  } = req.body;

  db.prepare(`
    UPDATE clientes
    SET
      nome = ?,
      telefone = ?,
      email = ?,
      observacoes = ?
    WHERE id = ?
  `).run(
    nome,
    telefone,
    email,
    observacoes,
    req.params.id
  );

  res.json({
    sucesso:true
  });

});

// EXCLUIR

app.delete("/clientes/:id",(req,res)=>{

  db.prepare(`
    DELETE FROM clientes
    WHERE id = ?
  `).run(req.params.id);

  res.json({
    sucesso:true
  });

});

/* ==========================
VINCULAR PROFISSIONAL AO SERVIÇO
========================== */

// LISTAR

app.get(
  "/profissionais/:id/servicos-admin",
  (req,res)=>{

    const profissionalId =
      req.params.id;

    const servicos = db.prepare(`

      SELECT

        s.*,

        CASE
          WHEN ps.servico_id IS NULL
          THEN 0
          ELSE 1
        END AS vinculado

      FROM servicos s

      LEFT JOIN profissional_servicos ps

      ON ps.servico_id = s.id

      AND ps.profissional_id = ?

      ORDER BY s.nome

    `).all(profissionalId);

    res.json(servicos);

});

// SALVAR CHECKBOXES

app.get(
  "/profissionais/:id/servicos",
  (req,res)=>{

    const profissionalId =
      req.params.id;

    const servicos = db.prepare(`

      SELECT s.*

      FROM servicos s

      INNER JOIN profissional_servicos ps

      ON ps.servico_id = s.id

      WHERE ps.profissional_id = ?

      ORDER BY s.nome

    `).all(profissionalId);

    res.json(servicos);

});

// VINCULAR SERVIÇO AO PROFISSIONAL

app.post(
  "/profissionais/:id/servicos",
  (req,res)=>{

    const profissionalId =
      req.params.id;

    const { servicos } =
      req.body;

    // Remove os vínculos antigos
    db.prepare(`
      DELETE FROM profissional_servicos
      WHERE profissional_id = ?
    `).run(profissionalId);

    // Salva os novos
    if(servicos && servicos.length){

      const inserir = db.prepare(`
        INSERT INTO profissional_servicos(
          profissional_id,
          servico_id
        )
        VALUES(?,?)
      `);

      servicos.forEach(servicoId=>{

        inserir.run(
          profissionalId,
          servicoId
        );

      });

    }

    res.json({
      sucesso:true
    });

});



/* ==========================
   BUSCAR PROFISSIONAL
========================== */

app.get(
  "/profissionais/:id",
  (req,res)=>{

    const profissional =
      db.prepare(`
        SELECT *
        FROM profissionais
        WHERE id = ?
      `).get(req.params.id);

    res.json(profissional);

});

/* ==========================
    BLOQUEIO DE DIAS 
========================== */

// CADASTRAR BLOQUEIO

app.post("/bloqueios",(req,res)=>{

  const {
    profissional_id,
    data_inicio,
    data_fim,
    motivo
  } = req.body;

  db.prepare(`
    INSERT INTO bloqueios_profissional(
      profissional_id,
      data_inicio,
      data_fim,
      motivo
    )
    VALUES(?,?,?,?)
  `).run(
    profissional_id,
    data_inicio,
    data_fim,
    motivo
  );

  res.json({
    sucesso:true
  });

});

// LISTAR BLOQUEIO 

app.get("/bloqueios/:profissional",(req,res)=>{

  const bloqueios = db.prepare(`
    SELECT *
    FROM bloqueios_profissional
    WHERE profissional_id = ?
    ORDER BY data_inicio
  `).all(req.params.profissional);

  res.json(bloqueios);

});

// EXCLUIR 

app.delete("/bloqueios/:id",(req,res)=>{

  db.prepare(`
    DELETE FROM bloqueios_profissional
    WHERE id = ?
  `).run(req.params.id);

  res.json({
    sucesso:true
  });

});

app.get(
"/bloqueios-verificar/:profissional/:data",
(req,res)=>{

  const bloqueio = db.prepare(`
    SELECT *
    FROM bloqueios_profissional
    WHERE profissional_id = ?
    AND ? BETWEEN data_inicio
            AND data_fim
  `).get(
    req.params.profissional,
    req.params.data
  );

  res.json({
    bloqueado: !!bloqueio,
    motivo: bloqueio?.motivo
  });

});

app.get("/bloqueios",(req,res)=>{

  const bloqueios = db.prepare(`
    SELECT *
    FROM bloqueios_profissional
  `).all();

  res.json(bloqueios);

});

/* ==========================
   CONSULTAR AGENDAMENTOS
========================== */

app.get(
  "/consultar-agendamento/:telefone",
  (req,res)=>{

    const telefone =
      req.params.telefone;

    const agendamentos = db.prepare(`

      SELECT

        a.*,

        p.nome AS profissional,

        s.nome AS servico

      FROM agendamentos a

      LEFT JOIN profissionais p
      ON p.id = a.profissional_id

      LEFT JOIN servicos s
      ON s.id = a.servico_id

      WHERE a.telefone = ?

      ORDER BY a.data, a.hora

    `).all(telefone);

    res.json(agendamentos);

});


app.get("/meus-agendamentos", (req, res) => {

  let telefone =
    req.query.telefone || "";

  telefone =
    telefone.replace(/\D/g,"");

  if(!telefone){
    return res.status(400).json({
      erro:"Telefone não informado."
    });
  }

  const agendamentos =
    db.prepare(`

      SELECT
        a.id,
        a.cliente,
        a.telefone,
        a.data,
        a.hora,
        a.status,

        s.nome AS servico_nome,
        s.valor AS servico_valor,

        p.nome AS profissional_nome

      FROM agendamentos a

      LEFT JOIN servicos s
        ON s.id = a.servico_id

      LEFT JOIN profissionais p
        ON p.id = a.profissional_id

      WHERE
        REPLACE(
          REPLACE(
            REPLACE(
              REPLACE(a.telefone,'(',''),')',''
            ),
            '-',''
          ),
          ' ',''
        ) = ?

      ORDER BY
        a.data DESC,
        a.hora DESC

    `).all(telefone);

  res.json(agendamentos);

});

app.get("/agenda-semanal/:profissional/:inicio/:fim", (req, res) => {

  const { profissional, inicio, fim } = req.params;

  const agendamentos =
    db.prepare(`

      SELECT
        a.id,
        a.cliente,
        a.telefone,
        a.data,
        a.hora,
        a.status,
        a.profissional_id,
        a.servico_id,

        s.nome AS servico_nome,
        s.valor AS servico_valor,
        s.duracao AS servico_duracao

      FROM agendamentos a

      LEFT JOIN servicos s
        ON s.id = a.servico_id

      WHERE
        a.profissional_id = ?
        AND a.data >= ?
        AND a.data <= ?

      ORDER BY
        a.data,
        a.hora

    `).all(profissional, inicio, fim);

  res.json(agendamentos);

});

app.get("/cliente-historico/:telefone", (req, res) => {

  let telefone =
    req.params.telefone || "";

  telefone =
    telefone.replace(/\D/g,"");

  const historico =
    db.prepare(`

      SELECT
        a.id,
        a.cliente,
        a.telefone,
        a.data,
        a.hora,
        a.status,

        s.nome AS servico_nome,
        s.valor AS servico_valor,

        p.nome AS profissional_nome

      FROM agendamentos a

      LEFT JOIN servicos s
        ON s.id = a.servico_id

      LEFT JOIN profissionais p
        ON p.id = a.profissional_id

      WHERE
        REPLACE(
          REPLACE(
            REPLACE(
              REPLACE(a.telefone,'(',''),')',''
            ),
            '-',''
          ),
          ' ',''
        ) = ?

      ORDER BY
        a.data DESC,
        a.hora DESC

      LIMIT 20

    `).all(telefone);

  res.json(historico);

});

app.patch("/agendamentos/:id/finalizar", (req, res) => {

  const { id } = req.params;

  const agendamento =
    db.prepare(`
      SELECT id, status
      FROM agendamentos
      WHERE id = ?
    `).get(id);

  if(!agendamento){

    return res.status(404).json({
      erro:"Agendamento não encontrado."
    });

  }

  if(agendamento.status === "Finalizado"){

    return res.json({
      sucesso:true,
      mensagem:"O atendimento já estava finalizado."
    });

  }

  db.prepare(`
    UPDATE agendamentos
    SET status = 'Finalizado'
    WHERE id = ?
  `).run(id);

  res.json({
    sucesso:true,
    mensagem:"Atendimento finalizado com sucesso."
  });

});

/* ==========================
   INICIAR SERVIDOR
========================== */

app.listen(3000, "0.0.0.0", () => {

  console.log(
    "Servidor rodando em http://localhost:3000"
  );

});