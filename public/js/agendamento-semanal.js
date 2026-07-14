
let novoData = "";
let novoHoraSelecionada = "";
let horaSugeridaClique = "";

async function abrirNovoAgendamentoSemana(data, horaSugerida = ""){

  if(typeof data !== "string"){
    console.log("Data recebida errada:", data);
    return;
  }

  novoData = data;
  horaSugeridaClique = horaSugerida;
  novoHoraSelecionada = "";

  document.getElementById("modalNovoSemana").style.display =
    "flex";

  document.getElementById("infoHorarioNovo").innerText =
    "📅 Data: " + formatarDataBR(data);

  limparCamposNovo();

  const profissional =
    document.getElementById("profissional").value;

  if(!profissional){
    alert("Selecione um profissional na agenda.");
    fecharNovoSemana();
    return;
  }

  await carregarServicosNovo();

  document.getElementById("horariosNovoSemana").innerHTML =
    mensagemHorarioNovo(
      "✂️ Escolha um serviço",
      "Depois selecione o horário disponível."
    );

}

window.abrirNovoAgendamentoSemana =
  abrirNovoAgendamentoSemana;

function limparCamposNovo(){

  document.getElementById("novoCliente").value = "";
  document.getElementById("novoTelefone").value = "";
  document.getElementById("novoValor").value = "";

  const servico =
    document.getElementById("novoServico");

  if(servico){
    servico.innerHTML =
      `<option value="">Carregando serviços...</option>`;
  }

  const horarios =
    document.getElementById("horariosNovoSemana");

  if(horarios){
    horarios.innerHTML = "";
  }

}

async function carregarServicosNovo(){

  const profissional =
    document.getElementById("profissional").value;

  if(!profissional) return;

  const resposta =
    await fetch(`/profissionais/${profissional}/servicos`);

  const servicos =
    await resposta.json();

  document.getElementById("novoServico").innerHTML =
    `<option value="">Selecione o serviço</option>` +
    servicos.map(s=>`
      <option
        value="${s.id}"
        data-valor="${s.valor}"
        data-duracao="${s.duracao}">
        ${s.nome} • R$ ${Number(s.valor).toFixed(2)} • ${s.duracao} min
      </option>
    `).join("");

}

function atualizarValorNovo(){


  const select =
    document.getElementById("novoServico");

  const valor =
    select.selectedOptions[0]?.dataset.valor || 0;

  document.getElementById("novoValor").value =
    "R$ " + Number(valor).toFixed(2);

    

}

function fecharNovoSemana(){

  document.getElementById("modalNovoSemana").style.display =
    "none";

}

function mensagemHorarioNovo(titulo, texto){

  return `
    <div class="mensagemHorarioNovo">

      <div class="iconeMensagemHorario">
        💡
      </div>

      <div class="textoMensagemHorario">

        <strong>
          ${titulo}
        </strong>

        <span>
          ${texto}
        </span>

      </div>

    </div>
  `;

}

function aoTrocarServicoNovo(){

  atualizarValorNovo();

  carregarHorariosNovoSemana();

}

async function carregarHorariosNovoSemana(){

  novoHoraSelecionada = "";

  const profissional =
    document.getElementById("profissional").value;

  const servico =
    document.getElementById("novoServico");

  const caixa =
    document.getElementById("horariosNovoSemana");

  if(!profissional || !servico.value){

    caixa.innerHTML =
      mensagemHorarioNovo(
        "✂️ Escolha um serviço",
        "Depois selecione o horário disponível."
      );

    return;

  }

  const duracao =
    Number(
      servico.selectedOptions[0]?.dataset.duracao || 30
    );

  const respProf =
    await fetch(`/profissionais/${profissional}`);

  const prof =
    await respProf.json();

  const respAgenda =
    await fetch(`/agenda/${novoData}`);

  const agenda =
    await respAgenda.json();

  const horarios = gerarHorariosPorDuracao(
    prof.hora_inicio,
    prof.hora_fim,
    duracao
  );

  const livres =
    horarios.filter(h=>{

      const inicioNovo =
        horaParaMinutos(h);

      const fimNovo =
        inicioNovo + duracao;

      const hoje =
        dataHojeLocal();

      const agora =
        new Date();

      const minutosAgora =
        agora.getHours() * 60 +
        agora.getMinutes();

      const margemMinutos = 5;

      if(
        novoData === hoje &&
        inicioNovo <= minutosAgora + margemMinutos
      ){
        return false;
      }  

      const conflito =
        agenda.find(a=>{

          if(a.profissional_id != profissional){
            return false;
          }

          const inicioExistente =
            horaParaMinutos(a.hora);

          const fimExistente =
            inicioExistente +
            Number(a.servico_duracao || 30);

          return (
            inicioNovo < fimExistente &&
            fimNovo > inicioExistente
          );

        });

      return !conflito;

    });

  if(!livres.length){

    caixa.innerHTML =
      mensagemHorarioNovo(
        "😕 Nenhum horário disponível",
        "Escolha outro dia ou outro profissional."
      );

    return;

  }

  const horaInicial =
  livres.includes(horaSugeridaClique)
  ? horaSugeridaClique
  : livres[0];

  novoHoraSelecionada =
    horaInicial;

  caixa.innerHTML =
    livres.map(h=>`
      <div
        class="horaNovoSemana ${h === horaInicial ? "selecionado sugerido" : ""}"
        onclick="selecionarHoraNovoSemana('${h}', this)">
        ${h}
      </div>
    `).join("");

  document.getElementById("infoHorarioNovo").innerText =
    "📅 Data: " +
    formatarDataBR(novoData) +
    " • ⏰ Horário: " +
    horaInicial;

}

function dataHojeLocal(){

  const hoje =
    new Date();

  return hoje.getFullYear() +
    "-" +
    String(hoje.getMonth() + 1).padStart(2,"0") +
    "-" +
    String(hoje.getDate()).padStart(2,"0");

}

function gerarHorariosPorDuracao(inicio, fim, duracao){

  const lista = [];

  let atual =
    horaParaMinutos(inicio);

  const limite =
    horaParaMinutos(fim);

  while(atual + duracao <= limite){

    lista.push(
      minutosParaHora(atual)
    );

    atual += duracao;

  }

  return lista;

}

function selecionarHoraNovoSemana(hora, botao){

  novoHoraSelecionada = hora;

  document
    .querySelectorAll(".horaNovoSemana")
    .forEach(b=>b.classList.remove("selecionado"));

  botao.classList.add("selecionado");

  document.getElementById("infoHorarioNovo").innerText =
  "📅 Data: " + formatarDataBR(novoData) +
  " • ⏰ Horário: " + hora;

}

window.selecionarHoraNovoSemana =
  selecionarHoraNovoSemana;

async function salvarNovoSemana(){

  const cliente =
    document.getElementById("novoCliente").value.trim();

  const telefone =
    document.getElementById("novoTelefone").value.trim();

  const servico_id =
    document.getElementById("novoServico").value;

  const profissional_id =
    document.getElementById("profissional").value;

  if(!cliente){
    alert("Informe o cliente.");
    return;
  }

  if(!telefone){
    alert("Informe o telefone.");
    return;
  }

  if(!servico_id){
    alert("Selecione o serviço.");
    return;
  }

  if(!novoHoraSelecionada){
    alert("Selecione um horário.");
    return;
  }

  const resposta =
    await fetch("/agendamentos",{
      method:"POST",
      headers:{
        "Content-Type":"application/json"
      },
      body:JSON.stringify({
        cliente,
        telefone,
        servico_id,
        profissional_id,
        data:novoData,
        hora:novoHoraSelecionada
      })
    });

  const dados =
    await resposta.json();

  if(!resposta.ok){
    alert(dados.erro);
    return;
  }

  fecharNovoSemana();

  carregarSemana();

}

const novoServico =
  document.getElementById("novoServico");

if(novoServico){

  novoServico.addEventListener("change", ()=>{

    atualizarValorNovo();
    carregarHorariosNovoSemana();

  });

}