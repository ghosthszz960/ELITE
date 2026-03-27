let servicosSelecionados = [];
let selectedDate = null;
let selectedTime = null;

let currentDate = new Date();

let horarios = [];
let paginaAtual = 0;
const porPagina = 12; // 2 colunas x 6 linhas

// ================= SERVIÇOS =================
async function carregarServicos() {
  try {
    const { data } = await getFile(URLS.services);
    const container = document.getElementById("servicos");

    container.innerHTML = data.map(s => `
      <div class="servico-card" data-id="${s.id}">
        <h3>${s.nome}</h3>
        <p>R$ ${s.preco}</p>
      </div>
    `).join("");

    document.querySelectorAll(".servico-card").forEach(card => {
      card.addEventListener("click", () => toggleServico(card, data));
    });

  } catch {
    showToast("Erro ao carregar serviços", "error");
  }
}

// selecionar/desselecionar serviço
function toggleServico(card, lista) {
  const id = Number(card.getAttribute("data-id"));
  const servico = lista.find(s => s.id === id);

  const index = servicosSelecionados.findIndex(s => s.id === id);

  if (index > -1) {
    servicosSelecionados.splice(index, 1);
    card.classList.remove("selected");
  } else {
    servicosSelecionados.push(servico);
    card.classList.add("selected");
  }

  atualizarConfirmacao();
}

// atualizar UI
function atualizarConfirmacao() {
  const confirmacao = document.getElementById("confirmacao");
  const titulo = document.getElementById("servico-nome");

  if (servicosSelecionados.length === 0) {
    confirmacao.classList.add("hidden");
    return;
  }

  confirmacao.classList.remove("hidden");

  const nomes = servicosSelecionados.map(s => s.nome).join(", ");
  titulo.textContent = nomes;

  // renderiza calendário automaticamente
  renderCalendar();
}

// ================= CALENDÁRIO =================
function renderCalendar() {
  const daysContainer = document.getElementById("calendarDays");
  const monthYear = document.getElementById("monthYear");

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();

  const hoje = new Date();
  hoje.setHours(0,0,0,0);

  monthYear.textContent = currentDate.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric"
  });

  // SIGLAS DOS DIAS (Dom, Seg, Ter, Qua, Qui, Sex, Sab)
  const weekdays = ["D", "S", "T", "Q", "Q", "S", "S"];
  const weekdaysContainer = document.getElementById("calendarWeekdays");
  if (weekdaysContainer) {
    weekdaysContainer.innerHTML = weekdays.map(d => `<div>${d}</div>`).join("");
  }

  daysContainer.innerHTML = "";

  // Espaços vazios antes do primeiro dia do mês (para alinhar o calendário)
  // Ajuste: O getDay() retorna 0 para domingo, mas no calendário queremos domingo como primeira coluna,
  // então não ajustamos nada aqui.
  for (let i = 0; i < firstDay; i++) {
    daysContainer.innerHTML += "<div></div>";
  }

  // Criar dias do mês
  for (let i = 1; i <= totalDays; i++) {
    const date = new Date(year, month, i);
    const div = document.createElement("div");
    div.textContent = i;

    // Bloquear domingos (getDay() === 0) e dias anteriores ao hoje
    if (date < hoje || date.getDay() === 0) {
      div.classList.add("disabled");
    } else {
      div.onclick = () => selecionarData(div, date);
    }

    daysContainer.appendChild(div);
  }
}

// Quando selecionar uma data no calendário
function selecionarData(elemento, date) {
  document.querySelectorAll(".calendar-days div").forEach(d => {
    d.classList.remove("selected");
  });

  elemento.classList.add("selected");

  selectedDate = date.toISOString().split("T")[0];

  gerarHorarios();
  carregarHorariosOcupados();
}

function prevMonth() {
  currentDate.setMonth(currentDate.getMonth() - 1);
  renderCalendar();
}

function nextMonth() {
  currentDate.setMonth(currentDate.getMonth() + 1);
  renderCalendar();
}

// ================= HORÁRIOS =================
function gerarHorarios() {
  horarios = [];

  if (!selectedDate) return;

  for (let h = 9; h <= 20; h++) {
    if (h === 20) {
      // Só o horário cheio 20:00, sem 20:30
      horarios.push("20:00");
    } else {
      // Horário cheio e meio (00 e 30 minutos)
      horarios.push(`${String(h).padStart(2, "0")}:00`);
      horarios.push(`${String(h).padStart(2, "0")}:30`);
    }
  }

  paginaAtual = 0;
  renderHorarios();
}
function renderHorarios() {
  const container = document.getElementById("listaHorarios");

  if (!container) {
    console.log("ERRO: listaHorarios não encontrado");
    return;
  }

  container.innerHTML = "";

  const inicio = paginaAtual * porPagina;
  const fim = inicio + porPagina;

  const pagina = horarios.slice(inicio, fim);

  pagina.forEach(hora => {
    const div = document.createElement("div");
    div.classList.add("horario");
    div.textContent = hora;

    div.onclick = () => selecionarHorario(div, hora);

    container.appendChild(div);
  });
}

function selecionarHorario(elemento, hora) {
  document.querySelectorAll(".horario").forEach(h => {
    h.classList.remove("selected");
  });

  elemento.classList.add("selected");
  selectedTime = hora;
}

// bloquear horários já ocupados
async function carregarHorariosOcupados() {
  try {
    const { data } = await getFile(URLS.agendamentos);

    document.querySelectorAll(".horario").forEach(div => {
      const hora = div.textContent;

      const conflito = data.some(a => {
        if (a.data !== selectedDate) return false;

        const existente = new Date(`${a.data}T${a.hora}`);
        const novo = new Date(`${selectedDate}T${hora}`);

        const diff = Math.abs(novo - existente) / (1000 * 60);
        return diff < 30;
      });

      if (conflito) {
        div.classList.add("disabled");
        div.onclick = null; // remover clique
      }
    });

  } catch {
    showToast("Erro ao carregar horários", "error");
  }
}

function proximaPagina() {
  if ((paginaAtual + 1) * porPagina < horarios.length) {
    paginaAtual++;
    renderHorarios();
  }
}

function voltarPagina() {
  if (paginaAtual > 0) {
    paginaAtual--;
    renderHorarios();
  }
}

// ================= AGENDAR =================
async function agendar() {
  const user = JSON.parse(localStorage.getItem("user"));

if (!user) {
  showToast("Faça login primeiro", "error");

  setTimeout(() => {
    window.location.href = "login.html";
  }, 1500);

  return;
}

  if (servicosSelecionados.length === 0) {
    showToast("Selecione um serviço", "error");
    return;
  }

  if (!selectedDate || !selectedTime) {
    showToast("Escolha data e horário", "error");
    return;
  }

  showLoader(true);

  try {
    const { data: agendamentos, sha } = await getFile(URLS.agendamentos);

    const conflito = agendamentos.some(a => {
      if (a.data !== selectedDate) return false;

      const existente = new Date(`${a.data}T${a.hora}`);
      const novo = new Date(`${selectedDate}T${selectedTime}`);

      const diff = Math.abs(novo - existente) / (1000 * 60);
      return diff < 30;
    });

    if (conflito) {
      showToast("Horário indisponível", "error");
      return;
    }

    const novo = {
      id: Date.now(),
      usuarioId: user.id,
      nome: user.nome.toUpperCase(),
      servicos: servicosSelecionados.map(s => s.nome),
      data: selectedDate,
      hora: selectedTime,
      status: "agendado"
    };

    agendamentos.push(novo);

    await updateFile(URLS.agendamentos, agendamentos, sha);

    showToast("Agendamento realizado!", "success");

    // reset
    servicosSelecionados = [];
    selectedDate = null;
    selectedTime = null;

    document.querySelectorAll(".servico-card").forEach(c => c.classList.remove("selected"));
    document.getElementById("confirmacao").classList.add("hidden");

  } catch {
    showToast("Erro ao salvar", "error");
  } finally {
    showLoader(false);
  }
}

// ================= RESERVAR =================
function reservar() {
  showToast("Função em manutenção 🚧", "error");
}

// Init
carregarServicos();