function setTexto(id, valor){

  const elemento =
    document.getElementById(id);

  if(elemento){
    elemento.innerText = valor;
  }

}

function setLargura(id, valor){

  const elemento =
    document.getElementById(id);

  if(elemento){
    elemento.style.width = valor;
  }

}

function atualizarDashboardSemana(
  dias,
  agendamentos
){

  const profissionalSelect =
    document.getElementById("profissional");

  const nomeProfissional =
    profissionalSelect
      .selectedOptions[0]
      ?.text || "Selecione um profissional";

  setTexto(
    "nomeProfissionalTopo",
    nomeProfissional
  );

  setTexto(
    "periodoSemanaTopo",
    formatarDataBR(dataISO(dias[0])) +
    " até " +
    formatarDataBR(dataISO(dias[6]))
  );

  const total =
    agendamentos.length;

  const faturamento =
    agendamentos.reduce((total,a)=>{
      return total + Number(a.servico_valor || 0);
    },0);

  const ticket =
    total > 0
    ? faturamento / total
    : 0;

  const totalPossivel =
    dias.length * 10;

  const ocupacao =
    totalPossivel > 0
    ? Math.round((total / totalPossivel) * 100)
    : 0;

  setTexto("totalSemana", total);

  setTexto(
    "faturamentoSemana",
    formatarMoeda(faturamento)
  );

  setTexto(
    "ticketSemana",
    formatarMoeda(ticket)
  );

  setTexto(
    "ocupacaoSemana",
    ocupacao + "%"
  );

  const status =
    document.querySelector(".statusSistema");

  if(status){
    status.innerText = "🟢 Atualizado agora";
  }

  atualizarPainelInteligente(
    agendamentos
  );

}



function formatarDataBR(data){

  const partes =
    data.split("-");

  return partes[2] + "/" +
         partes[1] + "/" +
         partes[0];

}

function formatarMoeda(valor){

  return valor.toLocaleString(
    "pt-BR",
    {
      style:"currency",
      currency:"BRL"
    }
  );

}

function encontrarProximoAgendamento(
  agendamentos
){

  const agora =
    new Date();

  const futuros =
    agendamentos
      .filter(a=>{

        const dataHora =
          new Date(
            `${a.data}T${a.hora}`
          );

        return dataHora >= agora;

      })
      .sort((a,b)=>{

        const dataA =
          new Date(
            `${a.data}T${a.hora}`
          );

        const dataB =
          new Date(
            `${b.data}T${b.hora}`
          );

        return dataA - dataB;

      });

  return futuros[0] || null;

}

function atualizarPainelInteligente(agendamentos){

  const agora =
    new Date();

  const hora =
    agora.getHours();

  let saudacao = "Bom dia";
  let icone = "🌞";

  if(hora >= 12){
    saudacao = "Boa tarde";
    icone = "☀️";
  }

  if(hora >= 18){
    saudacao = "Boa noite";
    icone = "🌙";
  }

  const profissionalSelect =
  document.getElementById("profissional");

  const nomeProfissional =
     profissionalSelect?.selectedOptions[0]?.text || "";

  const saudacaoTexto =
     nomeProfissional &&
     nomeProfissional !== "Selecione um profissional"
       ? `${icone} ${saudacao}, ${nomeProfissional}!`
       : `${icone} ${saudacao}!`;

  setTexto(
    "saudacaoPainel",
     saudacaoTexto
  );

  setTexto(
    "mensagemPainel",
    "Sua agenda está pronta para hoje."
  );

  setTexto(
    "dataHojePainel",
    agora.toLocaleDateString(
      "pt-BR",
      {
        weekday:"long",
        day:"2-digit",
        month:"long"
      }
    )
  );

  const hojeISO =
    dataISO(agora);

  const agendamentosHoje =
    agendamentos.filter(a=>
      a.data === hojeISO
    );

  const receitaHoje =
    agendamentosHoje.reduce((total,a)=>{
      return total + Number(a.servico_valor || 0);
    },0);

  setTexto(
    "receitaHojePainel",
    formatarMoeda(receitaHoje)
  );

  setTexto(
    "resumoHojePainel",
    `${agendamentosHoje.length} atendimento(s) hoje`
  );

  const proximo =
    encontrarProximoAgendamento(
      agendamentosHoje
    );

  if(proximo){

    setTexto(
      "proximoResumoPainel",
      `${proximo.hora} • ${proximo.cliente}`
    );

    const inicio =
      new Date(`${proximo.data}T${proximo.hora}`);

    const minutos =
      Math.round(
        (inicio - agora) / 60000
      );

    setTexto(
      "contadorProximoPainel",
      minutos > 0
      ? `Chega em ${minutos} min`
      : "Em atendimento ou aguardando"
    );

  }else{

    setTexto(
      "proximoResumoPainel",
      "Nenhum próximo atendimento"
    );

    setTexto(
      "contadorProximoPainel",
      "Agenda livre no momento"
    );

  }

  const dicas = [
    "Organização gera mais produtividade.",
    "Um horário livre pode virar oportunidade.",
    "Clientes satisfeitos sempre voltam.",
    "Pontualidade também vende profissionalismo.",
    "Uma agenda bem cuidada evita retrabalho."
  ];

  const indice =
    agora.getDate() % dicas.length;

  setTexto(
    "dicaPainel",
    dicas[indice]
  );

  const realizados =
    agendamentosHoje.filter(a=>{

      const duracao =
        Number(a.servico_duracao || 30);

      const inicio =
        new Date(`${a.data}T${a.hora}`);

      const fim =
        new Date(inicio);

      fim.setMinutes(
        fim.getMinutes() + duracao
      );

      return agora > fim;

    }).length;

  const progresso =
    agendamentosHoje.length > 0
    ? Math.round((realizados / agendamentosHoje.length) * 100)
    : 0;

  setTexto(
    "progressoDiaTexto",
    progresso + "%"
  );

  setLargura(
    "barraProgressoDia",
    progresso + "%"
  );

  setTexto(
    "fraseProgressoDia",
    agendamentosHoje.length > 0
    ? `${realizados} de ${agendamentosHoje.length} atendimento(s) já passaram.`
    : "Nenhum atendimento marcado para hoje."
  );

}