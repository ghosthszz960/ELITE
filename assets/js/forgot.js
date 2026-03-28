// ================= GERAR CÓDIGO =================
function gerarCodigo() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ================= ETAPA 1 =================
async function enviarCodigo() {
  const email = document.getElementById("email").value.trim();

  if (!email) {
    showToast("Digite um email", "error");
    return;
  }

  showLoader(true);

  try {
    const { data } = await getFile(URLS.users);
    const user = data.find(u => u.email === email);

    if (!user) {
      showToast("Email não encontrado", "error");
      return;
    }

    const codigo = gerarCodigo();

    // salva sessão
    sessionStorage.setItem("resetCode", codigo);
    sessionStorage.setItem("resetEmail", email);

    // ENVIA EMAIL (SEM CÓPIA)
    await emailjs.send(
      EMAIL_CONFIG.serviceID,
      EMAIL_CONFIG.templateID_code,
      {
        email: email,
        passcode: codigo,
        name: user.nome || "Cliente"
      },
      EMAIL_CONFIG.publicKey
    );

    showToast("Código enviado 📧", "success");

    // muda etapa
    document.getElementById("step-email").style.display = "none";
    document.getElementById("step-codigo").style.display = "block";
    document.getElementById("titulo").innerText = "Digite o código";

  } catch (err) {
    console.error(err);
    showToast("Erro ao enviar código", "error");
  } finally {
    showLoader(false);
  }
}

// ================= ETAPA 2 =================
function verificarCodigo() {
  const codigoDigitado = document.getElementById("codigo").value;
  const codigoSalvo = sessionStorage.getItem("resetCode");

  if (codigoDigitado !== codigoSalvo) {
    showToast("Código inválido", "error");
    return;
  }

  showToast("Código verificado ✅", "success");

  document.getElementById("step-codigo").style.display = "none";
  document.getElementById("step-nova-senha").style.display = "block";
  document.getElementById("titulo").innerText = "Nova senha";
}

// ================= ETAPA 3 =================
async function resetarSenha() {
  // pega os valores dos novos campos
  const senha = document.getElementById("senha1")?.value || "";
  const confirmar = document.getElementById("confirmarSenha1")?.value || "";
  const email = sessionStorage.getItem("resetEmail") || "";

  if (!senha || !confirmar) {
    showToast("Preencha todos os campos", "error");
    return;
  }

  if (senha !== confirmar) {
    showToast("Senhas não coincidem", "error");
    return;
  }

  showLoader(true);

  try {
    // 1️⃣ PUXA DADOS ATUALIZADOS
    const { data } = await getFile(URLS.users);
    const index = data.findIndex(u => u.email === email);

    if (index === -1) {
      showToast("Usuário não encontrado", "error");
      return;
    }

    // 2️⃣ HASH DA NOVA SENHA
    const senhaHash = await hashPassword(senha);
    data[index].senha = senhaHash;

    // 3️⃣ PEGA SHA MAIS RECENTE (SEU PADRÃO)
    const { sha } = await getFile(URLS.users);

    // 4️⃣ ATUALIZA NO GITHUB
    await updateFile(URLS.users, data, sha);

    showToast("Senha redefinida com sucesso 🎉", "success");

    // limpa sessão
    sessionStorage.removeItem("resetCode");
    sessionStorage.removeItem("resetEmail");

    setTimeout(() => {
      window.location.href = "login";
    }, 1500);

  } catch (err) {
    console.error(err);
    showToast("Erro ao redefinir senha", "error");
  } finally {
    showLoader(false);
  }
}
