let ultimaVersaoAgenda = "";
let atualizandoSilencioso = false;
let agendamentosAtuais = [];
let eventosFixosIniciados = false;
let profissionaisAgenda = [];

async function carregarProfissionais(){

  const resposta =
    await fetch("/profissionais");

  if(!resposta.ok){
    throw new Error("Não foi possível carregar os profissionais.");
  }

  profissionaisAgenda =
    await resposta.json();

  const select =
    document.getElementById("profissional");

  if(!select) return;

  select.innerHTML =
    `<option value="">Selecione o profissional</option>` +
    profissionaisAgenda.map(p=>`
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

  agendamentosAtuais =
    agendamentos;

  ultimaVersaoAgenda =
    JSON.stringify(agendamentos);

  montarTabela(dias, agendamentos);

  atualizarTituloPeriodo();
  atualizarBotaoHojeAgora();

  atualizarLinhaAgora();

  atualizarDashboardSemana(dias, agendamentos);

  atualizarCockpitAoVivo();

}

function atualizarCockpitAoVivo(){

  if(!agendamentosAtuais.length) return;

  atualizarPainelInteligente(
    agendamentosAtuais
  );

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

  const alturaLinha = 32;
  const inicioDia = 7 * 60;
  const fimDia = 23 * 60;

  const agora = new Date();
  const hojeISO = dataISO(agora);

  const minutosAgora =
    agora.getHours() * 60 +
    agora.getMinutes();

  let html = `
    ${montarPainelTopo()}

    <div class="agendaWrapper">
      <div class="agendaGrid">

        <div class="cabecalhoHora">
          Hora
        </div>
  `;

  dias.forEach((d,i)=>{

    html += `
      <div class="cabecalhoDia ${dataISO(d) === hojeISO ? "diaHoje" : ""}">
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

    const horaCheia =
    h.endsWith(":00");

    const minutosHora =
      horaParaMinutos(h);

    const atual =
      hojeISO >= dataISO(dias[0]) &&
      hojeISO <= dataISO(dias[6]) &&
      minutosHora <= minutosAgora &&
      minutosHora + 10 > minutosAgora;

    html += `
      <div class="horaLinha ${atual ? "horaAtual" : ""} ${h.endsWith(":00") ? "horaCheia" : ""}">
        ${atual ? " " : ""}${h}
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

      let classeStatus = "agendado";
      let statusHTML = `
        <div class="statusCard statusAgendado">
          📅 Agendado
        </div>
      `;

      if(a.status === "Finalizado"){

  classeStatus =
    "finalizadoTempo";

  statusHTML = `
    <div class="statusCard statusFinalizado">
      ✔ Finalizado
    </div>
  `;

}else{

  if(
    minutosParaComecar > 0 &&
    minutosParaComecar <= 15
  ){

    classeStatus =
      "proximoAtendimento";

    statusHTML = `
      <div class="statusCard statusProximo">
        ⏰ Começa em breve
      </div>
    `;

  }

  if(
    agora >= inicioData &&
    agora < fimData
  ){

    classeStatus =
      "emAtendimento";

    statusHTML = `
      <div class="statusCard statusAtendimento">
        🟢 Em atendimento
      </div>
    `;

  }

  if(agora >= fimData){

    classeStatus =
      "finalizadoTempo";

    statusHTML = `
      <div class="statusCard statusFinalizado">
        ✔ Finalizado às ${fim}
      </div>
    `;

  }

}

      if(
        minutosParaComecar > 0 &&
        minutosParaComecar <= 15
      ){

       classeStatus = "proximoAtendimento";

       statusHTML = `
      <div class="statusCard statusProximo">
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
      <div class="statusCard statusAtendimento">
        🟢 Em atendimento
      </div>
    `;

  }

if(
  agora >= fimData
){

  classeStatus = "finalizadoTempo";

  statusHTML = `
    <div class="statusCard statusFinalizado">
      ✔ Finalizado às ${fim}
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
          data-data="${a.data}"
          data-hora="${a.hora}"
          data-duracao="${duracao}"
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
          class="cockpitSeta aberto">
          ❯
        </strong>

      </button>

      <div
        id="cockpitConteudo"
        class="cockpitConteudo ">

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
     


async function semanaAnterior(){

  const input =
    document.getElementById("dataBase");

  const data =
    new Date(input.value + "T00:00:00");

  data.setDate(data.getDate() - 7);

  input.value = dataISO(data);

  await carregarSemana();

}

async function proximaSemana(){

  const input =
    document.getElementById("dataBase");

  const data =
    new Date(input.value + "T00:00:00");

  data.setDate(data.getDate() + 7);

  input.value = dataISO(data);

  await carregarSemana();

}

async function irParaHoje(){

  document.getElementById("dataBase").value =
    dataISO(new Date());

  await carregarSemana();

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
      agendamentosAtuais = agendamentos;

      montarTabela(dias, agendamentos);

      atualizarTituloPeriodo();

      atualizarDashboardSemana(dias, agendamentos);

      atualizarBotaoHojeAgora();

      document.querySelector(".statusSistema").innerText =
        "🟢 Atualizado agora";

    }

  }catch(erro){

    console.error("Erro na atualização silenciosa:", erro);

  }

  atualizandoSilencioso = false;

}

function atualizarLinhaAgora(){

  const agora =
    new Date();

  const hojeISO =
    dataISO(agora);

  const minutosAgora =
    agora.getHours() * 60 +
    agora.getMinutes();
 

  const inicioDia =
    7 * 60;

  const fimDia =
    23 * 60;

  const alturaLinha =
    32;

  const indiceHoraAtual =
    Math.floor((minutosAgora - inicioDia) / 10);  
  
  document
    .querySelectorAll(".horaLinha")
    .forEach(linha=>
      linha.classList.remove("horaAtual")
    );  

  document
    .querySelectorAll(".colunaDia")
    .forEach(coluna=>{

      const dataColuna =
        coluna.dataset.data;

      let linha =
        coluna.querySelector(".linhaAgora");

      if(
        dataColuna !== hojeISO ||
        minutosAgora < inicioDia ||
        minutosAgora > fimDia
      ){

        if(linha){
          linha.remove();
        }

        return;

      }

      const topAgora =
        ((minutosAgora - inicioDia) / 10) * alturaLinha;

      if(!linha){

        linha =
          document.createElement("div");

        linha.className =
          "linhaAgora";

        coluna.appendChild(linha);

      }

      linha.style.top =
        topAgora + "px";

    });

  const linhasHora =
    document.querySelectorAll(".horaLinha");

  if(
    indiceHoraAtual >= 0 &&
    indiceHoraAtual < linhasHora.length
  ){

    linhasHora[indiceHoraAtual]
      .classList.add("horaAtual");

  }  

  atualizarStatusCardsAoVivo();

}

function iniciarEventosFixos(){

  if(eventosFixosIniciados){
    return;
  }

  eventosFixosIniciados = true;

  const agenda =
    document.getElementById("agendaSemanal");

  agenda?.addEventListener("click", e=>{

    const card =
      e.target.closest(".blocoAgendamento");

    if(card){
      abrirPainelAgendamentoPorId(
        card.dataset.id
      );
      return;
    }

    const coluna =
      e.target.closest(".colunaDia");

    if(!coluna) return;

    const rect =
      coluna.getBoundingClientRect();

    const y =
      e.clientY - rect.top;

    const alturaLinha = 32;
    const inicioDia = 7 * 60;

    const linha =
      Math.floor(y / alturaLinha);

    const minutos =
      inicioDia + (linha * 10);

    abrirNovoAgendamentoSemana(
      coluna.dataset.data,
      minutosParaHora(minutos)
    );

  });

  document
    .getElementById("profissional")
    ?.addEventListener("change", ()=>{

      localStorage.setItem(
        "agendaProfissional",
        document.getElementById("profissional").value
      );

      carregarSemana();

    });

  document
    .getElementById("dataBase")
    ?.addEventListener("change", ()=>{

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
  atualizarTituloPeriodo();
  atualizarBotaoHojeAgora();

  if(
    document.getElementById("profissional").value &&
    document.getElementById("dataBase").value
  ){
    carregarSemana();
  }

})();

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

function atualizarStatusCardsAoVivo(){

  const agora =
    new Date();

  document
    .querySelectorAll(".blocoAgendamento")
    .forEach(card=>{

      const data =
        card.dataset.data;

      const hora =
        card.dataset.hora;

      const duracao =
        Number(card.dataset.duracao);

      const status =
        card.querySelector(".statusCard");

      if(!status) return;

      const inicio =
        new Date(`${data}T${hora}`);

      const fim =
        new Date(inicio);

      fim.setMinutes(
        fim.getMinutes() + duracao
      );

      const minutosParaComecar =
        (inicio - agora) / 60000;

      let novaClasseCard = "agendado";
      let novaClasseStatus = "statusCard statusAgendado";
      let novoTexto = "📅 Agendado";

      if(
        minutosParaComecar > 0 &&
        minutosParaComecar <= 15
      ){
        novaClasseCard = "proximoAtendimento";
        novaClasseStatus = "statusCard statusProximo";
        novoTexto = "⏰ Começa em breve";
      }

      if(
        agora >= inicio &&
        agora < fim
      ){
        novaClasseCard = "emAtendimento";
        novaClasseStatus = "statusCard statusAtendimento";
        novoTexto = "🟢 Em atendimento";
      }

      if(agora >= fim){
        novaClasseCard = "finalizadoTempo";
        novaClasseStatus = "statusCard statusFinalizado";
        novoTexto =
          `✔ Finalizado às ${minutosParaHora(
            horaParaMinutos(hora) + duracao
          )}`;
      }

      const id =
        card.dataset.id;

      const agendamento =
         window.agendamentosMapa?.[id];

      if(agendamento?.status === "Finalizado"){

       card.classList.remove(
        "agendado",
        "proximoAtendimento",
        "emAtendimento",
        "finalizadoTempo"
      );

      card.classList.add(
        "finalizadoTempo"
      );

      status.className =
        "statusCard statusFinalizado";

      status.innerHTML =
       "✔ Finalizado";

      card.dataset.statusAtual =
        "finalizadoTempo";

      return;

    }

      const statusAtual =
        card.dataset.statusAtual;

      if(statusAtual === novaClasseCard){
        return;
      }

      card.dataset.statusAtual =
        novaClasseCard;

      card.classList.remove(
        "agendado",
        "proximoAtendimento",
        "emAtendimento",
        "finalizadoTempo"
      );

      card.classList.add(
        novaClasseCard
      );

      status.className =
        novaClasseStatus;

      status.innerHTML =
        novoTexto;

      status.classList.remove("statusMudou");

      void status.offsetWidth;

      status.classList.add("statusMudou");

    });

}

function atualizarTituloPeriodo(){

  const campoData =
    document.getElementById("dataBase");

  const titulo =
    document.getElementById("tituloPeriodo");

  if(!campoData?.value || !titulo){
    return;
  }

  const dias =
    calcularDiasSemana(campoData.value);

  const inicio = dias[0];
  const fim = dias[6];

  const formatoMes =
    new Intl.DateTimeFormat(
      "pt-BR",
      { month:"long" }
    );

  const mesInicio =
    formatoMes.format(inicio);

  const mesFim =
    formatoMes.format(fim);

  const anoInicio =
    inicio.getFullYear();

  const anoFim =
    fim.getFullYear();

  let texto;

  if(
    inicio.getMonth() === fim.getMonth() &&
    anoInicio === anoFim
  ){
    texto = `${mesInicio} de ${anoInicio}`;
  }else if(anoInicio === anoFim){
    texto = `${mesInicio} – ${mesFim} de ${anoInicio}`;
  }else{
    texto = `${mesInicio} ${anoInicio} – ${mesFim} ${anoFim}`;
  }

  titulo.textContent =
    texto.charAt(0).toUpperCase() + texto.slice(1);

}

function abrirMenuPrincipal(){

  const menu =
    document.getElementById("menuPrincipal");

  const overlay =
    document.getElementById("overlayMenu");

  if(!menu || !overlay){
    return;
  }

  menu.classList.add("aberto");
  overlay.classList.add("aberto");

  document.body.classList.add("menuAberto");

}

function fecharMenuPrincipal(){

  const menu =
    document.getElementById("menuPrincipal");

  const overlay =
    document.getElementById("overlayMenu");

  if(!menu || !overlay){
    return;
  }

  menu.classList.remove("aberto");
  overlay.classList.remove("aberto");

  document.body.classList.remove("menuAberto");

}

function sairSistema(){

  localStorage.removeItem("token");

  window.location.href =
    "/index.html";

}

function semanaAtualEstaVisivel(){

  const dataBase =
    document.getElementById("dataBase")?.value;

  if(!dataBase){
    return false;
  }

  const dias =
    calcularDiasSemana(dataBase);

  const hoje =
    dataISO(new Date());

  const inicioSemana =
    dataISO(dias[0]);

  const fimSemana =
    dataISO(dias[6]);

  return (
    hoje >= inicioSemana &&
    hoje <= fimSemana
  );

}

function atualizarBotaoHojeAgora(){

  const botao =
    document.getElementById("btnHojeAgora");

  if(!botao) return;

  const icone =
    botao.querySelector(".btnHojeIcone");

  const texto =
    botao.querySelector(".btnHojeTexto");

  const semanaAtual =
    semanaAtualEstaVisivel();

  if(icone){
    icone.textContent = semanaAtual ? "🕒" : "📅";
  }

  if(texto){
    texto.textContent = semanaAtual ? "Agora" : "Hoje";
  }

  botao.title = semanaAtual
    ? "Ir para o horário atual"
    : "Voltar para a semana atual";

}

async function acaoHojeAgora(event){

  event?.preventDefault();

  if(semanaAtualEstaVisivel()){

    atualizarLinhaAgora();
    atualizarBotaoHojeAgora();

    setTimeout(()=>{
      irParaLinhaAgora();
    },100);

    return;
  }

  await irParaHoje();

  setTimeout(()=>{

    atualizarLinhaAgora();
    atualizarBotaoHojeAgora();
    irParaLinhaAgora();

  },500);

}

function irParaLinhaAgora(){

  const linhaAgora =
    document.querySelector(".linhaAgora");

  if(!linhaAgora){
    console.log("Linha Agora não encontrada.");
    return;
  }

  linhaAgora.scrollIntoView({
    behavior:"smooth",
    block:"center",
    inline:"nearest"
  });

}

setInterval(
  atualizarLinhaAgora,
  60000
);

setInterval(
  atualizarSilencioso,
  30000
);

setInterval(
  atualizarCockpitAoVivo,
  60000
);