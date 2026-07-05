let agendamentoSelecionado = null;

function abrirPainelAgendamento(a, fim){

  agendamentoSelecionado = a;

  document.getElementById("conteudoPainel").innerHTML = `

    <div class="painelHeader">

      <h2>
        ${a.cliente || "Cliente"}
      </h2>

      <span>
        Detalhes do agendamento
      </span>

    </div>

    <div class="detalheBox">
      <div class="detalheLabel">Cliente</div>
      <div class="detalheValor">👤 ${a.cliente || "-"}</div>
    </div>

    <div class="detalheBox">
      <div class="detalheLabel">Telefone</div>
      <div class="detalheValor">📞 ${a.telefone || "-"}</div>
    </div>

    <div class="detalheBox">
      <div class="detalheLabel">Serviço</div>
      <div class="detalheValor">✂️ ${a.servico_nome || "-"}</div>
    </div>

    <div class="detalheBox">
      <div class="detalheLabel">Horário</div>
      <div class="detalheValor">⏰ ${a.hora} - ${fim}</div>
    </div>

    <div class="detalheBox">
      <div class="detalheLabel">Valor previsto</div>
      <div class="detalheValor">
        💰 R$ ${Number(a.servico_valor || 0).toFixed(2)}
      </div>
    </div>

    <div class="acoesPainel">

    <div
      id="historicoCliente"
      class="historicoCliente">
    </div>

      <button
        class="btnPainelEditar"
        onclick="editarPainel()">
        ✏️ Editar
      </button>

      <button
        class="btnPainelReagendar"
        onclick="reagendarPainel()">
        📅 Reagendar
      </button>

      <button
        class="btnPainelFinalizar"
        onclick="finalizarPainel()">
        ✅ Finalizar
      </button>

      <button
        class="btnPainelCancelar"
        onclick="cancelarPainel()">
        ❌ Cancelar
      </button>

    </div>

  `;

    carregarHistoricoCliente(a.telefone);

  document.getElementById("overlayPainel")
    .style.display = "block";

  document.getElementById("painelDetalhes")
    .classList.add("aberto");

}

function fecharPainel(){

  document.getElementById("overlayPainel")
    .style.display = "none";

  document.getElementById("painelDetalhes")
    .classList.remove("aberto");

}

async function editarPainel(){

  if(!agendamentoSelecionado) return;

  await carregarProfissionaisEditar();

  await carregarServicosEditarPorProfissional(
    agendamentoSelecionado.profissional_id
  );

  document.getElementById("conteudoPainel").innerHTML = `

  

  <div class="conteudoAnimado">

    <div class="painelHeader">
      <h2>Editar Agendamento</h2>
      <span>Altere os dados e salve</span>
      
    </div>

    <div class="detalheBox">
      <div class="detalheLabel">Cliente</div>
      <input id="editarCliente" value="${agendamentoSelecionado.cliente || ""}">
    </div>

    <div class="detalheBox">
      <div class="detalheLabel">Telefone</div>
      <input id="editarTelefone" value="${agendamentoSelecionado.telefone || ""}">
    </div>

    <div class="detalheBox">
      <div class="detalheLabel">Profissional</div>
      <select id="editarProfissional"></select>
    </div>

    <div class="detalheBox">
      <div class="detalheLabel">Serviço</div>
      <select id="editarServico"></select>
    </div>

    <div class="detalheBox">
      <div class="detalheLabel">Data</div>
      <input type="date" id="editarData" value="${agendamentoSelecionado.data || ""}">
    </div>

    <div class="detalheBox">
      <div class="detalheLabel">Hora</div>
      <input type="time" id="editarHora" value="${agendamentoSelecionado.hora || ""}">
    </div>

    <div class="acoesPainel">

      <button
        id="btnSalvarEdicao"
        class="btnPainelFinalizar"
        onclick="salvarEdicaoAgendamento()">
        💾 Salvar Alterações
      </button>

      <button
        class="btnPainelCancelar"
        onclick="abrirPainelAgendamento(agendamentoSelecionado, agendamentoSelecionado.fim)">
        Cancelar Edição
      </button>

    </div>

  `;

  await preencherSelectsEdicao();

}

function reagendarPainel(){

  if(!agendamentoSelecionado) return;

  alert(
    "Reagendar agendamento ID: " +
    agendamentoSelecionado.id
  );

}

function finalizarPainel(){

  if(!agendamentoSelecionado) return;

  alert(
    "Finalizar agendamento ID: " +
    agendamentoSelecionado.id
  );

}

async function cancelarPainel(){

  if(!agendamentoSelecionado) return;

  const confirmar =
    confirm("Deseja cancelar este agendamento?");

  if(!confirmar) return;

  await fetch(
    `/agendamentos/${agendamentoSelecionado.id}`,
    {
      method:"DELETE"
    }
  );

  fecharPainel();

  carregarSemana();

}

function abrirPainelAgendamentoPorId(id){

  const agendamento =
    window.agendamentosMapa[id];

  if(!agendamento){
    return;
  }

  abrirPainelAgendamento(
    agendamento,
    agendamento.fim
  );

}

async function carregarProfissionaisEditar(){

  const resposta =
    await fetch("/profissionais");

  profissionaisEdicao =
    await resposta.json();

}

async function carregarServicosEditarPorProfissional(profissionalId){

  const resposta =
    await fetch(`/profissionais/${profissionalId}/servicos`);

  servicosEdicao =
    await resposta.json();

}

function fecharModalEditar(){

  document.getElementById("modalEditar")
    .style.display = "none";

}

async function salvarEdicaoAgendamento(){

  if(!agendamentoSelecionado) return;

  const botao =
    document.getElementById("btnSalvarEdicao");

  if(botao){
    botao.disabled = true;
    botao.innerText = "Salvando...";
  }

  const dados = {
    cliente:document.getElementById("editarCliente").value.trim(),
    telefone:document.getElementById("editarTelefone").value.trim(),
    profissional_id:document.getElementById("editarProfissional").value,
    servico_id:document.getElementById("editarServico").value,
    data:document.getElementById("editarData").value,
    hora:document.getElementById("editarHora").value
  };

  const resposta =
    await fetch(`/agendamentos/${agendamentoSelecionado.id}`,{
      method:"PUT",
      headers:{
        "Content-Type":"application/json"
      },
      body:JSON.stringify(dados)
    });

  const resultado =
    await resposta.json();

  if(!resposta.ok){

    if(botao){
      botao.disabled = false;
      botao.innerText = "💾 Salvar Alterações";
    }

    alert(resultado.erro || "Erro ao editar agendamento.");
    return;

  }

  if(botao){
    botao.innerText = "✅ Alterado com sucesso";
  }

  setTimeout(async ()=>{

  await carregarSemana();

  agendamentoSelecionado = {
    ...agendamentoSelecionado,
    ...dados
  };

  abrirPainelAgendamento(
    agendamentoSelecionado,
    agendamentoSelecionado.fim
  );

  },1800);

}

async function carregarServicosEditarPorProfissional(profissionalId){

  const resposta =
    await fetch(`/profissionais/${profissionalId}/servicos`);

  servicosEdicao =
    await resposta.json();

}

async function preencherSelectsEdicao(){

  const selectProfissional =
    document.getElementById("editarProfissional");

  const selectServico =
    document.getElementById("editarServico");

  selectProfissional.innerHTML =
    profissionaisEdicao.map(p=>`
      <option value="${p.id}">
        ${p.nome}
      </option>
    `).join("");

  selectProfissional.value =
    agendamentoSelecionado.profissional_id;

  selectServico.innerHTML =
    servicosEdicao.map(s=>`
      <option value="${s.id}">
        ${s.nome} • R$ ${Number(s.valor).toFixed(2)}
      </option>
    `).join("");

  selectServico.value =
    agendamentoSelecionado.servico_id;

  selectProfissional.addEventListener("change", async()=>{

    await carregarServicosEditarPorProfissional(
      selectProfissional.value
    );

    selectServico.innerHTML =
      servicosEdicao.map(s=>`
        <option value="${s.id}">
          ${s.nome} • R$ ${Number(s.valor).toFixed(2)}
        </option>
      `).join("");

  });

}

async function carregarHistoricoCliente(telefone){

  const caixa =
    document.getElementById("historicoCliente");

  if(!caixa || !telefone) return;

  caixa.innerHTML = `
    <button
      class="historicoCabecalho"
      onclick="alternarHistoricoCliente()">

      <span id="historicoTitulo">
        🕘 Histórico do cliente
      </span>

      <strong
        id="historicoSeta"
        class="historicoSeta">
          ❯
      </strong>

    </button>

    <div
      id="historicoConteudo"
      class="historicoConteudo">

      <div class="historicoCarregando">
        Carregando histórico...
      </div>

    </div>
  `;

  const resposta =
    await fetch(
      "/cliente-historico/" +
      encodeURIComponent(telefone)
    );

  const historico =
    await resposta.json();

  const conteudo =
    document.getElementById("historicoConteudo");

  document.getElementById("historicoTitulo").innerText =
    `🕘 Histórico do cliente (${historico.length})`;

  if(!historico.length){

    conteudo.innerHTML = `
      <div class="historicoVazio">
        Este é o primeiro atendimento deste cliente.
      </div>
    `;

    return;

  }

  conteudo.innerHTML =
    historico.map(h=>`
      <div class="historicoItem">
        <strong>${h.servico_nome || "Serviço"}</strong>
        <span>
          ${formatarDataBR(h.data)} • ${h.hora}
        </span>
        <small>
          ${h.profissional_nome || "-"} • R$ ${Number(h.servico_valor || 0).toFixed(2)}
        </small>
      </div>
    `).join("");

}

function alternarHistoricoCliente(){

  const conteudo =
    document.getElementById("historicoConteudo");

  const seta =
    document.getElementById("historicoSeta");

  if(!conteudo || !seta) return;

  conteudo.classList.toggle("aberto");

  seta.classList.toggle("aberta");
}