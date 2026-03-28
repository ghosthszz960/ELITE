function showToast(message, type = "success") {
  const toast = document.getElementById("toast");

  toast.textContent = message;
  toast.className = `toast show ${type}`;

  setTimeout(() => {
    toast.className = "toast";
  }, 3000);
}

function showLoader(show) {
  const loader = document.querySelector(".loader-overlay");
  if (!loader) return;

  loader.classList.toggle("active", show);
}

// ================= CADASTRO =================
async function cadastrar() {
  const nomeInput = document.getElementById("nome");
  const emailInput = document.getElementById("email");
  const senhaInput = document.getElementById("senha");
  const confirmarInput = document.getElementById("confirmarSenha");

  const nome = nomeInput.value.trim();
  const email = emailInput.value.trim();
  const senha = senhaInput.value;

  // RESET visual
  [nomeInput, emailInput, senhaInput, confirmarInput].forEach(i => {
    i.classList.remove("input-invalid");
  });

  // VALIDAÇÃO BÁSICA
  if (!nome || !email || !senha || !confirmarInput.value) {
    showToast("Preencha todos os campos", "error");

    if (!nome) nomeInput.classList.add("input-invalid");
    if (!email) emailInput.classList.add("input-invalid");
    if (!senha) senhaInput.classList.add("input-invalid");
    if (!confirmarInput.value) confirmarInput.classList.add("input-invalid");

    return;
  }

  // VALIDAR SENHA
  if (!validarSenha(senha)) {
    showToast("Senha fraca. Verifique os requisitos", "error");
    senhaInput.classList.add("input-invalid");
    return;
  }

  // CONFIRMAR SENHA
  if (senha !== confirmarInput.value) {
    showToast("As senhas não coincidem", "error");
    confirmarInput.classList.add("input-invalid");
    return;
  }

  showLoader(true);

  try {
    const { data, sha } = await getFile(URLS.users);

    const existe = data.find(u => u.email === email);

    if (existe) {
      showToast("Este email já está em uso", "error");
      emailInput.classList.add("input-invalid");
      return;
    }

    const senhaHash = await hashPassword(senha);

    const novoUsuario = {
      id: Date.now(),
      nome,
      email,
      senha: senhaHash,
      type: "cliente" // padrão cliente
    };

    data.push(novoUsuario);
    await updateFile(URLS.users, data, sha);

    showToast("Conta criada com sucesso! 🎉", "success");

    // limpar campos
    [nomeInput, emailInput, senhaInput, confirmarInput].forEach(i => i.value = "");

    setTimeout(() => {
      window.location.href = "login";
    }, 1500);

  } catch (err) {
    showToast("Erro ao conectar com o servidor", "error");
  } finally {
    showLoader(false);
  }
}

// ================= LOGIN =================
async function login() {
  showLoader(true);

  try {
    const email = document.getElementById("email").value;
    const senha = document.getElementById("senha").value;

    const { data } = await getFile(URLS.users);
    const senhaHash = await hashPassword(senha);

    const user = data.find(u => u.email === email && u.senha === senhaHash);

    if (!user) {
      showToast("Email ou senha inválidos", "error");
      return;
    }

    localStorage.setItem("user", JSON.stringify(user));
    showToast("Login realizado com sucesso!", "success");

    setTimeout(() => {
      if (user.type === "administrator") {
        showAdminModal(); // abre modal customizado para admins
      } else {
        window.location.href = "../index"; // usuário comum
      }
    }, 1500);

  } catch (err) {
    showToast("Erro ao conectar com servidor", "error");
  } finally {
    showLoader(false);
  }
}

// ================= SENHA =================
const senhaInput = document.getElementById("senha");
const confirmarInput = document.getElementById("confirmarSenha");

// regras
const rules = {
  length: document.getElementById("rule-length"),
  upper: document.getElementById("rule-upper"),
  number: document.getElementById("rule-number"),
  special: document.getElementById("rule-special")
};

function validarSenha(senha) {
  const validacoes = {
    length: senha.length >= 8,
    upper: /[A-Z]/.test(senha),
    number: /[0-9]/.test(senha),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(senha)
  };

  Object.keys(validacoes).forEach(key => {
    if (validacoes[key]) {
      rules[key].classList.add("valid");
      rules[key].classList.remove("invalid");
    } else {
      rules[key].classList.add("invalid");
      rules[key].classList.remove("valid");
    }
  });

  return Object.values(validacoes).every(v => v);
}

// eventos de digitação
senhaInput?.addEventListener("input", () => validarSenha(senhaInput.value));
confirmarInput?.addEventListener("input", () => {
  if (confirmarInput.value === senhaInput.value && confirmarInput.value !== "") {
    confirmarInput.classList.add("input-valid");
    confirmarInput.classList.remove("input-invalid");
  } else {
    confirmarInput.classList.add("input-invalid");
    confirmarInput.classList.remove("input-valid");
  }
});

// ================= MODAL ADMIN =================
function showAdminModal() {
  const modal = document.getElementById("adminModal");
  modal.style.display = "flex";

  document.getElementById("goDashboard").onclick = () => {
    window.location.href = "../pages/adm";
  };
  document.getElementById("goClientes").onclick = () => {
    window.location.href = "../index";
  };

  modal.onclick = (e) => {
    if (e.target === modal) modal.style.display = "none"; // fecha clicando fora
  };
}

// ================= FUNÇÕES AUX =================
function ativarEnter(acao) {
  document.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      e.preventDefault();
      acao();
    }
  });
}

function goBack() {
  window.history.back();
}

function gobackhome() {
  window.location.href = "../index";
}
