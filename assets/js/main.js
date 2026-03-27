document.addEventListener("DOMContentLoaded", () => {

  const toggle = document.getElementById("menu-toggle");
  const navMobile = document.getElementById("nav-mobile");
  const userArea = document.getElementById("user-area");

  const user = JSON.parse(localStorage.getItem("user"));

  // =========================
  // 📍 DETECTA CAMINHO
  // =========================
  const isInPages = window.location.pathname.includes("/pages/");

  const perfilPath = isInPages ? "perfil.html" : "pages/perfil.html";
  const loginPath = isInPages ? "login.html" : "pages/login.html";
  const indexPath = isInPages ? "../index.html" : "index.html";

  // =========================
  // MENU MOBILE
  // =========================
  if (toggle && navMobile) {
    toggle.addEventListener("click", () => {
      navMobile.classList.toggle("active");
    });
  }

  // =========================
  // TOAST
  // =========================
  function showToast(msg) {
    const toast = document.createElement("div");
    toast.classList.add("toast");
    toast.textContent = msg;
    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add("show"), 10);

    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => toast.remove(), 400);
    }, 3000);
  }

  // =========================
  // MENSAGEM DE LOGOUT
  // =========================
  const logoutMsg = sessionStorage.getItem("logoutMsg");
  if (logoutMsg) {
    showToast(logoutMsg);
    sessionStorage.removeItem("logoutMsg");
  }

  // =========================
  // 🔥 LIMPEZA GLOBAL (ANTI BUG)
  // =========================

  // remove TODOS botões login
  document.querySelectorAll(".btn-login").forEach(btn => btn.remove());

  // limpa área do usuário
  if (userArea) userArea.innerHTML = "";

  // limpa mobile
  if (navMobile) {
    const loginExistente = navMobile.querySelector('a[href*="login.html"]');
    if (loginExistente) loginExistente.remove();

    const oldUser = navMobile.querySelector(".mobile-user");
    if (oldUser) oldUser.remove();
  }

  // =========================
  // 🔐 USUÁRIO LOGADO
  // =========================
  if (user) {

    // ===== DESKTOP =====
    if (userArea) {

      const userBox = document.createElement("div");
      userBox.classList.add("user-box");

      const nome = document.createElement("span");
      nome.textContent = user.nome.toUpperCase();
      nome.classList.add("user-name");

      const dropdown = document.createElement("div");
      dropdown.classList.add("dropdown");
      dropdown.innerHTML = `
        <a href="${perfilPath}">Perfil</a>
        <button id="logout-btn">Sair</button>
      `;

      userBox.appendChild(nome);
      userBox.appendChild(dropdown);
      userArea.appendChild(userBox);

      // DROPDOWN
      nome.addEventListener("click", (e) => {
        e.stopPropagation();
        dropdown.classList.toggle("active");
      });

      document.addEventListener("click", () => {
        dropdown.classList.remove("active");
      });

      // LOGOUT
      dropdown.querySelector("#logout-btn").addEventListener("click", () => {
        localStorage.removeItem("user");
        sessionStorage.setItem("logoutMsg", "Você saiu da conta");
        window.location.href = indexPath;
      });
    }

    // ===== MOBILE =====
    if (navMobile) {
      navMobile.insertAdjacentHTML("beforeend", `
        <div class="mobile-user">
          <span>${user.nome.toUpperCase()}</span>
          <a href="${perfilPath}">Perfil</a>
          <button id="logout-mobile">Sair</button>
        </div>
      `);

      document.getElementById("logout-mobile").addEventListener("click", () => {
        localStorage.removeItem("user");
        sessionStorage.setItem("logoutMsg", "Você saiu da conta");
        window.location.href = indexPath;
      });
    }

  } else {

    // =========================
    // 🔓 NÃO LOGADO (MOBILE)
    // =========================
    if (navMobile) {
      navMobile.insertAdjacentHTML("beforeend", `
        <a href="${loginPath}">Login</a>
      `);
    }

    // =========================
    // 🔓 NÃO LOGADO (DESKTOP)
    // =========================
    if (userArea) {
      userArea.innerHTML = `
        <a href="${loginPath}" class="btn-login">Login</a>
      `;
    }

  }

});

async function carregarGaleria() {
  try {
    const response = await fetch(URLS.galeria, {
      headers: {
        Authorization: `token ${ENV.token}`
      }
    });

    const data = await response.json();

    // conteúdo vem em base64
    const conteudo = atob(data.content);
    const json = JSON.parse(conteudo);

    const grid = document.getElementById("galeria-grid");

    grid.innerHTML = "";

    json.fotos.forEach(foto => {
      const div = document.createElement("div");
      div.classList.add("foto");

      div.innerHTML = `<img src="${foto}" alt="Corte cliente">`;

      grid.appendChild(div);
    });

  } catch (erro) {
    console.error("Erro ao carregar galeria:", erro);
  }
}

carregarGaleria();