document.addEventListener("DOMContentLoaded", () => {

  try {
    const form = document.getElementById("formContato");

    // ❌ FORM NÃO EXISTE
    if (!form) {
      showToast("Erro ao carregar formulário", "error");
      return;
    }

    // 🔥 AUTO PREENCHER
    const user = JSON.parse(localStorage.getItem("user"));

    if (user) {
      const nome = document.getElementById("nome");
      const email = document.getElementById("email_user");

      if (nome) nome.value = user.nome;
      if (email) email.value = user.email;
    }

    // ❌ EMAILJS NÃO CARREGOU
    if (typeof emailjs === "undefined") {
      showToast("Erro ao carregar serviço de email", "error");
      return;
    }

    // ❌ CONFIG NÃO EXISTE
    if (!EMAIL_CONFIG) {
      showToast("Configuração de email não encontrada", "error");
      return;
    }

    // 🔥 INIT EMAILJS
    emailjs.init(EMAIL_CONFIG.publicKey);

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const nome = document.getElementById("nome")?.value;
      const email = document.getElementById("email_user")?.value;
      const telefone = document.getElementById("telefone")?.value;
      const mensagem = document.getElementById("mensagem")?.value;

      // ❌ VALIDAÇÃO
      if (!nome || !email || !telefone || !mensagem) {
        showToast("Preencha todos os campos", "error");
        return;
      }

      showLoader(true);

      try {
        // 📩 ENVIO PARA VOCÊ (ADMIN)
        await emailjs.send(
          EMAIL_CONFIG.serviceID,
          EMAIL_CONFIG.templateID,
          {
            nome,
            email,
            telefone,
            mensagem,
            to_email: EMAIL_CONFIG.email_copia
          }
        );

        // 📩 ENVIO PARA O CLIENTE (CÓPIA)
        await emailjs.send(
          EMAIL_CONFIG.serviceID,
          EMAIL_CONFIG.templateID,
          {
            nome,
            email,
            telefone,
            mensagem,
            to_email: email
          }
        );

        showToast("Mensagem enviada com sucesso!", "success");
        form.reset();

      } catch (err) {
        console.error(err);
        showToast("Erro ao enviar mensagem.\nTente novamente mais tarde.", "error");
      } finally {
        showLoader(false);
      }
    });

  } catch (erro) {
    console.error(erro);
    showToast("Erro inesperado na página", "error");
  }

});