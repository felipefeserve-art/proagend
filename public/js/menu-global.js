(function(){

  function obterPaginaAtual(){

    const caminho =
      window.location.pathname.toLowerCase();

    if(caminho.includes("agenda")){
      return "agenda";
    }

    if(caminho.includes("servicos")){
      return "servicos";
    }

    if(caminho.includes("profissionais")){
      return "profissionais";
    }

    if(caminho.includes("clientes")){
      return "clientes";
    }

    if(caminho.includes("caixa")){
      return "caixa";
    }

    if(caminho.includes("relatorios")){
      return "relatorios";
    }

    if(caminho.includes("configuracoes")){
      return "configuracoes";
    }

    return "dashboard";

  }

  function linkMenu({
  pagina,
  href,
  icone,
  texto,
  disponivel = true
}){

  const ativo =
    obterPaginaAtual() === pagina
      ? "ativo"
      : "";

  if(!disponivel){

    return `
      <div
        class="menuItemIndisponivel"
        title="Página disponível em breve">

        <span>${icone}</span>

        <div class="menuItemTexto">
          ${texto}
          <small>Em breve</small>
        </div>

      </div>
    `;

  }

  return `
    <a
      href="${href}"
      class="${ativo}"
      data-pagina="${pagina}">

      <span>${icone}</span>

      ${texto}

    </a>
  `;

}

  function montarMenuGlobal(){

    const container =
      document.getElementById(
        "menuGlobal"
      );

    if(!container){
      return;
    }

    container.innerHTML = `

      <div
        id="overlayMenu"
        class="overlayMenu"
        onclick="fecharMenuPrincipal()">
      </div>

      <aside
        id="menuPrincipal"
        class="menuPrincipal">

        <div class="menuTopo">

          <div class="menuMarca">

            <div class="menuLogo">
              PA
            </div>

            <div>
              <strong>PRO AGEND</strong>
              <span>Sistema de Agendamento</span>
            </div>

          </div>

          <button
            type="button"
            class="btnFecharMenu"
            onclick="fecharMenuPrincipal()"
            aria-label="Fechar menu">
            ×
          </button>

        </div>

        <nav class="menuNavegacao">

  <div class="menuGrupo">

    <div class="menuGrupoTitulo">
      Principal
    </div>

    ${linkMenu({
      pagina:"dashboard",
      href:"/dashboard.html",
      icone:"🏠",
      texto:"Dashboard"
      
    })}

  </div>


  <div class="menuGrupo">

    <div class="menuGrupoTitulo">
      Agenda
    </div>

    ${linkMenu({
      pagina:"agenda",
      href:"/agenda-semanal.html",
      icone:"📅",
      texto:"Agenda",
      disponivel:true
    })}

    ${linkMenu({
      pagina:"clientes",
      href:"/clientes.html",
      icone:"👥",
      texto:"Clientes"
    })}

  </div>


  <div class="menuGrupo">

    <div class="menuGrupoTitulo">
      Cadastros
    </div>

    ${linkMenu({
      pagina:"servicos",
      href:"/servicos.html",
      icone:"✂️",
      texto:"Serviços"
    })}

    ${linkMenu({
      pagina:"profissionais",
      href:"/profissionais.html",
      icone:"👤",
      texto:"Profissionais"
    })}

  </div>


  <div class="menuGrupo">

    <div class="menuGrupoTitulo">
      Financeiro
    </div>

    ${linkMenu({
      pagina:"caixa",
      href:"/caixa.html",
      icone:"💰",
      texto:"Caixa",
      disponivel:false
      
    })}

    ${linkMenu({
      pagina:"relatorios",
      href:"/relatorios.html",
      icone:"📊",
      texto:"Relatórios",
      disponivel:false
    })}

  </div>


  <div class="menuGrupo">

    <div class="menuGrupoTitulo">
      Sistema
    </div>

    ${linkMenu({
      pagina:"configuracoes",
      href:"/configuracoes.html",
      icone:"⚙️",
      texto:"Configurações"
    })}

  </div>

</nav>

        <div class="menuRodape">

          <button
            type="button"
            class="btnSairMenu"
            onclick="sairSistema()">

            <span>🚪</span>
            Sair

          </button>

        </div>

      </aside>

    `;

  }

  function abrirMenuPrincipal(){

    const menu =
      document.getElementById(
        "menuPrincipal"
      );

    const overlay =
      document.getElementById(
        "overlayMenu"
      );

    if(!menu || !overlay){
      return;
    }

    menu.classList.add("aberto");
    overlay.classList.add("aberto");

    document.body.classList.add(
      "menuAberto"
    );

  }

  function fecharMenuPrincipal(){

    const menu =
      document.getElementById(
        "menuPrincipal"
      );

    const overlay =
      document.getElementById(
        "overlayMenu"
      );

    if(!menu || !overlay){
      return;
    }

    menu.classList.remove("aberto");
    overlay.classList.remove("aberto");

    document.body.classList.remove(
      "menuAberto"
    );

  }

  function sairSistema(){

    localStorage.removeItem("token");

    window.location.href =
      "/index.html";

  }

  document.addEventListener(
    "keydown",
    event=>{

      if(event.key === "Escape"){
        fecharMenuPrincipal();
      }

    }
  );

  window.abrirMenuPrincipal =
    abrirMenuPrincipal;

  window.fecharMenuPrincipal =
    fecharMenuPrincipal;

  window.sairSistema =
    sairSistema;

  document.addEventListener(
    "DOMContentLoaded",
    montarMenuGlobal
  );

})();