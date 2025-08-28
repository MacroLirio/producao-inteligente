// ===========================
// Arquivo: app-auth.js
// ===========================

// Importa funções do Firebase
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { app } from "./firebase-init.js";

const auth = getAuth(app);

// Lista de e-mails que são administradores
// ✅ Aqui já coloquei o seu e-mail como admin
const ADMIN_EMAILS = ["liriobrancocultural@gmail.com"];

// --------------------
// Função de Login
// --------------------
document.getElementById("btn-entrar")?.addEventListener("click", async () => {
  const email = document.getElementById("login-email").value;
  const senha = document.getElementById("login-senha").value;

  try {
    await signInWithEmailAndPassword(auth, email, senha);
    localStorage.setItem("userEmail", email);

    // Redireciona após login
    window.location.href = "dashboard.html";
  } catch (error) {
    alert("Erro ao entrar: " + error.message);
  }
});

// --------------------
// Função de Cadastro
// --------------------
document.getElementById("btn-cadastrar")?.addEventListener("click", async () => {
  const email = document.getElementById("cad-email").value;
  const senha = document.getElementById("cad-senha").value;

  try {
    await createUserWithEmailAndPassword(auth, email, senha);
    alert("Usuário criado com sucesso!");
  } catch (error) {
    alert("Erro ao criar conta: " + error.message);
  }
});

// --------------------
// Função de Logout
// --------------------
document.getElementById("btn-sair")?.addEventListener("click", async () => {
  try {
    await signOut(auth);
    localStorage.removeItem("userEmail");
    window.location.href = "index.html";
  } catch (error) {
    alert("Erro ao sair: " + error.message);
  }
});

// --------------------
// Controle de acesso
// --------------------
function checkAccess() {
  const email = localStorage.getItem("userEmail");

  if (!email) {
    // Se não tiver login → volta pro index
    if (!window.location.href.includes("index.html")) {
      window.location.href = "index.html";
    }
  } else {
    // Se estiver na página Financeiro e não for admin → bloqueia
    if (window.location.href.includes("financeiro.html") && !ADMIN_EMAILS.includes(email)) {
      alert("Acesso negado. Somente administradores podem entrar no Financeiro.");
      window.location.href = "dashboard.html";
    }

    // Ocultar botão/menu Financeiro para usuários comuns
    const menuFinanceiro = document.getElementById("menu-financeiro");
    if (menuFinanceiro && !ADMIN_EMAILS.includes(email)) {
      menuFinanceiro.style.display = "none";
    }
  }
}

// Executa controle de acesso ao carregar
window.addEventListener("DOMContentLoaded", checkAccess);
