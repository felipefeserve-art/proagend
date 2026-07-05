let novoData = "";
let novoHora = "";

async function abrirNovoAgendamentoSemana(event, data){

  const profissional =
    document.getElementById("profissional").value;

  if(!profissional){
    alert("Selecione um profissional.");
    return;
  }

  const coluna =
    event.currentTarget;

  const rect =
    coluna.getBoundingClientRect();

  const y =
  event.offsetY;

  const alturaLinha = 36;
  const inicioDia = 7 * 60;

  const linha =
    Math.floor(y / alturaLinha);

  const minutos =
    inicioDia + (linha * 10);

  novoHora =
    minutosParaHora(minutos);

  novoData = data;

  await carregarServicosNovo(profissional);

  document.getElementById("novoCliente").value = "";
  document.getElementById("novoTelefone").value = "";
  document.getElementById("novoValor").value = "";

  document.getElementById("infoHorarioNovo").innerText =
    `📅 ${novoData}  ⏰ ${novoHora}`;

  document.getElementById("modalNovoSemana")
    .style.display = "flex";

}

async function carregarServicosNovo(profissional){

  const resposta =
    await fetch(`/profissionais/${profissional}/servicos`);

  const servicos =
    await resposta.json();

  document.getElementById("novoServico").innerHTML =
    `<option value="">Selecione o serviço</option>` +
    servicos.map(s=>`
      <option
        value="${s.id}"
        data-valor="${s.valor}">
        ${s.nome} • R$ ${Number(s.valor).toFixed(2)}
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

  document.getElementById("modalNovoSemana")
    .style.display = "none";

}

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
        hora:novoHora
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