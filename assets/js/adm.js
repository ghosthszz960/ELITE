/* ================= CONFIG ================= */

let usuarios = [];
let agendamentos = [];
let servicos = [];
let galeria = [];

let shaUsers = "";
let shaAgendamentos = "";
let shaServicos = "";
let shaGaleria = "";

let currentDate = new Date();

/* ================= TABS ================= */

function showTab(tab) {
  document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
  document.getElementById(tab).classList.add("active");
}

/* ================= API ================= */

async function getData(url, type) {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${ENV.token}` }
  });
  const data = await res.json();

  if (type === "users") shaUsers = data.sha;
  if (type === "agendamentos") shaAgendamentos = data.sha;
  if (type === "services") shaServicos = data.sha;
  if (type === "galeria") shaGaleria = data.sha;

  return JSON.parse(atob(data.content));
}

async function updateData(url, content, sha) {
  await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${ENV.token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      message: "update via painel ADM",
      content: btoa(JSON.stringify(content, null, 2)),
      sha
    })
  });
}

/* ================= LOAD ================= */

async function loadAll() {
  usuarios = await getData(URLS.users, "users");
  agendamentos = await getData(URLS.agendamentos, "agendamentos");
  servicos = await getData(URLS.services, "services");
  galeria = await getData(URLS.galeria, "galeria").fotos || [];

  renderUsuarios();
  renderServicos();
  renderCalendar();
  carregarGaleria();
}

loadAll();

/* ================= CALENDÁRIO ================= */

function formatDateISO(day, month, year) {
  const d = String(day).padStart(2, "0");
  const m = String(month + 1).padStart(2, "0");
  return `${year}-${m}-${d}`;
}

function renderCalendar() {
  const daysContainer = document.getElementById("calendarDays");
  const monthYear = document.getElementById("monthYear");
  if (!daysContainer || !monthYear) return;

  daysContainer.innerHTML = "";

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  monthYear.innerText = currentDate.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  const firstDay = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();

  for (let i = 0; i < firstDay; i++) daysContainer.innerHTML += "<div></div>";

  for (let d = 1; d <= totalDays; d++) {
    const div = document.createElement("div");
    div.innerText = d;
    div.onclick = () => selectDay(d, month, year);
    daysContainer.appendChild(div);
  }
}

function prevMonth() { currentDate.setMonth(currentDate.getMonth() - 1); renderCalendar(); }
function nextMonth() { currentDate.setMonth(currentDate.getMonth() + 1); renderCalendar(); }

function selectDay(day, month, year) {
  const dataSelecionada = formatDateISO(day, month, year);
  const lista = document.getElementById("listaAgendamentos");
  lista.innerHTML = "";

  const filtrados = agendamentos
    .filter(a => a.data === dataSelecionada && a.status === "agendado")
    .sort((a, b) => a.hora.localeCompare(b.hora));

  if (filtrados.length === 0) {
    lista.innerHTML = "<p style='color:#aaa'>Nenhum agendamento nesse dia</p>";
    return;
  }

  filtrados.forEach(a => {
    const div = document.createElement("div");
    div.className = "agendamento-card";

    div.innerHTML = `
      <div class="agendamento-info">
        <strong>${a.nome}</strong>
        <span>${a.servicos.join(", ")}</span>
        <span>⏰ ${a.hora}</span>
      </div>
      <div class="agendamento-acoes">
        <button onclick="verDetalhes(${a.id})">Detalhes</button>
        <button class="btn-danger" onclick="cancelarAgendamento(${a.id})">Cancelar</button>
      </div>
    `;

    lista.appendChild(div);
  });
}

/* ================= GALERIA ================= */

function carregarGaleria() {
  const grid = document.getElementById("galeria-grid");
  if (!grid) return console.error("Elemento #galeria-grid não encontrado");

  grid.innerHTML = "";

  galeria.forEach(fileName => {
    const div = document.createElement("div");
    div.classList.add("foto");
    div.innerHTML = `<img src="https://raw.githubusercontent.com/${ENV.username}/ELITE/main/assets/images/galeria/${fileName}" alt="Foto da galeria">`;
    grid.appendChild(div);
  });
}

async function updateGaleriaJSON(newFileName) {
  try {
    galeria.push(newFileName);
    await updateData(URLS.galeria, { fotos: galeria }, shaGaleria);
    const data = await getData(URLS.galeria, "galeria"); 
    shaGaleria = data.sha;
    galeria = data.fotos;
    carregarGaleria();
  } catch (err) {
    console.error("Erro ao atualizar galeria.json", err);
  }
}

async function uploadFileToELITE(file, fileName) {
  const path = `assets/images/galeria/${fileName}`;
  const reader = new FileReader();

  return new Promise((resolve, reject) => {
    reader.onloadend = async () => {
      const fileContent = reader.result.split(",")[1];
      const repoOwner = ENV.username;
      const repoName = "ELITE";

      let sha = null;
      try {
        const resCheck = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/contents/${path}`, {
          headers: { Authorization: `token ${ENV.token}` }
        });
        if (resCheck.ok) {
          const data = await resCheck.json();
          sha = data.sha;
        }
      } catch {}

      const res = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/contents/${path}`, {
        method: "PUT",
        headers: { Authorization: `token ${ENV.token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ message: `Upload foto galeria ${fileName}`, content: fileContent, sha })
      });

      const result = await res.json();
      if (result.commit) resolve(result);
      else reject(result);
    };
    reader.readAsDataURL(file);
  });
}

// MOSTRAR FORMULÁRIO
document.getElementById("showGalleryFormButton")?.addEventListener("click", function() {
  this.style.display = "none";
  const formContainer = document.getElementById("galleryFormContainer");
  if (formContainer) formContainer.style.display = "block";

  // Força o input a abrir quando o formulário aparecer
  const fileInput = document.getElementById("galleryFileInput");
  if (fileInput) fileInput.click();
});

// UPLOAD DE FOTO
document.getElementById("galleryUploadForm")?.addEventListener("submit", async function(event) {
  event.preventDefault();

  const loader = document.getElementById("galleryLoaderOverlay");
  loader.style.display = "block";

  const fileInput = document.getElementById("galleryFileInput");
  const file = fileInput.files[0];

  const alertMsg = document.getElementById("galleryAlertMessage");
  if (!file) {
    if (alertMsg) alertMsg.innerText = "Selecione um arquivo.";
    loader.style.display = "none";
    return;
  }

  if (!file.type.startsWith("image/")) {
    if (alertMsg) alertMsg.innerText = "Apenas imagens são permitidas.";
    loader.style.display = "none";
    return;
  }

  const timestamp = Date.now();
  const fileName = `foto_${timestamp}.${file.name.split(".").pop()}`;

  try {
    // Subir foto
    await uploadFileToELITE(file, fileName);

    // Atualizar JSON sem sobrescrever fotos antigas
    await updateGaleriaJSON(fileName);

    alert("Foto enviada com sucesso!");
    fileInput.value = "";
  } catch (err) {
    console.error(err);
    alert("Erro ao enviar a foto.");
  } finally {
    loader.style.display = "none";
  }
});

// FUNÇÃO DE ATUALIZAR JSON
async function updateGaleriaJSON(fileName) {
  try {
    const res = await fetch(URLS.galeria, { headers: { Authorization: `token ${ENV.token}` } });
    if (!res.ok) throw new Error("Erro ao buscar galeria.json");

    const data = await res.json();
    const conteudoAtual = JSON.parse(atob(data.content));

    if (!Array.isArray(conteudoAtual.fotos)) conteudoAtual.fotos = [];
    conteudoAtual.fotos.push(fileName);

    const novoConteudoString = JSON.stringify(conteudoAtual, null, 2);
    const novoConteudoBase64 = btoa(unescape(encodeURIComponent(novoConteudoString)));

    const putRes = await fetch(URLS.galeria, {
      method: "PUT",
      headers: { Authorization: `token ${ENV.token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ message: `Adiciona foto ${fileName}`, content: novoConteudoBase64, sha: data.sha })
    });

    if (!putRes.ok) {
      const erro = await putRes.json();
      throw new Error(`Erro ao atualizar galeria.json: ${erro.message}`);
    }
  } catch (err) {
    console.error("Erro ao atualizar galeria.json", err);
    throw err;
  }
}
/* ================= TOAST ================= */

function showToast(message, type = "success", duration = 3000) {
  const toast = document.getElementById("toast");
  toast.innerText = message;
  toast.className = `toast show ${type}`;
  setTimeout(() => { toast.className = "toast"; }, duration);
}

/* ================= AGENDAMENTOS ================= */

async function cancelarAgendamento(id) {
  const index = agendamentos.findIndex(a => a.id === id);
  if (index === -1) { showToast("Agendamento não encontrado", "error"); return; }

  agendamentos.splice(index, 1);
  try {
    await updateData(URLS.agendamentos, agendamentos, shaAgendamentos);
    await loadAll();
    showToast("Agendamento cancelado!", "success");
  } catch (err) {
    console.error(err);
    showToast("Erro ao cancelar agendamento", "error");
  }
}

function verDetalhes(id) {
  const a = agendamentos.find(x => x.id == id);
  abrirModal("Detalhes do Agendamento", `
    <p><strong>Nome:</strong> ${a.nome}</p>
    <p><strong>Data:</strong> ${a.data}</p>
    <p><strong>Hora:</strong> ${a.hora}</p>
    <p><strong>Serviços:</strong> ${a.servicos.join(", ")}</p>
    <p><strong>Status:</strong> ${a.status}</p>
  `);
}

/* ================= MODAL ================= */

function abrirModal(titulo, conteudoHTML) {
  document.getElementById("modalTitulo").innerText = titulo;
  document.getElementById("modalConteudo").innerHTML = conteudoHTML;
  document.getElementById("modal").classList.add("active");
}

function fecharModal() { document.getElementById("modal").classList.remove("active"); }

/* ================= USUÁRIOS ================= */

function renderUsuarios() {
  const container = document.getElementById("listaUsuarios");
  container.innerHTML = "";

  usuarios.forEach((u, i) => {
    const div = document.createElement("div");
    div.className = "card-padrao";

    div.innerHTML = `
      <div class="card-info">
        <strong>${u.nome}</strong>
        <span>${u.email}</span>
      </div>
      <div class="card-acoes">
        <button onclick="editarUsuario(${i})">Editar</button>
        <button onclick="resetSenha(${i})">Reset</button>
        <button class="btn-danger" onclick="removerUsuario(${i})">Excluir</button>
      </div>
    `;

    container.appendChild(div);
  });
}

function editarUsuario(i) {
  const u = usuarios[i];
  abrirModal("Editar Usuário", `
    <input id="editNome" value="${u.nome}">
    <input id="editEmail" value="${u.email}">
    <button onclick="salvarUsuario(${i})">Salvar</button>
  `);
}

async function salvarUsuario(i) {
  const u = usuarios[i];
  u.nome = document.getElementById("editNome").value;
  u.email = document.getElementById("editEmail").value;

  try {
    await getData(URLS.users, "users");
    await updateData(URLS.users, usuarios, shaUsers);
    await loadAll();
    fecharModal();
    showToast("Usuário salvo com sucesso!", "success");
  } catch (err) {
    console.error(err);
    showToast("Erro ao salvar usuário", "error");
  }
}

async function resetSenha(i) {
  const user = usuarios[i];
  if (!user) { 
    showToast("Usuário não encontrado", "error"); 
    return; 
  }

  try {
    const hashed = await hashPassword("123456");
    user.senha = hashed;
    await getData(URLS.users, "users");
    await updateData(URLS.users, usuarios, shaUsers);
    await loadAll();
    showToast(`Senha de ${user.nome} redefinida!`, "success");
  } catch (err) {
    console.error(err);
    showToast("Erro ao redefinir senha", "error");
  }
}

async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

async function removerUsuario(i) {
  const user = usuarios[i];
  if (!user) return;
  if (!confirm(`Deseja realmente excluir o usuário ${user.nome}?`)) return;

  usuarios.splice(i, 1);

  try {
    await getData(URLS.users, "users");
    await updateData(URLS.users, usuarios, shaUsers);
    await loadAll();
    showToast("Usuário excluído com sucesso!", "success");
  } catch (err) {
    console.error(err);
    showToast("Erro ao excluir usuário", "error");
  }
}

/* ================= SERVIÇOS ================= */

function renderServicos() {
  const container = document.getElementById("listaServicos");
  container.innerHTML = "";

  servicos.forEach((s, i) => {
    const div = document.createElement("div");
    div.className = "card-padrao";

    div.innerHTML = `
      <div class="card-info">
        <strong>${s.nome}</strong>
        <span>R$ ${s.preco}</span>
      </div>
      <div class="card-acoes">
        <button onclick="editarServico(${i})">Editar</button>
        <button class="btn-danger" onclick="removerServico(${i})">Remover</button>
      </div>
    `;
    container.appendChild(div);
  });
}

function editarServico(i) {
  const s = servicos[i];
  abrirModal("Editar Serviço", `
    <input id="editNomeServico" value="${s.nome}">
    <input id="editPrecoServico" value="${s.preco}">
    <button onclick="salvarServico(${i})">Salvar</button>
  `);
}

async function salvarServico(i) {
  servicos[i].nome = document.getElementById("editNomeServico").value;
  servicos[i].preco = document.getElementById("editPrecoServico").value;

  try {
    await updateData(URLS.services, servicos, shaServicos);
    await loadAll();
    fecharModal();
    showToast("Serviço salvo com sucesso!", "success");
  } catch (err) {
    console.error(err);
    showToast("Erro ao salvar serviço", "error");
  }
}

async function removerServico(i) {
  servicos.splice(i, 1);
  try {
    await updateData(URLS.services, servicos, shaServicos);
    await loadAll();
    showToast("Serviço removido com sucesso!", "success");
  } catch (err) {
    console.error(err);
    showToast("Erro ao remover serviço", "error");
  }
}

function addServico() {
  abrirModal("Novo Serviço", `
    <input id="novoNomeServico" placeholder="Nome do serviço">
    <input id="novoPrecoServico" placeholder="Preço" type="number" step="0.01">
    <button onclick="salvarNovoServico()">Salvar</button>
  `);
}

async function salvarNovoServico() {
  const nome = document.getElementById("novoNomeServico").value.trim();
  const preco = parseFloat(document.getElementById("novoPrecoServico").value);

  if (!nome || isNaN(preco)) {
    showToast("Preencha nome e preço corretamente!", "error");
    return;
  }

  const novoServico = {
    id: servicos.length ? Math.max(...servicos.map(s => s.id)) + 1 : 1,
    nome,
    preco: preco.toFixed(2)
  };

  servicos.push(novoServico);

  try {
    await updateData(URLS.services, servicos, shaServicos);
    await loadAll();
    fecharModal();
    showToast("Serviço criado com sucesso!", "success");
  } catch (err) {
    console.error(err);
    showToast("Erro ao criar serviço", "error");
  }
}

/* ================= PERMISSÃO ADMIN ================= */

function checarPermissaoAdmin() {
  const userJSON = localStorage.getItem("user");

  if (!userJSON) {
    alert("Você não tem permissão para acessar");
    window.location.href = "/pages/login.html"; 
    return false;
  }

  const user = JSON.parse(userJSON);

  if (user.type !== "administrator") {
    alert("Você é um cliente, não uma administrador");
    window.location.href = "/index.html"; 
    return false;
  }

  return true;
}

if (!checarPermissaoAdmin()) {
  throw new Error("Acesso negado");
}

/* ================= MENU ================= */

const toggle = document.querySelector(".menu-toggle");
const menu = document.querySelector(".nav ul");

if (toggle && menu) {
  toggle.addEventListener("click", () => {
    menu.classList.toggle("active");
  });
}

// Elementos do modal
const showBtn = document.getElementById("showGalleryFormButton");
const modal = document.getElementById("modal");
const closeBtn = document.getElementById("closeGalleryModal");
const cancelBtn = document.getElementById("cancelUpload");

// Abrir modal
showBtn?.addEventListener("click", () => {
  modal.style.display = "flex"; // USAR FLEX para centralizar
  document.getElementById("galleryAlertMessage").innerText = "";
  document.getElementById("galleryFileInput").value = "";
});

// Fechar modal com X
closeBtn?.addEventListener("click", () => {
  modal.style.display = "none";
});

// Fechar modal com botão Cancelar
cancelBtn?.addEventListener("click", () => {
  modal.style.display = "none";
});

// Fechar modal clicando fora do conteúdo
window.addEventListener("click", (e) => {
  if (e.target === modal) modal.style.display = "none";
});