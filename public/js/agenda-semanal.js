let ultimaVersaoAgenda = "";
let atualizandoSilencioso = false;

async function carregarProfissionais(){

  const resposta =
    await fetch("/profissionais");

  const profissionais =
    await resposta.json();

  document.getElementById("profissional").innerHTML =
    `<option value="">Selecione o profissional</option>` +
    profissionais.map(p=>`
      <option value="${p.id}">
        ${p.nome}
      </option>
    `).join("");

}

async function carregarSemana(){

  const profissional =
    document.getElementById("profissional").value;

  const data =
    document.getElementById("dataBase").value;

  if(!profissional || !data){
    return;
  }

  localStorage.setItem("agendaProfissional", profissional);
  localStorage.setItem("agendaData", data);

  const dias =
    calcularDiasSemana(data);

  const inicio =
    dataISO(dias[0]);

  const fim =
    dataISO(dias[6]);

  const resposta =
    await fetch(`/agenda-semanal/${profissional}/${inicio}/${fim}`);

  const agendamentos =
    await resposta.json();

  ultimaVersaoAgenda =
    JSON.stringify(agendamentos);

  montarTabela(dias, agendamentos);

  atualizarDashboardSemana(dias, agendamentos);

}

function calcularDiasSemana(data){

  const d =
    new Date(data + "T00:00:00");

  const diaSemana =
    d.getDay();

  const segunda =
    new Date(d);

  segunda.setDate(
    d.getDate() -
    (diaSemana === 0 ? 6 : diaSemana - 1)
  );

  const dias = [];

  for(let i = 0; i < 7; i++){

    const dia =
      new Date(segunda);

    dia.setDate(
      segunda.getDate() + i
    );

    dias.push(dia);

  }

  return dias;

}

function dataISO(data){

  return data.getFullYear() +
    "-" +
    String(data.getMonth() + 1).padStart(2,"0") +
    "-" +
    String(data.getDate()).padStart(2,"0");

}

function horaParaMinutos(hora){

  const [h,m] =
    hora.split(":").map(Number);

  return h * 60 + m;

}

function minutosParaHora(minutos){

  const h =
    Math.floor(minutos / 60);

  const m =
    minutos % 60;

  return String(h).padStart(2,"0") +
         ":" +
         String(m).padStart(2,"0");

}

function montarTabela(dias, agendamentos = []){

  const nomes = ["Seg","Ter","Qua","Qui","Sex","Sáb","Dom"];

  const horarios = [];

  for(let hora = 7; hora <= 23; hora++){

    for(let minuto = 0; minuto < 60; minuto += 10){

      if(hora === 23 && minuto > 0) break;

      horarios.push(
        String(hora).padStart(2,"0") +
        ":" +
        String(minuto).padStart(2,"0")
      );

    }

  }

  window.agendamentosMapa = {};

  const alturaLinha = 36;
  const inicioDia = 7 * 60;
  const fimDia = 23 * 60;

  const agora = new Date();
  const hojeISO = dataISO(agora);

  const minutosAgora =
    agora.getHours() * 60 +
    agora.getMinutes();

  let html = `
    ${montarPainelTopo()}
    ${montarBarraNavegacao()}

    
    <div class="agendaWrapper">
      <div class="agendaGrid">

        <div class="cabecalhoHora">
          Hora
        </div>
  `;

  dias.forEach((d,i)=>{

    html += `
      <div class="cabecalhoDia">
        <div class="diaNome">${nomes[i]}</div>
        <div class="diaData">
          ${String(d.getDate()).padStart(2,"0")}/
          ${String(d.getMonth()+1).padStart(2,"0")}
        </div>
      </div>
    `;

  });

  html += `<div class="colunaHora">`;

  horarios.forEach(h=>{

    const minutosHora =
      horaParaMinutos(h);

    const atual =
      hojeISO >= dataISO(dias[0]) &&
      hojeISO <= dataISO(dias[6]) &&
      minutosHora <= minutosAgora &&
      minutosHora + 10 > minutosAgora;

    html += `
      <div class="horaLinha ${atual ? "horaAtual" : ""}">
        ${atual ? "🕒 " : ""}${h}
      </div>
    `;

  });

  html += `</div>`;

  dias.forEach(dia=>{

    const dataCelula =
      dataISO(dia);

    html += `
      <div
        class="colunaDia"
        data-data="${dataCelula}"
        style="height:${horarios.length * alturaLinha}px;">
    `;

    if(
      dataCelula === hojeISO &&
      minutosAgora >= inicioDia &&
      minutosAgora <= fimDia
    ){

      const topAgora =
        ((minutosAgora - inicioDia) / 10) * alturaLinha;

      html += `
        <div
          class="linhaAgora"
          style="top:${topAgora}px;">
        </div>
      `;

    }

    const agendamentosDia =
      agendamentos.filter(a=>a.data === dataCelula);

    agendamentosDia.forEach(a=>{

      const inicio =
        horaParaMinutos(a.hora);

      const duracao =
        Number(a.servico_duracao || 30);

      const fim =
        minutosParaHora(inicio + duracao);

      const top =
        ((inicio - inicioDia) / 10) * alturaLinha;

      const altura =
        (duracao / 10) * alturaLinha;

      const inicioData =
        new Date(`${a.data}T${a.hora}`);

      const fimData =
        new Date(inicioData);

      fimData.setMinutes(
        fimData.getMinutes() + duracao
      );

      const minutosParaComecar =
        (inicioData - agora) / 60000;

      let classeStatus = "";
      let statusHTML = "";

      if(
        minutosParaComecar > 0 &&
        minutosParaComecar <= 15
      ){

        classeStatus = "proximoAtendimento";

        statusHTML = `
          <div class="statusCard">
            ⏰ Começa em breve
          </div>
        `;

      }

      if(
        agora >= inicioData &&
        agora < fimData
      ){

        classeStatus = "emAtendimento";

        statusHTML = `
          <div class="statusCard">
            🟢 Em atendimento
          </div>
        `;

      }

      window.agendamentosMapa[a.id] = {
        ...a,
        fim
      };

      html += `
        <div
          class="blocoAgendamento ${classeStatus}"
          data-id="${a.id}"
          style="
            top:${top}px;
            height:${altura - 4}px;
          ">

          ${statusHTML}

          <div class="blocoCliente">
            👤 ${a.cliente || ""}
          </div>

          <div class="blocoServico">
            ✂️ ${a.servico_nome || ""}
          </div>

          <div class="blocoHorario">
            ⏰ ${a.hora} - ${fim}
          </div>

        </div>
      `;

    });

    html += `</div>`;

  });

  html += `
      </div>
    </div>
  `;

  document.getElementById("agendaSemanal").innerHTML = html;

}

function montarPainelTopo(){

  return `
    <div class="cockpitWrapper">

      <button
        class="cockpitCabecalho"
        onclick="alternarCockpitAgenda()">

        <span>
          📊  Resumo da agenda
        </span>

        <strong
          id="cockpitSeta"
          class="cockpitSeta aberta">
          ❯
        </strong>

      </button>

      <div
        id="cockpitConteudo"
        class="cockpitConteudo aberto">

        <div class="painelSemana cockpitCompacto">

          <div class="cockpitArea cockpitInfo">

            <div class="cockpitLinhaTopo">
              <div class="badgeSistema">PRO AGEND</div>
              <div class="statusSistema">🟢 Atualizado agora</div>
            </div>

            <h1 id="saudacaoPainel">
              Agenda Semanal
            </h1>

            <p id="mensagemPainel">
              Sua agenda está pronta para hoje.
            </p>

            <div class="infoResumoCompacto">

              <div>
                <span>📅 Hoje</span>
                <strong id="dataHojePainel">--</strong>
              </div>

              <div>
                <span>⏰ Próximo</span>
                <strong id="proximoResumoPainel">--</strong>
                <small id="contadorProximoPainel"></small>
              </div>

              <div>
                <span>💡 Dica</span>
                <strong id="dicaPainel">--</strong>
              </div>

            </div>

          </div>

          <div class="cockpitArea cockpitCentro">

            <div class="progressoCompacto">

              <div class="cockpitProgressoTopo">
                <span>📊 Progresso do dia</span>
                <strong id="progressoDiaTexto">0%</strong>
              </div>

              <div class="barraProgresso">
                <div id="barraProgressoDia"></div>
              </div>

              <small id="fraseProgressoDia">
                Acompanhe os atendimentos de hoje.
              </small>

            </div>

          </div>

          <div class="cockpitArea cockpitIndicadores">

            <div class="indicadorMini">
              <span>📋</span>
              <strong id="totalSemana">0</strong>
              <small>Agenda</small>
            </div>

            <div class="indicadorMini">
              <span>💰</span>
              <strong id="faturamentoSemana">R$ 0,00</strong>
              <small>Semana</small>
            </div>

            <div class="indicadorMini">
              <span>⭐</span>
              <strong id="ticketSemana">R$ 0,00</strong>
              <small>Ticket</small>
            </div>

            <div class="indicadorMini">
              <span>📈</span>
              <strong id="ocupacaoSemana">0%</strong>
              <small>Ocupação</small>
            </div>

          </div>

        </div>

      </div>

    </div>
  `;

}
     


function semanaAnterior(){

  const input =
    document.getElementById("dataBase");

  const data =
    new Date(input.value + "T00:00:00");

  data.setDate(data.getDate() - 7);

  input.value = dataISO(data);

  carregarSemana();

}

function proximaSemana(){

  const input =
    document.getElementById("dataBase");

  const data =
    new Date(input.value + "T00:00:00");

  data.setDate(data.getDate() + 7);

  input.value = dataISO(data);

  carregarSemana();

}

function irParaHoje(){

  document.getElementById("dataBase").value =
    dataISO(new Date());

  carregarSemana();

}

async function atualizarSilencioso(){

  const profissional =
    document.getElementById("profissional").value;

  const data =
    document.getElementById("dataBase").value;

  if(!profissional || !data || atualizandoSilencioso){
    return;
  }

  atualizandoSilencioso = true;

  try{

    const dias =
      calcularDiasSemana(data);

    const inicio =
      dataISO(dias[0]);

    const fim =
      dataISO(dias[6]);

    const resposta =
      await fetch(`/agenda-semanal/${profissional}/${inicio}/${fim}`);

    const agendamentos =
      await resposta.json();

    const novaVersao =
      JSON.stringify(agendamentos);

    if(novaVersao !== ultimaVersaoAgenda){

      ultimaVersaoAgenda = novaVersao;

      montarTabela(dias, agendamentos);

      atualizarDashboardSemana(dias, agendamentos);

      document.querySelector(".statusSistema").innerText =
        "🟢 Atualizado agora";

    }

  }catch(erro){

    console.error("Erro na atualização silenciosa:", erro);

  }

  atualizandoSilencioso = false;

}

function iniciarEventosFixos(){

  document
    .getElementById("agendaSemanal")
    .addEventListener("click", e=>{

      const card =
        e.target.closest(".blocoAgendamento");

      if(!card) return;

      const id =
        card.dataset.id;

      abrirPainelAgendamentoPorId(id);

    });

  document
    .getElementById("agendaSemanal")
    .addEventListener("dblclick", e=>{

      const coluna =
        e.target.closest(".colunaDia");

      const card =
        e.target.closest(".blocoAgendamento");

      if(!coluna || card) return;

      const data =
        coluna.dataset.data;

      abrirNovoAgendamentoSemana(e, data);

    });

  document
    .getElementById("profissional")
    .addEventListener("change", ()=>{

      localStorage.setItem(
        "agendaProfissional",
        document.getElementById("profissional").value
      );

      carregarSemana();

    });

  document
    .getElementById("dataBase")
    .addEventListener("change", ()=>{

      localStorage.setItem(
        "agendaData",
        document.getElementById("dataBase").value
      );

      carregarSemana();

    });

}

(async ()=>{

  const dataSalva =
    localStorage.getItem("agendaData");

  document.getElementById("dataBase").value =
    dataSalva || dataISO(new Date());

  await carregarProfissionais();

  const profissionalSalvo =
    localStorage.getItem("agendaProfissional");

  if(profissionalSalvo){
    document.getElementById("profissional").value =
      profissionalSalvo;
  }

  iniciarEventosFixos();

  if(
    document.getElementById("profissional").value &&
    document.getElementById("dataBase").value
  ){
    carregarSemana();
  }

})();

function montarBarraNavegacao(){

  return `

    <div class="barraSemana">

      <button onclick="semanaAnterior()">
        ◀ Semana anterior
      </button>

      <button class="btnHoje" onclick="irParaHoje()">
        📅 Hoje
      </button>

      <button onclick="proximaSemana()">
        Próxima semana ▶
      </button>

    </div>

  `;

}

function alternarPainel(){

    const painel =
        document.querySelector(".cockpitCompacto");

    const botao =
        document.getElementById("btnToggleCockpit");

    painel.classList.toggle("cockpitFechado");

    if(painel.classList.contains("cockpitFechado")){

        botao.innerHTML =
            "▼ Painel";

    }else{

        botao.innerHTML =
            "▲ Painel";

    }

}

function alternarCockpitAgenda(){

  const conteudo =
    document.getElementById("cockpitConteudo");

  const seta =
    document.getElementById("cockpitSeta");

  if(!conteudo || !seta) return;

  conteudo.classList.toggle("aberto");

  seta.classList.toggle("aberta");

}


setInterval(
  atualizarSilencioso,
  30000
);