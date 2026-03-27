document.addEventListener("DOMContentLoaded", async () => {

  // =========================
  // ELEMENTOS PRINCIPAIS
  // =========================
  const toggle = document.getElementById("menu-toggle");
  const navMobile = document.getElementById("nav-mobile");
  const userArea = document.getElementById("user-area");
  const user = JSON.parse(localStorage.getItem("user"));

  const isInPages = window.location.pathname.includes("/pages/");
  const perfilPath = isInPages ? "perfil.html" : "pages/perfil.html";
  const loginPath = isInPages ? "login.html" : "pages/login.html";
  const indexPath = isInPages ? "../index.html" : "index.html";

  // =========================
  // MENU MOBILE
  // =========================
  if (toggle && navMobile) {
    toggle.addEventListener("click", () => navMobile.classList.toggle("active"));
  }

  // =========================
  // TOAST DE MENSAGEM
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

  const logoutMsg = sessionStorage.getItem("logoutMsg");
  if (logoutMsg) {
    showToast(logoutMsg);
    sessionStorage.removeItem("logoutMsg");
  }

  // =========================
  // CONFIGURAÇÃO DO USUÁRIO
  // =========================
  function setupUserArea() {
    // limpa elementos antigos
    document.querySelectorAll(".btn-login").forEach(btn => btn.remove());
    if (userArea) userArea.innerHTML = "";
    if (navMobile) {
      const loginExistente = navMobile.querySelector('a[href*="login.html"]');
      if (loginExistente) loginExistente.remove();
      const oldUser = navMobile.querySelector(".mobile-user");
      if (oldUser) oldUser.remove();
    }

    if (user) {
      // ===== DESKTOP =====
      if (userArea) {
        const userBox = document.createElement("div");
        userBox.classList.add("user-box");
        userBox.innerHTML = `
          <span class="user-name">${user.nome.toUpperCase()}</span>
          <div class="dropdown">
            <a href="${perfilPath}">Perfil</a>
            <button id="logout-btn">Sair</button>
          </div>
        `;
        userArea.appendChild(userBox);

        const dropdown = userBox.querySelector(".dropdown");
        userBox.querySelector(".user-name").addEventListener("click", e => {
          e.stopPropagation();
          dropdown.classList.toggle("active");
        });
        document.addEventListener("click", () => dropdown.classList.remove("active"));

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
      // NÃO LOGADO
      if (userArea) userArea.innerHTML = `<a href="${loginPath}" class="btn-login">Login</a>`;
      if (navMobile) navMobile.insertAdjacentHTML("beforeend", `<a href="${loginPath}">Login</a>`);
    }
  }
  setupUserArea();

  // =========================
  // CARREGA GALERIA
  // =========================
  async function carregarGaleria() {
    try {
      if (!URLS || !URLS.galeria) throw new Error("URLS não definido");

      const response = await fetch(URLS.galeria, {
        headers: { Authorization: `token ${ENV.token}` }
      });

      const data = await response.json();
      const json = JSON.parse(atob(data.content));

      const grid = document.getElementById("galeria-grid");
      if (!grid) throw new Error("Elemento #galeria-grid não encontrado");

      grid.innerHTML = "";

      const RAW_URL = `https://raw.githubusercontent.com/${ENV.username}/ELITE/main/assets/images/galeria/`;

      json.fotos.forEach(fotoNome => {
        const div = document.createElement("div");
        div.classList.add("foto");
        div.innerHTML = `<img src="${RAW_URL}${fotoNome}" alt="Corte cliente">`;
        grid.appendChild(div);
      });

    } catch (erro) {
      console.error("Erro ao carregar galeria:", erro);
      const grid = document.getElementById("galeria-grid");
      if (grid) grid.innerHTML = "<p style='color:#aaa'>Não foi possível carregar a galeria</p>";
    }
  }

  await carregarGaleria();

});

// =========================
// ZOOM DAS FOTOS
// =========================
const modal = document.createElement('div');
modal.classList.add('modal');
document.body.appendChild(modal);

modal.addEventListener('click', (e) => {
  if (e.target === modal || e.target === modal.querySelector('img')) {
    modal.classList.remove('active');
    modal.innerHTML = '';
  }
});

// Adiciona click em cada foto depois de carregar a galeria
function setupZoom() {
  document.querySelectorAll('.foto img').forEach(img => {
    img.addEventListener('click', () => {
      const modalImg = document.createElement('img');
      modalImg.src = img.src;
      modal.innerHTML = '';
      modal.appendChild(modalImg);
      modal.classList.add('active');
    });
  });
}

// Chame depois de carregar a galeria
carregarGaleria().then(setupZoom);