let agendamentoSelecionado = null;

let editarHoraSelecionada = "";

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
        ✏️ Editar / Reagendar 
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

    <div class="detalheLabel">
      Horários disponíveis
    </div>

    <div
      id="editarHorariosDisponiveis"
      class="editarHorariosDisponiveis">

      <div class="editarHorarioMensagem">
        Carregando horários...
      </div>

    </div>

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

  editarHoraSelecionada =
  agendamentoSelecionado.hora || "";

await carregarHorariosDisponiveisEdicao();

}


async function finalizarPainel(){

  if(!agendamentoSelecionado) return;

  const confirmar =
    confirm(
      `Deseja finalizar o atendimento de ${
        agendamentoSelecionado.cliente || "este cliente"
      }?`
    );

  if(!confirmar) return;

  const botao =
    document.querySelector(".btnPainelFinalizar");

  if(botao){

    botao.disabled = true;
    botao.innerText = "⏳ Finalizando...";

  }

  try{

    const resposta =
      await fetch(
        `/agendamentos/${agendamentoSelecionado.id}/finalizar`,
        {
          method:"PATCH"
        }
      );

    const resultado =
      await resposta.json();

    if(!resposta.ok){

      throw new Error(
        resultado.erro ||
        "Não foi possível finalizar o atendimento."
      );

    }

    if(botao){

      botao.innerText =
        "✅ Atendimento finalizado";

    }

    agendamentoSelecionado.status =
      "Finalizado";

    setTimeout(async()=>{

      fecharPainel();

      await carregarSemana();

    },700);

  }catch(erro){

    console.error(
      "Erro ao finalizar atendimento:",
      erro
    );

    if(botao){

      botao.disabled = false;
      botao.innerText =
        "✅ Finalizar";

    }

    alert(erro.message);

  }

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
    hora:editarHoraSelecionada
  };

  if(!editarHoraSelecionada){

  alert(
    "Selecione um horário disponível."
  );

  return;

}

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

    <option
      value="${s.id}"
      data-duracao="${s.duracao}">

      ${s.nome} •
      R$ ${Number(s.valor).toFixed(2)} •
      ${s.duracao} min

    </option>

  `).join("");

  selectServico.value =
    agendamentoSelecionado.servico_id;

  selectProfissional.addEventListener(
  "change",
  async()=>{

    await carregarServicosEditarPorProfissional(
      selectProfissional.value
    );

    selectServico.innerHTML =
      servicosEdicao.map(s=>`

        <option
          value="${s.id}"
          data-duracao="${s.duracao}">

          ${s.nome} •
          R$ ${Number(s.valor).toFixed(2)} •
          ${s.duracao} min

        </option>

      `).join("");

    await carregarHorariosDisponiveisEdicao();

  }
);

selectServico.addEventListener(
  "change",
  carregarHorariosDisponiveisEdicao
);

document
  .getElementById("editarData")
  ?.addEventListener(
    "change",
    carregarHorariosDisponiveisEdicao
  );

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

  conteudo.innerHTML = `

  <div class="cabecalhoHistorico">

    <div class="tituloHistorico">
        📚 Histórico do Cliente
    </div>

    <div class="subTituloHistorico">
        Últimos 20 atendimentos
    </div>

  </div>

  ` + historico.map(h=>{

    const status =
      h.status || "Agendado";

    let classeStatus =
      "historicoStatusAgendado";

    let textoStatus =
      "📅 Agendado";

    if(status === "Finalizado"){

      classeStatus =
        "historicoStatusFinalizado";

      textoStatus =
        "✅ Finalizado";

    }

    if(status === "Cancelado"){

      classeStatus =
        "historicoStatusCancelado";

      textoStatus =
        "❌ Cancelado";

    }

    return `

      <div class="historicoItem">

        <div class="historicoItemTopo">

          <strong>
            ${h.servico_nome || "Serviço"}
          </strong>

          <span class="historicoStatus ${classeStatus}">
            ${textoStatus}
          </span>

        </div>

        <span>
          📅 ${formatarDataBR(h.data)} • ⏰ ${h.hora}
        </span>

        <small>
          👤 ${h.profissional_nome || "-"}
        </small>

        <small>
          💰 R$ ${Number(h.servico_valor || 0).toFixed(2)}
        </small>

      </div>

    `;

  }).join("");

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

async function carregarHorariosDisponiveisEdicao(){

  const caixa =
    document.getElementById(
      "editarHorariosDisponiveis"
    );

  const profissional =
    document.getElementById(
      "editarProfissional"
    )?.value;

  const servicoSelect =
    document.getElementById(
      "editarServico"
    );

  const data =
    document.getElementById(
      "editarData"
    )?.value;

  if(
    !caixa ||
    !profissional ||
    !servicoSelect?.value ||
    !data
  ){
    return;
  }

  editarHoraSelecionada = "";

  caixa.innerHTML = `
    <div class="editarHorarioMensagem">
      Carregando horários...
    </div>
  `;

  try{

    const respostaProfissional =
      await fetch(
        `/profissionais/${profissional}`
      );

    if(!respostaProfissional.ok){
      throw new Error(
        "Não foi possível carregar o profissional."
      );
    }

    const profissionalDados =
      await respostaProfissional.json();

    const respostaAgenda =
      await fetch(`/agenda/${data}`);

    if(!respostaAgenda.ok){
      throw new Error(
        "Não foi possível carregar a agenda."
      );
    }

    const agenda =
      await respostaAgenda.json();

    const duracao =
      Number(
        servicoSelect
          .selectedOptions[0]
          ?.dataset.duracao || 30
      );

    const horarios =
      gerarHorariosEdicao(
        profissionalDados.hora_inicio,
        profissionalDados.hora_fim,
        duracao
      );

    const livres =
      horarios.filter(hora=>{

        const inicioNovo =
          horaParaMinutos(hora);

        const fimNovo =
          inicioNovo + duracao;

        const conflito =
          agenda.some(a=>{

            // Ignora o próprio agendamento editado
            if(
              Number(a.id) ===
              Number(agendamentoSelecionado.id)
            ){
              return false;
            }

            if(
              Number(a.profissional_id) !==
              Number(profissional)
            ){
              return false;
            }

            const inicioExistente =
              horaParaMinutos(a.hora);

            const fimExistente =
              inicioExistente +
              Number(
                a.servico_duracao || 30
              );

            return (
              inicioNovo < fimExistente &&
              fimNovo > inicioExistente
            );

          });

        return !conflito;

      });

    if(!livres.length){

      caixa.innerHTML = `
        <div class="editarHorarioMensagem">
          Nenhum horário disponível para esta combinação.
        </div>
      `;

      return;

    }

    const horarioAtualDisponivel =
      livres.includes(
        agendamentoSelecionado.hora
      );

    editarHoraSelecionada =
      horarioAtualDisponivel
        ? agendamentoSelecionado.hora
        : livres[0];

    caixa.innerHTML =
      livres.map(hora=>`

        <button
          type="button"
          class="editarHoraOpcao ${
            hora === editarHoraSelecionada
              ? "selecionado"
              : ""
          }"
          onclick="selecionarHoraEdicao(
            '${hora}',
            this
          )">

          ${hora}

        </button>

      `).join("");

  }catch(erro){

    console.error(
      "Erro ao carregar horários da edição:",
      erro
    );

    caixa.innerHTML = `
      <div class="editarHorarioMensagem erro">
        Não foi possível carregar os horários.
      </div>
    `;

  }

}

function gerarHorariosEdicao(
  inicio,
  fim,
  duracao
){

  const horarios = [];

  let atual =
    horaParaMinutos(inicio);

  const limite =
    horaParaMinutos(fim);

  while(atual + duracao <= limite){

    horarios.push(
      minutosParaHora(atual)
    );

    atual += duracao;

  }

  return horarios;

}

function selecionarHoraEdicao(
  hora,
  botao
){

  editarHoraSelecionada = hora;

  document
    .querySelectorAll(".editarHoraOpcao")
    .forEach(item=>
      item.classList.remove("selecionado")
    );

  botao.classList.add("selecionado");

}