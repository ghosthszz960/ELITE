let agendamentos = [];
let filtroAtual = "proximos";
let agendamentoSelecionado = null;

// carregar dados do usuário
function carregarPerfil() {
  const user = JSON.parse(localStorage.getItem("user"));

  if (!user) {
    window.location.href = "login";
    return;
  }

  document.getElementById("nome").value = user.nome;
  document.getElementById("email").value = user.email;

  carregarAgendamentos();
}

// ================= ATUALIZAR PERFIL =================
async function atualizarPerfil() {
  const user = JSON.parse(localStorage.getItem("user"));

  const nome = document.getElementById("nome").value;
  const senhaAtual = document.getElementById("senhaAtual").value;
  const novaSenha = document.getElementById("novaSenha").value;

  if (!senhaAtual) {
    showToast("Digite sua senha atual", "error");
    return;
  }

  showLoader(true);

  try {
    const { data, sha } = await getFile(URLS.users);

    const senhaHash = await hashPassword(senhaAtual);

    const usuario = data.find(u => u.id === user.id && u.senha === senhaHash);

    if (!usuario) {
      showToast("Senha atual incorreta", "error");
      return;
    }

    usuario.nome = nome;

    if (novaSenha) {
      usuario.senha = await hashPassword(novaSenha);
    }

    await updateFile(URLS.users, data, sha);

    localStorage.setItem("user", JSON.stringify(usuario));

    showToast("Perfil atualizado!", "success");

  } catch {
    showToast("Erro ao atualizar", "error");
  } finally {
    showLoader(false);
  }
}

// ================= AGENDAMENTOS =================
async function carregarAgendamentos() {
  const user = JSON.parse(localStorage.getItem("user"));

  showLoader(true);

  try {
    const { data } = await getFile(URLS.agendamentos);

    agendamentos = data.filter(a => a.usuarioId === user.id);

    renderAgendamentos();

  } catch {
    showToast("Erro ao carregar agendamentos", "error");
  } finally {
    showLoader(false);
  }
}

// renderizar lista
function renderAgendamentos() {
  const container = document.getElementById("listaAgendamentos");
  container.innerHTML = "";

  const hoje = new Date();

  let lista = agendamentos;

  if (filtroAtual === "proximos") {
    lista = lista.filter(a => new Date(`${a.data}T${a.hora}`) >= hoje);
  }

  if (filtroAtual === "passados") {
    lista = lista.filter(a => new Date(`${a.data}T${a.hora}`) < hoje);
  }

  if (lista.length === 0) {
    container.innerHTML = "<p>Nenhum agendamento encontrado</p>";
    return;
  }

lista.forEach(a => {
  container.innerHTML += `
    <div class="agendamento-item">
      <strong>${a.servicos.join(", ")}</strong>
      <span>📅 ${a.data} às ${a.hora}</span>
      <span>Status: ${a.status}</span>

      <button class="btn-cancelar" onclick="confirmarCancelamento(${a.id})">
        Cancelar
      </button>
    </div>
  `;
});
}

function confirmarCancelamento(id) {
  const agendamento = agendamentos.find(a => a.id === id);

  agendamentoSelecionado = agendamento;

  const texto = `
    Você tem certeza que deseja cancelar:<br><br>
    <strong>${agendamento.servicos.join(", ")}</strong><br>
    📅 ${agendamento.data} às ${agendamento.hora}
  `;

  document.getElementById("modalTexto").innerHTML = texto;

  document.getElementById("modalCancel").classList.add("active");
}

function fecharModal() {
  document.getElementById("modalCancel").classList.remove("active");
}
async function confirmarCancelamentoFinal() {
  if (!agendamentoSelecionado) return;

  showLoader(true);

  try {
    const { data, sha } = await getFile(URLS.agendamentos);

    const novos = data.filter(a => a.id !== agendamentoSelecionado.id);

    await updateFile(URLS.agendamentos, novos, sha);

    showToast("Agendamento cancelado!", "success");

    agendamentos = agendamentos.filter(a => a.id !== agendamentoSelecionado.id);

    fecharModal();
    renderAgendamentos();

  } catch {
    showToast("Erro ao cancelar", "error");
  } finally {
    showLoader(false);
  }
}

// filtros
function filtrar(tipo) {
  filtroAtual = tipo;

  document.querySelectorAll(".filtros button").forEach(b => {
    b.classList.remove("active");
  });

  event.target.classList.add("active");

  renderAgendamentos();
}
let editando = false;

function ativarEdicao() {
  editando = true;

  document.querySelectorAll(".perfil-card input").forEach(input => {
    input.disabled = false;
  });

  showToast("Modo de edição ativado", "success");
}

// init
carregarPerfil();